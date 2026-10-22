# Quay lại cảnh web v04 (bản 2) trong máy ảo: web local (wrangler + bản sao D1), Chromium headless, CDP screencast
import asyncio, base64, os, re, shutil, subprocess, sys, time, json
from pathlib import Path
from playwright.async_api import async_playwright
H = Path.home(); OUT = H / "work/b4/rec"; OUT.mkdir(parents=True, exist_ok=True)
BASE = "http://127.0.0.1:8788"; VW, VH, DPR = 1160, 1315, 1.5
FS = H / "work/chr/node_modules/@fontsource"
ONLY = sys.argv[1:] or ["a", "b", "c", "d"]
def font_css():
    parts = []
    for pkg, ws in [("lexend", [300, 500, 600]), ("patrick-hand", [400]), ("be-vietnam-pro", [400, 500, 600, 700]), ("ibm-plex-mono", [400, 500]), ("noto-color-emoji", [400])]:
        for w in ws:
            css = (FS / pkg / f"{w}.css").read_text(encoding="utf-8")
            parts.append(css.replace("url(./files/", f"url(https://fonts.local/{pkg}/files/"))
    return "\n".join(parts)
FCSS = font_css()
CUR = r"""(()=>{if(document.getElementById('__cur'))return;const s=document.createElement('style');s.textContent=`#__cur{position:fixed;left:0;top:0;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;background:rgba(255,255,255,.55);border:3px solid rgba(60,40,20,.9);box-shadow:0 2px 10px rgba(0,0,0,.35);z-index:2147483647;pointer-events:none;transition:transform .12s}.__rip{position:fixed;width:26px;height:26px;margin:-13px 0 0 -13px;border-radius:50%;border:3px solid #e8a33c;z-index:2147483646;pointer-events:none;animation:__r .6s ease-out forwards}@keyframes __r{to{transform:scale(2.8);opacity:0}}`;document.head.appendChild(s);const c=document.createElement('div');c.id='__cur';document.body.appendChild(c);
window.__cur={x:-50,y:-50,set(x,y){this.x=x;this.y=y;c.style.left=x+'px';c.style.top=y+'px'},tap(){c.style.transform='scale(.7)';setTimeout(()=>c.style.transform='',150);const r=document.createElement('div');r.className='__rip';r.style.left=this.x+'px';r.style.top=this.y+'px';document.body.appendChild(r);setTimeout(()=>r.remove(),650)}};
document.addEventListener('click',e=>{const a=e.target.closest('a[target=_blank]');if(a)e.preventDefault()},true);window.open=()=>null;})()"""
class Rec:
    def __init__(s, p): s.p = p
    async def start(s, name):
        s.name = name; s.dir = OUT / f"_f-{name}"; shutil.rmtree(s.dir, ignore_errors=True); s.dir.mkdir(parents=True); s.frames = []; s.marks = {}; s.t0 = None
        s.cdp = await s.p.context.new_cdp_session(s.p); s.cdp.on("Page.screencastFrame", s._on)
        await s.cdp.send("Page.startScreencast", {"format": "jpeg", "quality": 88, "maxWidth": int(VW * DPR), "maxHeight": int(VH * DPR)}); await asyncio.sleep(0.5)
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
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(s.dir / "l.txt"), "-vf", "fps=30,scale=1160:1314,format=yuv420p", "-c:v", "libx264", "-crf", "16", "-preset", "veryfast", str(out)], check=True)
        shutil.rmtree(s.dir, ignore_errors=True); d = round(end - fr[0][0], 2)
        print(f"clip {s.name}: {d}s frames={len(fr)}", s.marks, flush=True); return {"file": out.name, "dur": d, **s.marks}
async def cur(p): await p.evaluate(CUR)
async def move(p, x, y, ms=600):
    await cur(p); x0, y0 = await p.evaluate("[__cur.x,__cur.y]")
    if x0 < 0: x0, y0 = x + 140, y + 180
    n = max(int(ms / 16), 1)
    for i in range(1, n + 1):
        t = i / n; e = t * t * (3 - 2 * t); await p.evaluate(f"__cur.set({x0 + (x - x0) * e},{y0 + (y - y0) * e})"); await asyncio.sleep(ms / 1000 / n)
async def tap(p, loc, ms=700, click=True, dy=0):
    b = await loc.bounding_box(); x, y = b["x"] + b["width"] / 2, b["y"] + b["height"] / 2 + dy
    await move(p, x, y, ms); await asyncio.sleep(0.12)
    if click: await p.evaluate("__cur.tap()"); await loc.click(force=True)
    await p.mouse.move(2, 2)
async def newpage(br):
    ctx = await br.new_context(viewport={"width": VW, "height": VH}, device_scale_factor=DPR, locale="vi-VN")
    await ctx.add_init_script("try{sessionStorage.setItem('qtt-lamp','on')}catch(e){};document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.textContent='select,option{font-family:var(--f-body),\\'Noto Color Emoji\\' !important}';document.head.appendChild(s)})")
    async def fcss(route): await route.fulfill(status=200, content_type="text/css", body=FCSS)
    async def ffile(route):
        u = route.request.url.split("fonts.local/")[1]; pkg, _, fn = u.split("/", 2)
        await route.fulfill(status=200, content_type="font/woff2", body=(FS / pkg / "files" / fn).read_bytes())
    await ctx.route(re.compile(r"https://fonts\.googleapis\.com/.*"), fcss)
    await ctx.route(re.compile(r"https://fonts\.local/.*"), ffile)
    await ctx.route(re.compile(r"https://(www\.googletagmanager|static\.cloudflareinsights)\..*"), lambda r: r.abort())
    return await ctx.new_page()
