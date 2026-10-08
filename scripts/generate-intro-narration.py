"""Prepare the intro's continuous narration; never runs in the browser.

Requires edge-tts==7.2.8 and ffmpeg/ffprobe on PATH. Run from any directory.
Use --reuse to remix the cached take without requesting synthesis again.
"""
import argparse
import asyncio
import hashlib
import json
import math
import pathlib
import subprocess
import unicodedata

ROOT = pathlib.Path(__file__).resolve().parents[1]
CONFIG = ROOT / "scripts/intro-narration.json"
WORK = ROOT / ".local/intro-continuous"
STORYBOARD = ROOT / "apps/web/src/components/intro/intro-storyboard.json"
ASSET = "intro/enturma-pt-br-presenter-v3.mp3"
FPS = 60


def normalized(text):
    return "".join(c for c in unicodedata.normalize("NFKC", text).casefold() if c.isalnum())


def run(*args):
    result = subprocess.run(args, capture_output=True, text=True, encoding="utf-8")
    if result.returncode:
        raise RuntimeError(result.stderr[-3000:])
    return result.stdout


async def synthesize(config, fingerprint):
    import edge_tts

    words = []
    speech = edge_tts.Communicate(
        " ".join(cue["text"] for cue in config["cues"]),
        voice=config["voice"], rate=config["rate"], pitch=config["pitch"],
        boundary="WordBoundary",
    )
    with (WORK / "continuous-original.mp3").open("wb") as audio:
        async for chunk in speech.stream():
            if chunk["type"] == "audio":
                audio.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                words.append({key: chunk[key] for key in ("text", "offset", "duration")})
    (WORK / "words.json").write_text(json.dumps(words, ensure_ascii=False, indent=2), encoding="utf-8")
    (WORK / "source.sha256").write_text(fingerprint, encoding="ascii")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reuse", action="store_true")
    args = parser.parse_args()
    config = json.loads(CONFIG.read_text(encoding="utf-8"))
    fingerprint = hashlib.sha256(json.dumps(config, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()
    WORK.mkdir(parents=True, exist_ok=True)
    if args.reuse:
        if (WORK / "source.sha256").read_text(encoding="ascii") != fingerprint:
            raise ValueError("The cached narration does not match the current script.")
    else:
        asyncio.run(synthesize(config, fingerprint))
    words = json.loads((WORK / "words.json").read_text(encoding="utf-8"))
    cues, cursor, scenes = [], 0, []
    for source in config["cues"]:
        first, spoken = cursor, ""
        expected = normalized(source["text"])
        while cursor < len(words) and len(spoken) < len(expected):
            spoken += normalized(words[cursor]["text"])
            cursor += 1
        if spoken != expected:
            raise ValueError(f"Word boundaries do not match cue {len(cues)}: {source['text']}")
        start = words[first]["offset"] / 10_000_000
        end = (words[cursor - 1]["offset"] + words[cursor - 1]["duration"]) / 10_000_000
        previous_end = (words[first - 1]["offset"] + words[first - 1]["duration"]) / 10_000_000 if first else 0
        # Cut in the natural breath, so the new scene never interrupts the previous phrase.
        frame = round((previous_end + start) * FPS / 2) if first else 0
        cues.append(dict(fromFrame=frame, scene=source["scene"], text=source["text"],
                         voiceStartFrame=round(start * FPS), voiceDuration=round(end - start, 6)))
        if len(cues) == 1 or cues[-2]["scene"] != source["scene"]:
            scenes.append(frame)
    if cursor != len(words):
        raise ValueError("Unmapped words remain at the end of the narration.")
    # Preserve the single performance and its natural breaths. No per-scene padding,
    # silence splicing, time stretching or playback-rate changes.
    frames = math.ceil((end + 0.45) * FPS)
    duration = frames / FPS
    run("ffmpeg", "-hide_banner", "-y", "-i", str(WORK / "continuous-original.mp3"),
        "-af", f"highpass=f=65,loudnorm=I=-17:TP=-1.5:LRA=8,aresample=44100,apad,atrim=duration={duration}",
        "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "96k",
        "-metadata", "title=Enturma — sua faculdade em companhia",
        "-metadata", "artist=Enturma · Francisca Neural", str(ROOT / "apps/web/public" / ASSET))
    measured = float(run("ffprobe", "-v", "error", "-show_entries", "format=duration",
                         "-of", "csv=p=0", str(ROOT / "apps/web/public" / ASSET)))
    if abs(measured - duration) > 0.1:
        raise ValueError("Encoded audio duration differs from the visual timeline.")
    storyboard = dict(durationInFrames=frames, fps=FPS, audioFile=ASSET,
                      sceneFrames=[*scenes, frames], cues=cues)
    STORYBOARD.write_text(json.dumps(storyboard, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"duration": duration, "encodedDuration": measured, "frames": frames,
                      "words": len(words), "scenes": len(scenes), "cues": len(cues)}))


if __name__ == "__main__":
    main()
