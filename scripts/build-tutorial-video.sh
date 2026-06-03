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

# High-quality 1080p output (override via env if needed)
export TUTORIAL_WIDTH="${TUTORIAL_WIDTH:-1920}"
export TUTORIAL_HEIGHT="${TUTORIAL_HEIGHT:-1080}"
export TUTORIAL_CRF="${TUTORIAL_CRF:-18}"
export TUTORIAL_PRESET="${TUTORIAL_PRESET:-medium}"
export TUTORIAL_AUDIO_BITRATE="${TUTORIAL_AUDIO_BITRATE:-192k}"
export TUTORIAL_FPS="${TUTORIAL_FPS:-30}"

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

w = int(os.environ["TUTORIAL_WIDTH"])
h = int(os.environ["TUTORIAL_HEIGHT"])
crf = os.environ["TUTORIAL_CRF"]
preset = os.environ["TUTORIAL_PRESET"]
abit = os.environ["TUTORIAL_AUDIO_BITRATE"]
fps = int(os.environ["TUTORIAL_FPS"])

segments = json.loads(narr.read_text())
scene_map = {
    "01-intro": "02-home.webm",
    "02-google": "01-google.webm",
    "03-home-ceo": "02-home.webm",
    "04-signup": "03-signup.webm",
    "04b-guest": "11-guest.webm",
    "05-dean": "04-dean.webm",
    "06-create-class": "05-dashboard.webm",
    "07-notes": "07-notes.webm",
    "08-homework": "08-homework.webm",
    "09-activity": "09-feed.webm",
    "10-outro": "10-outro.webm",
}

venc = [
    "-c:v", "libx264", "-preset", preset, "-crf", crf,
    "-pix_fmt", "yuv420p", "-movflags", "+faststart",
]
aenc = ["-c:a", "aac", "-b:a", abit]

scale_pad = (
    f"scale={w}:{h}:force_original_aspect_ratio=decrease,"
    f"pad={w}:{h}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps={fps}"
)

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
            f"[0:v]setpts=PTS-STARTPTS,{scale_pad}[v];"
            f"[1:a]apad=pad_dur=0.2,atrim=duration={adur}[a]",
            "-map", "[v]", "-map", "[a]",
            "-t", str(adur),
            *venc, *aenc,
            str(part),
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    else:
        subprocess.run([
            "ffmpeg", "-y",
            "-f", "lavfi", "-i", f"color=c=0x1e1b4b:s={w}x{h}:d={adur}",
            "-i", str(audio),
            *venc, *aenc, "-shortest",
            str(part),
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    parts.append(part)
    print(f"built {part.name} ({adur:.1f}s) @ {w}x{h} crf={crf}")

list_file = tmp / "concat.txt"
with list_file.open("w") as f:
    for p in parts:
        f.write(f"file '{p}'\n")

subprocess.run([
    "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(list_file),
    *venc, *aenc,
    str(out),
], check=True, stdout=subprocess.DEVNULL)
print(f"Wrote {out} ({out.stat().st_size // 1024} KB, {w}x{h})")
PY

echo "Done: $OUT"
