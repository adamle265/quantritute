// Bảng kê nhiều trang tính: tick sẵn, bỏ chọn tất cả, chọn vài trang, đổi thứ tự, khớp 9 PDF thật (thư mục mẫu anh gửi)
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const D = process.env.D || '/home/claude/w/mau';
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../build/index.html'));
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('#home [data-a="pick-dir"]')]);
  await fc.setFiles(D); await p.waitForTimeout(2500);
  const st = () => p.evaluate(() => { const L = window.__IP.S.list; return { on: L.sheets.filter(s => s.on).map(s => s.name).join(','), rows: window.__IP.S.rows.length, cur: L.sheets[L.si].name }; });
  console.log('mặc định:', await st());
  await p.evaluate(() => document.querySelector('#c2').scrollIntoView()); await p.screenshot({ path: path.join(__dirname, '_t9/sheet-mac-dinh.png') });
  await p.click('[data-a="sh-none"]'); console.log('bỏ chọn tất cả:', await st());
  const idx = await p.evaluate(() => window.__IP.S.list.sheets.findIndex(s => s.name === '2604'));
  await p.check(`[data-sh="${idx}"]`); console.log('chỉ 2604:', await st());
  const i2 = await p.evaluate(() => window.__IP.S.list.sheets.findIndex(s => s.name === '2605'));
  await p.check(`[data-sh="${i2}"]`); console.log('2604+2605 (2605 đứng trước trong file):', await st(), await p.evaluate(() => window.__IP.S.rows[0].sheet));
  await p.evaluate(() => window.__IP.goStep(2));
  await p.waitForFunction(() => window.__IP.S.matched && !window.__IP.S.busy, { timeout: 60000 });
  console.log('khớp:', JSON.stringify(await p.evaluate(() => window.__IP.counts())));
  await p.evaluate(() => window.__IP.goStep(3)); await p.click('#bSkip'); await p.waitForTimeout(300);
  console.log('nút Chỉ lưu file mềm → bước', await p.evaluate(() => window.__IP.S.step), '| thẻ hiện:', await p.isVisible('#c6'));
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(200); await p.screenshot({ path: path.join(__dirname, '_t9/buoc4-chua-ghep.png') });
  console.log('tên mới:', await p.$$eval('.nm-pv div', d => d.slice(0, 3).map(x => x.textContent)));
  await p.setViewportSize({ width: 390, height: 900 }); await p.evaluate(() => window.__IP.goStep(1));
  await p.evaluate(() => document.querySelector('.shl').scrollIntoView()); await p.screenshot({ path: path.join(__dirname, '_t9/sheet-dt.png') });
  console.log('tràn ngang ĐT:', await p.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  console.log('ERR', errs); await b.close();
})();
