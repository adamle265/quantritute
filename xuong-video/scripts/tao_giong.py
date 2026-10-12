# Tạo giọng Đốm cho một tập video bằng VieNeu-TTS (chạy offline trên máy).
# Cách dùng: tao-giong-dom.cmd  [thư mục tập]  [--chi-giong-chon]
import json, sys, time
from pathlib import Path

import numpy as np
import soundfile as sf

goc = Path(__file__).resolve().parent.parent
args = [a for a in sys.argv[1:] if not a.startswith("--")]
chi_chon = "--chi-giong-chon" in sys.argv
tap = Path(args[0]) if args else max((goc / "tap").iterdir(), key=lambda p: p.stat().st_mtime)
kb = json.loads((tap / "kich-ban.json").read_text(encoding="utf-8"))
giongs = [kb["giong_chon"]] if chi_chon else kb.get("giong_thu") or [kb["giong_chon"]]

print(f"Tập: {tap.name} · {len(kb['canh'])} câu · giọng: {', '.join(giongs)}")
print("Lần đầu chạy sẽ tải mô hình (vài trăm MB), anh chờ chút nhé...")

from vieneu import Vieneu
tts = Vieneu()
sr = tts.sample_rate

def doc(text, ten):
    try:
        return tts.infer(text, voice=ten)
    except Exception:
        return tts.infer(text, voice=tts.get_preset_voice(ten))

thoi_luong = {}
for ten in giongs:
    out = tap / "giong" / ten
    out.mkdir(parents=True, exist_ok=True)
    tong = []
    t0 = time.time()
    for c in kb["canh"]:
        wav = np.asarray(doc(c["loi"], ten), dtype=np.float32)
        sf.write(out / f"{c['id']}.wav", wav, sr)
        tong += [wav, np.zeros(int(sr * 0.35), dtype=np.float32)]
        thoi_luong.setdefault(ten, {})[c["id"]] = round(len(wav) / sr, 3)
        print(f"  [{ten}] câu {c['id']}: {len(wav)/sr:.1f}s")
    sf.write(tap / "giong" / f"nghe-thu - {ten}.wav", np.concatenate(tong), sr)
    print(f"  Xong giọng {ten} trong {time.time()-t0:.0f}s")

(tap / "giong" / "thoi-luong.json").write_text(json.dumps(thoi_luong, ensure_ascii=False, indent=2), encoding="utf-8")
print("\nHOÀN TẤT. File nghe thử nằm trong:", tap / "giong")
