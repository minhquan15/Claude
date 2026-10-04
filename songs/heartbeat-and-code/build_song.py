#!/usr/bin/env python3
"""Heartbeat and Code - synthesise the instrumental, a guide-melody mix and a MIDI file.

Everything is composed in C-relative terms and shifted: KEY_SHIFT=-5 puts the song in
G major; the final chorus and outro add +2 (A major).  One composition (event lists)
feeds both the audio renderer and the MIDI writer.
"""
import os, re, sys, time
import numpy as np
from scipy import signal as sg
from scipy.io import wavfile
import mido

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")
os.makedirs(OUT, exist_ok=True)

SR = 44100
BPM = 95
SPB = 60.0 / BPM            # seconds per beat
KEY_SHIFT = -5              # C -> G
rng = np.random.default_rng(7)

# --------------------------------------------------------------------------- melody
# token = NOTE:slots:syllable   (slot = one eighth note, a trailing '-' = mid-word)
# R:n = rest.  Every lyric line is 16 slots = 2 bars.
V1 = [
    "R:1 E4:1:Woke E4:1:up A4:1:to A4:1:a G4:1:ci- E4:1:ty E4:1:glow- F4:1:ing F4:1:in G4:1:a A4:2:brand G4:1:new G4:2:hue",
    "E4:1:Ev- E4:1:ery G4:2:street G4:1:al- A4:1:read- G4:1:y E4:1:knows D4:1:where E4:1:I'm G4:2:head- E4:1:ed D4:3:to",
    "E4:1:A A4:1:gen- A4:1:tle C5:2:voice B4:1:asks A4:1:me R:1 F4:1:Hey A4:1:are A4:1:you G4:1:do- F4:1:ing G4:1:al- A4:2:right",
    "E4:1:Not E4:1:a G4:1:hu- E4:2:man D4:1:but E4:1:it G4:1:feels G4:1:like B4:2:warmth A4:1:in- G4:4:side",
]
PRE1 = [
    "A4:1:We A4:1:were A4:1:a- C5:1:fraid C5:1:the C5:1:day A4:1:would G4:1:come B4:1:when B4:1:we'd A4:1:be G4:1:re- B4:4:placed",
    "A4:1:But A4:1:all C5:1:we C5:1:real- A4:1:ly C5:1:need- C5:1:ed A4:1:was B4:1:to B4:1:learn D5:1:to D5:1:share C5:1:the B4:3:space",
]
CHORUS = [
    "C5:1:Heart- C5:1:beat D5:1:and E5:3:code R:2 E5:1:to- D5:1:geth- C5:1:er C5:1:we B4:1:write D5:1:to- C5:1:mor- B4:1:row",
    "A4:1:One C5:1:brings C5:1:the D5:1:know- C5:2:ledge R:2 A4:1:one C5:1:brings C5:1:the E5:1:dreams D5:1:we C5:1:fol- A4:2:low",
    "G4:1:No G4:1:one C5:1:a- E5:2:bove G4:1:no G4:1:one C5:1:be- D5:1:low D5:1:side B4:1:by D5:1:side E5:1:down D5:1:this B4:2:road",
    "A4:1:To- C5:1:mor- C5:1:row E5:2:shines D5:1:bright- C5:1:er R:1 D5:1:when D5:1:no C5:1:one E5:1:walks D5:1:a- C5:3:lone",
]
V2 = [
    "E4:1:I E4:1:was A4:2:born A4:1:from G4:1:num- E4:1:bers E4:1:and F4:1:a F4:1:thou- G4:1:sand A4:2:glow- G4:1:ing G4:2:lights",
    "E4:1:Learned E4:1:your G4:2:laugh- G4:1:ter A4:1:and G4:1:your E4:1:sor- D4:1:row D4:1:through E4:1:the G4:1:words E4:1:you D4:3:write",
    "E4:1:I A4:1:don't A4:1:have A4:1:a C5:2:heart- B4:1:beat R:1 F4:1:but A4:1:I've A4:1:learned G4:1:to F4:1:tru- G4:1:ly A4:2:hear",
    "E4:1:So E4:1:the G4:1:things E4:1:that G4:2:mat- E4:1:ter D4:1:nev- E4:1:er G4:1:dis- A4:1:ap- G4:5:pear",
]
PRE2 = [
    "A4:1:You C5:2:showed C5:1:me C5:1:what A4:1:it C5:2:means B4:1:to D5:3:care R:4",
    "A4:1:I'll A4:1:help C5:1:you C5:2:reach A4:1:the C5:1:pla- D5:1:ces D5:1:you D5:1:have B4:1:nev- D5:1:er D5:4:dared",
]
BRIDGE = [
    "E4:1:If E4:1:one A4:2:day A4:1:the G4:1:world E4:2:runs F4:1:fast- A4:1:er A4:1:than G4:1:our A4:4:dreams",
    "E4:1:Who G4:1:will G4:2:guard G4:1:our A4:1:con- C5:2:science D5:1:when B4:1:the B4:1:lines A4:1:blur B4:1:in D5:1:be- B4:2:tween",
    "E4:1:The A4:2:an- A4:1:swer's C5:1:al- C5:1:ways B4:2:here A4:1:held A4:1:in C5:1:hu- C5:1:man C5:4:hands",
    "G4:1:Tech- G4:1:nol- B4:1:o- D5:1:gy's D5:1:the C5:1:lan- B4:2:tern D5:1:but D5:1:we E5:1:choose E5:1:where D5:1:we E5:3:stand",
]
OUTRO = [
    "E5:3:Heart- D5:3:beat R:2 D5:2:and C5:4:code R:2",
    "G4:1:To- A4:1:geth- C5:4:er R:2 C5:1:we D5:1:write C5:1:to- A4:1:mor- C5:4:row",
]

