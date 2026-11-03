// File ZIP chứa cả PDF và Excel (nén cả thư mục) → nhận PDF + danh sách
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  for (const z of (process.env.Z || '/home/claude/w/zt/mot-excel.zip,/home/claude/w/zt/hai-excel.zip').split(',')) {
    const b = await chromium.launch(); const p = await b.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + path.resolve(__dirname, '../build/index.html'));
    const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('#home [data-a="home-pick"]')]);
    await fc.setFiles(z); await p.waitForTimeout(3000);
    console.log(path.basename(z), await p.evaluate(() => { const S = window.__IP.S; return { pdf: S.items.length, list: S.list && S.list.name, khac: S.list && (S.list.alts || []).map(f => f.name), dong: S.rows && S.rows.length, view: S.view, step: S.step }; }), 'ERR', errs);
    await b.close();
  }
})();
