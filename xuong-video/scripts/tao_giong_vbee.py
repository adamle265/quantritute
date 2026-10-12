# Đọc kịch bản bằng Vbee API (chạy trên máy anh).
#   python tao_giong_vbee.py <thư mục tập> <tên file kịch bản> [mã giọng]
# Kịch bản: {"giong_vbee": "...", "toc_do": 1.2, "nghi": {...}, "doan": [{"id","loi","toc_do"?}]}
import json, sys, time, urllib.request, urllib.error, wave
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent
ENV = {}
for line in (GOC / "khoa-api.txt").read_text(encoding="utf-8-sig").splitlines():
    if "=" in line and not line.strip().startswith("#"):
        k, v = line.split("=", 1); ENV[k.strip()] = v.strip().strip('"')

tap = Path(sys.argv[1]) if Path(sys.argv[1]).is_absolute() else GOC / sys.argv[1]
kb_file = tap / sys.argv[2]
kb = json.loads(kb_file.read_text(encoding="utf-8"))
code = sys.argv[3] if len(sys.argv) > 3 else kb["giong_vbee"]
H = {"Authorization": f"Bearer {ENV['VBEE_TOKEN']}", "App-Id": ENV["VBEE_APP_ID"], "Content-Type": "application/json"}

def http(url, data=None, timeout=120):
    req = urllib.request.Request(url, data=json.dumps(data).encode() if data is not None else None, headers=H,
                                 method="POST" if data is not None else "GET")
    with urllib.request.urlopen(req, timeout=timeout) as r: return r.read()

def tts(text, out, speed):
    body = {"text": text, "voiceCode": code, "mode": "async", "outputFormat": "wav", "speed": speed,
            "webhookUrl": "https://example.com/vbee-callback", "clientPause": kb.get("nghi", {})}
    for a in range(6):
        try: r = json.loads(http("https://api.vbee.vn/v1/tts", body)); break
        except urllib.error.HTTPError as e:
            msg = e.read().decode("utf-8", "ignore")
            if e.code in (429, 500) and a < 5: time.sleep(3 + 3 * a); continue
            raise RuntimeError(f"HTTP {e.code}: {msg[:300]}")
    rid = r.get("requestId") or r.get("result", {}).get("requestId")
    for _ in range(120):
        time.sleep(1.2)
        j = json.loads(http(f"https://api.vbee.vn/v1/tts/requests/{rid}")); j = j.get("result", j)
        if j.get("status") == "COMPLETED":
            req = urllib.request.Request(j["audioLink"])
            with urllib.request.urlopen(req, timeout=120) as f: out.write_bytes(f.read())
            return
        if j.get("status") == "FAILED" or "error" in j: raise RuntimeError(str(j)[:300])
    raise RuntimeError("Hết thời gian chờ")

ten = kb_file.stem
d = tap / "giong" / f"{ten}-{code}"
d.mkdir(parents=True, exist_ok=True)
print(f"Kịch bản {kb_file.name} · giọng {code} · {len(kb['doan'])} đoạn")
tong = 0
for s in kb["doan"]:
    p = d / f"{s['id']}.wav"
    tts(s["loi"], p, s.get("toc_do", kb.get("toc_do", 1.0)))
    with wave.open(str(p)) as w: sec = w.getnframes() / w.getframerate()
    tong += len(s["loi"]); print(f"  ✓ {s['id']}  {sec:.2f}s  {s['loi'][:50]}")
print(f"\nHOÀN TẤT: {d}\nTổng {tong} ký tự (điểm Vbee ≈ ký tự × hệ số giọng)")