CHORDS = {                         # C-relative: (pitch class of root, intervals)
    "C": (0, (0, 4, 7)), "G": (7, (0, 4, 7)), "Am": (9, (0, 3, 7)),
    "F": (5, (0, 4, 7)), "A": (9, (0, 4, 7)),
}
CH_PROG = ["C", "G", "Am", "F", "C", "G", "F", "C"]
VERSE_PROG = ["Am", "F", "C", "G"] * 2

# name, key, bars, chords per bar, melody lines, extra shift, singer
SECTIONS = [
    ("Intro",         "intro",   4, ["Am", "F", "C", "G"], None, 0, "-"),
    ("Verse 1",       "verse1",  8, VERSE_PROG, V1, 0, "male (human)"),
    ("Pre-Chorus 1",  "pre1",    4, ["F", "G", "F", "G"], PRE1, 0, "male (human)"),
    ("Chorus 1",      "chorus1", 8, CH_PROG, CHORUS, 0, "duet"),
    ("Verse 2",       "verse2",  8, VERSE_PROG, V2, 0, "female (AI)"),
    ("Pre-Chorus 2",  "pre2",    4, ["F", "G", "F", "G"], PRE2, 0, "female (AI)"),
    ("Chorus 2",      "chorus2", 8, CH_PROG, CHORUS, 0, "duet"),
    ("Bridge",        "bridge",  8, ["Am", "F", "C", "G", "Am", "F", "G", [(0, "G"), (3, "A")]], BRIDGE, 0, "duet, building"),
    ("Final Chorus",  "final",   8, CH_PROG, CHORUS, 2, "duet, key change up"),
    ("Outro",         "outro",   4, ["F", "C", "F", "C"], OUTRO, 2, "duet, soft"),
]

# per-section mix multipliers
LEVELS = {
    "intro":   dict(piano=1.0, pad=0.55, strings=0.0, bass=0.0, drums=0.0),
    "verse1":  dict(piano=0.85, pad=0.40, strings=0.0, bass=0.80, drums=0.60),
    "pre1":    dict(piano=0.90, pad=0.50, strings=0.0, bass=0.90, drums=0.75),
    "chorus1": dict(piano=1.00, pad=0.60, strings=0.0, bass=1.00, drums=1.00),
    "verse2":  dict(piano=0.85, pad=0.45, strings=0.30, bass=0.80, drums=0.65),
    "pre2":    dict(piano=0.90, pad=0.50, strings=0.45, bass=0.90, drums=0.80),
    "chorus2": dict(piano=1.00, pad=0.65, strings=0.55, bass=1.00, drums=1.00),
    "bridge":  dict(piano=0.90, pad=0.55, strings=0.90, bass=0.90, drums=0.90),
    "final":   dict(piano=1.00, pad=0.70, strings=1.00, bass=1.00, drums=1.10),
    "outro":   dict(piano=0.80, pad=0.55, strings=0.55, bass=0.0, drums=0.0),
}

NOTE_PC = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}
PC_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def note_midi(name):
    m = re.fullmatch(r"([A-G])([#b]?)(\d)", name)
    pc = NOTE_PC[m.group(1)] + {"#": 1, "b": -1, "": 0}[m.group(2)]
    return 12 * (int(m.group(3)) + 1) + pc


