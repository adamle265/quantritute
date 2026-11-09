/* ===== Lõi: đọc Excel, nhận diện bảng, ghép dữ liệu (không phụ thuộc giao diện) ===== */
'use strict';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const norm=s=>String(s??'').normalize('NFC').toLowerCase().replace(/\s+/g,' ').trim();
const fmt=n=>(n==null||isNaN(n))?'':Math.round(n).toLocaleString('vi-VN');
const fmtP=n=>(n==null||!isFinite(n))?'':(n*100).toFixed(1).replace('.',',')+'%';
const dmy=d=>d?d.slice(8,10)+'/'+d.slice(5,7)+'/'+d.slice(0,4):'';
const my=m=>m?m.slice(5,7)+'/'+m.slice(0,4):'';
const pad=n=>String(n).padStart(2,'0');
const ymd=(y,m,d)=>y+'-'+pad(m)+'-'+pad(d);
function num(v){
  if(v==null||v==='')return 0; if(typeof v==='number')return v;
  let s=String(v).trim().replace(/[₫\s]/g,'');
  if(/^-?\d{1,3}(\.\d{3})+$/.test(s)) s=s.replace(/\./g,''); else s=s.replace(/,/g,'');
  const n=Number(s); return isFinite(n)?n:0;
}
function toDate(v){
  if(v==null||v==='')return null; const s=String(v).trim(); let m;
  if((m=s.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/))) return ymd(+m[1],+m[2],+m[3]);
  if((m=s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/))) return ymd(+m[3],+m[2],+m[1]);
  if(/^\d+(\.\d+)?$/.test(s)){const n=+s; if(n>20000&&n<80000){const d=new Date(Date.UTC(1899,11,30)+Math.floor(n)*86400000);return ymd(d.getUTCFullYear(),d.getUTCMonth()+1,d.getUTCDate());}}
  return null;
}
const hhmm=v=>{const m=String(v||'').match(/(\d{1,2}):(\d{2})/);return m?pad(m[1])+':'+m[2]:'';};
const colName=n=>{let s='';while(n>0){const m=(n-1)%26;s=String.fromCharCode(65+m)+s;n=Math.floor((n-1)/26);}return s;};
const colNum=s=>{let n=0;for(const ch of s)n=n*26+(ch.charCodeAt(0)-64);return n;};
const cleanId=v=>String(v??'').trim().replace(/^'/,'');
const addDays=(d,n)=>{const x=new Date(d+'T00:00:00');x.setDate(x.getDate()+n);return ymd(x.getFullYear(),x.getMonth()+1,x.getDate());};

/* ---------- Đọc ZIP / XLSX (không dùng thư viện ngoài) ---------- */
async function inflateRaw(u8){
  const ds=new DecompressionStream('deflate-raw');
  return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(ds)).arrayBuffer());
}
async function openZip(buf){
  const u8=new Uint8Array(buf), dv=new DataView(buf), td=new TextDecoder('utf-8');
  let eocd=-1;
  for(let i=u8.length-22;i>=Math.max(0,u8.length-65557);i--){if(dv.getUint32(i,true)===0x06054b50){eocd=i;break;}}
  if(eocd<0) throw new Error('File không phải định dạng .xlsx hợp lệ');
  const n=dv.getUint16(eocd+10,true); let p=dv.getUint32(eocd+16,true);
  const map={};
  for(let k=0;k<n;k++){
    if(dv.getUint32(p,true)!==0x02014b50)break;
    const method=dv.getUint16(p+10,true), csize=dv.getUint32(p+20,true), nl=dv.getUint16(p+28,true), el=dv.getUint16(p+30,true), cl=dv.getUint16(p+32,true), off=dv.getUint32(p+42,true);
    const name=td.decode(u8.subarray(p+46,p+46+nl));
    map[name.toLowerCase()]={name,method,csize,off};
    p+=46+nl+el+cl;
  }
  return {
    names:Object.values(map).map(e=>e.name),
    async text(path){
      const e=map[path.toLowerCase()]; if(!e)return null;
      const lnl=dv.getUint16(e.off+26,true), lel=dv.getUint16(e.off+28,true);
      const start=e.off+30+lnl+lel, data=u8.subarray(start,start+e.csize);
      return td.decode(e.method===0?data:await inflateRaw(data));
    }
  };
}
const XML=s=>new DOMParser().parseFromString(s,'application/xml');
const els=(n,t)=>Array.from(n.getElementsByTagNameNS('*',t));
const kids=(n,t)=>Array.from(n.children).filter(e=>e.localName===t);
const RNS='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
function resolvePath(p){const out=[];for(const s of p.split('/')){if(s==='..')out.pop();else if(s&&s!=='.')out.push(s);}return out.join('/');}
/* Đọc từng ô thực tế: bỏ qua khai báo <dimension> (file sàn hay khai sai), không phụ thuộc cấu trúc <row> */
function parseSheetXml(xml,ss){
  const doc=XML(xml);
  const grid=[]; let maxR=0,maxC=0,cells=0,hiddenRows=0,precision=0,lastRow=0;
  const dimEl=els(doc,'dimension')[0]; const declared=dimEl?dimEl.getAttribute('ref'):'';
  for(const row of els(doc,'row')){
    const ra=parseInt(row.getAttribute('r'),10); const rIdx=isNaN(ra)?lastRow+1:ra; lastRow=rIdx;
    if(row.getAttribute('hidden')==='1'||row.getAttribute('hidden')==='true')hiddenRows++;
    let pos=0;
    for(const c of kids(row,'c')){
      const ref=c.getAttribute('r'); let col,r=rIdx;
      const m=ref&&ref.match(/^([A-Z]+)(\d+)$/);
      if(m){col=colNum(m[1]);r=+m[2];}else col=pos+1;
      pos=col;
      const t=c.getAttribute('t'); let v=null;
      if(t==='inlineStr'){v=els(c,'t').map(x=>x.textContent).join('');}
      else{const ve=kids(c,'v')[0]; if(ve){v=ve.textContent; if(t==='s')v=ss[+v]; else if(t==='b')v=v==='1'?'TRUE':'FALSE'; else if(!t||t==='n'){ if(/^\d(\.\d+)?E\+\d+$/i.test(v))precision++; }}}
      if(v==null||v==='')continue;
      (grid[r]||(grid[r]=[]))[col]=v; cells++;
      if(r>maxR)maxR=r; if(col>maxC)maxC=col;
    }
  }
  return {grid,maxR,maxC,cells,declared,actual:maxR?('A1:'+colName(maxC)+maxR):'',hiddenRows,precision};
}
function parseCsv(txt){
  const grid=[];let r=1,c=1,cur='',q=false,maxR=0,maxC=0,cells=0;
  const push=()=>{if(cur!==''){(grid[r]||(grid[r]=[]))[c]=cur;cells++;if(r>maxR)maxR=r;if(c>maxC)maxC=c;}cur='';};
  txt=txt.replace(/^﻿/,'');
  for(let i=0;i<txt.length;i++){const ch=txt[i];
    if(q){if(ch==='"'){if(txt[i+1]==='"'){cur+='"';i++;}else q=false;}else cur+=ch;}
    else if(ch==='"')q=true; else if(ch===','){push();c++;} else if(ch==='\n'){push();r++;c=1;} else if(ch!=='\r')cur+=ch;}
  push();
  return {grid,maxR,maxC,cells,declared:'',actual:maxR?('A1:'+colName(maxC)+maxR):'',hiddenRows:0,precision:0};
}
async function readWorkbook(file){
  const low=file.name.toLowerCase();
  if(low.endsWith('.csv'))return {sheets:[{name:'CSV',state:'visible',...parseCsv(await file.text())}]};
  if(low.endsWith('.xls'))throw new Error('Định dạng .xls cũ chưa hỗ trợ. Mở file bằng Excel và lưu lại dạng .xlsx.');
  const z=await openZip(await file.arrayBuffer());
  const wbXml=await z.text('xl/workbook.xml'); if(!wbXml)throw new Error('Không tìm thấy nội dung bảng tính trong file');
  const wb=XML(wbXml);
  const rels={}; const relsXml=await z.text('xl/_rels/workbook.xml.rels');
  if(relsXml)els(XML(relsXml),'Relationship').forEach(r=>rels[r.getAttribute('Id')]=r.getAttribute('Target'));
  const ssXml=await z.text('xl/sharedStrings.xml');
  const ss=ssXml?els(XML(ssXml),'si').map(si=>els(si,'t').filter(t=>!(t.parentNode&&t.parentNode.localName==='rPh')).map(t=>t.textContent).join('')):[];
  const sheets=[];
  for(const s of els(wb,'sheet')){
    const rid=s.getAttributeNS(RNS,'id')||s.getAttribute('r:id'); const target=rels[rid]; if(!target)continue;
    const path=resolvePath(target.startsWith('/')?target.slice(1):'xl/'+target);
    const xml=await z.text(path); if(!xml)continue;
    sheets.push({name:s.getAttribute('name'),state:s.getAttribute('state')||'visible',...parseSheetXml(xml,ss)});
  }
  return {sheets};
}

