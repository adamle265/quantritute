# Quay cảnh web cho video v04 – chạy trên máy anh. Cách làm giống video đầu: chạy website local (wrangler + D1 local) rồi quay bằng Playwright + Chrome thật.
# Dùng:  uv run --python 3.12 --with playwright --with imageio-ffmpeg python scripts\quay_web_v04.py
import asyncio, base64, os, re, shutil, subprocess, sys, time, json, urllib.request
from pathlib import Path
from playwright.async_api import async_playwright
import imageio_ffmpeg
FF = imageio_ffmpeg.get_ffmpeg_exe()
ROOT = Path(__file__).resolve().parents[2]                      # quantritute
TAP = ROOT / "xuong-video" / "tap" / "v04-chon-dung-cong-cu"
OUT = TAP / "quay"; OUT.mkdir(parents=True, exist_ok=True)
STATE = ROOT / ".state-v04"; BASE = "http://localhost:8788"
VW, VH, DPR = 1160, 1315, 1.5
LOG = OUT / "_nhat-ky-quay.txt"
def log(*a):
    t = " ".join(str(x) for x in a); print(t, flush=True)
    with open(LOG, "a", encoding="utf-8") as f: f.write(t + "\n")
CUR = r"""(()=>{if(document.getElementById('__cur'))return;const s=document.createElement('style');s.textContent=`#__cur{position:fixed;left:0;top:0;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;background:rgba(255,255,255,.55);border:3px solid rgba(60,40,20,.9);box-shadow:0 2px 10px rgba(0,0,0,.35);z-index:2147483647;pointer-events:none;transition:transform .12s}.__rip{position:fixed;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;border:3px solid #e8a33c;z-index:2147483646;pointer-events:none;animation:__r .6s ease-out forwards}@keyframes __r{to{transform:scale(2.8);opacity:0}}`;document.head.appendChild(s);const c=document.createElement('div');c.id='__cur';document.body.appendChild(c);
window.__cur={x:-50,y:-50,set(x,y){this.x=x;this.y=y;c.style.left=x+'px';c.style.top=y+'px'},tap(){c.style.transform='scale(.7)';setTimeout(()=>c.style.transform='',150);const r=document.createElement('div');r.className='__rip';r.style.left=this.x+'px';r.style.top=this.y+'px';document.body.appendChild(r);setTimeout(()=>r.remove(),650)}};
document.addEventListener('click',e=>{const a=e.target.closest('a[target=_blank]');if(a)e.preventDefault()},true);window.open=()=>null;})()"""
class Rec:
    def __init__(s, p): s.p = p
    async def start(s, name):
        s.name = name; s.dir = OUT / f"_f-{name}"; shutil.rmtree(s.dir, ignore_errors=True); s.dir.mkdir(parents=True); s.frames = []; s.marks = {}
        s.cdp = await s.p.context.new_cdp_session(s.p); s.cdp.on("Page.screencastFrame", s._on)
        await s.cdp.send("Page.startScreencast", {"format": "jpeg", "quality": 90, "maxWidth": int(VW * DPR), "maxHeight": int(VH * DPR)}); await asyncio.sleep(0.4)
    def _on(s, f):
        fn = s.dir / f"{len(s.frames):05d}.jpg"; fn.write_bytes(base64.b64decode(f["data"])); s.frames.append((f["metadata"]["timestamp"], fn))
        asyncio.ensure_future(s.cdp.send("Page.screencastFrameAck", {"sessionId": f["sessionId"]}))
    def mark(s, k): s.marks[k] = round(time.time() - s.frames[0][0], 2) if s.frames else 0
    async def stop(s):
        await asyncio.sleep(0.3); end = time.time(); await s.cdp.send("Page.stopScreencast"); await s.cdp.detach()
        fr = s.frames; L = []
        for k, (ts, fn) in enumerate(fr):
            nx = fr[k + 1][0] if k + 1 < len(fr) else max(end, ts + 0.04)
            L += [f"file '{fn.as_posix()}'", f"duration {max(nx - ts, 0.001):.4f}"]
        L.append(f"file '{fr[-1][1].as_posix()}'"); (s.dir / "l.txt").write_text("\n".join(L), encoding="utf-8")
        out = OUT / f"{s.name}.mp4"
        subprocess.run([FF, "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(s.dir / "l.txt"), "-vf", "fps=30,scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p", "-c:v", "libx264", "-crf", "16", str(out)], check=True)
        shutil.rmtree(s.dir, ignore_errors=True); d = round(fr[-1][0] - fr[0][0], 2) if len(fr) > 1 else 0
        log(f"  clip {s.name}: ~{d}s", s.marks); return {"file": out.name, "dur": d, **s.marks}
async def cur(p): await p.evaluate(CUR)
async def move(p, x, y, ms=600):
    await cur(p); x0, y0 = await p.evaluate("[__cur.x,__cur.y]")
    if x0 < 0: x0, y0 = x + 120, y + 160
    n = max(int(ms / 16), 1)
    for i in range(1, n + 1):
        t = i / n; e = t * t * (3 - 2 * t); await p.evaluate(f"__cur.set({x0 + (x - x0) * e},{y0 + (y - y0) * e})"); await asyncio.sleep(ms / 1000 / n)
async def tap(p, loc, ms=700, click=True):
    b = await loc.bounding_box(); x, y = b["x"] + b["width"] / 2, b["y"] + b["height"] / 2
    await move(p, x, y, ms); await asyncio.sleep(0.15); await p.evaluate("__cur.tap()")
    if click: await loc.click(force=True)
    await p.mouse.move(2, 2)
async def scroll(p, dy, ms=1200):
    n = max(int(ms / 16), 1); done = 0
    for i in range(1, n + 1):
        t = i / n; e = t * t * (3 - 2 * t); tg = dy * e; await p.evaluate(f"window.scrollBy(0,{tg - done})"); done = tg; await asyncio.sleep(ms / 1000 / n)
async def den_sang(p):
    # đảm bảo đèn đang SÁNG trước khi quay các trang con (đèn nhớ trong sessionStorage)
    if await p.evaluate("document.documentElement.dataset.lamp") == "off":
        await p.evaluate("sessionStorage.setItem('qtt-lamp','on')"); await p.reload(); await p.wait_for_timeout(1000)
def get(path):
    return json.loads(urllib.request.urlopen(BASE + path, timeout=30).read().decode("utf-8"))
def sh(cmd, cwd=ROOT, check=True):
    log("  $", cmd); r = subprocess.run(cmd, cwd=str(cwd), shell=True, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.stdout.strip(): log(r.stdout.strip()[-600:])
    if check and r.returncode: log(r.stderr.strip()[-800:]); raise SystemExit("Lỗi lệnh: " + cmd)
    return r
def prepare_server():
    log("1/4 Tạo database thử trên máy (.state-v04)")
    shutil.rmtree(STATE, ignore_errors=True)
    sh(f'npx wrangler d1 execute quantritute-db --local --file=schema.sql --persist-to "{STATE}" --config dev.wrangler.jsonc')
    log("2/4 Bật website thử cổng 8788")
    proc = subprocess.Popen(f'npx wrangler pages dev --port 8788 --persist-to "{STATE}" --d1 DB=00000000-0000-0000-0000-000000000000', cwd=str(ROOT / "site"), shell=True,
                            stdout=open(OUT / "_server.log", "w", encoding="utf-8"), stderr=subprocess.STDOUT)
    for i in range(60):
        try: get("/api/site"); break
        except Exception: time.sleep(2)
    else: raise SystemExit("Website thử không lên được, xem quay\\_server.log")
    log("3/4 Nạp dữ liệu minh họa Bảng ghim")
    sh(f'npx wrangler d1 execute quantritute-db --local --file=seed-v04.sql --persist-to "{STATE}" --config dev.wrangler.jsonc')
    time.sleep(2); site = get("/api/site"); ok = [t for t in site["tools"] if t.get("status") == "ok"]
    log("   Công cụ Active:", [t["slug"] for t in ok]); log("   Bảng ghim:", [(n["board_title"], n["status"]) for n in get("/api/board")["items"]])
    if len(ok) < 2: log("   ⚠ Chưa đủ 2 công cụ Active, sẽ quay tiếp nhưng cần kiểm tra hình.")
    return proc
async def main():
    proc = prepare_server(); marks = {}
    try:
        async with async_playwright() as pw:
            br = await pw.chromium.launch(channel="chrome", headless=True)
            ctx = await br.new_context(viewport={"width": VW, "height": VH}, device_scale_factor=DPR, locale="vi-VN")
            p = await ctx.new_page(); R = Rec(p)
            log("4/4 Quay")
            # --- c1: trang chủ, kéo dây bật đèn
            try:
                await p.goto(BASE + "/"); await p.evaluate("sessionStorage.setItem('qtt-lamp','off')"); await p.reload(); await p.wait_for_timeout(1500); await R.start("c1-trang-chu"); await cur(p); await p.wait_for_timeout(1500)
                R.mark("keo_day"); await tap(p, p.locator(".pullcord:not(.m-cord)").first, 900); await p.wait_for_timeout(3000); R.mark("sang")
                marks["c1"] = await R.stop()
            except Exception as e: log("  ⚠ c1 lỗi:", e); marks["c1"] = {"loi": str(e)}
            # --- c2: Bộ công cụ, mở 2 công cụ
            try:
                await p.goto(BASE + "/cong-cu"); await p.wait_for_selector("[data-tool]", timeout=20000); await den_sang(p); await p.wait_for_selector("[data-tool]", timeout=20000); await p.wait_for_timeout(1200)
                await R.start("c2-bo-cong-cu"); await cur(p); await p.wait_for_timeout(1500)
                tab = p.get_by_role("tab", name=re.compile("Tất cả")).first
                if await tab.count() == 0: tab = p.get_by_text("Tất cả", exact=True).first
                if await tab.count(): await tap(p, tab, 700); await p.wait_for_timeout(1200)
                for slug, key in (("tra-cuu-van-ban", "cam_nang"), ("van-ban-hang-loat", "van_ban")):
                    c = p.locator(f'[data-tool="{slug}"]:visible').first; await tap(p, c, 800); R.mark(key + "_mo"); await p.wait_for_timeout(3200)
                    go = p.locator(".bk-go:visible").first
                    if await go.count(): await tap(p, go, 700, click=False); await p.wait_for_timeout(1200)
                    await p.keyboard.press("Escape"); await p.wait_for_timeout(900)
                marks["c2"] = await R.stop()
            except Exception as e: log("  ⚠ c2 lỗi:", e); marks["c2"] = {"loi": str(e)}
            # --- c3: Bảng ghim
            try:
                await p.goto(BASE + "/bang-ghim"); await p.wait_for_selector(".pnote", timeout=20000); await den_sang(p); await p.wait_for_selector(".pnote", timeout=20000); await p.wait_for_timeout(1200)
                await R.start("c3-bang-ghim"); await cur(p); await p.wait_for_timeout(2500); R.mark("toan_bang")
                notes = p.locator(".pnote:visible"); n = await notes.count()
                if n: await tap(p, notes.nth(n - 1), 900, click=False); await p.wait_for_timeout(2500)
                marks["c3"] = await R.stop()
            except Exception as e: log("  ⚠ c3 lỗi:", e); marks["c3"] = {"loi": str(e)}
            await br.close()
        (OUT / "quay-marks.json").write_text(json.dumps(marks, ensure_ascii=False, indent=1), encoding="utf-8")
        log("HOÀN TẤT quay → ", OUT)
    finally:
        subprocess.run(f"taskkill /PID {proc.pid} /T /F", shell=True, capture_output=True)
if __name__ == "__main__":
    try: asyncio.run(main())
    except SystemExit as e: log(str(e)); sys.exit(1)
