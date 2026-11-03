// Chụp ảnh minh họa bài hướng dẫn (dữ liệu mẫu giả trong công cụ) → _t9/anh-luu-file-mem.png
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1140, height: 860 }, deviceScaleFactor: 1 });
  await p.goto('file://' + path.resolve(__dirname, '../build/index.html'));
  await p.click('.hz [data-a="sample"]');
  await p.waitForFunction(() => window.__IP.S.rows && window.__IP.S.rows.length === 14 && window.__IP.S.items.length === 16, { timeout: 30000 });
  await p.evaluate(() => window.__IP.goStep(2));
  await p.waitForFunction(() => window.__IP.S.matched && !window.__IP.S.busy, { timeout: 60000 });
  await p.evaluate(() => window.__IP.goStep(3)); await p.click('#bSkip'); await p.waitForTimeout(400);
  await p.evaluate(() => { const c = document.querySelector('#c6'), hd = document.querySelector('.ip-top'); scrollTo(0, c.getBoundingClientRect().top + scrollY - hd.offsetHeight - 10); });
  await p.waitForTimeout(400);
  await p.waitForTimeout(4600); await p.evaluate(() => { document.querySelector('#toasts').innerHTML = ''; document.querySelector('.dom-fab').style.display = 'none'; });
  await p.screenshot({ path: path.join(__dirname, '_t9/anh-luu-file-mem.png') });
  console.log(await p.$$eval('.nm-pv div', d => d.map(x => x.textContent)));
  await b.close();
})();