def parse_line(s):
    out, slot = [], 0
    for tok in s.split():
        p = tok.split(":", 2)
        if p[0] == "R":
            slot += int(p[1])
            continue
        out.append((slot, int(p[1]), p[0], p[2]))
        slot += int(p[1])
    assert slot == 16, (slot, s)
    return out


def segments(ch):
    if isinstance(ch, str):
        return [(0, 4, ch)]
    segs = []
    for i, (b, c) in enumerate(ch):
        e = ch[i + 1][0] if i + 1 < len(ch) else 4
        segs.append((b, e, c))
    return segs


def chord_at(segs, beat):
    for s, e, c in segs:
        if s <= beat < e:
            return c
    return segs[-1][2]


def root_and_iv(chord, octave, sh):
    pc, iv = CHORDS[chord]
    return 12 * (octave + 1) + pc + KEY_SHIFT + sh, iv


def chord_name(chord, sh):
    pc, iv = CHORDS[chord]
    return PC_NAMES[(pc + KEY_SHIFT + sh) % 12] + ("m" if iv[1] == 3 else "")


# --------------------------------------------------------------------------- compose
def compose():
    ev = {k: [] for k in ("lead", "piano", "pad", "strings", "bass", "drums")}
    marks, bar0 = [], 0
    for name, key, nbars, chords, melody, sh, singer in SECTIONS:
        lv = LEVELS[key]
        marks.append((bar0 * 4, name, key, nbars, sh, singer))
        for b in range(nbars):
            t0 = (bar0 + b) * 4.0
            segs = segments(chords[b])

            # ---- piano
            if lv["piano"] > 0:
                def voicing(c):
                    r, iv = root_and_iv(c, 3, sh)
                    return [r, r + iv[2], r + 12 + iv[1], r + 12, r + 12 + iv[2]]
                if key in ("intro", "verse1", "verse2"):
                    pat = [0, 1, 2, 3, 4, 3, 2, 1]
                    for s in range(8):
                        v = voicing(chord_at(segs, s * 0.5))
                        vel = (78 if s == 0 else 58 if s % 2 == 0 else 50) * lv["piano"]
                        ev["piano"].append((t0 + s * 0.5, 1.2, v[pat[s]], int(vel)))
                elif key == "outro":
                    v = voicing(chord_at(segs, 0))
                    for i, n in enumerate([v[0], v[1], v[2], v[4]]):
                        ev["piano"].append((t0 + i * 0.18, 3.6, n, int(62 * lv["piano"])))
                elif key == "bridge":
                    ramp = 0.65 + 0.35 * (b / 7.0)
                    for q in range(4):
                        v = voicing(chord_at(segs, q))
                        for n in v[1:]:
                            ev["piano"].append((t0 + q, 0.95, n, int((82 if q == 0 else 68) * ramp * lv["piano"])))
                        ev["piano"].append((t0 + q, 0.95, v[0], int(75 * ramp * lv["piano"])))
                else:  # pre / chorus / final : syncopated block chords
                    for (st, du) in [(0, 1.5), (1.5, 0.5), (2, 1.5), (3.5, 0.5)]:
                        v = voicing(chord_at(segs, st))
                        vel = (84 if st == 0 else 70) * lv["piano"]
                        for n in v:
                            ev["piano"].append((t0 + st, du * 0.95, n, int(vel)))

            # ---- pad & strings (per chord segment)
            for (s0, s1, c) in segs:
                r, iv = root_and_iv(c, 3, sh)
                if lv["pad"] > 0:
                    ev["pad"].append((t0 + s0, s1 - s0, [r, r + iv[2], r + 12 + iv[1]], int(70 * lv["pad"])))
                if lv["strings"] > 0:
                    notes = [r, r + iv[2], r + 12 + iv[1], r + 12]
                    if key == "final":
                        notes.append(r + 24)
                    ev["strings"].append((t0 + s0, s1 - s0, notes, int(75 * lv["strings"])))

            # ---- bass
            if lv["bass"] > 0:
                def broot(c):
                    pc, _ = CHORDS[c]
                    return 36 + pc + KEY_SHIFT + sh
                if key in ("verse1", "verse2"):
                    hits = [(0, 2.0, 0), (2.5, 1.5, 0)]
                elif key in ("pre1", "pre2"):
                    hits = [(q, 0.9, 0) for q in range(4)]
                elif key == "bridge":
                    hits = [(s, e - s, 0) for (s, e, _) in segs]
                else:
                    hits = [(0, 1.5, 0), (1.5, 0.5, 0), (2, 1.5, 0), (3.5, 0.5, 12)]
                for (st, du, oc) in hits:
                    ev["bass"].append((t0 + st, du * 0.97, broot(chord_at(segs, st)) + oc,
                                       int((96 if st == 0 else 82) * lv["bass"])))

            # ---- drums
            if lv["drums"] > 0:
                for (bt, nm, vel) in drum_bar(key, b, nbars):
                    ev["drums"].append((t0 + bt, nm, max(1, min(127, int(vel * lv["drums"])))))

        # ---- melody / lyrics
        if melody:
            for li, line in enumerate(melody):
                lt = (bar0 + 2 * li) * 4.0
                toks = parse_line(line)
                for (slot, dur, nm, syl) in toks:
                    ev["lead"].append((lt + slot * 0.5, dur * 0.5, note_midi(nm) + KEY_SHIFT + sh, 88, syl))
        bar0 += nbars
    # one-off effects
    final_start = [m[0] for m in marks if m[2] == "final"][0]
    ev["drums"].append((final_start, "boom", 110))
    return ev, marks, bar0


