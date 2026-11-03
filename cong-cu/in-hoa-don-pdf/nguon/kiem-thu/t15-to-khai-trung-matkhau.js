// Góp ý 03/11 15:07: (1) dòng tờ khai nhập khẩu (số 12 chữ số) giữ STT + khớp file tờ khai; (2) file trùng / mật khẩu / ngoài danh sách vẫn tải về với chữ đầu tên
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const D = process.env.D || '/home/claude/w/mau2', OUT = path.join(__dirname, '_t9');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 1000 }, acceptDownloads: true });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../build/index.html'));
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('#home [data-a="pick-dir"]')]);
  await fc.setFiles(D); await p.waitForTimeout(2500);
  console.log('trang tính:', await p.evaluate(() => window.__IP.S.list.sheets.map(s => s.name + ':' + s.n + (s.on ? '' : '(bỏ)')).join(' ')));
  await p.click('[data-a="sh-none"]');
  for (const n of ['TKHQ', '2604']) { const i = await p.evaluate(n => window.__IP.S.list.sheets.findIndex(s => s.name === n), n); await p.check(`[data-sh="${i}"]`); }
  console.log('dòng:', await p.evaluate(() => window.__IP.S.rows.map((r, i) => (i + 1) + ':' + r.sheet + ':' + r.so + (r.long ? '(dài)' : '') + (r.noSo ? '(không số)' : '')).slice(0, 6).join(' | ')), '… tổng', await p.evaluate(() => window.__IP.S.rows.length));
  await p.evaluate(() => window.__IP.goStep(2));
  await p.waitForFunction(() => window.__IP.S.matched && !window.__IP.S.busy, { timeout: 90000 });
  console.log('khớp:', JSON.stringify(await p.evaluate(() => window.__IP.counts())));
  console.log('file:', await p.evaluate(() => window.__IP.S.items.map(it => it.name.slice(0, 40) + ' → ' + it.status + (it.row != null ? ' STT' + (it.row + 1) : '') + (it.err ? ' [' + it.err + ']' : '')).join('\n   ')));
  await p.evaluate(() => window.__IP.goStep(3)); await p.click('#bSkip'); await p.waitForTimeout(300);
  console.log('đếm:', await p.$eval('.nm-acts .pill', e => e.textContent));
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-a="ren-zip"]')]);
  await dl.saveAs(path.join(OUT, 'gop-y-1507.zip'));
  console.log('ERR', errs); await b.close();
})();
