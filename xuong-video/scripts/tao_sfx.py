# Hiệu ứng âm thanh tự tổng hợp + nhạc nền nhịp nhanh (không bản quyền bên thứ ba)
import sys, numpy as np, soundfile as sf
SR = 48000
out = sys.argv[1]
rng = np.random.default_rng(3)
def env(n, a, d): t = np.arange(n) / SR; return np.minimum(t / a, 1) * np.exp(-t / d)
def save(name, x, peak=0.9): x = x / (np.max(np.abs(x)) + 1e-9) * peak; sf.write(f"{out}/{name}.wav", x.astype(np.float32), SR)

n = int(0.08 * SR); t = np.arange(n) / SR
save("tap", (np.sin(2*np.pi*1800*t) * 0.6 + rng.standard_normal(n) * 0.25) * env(n, 0.001, 0.012), 0.6)
n = int(0.05 * SR); t = np.arange(n) / SR
save("key", (rng.standard_normal(n) * 0.7 + np.sin(2*np.pi*3200*t) * 0.3) * env(n, 0.0005, 0.006), 0.45)
n = int(0.6 * SR); t = np.arange(n) / SR
thud = np.sin(2*np.pi*(90 - 40*t)*t) * env(n, 0.002, 0.12) + rng.standard_normal(n) * env(n, 0.001, 0.02) * 0.5
save("thud", thud, 0.95)
n = int(0.45 * SR); t = np.arange(n) / SR
w = rng.standard_normal(n); W = np.fft.rfft(w); f = np.fft.rfftfreq(n, 1/SR)
w = np.fft.irfft(W * np.exp(-((f - 2500) / 1800) ** 2), n) * np.sin(np.pi * t / t[-1]) ** 2
save("whoosh", w, 0.35)
n = int(0.18 * SR); t = np.arange(n) / SR
save("pop", np.sin(2*np.pi*(500 + 900*t/t[-1])*t) * env(n, 0.003, 0.05), 0.5)
n = int(0.9 * SR); t = np.arange(n) / SR
ding = sum(np.sin(2*np.pi*fq*t) * a for fq, a in [(1318.5, 1), (1975.5, .5), (2637, .25)]) * env(n, 0.002, 0.25)
save("ding", ding, 0.5)

# Nhạc nền 112 bpm: pad + bass + piano rải nốt móc đơn + kick nhẹ
dur = float(sys.argv[2]) if len(sys.argv) > 2 else 60
bpm = 112; beat = 60 / bpm; N = int(dur * SR); L = np.zeros(N); R = np.zeros(N)
def hz(m): return 440 * 2 ** ((m - 69) / 12)
chords = [[48, 55, 64, 67, 72], [45, 52, 60, 64, 69], [41, 48, 57, 60, 65], [43, 50, 59, 62, 67]]
bar = 4 * beat; k = 0
while k * bar < dur:
    ch = chords[k % 4]; s0 = int(k * bar * SR); s1 = min(N, int((k + 1) * bar * SR + 0.6 * SR)); tt = np.arange(s1 - s0) / SR
    pad = sum(np.sin(2*np.pi*hz(m)*tt) for m in ch[1:4]) * np.minimum(tt / 0.4, 1) * np.clip((bar + 0.6 - tt) / 0.6, 0, 1) * 0.035
    bass = np.sin(2*np.pi*hz(ch[0]-12)*tt) * 0.12 * np.exp(-(tt % beat) * 3)
    L[s0:s1] += pad + bass; R[s0:s1] += pad + bass
    for e in range(8):
        a0 = int((k * bar + e * beat / 2) * SR)
        if a0 >= N: break
        m = ch[[2, 3, 4, 3, 2, 4, 3, 4][e]] + 12; ln = min(N - a0, int(0.7 * SR)); t2 = np.arange(ln) / SR
        v = (np.sin(2*np.pi*hz(m)*t2) + 0.3*np.sin(2*np.pi*2*hz(m)*t2)*np.exp(-t2*4)) * np.exp(-t2 * 4) * np.minimum(t2/0.005, 1) * 0.06
        p = 0.35 + 0.3 * (e % 2); L[a0:a0+ln] += v * (1 - p); R[a0:a0+ln] += v * p
    for e in range(4):
        a0 = int((k * bar + e * beat) * SR)
        if a0 >= N: break
        ln = min(N - a0, int(0.25 * SR)); t2 = np.arange(ln) / SR
        kk = np.sin(2*np.pi*(55 + 70*np.exp(-t2*30))*t2) * np.exp(-t2 * 12) * 0.18
        L[a0:a0+ln] += kk; R[a0:a0+ln] += kk
    k += 1
tt = np.arange(N) / SR; fade = np.minimum(tt / 0.8, 1) * np.clip((dur - tt) / 2.0, 0, 1)
st = np.stack([L * fade, R * fade], 1); st /= np.max(np.abs(st)) / 0.7
sf.write(f"{out}/nhac-nhanh.wav", st.astype(np.float32), SR)
print("ok")