async def main():
    marks = {}
    async with async_playwright() as pw:
        br = await pw.chromium.launch(executable_path=str(H / "tmp/chromium"), args=["--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--font-render-hinting=none"])
        p = await newpage(br); R = Rec(p)
        if "a" in ONLY or "b" in ONLY:
            await p.goto(BASE + "/cong-cu?nhom=ke-toan"); await p.wait_for_selector("[data-tool]", timeout=20000); await p.wait_for_timeout(2500)
        if "a" in ONLY:
            await R.start("q2-a-tabs"); await cur(p); await p.wait_for_timeout(900); R.mark("t0")
            cards = p.locator("[data-tool]:visible"); n = await cards.count()
            if n > 2: await tap(p, cards.nth(2), 900, click=False)
            await p.wait_for_timeout(900)
            for k in ["hanh-chinh", "khoi-nghiep", "hoc-tap"]:
                await tap(p, p.locator(f'[data-tab="{k}"]').first, 650); R.mark(k); await p.wait_for_timeout(1500)
                cs = p.locator("[data-tool]:visible")
                if await cs.count(): await tap(p, cs.first, 600, click=False)
                await p.wait_for_timeout(500)
            marks["a"] = await R.stop()
        if "b" in ONLY:
            await R.start("q2-b-noibat"); await cur(p); await p.wait_for_timeout(500)
            await tap(p, p.locator('[data-tab="noi-bat"]').first, 700); R.mark("noibat"); await p.wait_for_timeout(1300)
            cn = p.locator('[data-tool="tra-cuu-van-ban"]:visible').first; vb = p.locator('[data-tool="van-ban-hang-loat"]:visible').first
            await tap(p, cn, 800, click=False); await p.wait_for_timeout(1000); await tap(p, vb, 800, click=False); await p.wait_for_timeout(1000)
            R.mark("cn_click"); await tap(p, cn, 700); R.mark("cn_mo"); await p.wait_for_timeout(2800)
            await p.keyboard.press("Escape"); await p.wait_for_timeout(700)
            R.mark("vb_click"); await tap(p, vb, 700); R.mark("vb_mo"); await p.wait_for_timeout(2300)
            go = p.locator(".bk-go:visible").first
            if await go.count(): await tap(p, go, 700, click=False); R.mark("free")
            await p.wait_for_timeout(2600)
            marks["b"] = await R.stop(); await p.keyboard.press("Escape")
        if "c" in ONLY:
            await p.goto(BASE + "/bang-ghim"); await p.wait_for_selector(".pnote", timeout=20000); await p.wait_for_timeout(2500)
            await R.start("q2-c-bangghim"); await cur(p); await p.wait_for_timeout(1000); R.mark("t0")
            v = p.locator('[data-vote]:visible').first
            await tap(p, v, 900); R.mark("vote"); await p.wait_for_timeout(1500)
            await tap(p, p.locator(".bg-cta").first, 700); R.mark("dx_mo"); await p.wait_for_timeout(800)
            ta = p.locator("#dm-o-pain"); await ta.click(); 
            await p.keyboard.type("Mỗi tháng em gộp file chấm công của 5 chi nhánh thành 1 bảng lương, mất trọn buổi chiều.", delay=26); R.mark("dx_go_xong")
            await p.wait_for_timeout(300); await tap(p, p.locator('.dom-m-card button[type=submit]').first, 600); R.mark("dx_gui")
            try: await p.wait_for_selector(".dom-msg.toast", timeout=8000); R.mark("dx_ok")
            except Exception as e: print("!! không thấy thông báo gửi", e)
            await p.wait_for_timeout(1500)
            marks["c"] = await R.stop()
            print("msg:", await p.locator(".dom-msg").first.inner_text())
        if "d" in ONLY:
            p2 = await newpage(br); R2 = Rec(p2)
            await p2.goto(BASE + "/cong-cu/van-ban-hang-loat"); await p2.wait_for_selector(".bk-sug", timeout=20000); await p2.wait_for_timeout(2500)
            await R2.start("q2-d-gopy"); await cur(p2); await p2.wait_for_timeout(700); R2.mark("t0")
            await tap(p2, p2.locator(".bk-sug:visible").first, 800); R2.mark("gy_mo"); await p2.wait_for_timeout(800)
            await p2.locator("#dm-o-pain").click()
            await p2.keyboard.type("Cho phép xuất thẳng từng văn bản ra file PDF để gửi luôn.", delay=26); R2.mark("gy_go_xong")
            await p2.wait_for_timeout(300); await tap(p2, p2.locator('.dom-m-card button[type=submit]').first, 600); R2.mark("gy_gui")
            try: await p2.wait_for_selector(".dom-msg.toast", timeout=8000); R2.mark("gy_ok")
            except Exception as e: print("!! không thấy thông báo gửi", e)
            await p2.wait_for_timeout(1500)
            marks["d"] = await R2.stop()
            print("msg:", await p2.locator(".dom-msg").first.inner_text())
        await br.close()
    old = {}
    mf = OUT / "marks.json"
    if mf.exists(): old = json.loads(mf.read_text())
    old.update(marks); mf.write_text(json.dumps(old, ensure_ascii=False, indent=1))
asyncio.run(main())