def drum_bar(key, b, nb):
    d = []
    if key in ("verse1", "verse2"):
        d += [(0, "kick", 92), (2.5, "kick", 78), (1, "rim", 70), (3, "rim", 74)]
        if key == "verse2" or b >= 4:
            d += [(x * 0.5, "hat", 38 + (10 if x % 2 else 0)) for x in range(8)]
    elif key in ("pre1", "pre2"):
        d += [(i, "kick", 78 + 3 * i) for i in range(4)]
        d += [(x * 0.5, "hat", 44 + (8 if x % 2 else 0)) for x in range(8)]
        if b == 2:
            d += [(3, "clap", 72)]
        if b == 3:
            d += [(0.25 * i, "snare", int(45 + 75 * i / 15)) for i in range(16)]
    elif key in ("chorus1", "chorus2", "final"):
        d += [(0, "kick", 105), (1.5, "kick", 90), (2.5, "kick", 98),
              (1, "snare", 100), (1, "clap", 72), (3, "snare", 104), (3, "clap", 74)]
        step = 0.25 if key == "final" else 0.5
        for i in range(int(4 / step)):
            t = i * step
            vel = 58 if abs(t % 1 - 0.5) < 1e-6 else (42 if t % 1 == 0 else 30)
            d.append((t, "hat", vel))
        if b % 4 == 0:
            d.append((0, "crash", 108 if b == 0 else 80))
        if b == nb - 1 and key != "final":
            d += [(3.5, "snare", 85), (3.75, "snare", 100)]
    elif key == "bridge":
        if b < 4:
            d += [(0, "kick", 85), (2, "kick", 80), (1, "rim", 62), (3, "rim", 66)]
        elif b < 6:
            d += [(i, "kick", 92) for i in range(4)] + [(1, "snare", 92), (3, "snare", 96)]
            d += [(x * 0.5, "hat", 48 + (8 if x % 2 else 0)) for x in range(8)]
        elif b == 6:
            d += [(i, "kick", 96) for i in range(4)]
            d += [(x * 0.5, "snare", int(60 + 6 * x)) for x in range(8)]
        else:
            d += [(0, "kick", 100)]
            d += [(0.25 * i, "snare", int(70 + 57 * i / 15)) for i in range(16)]
    return d


# --------------------------------------------------------------------------- synth
def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)


def sos_filter(x, kind, freq, order=2):
    sos = sg.butter(order, freq, btype=kind, fs=SR, output="sos")
    return sg.sosfilt(sos, x)


def bandpass(x, lo, hi):
    return sg.sosfilt(sg.butter(2, [lo, hi], btype="band", fs=SR, output="sos"), x)


