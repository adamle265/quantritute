// Kéo thả đổi thứ tự trang tính (lưới nhiều cột) – thư mục mẫu anh gửi (9 PDF + bảng kê 18 trang)
const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../build/index.html'));
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('#home [data-a="pick-dir"]')]);
  await fc.setFiles(process.env.D || '/home/claude/w/mau'); await p.waitForTimeout(2500);
  const ord = () => p.evaluate(() => { const L = window.__IP.S.list; return L.ord.map(i => L.sheets[i].name).join(',') + ' | dòng đầu: ' + window.__IP.S.rows[0].sheet; });
  console.log('trước:', await ord());
  await p.evaluate(() => { const r = document.querySelector('.shl').getBoundingClientRect(); scrollBy(0, r.top - 210); });
  const drag = async (fromSel, toSel, after) => {
    const a = await (await p.$(fromSel + ' .chk b')).boundingBox(), t = await (await p.$(toSel)).boundingBox();
    const x1 = a.x + 10, y1 = a.y + a.height / 2, x2 = after ? t.x + t.width - 8 : t.x + 8, y2 = t.y + t.height / 2;
    await p.mouse.move(x1, y1); await p.mouse.down();
    for (let k = 1; k <= 12; k++) await p.mouse.move(x1 + (x2 - x1) * k / 12, y1 + (y2 - y1) * k / 12);
    return async () => { await p.mouse.up(); await p.waitForTimeout(300); };
  };
  // kéo trang 2604 (thứ 8) lên vị trí đầu (trước HD_khac)
  let up = await drag('.shl li:nth-child(8)', '.shl li:nth-child(1)', false);
  await p.screenshot({ path: path.join(__dirname, '_t9/keo-tha-sheet.png') }); await up();
  console.log('2604 lên đầu:', await ord());
  // kéo trang đầu (2604) ra sau trang cuối
  up = await drag('.shl li:nth-child(1)', '.shl li:last-child', true); await up();
  console.log('2604 xuống cuối:', await ord());
  // bấm tick (không kéo) vẫn bỏ chọn được
  await p.click('.shl li:nth-child(1) .chk b'); await p.waitForTimeout(200);
  console.log('bỏ tick trang đầu:', await p.evaluate(() => window.__IP.S.list.sheets.filter(s => s.on).length));
  console.log('ERR', errs); await b.close();
})();
