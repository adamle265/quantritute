# Thử giọng vòng 2: Vbee (API) + Gemini TTS (nếu có khóa). Chạy trên máy anh qua thu-giong-v2.cmd
#   thu-giong-v2.cmd                      -> tạo file mẫu (câu mở + câu kết) cho mọi giọng
#   thu-giong-v2.cmd day-du vbee:<mã giọng>   -> đọc toàn bộ kịch bản bằng giọng đã chọn
#   thu-giong-v2.cmd day-du gemini:<Tên giọng>
import base64, json, os, re, sys, time, urllib.request, urllib.error, urllib.parse, wave
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

GOC = Path(__file__).resolve().parent.parent
ENV = {}
envf = GOC / "khoa-api.txt"
if envf.exists():
    for line in envf.read_text(encoding="utf-8-sig").splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1); ENV[k.strip()] = v.strip().strip('"')

args = sys.argv[1:]
TAP = GOC / "tap" / "cn01-cam-nang-thue"
KB = json.loads((TAP / "kich-ban-v2.json").read_text(encoding="utf-8"))
OUT = TAP / "giong-v2"
OUT.mkdir(exist_ok=True)

def ten_file(s): return re.sub(r'[\\/:*?"<>|]+', "-", s).strip()

def http(url, data=None, headers=None, method=None, timeout=120):
    req = urllib.request.Request(url, data=json.dumps(data).encode() if data is not None else None,
                                 headers=headers or {}, method=method or ("POST" if data is not None else "GET"))
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read(), r.headers.get("Content-Type", "")

# ---------------- VBEE ----------------
def vbee_headers():
    return {"Authorization": f"Bearer {ENV['VBEE_TOKEN']}", "App-Id": ENV["VBEE_APP_ID"], "Content-Type": "application/json"}

def vbee_voices():
    voices, seen = [], set()
    for own in ["VBEE", "PERSONAL", "COMMUNITY"]:
        cursor = None
        for _ in range(20):
            q = f"voice_ownership={own}&voiceOwnership={own}&language_code=vi-VN&languageCode=vi-VN&limit=100"
            if cursor: q += f"&cursor={urllib.parse.quote(cursor)}"
            try:
                body, _ = http("https://vbee.vn/api/public/v1/voices?" + q, headers=vbee_headers())
            except Exception as e:
                print(f"  (không lấy được danh sách giọng {own}: {e})"); break
            res = json.loads(body).get("result", {})
            for v in res.get("voices", []):
                if v.get("code") not in seen:
                    seen.add(v["code"]); v["_own"] = own; voices.append(v)
            pg = res.get("pagination", {})
            if not pg.get("has_next_page"): break
            cursor = pg.get("next_cursor")
    return voices

def vbee_tts(text, code, out_path, speed=1.0):
    body = {"text": text, "voiceCode": code, "mode": "async", "outputFormat": "wav", "speed": speed,
            "webhookUrl": "https://example.com/vbee-callback"}
    for attempt in range(6):
        try:
            r, _ = http("https://api.vbee.vn/v1/tts", body, vbee_headers()); break
        except urllib.error.HTTPError as e:
            msg = e.read().decode("utf-8", "ignore")
            if e.code in (429, 500) and attempt < 5: time.sleep(3 + attempt * 3); continue
            raise RuntimeError(f"HTTP {e.code}: {msg[:200]}")
    rid = json.loads(r).get("requestId") or json.loads(r).get("result", {}).get("requestId")
    if not rid: raise RuntimeError(f"Không có requestId: {r[:200]}")
    for _ in range(120):
        time.sleep(1.5)
        g, _ = http(f"https://api.vbee.vn/v1/tts/requests/{rid}", headers=vbee_headers())
        j = json.loads(g); j = j.get("result", j)
        st = j.get("status")
        if st == "COMPLETED":
            audio, _ = http(j["audioLink"], timeout=120)
            out_path.write_bytes(audio); return
        if st == "FAILED" or "error" in j: raise RuntimeError(str(j)[:200])
    raise RuntimeError("Hết thời gian chờ")

