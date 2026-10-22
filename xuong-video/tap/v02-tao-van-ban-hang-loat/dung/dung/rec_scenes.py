import asyncio, base64, json, sys, os
sys.path.insert(0,os.path.dirname(__file__))
from rec_lib import *
URL="file:///home/claude/v02/cong-cu/tao-van-ban-hang-loat/app/index.html"
M="/home/claude/v02/mau-video/"; D="/home/claude/v02/cong-cu/tao-van-ban-hang-loat/du-lieu-thu/"
MOCK="""window.__written=[];window.showDirectoryPicker=async()=>({name:'VanBan',queryPermission:async()=>'granted',requestPermission:async()=>'granted',
getFileHandle:async(nm)=>({createWritable:async()=>{const ch=[];return{write:async d=>{ch.push(d)},close:async()=>{const buf=new Uint8Array(await new Blob(ch).arrayBuffer());let s='';for(let i=0;i<buf.length;i+=8192)s+=String.fromCharCode.apply(null,buf.subarray(i,i+8192));window.__written.push({name:nm,b64:btoa(s)})}}}}),
removeEntry:async()=>{}});"""
HIDE="""(()=>{const s=document.createElement('style');s.textContent='.tip,.toast{transition:none}';document.head.appendChild(s)})()"""
async def newpage(b,mock=False):
    ctx=await b.new_context(viewport={"width":VW,"height":VH},device_scale_factor=DPR,accept_downloads=True)
    if mock: await ctx.add_init_script(MOCK)
    p=await ctx.new_page(); await p.goto(URL); await p.wait_for_timeout(1500); return ctx,p
async def example(p):
    await p.get_by_text("Thử ngay với ví dụ").first.click(); await p.wait_for_timeout(2500)
async def hold(s): await asyncio.sleep(s)
async def drag_frame(p,x0,y0,x1,y1,ms=900):
    await move(p,x0,y0,500); await p.mouse.move(x0,y0); await p.mouse.down()
    n=int(ms/16)
    for i in range(1,n+1):
        t=i/n; e=t*t*(3-2*t); x=x0+(x1-x0)*e; y=y0+(y1-y0)*e
        await p.mouse.move(x,y); await p.evaluate(f"__cur.set({x},{y})"); await asyncio.sleep(0.016)
    await p.mouse.up()
