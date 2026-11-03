const { chromium } = require('playwright');
(async()=>{
 const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1440,height:1000}});
 const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push('console: '+m.text()); });
 await p.goto('file://'+process.cwd()+'/nguon/build/index.html');
 await p.click('.hz [data-a="sample"]');
 await p.waitForFunction(()=>window.__IP.S.rows&&window.__IP.S.rows.length===14&&window.__IP.S.items.length===16,{timeout:30000});
 await p.evaluate(()=>window.__IP.goStep(2));
 await p.waitForFunction(()=>window.__IP.S.matched&&!window.__IP.S.busy,{timeout:60000});
 const res=await p.evaluate(()=>{ const S=window.__IP.S; return {counts:window.__IP.counts(), rows:S.rows.map(r=>[r.i+1,r.kh,r.so, r.item!=null? S.items.find(i=>i.id===r.item).name+' | '+S.items.find(i=>i.id===r.item).level+' | '+S.items.find(i=>i.id===r.item).why:'—']), free:S.items.filter(i=>i.status!=='khop').map(i=>i.name+' : '+i.status+(i.scan?' scan':''))}; });
 console.log(JSON.stringify(res,null,1));
 await p.screenshot({path:'s1.png',fullPage:false});
 await p.click('#oCover'); await p.click('#oMiss'); await p.click('#oDup');
 await p.selectOption('#oLot','50');
 await p.click('#bMerge');
 await p.waitForFunction(()=>window.__IP.S.lots.length>0&&!window.__IP.S.busy,{timeout:60000});
 const lots=await p.evaluate(()=>window.__IP.S.lots.map(l=>({name:l.name,pages:l.pages,count:l.count,size:l.size})));
 console.log(lots);
 // save lot to disk
 const b64=await p.evaluate(async()=>{ const u=new Uint8Array(await window.__IP.S.lots[0].blob.arrayBuffer()); let s=''; for(let i=0;i<u.length;i+=32768) s+=String.fromCharCode.apply(null,u.subarray(i,i+32768)); return btoa(s); });
 require('fs').writeFileSync('lot1.pdf',Buffer.from(b64,'base64'));
 await p.evaluate(()=>document.querySelector('#c3').scrollIntoView());
 await p.screenshot({path:'s2.png',fullPage:true});
 console.log('ERR',errs);
 await b.close();
})();
