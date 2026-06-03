#!/usr/bin/env python3
"""Generate TTS narration segments for the UClass tutorial video."""
import json
import os
import subprocess
from pathlib import Path

try:
    from gtts import gTTS
except ImportError:
    raise SystemExit("Install gTTS: pip install gTTS")

OUT = Path(__file__).resolve().parent / "tutorial-narration"
OUT.mkdir(parents=True, exist_ok=True)

SEGMENTS = [
    {
        "id": "01-intro",
        "text": (
            "Welcome to UClass — the platform that connects teachers, students, "
            "parents, and guests for better learning."
        ),
    },
    {
        "id": "02-google",
        "text": (
            "To find UClass, open Google on your phone or computer and search for "
            "UClass Student Umunsi. You can also visit student dot umunsi dot com directly."
        ),
    },
    {
        "id": "03-home-ceo",
        "text": (
            "The home page shows how UClass works for Rwanda. "
            "Scroll to the role cards — Umwarimu teacher, Umuyobozi head teacher, "
            "Umunyeshuri student, and Guest for quiz share links."
        ),
    },
    {
        "id": "04-signup",
        "text": (
            "Tap Sign up on your role card. Teachers and head teachers create a school email login. "
            "Students pick their school and join with a class code. "
            "Guests use a username at guest dot umunsi dot com after opening a teacher's quiz link."
        ),
    },
    {
        "id": "04b-guest",
        "text": (
            "On Guest home, every shared quiz is listed with Take Quiz buttons — "
            "the same as inside the class — so guests can start immediately without extra steps."
        ),
    },
    {
        "id": "05-dean",
        "text": (
            "Meet Dean — your AI support assistant. "
            "Dean lives on the home page and inside every class. "
            "Ask Dean how to sign up, join a class, post homework, or use any feature."
        ),
    },
    {
        "id": "06-create-class",
        "text": (
            "Teachers start from the dashboard. Tap Create Class, enter a name and subject, "
            "then share the class code so students can join instantly."
        ),
    },
    {
        "id": "07-notes",
        "text": (
            "Inside your class, open the Notes tab to upload lesson files. "
            "Students download materials anytime for revision at school or at home."
        ),
    },
    {
        "id": "08-homework",
        "text": (
            "The Homework tab lets teachers post assignments with due dates. "
            "Students submit work online and teachers grade submissions in one place."
        ),
    },
    {
        "id": "09-activity",
        "text": (
            "Use the Feed tab for classroom activity — daily updates, exercises, "
            "photos, and announcements that keep everyone engaged."
        ),
    },
    {
        "id": "10-outro",
        "text": (
            "Parents and guests have tailored dashboards too. "
            "Start free today — create your account and transform learning with UClass."
        ),
    },
]


def synth_gtts(text: str, mp3_path: Path) -> None:
    gTTS(text=text, lang="en", tld="com").save(str(mp3_path))


def synth_espeak(text: str, wav_path: Path) -> None:
    subprocess.run(
        ["espeak-ng", "-v", "en-us", "-s", "150", "-w", str(wav_path), text],
        check=True,
    )


def duration_seconds(path: Path) -> float:
    out = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        text=True,
    )
    return float(out.strip())


def main() -> None:
    manifest = []
    for seg in SEGMENTS:
        mp3 = OUT / f"{seg['id']}.mp3"
        wav = OUT / f"{seg['id']}.wav"
        try:
            synth_gtts(seg["text"], mp3)
            audio = mp3
        except Exception as exc:
            print(f"gTTS failed for {seg['id']}: {exc}; using espeak-ng")
            synth_espeak(seg["text"], wav)
            audio = wav

        dur = duration_seconds(audio)
        manifest.append({**seg, "audio": str(audio), "duration": dur})
        print(f"ok {seg['id']} ({dur:.1f}s)")

    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2))
    print(f"Wrote {OUT / 'manifest.json'}")


if __name__ == "__main__":
    main()