def piano(f, dur, vel):
    n = int((dur + 1.6) * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for k in range(1, 9):
        fk = f * k * np.sqrt(1 + 0.00025 * k * k)
        if fk > 9000:
            break
        amp = (1.0 / k ** 1.15) * (1.0 if k % 2 else 0.65)
        tau = (1.9 / (1 + 0.55 * (k - 1))) * (1.5 if f < 200 else 1.0)
        out += amp * np.exp(-t / tau) * np.sin(2 * np.pi * fk * t + 0.4 * k)
    out *= 1 - np.exp(-t / 0.004)
    rel = np.ones(n)
    i0 = int(dur * SR)
    rel[i0:] = np.exp(-(t[i0:] - dur) / 0.35)
    out *= rel
    out += rng.standard_normal(n) * np.exp(-t / 0.006) * 0.02
    return out * (vel / 127.0) ** 1.2


def pad_like(freqs, dur, vel, attack, release, harmonics, detunes, vib=0.0, seed_phase=0.0):
    n = int((dur + release) * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for f in freqs:
        for cents in detunes:
            fd = f * 2 ** (cents / 1200.0)
            phase = 2 * np.pi * fd * t
            if vib:
                onset = np.clip((t - 0.4) / 0.8, 0, 1)
                phase = phase + onset * (fd * vib / 5.3) * np.sin(2 * np.pi * 5.3 * t + seed_phase)
            for k in range(1, harmonics + 1):
                if fd * k > 7000:
                    break
                out += np.sin(k * phase + 0.7 * k) / k ** 1.5
    env = np.minimum(t / attack, 1.0) ** 1.5
    i0 = int(dur * SR)
    env[i0:] *= np.exp(-(t[i0:] - dur) / (release / 3.0))
    out *= env * (1 + 0.07 * np.sin(2 * np.pi * 0.23 * t))
    out /= max(1, len(freqs) * len(detunes))
    return out * (vel / 127.0)


def bass(f, dur, vel):
    n = int((dur + 0.15) * SR)
    t = np.arange(n) / SR
    out = np.sin(2 * np.pi * f * t) + 0.45 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.35) \
        + 0.2 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t / 0.15)
    env = np.minimum(t / 0.008, 1.0)
    i0 = int(dur * SR)
    env[i0:] *= np.exp(-(t[i0:] - dur) / 0.04)
    out = np.tanh(1.4 * out * env)
    out = sos_filter(out, "low", 700)
    return out * (vel / 127.0)


def lead(f, dur, vel):
    n = int((dur + 0.25) * SR)
    t = np.arange(n) / SR
    onset = np.clip((t - 0.18) / 0.35, 0, 1)
    phase = 2 * np.pi * f * t + onset * (f * 0.006 / 5.5) * np.sin(2 * np.pi * 5.5 * t)
    out = np.zeros(n)
    for k, a in zip(range(1, 8), (1.0, 0.55, 0.35, 0.22, 0.12, 0.08, 0.05)):
        out += a * np.sin(k * phase)
    env = np.minimum(t / 0.03, 1.0)
    i0 = int(dur * SR)
    env[i0:] *= np.exp(-(t[i0:] - dur) / 0.07)
    return out * env * (vel / 127.0)


# drums -------------------------------------------------------------------------
def build_drums():
    D = {}
    t = np.arange(int(0.5 * SR)) / SR
    f = 46 + 100 * np.exp(-t / 0.03)
    k = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.17)
    k += rng.standard_normal(len(t)) * np.exp(-t / 0.003) * 0.22
    D["kick"] = np.tanh(1.7 * k) * 0.95

    t = np.arange(int(0.4 * SR)) / SR
    nz = bandpass(rng.standard_normal(len(t)), 1400, 9500) * np.exp(-t / 0.085)
    tone = np.sin(2 * np.pi * 185 * t) * np.exp(-t / 0.05) * 0.6 + np.sin(2 * np.pi * 330 * t) * np.exp(-t / 0.03) * 0.3
    D["snare"] = (0.8 * nz + tone) * 0.85

    t = np.arange(int(0.3 * SR)) / SR
    c = np.zeros(len(t))
    for off in (0, 0.011, 0.022):
        i = int(off * SR)
        seg = bandpass(rng.standard_normal(len(t) - i), 900, 3200) * np.exp(-np.arange(len(t) - i) / SR / 0.012)
        c[i:] += seg
    c += bandpass(rng.standard_normal(len(t)), 900, 3200) * np.exp(-t / 0.1) * 0.6
    D["clap"] = c * 0.9

    t = np.arange(int(0.06 * SR)) / SR
    D["rim"] = (np.sin(2 * np.pi * 1750 * t) * np.exp(-t / 0.006) * 0.7
                + bandpass(rng.standard_normal(len(t)), 2500, 8000) * np.exp(-t / 0.01) * 0.5)

    t = np.arange(int(0.12 * SR)) / SR
    D["hat"] = sos_filter(rng.standard_normal(len(t)), "high", 7000) * np.exp(-t / 0.03) * 0.5

    t = np.arange(int(3.2 * SR)) / SR
    cr = sos_filter(rng.standard_normal(len(t)), "high", 4500) * np.exp(-t / 0.9)
    cr += bandpass(rng.standard_normal(len(t)), 6000, 12000) * np.exp(-t / 0.5) * 0.4
    D["crash"] = cr * 0.55

    t = np.arange(int(2.2 * SR)) / SR
    bm = np.sin(2 * np.pi * np.cumsum(38 + 70 * np.exp(-t / 0.25)) / SR) * np.exp(-t / 0.9)
    D["boom"] = bm * 0.9
    return D


