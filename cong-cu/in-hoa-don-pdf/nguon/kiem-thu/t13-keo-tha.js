// Kéo thả đổi thứ tự các phần trong tên file (chuột) – dữ liệu mẫu giả
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../build/index.html'));
  await p.evaluate(() => { try { localStorage.removeItem('ip-nm'); } catch (e) {} });
  await p.click('.hz [data-a="sample"]');
  await p.waitForFunction(() => window.__IP.S.rows && window.__IP.S.rows.length === 14 && window.__IP.S.items.length === 16, { timeout: 30000 });
  await p.evaluate(() => window.__IP.goStep(2));
  await p.waitForFunction(() => window.__IP.S.matched && !window.__IP.S.busy, { timeout: 60000 });
  await p.evaluate(() => window.__IP.goStep(3)); await p.click('#bSkip'); await p.waitForTimeout(300);
  const nm = () => p.$eval('.nm-pv div', d => d.textContent);
  console.log('trước:', await nm());
  // kéo "Tên công ty" (dòng 5) lên đầu
  const src = await p.$('.nm-parts li:nth-child(5) .chk span'), dst = await p.$('.nm-parts li:nth-child(1)');
  await src.scrollIntoViewIfNeeded();
  const a = await src.boundingBox(), t = await dst.boundingBox();
  await p.mouse.move(a.x + 30, a.y + a.height / 2); await p.mouse.down();
  for (let k = 1; k <= 10; k++) await p.mouse.move(a.x + 30, a.y + a.height / 2 + (t.y + 4 - (a.y + a.height / 2)) * k / 10);
  await p.screenshot({ path: path.join(__dirname, '_t9/keo-tha.png') });
  await p.mouse.up(); await p.waitForTimeout(200);
  console.log('sau kéo Tên công ty lên đầu:', await nm());
  // bấm vào nhãn (không kéo) vẫn tích/bỏ được
  await p.click('.nm-parts li:nth-child(2) .chk span'); await p.waitForTimeout(150);
  console.log('bấm bỏ tích STT:', await nm());
  // kéo xuống cuối: dòng 1 (Tên công ty) xuống dưới dòng cuối
  const s2 = await (await p.$('.nm-parts li:nth-child(1) .chk span')).boundingBox(), last = await (await p.$('.nm-parts li:last-child')).boundingBox();
  await p.mouse.move(s2.x + 30, s2.y + 8); await p.mouse.down();
  for (let k = 1; k <= 12; k++) await p.mouse.move(s2.x + 30, s2.y + 8 + (last.y + last.height - 2 - s2.y - 8) * k / 12);
  await p.mouse.up(); await p.waitForTimeout(200);
  console.log('thứ tự phần:', await p.$$eval('.nm-parts li .chk span', d => d.map(x => x.textContent.trim()).join(' | ')));
  console.log('tên:', await nm());
  console.log('ERR', errs); await b.close();
})();