/* ---------- Nhận diện bảng theo tên cột ---------- */
const SCHEMAS=[
  {type:'order',label:'Đơn hàng (OrderSKUList)',req:['order id','order status','sku id','quantity','created time']},
  {type:'income',label:'Income – Chi tiết đơn hàng',req:['id đơn hàng/điều chỉnh','tổng số tiền quyết toán','tổng doanh thu','tổng phí']},
  {type:'wallet',label:'Income – Lịch sử rút tiền (ví)',req:['loại giao dịch','id tham chiếu','số tiền','trạng thái']},
  {type:'cost',label:'Giá vốn',req:['sku id'],any:['giá vốn'],not:['order status']},
];
function detectTable(sh){
  const lim=Math.min(sh.maxR,60);
  for(let r=1;r<=lim;r++){
    const row=sh.grid[r]; if(!row)continue;
    const hdr={}; row.forEach((v,c)=>{if(v!=null){const k=norm(v); if(k&&!(k in hdr))hdr[k]=c;}});
    const keys=Object.keys(hdr);
    for(const sc of SCHEMAS){
      if(!sc.req.every(k=>k in hdr))continue;
      if(sc.any&&!keys.some(k=>sc.any.some(a=>k.includes(a))))continue;
      if(sc.not&&sc.not.some(k=>k in hdr))continue;
      return {...sc,headerRow:r,hdr};
    }
  }
  return null;
}
function detectReport(sh){
  const kv={};
  for(let r=1;r<=sh.maxR;r++){const row=sh.grid[r]; if(!row)continue; const vals=row.filter(v=>v!=null&&v!==''); if(vals.length>=2)kv[norm(vals[0])]=vals[vals.length-1];}
  return ('tổng số tiền quyết toán' in kv&&'khoảng thời gian' in kv)?kv:null;
}
function records(sh,t){
  const out=[]; const cols=Object.entries(t.hdr);
  for(let r=t.headerRow+1;r<=sh.maxR;r++){
    const row=sh.grid[r]; if(!row)continue; const o={_r:r}; let any=false;
    for(const [k,c] of cols){const v=row[c]; if(v!=null&&v!==''){o[k]=v;any=true;}}
    if(any)out.push(o);
  }
  return out;
}
const OF={id:'order id',status:'order status',sub:'order substatus',ctype:'cancelation/return type',sku:'sku id',ssku:'seller sku',name:'product name',vari:'variation',qty:'quantity',rqty:'sku quantity of return',unit:'sku unit original price',bef:'sku subtotal before discount',pdisc:'sku platform discount',sdisc:'sku seller discount',amt:'order amount',refund:'order refund amount',created:'created time',shipped:'shipped time',tracking:'tracking id',carrier:'shipping provider name',delivered:'delivered time',cancelled:'cancelled time',cby:'cancel by',reason:'cancel reason',channel:'order channel',pay:'payment method'};
const FEE_TOP=[['phí giao dịch','Phí giao dịch'],['phí hoa hồng của tiktok shop','Phí hoa hồng sàn'],['phí vận chuyển của người bán','Phí vận chuyển (người bán chịu)'],['hoa hồng liên kết','Hoa hồng liên kết (affiliate)'],['hoa hồng liên kết quảng cáo cửa hàng','Hoa hồng quảng cáo cửa hàng'],['phí dịch vụ voucher xtra','Phí dịch vụ Voucher Xtra'],['phí dịch vụ flash sale','Phí dịch vụ Flash Sale'],['phí quảng cáo gmv max','Phí quảng cáo GMV Max'],['phí dịch vụ sfp','Phí dịch vụ SFP'],['phí vận hành logistic','Phí vận hành logistic'],['phí xử lý đơn hàng','Phí xử lý đơn hàng'],['thuế gtgt do tiktok shop khấu trừ','Thuế GTGT sàn khấu trừ'],['thuế tncn do tiktok shop khấu trừ','Thuế TNCN sàn khấu trừ']];

