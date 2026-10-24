"""Original chiptune score + SFX for the DragonVision trailer. Usage: python3 music.py out.wav"""
import sys, wave
import numpy as np

SR = 44100
BPM = 136
BEAT = 60 / BPM
BAR = BEAT * 4
BARS = 30
N = int(SR * BAR * BARS) + SR
L = np.zeros(N); R = np.zeros(N)
rng = np.random.default_rng(7)

def hz(midi): return 440 * 2 ** ((midi - 69) / 12)
def env(n, a=0.005, d=0.08, s=0.6, r=0.05):
    t = np.arange(n) / SR; e = np.ones(n) * s
    ai = int(a * SR); di = int(d * SR); ri = int(r * SR)
    e[:ai] = np.linspace(0, 1, max(ai, 1))[:len(e[:ai])]
    e[ai:ai + di] = np.linspace(1, s, max(di, 1))[:len(e[ai:ai + di])]
    if ri: e[-ri:] *= np.linspace(1, 0, ri)
    return e
def square(f, n, duty=0.5):
    ph = (np.arange(n) * f / SR) % 1
    return np.where(ph < duty, 1.0, -1.0)
def tri(f, n):
    ph = (np.arange(n) * f / SR) % 1
    return 4 * np.abs(ph - 0.5) - 1
def put(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR); j = min(N, i + len(sig)); sig = sig[: j - i] * gain
    L[i:j] += sig * (1 - max(0, pan)); R[i:j] += sig * (1 + min(0, pan))
def note(t, midi, dur, kind='sq', gain=0.12, duty=0.5, pan=0.0, s=0.6):
    n = int(dur * SR)
    w = square(hz(midi), n, duty) if kind == 'sq' else tri(hz(midi), n)
    put(w * env(n, s=s, r=min(0.04, dur / 3)), t, gain, pan)
def kick(t, g=0.9):
    n = int(0.18 * SR); tt = np.arange(n) / SR
    f = 150 * np.exp(-tt * 28) + 45
    put(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 16), t, g)
def snare(t, g=0.35):
    n = int(0.16 * SR); tt = np.arange(n) / SR
    put((rng.uniform(-1, 1, n) * 0.8 + 0.4 * np.sin(2 * np.pi * 190 * tt)) * np.exp(-tt * 22), t, g)
def hat(t, g=0.12, open_=False):
    n = int((0.09 if open_ else 0.03) * SR); x = rng.uniform(-1, 1, n)
    x = np.diff(np.concatenate([[0], x]))
    put(x * np.exp(-np.arange(n) / SR * (30 if open_ else 90)), t, g, pan=0.2)
def riser(t0, t1, g=0.25):
    n = int((t1 - t0) * SR); x = rng.uniform(-1, 1, n); k = np.linspace(0, 1, n)
    y = np.zeros(n); a = 0.0
    for i in range(0, n, 64):
        c = 0.02 + 0.5 * k[i]; seg = x[i:i + 64]
        for j in range(len(seg)): a += c * (seg[j] - a); y[i + j] = a
    put(y * k ** 2 * 2.2, t0, g)
def crash(t, g=0.3):
    n = int(1.2 * SR); x = rng.uniform(-1, 1, n); x = np.diff(np.concatenate([[0], x]))
    put(x * np.exp(-np.arange(n) / SR * 3.5), t, g)

# Am F C G
CHORDS = [(57, [57, 60, 64]), (53, [53, 57, 60]), (48, [55, 60, 64]), (55, [55, 59, 62])]
def bar_t(b): return b * BAR

