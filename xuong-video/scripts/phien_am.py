# Phiên âm lời nói trong video (chạy trên máy anh) – faster-whisper, có mốc thời gian từng từ.
#   python phien_am.py <file video hoặc thư mục> <thư mục kết quả>
import json, sys, traceback
from pathlib import Path
GOC = Path(__file__).resolve().parent.parent          # xuong-video
src = Path(sys.argv[1]) if len(sys.argv) > 1 else GOC.parent.parent / "Video xây kênh" / "Source gốc"
out = Path(sys.argv[2]) if len(sys.argv) > 2 else GOC / "tap" / "v01-tro-lai-cung-dom" / "phien-am"
out.mkdir(parents=True, exist_ok=True)
LOG = out / "_nhat-ky.txt"
def log(*a):
    t = " ".join(str(x) for x in a); print(t)
    with open(LOG, "a", encoding="utf-8") as f: f.write(t + "\n")
log("Nguồn:", src, "| tồn tại:", src.exists())
try:
    from faster_whisper import WhisperModel
except Exception:
    log(traceback.format_exc()); raise
# Âm thanh đã tách sẵn thành WAV 16 kHz mono (thư mục am-thanh) để không phụ thuộc thư viện giải mã video
wdir = out / "am-thanh"
files = sorted(wdir.glob("*.wav")) if wdir.exists() else ([src] if src.is_file() else sorted(p for p in src.iterdir() if p.suffix.lower() in (".mp4", ".mov", ".m4a", ".wav", ".mp3")))
import wave, numpy as np
def nap(f):
    if f.suffix.lower() != ".wav": return str(f)
    with wave.open(str(f)) as w:
        a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
    return a
log("Đang tải mô hình nhận giọng (lần đầu khoảng 1,6 GB, các lần sau dùng lại)...")
try:
    m = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8")
except Exception:
    log(traceback.format_exc()); raise
for f in files:
    log(f"Phiên âm: {f.name}")
    segs, info = m.transcribe(nap(f), language="vi", word_timestamps=True, vad_filter=True, beam_size=5,
        initial_prompt="Chào các bạn, mình là Minh Tuấn. Quản trị tử tế. Đốm. AI, công nghệ số.")
    data = []
    for s in segs:
        data.append({"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip(),
                     "words": [{"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2)} for w in (s.words or [])]})
        print(f"  [{s.start:6.2f} → {s.end:6.2f}] {s.text.strip()}")
    (out / f"{f.stem}.json").write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    (out / f"{f.stem}.txt").write_text("\n".join(f"[{d['start']:.2f}-{d['end']:.2f}] {d['text']}" for d in data), encoding="utf-8")
log(f"HOÀN TẤT phiên âm → {out}")