/* Đọc 1 file → đối tượng F (đơn, income, ví, báo cáo, giá vốn) */
async function parseFile(file,id){
  const F={id,name:file.name,size:file.size,sheets:[],orders:[],income:[],wallet:[],reports:[],cost:[],kinds:[],error:null,precision:0};
  try{
    const wb=await readWorkbook(file);
    for(const sh of wb.sheets){
      const t=detectTable(sh); const info={name:sh.name,state:sh.state,declared:sh.declared,actual:sh.actual,cells:sh.cells,hiddenRows:sh.hiddenRows,type:null,label:'Không dùng',headerRow:null,rows:0,skipped:0};
      F.precision+=sh.precision;
      if(t){
        info.type=t.type;info.label=t.label;info.headerRow=t.headerRow;
        const recs=records(sh,t);
        if(t.type==='order'){
          for(const r of recs){const o={};for(const k in OF)o[k]=r[OF[k]];o.id=cleanId(o.id);o.sku=cleanId(o.sku);
            if(!/^\d{6,}$/.test(o.id)){info.skipped++;if(/e\+/i.test(o.id))F.precision++;continue;}
            F.orders.push(o);}
        }else if(t.type==='income'){
          for(const r of recs){
            const idA=cleanId(r['id đơn hàng/điều chỉnh']), idB=cleanId(r['id đơn hàng liên quan']);
            if(!/\d{6,}/.test(idA)){info.skipped++;continue;}
            const sig=Object.keys(r).filter(k=>k!=='_r').sort().map(k=>k+'='+r[k]).join('|');
            const parts={}; for(const [k] of FEE_TOP)parts[k]=num(r[k]);
            F.income.push({fid:F.id,file:F.name,idA,key:/^\d{6,}$/.test(idB)?idB:idA,type:r['loại giao dịch']||'',cdate:toDate(r['thời gian tạo đơn hàng']),sdate:toDate(r['thời gian quyết toán đơn hàng']),settle:num(r['tổng số tiền quyết toán']),rev:num(r['tổng doanh thu']),gross:num(r['tổng phụ sau giảm giá của người bán']),refundSub:num(r['tổng phụ của khoản hoàn tiền sau giảm giá của người bán']),fee:num(r['tổng phí']),pdisc:num(r['giảm giá của nền tảng']),paid:num(r['khách thanh toán']),parts,sig});
          }
        }else if(t.type==='wallet'){
          for(const r of recs){const ref=cleanId(r['id tham chiếu']); if(!ref){info.skipped++;continue;}
            F.wallet.push({ref,type:norm(r['loại giao dịch']),rawType:r['loại giao dịch'],amount:num(r['số tiền']),status:norm(r['trạng thái']),date:toDate(r['thời gian thành công'])||toDate(r['thời gian yêu cầu']),bank:String(r['tài khoản ngân hàng']||'')});}
        }else if(t.type==='cost'){
          const hk=Object.keys(t.hdr); const costK=hk.find(k=>k.includes('giá vốn')); const nameK=hk.find(k=>k.includes('rút gọn'));
          for(const r of recs){const sku=cleanId(r['sku id']); if(!sku||r[costK]==null||r[costK]===''){info.skipped++;continue;} F.cost.push({sku,cost:num(r[costK]),name:nameK?String(r[nameK]||''):''});}
        }
        info.rows=recs.length-info.skipped;
        if(!F.kinds.includes(t.label))F.kinds.push(t.label);
      }else{
        const rep=detectReport(sh); if(rep){info.type='report';info.label='Income – Báo cáo tổng (kiểm tra tổng)';F.reports.push(rep);}
      }
      F.sheets.push(info);
    }
    if(!F.kinds.length)F.error='Không nhận diện được bảng dữ liệu nào. Cần file Đơn hàng, file Income xuất từ TikTok Shop, hoặc file Giá vốn có cột "SKU ID" và "Giá vốn".';
  }catch(e){F.error=e.message||String(e);}
  return F;
}