def reverb_ir(seed, seconds=2.6, tau=0.45):
    r = np.random.default_rng(seed)
    n = int(seconds * SR)
    t = np.arange(n) / SR
    ir = r.standard_normal(n) * np.exp(-t / tau)
    ir = sos_filter(ir, "low", 5200)
    ir[: int(0.018 * SR)] *= 0.0           # pre-delay
    ir[:int(0.03 * SR)] += 0
    return ir / np.sqrt(np.sum(ir ** 2))


# --------------------------------------------------------------------------- render
def render(ev, total_beats):
    N = int((total_beats * SPB + 7.0) * SR)
    dry = np.zeros((N, 2), np.float32)       # backing dry
    snd = np.zeros(N, np.float32)            # backing reverb send
    ldry = np.zeros((N, 2), np.float32)      # guide lead dry
    lsnd = np.zeros(N, np.float32)
    stems = {}

    def place(buf, t_sec, x, gain=1.0, pan=0.0):
        i = int(round(t_sec * SR))
        n = len(x)
        if i + n > N:
            x = x[: N - i]
            n = len(x)
        gl = np.cos((pan + 1) * np.pi / 4) * gain
        gr = np.sin((pan + 1) * np.pi / 4) * gain
        buf[i:i + n, 0] += x * gl
        buf[i:i + n, 1] += x * gr

    def place_mono(buf, t_sec, x, gain):
        i = int(round(t_sec * SR))
        n = min(len(x), N - i)
        buf[i:i + n] += x[:n] * gain

    t_start = time.time()
    # ---- piano
    for (tb, du, m, vel) in ev["piano"]:
        x = piano(mtof(m), du * SPB, vel)
        pan = -0.35 + 0.7 * np.clip((m - 40) / 40.0, 0, 1)
        place(dry, tb * SPB, x, 0.30, pan)
        place_mono(snd, tb * SPB, x, 0.22)
    print("  piano done", round(time.time() - t_start, 1), "s", flush=True)

    # ---- pad (stereo from two detune sets)
    for (tb, du, notes, vel) in ev["pad"]:
        fr = [mtof(m) for m in notes]
        xl = pad_like(fr, du * SPB, vel, 0.7, 1.4, 7, (-8, -1, 5))
        xr = pad_like(fr, du * SPB, vel, 0.7, 1.4, 7, (-5, 1, 8))
        xl = sos_filter(xl, "low", 2200)
        xr = sos_filter(xr, "low", 2200)
        i = int(round(tb * SPB * SR))
        n = min(len(xl), N - i)
        dry[i:i + n, 0] += xl[:n] * 0.16
        dry[i:i + n, 1] += xr[:n] * 0.16
        snd[i:i + n] += (xl[:n] + xr[:n]) * 0.10
    print("  pad done", round(time.time() - t_start, 1), "s", flush=True)

    # ---- strings
    for (tb, du, notes, vel) in ev["strings"]:
        for j, m in enumerate(notes):
            x = pad_like([mtof(m)], du * SPB, vel, 0.9, 1.5, 9, (-6, 6), vib=0.0045, seed_phase=j * 1.3)
            x = sos_filter(x, "low", 4200)
            pan = -0.6 + 1.2 * j / max(1, len(notes) - 1)
            place(dry, tb * SPB, x, 0.22, pan)
            place_mono(snd, tb * SPB, x, 0.14)
    print("  strings done", round(time.time() - t_start, 1), "s", flush=True)

    # ---- bass
    for (tb, du, m, vel) in ev["bass"]:
        x = bass(mtof(m), du * SPB, vel)
        place(dry, tb * SPB, x, 0.55, 0.0)
    # ---- drums
    D = build_drums()
    send_amt = {"snare": 0.25, "clap": 0.35, "rim": 0.2, "crash": 0.2, "boom": 0.0, "kick": 0.0, "hat": 0.04}
    pan_of = {"hat": 0.25, "rim": -0.15, "clap": 0.1, "crash": -0.2}
    gain_of = {"kick": 0.62, "snare": 0.34, "clap": 0.22, "rim": 0.25, "hat": 0.2, "crash": 0.34, "boom": 0.55}
    for (tb, nm, vel) in ev["drums"]:
        x = D[nm] * (vel / 127.0) ** 1.1
        place(dry, tb * SPB, x, gain_of[nm], pan_of.get(nm, 0.0))
        if send_amt[nm]:
            place_mono(snd, tb * SPB, x, send_amt[nm] * gain_of[nm])
    # ---- riser into the final chorus (last 2 bars of bridge)
    bridge_end = [m for m in ev["_marks"] if m[2] == "final"][0][0]
    rl = int(2 * 4 * SPB * SR)
    tt = np.arange(rl) / SR
    nz = sos_filter(rng.standard_normal(rl), "high", 2500) * (np.linspace(0, 1, rl) ** 2.2)
    sw = np.sin(2 * np.pi * np.cumsum(180 + 1500 * (np.linspace(0, 1, rl) ** 2)) / SR) * (np.linspace(0, 1, rl) ** 3)
    riser = 0.45 * nz + 0.18 * sw
    place(dry, (bridge_end - 8) * SPB, riser, 0.35, 0.0)
    place_mono(snd, (bridge_end - 8) * SPB, riser, 0.1)
    print("  bass/drums/riser done", round(time.time() - t_start, 1), "s", flush=True)

    # ---- guide lead
    for (tb, du, m, vel, syl) in ev["lead"]:
        x = lead(mtof(m), du * SPB, vel)
        place(ldry, tb * SPB, x, 0.30, 0.0)
        place_mono(lsnd, tb * SPB, x, 0.18)
    print("  lead done", round(time.time() - t_start, 1), "s", flush=True)

    # ---- reverb
    irL, irR = reverb_ir(11), reverb_ir(23)

    def wet(send):
        l = sg.fftconvolve(send, irL)[:N].astype(np.float32)
        r = sg.fftconvolve(send, irR)[:N].astype(np.float32)
        return np.stack([l, r], axis=1)

    base = dry + 0.75 * wet(snd)
    lead_mix = ldry + 0.6 * wet(lsnd)
    print("  reverb done", round(time.time() - t_start, 1), "s", flush=True)
    return base, lead_mix


