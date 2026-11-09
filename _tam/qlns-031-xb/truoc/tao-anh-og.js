const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 })).newPage();
 await p.goto('http://localhost:8765/og/og.html?v=0.2.1&m=' + encodeURIComponent('Module Nhân sự') + '&img=shot-021.png'); await p.waitForTimeout(1000);
 await p.screenshot({ path: '/home/claude/w/pub/og/og2x.png' }); await b.close(); })();