/* ---------- Phân loại đơn ---------- */
function classify(o){
  const st=norm(o.status), ct=norm(o.ctype);
  if(/return|refund|trả hàng|hoàn tiền/.test(ct))return 'return';
  if(/hủy|huỷ|cancel/.test(st))return 'cancel';
  if(/chờ thanh toán|unpaid|awaiting payment/.test(st))return 'unpaid';
  if(/chờ|awaiting|to ship|đang xử lý/.test(st)&&!o.delivered)return 'pending';
  return 'success';
}
const CLS={success:'Thành công',cancel:'Hủy',return:'Trả hàng',unpaid:'Chờ thanh toán',pending:'Đang xử lý',unknown:'—'};
const isEarn=w=>/earning|thu nhập|doanh thu/.test(w.type);
const isWd=w=>/withdraw|rút/.test(w.type);
const okSt=w=>/transferred|thành công|đã chuyển|completed|success/.test(w.status);

/* ---------- Ghép toàn bộ dữ liệu ---------- */
function rebuildData(files,opt){
  const rateOpt=opt||{};
  const W=[]; const good=files.filter(f=>!f.error);
  files.filter(f=>f.error).forEach(f=>W.push(['err','Không đọc được file "'+f.name+'"',f.error]));
  // Đơn hàng: 1 đơn có ở nhiều file → lấy bản trong file xuất sau (ngày đặt mới nhất)
  const oFiles=good.filter(f=>f.orders.length);
  oFiles.forEach(f=>f.maxCreated=f.orders.reduce((m,r)=>{const d=toDate(r.created);return d&&d>m?d:m;},''));
  const pick=new Map(); let multi=0, dupLine=0;
  for(const f of oFiles){
    const g=new Map(); const seenLine=new Set();
    for(const r of f.orders){if(!g.has(r.id))g.set(r.id,[]);g.get(r.id).push(r);const lk=r.id+'|'+r.sku;if(seenLine.has(lk))dupLine++;seenLine.add(lk);}
    for(const [id,rows] of g){const cur=pick.get(id); if(!cur)pick.set(id,{f,rows}); else{multi++; if(f.maxCreated>cur.f.maxCreated||(f.maxCreated===cur.f.maxCreated&&f.id>cur.f.id))pick.set(id,{f,rows});}}
  }
  if(multi)W.push(['info',multi+' đơn có ở nhiều file Đơn hàng','Lấy bản trong file xuất sau (trạng thái mới hơn). Không cộng trùng.']);
  if(dupLine)W.push(['warn',dupLine+' dòng trùng Order ID + SKU ID trong cùng một file Đơn hàng','Các dòng này vẫn được cộng. Kiểm tra lại file gốc nếu là lỗi xuất dữ liệu.']);
  const orders=new Map();
  for(const [id,{f,rows}] of pick){
    const r0=rows[0];
    const o={id,file:f.name,created:toDate(r0.created),createdFull:r0.created||'',delivered:toDate(r0.delivered),deliveredFull:r0.delivered||'',shipped:toDate(r0.shipped),tracking:r0.tracking?String(r0.tracking):'',carrier:r0.carrier||'',cancelled:toDate(r0.cancelled),status:r0.status||'',sub:r0.sub||'',ctype:r0.ctype||'',cby:r0.cby||'',reason:r0.reason||'',channel:r0.channel||'',pay:r0.pay||'',amt:num(r0.amt),refund:num(r0.refund),skus:[],qty:0,rqty:0,rev:0,pdisc:0};
    for(const r of rows){const bef=num(r.bef),sd=num(r.sdisc),q=num(r.qty);const l={sku:r.sku||'',ssku:r.ssku||'',name:r.name||'',vari:r.vari||'',qty:q,rqty:num(r.rqty),unit:num(r.unit),bef,sd,pd:num(r.pdisc),rev:bef-sd};o.skus.push(l);o.qty+=q;o.rqty+=l.rqty;o.rev+=l.rev;o.pdisc+=l.pd;}
    o.cls=classify(o);
    o.revNet=o.cls==='success'?o.rev:0;
    orders.set(id,o);
  }
  // Income (loại dòng trùng giữa các file chồng kỳ)
  const seen=new Map(); let dupX=0; const inc=[];
  for(const f of good)for(const r of f.income){const p=seen.get(r.sig); if(p!==undefined&&p!==f.id){dupX++;continue;} seen.set(r.sig,f.id); inc.push(r);}
  if(dupX)W.push(['info','Đã bỏ '+dupX+' dòng Income trùng giữa các file','Các file Income có kỳ chồng nhau; mỗi dòng chỉ tính một lần.']);
  // Ví
  const wMap=new Map(); good.forEach(f=>f.wallet.forEach(w=>{if(!wMap.has(w.ref))wMap.set(w.ref,w);}));
  const wallet=[...wMap.values()].sort((a,b)=>(a.date||'').localeCompare(b.date||''));
  const E_D={}; wallet.filter(w=>isEarn(w)&&okSt(w)&&w.date).forEach(w=>E_D[w.date]=(E_D[w.date]||0)+w.amount);
  const nonOk=wallet.filter(w=>!okSt(w)).length;
  if(nonOk)W.push(['info',nonOk+' giao dịch ví chưa ở trạng thái "Transferred"','Không tính vào tiền đã nhận.']);
  const S_D={}; inc.forEach(r=>{if(r.sdate)S_D[r.sdate]=(S_D[r.sdate]||0)+r.settle;});
  const hasWallet=wallet.length>0;
  for(const r of inc){
    const e=r.sdate?E_D[r.sdate]:undefined;
    if(e===undefined){r.recv=0;r.rs='none';}
    else if(Math.abs(e-S_D[r.sdate])<0.5){r.recv=r.settle;r.rs='ok';}
    else{r.recv=S_D[r.sdate]!==0?r.settle*e/S_D[r.sdate]:0;r.rs='mismatch';}
  }
  const orphan=Object.keys(E_D).filter(d=>S_D[d]===undefined).sort().map(d=>({date:d,amount:E_D[d]}));
  const dayMis=Object.keys(E_D).filter(d=>S_D[d]!==undefined&&Math.abs(E_D[d]-S_D[d])>=0.5).sort().map(d=>({date:d,earn:E_D[d],settle:S_D[d]}));
  const incBy=new Map();
  for(const r of inc){let g=incBy.get(r.key);if(!g){g={key:r.key,rows:[],settle:0,rev:0,gross:0,refundSub:0,fee:0,recv:0,pdisc:0,paid:0,parts:{},sdates:[],cdate:r.cdate,mismatch:false};incBy.set(r.key,g);}
    g.rows.push(r);g.settle+=r.settle;g.rev+=r.rev;g.gross+=r.gross;g.refundSub+=r.refundSub;g.fee+=r.fee;g.recv+=r.recv;g.pdisc+=r.pdisc;g.paid+=r.paid;
    for(const k in r.parts)g.parts[k]=(g.parts[k]||0)+r.parts[k];
    if(r.sdate&&!g.sdates.includes(r.sdate))g.sdates.push(r.sdate);
    if(r.rs==='mismatch')g.mismatch=true;
    if(!g.cdate&&r.cdate)g.cdate=r.cdate;}
  incBy.forEach(g=>g.sdates.sort());
  // Tỷ lệ phí thực tế bình quân (đơn thành công đã quyết toán)
  let fr=0,rr=0,nr=0;
  for(const o of orders.values()){const g=incBy.get(o.id);if(o.cls==='success'&&g&&g.rev>0){fr+=-g.fee;rr+=g.rev;nr++;}}
  const rate=rr?fr/rr:0;
  // Bản ghi đối chiếu
  const R=[];
  const mk=(o,g)=>{
    const x={id:o?o.id:g.key,o,g,date:o?o.created:g.cdate,cls:o?o.cls:'unknown'};
    x.rev=o?o.revNet:0; x.revOrder=o?o.rev:null; x.revInc=g?g.gross+g.refundSub:null;
    x.settle=g?g.settle:0; x.fee=g?-g.fee:0; x.recv=g?g.recv:0; x.unrecv=g?x.settle-x.recv:0;
    x.feeEst=0; x.expect=0; let dA=0,dB=0;
    if(o&&g&&o.cls==='success'){dA=o.rev-g.gross;} if(g&&g.mismatch)dB=x.unrecv;
    x.diffA=dA;x.diffB=dB;x.diff=dA+dB;
    if(!o){x.st='nomatch';x.note='Có trong Income nhưng không có trong file Đơn hàng đã nạp (thường là đơn đặt kỳ trước)';}
    else if(!g){
      if(o.cls==='success'){x.st='unsettled';x.feeEst=rate*o.revNet;x.expect=o.revNet-x.feeEst;x.note='Chưa có trong Income; phí và tiền dự kiến là ước tính';}
      else{x.st='match';x.note=o.cls==='cancel'?'Đơn hủy, chưa phát sinh quyết toán':o.cls==='return'?'Đơn trả hàng, chưa có dòng quyết toán':'Chưa phát sinh quyết toán';}
    }
    else if(Math.abs(dA)>=0.5){x.st='diff';x.note='Doanh thu file Đơn ('+fmt(o.rev)+') khác Income ('+fmt(g.gross)+')';}
    else if(g.mismatch){x.st='diff';x.note='Tiền vào ví ngày quyết toán không bằng tổng quyết toán ngày đó';}
    else if(Math.abs(x.unrecv)>=0.5){x.st='unpaid';x.note=hasWallet?'Chưa thấy tiền vào ví ngày '+g.sdates.map(dmy).join(', '):'Chưa nạp sheet Lịch sử rút tiền';}
    else{x.st='match';x.note=o.cls==='cancel'?(Math.abs(x.settle)>=0.5?'Đơn hủy, sàn trừ '+fmt(-x.settle)+'đ (giao thất bại)':'Đơn hủy, quyết toán 0đ'):o.cls==='return'?'Đơn trả hàng, quyết toán '+fmt(x.settle)+'đ':'';}
    return x;
  };
  for(const o of orders.values())R.push(mk(o,incBy.get(o.id)));
  for(const [k,g] of incBy)if(!orders.has(k))R.push(mk(null,g));
  R.sort((a,b)=>(b.date||'').localeCompare(a.date||'')||b.id.localeCompare(a.id));
  const byId=new Map(R.map(x=>[x.id,x]));
  // Đơn trả hàng sau khi đã giao (cần hóa đơn điều chỉnh)
  const RET=[];
  for(const o of orders.values()){
    if(!o.delivered)continue;
    const g=incBy.get(o.id);
    const sig=[]; if(o.cls==='return')sig.push('Loại: Return/Refund'); if(o.rqty>0)sig.push('Có số lượng trả'); if(g&&Math.abs(g.refundSub)>=0.5)sig.push('Income có hoàn tiền hàng');
    if(!sig.length)continue;
    const refRows=g?g.rows.filter(r=>Math.abs(r.refundSub)>=0.5):[];
    const retDate=refRows.length?refRows.map(r=>r.sdate).filter(Boolean).sort()[0]:(o.cancelled||null);
    const rqty=o.rqty, part=rqty>0&&rqty<o.qty;
    const value=g&&Math.abs(g.refundSub)>=0.5?Math.abs(g.refundSub):o.skus.reduce((s,l)=>s+(l.qty?l.rev*Math.min(l.rqty||l.qty,l.qty)/l.qty:0),0);
    RET.push({id:o.id,o,g,delivered:o.delivered,deliveredFull:o.deliveredFull,retDate,qty:o.qty,rqty:rqty||o.qty,part,value,sig});
  }
  RET.sort((a,b)=>(b.delivered||'').localeCompare(a.delivered||''));
  // Theo dõi hàng về kho: đơn hủy khi ĐVVC đã lấy hàng (giao thất bại) + đơn trả hàng/hoàn tiền. Đơn hủy chưa bàn giao ĐVVC không cần theo dõi.
  const KHO=[]; const retMap=new Map(RET.map(r=>[r.id,r]));
  for(const o of orders.values()){
    const g=incBy.get(o.id), ship=g?0-(g.parts['phí vận chuyển của người bán']||0)+0:null;
    let kind=null;
    if(o.cls==='cancel'&&(o.shipped||(ship!=null&&ship>=0.5)))kind='cancel';
    else if(o.cls!=='cancel'&&(o.cls==='return'||retMap.has(o.id)||(o.delivered&&o.rqty>0)))kind='return'; // đơn hủy: TikTok ghi cả SL trả = SL đặt, không phải hàng trả
    if(!kind)continue;
    const rr=retMap.get(o.id);
    const evt=kind==='cancel'?(o.cancelled||null):(rr&&rr.retDate)||o.cancelled||null;
    const partRet=kind==='return'&&o.skus.some(l=>l.rqty>0);
    const lines=o.skus.filter(l=>!partRet||l.rqty>0).map(l=>({name:l.name,vari:l.vari,sku:l.sku,qty:partRet?l.rqty:l.qty})); // trả một phần: chỉ liệt kê dòng hàng bị trả
    KHO.push({id:o.id,o,g,kind,date:o.created,evt,ship,lines,value:o.rev,qty:lines.reduce((s,l)=>s+l.qty,0)});
  }
  KHO.sort((a,b)=>(b.date||'').localeCompare(a.date||'')||b.id.localeCompare(a.id));
  // Cảnh báo
  const dimBad=[];
  for(const f of good)f.sheets.forEach(s=>{if(s.type&&s.declared&&s.actual&&s.declared!==s.actual)dimBad.push(f.name+' / '+s.name+': khai '+s.declared+', thực tế '+s.actual);});
  if(dimBad.length)W.push(['info',dimBad.length+' sheet khai báo sai vùng dữ liệu, công cụ đã tự quét đủ',dimBad.join(' ; ')+'. Các phần mềm đọc Excel thông thường sẽ chỉ thấy 1 dòng hoặc 1 cột ở các sheet này.']);
  for(const f of good)f.sheets.forEach(s=>{if(s.skipped&&s.type==='order')W.push(['info','File "'+f.name+'": bỏ qua '+s.skipped+' dòng không phải đơn hàng','Thường là dòng mô tả cột ngay dưới tiêu đề.']);});
  good.filter(f=>f.precision).forEach(f=>W.push(['err','File "'+f.name+'" có '+f.precision+' số dạng mũ (E+)','Order ID lưu dạng số sẽ mất chữ số cuối. Dùng file xuất gốc từ sàn, không mở rồi lưu lại bằng Excel.']));
  for(const f of good){
    if(!f.income.length||!f.reports.length)continue;
    const rep=f.reports[0]; const sum=a=>f.income.reduce((s,r)=>s+r[a],0);
    const chk=[['tổng số tiền quyết toán','settle','Tổng quyết toán'],['tổng doanh thu','rev','Tổng doanh thu'],['tổng phí','fee','Tổng phí']];
    const bad=chk.filter(([k,a])=>k in rep&&Math.abs(num(rep[k])-sum(a))>=0.5);
    if(bad.length)W.push(['err','File "'+f.name+'": số chi tiết không khớp sheet Báo cáo',bad.map(([k,a,l])=>l+': Báo cáo '+fmt(num(rep[k]))+' / chi tiết '+fmt(sum(a))).join(' ; ')]);
    else W.push(['ok','File "'+f.name+'": chi tiết khớp sheet Báo cáo (kỳ '+(rep['khoảng thời gian']||'')+')','Tổng quyết toán '+fmt(sum('settle'))+', doanh thu '+fmt(sum('rev'))+', phí '+fmt(sum('fee'))+'.']);
  }
  if(!oFiles.length)W.push(['warn','Chưa có file Đơn hàng','Cần file xuất từ TikTok Shop có sheet OrderSKUList.']);
  if(!inc.length)W.push(['warn','Chưa có file Income','Chưa đối chiếu được tiền quyết toán.']);
  if(inc.length&&!hasWallet)W.push(['warn','Chưa có dữ liệu Lịch sử rút tiền','Chưa xác định được tiền đã vào ví.']);
  const nm=R.filter(x=>x.st==='nomatch');
  if(nm.length)W.push(['info',nm.length+' dòng Income chưa có đơn tương ứng trong file Đơn hàng',nm.slice(0,8).map(x=>x.id).join(', ')+(nm.length>8?' …':'')+'. Thường là đơn đặt kỳ trước; nạp thêm file Đơn hàng kỳ đó nếu cần.']);
  const un=R.filter(x=>x.st==='unsettled');
  if(un.length){const d=un.map(x=>x.date).filter(Boolean).sort();W.push(['warn',un.length+' đơn thành công chưa có quyết toán (đặt '+dmy(d[0])+' – '+dmy(d[d.length-1])+')','Phí và lợi nhuận các đơn này dùng tỷ lệ phí ước tính '+fmtP(rate)+'. Nạp Income kỳ sau để thay bằng số thật.']);}
  if(orphan.length)W.push(['warn',orphan.length+' ngày có tiền vào ví nhưng chưa có dòng quyết toán trong Income',orphan.map(o=>dmy(o.date)+': '+fmt(o.amount)).join(' ; ')+'. Thường do file Income xuất trước khi sàn cập nhật ngày cuối kỳ.']);
  if(dayMis.length)W.push(['err',dayMis.length+' ngày tiền vào ví khác tổng quyết toán',dayMis.map(d=>dmy(d.date)+': ví '+fmt(d.earn)+' / quyết toán '+fmt(d.settle)).join(' ; ')]);
  const fails=R.filter(x=>x.o&&x.cls!=='success'&&x.g&&Math.abs(x.settle)>=0.5);
  if(fails.length)W.push(['info',fails.length+' đơn hủy/trả hàng vẫn phát sinh tiền quyết toán (tổng '+fmt(fails.reduce((s,x)=>s+x.settle,0))+'đ)','Ví dụ phí vận chuyển giao thất bại. Khoản này được tính vào Báo cáo lợi nhuận thành dòng "Phí đơn hủy/trả hàng".']);
  const dates=a=>a.filter(Boolean).sort();
  const oD=dates([...orders.values()].map(o=>o.created)), sD=dates(inc.map(r=>r.sdate)), wD=dates(wallet.map(w=>w.date));
  return {orders,inc,incBy,wallet,E_D,S_D,orphan,dayMis,R,byId,RET,KHO,W,hasWallet,rate,rateN:nr,cov:{o:[oD[0],oD[oD.length-1]],s:[sD[0],sD[sD.length-1]],w:[wD[0],wD[wD.length-1]]}};
}