for b in range(BARS):
    t = bar_t(b); root, tones = CHORDS[b % 4]
    intro, A, B, out = b < 4, 4 <= b < 12, 12 <= b < 24, b >= 24
    # arpeggio (pulse 12.5%)
    if intro or B or (out and b < 28):
        for k in range(16):
            m = tones[k % 3] + 12 + (12 if (k // 3) % 2 and B else 0)
            note(t + k * BEAT / 4, m, BEAT / 4 * 0.9, 'sq', 0.045 if not intro else 0.035 + 0.01 * b, duty=0.125, pan=-0.3)
    # bass (triangle 8ths)
    if b >= 2 and not (out and b >= 27):
        for k in range(8):
            m = root - 12 + (12 if k % 2 else 0)
            note(t + k * BEAT / 2, m, BEAT / 2 * 0.85, 'tri', 0.28)
    # drums
    if A:
        for k in range(4): kick(t + k * BEAT, 0.75)
        for k in range(8): hat(t + k * BEAT / 2 + BEAT / 4)
        if b % 2: snare(t + 3 * BEAT, 0.25)
    if B:
        for k in range(4): kick(t + k * BEAT)
        for k in (1, 3): snare(t + k * BEAT)
        for k in range(16): hat(t + k * BEAT / 4, 0.08 if k % 2 else 0.12, open_=(k == 14))
        if b % 4 == 3: [snare(t + 3 * BEAT + k * BEAT / 4, 0.18 + 0.05 * k) for k in range(4)]
    # lead melody
    if A:
        motif = [0, 2, 1, 2, 3, 2, 1, -1]
        for k, d in enumerate(motif):
            if d < 0: continue
            m = (tones + [tones[0] + 12])[d] + 12
            note(t + k * BEAT / 2, m, BEAT / 2 * 0.8, 'sq', 0.09, duty=0.5, pan=0.15)
    if B:
        motif = [3, -1, 2, 3, 1, 2, 0, 1, 3, -1, 2, 1, 2, -1, 3, 2]
        for k, d in enumerate(motif):
            if d < 0: continue
            m = (tones + [tones[0] + 12])[d] + 24
            note(t + k * BEAT / 4, m, BEAT / 4 * 0.9, 'sq', 0.075, duty=0.25, pan=0.15)
        if b % 2 == 0: note(t, tones[0] + 12, BAR * 0.95, 'sq', 0.04, duty=0.5, s=0.4)
    if out:
        if b == 24:
            crash(t, 0.35); kick(t, 1.0)
            for m in (57, 60, 64, 69): note(t, m + 12, BAR * 2, 'sq', 0.05, duty=0.5, s=0.5)
        if b == 26:
            for m in (45, 57, 60, 64, 69): note(t, m, BAR * 3.5, 'tri' if m < 50 else 'sq', 0.06 if m > 50 else 0.3, duty=0.25, s=0.45)

riser(bar_t(2), bar_t(4), 0.3); crash(bar_t(4), 0.3)
riser(bar_t(10), bar_t(12) - 0.02, 0.35); crash(bar_t(12), 0.45); kick(bar_t(12), 1.0)

# --- SFX synced to the edit ---
CUTS = [7.06, 10.59, 14.12, 15.88, 21.18, 26.47, 28.24, 30.0, 33.53, 35.29, 38.82, 40.59, 41.47, 42.35]
def whoosh(t, g=0.22):
    n = int(0.28 * SR); x = rng.uniform(-1, 1, n); k = np.sin(np.linspace(0, np.pi, n))
    y = np.convolve(x, np.ones(12) / 12, 'same')
    put(y * k, t - 0.18, g, pan=-0.2)
def coin(t, g=0.10):
    note(t, 88, 0.06, 'sq', g, duty=0.5); note(t + 0.06, 95, 0.18, 'sq', g, duty=0.5, s=0.5)
def levelup(t, g=0.08):
    for k, m in enumerate([72, 76, 79, 84, 88]): note(t + k * 0.06, m, 0.1, 'sq', g, duty=0.25)
def impact(t, g=0.6):
    kick(t, g); n = int(0.4 * SR); put(rng.uniform(-1, 1, n) * np.exp(-np.arange(n) / SR * 12), t, 0.15)
for c in CUTS: whoosh(c)
for c in [7.3, 10.8, 16.1, 21.4, 26.6, 28.4, 30.2, 33.7, 35.5, 39.0, 40.8]: coin(c)
levelup(18.2); levelup(19.6)
impact(21.18); impact(28.24, 0.5)

mix = np.stack([L, R], 1)
mix /= np.max(np.abs(mix)) * 1.05
end = int(SR * (BAR * BARS))
fade = int(SR * 3)
mix[end - fade:end] *= np.linspace(1, 0, fade)[:, None]
mix = mix[:end]
with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('seconds', end / SR)