def master(x, target_peak=0.89, drive=1.7):
    x = x.astype(np.float64)
    # remove sub-rumble
    x = sg.sosfilt(sg.butter(2, 28, btype="high", fs=SR, output="sos"), x, axis=0)
    x = x / np.max(np.abs(x))
    x = np.tanh(drive * x) / np.tanh(drive)
    x = x / np.max(np.abs(x)) * target_peak
    return x


def trim_tail(x, thresh=1e-4, pad_s=0.3):
    env = np.max(np.abs(x), axis=1)
    idx = np.where(env > thresh)[0]
    end = min(len(x), idx[-1] + int(pad_s * SR))
    fade = int(0.4 * SR)
    x = x[:end].copy()
    x[-fade:] *= np.linspace(1, 0, fade)[:, None]
    return x


def write_wav(path, x):
    wavfile.write(path, SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))


# --------------------------------------------------------------------------- midi
def write_midi(ev, marks, path):
    TPB = 480
    mid = mido.MidiFile(type=1, ticks_per_beat=TPB)

    def ticks(b):
        return int(round(b * TPB))

    def track(name, program=None, channel=0):
        tr = mido.MidiTrack()
        tr.append(mido.MetaMessage("track_name", name=name, time=0))
        if program is not None:
            tr.append(mido.Message("program_change", program=program, channel=channel, time=0))
        return tr

    def flush(tr, items):
        items.sort(key=lambda e: (e[0], 0 if e[1].type == "note_off" else 1))
        last = 0
        for t, msg in items:
            msg.time = t - last
            last = t
            tr.append(msg)

    tempo = track("Tempo / Sections")
    tempo.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    tempo.append(mido.MetaMessage("time_signature", numerator=4, denominator=4, time=0))
    items = [(0, mido.MetaMessage("key_signature", key="G"))]
    for (tb, name, key, nb, sh, singer) in marks:
        items.append((ticks(tb), mido.MetaMessage("marker", text=f"{name} ({singer})")))
        if key == "final":
            items.append((ticks(tb), mido.MetaMessage("key_signature", key="A")))
    flush(tempo, items)
    mid.tracks.append(tempo)

    def notes_track(name, program, channel, events, with_lyrics=False):
        tr = track(name, program, channel)
        items = []
        for e in events:
            tb, du, m = e[0], e[1], int(e[2])
            vel = int(e[3]) if len(e) > 3 and isinstance(e[3], (int, np.integer)) else 80
            m = max(0, min(127, m))
            if with_lyrics:
                syl = e[4]
                items.append((ticks(tb), mido.MetaMessage("lyrics", text=syl.rstrip("-") + ("" if syl.endswith("-") else " "))))
            items.append((ticks(tb), mido.Message("note_on", note=m, velocity=vel, channel=channel)))
            items.append((ticks(tb + du), mido.Message("note_off", note=m, velocity=0, channel=channel)))
        flush(tr, items)
        return tr

    mid.tracks.append(notes_track("Guide melody (vocal line)", 53, 0, ev["lead"], with_lyrics=True))
    mid.tracks.append(notes_track("Piano", 0, 1, ev["piano"]))
    pad_notes = [(tb, du, m, vel) for (tb, du, ns, vel) in ev["pad"] for m in ns]
    mid.tracks.append(notes_track("Warm pad", 89, 2, pad_notes))
    st_notes = [(tb, du, m, vel) for (tb, du, ns, vel) in ev["strings"] for m in ns]
    mid.tracks.append(notes_track("Strings", 48, 3, st_notes))
    mid.tracks.append(notes_track("Bass", 38, 4, ev["bass"]))

    GM = {"kick": 36, "rim": 37, "snare": 38, "clap": 39, "hat": 42, "crash": 49, "boom": 35}
    dr = []
    for (tb, nm, vel) in ev["drums"]:
        dr.append((tb, 0.2, GM[nm], vel))
    mid.tracks.append(notes_track("Drums", None, 9, dr))
    mid.save(path)