/* ---------- Giá vốn: trực tiếp hoặc ghép từ thành phần ---------- */
// cost[sku] = {cost:number|null, name:'', parts:[{sku,q}]|null}
function unitsOf(vari){
  const s=norm(vari); let m=s.match(/(?:combo|bộ|set)\s*(\d+)/)||s.match(/(\d+)\s*(quyển|cuốn|hộp|chai|lọ|cái|gói|túi|bộ|set|sp|sản phẩm|hũ|tuýp|đôi|cặp)/);
  return m?Math.max(1,+m[1]):1;
}
function costOf(C,sku,depth){
  const c=C[sku]; if(!c)return null; depth=depth||0;
  if(c.parts&&c.parts.length&&depth<4){let s=0;for(const p of c.parts){const v=costOf(C,p.sku,depth+1);if(v==null)return null;s+=v*p.q;}return s;}
  return c.cost!=null&&c.cost!==''?+c.cost:null;
}
function collectSkus(orders){
  const m=new Map();
  for(const o of orders.values())for(const l of o.skus){
    let s=m.get(l.sku); if(!s){s={sku:l.sku,ssku:l.ssku,name:l.name,vari:l.vari,units:new Set(),qtyOk:0,qtyAll:0,orders:0};m.set(l.sku,s);}
    if(l.unit)s.units.add(l.unit); s.qtyAll+=l.qty; if(o.cls==='success'){s.qtyOk+=l.qty;s.orders++;} if(l.ssku)s.ssku=l.ssku; if(!s.vari&&l.vari)s.vari=l.vari;
  }
  const list=[...m.values()].sort((a,b)=>a.name.localeCompare(b.name,'vi')||unitsOf(a.vari)-unitsOf(b.vari)||b.qtyOk-a.qtyOk);
  list.forEach(s=>{s.n=unitsOf(s.vari);s.price=[...s.units][0]||0;});
  return list;
}
/* Gợi ý giá vốn cho SKU nhiều đơn vị (Combo 2 quyển…) từ SKU 1 đơn vị cùng tên sản phẩm */
function costHints(skus,C){
  const H={};
  for(const s of skus){
    if(s.n<2)continue;
    const base=skus.find(b=>b.name===s.name&&b.n===1&&costOf(C,b.sku)!=null); if(!base)continue;
    const c1=costOf(C,base.sku), want=c1*s.n, cur=costOf(C,s.sku);
    if(cur==null)H[s.sku]={type:'miss',want,base:base.sku,n:s.n,c1};
    else if(cur<want*0.8)H[s.sku]={type:'low',want,base:base.sku,n:s.n,c1};
  }
  return H;
}

