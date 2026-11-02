import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page()
        await pg.goto('file:///home/claude/tk/build/index.html')
        await pg.evaluate("document.getElementById('p1').hidden=true;document.getElementById('p2').hidden=false;document.getElementById('b-main').hidden=false;document.getElementById('tay-box').hidden=false")
        d=pg.locator('#ty-ngay input')
        for seq in ['01072026','5102026','31/1/2026','1.12.2026']:
            for i in range(3): await d.nth(i).fill('')
            await d.nth(0).click(); await pg.keyboard.type(seq, delay=30)
            print(seq,'->',[await d.nth(i).input_value() for i in range(3)])
        await b.close()
asyncio.run(main())
