const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 })).newPage();
 await p.goto('http://localhost:8765/og/og-cong-cu.html'); await p.waitForTimeout(1000); await p.screenshot({ path: '/home/claude/w/pub/og/cc2x.png' });
 const d = JSON.stringify([['0.1.1','Tổng quan','06/11/2026','xong'],['0.2.1','Nhân sự','07/11/2026','xong'],['0.3.1','Chấm công','đang làm','dang']]);
 await p.goto('http://localhost:8765/og/og-lich-su.html?d=' + encodeURIComponent(d)); await p.waitForTimeout(1000); await p.screenshot({ path: '/home/claude/w/pub/og/ls2x.png' });
 await b.close(); })();