/* ---------- Lợi nhuận ---------- */
function buildProfit(D,C,pname){
  const L=[];
  for(const x of D.R){
    if(!x.o)continue; const o=x.o;
    if(o.cls==='success'){
      const est=!x.g; const feeO=est?D.rate*o.rev:-x.g.fee;
      for(const l of o.skus){
        const share=o.rev?l.rev/o.rev:1/o.skus.length; const c=costOf(C,l.sku); const cogs=c==null?null:l.qty*c;
        const fee=feeO*share, profit=l.rev-(cogs||0)-fee;
        L.push({id:o.id,date:o.created,month:o.created?o.created.slice(0,7):'',sku:l.sku,name:pname(l),qty:l.qty,rev:l.rev,cogs,fee,profit,pct:l.rev?profit/l.rev:null,est,noCost:c==null,kind:'sale'});
      }
    }else if(x.g&&Math.abs(x.settle)>=0.5){
      // đơn hủy/trả hàng có tiền quyết toán (thường âm: phí giao thất bại, phí trả hàng)
      L.push({id:o.id,date:o.created,month:o.created?o.created.slice(0,7):'',sku:'',name:'Phí đơn hủy/trả hàng',qty:0,rev:0,cogs:0,fee:-x.settle,profit:x.settle,pct:null,est:false,noCost:false,kind:'fail'});
    }
  }
  return L;
}
function aggProfit(L,key){
  const m=new Map();
  for(const l of L){const k=key==='sku'&&l.kind==='fail'?'(phí đơn hủy/trả)':(l[key]||'');let a=m.get(k);if(!a){a={key:k,ids:new Set(),sku:l.sku,name:l.name,qty:0,rev:0,cogs:0,fee:0,profit:0,estIds:new Set(),noCost:0,fail:0};m.set(k,a);}
    if(l.kind==='sale')a.ids.add(l.id);a.qty+=l.qty;a.rev+=l.rev;a.cogs+=l.cogs||0;a.fee+=l.fee;a.profit+=l.profit;if(l.est)a.estIds.add(l.id);if(l.noCost)a.noCost++;if(l.kind==='fail')a.fail+=l.fee;}
  return [...m.values()].map(a=>({...a,n:a.ids.size,estN:a.estIds.size,pct:a.rev?a.profit/a.rev:null}));
}

