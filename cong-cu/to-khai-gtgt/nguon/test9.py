import asyncio, json
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1280,'height':900})
        errs=[]; pg.on('pageerror', lambda e: errs.append(str(e))); got=[]
        async def h(route):
            got.append(json.loads(route.request.post_data)); await route.fulfill(status=201, content_type='application/json', body='{"ok":true,"message":"Cảm ơn anh/chị đã góp ý! Đốm sẽ xem và phản hồi sớm."}')
        await pg.route('**/api/feedback', h)
        await pg.goto('http://127.0.0.1:8765/tools/to-khai-gtgt/')
        await pg.click('#fb-open'); await pg.click('#fb-stars button[data-n="4"]'); await pg.click('#fb-types button:nth-child(2)')
        await pg.fill('#fb-content','Thêm xuất file nhập MISA'); await pg.fill('#fb-name','Nguyễn Văn A')
        await pg.screenshot(path='s13.png')
        await pg.click('#fb-send'); await pg.wait_for_timeout(500)
        print(await pg.inner_text('#fb-msg')); print(got)
        print('ERR', errs); await b.close()
asyncio.run(main())
