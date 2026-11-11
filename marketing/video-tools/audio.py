"""Build the soundtrack: PartyCue's own sound effects (recreated from src/utils/audioEffects.ts),
crowd applause on score reveals, transition whooshes and an original synthesized background beat."""
import json, sys, wave
import numpy as np
R, E = sys.argv[1], sys.argv[2]
SR = 44100
rng = np.random.default_rng(7)
scenes = json.load(open(f'{E}/scenes.json'))
total = sum(s['dur'] for s in scenes)
N = int(total * SR) + SR
sfx_bus = np.zeros(N); mus = np.zeros(N)

def t_arr(d): return np.arange(int(d * SR)) / SR
def add(bus, start, sig):
    i = int(start * SR)
    if i < 0: sig = sig[-i:]; i = 0
    j = min(N, i + len(sig)); bus[i:j] += sig[:j - i]
def env_exp(d, a=0.008, hold=0.6):
    t = t_arr(d); e = np.minimum(1, t / a)
    tail = t > d * hold
    e[tail] *= np.exp(-6 * (t[tail] - d * hold) / (d * (1 - hold)))
    return e
def square(f, t): return np.sign(np.sin(2*np.pi*f*t))
def tri(f, t): return 2/np.pi*np.arcsin(np.sin(2*np.pi*f*t))

def beep(final=False):  # playBeep(): square + sine(octave down) + triangle
    d = 0.7 if final else 0.28; f = 1568 if final else 1046.5; t = t_arr(d)
    s = 0.35*square(f, t) + 0.8*np.sin(np.pi*f*t) + 0.5*tri(f, t)
    return 0.32 * s * env_exp(d)
def fanfare():  # playFanfare(): C5 E5 G5 C6 triangles, 0.12s apart
    out = np.zeros(int(1.1*SR))
    for k, f in enumerate([523.25, 659.25, 783.99, 1046.5]):
        t = t_arr(0.65); s = 0.5*tri(f, t) * np.exp(-t*7.5)
        i = int(k*0.12*SR); out[i:i+len(s)] += s
    return out
def clap():
    d = 0.09; t = t_arr(d); n = rng.standard_normal(len(t))
    # crude bandpass via difference of moving averages
    lo = np.convolve(n, np.ones(4)/4, 'same'); hi = np.convolve(n, np.ones(30)/30, 'same')
    return (lo - hi) * np.exp(-t*55)
def applause(d=3.2, density=90):
    out = np.zeros(int(d*SR)); t = t_arr(d)
    for _ in range(int(d*density)):
        st = rng.uniform(0, d-0.1); c = clap()*rng.uniform(0.3, 1)
        i = int(st*SR); out[i:i+len(c)] += c[:len(out)-i]
    env = np.minimum(1, t/0.35) * np.where(t > d-1.2, np.exp(-3*(t-(d-1.2))), 1)
    out = np.convolve(out, np.ones(7)/7, 'same')  # take the hiss off
    return 0.13 * out * env
def whoosh(d=0.35):
    t = t_arr(d); n = rng.standard_normal(len(t))
    sm = np.convolve(n, np.ones(12)/12, 'same')
    return 0.18 * sm * np.sin(np.pi*t/d)**2

# ---- map recorded app sounds into the edit timeline ----
ev = json.load(open(f'{R}/sfx.json'))
osc = sorted([e for e in ev if e['kind'] == 'osc'], key=lambda e: e['t'])
groups = []
for e in osc:
    if groups and e['t'] - groups[-1][-1]['t'] < 0.03: groups[-1].append(e)
    else: groups.append([e])
sounds = []  # (time, kind)
i = 0
while i < len(groups):
    g = groups[i]
    if len(g) == 3:  # beep
        nxt = groups[i+1] if i+1 < len(groups) else None
        final = not (nxt and len(nxt) == 3 and nxt[0]['t'] - g[0]['t'] < 1.3)
        sounds.append((g[0]['t'], 'beep_final' if final else 'beep')); i += 1
    else:  # fanfare = 4 single triangles 0.12s apart
        sounds.append((g[0]['t'], 'fanfare')); i += 4 if len(g) == 1 else 1
pos = 0.0
for s in scenes:
    if s['src'] != 'cta':
        for t, k in sounds:
            if s['in'] <= t < s['in'] + s['dur']:
                o = pos + t - s['in']
                add(sfx_bus, o, beep(k == 'beep_final') if k.startswith('beep') else 0.9*fanfare())
    if pos > 0: add(sfx_bus, pos - 0.15, whoosh())
    if s['id'] in ('s07', 's08'): add(sfx_bus, pos + 0.6, applause())
    if s['id'] == 's09': add(sfx_bus, pos + 0.2, 0.8*applause(3.4))
    if s['id'] == 's10': add(sfx_bus, pos, 0.9*fanfare())
    pos += s['dur']

# ---- original background beat, 118 bpm, C - G - Am - F ----
bpm = 118; beat = 60 / bpm; bar = 4 * beat
chords = [[261.63, 329.63, 392.0], [196.0, 246.94, 293.66], [220.0, 261.63, 329.63], [174.61, 220.0, 261.63]]
def kick():
    t = t_arr(0.35); f = 50 + 110*np.exp(-t*30)
    return np.sin(2*np.pi*np.cumsum(f)/SR) * np.exp(-t*9)
def hat():
    t = t_arr(0.05); n = rng.standard_normal(len(t)); n = n - np.convolve(n, np.ones(3)/3, 'same')
    return 0.25 * n * np.exp(-t*90)
def pluck(freqs, d):
    t = t_arr(d); s = sum(np.sign(np.sin(2*np.pi*f*t))*0.3 + np.sin(2*np.pi*f*t) for f in freqs)
    s = np.convolve(s, np.ones(18)/18, 'same')  # soften
    return 0.09 * s * np.exp(-t*5)
def bass(f, d):
    t = t_arr(d); return 0.35 * np.sin(2*np.pi*f/2*t) * np.minimum(1, t/0.01) * np.exp(-t*3)
nb = int(total / beat) + 2
music_start = 0.0
for b in range(nb):
    t0 = music_start + b*beat; ch = chords[(b // 4) % 4]
    add(mus, t0, 0.55*kick())
    add(mus, t0 + beat/2, hat())
    if b % 2 == 1: add(mus, t0, 0.6*clap()*2.2)
    add(mus, t0, bass(ch[0], beat*0.9))
    add(mus, t0 + beat/2, bass(ch[0], beat*0.4))
    if b % 2 == 0: add(mus, t0 + (beat*1.5 if b % 4 == 2 else 0), pluck(ch, beat*1.4))
# fade in/out
tt = np.arange(N)/SR
mus *= np.minimum(1, tt/0.5) * np.clip((total - tt)/1.5, 0, 1)

def norm(x, peak): m = np.max(np.abs(x)) or 1; return x / m * peak
def write(name, x):
    x = np.tanh(x * 1.1)  # gentle limiter
    x = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    with wave.open(f'{E}/{name}', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(x.tobytes())
sfx_n = norm(sfx_bus, 0.85); mus_n = norm(mus, 0.85)
write('audio_full.wav', sfx_n + 0.42*mus_n)   # SFX + music
write('audio_sfx.wav', sfx_n)                 # SFX only (for adding your own voice + music)
print('sounds mapped:', sounds)
print('total', round(total, 2))