/* ---------- Ví sàn theo ngày ---------- */
function walletDays(D,opening){
  const days=new Map();
  const g=d=>{let a=days.get(d);if(!a){a={date:d,earn:0,wd:0,other:0,settle:D.S_D[d]||0,list:[]};days.set(d,a);}return a;};
  for(const w of D.wallet){if(!w.date||!okSt(w))continue;const a=g(w.date);if(isEarn(w))a.earn+=w.amount;else if(isWd(w))a.wd+=w.amount;else a.other+=w.amount;a.list.push(w);}
  Object.keys(D.S_D).forEach(d=>g(d));
  const arr=[...days.values()].sort((a,b)=>a.date.localeCompare(b.date));
  let bal=opening||0; arr.forEach(a=>{a.open=bal;bal+=a.earn+a.wd+a.other;a.close=bal;});
  return arr;
}

/* ---------- Xuất Excel (tự viết, không cần thư viện) ---------- */
const CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
function crc32(u8){let c=0xFFFFFFFF;for(let i=0;i<u8.length;i++)c=CRC[(c^u8[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
function zipStore(files){
  const te=new TextEncoder(); const parts=[],central=[]; let off=0;
  for(const f of files){
    const name=te.encode(f.name), data=typeof f.data==='string'?te.encode(f.data):f.data, crc=crc32(data);
    const h=new DataView(new ArrayBuffer(30));h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint32(14,crc,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,name.length,true);
    parts.push(new Uint8Array(h.buffer),name,data);
    const c=new DataView(new ArrayBuffer(46));c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,name.length,true);c.setUint32(42,off,true);
    central.push(new Uint8Array(c.buffer),name);
    off+=30+name.length+data.length;
  }
  const csize=central.reduce((s,x)=>s+x.length,0);
  const e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,csize,true);e.setUint32(16,off,true);
  return new Blob([...parts,...central,new Uint8Array(e.buffer)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
}
const xesc=s=>String(s??'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* sheets: [{name, cols:[{t, w, type:'s'|'n'|'p'}], rows:[[...]]}] – cột chữ số dài (Order ID) để kiểu 's' */
function buildXlsx(sheets){
  const sx=sheets.map(sh=>{
    let x='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>'+sh.cols.map((c,i)=>'<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+(c.w||14)+'" customWidth="1"/>').join('')+'</cols><sheetData>';
    const all=[sh.cols.map(c=>c.t),...sh.rows];
    all.forEach((row,ri)=>{x+='<row r="'+(ri+1)+'">';row.forEach((v,ci)=>{const ref=colName(ci+1)+(ri+1);const tp=ri===0?'h':(sh.cols[ci]&&sh.cols[ci].type)||'s';
      if(v==null||v===''||(typeof v==='number'&&!isFinite(v)))return;
      if((tp==='n'||tp==='p')&&typeof v==='number'){x+='<c r="'+ref+'" s="'+(tp==='n'?2:3)+'"><v>'+(tp==='n'?Math.round(v*100)/100:v)+'</v></c>';}
      else x+='<c r="'+ref+'" t="inlineStr" s="'+(tp==='h'?1:0)+'"><is><t xml:space="preserve">'+xesc(v)+'</t></is></c>';});x+='</row>';});
    return x+'</sheetData>'+(sh.rows.length?'<autoFilter ref="A1:'+colName(sh.cols.length)+(sh.rows.length+1)+'"/>':'')+'</worksheet>';
  });
  const files=[
    {name:'[Content_Types].xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'+sheets.map((s,i)=>'<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>').join('')+'</Types>'},
    {name:'_rels/.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'},
    {name:'xl/workbook.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>'+sheets.map((s,i)=>'<sheet name="'+xesc(s.name.slice(0,31))+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>').join('')+'</sheets></workbook>'},
    {name:'xl/_rels/workbook.xml.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+sheets.map((s,i)=>'<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>').join('')+'<Relationship Id="rId'+(sheets.length+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'},
    {name:'xl/styles.xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="#,##0"/><numFmt numFmtId="165" formatCode="0.0%"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Arial"/></font><font><b/><sz val="11"/><name val="Arial"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE2ECF5"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="4"><xf fontId="0"/><xf fontId="1" fillId="2" applyFont="1" applyFill="1"/><xf fontId="0" numFmtId="164" applyNumberFormat="1"/><xf fontId="0" numFmtId="165" applyNumberFormat="1"/></cellXfs></styleSheet>'},
    ...sx.map((d,i)=>({name:'xl/worksheets/sheet'+(i+1)+'.xml',data:d}))
  ];
  return zipStore(files);
}
/* Tải file: trên web/bản offline dùng link tải bình thường; khi chạy trong khung xem trước claude.ai thì xin quyền lưu file qua capability downloads */
let _dlNs;
function download(blob,name){
  const plain=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1500);};
  const c=window.claude; if(!c||typeof c.use!=='function'){plain();return;}
  (_dlNs||(_dlNs=c.use('downloads').catch(()=>null))).then(ns=>{
    if(!ns){plain();return;}
    ns.save({filename:name,data:blob}).catch(e=>{if(e&&e.code!=='declined'&&typeof toast==='function')toast('Chưa lưu được file ('+(e.code||'lỗi')+'). Hãy mở công cụ trên quantritute.com hoặc bản tải về máy.',6000);});
  });
}
function hash53(str){let h1=0xdeadbeef,h2=0x41c6ce57;for(let i=0;i<str.length;i++){const ch=str.charCodeAt(i);h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677);}h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);return (4294967296*(2097151&h2)+(h1>>>0)).toString(36);}