async def main(which):
    meta={}
    async with async_playwright() as pw:
        b=await pw.chromium.launch()
        if "s1" in which:
            ctx,p=await newpage(b); await cur(p); r=Rec(p); await r.start("s1-trang-dau"); await hold(1.2)
            await hl(p,"Xử lý 100% trên máy bạn"); r.mark("hl_local"); await hold(0.8)
            btn=p.get_by_text("Thử ngay với ví dụ").first
            await tap(p,btn,ms=1000); r.mark("click"); await hold(2.4); meta["s1"]=await r.stop(); await ctx.close()
        if "s2" in which:
            ctx,p=await newpage(b); await example(p); await cur(p); r=Rec(p); await r.start("s2-ghep"); await hold(0.8)
            # (1) hai thứ: file mẫu + danh sách -> thanh bước
            await hl(p,"mau-phieu-luong.docx"); r.mark("m1"); await hold(0.9)
            await hl(p,"8 dòng · 25 cột"); await hold(1.2)
            # (2) file mẫu: cuộn tới trang mẫu
            pg=p.locator("text=Trang mẫu").first; bb=await pg.bounding_box(); await scroll(p,bb["y"]-90,1500); r.mark("m2"); await hold(0.4)
            plus=p.get_by_role("button",name="+",exact=True).first
            await tap(p,plus,ms=500); await hold(1.8)
            # (3) danh sách
            await scroll(p,-2000,1100); r.mark("m3"); await hold(0.3)
            sel=p.locator("select:visible").first; await tap(p,sel,ms=700,click=False,hover=True); await hold(0.9)
            chips=p.locator("[draggable='true']:visible"); n=await chips.count(); print("chips",n)
            await tap(p,chips.nth(2),ms=700,hover=True); await hold(1.0)
            # (4) tự nối
            await hl(p,"Nhận diện 24 ký hiệu, 24 đã khớp tên cột."); r.mark("m4"); await hold(2.0)
            # (5) kéo thả + định dạng
            r.mark("m5")
            chip=p.locator("[draggable='true']:visible",has_text="Mã NV").first; cb=await chip.bounding_box()
            slot=p.locator(".slot:visible").first; sb=await slot.bounding_box()
            await move(p,cb["x"]+cb["width"]/2,cb["y"]+cb["height"]/2,700); await p.mouse.move(cb["x"]+cb["width"]/2,cb["y"]+cb["height"]/2)
            await p.evaluate("__cur.tap()"); await p.mouse.down()
            for i in range(1,41):
                t=i/40; e=t*t*(3-2*t); x=cb["x"]+cb["width"]/2+(sb["x"]+60-cb["x"]-cb["width"]/2)*e; y=cb["y"]+cb["height"]/2+(sb["y"]+30-cb["y"]-cb["height"]/2)*e
                await p.mouse.move(x,y); await p.evaluate(f"__cur.set({x},{y})"); await asyncio.sleep(0.018)
            await p.mouse.up(); r.mark("dropped"); await hold(1.2)
            s8=await p.locator('.slot:visible').nth(8).bounding_box(); await scroll(p,s8['y']-520,1300); await hold(0.3)
            fmt=p.locator(".slot:visible").nth(8).locator("select").nth(1); await tap(p,fmt,ms=800,hover=True); r.mark("fmt"); await hold(2.0)
            meta["s2"]=await r.stop(); await ctx.close()
        if "s3" in which:
            ctx,p=await newpage(b); await example(p); await cur(p); r=Rec(p); await r.start("s3-xemthu"); await hold(0.6)
            await tap(p,p.get_by_text("Xem thử →").first,ms=800); r.mark("enter"); await hold(2.2)
            nxt=p.get_by_text("Sau ›").first
            await tap(p,nxt,ms=700); r.mark("n1"); await hold(1.3); await tap(p,nxt,ms=250); r.mark("n2"); await hold(1.3)
            await scroll(p,380,1400); r.mark("scroll"); await hold(1.2); await scroll(p,-380,900); await hold(0.2)
            await tap(p,p.get_by_text("Xuất file →").first,ms=800); r.mark("to_export"); await hold(1.0)
            meta["s3"]=await r.stop(); await ctx.close()
        if "s4" in which:
            ctx,p=await newpage(b,mock=True); await example(p)
            await p.get_by_text("Xem thử →").first.click(); await p.wait_for_timeout(1500)
            await p.get_by_text("Xuất file →").first.click(); await p.wait_for_timeout(1200)
            await cur(p); r=Rec(p); await r.start("s4-xuat"); await hold(0.8)
            await tap(p,p.get_by_text("Word .docx").first,ms=700,hover=True); r.mark("fmt"); await hold(0.9)
            card=p.get_by_text("Mỗi dòng một file · lưu vào một thư mục").first
            await tap(p,card,ms=800); r.mark("way"); await hold(1.2)
            await hl(p,"mau-phieu-luong_Nguyen_Van_An.docx"); r.mark("name"); await hold(1.2)
            await tap(p,p.get_by_text("Tạo 8 bản và tải về").last,ms=900); r.mark("click"); await hold(1.5)
            await p.mouse.move(2,2); r.mark("done"); await hold(2.6)
            meta["s4"]=await r.stop()
            w=await p.evaluate("window.__written"); print("written",[x["name"] for x in w])
            os.makedirs("/tmp/v02/out",exist_ok=True)
            for x in w: open("/tmp/v02/out/"+x["name"],"wb").write(base64.b64decode(x["b64"]))
            await ctx.close()

        async def flow_ban_scan(name,mau,ds,frames,tag):
            ctx,p=await newpage(b); await cur(p); r=Rec(p); await r.start(name); await hold(0.9)
            await p.set_input_files("input[type=file]",mau); await p.wait_for_timeout(2600); r.mark("up1"); await hold(1.6)
            await tap(p,p.get_by_text("Tiếp tục: Danh sách →").first,ms=800); await p.wait_for_timeout(600)
            await p.set_input_files("input[type=file]",ds); await p.wait_for_timeout(1800); r.mark("up2"); await hold(1.0)
            await tap(p,p.get_by_text("Tiếp tục: Ghép trường →").first,ms=800); await p.wait_for_timeout(2600); r.mark("ghep"); await hold(1.0)
            cv=p.locator("canvas:visible").first; await cv.scroll_into_view_if_needed(); await p.wait_for_timeout(500)
            for i,(fx0,fy0,fx1,fy1,col) in enumerate(frames):
                bb=await cv.bounding_box()
                await drag_frame(p,bb["x"]+bb["width"]*fx0,bb["y"]+bb["height"]*fy0,bb["x"]+bb["width"]*fx1,bb["y"]+bb["height"]*fy1,ms=900)
                await hold(0.9); r.mark(f"frame{i}")
                sel=p.locator("select:visible").nth(1); await tap(p,sel,ms=600,click=False,hover=True)
                await sel.select_option(label=col); await hold(1.2); r.mark(f"col{i}")
            await tap(p,p.get_by_text("Xem thử →").first,ms=900); await p.wait_for_timeout(2500); r.mark("xemthu"); await hold(2.0)
            nxt=p.get_by_text("Sau ›").first; await tap(p,nxt,ms=800); r.mark("n1"); await hold(1.4); await tap(p,nxt,ms=250); r.mark("n2"); await hold(2.2)
            meta[tag]=await r.stop()
            await p.screenshot(path=f"/tmp/v02/web/{tag}-xemthu.png"); await ctx.close()
        if "s5" in which:
            await flow_ban_scan("s5-scan",M+"giay-chung-nhan-ban-scan.pdf",M+"ds-chung-nhan.xlsx",[(.315,.36,.88,.435,"Họ và tên"),(.235,.595,.645,.66,"Số hiệu")],"s5")
        if "s6" in which:
            await flow_ban_scan("s6-thiep",M+"thu-moi-hoi-nghi.png",M+"ds-khach-moi.xlsx",[(.315,.395,.87,.46,"Họ và tên"),(.315,.49,.87,.552,"Đơn vị")],"s6")
        await b.close()
    old={}
    if os.path.exists(f"{OUT}/meta.json"): old=json.load(open(f"{OUT}/meta.json"))
    old.update(meta); json.dump(old,open(f"{OUT}/meta.json","w"),indent=1)
if __name__=="__main__": asyncio.run(main(sys.argv[1:]))