# --------------------------------------------------------------------------- chart
def write_chart(marks, path):
    L = []
    L.append("# Heartbeat and Code - lyrics & chords\n")
    L.append("**Key:** G major, key change up to **A major** for the final chorus  |  **Tempo:** 95 BPM  |  **Time:** 4/4  |  **Length:** about 2:43\n")
    L.append("Chords are shown for each 2-bar lyric line. The melody (guide) is in the MIDI file and the `guide` audio.\n")
    for (tb, name, key, nb, sh, singer) in marks:
        sec = [s for s in SECTIONS if s[1] == key][0]
        _, _, nbars, chords, melody, _, _ = sec
        start = tb * SPB
        L.append(f"\n## {name}  ({int(start // 60)}:{int(start % 60):02d})" + ("" if singer == "-" else f"  -  {singer}") + "\n")
        if not melody:
            names = []
            for c in chords:
                names.append(" ".join(chord_name(x[1], sh) for x in c) if isinstance(c, list) else chord_name(c, sh))
            L.append("`| " + " | ".join(names) + " |`  (instrumental)\n")
            continue
        for li, line in enumerate(melody):
            names = []
            for c in chords[2 * li:2 * li + 2]:
                names.append("→".join(chord_name(x[1], sh) for x in c) if isinstance(c, list) else chord_name(c, sh))
            text = ""
            for (slot, dur, nm, syl) in parse_line(line):
                text += syl.rstrip("-") + ("" if syl.endswith("-") else " ")
            L.append(f"`| {' | '.join(names)} |`  {text.strip()}\n")
    with open(path, "w") as f:
        f.write("\n".join(L))


# --------------------------------------------------------------------------- main
if __name__ == "__main__":
    t0 = time.time()
    ev, marks, nbars = compose()
    ev["_marks"] = marks
    total_beats = nbars * 4
    print(f"composed: {nbars} bars, {total_beats * SPB:.1f}s; "
          + ", ".join(f"{k}={len(v)}" for k, v in ev.items() if k != "_marks"), flush=True)
    write_midi(ev, marks, os.path.join(OUT, "heartbeat_and_code.mid"))
    write_chart(marks, os.path.join(OUT, "heartbeat_and_code_lyrics_chords.md"))
    print("midi + chart written", flush=True)

    base, lead_mix = render(ev, total_beats)
    a, b = int(marks[1][0] * SPB * SR), int((marks[1][0] + 8) * 4 * SPB * SR)
    rms = lambda v: 20 * np.log10(np.sqrt((v.mean(axis=1) ** 2).mean()) + 1e-12)
    print("verse-1 RMS  backing %.1f dB | guide melody %.1f dB" % (rms(base[a:b]), rms(lead_mix[a:b])), flush=True)
    inst = master(base)
    guide = master(base + lead_mix * 1.8)
    # same loudness reference for both: scale guide to match instrumental RMS-ish
    inst = trim_tail(inst)
    guide = trim_tail(guide)
    write_wav(os.path.join(OUT, "heartbeat_and_code_instrumental.wav"), inst)
    write_wav(os.path.join(OUT, "heartbeat_and_code_guide.wav"), guide)
    np.save(os.path.join(OUT, "_inst.npy"), inst.astype(np.float32))
    print("done in", round(time.time() - t0, 1), "s; length", round(len(inst) / SR, 1), "s", flush=True)
