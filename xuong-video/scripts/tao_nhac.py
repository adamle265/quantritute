# Nhạc nền ambient tự tổng hợp (không bản quyền bên thứ ba): pad ấm + nốt piano mềm + vang.
# Cách dùng: python tao_nhac.py out.wav [giây]
import sys
import numpy as np
import soundfile as sf

SR = 48000
out = sys.argv[1]
dur = float(sys.argv[2]) if len(sys.argv) > 2 else 75.0
rng = np.random.default_rng(7)
n = int(SR * dur)
t = np.arange(n) / SR
L = np.zeros(n); R = np.zeros(n)

def hz(m): return 440 * 2 ** ((m - 69) / 12)

# Tiến trình hợp âm (MIDI), mỗi hợp âm 4 giây: Cmaj9 – Am9 – Fmaj7 – G6sus
chords = [[48, 55, 64, 71, 74], [45, 52, 60, 67, 71], [41, 48, 57, 64, 69], [43, 50, 59, 64, 69]]
bar = 4.0
k = 0
while k * bar < dur:
    ch = chords[k % 4]
    s0 = int(k * bar * SR); s1 = min(n, int((k + 1) * bar * SR + 1.5 * SR))
    tt = np.arange(s1 - s0) / SR
    env = np.minimum(tt / 1.6, 1.0) * np.clip((bar + 1.5 - tt) / 1.5, 0, 1)
    for i, m in enumerate(ch):
        f = hz(m)
        v = (np.sin(2 * np.pi * f * tt + 0.3 * np.sin(2 * np.pi * 0.2 * tt)) * 0.6 +
             np.sin(2 * np.pi * f * 2.003 * tt) * 0.12) * env * (0.05 if i else 0.07)
        pan = 0.3 + 0.4 * (i / 4)
        L[s0:s1] += v * (1 - pan); R[s0:s1] += v * pan
    # nốt piano mềm rải trên hợp âm
    for j, off in enumerate([0.0, 1.5, 2.5]):
        if rng.random() < 0.85:
            m = ch[2 + rng.integers(0, 3)] + 12
            a0 = int((k * bar + off) * SR)
            if a0 >= n: continue
            ln = min(n - a0, int(3.0 * SR)); tt2 = np.arange(ln) / SR
            f = hz(m)
            v = (np.sin(2 * np.pi * f * tt2) + 0.35 * np.sin(2 * np.pi * 2 * f * tt2) * np.exp(-tt2 * 3)
                 + 0.1 * np.sin(2 * np.pi * 3 * f * tt2) * np.exp(-tt2 * 5))
            v *= np.exp(-tt2 * 1.4) * np.minimum(tt2 / 0.008, 1) * 0.07
            p = rng.uniform(0.3, 0.7)
            L[a0:a0 + ln] += v * (1 - p); R[a0:a0 + ln] += v * p
    k += 1

# Vang: tích chập với đuôi nhiễu tắt dần
ir_len = int(2.2 * SR)
it = np.arange(ir_len) / SR
def ir(): return rng.standard_normal(ir_len) * np.exp(-it * 2.6) * 0.02
def conv(x, h):
    N = 1 << int(np.ceil(np.log2(len(x) + len(h))))
    return np.fft.irfft(np.fft.rfft(x, N) * np.fft.rfft(h, N), N)[:len(x)]
L = L * 0.7 + conv(L, ir()); R = R * 0.7 + conv(R, ir())

fade = np.minimum(t / 2.0, 1) * np.clip((dur - t) / 3.0, 0, 1)
st = np.stack([L * fade, R * fade], 1)
st /= np.max(np.abs(st)) / 0.6
sf.write(out, st.astype(np.float32), SR)
print("ok", out, dur)
