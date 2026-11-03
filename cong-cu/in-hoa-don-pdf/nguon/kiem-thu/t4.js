const { chromium } = require('playwright');const fs=require('fs');
(async()=>{ const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1300,height:900}});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+process.cwd()+'/nguon/build/index.html');
 const files=fs.readdirSync('big/pdf').map(f=>'big/pdf/'+f);
 let t=Date.now(); await p.setInputFiles('#fPdf',files); await p.waitForFunction(n=>window.__IP.S.items.length===n,files.length,{timeout:120000}); console.log('load',files.length,(Date.now()-t)/1000);
 await p.setInputFiles('#fList','big/ds.xlsx'); await p.waitForFunction(()=>window.__IP.S.rows&&window.__IP.S.rows.length===2000);
 t=Date.now(); await p.evaluate(()=>window.__IP.goStep(2)); await p.waitForFunction(()=>window.__IP.S.matched&&!window.__IP.S.busy,{timeout:600000}); console.log('match',(Date.now()-t)/1000, await p.evaluate(()=>window.__IP.counts()));
 t=Date.now(); await p.click('#bMerge'); await p.waitForFunction(()=>window.__IP.S.lots.length>0&&!window.__IP.S.busy,{timeout:600000});
 console.log('merge',(Date.now()-t)/1000, await p.evaluate(()=>window.__IP.S.lots.map(l=>l.pages+'p/'+l.count).join(' ')));
 // kiểm tra thứ tự: lô 3 trang đầu phải là STT 201
 const b64=await p.evaluate(async()=>{ const u=new Uint8Array(await window.__IP.S.lots[2].blob.arrayBuffer()); let s=''; for(let i=0;i<u.length;i+=32768) s+=String.fromCharCode.apply(null,u.subarray(i,i+32768)); return btoa(s); });
 fs.writeFileSync('lot3.pdf',Buffer.from(b64,'base64')); console.log('ERR',errs); await b.close(); })();
