// node kiem-thu/t9-doi-ten-giao-dien.js (chạy ở thư mục nguon, sau node build.js)
// Giả lập file MISA tải về (tên dính liền) cho trang tính 2604 của bảng kê mẫu + 1 PDF thật, rồi đổi tên & tải ZIP.
const { chromium } = require('playwright');
const { PDFDocument, StandardFonts } = require('pdf-lib');
const fs = require('fs'), path = require('path');
global.fflate = require('fflate');
const E = require('../src/engine.js');
const OUT = path.join(__dirname, '_t9'); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(path.join(OUT, 'pdf'), { recursive: true });
(async () => {
  const XL = path.join(__dirname, 'Bảng kê hóa đơn đầu vào.xlsx');
  const sh = E.readXlsx(new Uint8Array(fs.readFileSync(XL))), s = sh.find(x => x.name === '2604');
  const hr = E.findHeaderRow(s.aoa), rows = E.buildRows(s.aoa, hr, E.guessCols(s.aoa[hr]));
  const files = [];
  for (const r of rows) {
    if (r.kh === 'C26TAB' && r.so === '98') continue; // dùng PDF thật
    const d = await PDFDocument.create(), f = await d.embedFont(StandardFonts.Helvetica), pg = d.addPage([595, 842]);
    pg.drawText('HOA DON (DU LIEU GIA) ' + r.khRaw + ' ' + r.so, { x: 50, y: 780, size: 12, font: f });
    const ten = E.boDauGiu(r.ten).toLowerCase().replace(/[^a-z0-9]/g, '');
    const nd = E.parseNgay(r.ngay);
    const nm = r.mst + '_' + (r.mau || '1') + '_' + r.khRaw + '_' + String(r.so).padStart(8, '0') + '_' + (nd ? nd.d + nd.m + nd.y : '') + '_' + ten + '.pdf';
    const p = path.join(OUT, 'pdf', nm); fs.writeFileSync(p, await d.save()); files.push(p);
  }
  files.push(path.join(__dirname, '0110928376_1_C26TAB_00000098_25042026_congtytnhhviethailogistics.pdf'));
  console.log('PDF:', files.length, '· dòng trang 2604:', rows.length);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto('file://' + path.resolve(__dirname, '../build/index.html'));
  await p.evaluate(() => window.__IP.goStep(1));
  await p.setInputFiles('#fPdf', files);
  const XLA = path.join(OUT, 'bang-ke.xlsx'); fs.copyFileSync(XL, XLA); // Playwright không nạp được đường dẫn có dấu
  await p.setInputFiles('#fList', XLA);
  await p.waitForTimeout(3000); console.log('trạng thái', await p.evaluate(() => [document.querySelector('#toasts').textContent,!!window.__IP.S.list, window.__IP.S.items.length]), errs);
  await p.waitForFunction(() => window.__IP.S.list && window.__IP.S.items.length > 0, { timeout: 20000 });
  const si = await p.evaluate(() => window.__IP.S.list.sheets.findIndex(x => x.name === '2604'));
  console.log('si', si, await p.evaluate(() => [window.__IP.S.list.si, !!document.querySelector('#lSheet'), document.querySelector('#st1').hidden]));
  await p.click('[data-a="sh-none"]'); await p.check(`[data-sh="${si}"]`);
  await p.selectOption('#lSheet', String(si));
  await p.waitForTimeout(500);
  console.log('sau chọn', await p.evaluate(() => window.__IP.S.list.si));
  await p.waitForFunction(() => window.__IP.S.list.sheets[window.__IP.S.list.si].name === '2604', { timeout: 5000 });
  console.log('cột:', JSON.stringify(await p.evaluate(() => window.__IP.S.list.cols)));
  await p.evaluate(() => window.__IP.goStep(2));
  await p.waitForFunction(() => window.__IP.S.matched && !window.__IP.S.busy, { timeout: 60000 });
  console.log('khớp:', JSON.stringify(await p.evaluate(() => window.__IP.counts())));
  await p.evaluate(() => window.__IP.goStep(4));
  await p.evaluate(() => document.querySelector('#c6').scrollIntoView());
  await p.screenshot({ path: path.join(OUT, 'c6-sang.png') });
  console.log('xem trước:', await p.$$eval('.nm-pv div', d => d.map(x => x.textContent)));
  // tải ZIP mặc định
  let [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-a="ren-zip"]')]);
  await dl.saveAs(path.join(OUT, 'mac-dinh.zip'));
  // bỏ dấu + bỏ dấu cách
  await p.check('#nmBoDau'); await p.check('#nmNoSpace');
  console.log('bỏ dấu + cách:', await p.$$eval('.nm-pv div', d => d.slice(0, 2).map(x => x.textContent)));
  [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-a="ren-zip"]')]);
  await dl.saveAs(path.join(OUT, 'bo-dau.zip'));
  // đổi thứ tự: đưa Tên công ty lên đầu, nhớ thiết lập sau khi tải lại trang
  await p.uncheck('#nmNoSpace');
  await p.click('.nm-parts li:nth-child(5) [data-d="-1"]');
  console.log('đổi thứ tự:', await p.$eval('.nm-pv div', d => d.textContent));
  await p.click('[data-a="nm-reset"]');
  await p.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); });
  await p.evaluate(() => document.querySelector('#c6').scrollIntoView());
  await p.screenshot({ path: path.join(OUT, 'c6-toi.png') });
  await p.setViewportSize({ width: 390, height: 900 });
  await p.evaluate(() => document.querySelector('#c6').scrollIntoView());
  await p.screenshot({ path: path.join(OUT, 'c6-dt.png') });
  console.log('tràn ngang ĐT:', await p.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  // bước 4 → nút đổi tên
  await p.setViewportSize({ width: 1440, height: 1000 });
  await p.evaluate(() => window.__IP.goStep(3)); await p.click('#bMerge'); await p.waitForFunction(() => window.__IP.S.lots.length > 0 && !window.__IP.S.busy, { timeout: 60000 });
  await p.click('#r4 [data-a="go-ren"]'); await p.waitForTimeout(400);
  console.log('nút ở bước 4 về đúng thẻ:', await p.evaluate(() => window.__IP.S.step === 4 && !document.querySelector('#c6').closest('section').hidden && window.__IP.S.lots.length > 0));
  console.log('LỖI TRANG:', errs);
  await b.close();
})();
