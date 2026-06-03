#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPTS="$ROOT/scripts"
CLIPS="$SCRIPTS/tutorial-clips"
NARR="$SCRIPTS/tutorial-narration"
OUT_DIR="$ROOT/public/videos"
OUT="$OUT_DIR/uclass-tutorial.mp4"
TMP="$SCRIPTS/tutorial-build"
export ROOT
rm -rf "$TMP"
mkdir -p "$TMP" "$OUT_DIR"

manifest="$NARR/manifest.json"
if [[ ! -f "$manifest" ]]; then
  echo "Run generate-narration.py first" >&2
  exit 1
fi

python3 << 'PY'
import json, subprocess, os, sys
from pathlib import Path

root = Path(os.environ["ROOT"])
clips = root / "scripts/tutorial-clips"
narr = root / "scripts/tutorial-narration/manifest.json"
tmp = root / "scripts/tutorial-build"
out = root / "public/videos/uclass-tutorial.mp4"

segments = json.loads(narr.read_text())
scene_map = {
    "01-intro": "02-home.webm",
    "02-google": "01-google.webm",
    "03-home-ceo": "02-home.webm",
    "04-signup": "03-signup.webm",
    "05-dean": "04-dean.webm",
    "06-create-class": "05-dashboard.webm",
    "07-notes": "07-notes.webm",
    "08-homework": "08-homework.webm",
    "09-activity": "09-feed.webm",
    "10-outro": "10-outro.webm",
}

parts = []
for i, seg in enumerate(segments):
    sid = seg["id"]
    clip_name = scene_map.get(sid)
    clip = clips / clip_name if clip_name else None
    audio = Path(seg["audio"])
    if not audio.exists():
        print(f"Missing audio {audio}", file=sys.stderr)
        sys.exit(1)
    part = tmp / f"part_{i:02d}.mp4"
    adur = float(seg["duration"]) + 0.35

    if clip and clip.exists():
        subprocess.run([
            "ffmpeg", "-y", "-stream_loop", "-1", "-i", str(clip), "-i", str(audio),
            "-filter_complex",
            f"[0:v]setpts=PTS-STARTPTS,scale=1280:720:force_original_aspect_ratio=decrease,"
            f"pad=1280:720:(ow-iw)/2:(oh-ih)/2,fps=30[v];"
            f"[1:a]apad=pad_dur=0.2,atrim=duration={adur}[a]",
            "-map", "[v]", "-map", "[a]",
            "-t", str(adur),
            "-c:v", "libx264", "-preset", "fast", "-crf", "23",
            "-c:a", "aac", "-b:a", "128k",
            str(part),
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    else:
        subprocess.run([
            "ffmpeg", "-y",
            "-f", "lavfi", "-i", f"color=c=0x1e1b4b:s=1280x720:d={adur}",
            "-i", str(audio),
            "-c:v", "libx264", "-preset", "fast", "-crf", "23",
            "-c:a", "aac", "-b:a", "128k", "-shortest",
            str(part),
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    parts.append(part)
    print(f"built {part.name} ({adur:.1f}s)")

list_file = tmp / "concat.txt"
with list_file.open("w") as f:
    for p in parts:
        f.write(f"file '{p}'\n")

subprocess.run([
    "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(list_file),
    "-c:v", "libx264", "-preset", "fast", "-crf", "23",
    "-c:a", "aac", "-b:a", "128k",
    str(out),
], check=True, stdout=subprocess.DEVNULL)
print(f"Wrote {out} ({out.stat().st_size // 1024} KB)")
PY

echo "Done: $OUT"
