# Heartbeat and Code

English pop ballad / synth-pop duet about the future of humans and AI.
Key G major (final chorus up to A major), 95 BPM, 4/4, about 2:45.
Structure: Intro, Verse 1 (male/human), Pre-Chorus, Chorus, Verse 2 (female/AI), Pre-Chorus, Chorus, Bridge, Final Chorus (key change), Outro.

This is a synthesised backing track plus guide melody. There are no sung vocals.

## Files
- `build_song.py` - the whole song (melody, chords, arrangement) and the synth/renderer.
- `heartbeat_and_code_instrumental.mp3` - backing track, no vocals.
- `heartbeat_and_code_guide.mp3` - same track with a synth guide melody.
- `heartbeat_and_code.mid` - guide melody (lyrics attached to notes), piano, pad, strings, bass, drums.
- `heartbeat_and_code_lyrics_chords.md` - lyrics with chords per line and section timestamps.

## Regenerate
    pip install numpy scipy mido
    python build_song.py        # writes ./out/*.wav, .mid, .md (needs ffmpeg only for mp3)
    ffmpeg -i out/heartbeat_and_code_instrumental.wav -b:a 192k out/heartbeat_and_code_instrumental.mp3

Edit `KEY_SHIFT` (C-relative composition shifted to G), `BPM`, `LEVELS` (per-section mix) or the melody/chord lists at the top of the script.

## ElevenLabs (sung version, not yet generated)
Model `eleven_music_v2_5`, 180 s, custom lyrics (same as the chart). Prompt:
"Cinematic pop ballad with synth-pop elements, warm and hopeful, around 95 BPM. English male and female duet: a warm, earnest male lead voice and a clear, airy female voice with a subtle electronic sheen. Opens with soft piano and warm synth pads, a light electronic beat enters in the verses, lush strings join and swell through the bridge, building to a powerful final chorus with a key change and both voices harmonizing, then fades out gently on solo piano. Crisp modern production."
Estimate: about 10,800 credits (about 1.08 USD) for 4 variations.
