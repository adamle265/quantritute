import asyncio, json, time, base64
from playwright.async_api import async_playwright
SRC=open('build/hd-panel.bundle.js').read()
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); ctx=await b.new_context()
    async def h(route): await route.fulfill(status=200, content_type='text/html', body='<html><body></body></html>')
    await ctx.route('https://hoadondientu.gdt.gov.vn/**', h)
    pg=await ctx.new_page(); await pg.goto('https://hoadondientu.gdt.gov.vn/x'); await pg.add_script_tag(content=SRC); await pg.wait_for_timeout(300)
    sr=pg.locator('#qtt-hd-host'); v=lambda: sr.locator('#dtu').input_value()
    await sr.locator('[data-db=dtu] [data-p=d]').click(); await pg.keyboard.type('01072026'); print('go lien 01072026 ->', await v(), '| focus o:', await pg.evaluate("document.querySelector('#qtt-hd-host').shadowRoot.activeElement.getAttribute('aria-label')"))
    await sr.locator('[data-db=dtu] [data-p=m]').dblclick(); await pg.keyboard.type('09'); print('nhay dup thang, go 09 ->', await v())
    await sr.locator('[data-db=dtu] [data-p=y]').click(); await pg.keyboard.type('2025'); print('bam nam, go 2025 ->', await v())
    await sr.locator('[data-db=dden] [data-p=d]').click(); await pg.keyboard.type('5'); print('den: go 5 ->', await sr.locator('#dden').input_value())
    await b.close()
asyncio.run(main())