# ---------------- GEMINI ----------------
GEM_MODEL = None
def gemini_tts(text, voice, out_path):
    global GEM_MODEL
    cfg = KB["gemini"]
    prompt = cfg["phong_cach"] + '\n\n"' + text + '"'
    models = [GEM_MODEL] if GEM_MODEL else cfg["mo_hinh"]
    last = None
    for m in models:
        body = {"contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"responseModalities": ["AUDIO"],
                                     "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}}}}
        for attempt in range(6):
            try:
                r, _ = http(f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={ENV['GEMINI_API_KEY']}", body)
                data = json.loads(r)["candidates"][0]["content"]["parts"][0]["inlineData"]["data"]
                pcm = base64.b64decode(data)
                with wave.open(str(out_path), "wb") as w:
                    w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000); w.writeframes(pcm)
                GEM_MODEL = m; return
            except urllib.error.HTTPError as e:
                last = f"{m}: HTTP {e.code} {e.read().decode('utf-8','ignore')[:160]}"
                if e.code == 429 and attempt < 5: time.sleep(25); continue
                break
    raise RuntimeError(last)

def wav_len(p):
    try:
        with wave.open(str(p)) as w: return round(w.getnframes() / w.getframerate(), 3)
    except Exception:
        return None

# ---------------- CHẠY ----------------
c = {x["id"]: x["loi"] for x in KB["canh"]}
mau = c["01"] + " " + c["08"]

if not args or args[0] != "day-du":
    if ENV.get("VBEE_TOKEN") and ENV.get("VBEE_APP_ID"):
        print("== VBEE: lấy danh sách giọng tiếng Việt...")
        vs = vbee_voices()
        (OUT / "vbee-danh-sach-giong.json").write_text(json.dumps(vs, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"   {len(vs)} giọng. Đang đọc mẫu (4 luồng)...")
        d = OUT / "vbee"; d.mkdir(exist_ok=True)
        def job(v):
            p = d / f"{ten_file(v.get('name', v['code']))} [{v['_own']}] {ten_file(v['code'])}.wav"
            if p.exists(): return
            try: vbee_tts(mau, v["code"], p, speed=1.05); print("   ✓", v.get("name"))
            except Exception as e: print("   ✗", v.get("name"), e)
        with ThreadPoolExecutor(4) as ex: list(ex.map(job, vs))
    else:
        print("== Bỏ qua Vbee: chưa có VBEE_APP_ID / VBEE_TOKEN trong file khoa-api.txt")
    if ENV.get("GEMINI_API_KEY"):
        print("== GEMINI: đọc mẫu...")
        d = OUT / "gemini"; d.mkdir(exist_ok=True)
        for v in KB["gemini"]["giong_thu"]:
            p = d / f"{v}.wav"
            if p.exists(): continue
            try: gemini_tts(mau, v, p); print("   ✓", v, f"({GEM_MODEL})")
            except Exception as e: print("   ✗", v, e)
    else:
        print("== Bỏ qua Gemini: chưa có GEMINI_API_KEY trong file khoa-api.txt")
    print("\nHOÀN TẤT. Nghe thử trong:", OUT)
else:
    eng, name = args[1].split(":", 1)
    label = f"{eng}-{ten_file(name)}"
    d = TAP / "giong" / label; d.mkdir(parents=True, exist_ok=True)
    tl = {}
    for x in KB["canh"]:
        p = d / f"{x['id']}.wav"
        if eng == "vbee": vbee_tts(x["loi"], name, p, speed=float(ENV.get("VBEE_SPEED", "1.05")))
        else: gemini_tts(x["loi"], name, p)
        tl[x["id"]] = wav_len(p); print(f"   câu {x['id']}: {tl[x['id']]}s")
    f = TAP / "giong" / "thoi-luong.json"
    all_ = json.loads(f.read_text(encoding="utf-8")) if f.exists() else {}
    all_[label] = tl
    f.write_text(json.dumps(all_, ensure_ascii=False, indent=2), encoding="utf-8")
    print("\nHOÀN TẤT:", d)
