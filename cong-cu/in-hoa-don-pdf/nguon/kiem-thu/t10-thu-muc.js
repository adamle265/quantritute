// Tái hiện: chọn cả thư mục (input webkitdirectory) ở trang đầu và ở bước 1
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const H = process.env.H || path.resolve(__dirname, '../build/index.html'), D = process.env.D || '/home/claude/w/mau';
  const b = await chromium.launch(); const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + H);
  // 1) nút "Chọn cả thư mục PDF" ở trang đầu
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('#home [data-a="pick-dir"]')]);
  console.log('hộp chọn: thư mục?', fc.element() && await fc.element().evaluate(e => e.id + ' webkitdirectory=' + e.webkitdirectory));
  await fc.setFiles(D);
  await p.waitForTimeout(2500);
  console.log('trang đầu → items', await p.evaluate(() => window.__IP.S.items.length), '| list', await p.evaluate(() => !!window.__IP.S.list), '| toast:', await p.evaluate(() => document.querySelector('#toasts').textContent), '| view', await p.evaluate(() => window.__IP.S.view));
  console.log('danh sách:', await p.evaluate(() => window.__IP.S.list && [window.__IP.S.list.name, (window.__IP.S.list.alts||[]).map(f => f.name), window.__IP.S.rows.length]));
  if (await p.$('[data-a="alt-list"]')) { await p.click('[data-a="alt-list"]'); await p.waitForTimeout(800);
    console.log('đổi file:', await p.evaluate(() => [window.__IP.S.list.name, window.__IP.S.list.alts.map(f => f.name), window.__IP.S.rows.length]));
    await p.click('[data-a="alt-list"]'); await p.waitForTimeout(800);
    console.log('đổi lại:', await p.evaluate(() => [window.__IP.S.list.name, window.__IP.S.list.alts.map(f => f.name)])); }
  await p.evaluate(() => document.querySelector('#c2').scrollIntoView()); await p.screenshot({ path: path.join(__dirname, '_t9/hai-excel.png') });
  console.log('ERR', errs);
  await b.close();
})();
