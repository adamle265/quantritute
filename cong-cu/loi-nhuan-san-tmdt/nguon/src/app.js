/* ===== Giao diện ===== */
const APP_SRC='<!DOCTYPE html>\n'+document.documentElement.outerHTML;
const LS={cost:'qtt_dsan_giavon_v1',done:'qtt_dsan_hddc_v1',seen:'qtt_dsan_tra_seen_v1',open:'qtt_dsan_vi_daukỳ_v1',kho:'qtt_dsan_kho_v1'};
const lsGet=(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){return false;}};
const S={files:[],seq:0,cost:lsGet(LS.cost,{})||{},done:lsGet(LS.done,{})||{},kho:lsGet(LS.kho,{})||{},seen:lsGet(LS.seen,null),opening:lsGet(LS.open,null),
  view:'home',tab:'dash',pMet:['rev'],from:'',to:'',month:'all',q:'',reconFilter:'all',reconCls:'all',retFilter:'todo',khoFilter:'todo',delivDay:'',profitView:'line',scope:'all',chartGran:'day',sort:{},limit:{},D:null,L:[],skus:[],hints:{},viewer:null,sample:false,hide:[],kpick:false,newRet:new Set()};
document.querySelectorAll('.dom-img').forEach(i=>i.src=DOM);

function toast(msg,ms){const t=document.createElement('div');t.className='toast';t.textContent=msg;$('#toasts').appendChild(t);setTimeout(()=>t.remove(),ms||3200);}
function pname(l){const c=S.cost[l.sku];return (c&&c.name&&c.name!==l.name?c.name:'')||l.name+(l.vari&&!/^mặc định$/i.test(l.vari)?' – '+l.vari:'');}
const C=sku=>costOf(S.cost,sku);
function saveCost(){return S.sample||S.viewer?true:lsSet(LS.cost,S.cost);}

/* ---------- Nạp file ---------- */
async function addFiles(list){
  if(S.viewer){toast('Đây là file báo cáo, không nạp thêm dữ liệu được.');return;}
  const arr=Array.from(list||[]); if(!arr.length)return;
  if(S.sample){S.files=[];S.sample=false;S.cost=lsGet(LS.cost,{})||{};S.opening=lsGet(LS.open,null);S.done=lsGet(LS.done,{})||{};S.kho=lsGet(LS.kho,{})||{};}
  $('#app').innerHTML='<div class="loading"><img src="'+DOM+'" width="54" height="54" alt=""><br>Đốm đang đọc '+arr.length+' file…</div>';
  let costRows=0;
  for(const file of arr){
    if(S.files.some(f=>f.name===file.name&&f.size===file.size)){toast('Bỏ qua file đã nạp: '+file.name);continue;}
    const F=await parseFile(file,++S.seq);
    if(F.cost.length){for(const c of F.cost){S.cost[c.sku]=Object.assign({},S.cost[c.sku]||{},{cost:c.cost,parts:null},c.name?{name:c.name}:{});}costRows+=F.cost.length;}
    S.files.push(F);
  }
  if(costRows){saveCost();toast('Đã cập nhật giá vốn cho '+costRows+' SKU từ file.');}
  rebuild(true); initFilters(); S.view='data';
  if(S.D&&S.newRet.size&&S.tab==='dash')toast(S.newRet.size+' đơn trả hàng mới cần lập hóa đơn điều chỉnh.',5000);
  render();
}
function rebuild(markNew){
  if(!S.files.length){S.D=null;S.L=[];S.skus=[];return;}
  S.D=rebuildData(S.files);
  S.skus=collectSkus(S.D.orders); S.hints=costHints(S.skus,S.cost);
  S.L=buildProfit(S.D,S.cost,pname);
  const miss=S.skus.filter(s=>C(s.sku)==null);
  if(miss.length)S.D.W.push(['warn',miss.length+'/'+S.skus.length+' SKU chưa có giá vốn','Vào thẻ "Giá vốn" để nhập. Lợi nhuận các SKU này đang chưa trừ giá vốn.']);
  const low=Object.keys(S.hints).filter(k=>S.hints[k].type==='low');
  if(low.length)S.D.W.push(['warn',low.length+' SKU combo có giá vốn thấp bất thường',low.map(k=>k+': đang '+fmt(C(k))+', gợi ý '+fmt(S.hints[k].want)+' ('+S.hints[k].n+' × '+fmt(S.hints[k].c1)+')').join(' ; ')+'. Có thể đang nhập giá vốn của 1 đơn vị.']);
  if(markNew&&!S.viewer&&!S.sample){
    const ids=S.D.RET.map(r=>r.id);
    if(S.seen==null){S.seen=ids;lsSet(LS.seen,ids);}
    else{const old=new Set(S.seen);ids.forEach(i=>{if(!old.has(i))S.newRet.add(i);});S.seen=[...new Set([...S.seen,...ids])];lsSet(LS.seen,S.seen);}
  }
}

/* ---------- Bộ lọc ---------- */
function inRange(d){if(!S.from&&!S.to)return true;if(!d)return false;if(S.from&&d<S.from)return false;if(S.to&&d>S.to)return false;return true;}
function matchQ(x){if(!S.q)return true;const q=norm(S.q);if(x.id.includes(q))return true;if(x.o)return x.o.skus.some(l=>l.sku.includes(q)||norm(l.name).includes(q)||norm(pname(l)).includes(q));return false;}
function months(){return [...new Set(S.D.R.map(x=>x.date&&x.date.slice(0,7)).filter(Boolean))].sort();}
function initFilters(){}
function applyMonth(v){
  S.month=v;
  if(v==='all'){S.from='';S.to='';}
  else if(v!=='custom'){const [y,m]=v.split('-').map(Number);S.from=v+'-01';S.to=v+'-'+pad(new Date(y,m,0).getDate());}
}
function dbox(id,val){const p=val?[val.slice(8,10),val.slice(5,7),val.slice(0,4)]:['','',''];return '<span class="dbox" id="'+id+'"><input data-p="d" inputmode="numeric" maxlength="2" placeholder="dd" aria-label="Ngày" value="'+p[0]+'"><span>/</span><input data-p="m" inputmode="numeric" maxlength="2" placeholder="mm" aria-label="Tháng" value="'+p[1]+'"><span>/</span><input data-p="y" inputmode="numeric" maxlength="4" placeholder="yyyy" aria-label="Năm" value="'+p[2]+'"></span>';}
function dboxVal(box){const v=[...box.querySelectorAll('input')].map(i=>i.value);if(v.every(x=>!x))return '';if(!(v[0].length&&v[1].length&&v[2].length===4))return null;const d=+v[0],m=+v[1],y=+v[2];const dt=new Date(y,m-1,d);if(dt.getMonth()!==m-1||dt.getDate()!==d)return null;return ymd(y,m,d);}
/* ô ngày dd / mm / yyyy: dấu / có sẵn; đủ ngày tự nhảy sang tháng, đủ tháng sang năm; bấm/nháy đúp chọn cả phần; Backspace ở ô trống lùi về ô trước; dán 01/07/2026 tự tách */
function bindDateBox(box,onDone){
  if(!box)return; const P=[...box.querySelectorAll('input')];
  const selAll=el=>{try{el.setSelectionRange(0,el.value.length);}catch(e){}};
  const go=i=>{if(P[i]){P[i].focus();selAll(P[i]);}};
  const fire=()=>{const v=dboxVal(box);if(v!==null)onDone(v);};
  P.forEach((el,i)=>{
    const len=i===2?4:2;
    el.addEventListener('focus',()=>selAll(el));
    el.addEventListener('mouseup',e=>{e.preventDefault();selAll(el);});
    el.addEventListener('dblclick',()=>selAll(el));
    el.addEventListener('input',()=>{
      const v=el.value.replace(/\D/g,'').slice(0,len); el.value=v;
      if(i===0&&v.length===1&&+v>3){el.value='0'+v;go(1);return;}
      if(i===1&&v.length===1&&+v>1){el.value='0'+v;go(2);return;}
      if(v.length===len&&i<2)go(i+1);
      if(i===2&&v.length===4)fire();
    });
    el.addEventListener('keydown',e=>{
      if(/^[\/.\-]$/.test(e.key)){e.preventDefault();if(!el.value)return;if(el.value.length===1&&i<2)el.value='0'+el.value;go(i+1);return;}
      if(e.key==='Backspace'&&!el.value&&i>0){e.preventDefault();const t=P[i-1];t.value=t.value.slice(0,-1);t.focus();return;}
      if(e.key==='Enter'){fire();}
    });
    el.addEventListener('blur',()=>{if(el.value.length===1&&i<2)el.value='0'+el.value;if(i===2&&el.value.length===2)el.value='20'+el.value;setTimeout(()=>{if(!box.contains(document.activeElement))fire();},0);});
    el.addEventListener('paste',e=>{const t=(e.clipboardData||window.clipboardData).getData('text').trim(),m=t.match(/^(\d{1,2})\D(\d{1,2})\D(\d{4})$/)||t.match(/^(\d{2})(\d{2})(\d{4})$/);if(m){e.preventDefault();P[0].value=pad(m[1]);P[1].value=pad(m[2]);P[2].value=m[3];fire();}});
  });
}
function filterBar(opt){
  opt=opt||{};
  const D=S.D, ms=months();
  const c=D.cov, chip=(l,a)=>a[0]?'<span class="chip">'+l+' <b>'+dmy(a[0])+' – '+dmy(a[1])+'</b></span>':'';
  return '<div class="ds-bar">'
   +'<div class="ip-f"><label for="fMonth">Kỳ'+(opt.lbl?' ('+opt.lbl+')':'')+'</label><select id="fMonth"><option value="all">Tất cả các tháng</option>'+ms.map(m=>'<option value="'+m+'"'+(S.month===m?' selected':'')+'>Tháng '+my(m)+'</option>').join('')+'<option value="custom"'+(S.month==='custom'?' selected':'')+'>Tùy chọn ngày</option></select></div>'
   +'<div class="ip-f"><label>Từ ngày</label>'+dbox('fFrom',S.from)+'</div><div class="ip-f"><label>Đến ngày</label>'+dbox('fTo',S.to)+'</div>'
   +(opt.noSearch?'':'<div class="ip-f q"><label for="fSearch">Tìm</label><input type="search" id="fSearch" value="'+esc(S.q)+'" placeholder="Order ID, SKU ID, tên sản phẩm" autocomplete="off"></div>')
   +'<div class="ds-cov">'+chip('Đơn đặt',c.o)+chip('Quyết toán',c.s)+chip('Tiền vào ví',c.w)+'</div></div>';
}
function bindFilterBar(){
  const fm=$('#fMonth'); if(fm)fm.addEventListener('change',e=>{applyMonth(e.target.value);render();});
  bindDateBox($('#fFrom'),v=>{if(v===S.from)return;S.from=v;S.month='custom';render();});
  bindDateBox($('#fTo'),v=>{if(v===S.to)return;S.to=v;S.month='custom';render();});
  const fs=$('#fSearch'); let qT; if(fs)fs.addEventListener('input',e=>{clearTimeout(qT);qT=setTimeout(()=>{S.q=e.target.value.trim();render(true);},250);});
}

/* ---------- Khung chung ---------- */
const TABS=[['dash','Tổng quan'],['recon','Đối chiếu đơn hàng'],['deliv','Giao theo ngày'],['ret','Trả cần HĐ điều chỉnh'],['kho','Hàng về kho'],['wallet','Ví & dòng tiền'],['profit','Lợi nhuận'],['cost','Giá vốn'],['check','Kiểm tra dữ liệu']];
/* số trên thẻ tính theo kỳ đang chọn (chung cho mọi thẻ) */
function retAll(){return S.D?S.D.RET.filter(r=>inRange(r.delivered)):[];}
function retTodo(){return retAll().filter(r=>!S.done[r.id]).length;}
const khoIn=id=>!!(S.kho[id]&&S.kho[id].date);
function khoAll(){return S.D?S.D.KHO.filter(r=>inRange(r.date)):[];}
function khoTodo(){return khoAll().filter(r=>!khoIn(r.id)).length;}
function renderTabs(){
  const tb=$('#tabs'); const on=S.view==='data'&&S.D; tb.hidden=!on;
  ['btnAdd','btnExcel','btnReport'].forEach(id=>$('#'+id).hidden=!on); $('#btnSample').hidden=!!on; $('#btnVideo').hidden=!!on;
  if(!on)return;
  const allow=S.viewer?S.viewer.tabs:TABS.map(t=>t[0]);
  const wn=S.D.W.filter(x=>x[0]==='err'||x[0]==='warn').length, rn=retTodo(), kn=khoTodo(), per=S.from||S.to?' trong kỳ đang chọn':'';
  $('#tabsIn').innerHTML=TABS.filter(t=>allow.includes(t[0])).map(([k,l])=>'<button type="button" class="ds-tab'+(S.tab===k?' on':'')+'" data-tab="'+k+'">'+l+(k==='ret'&&rn?'<span class="cnt" title="'+rn+' đơn chưa lập HĐ điều chỉnh'+per+'">'+rn+'</span>':'')+(k==='kho'&&kn?'<span class="cnt" title="'+kn+' đơn chưa về kho'+per+'">'+kn+'</span>':'')+(k==='check'&&wn?'<span class="cnt w" title="Cảnh báo về file dữ liệu (không theo kỳ)">'+wn+'</span>':'')+'</button>').join('');
}
function render(keepFocus){
  renderTabs();
  if(S.view!=='data'||!S.D){renderHome();return;}
  const fid=keepFocus&&document.activeElement&&document.activeElement.id, pos=fid&&document.activeElement.selectionStart;
  ({dash:renderDash,recon:renderRecon,deliv:renderDeliv,ret:renderRet,kho:renderKho,wallet:renderWallet,profit:renderProfit,cost:renderCost,check:renderCheck})[S.tab]();
  bindFilterBar(); bindPage();
  if(fid&&$('#'+fid)){const el=$('#'+fid);el.focus();try{el.setSelectionRange(pos,pos);}catch(e){}}
}
function head(t,extra){return '<div class="ds-h"><h2>'+t+'</h2>'+(extra||'')+'</div>';}
function fileChips(){
  if(S.sample)return '<div class="filelist"><span class="chip">Đang xem <b>dữ liệu mẫu (giả lập)</b> – bấm Thêm file để dùng file của anh/chị</span></div>';
  const col={order:'#E3C9A8',income:'#9FD0BC',wallet:'#9FD0BC',report:'#9FD0BC',cost:'#C7CDE3'};
  return '<div class="filelist">'+S.files.map(f=>{const t=f.sheets.find(s=>s.type);return '<span class="chip"><span class="dot" style="background:'+(f.error?'#E08A80':(t?col[t.type]:'#999'))+'"></span>'+esc(f.name)+'</span>';}).join('')+'</div>';
}

/* ---------- Trang đầu ---------- */
function renderHome(){
  $('#app').innerHTML='<div class="home-hero"><div><span class="eyebrow">TikTok Shop · Kế toán bán hàng online</span><h1>Đơn nào <span>đã về tiền</span>, đơn nào cần <span>lập hóa đơn</span>, bán sàn <span>lãi bao nhiêu</span></h1><p class="lead">Thả file Đơn hàng và file Income xuất từ sàn. Công cụ tự ghép theo mã đơn, đối chiếu tiền quyết toán với tiền về ví, liệt kê đơn giao thành công theo ngày, cảnh báo đơn trả hàng cần hóa đơn điều chỉnh và tính lợi nhuận.</p></div>'
   +'<div class="drop" id="drop" tabindex="0" role="button"><img src="'+DOM+'" alt=""><h3>Kéo thả các file Excel vào đây</h3><p>Thả nhiều file cùng lúc: Đơn hàng, Income của nhiều tháng, file giá vốn</p><button type="button" class="btn pri">Chọn file</button></div></div>'
   +'<div class="fcards"><div class="fcard"><h4>File Đơn hàng <span class="tg">Bắt buộc</span></h4><p>Đơn hàng → Xuất đơn hàng (sheet OrderSKUList). Mỗi tháng 1 file.</p></div><div class="fcard"><h4>File Income <span class="tg">Bắt buộc</span></h4><p>Tài chính → Thu nhập → Xuất. Gồm Chi tiết đơn hàng, Báo cáo, Lịch sử rút tiền.</p></div><div class="fcard"><h4>File giá vốn <span class="tg o">Không bắt buộc</span></h4><p>Cột SKU ID và Giá vốn. Có thể nhập tay trong công cụ.</p></div></div>'
   +'<div class="feat"><div><b>Đối chiếu từng đơn</b><span>Doanh thu – phí sàn – tiền quyết toán – tiền vào ví, dung sai 0đ.</span></div><div><b>Đơn giao theo ngày</b><span>Danh sách đơn giao thành công từng ngày để lập hóa đơn.</span></div><div><b>Đơn trả cần HĐ điều chỉnh</b><span>Báo đơn đã giao rồi bị trả, đánh dấu khi đã lập điều chỉnh.</span></div></div>';
  const d=$('#drop'); d.addEventListener('click',()=>$('#fileIn').click()); d.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('#fileIn').click();}});
}

/* ---------- Bảng dùng chung ---------- */
function tableHtml(id,cols,rows,foot,opt){
  opt=opt||{}; const s=S.sort[id]; let data=rows;
  if(s){const c=cols.find(c=>c.k===s.k); if(c){const gv=c.sv||(r=>r[c.k]); data=rows.slice().sort((a,b)=>{const x=gv(a),y=gv(b);const r=(x==null&&y==null)?0:x==null?1:y==null?-1:(typeof x==='number'&&typeof y==='number')?x-y:String(x).localeCompare(String(y),'vi');return s.d*r;});}}
  const lim=S.limit[id]||300; const shown=data.slice(0,lim);
  let h='<div class="ds-tw"><table class="ip-t" data-tid="'+id+'"><thead><tr>'+cols.map(c=>'<th class="'+(c.num?'num':'')+'"'+(c.nosort?'':' data-k="'+c.k+'"')+'>'+c.t+(s&&s.k===c.k?'<span class="ar">'+(s.d>0?'▲':'▼')+'</span>':'')+'</th>').join('')+'</tr></thead><tbody>';
  h+=shown.map(r=>'<tr'+(opt.click?' class="click'+(opt.rcls?' '+opt.rcls(r):'')+'" data-i="'+esc(opt.click(r))+'"':(opt.rcls?' class="'+opt.rcls(r)+'"':''))+'>'+cols.map(c=>'<td class="'+(c.num?'num ':'')+(c.cls||'')+'">'+(c.f?c.f(r):esc(r[c.k]))+'</td>').join('')+'</tr>').join('');
  if(!shown.length)h+='<tr><td colspan="'+cols.length+'" class="muted" style="padding:24px;text-align:center">'+(opt.empty||'Không có dữ liệu phù hợp với bộ lọc.')+'</td></tr>';
  h+='</tbody>'+(foot?'<tfoot><tr>'+foot.map((v,i)=>'<td class="'+(cols[i]&&cols[i].num?'num':'')+'">'+v+'</td>').join('')+'</tr></tfoot>':'')+'</table></div>';
  if(data.length>lim)h+='<button type="button" class="more" data-more="'+id+'">Hiện thêm ('+(data.length-lim)+' dòng)</button>';
  return h;
}
const money=(v,neg)=>v==null?'<span class="muted">—</span>':'<span class="'+(neg&&v<0?'neg':'')+'">'+fmt(v)+'</span>';
const ST={match:['Khớp','ok'],unsettled:['Chưa quyết toán','wait'],unpaid:['Chưa vào ví','wait'],diff:['Có chênh lệch','bad'],nomatch:['Chưa có đơn đối ứng','none']};
const badge=st=>'<span class="b '+ST[st][1]+'">'+ST[st][0]+'</span>';
const K=(l,v,s,c,go,at)=>'<div class="kpi'+(c?' k-'+c:'')+(go?' click" data-tab="'+go:'')+'"'+(at||'')+(go?' title="Bấm để xem chi tiết"':'')+'><div class="l">'+l+'</div><div class="v">'+v+'</div><div class="s">'+s+'</div></div>';
const RED_ICO='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.5"/></svg>';

/* ---------- Tổng quan ---------- */
function dashData(){
  const D=S.D; const R=D.R.filter(x=>inRange(x.date)); const O=R.filter(x=>x.o);
  const k={orders:O.length,succ:O.filter(x=>x.cls==='success').length,cancel:O.filter(x=>x.cls==='cancel').length,ret:O.filter(x=>x.cls==='return').length};
  k.rev=R.reduce((s,x)=>s+x.rev,0);
  k.settle=R.reduce((s,x)=>s+x.settle,0); k.nSettled=R.filter(x=>x.g).length;
  k.fee=R.reduce((s,x)=>s+x.fee,0); k.feeEst=R.reduce((s,x)=>s+x.feeEst,0); k.nEst=R.filter(x=>x.st==='unsettled').length;
  k.recv=R.reduce((s,x)=>s+x.recv,0); k.unrecvSettled=R.reduce((s,x)=>s+x.unrecv,0); k.expect=R.reduce((s,x)=>s+x.expect,0);
  k.diff=R.reduce((s,x)=>s+x.diff,0); k.nDiff=R.filter(x=>x.st==='diff').length;
  k.failSettle=R.filter(x=>x.o&&x.cls!=='success').reduce((s,x)=>s+x.settle,0);
  k.failRev=R.filter(x=>x.o&&(x.cls==='cancel'||x.cls==='return')).reduce((s,x)=>s+(x.revOrder||0),0);
  const sx=R.filter(x=>x.o&&x.cls==='success');
  const f={total:sx.reduce((s,x)=>s+x.rev,0),recv:0,unrecv:0,expect:0,fee:0,feeEst:0};
  sx.forEach(x=>{if(x.g){f.recv+=x.recv;f.unrecv+=x.unrecv;f.fee+=x.fee;}else{f.expect+=x.expect;f.feeEst+=x.feeEst;}});
  k.flow=f; k.R=R;
  const L=S.L.filter(l=>inRange(l.date)); k.profit=L.reduce((s,l)=>s+l.profit,0); k.prev=L.reduce((s,l)=>s+l.rev,0); k.noCost=L.filter(l=>l.noCost).length;
  return k;
}
const DASH_ITEMS=[['flow','Dải dòng tiền doanh thu'],['kpi','Các chỉ tiêu'],['pnl','Doanh thu – chi phí – lợi nhuận'],['charts','Biểu đồ'],['status','Trạng thái đối chiếu']];
function renderDash(){
  const k=dashData(), f=k.flow, hid=x=>S.hide.includes(x);
  let h=filterBar({lbl:'theo ngày đặt đơn',noSearch:true})+(S.viewer&&S.viewer.note?'<div class="vnote">'+esc(S.viewer.note)+'</div>':'');
  const rn=retTodo();
  if(rn&&!S.viewer)h+='<div class="alert red" data-tab="ret" style="cursor:pointer">'+RED_ICO+'<div>'+rn+' đơn đã giao rồi bị trả hàng, cần lập hóa đơn điều chỉnh'+(S.newRet.size?' ('+S.newRet.size+' đơn mới từ lần nạp này)':'')+'. Bấm để xem danh sách.</div></div>';
  const kn=khoTodo(); if(kn&&!S.viewer)h+='<div class="alert warn" data-tab="kho" style="cursor:pointer"><span class="tg">Hàng về kho</span><div>'+kn+' đơn hủy / trả hàng đã rời kho nhưng chưa ghi nhận hàng về lại. Bấm để theo dõi.</div></div>';
  h+=head('Tổng quan','<button type="button" class="btn sm" data-kpick>'+(S.kpick?'Xong':'Chọn phần hiển thị')+'</button>')+fileChips();
  if(S.kpick)h+='<div class="kpick">'+DASH_ITEMS.map(([x,l])=>'<label class="ropt"><input type="checkbox" data-hk="'+x+'" '+(hid(x)?'':'checked')+'> '+l+'</label>').join('')+'</div>';
  const segs=[['Đã vào ví',f.recv,'var(--ok)',''],['Đã quyết toán, chưa vào ví',f.unrecv,'var(--amb)',''],['Chưa quyết toán (dự kiến)',f.expect,'var(--amb)','hatch'],['Phí sàn thực tế',f.fee,'var(--danger)',''],['Phí sàn ước tính',f.feeEst,'var(--danger)','hatch']];
  const tot=segs.reduce((s,x)=>s+Math.max(0,x[1]),0)||1;
  if(!hid('flow'))h+='<div class="blk flow"><div class="total"><strong>'+fmt(f.total)+'đ</strong><span>doanh thu '+k.succ+' đơn thành công đang ở đâu</span></div><div class="strip">'+segs.filter(s=>s[1]>0.5).map(s=>'<div class="'+s[3]+'" style="width:'+(s[1]/tot*100)+'%;background-color:'+s[2]+'" title="'+esc(s[0])+': '+fmt(s[1])+'"></div>').join('')+'</div><div class="legend">'+segs.map(s=>'<div class="it"><span class="sw '+s[3]+'" style="background-color:'+s[2]+'"></span><div><div class="v">'+fmt(s[1])+' <span class="muted" style="font-weight:400">('+fmtP(s[1]/(f.total||1))+')</span></div><div class="l">'+s[0]+'</div></div></div>').join('')+'</div></div>';
  if(!hid('kpi'))h+='<div class="kpis">'
   +K('Doanh thu đơn thành công',fmt(k.rev),k.succ+' / '+k.orders+' đơn','','recon',' data-rcls="success"')
   +K('Đơn hủy / trả hàng',k.cancel+' / '+k.ret,'Doanh số '+fmt(k.failRev)+'đ · '+fmtP((k.cancel+k.ret)/(k.orders||1))+' số đơn',k.cancel+k.ret?'warn':'','recon',' data-rcls="fail"')
   +K('Tiền quyết toán',fmt(k.settle),k.nSettled+' đơn đã có Income')
   +K('Phí sàn',fmt(k.fee),k.nEst?'+ ước tính '+fmt(k.feeEst)+' ('+k.nEst+' đơn)':'Theo Income thực tế','bad')
   +K('Đã vào ví',fmt(k.recv),'Gồm cả đơn đặt kỳ trước và phí đơn hủy','good','wallet')
   +K('Chưa nhận',fmt(k.unrecvSettled+k.expect),'Dự kiến (ước tính) '+fmt(k.expect),'warn')
   +K('Chênh lệch',fmt(k.diff),k.nDiff?k.nDiff+' đơn có chênh lệch':'Không có đơn lệch (dung sai 0đ)',Math.abs(k.diff)>=0.5?'bad':'good','recon')
   +K('Lợi nhuận (tạm tính)',fmt(k.profit),(k.prev?fmtP(k.profit/k.prev)+' doanh thu':'')+(k.noCost?' · thiếu giá vốn '+k.noCost+' dòng':''),k.noCost?'warn':'good','profit')
   +'</div>';
  if(!hid('pnl')){const est=S.L.some(l=>l.est&&inRange(l.date)), sel=PMET.filter(m=>S.pMet.includes(m[0]));
    h+='<div class="blk"><h3>'+esc(pTitle(sel))+' theo '+(S.pGran==='month'?'tháng':'ngày')+' đặt đơn <span class="seg"><button type="button" data-pgran="day" class="'+(S.pGran!=='month'?'on':'')+'">Ngày</button><button type="button" data-pgran="month" class="'+(S.pGran==='month'?'on':'')+'">Tháng</button></span></h3>'
     +'<div class="pmet" role="group" aria-label="Chọn chỉ tiêu hiển thị">'+PMET.map(([k,l,c])=>'<label class="pm'+(S.pMet.includes(k)?' on':'')+'"><input type="checkbox" data-pmet="'+k+'"'+(S.pMet.includes(k)?' checked':'')+'><i style="background:'+c+'"></i>'+l+(k==='fee'&&est?' <small>(gồm ước tính)</small>':'')+'</label>').join('')+'</div>'
     +'<div class="chart" id="chP"></div>'+(k.noCost&&S.pMet.some(x=>x==='cogs'||x==='profit')?'<p class="hint-c" style="margin:6px 0 0;max-width:none;text-align:left">⚠ Còn '+k.noCost+' dòng SKU chưa có giá vốn, giá vốn và lợi nhuận chưa đầy đủ.</p>':'')+'</div>';}
  const showC=!hid('charts'), showS=!hid('status');
  if(showC||showS)h+='<div class="grid2" style="'+(showC&&showS?'':'grid-template-columns:1fr')+'">';
  if(showC)h+='<div class="blk"><h3>Doanh thu và quyết toán theo '+(S.chartGran==='day'?'ngày':'tháng')+' đặt đơn <span class="seg"><button type="button" data-gran="day" class="'+(S.chartGran==='day'?'on':'')+'">Ngày</button><button type="button" data-gran="month" class="'+(S.chartGran==='month'?'on':'')+'">Tháng</button></span></h3><div class="chart" id="ch1"></div><div class="clegend"><span><i style="background:var(--accent-2)"></i>Doanh thu đơn thành công</span><span><i style="background:var(--ok)"></i>Tiền quyết toán</span><span><i style="background:var(--amb)"></i>Chưa quyết toán (dự kiến)</span></div></div>';
  const cnt={};k.R.forEach(x=>cnt[x.st]=(cnt[x.st]||0)+1);
  if(showS)h+='<div class="blk"><h3>Trạng thái đối chiếu</h3><table class="mini">'+Object.keys(ST).map(s=>'<tr><td>'+badge(s)+'</td><td class="num">'+(cnt[s]||0)+'</td></tr>').join('')+'</table><p class="lead" style="margin:12px 0 0;font-size:12.5px">Tỷ lệ phí thực tế bình quân <b>'+fmtP(S.D.rate)+'</b> trên '+S.D.rateN+' đơn thành công đã quyết toán, dùng để ước tính phí cho đơn chưa quyết toán. Doanh thu = tiền hàng trước giảm giá − giảm giá người bán (không trừ giảm giá nền tảng).</p></div>';
  if(showC||showS)h+='</div>';
  $('#app').innerHTML=h;
  if(showC)drawChart(k.R);
  if(!hid('pnl'))drawPnl();
}
function drawChart(R){
  const gran=S.chartGran, key=d=>gran==='day'?d:d.slice(0,7), m=new Map();
  for(const x of R){if(!x.date||!x.o||x.cls!=='success')continue;const kk=key(x.date);let a=m.get(kk);if(!a){a={rev:0,settle:0,exp:0};m.set(kk,a);}a.rev+=x.rev;if(x.g)a.settle+=x.settle;else a.exp+=x.expect;}
  let keys=[...m.keys()].sort();
  if(gran==='day'&&keys.length){const out=[];let d=keys[0];while(d<=keys[keys.length-1]){out.push(d);d=addDays(d,1);}keys=out;}
  const g=k=>m.get(k)||{rev:0,settle:0,exp:0}, lab=k=>gran==='day'?k.slice(8,10)+'/'+k.slice(5,7):my(k);
  const el=$('#ch1'); if(!el)return; if(!keys.length){el.innerHTML='<p class="muted">Chưa có dữ liệu.</p>';return;}
  const Wd=Math.max(320,el.clientWidth||700),H=230,pl=58,pr=8,pt=10,pb=26,n=keys.length;
  let max=0; keys.forEach(k=>{const a=g(k);max=Math.max(max,a.rev,a.settle+a.exp);}); if(max<=0)max=1;
  const step=Math.pow(10,Math.floor(Math.log10(max))); max=Math.ceil(max/step)*step;
  const iw=Wd-pl-pr, ih=H-pt-pb, bw=iw/n, gw=Math.max(1,bw*0.8/2), y=v=>pt+ih-(v/max)*ih;
  const css=getComputedStyle(document.documentElement), col=v=>css.getPropertyValue(v).trim();
  let s='<svg width="'+Wd+'" height="'+H+'" viewBox="0 0 '+Wd+' '+H+'" font-size="11" fill="'+col('--text-muted')+'">';
  for(let t=0;t<=4;t++){const v=max*t/4,yy=y(v);s+='<line x1="'+pl+'" x2="'+(Wd-pr)+'" y1="'+yy+'" y2="'+yy+'" stroke="'+col('--border')+'"/><text x="'+(pl-6)+'" y="'+(yy+4)+'" text-anchor="end">'+(v>=1e6?(v/1e6).toLocaleString('vi-VN',{maximumFractionDigits:1})+'tr':v>=1e3?Math.round(v/1e3)+'k':v)+'</text>';}
  const every=Math.ceil(n/Math.max(1,Math.floor(iw/46)));
  keys.forEach((k,i)=>{const a=g(k),x0=pl+i*bw+bw*0.1;
    if(a.rev>0)s+='<rect x="'+x0+'" y="'+y(a.rev)+'" width="'+Math.max(1,gw-1)+'" height="'+(y(0)-y(a.rev))+'" fill="'+col('--accent-2')+'" rx="1"/>';
    if(a.settle>0)s+='<rect x="'+(x0+gw)+'" y="'+y(a.settle)+'" width="'+Math.max(1,gw-1)+'" height="'+(y(0)-y(a.settle))+'" fill="'+col('--ok')+'" rx="1"/>';
    if(a.exp>0)s+='<rect x="'+(x0+gw)+'" y="'+y(a.settle+a.exp)+'" width="'+Math.max(1,gw-1)+'" height="'+(y(a.settle)-y(a.settle+a.exp))+'" fill="'+col('--amb')+'" rx="1"/>';
    s+='<rect x="'+(pl+i*bw)+'" y="'+pt+'" width="'+bw+'" height="'+ih+'" fill="transparent"><title>'+esc(lab(k)+'\nDoanh thu: '+fmt(a.rev)+'\nQuyết toán: '+fmt(a.settle)+'\nDự kiến: '+fmt(a.exp))+'</title></rect>';
    if(i%every===0)s+='<text x="'+(pl+i*bw+bw/2)+'" y="'+(H-8)+'" text-anchor="middle">'+esc(lab(k))+'</text>';});
  el.innerHTML=s+'</svg>';
}

/* ---------- Đối chiếu đơn hàng ---------- */
const reconCols=[
  {k:'id',t:'Order ID',cls:'id'},
  {k:'date',t:'Ngày đặt',f:r=>dmy(r.date),cls:'mono'},
  {k:'cls',t:'Trạng thái đơn',f:r=>r.o?esc(CLS[r.cls]):'<span class="muted">—</span>',sv:r=>r.cls},
  {k:'prod',t:'Sản phẩm',cls:'prod',f:r=>r.o?r.o.skus.map(l=>esc(pname(l))+(l.qty>1?' <span class="muted">× '+l.qty+'</span>':'')).join('<br>'):'<span class="muted">Không có trong file Đơn hàng</span>',sv:r=>r.o?pname(r.o.skus[0]):''},
  {k:'revOrder',t:'Doanh thu (file Đơn)',num:true,f:r=>money(r.revOrder)},
  {k:'fee',t:'Phí sàn',num:true,f:r=>r.g?fmt(r.fee):(r.feeEst?fmt(r.feeEst)+'<span class="b est">ước tính</span>':'<span class="muted">—</span>'),sv:r=>r.g?r.fee:r.feeEst},
  {k:'settle',t:'Tiền quyết toán',num:true,f:r=>r.g?money(r.settle,true):(r.expect?'<span class="muted">'+fmt(r.expect)+'</span><span class="b est">dự kiến</span>':'<span class="muted">—</span>'),sv:r=>r.g?r.settle:null},
  {k:'sdate',t:'Ngày quyết toán',cls:'mono',f:r=>r.g?r.g.sdates.map(dmy).join('<br>'):'',sv:r=>r.g?r.g.sdates[0]:null},
  {k:'recv',t:'Đã vào ví',num:true,f:r=>r.g?money(r.recv,true):'<span class="muted">—</span>'},
  {k:'diff',t:'Chênh lệch',num:true,f:r=>Math.abs(r.diff)>=0.5?'<span class="neg">'+fmt(r.diff)+'</span>':'0'},
  {k:'st',t:'Trạng thái đối chiếu',f:r=>badge(r.st)+(r.note?'<div class="muted" style="font-size:12px;margin-top:3px;max-width:260px;white-space:normal">'+esc(r.note)+'</div>':'')},
];
function reconRows(){return S.D.R.filter(x=>inRange(x.date)&&matchQ(x));}
const RCLS=[['all','Tất cả'],['success','Thành công'],['fail','Hủy + trả hàng'],['cancel','Hủy'],['return','Trả hàng'],['other','Không có trong file Đơn']];
const clsOk=(x,c)=>c==='all'||(c==='fail'?(x.cls==='cancel'||x.cls==='return'):c==='other'?!['success','cancel','return'].includes(x.cls):x.cls===c);
function renderRecon(){
  const base0=reconRows(); const cc={};RCLS.forEach(([c])=>cc[c]=base0.filter(x=>clsOk(x,c)).length);
  const base=base0.filter(x=>clsOk(x,S.reconCls)); const cnt={all:base.length};base.forEach(x=>cnt[x.st]=(cnt[x.st]||0)+1);
  const rows=S.reconFilter==='all'?base:base.filter(x=>x.st===S.reconFilter);
  let h=filterBar({lbl:'theo ngày đặt đơn'})+head('Đối chiếu đơn hàng')+'<p class="lead">Ghép theo Order ID giữa file Đơn hàng, Income và Lịch sử rút tiền. Tiền vào ví của sàn là tổng theo ngày, nên được gắn về từng đơn theo ngày quyết toán. Bấm vào một dòng để xem chi tiết phí.</p>';
  h+='<div class="tools"><span class="tl">Trạng thái đơn</span>'+RCLS.filter(([c])=>c!=='other'||cc.other).map(([c,l])=>'<button type="button" class="pill '+(S.reconCls===c?'on':'')+'" data-rcf="'+c+'">'+l+'<span class="n">'+cc[c]+'</span></button>').join('')+'</div>';
  if(S.reconCls==='fail'||S.reconCls==='cancel'||S.reconCls==='return'){const fr=base.reduce((s,x)=>s+(x.revOrder||0),0);h+='<p class="lead" style="margin:2px 0 6px">Doanh số các đơn này (theo file Đơn hàng): <b>'+fmt(fr)+'đ</b>. Phí sàn và tiền quyết toán âm là khoản sàn trừ cho đơn hủy / trả.</p>';}
  h+='<div class="tools"><span class="tl">Đối chiếu</span>'+[['all','Tất cả'],...Object.entries(ST).map(([k,v])=>[k,v[0]])].map(([k,l])=>'<button type="button" class="pill '+(S.reconFilter===k?'on':'')+'" data-rf="'+k+'">'+l+'<span class="n">'+(cnt[k]||0)+'</span></button>').join('')+'</div>';
  const sum=a=>rows.reduce((s,x)=>s+(x[a]||0),0);
  h+=tableHtml('recon',reconCols,rows,['Tổng '+rows.length+' đơn','','','',fmt(sum('revOrder')),fmt(sum('fee')),fmt(sum('settle')),'',fmt(sum('recv')),fmt(sum('diff')),''],{click:r=>r.id});
  $('#app').innerHTML=h;
}
function openDrawer(id){
  const x=S.D.byId.get(id); if(!x)return; const o=x.o,g=x.g;
  let h='<button type="button" class="btn sm x" data-close>Đóng</button><h3>Đơn '+esc(x.id)+'</h3><div style="margin:6px 0 10px">'+badge(x.st)+(x.note?' <span class="muted">'+esc(x.note)+'</span>':'')+'</div>';
  if(o){h+='<h4>Thông tin đơn</h4><table class="kv"><tr><td>Ngày đặt</td><td>'+esc(o.createdFull)+'</td></tr><tr><td>Ngày giao thành công</td><td>'+esc(o.deliveredFull||'—')+'</td></tr><tr><td>Trạng thái</td><td>'+esc(o.status)+(o.ctype?' · '+esc(o.ctype):'')+'</td></tr>'+(o.reason?'<tr><td>Lý do</td><td>'+esc(o.reason)+'</td></tr>':'')+'<tr><td>Kênh bán</td><td>'+esc(o.channel)+'</td></tr><tr><td>Thanh toán</td><td>'+esc(o.pay)+'</td></tr><tr><td>Khách trả</td><td>'+fmt(o.amt)+'</td></tr><tr><td>Giảm giá nền tảng (không trừ doanh thu)</td><td>'+fmt(o.pdisc)+'</td></tr></table>';
    h+='<h4>Sản phẩm</h4><table class="kv">'+o.skus.map(l=>{const c=C(l.sku);return '<tr><td>'+esc(pname(l))+'<br><span class="muted">SKU ID '+esc(l.sku)+' · SL '+l.qty+(l.rqty?' · trả '+l.rqty:'')+'</span></td><td>'+fmt(l.rev)+'<br><span class="muted">'+(c==null?'chưa có giá vốn':'giá vốn '+fmt(c*l.qty))+'</span></td></tr>';}).join('')+'</table>';}
  if(g){h+='<h4>Income</h4><table class="kv"><tr><td>Tiền hàng sau giảm giá người bán</td><td>'+fmt(g.gross)+'</td></tr>'+(Math.abs(g.refundSub)>=0.5?'<tr><td>Hoàn tiền hàng</td><td>'+fmt(g.refundSub)+'</td></tr>':'')+'<tr><td>Tổng doanh thu</td><td>'+fmt(g.rev)+'</td></tr>'+FEE_TOP.map(([k,l])=>Math.abs(g.parts[k]||0)>=0.5?'<tr><td>'+l+'</td><td>'+fmt(g.parts[k])+'</td></tr>':'').join('');
    const other=g.fee-FEE_TOP.reduce((s,[k])=>s+(g.parts[k]||0),0);
    if(Math.abs(other)>=0.5)h+='<tr><td>Các khoản phí khác của sàn</td><td>'+fmt(other)+'</td></tr>';
    h+='<tr><td><b>Tổng phí</b></td><td><b>'+fmt(g.fee)+'</b></td></tr><tr><td><b>Tổng quyết toán</b></td><td><b>'+fmt(g.settle)+'</b></td></tr></table>';
    h+='<h4>Các dòng quyết toán</h4><table class="kv">'+g.rows.map(r=>'<tr><td>'+dmy(r.sdate)+' <span class="muted">'+esc(r.file||'')+'</span></td><td>'+fmt(r.settle)+'<br><span class="muted">'+(r.rs==='ok'?'đã vào ví':r.rs==='mismatch'?'ví lệch ngày này':'chưa thấy vào ví')+'</span></td></tr>').join('')+'</table>';}
  else if(x.st==='unsettled')h+='<h4>Ước tính</h4><table class="kv"><tr><td>Phí ước tính ('+fmtP(S.D.rate)+')</td><td>'+fmt(x.feeEst)+'</td></tr><tr><td>Quyết toán dự kiến</td><td>'+fmt(x.expect)+'</td></tr></table>';
  const d=$('#drawer');d.innerHTML=h;d.classList.add('open');d.setAttribute('aria-hidden','false');d.querySelector('.x').focus();
}
function closeDrawer(){const d=$('#drawer');d.classList.remove('open');d.setAttribute('aria-hidden','true');}

/* ---------- Đơn giao theo ngày ---------- */
function delivList(day){return [...S.D.orders.values()].filter(o=>o.delivered&&(day==='*'?inRange(o.delivered):o.delivered===day)).sort((a,b)=>(a.deliveredFull||'').localeCompare(b.deliveredFull||'')||a.id.localeCompare(b.id));}
function delivDays(){const m=new Map();for(const o of S.D.orders.values())if(o.delivered&&inRange(o.delivered))m.set(o.delivered,(m.get(o.delivered)||0)+1);return [...m.entries()].sort((a,b)=>a[0].localeCompare(b[0]));}
const delivCols=()=>[
  {k:'stt',t:'STT',nosort:true,f:r=>r._i},
  {k:'id',t:'Order ID',cls:'id'},
  {k:'deliveredFull',t:'Giao thành công',cls:'mono',f:r=>dmy(r.delivered)+' '+hhmm(r.deliveredFull),sv:r=>r.deliveredFull},
  {k:'created',t:'Ngày đặt',cls:'mono',f:r=>dmy(r.created)},
  {k:'prod',t:'Sản phẩm',cls:'prod',f:r=>r.skus.map(l=>esc(pname(l))).join('<br>'),sv:r=>pname(r.skus[0])},
  {k:'qty',t:'SL',num:true,f:r=>r.skus.map(l=>l.qty).join('<br>')},
  {k:'rev',t:'Tiền hàng sau giảm giá người bán',num:true,f:r=>r.skus.map(l=>fmt(l.rev)).join('<br>')+(r.skus.length>1?'<br><b>'+fmt(r.rev)+'</b>':''),sv:r=>r.rev},
  {k:'pay',t:'Thanh toán',cls:'nw',f:r=>esc(r.pay)},
  {k:'cls',t:'Tình trạng hiện tại',f:r=>r.cls==='return'?'<span class="b bad">Đã trả hàng sau giao</span>':r.rqty?'<span class="b bad">Có trả một phần</span>':'<span class="b ok">Giao thành công</span>',sv:r=>r.cls}
];
function renderDeliv(){
  const days=delivDays(); if(!S.delivDay||(S.delivDay!=='*'&&!days.some(d=>d[0]===S.delivDay)))S.delivDay=days.length?days[days.length-1][0]:'';
  const day=S.delivDay, L=day?delivList(day):[]; L.forEach((o,i)=>o._i=i+1);
  const i=days.findIndex(d=>d[0]===day), recent=days.slice(-14);
  let h=filterBar({lbl:'theo ngày giao',noSearch:true})+head('Đơn giao thành công theo ngày')+'<p class="lead">Danh sách đơn có thời điểm giao thành công (Delivered Time) trong ngày chọn, để đối chiếu khi lập hóa đơn bán ra. Công cụ chỉ liệt kê, không kiểm tra hóa đơn đã lập. Giá trị hàng tính theo giá sau giảm giá của người bán; giảm giá do sàn tài trợ không trừ.</p>';
  h+='<div class="dpick"><button type="button" class="btn sm" data-dd="prev"'+(i<=0?' disabled':'')+'>← Ngày trước</button><div class="ip-f">'+dbox('fDay',day==='*'?'':day)+'</div><button type="button" class="btn sm" data-dd="next"'+(i<0||i>=days.length-1?' disabled':'')+'>Ngày sau →</button><button type="button" class="btn sm" data-dd="*">Cả kỳ đang lọc</button><button type="button" class="btn sm" data-a="deliv-xlsx" style="margin-left:auto"><span>Xuất Excel danh sách này</span></button></div>';
  h+='<div class="days">'+recent.map(([d,n])=>'<div class="day'+(d===day?' on':'')+'" data-day="'+d+'"><b>'+d.slice(8,10)+'/'+d.slice(5,7)+'</b><span>'+n+' đơn</span></div>').join('')+'</div>';
  const late=L.filter(o=>o.cls==='return'||o.rqty).length;
  if(late)h+='<div class="alert red">'+RED_ICO+'<div>'+late+' đơn trong danh sách đã bị trả hàng sau khi giao. Nếu đã lập hóa đơn, cần lập hóa đơn điều chỉnh (xem thẻ Trả cần HĐ điều chỉnh).</div></div>';
  h+=tableHtml('deliv',delivCols(),L,['','Tổng '+L.length+' đơn','','','',fmt(L.reduce((s,o)=>s+o.qty,0)),fmt(L.reduce((s,o)=>s+o.rev,0)),'',''],{click:r=>r.id,empty:days.length?'Không có đơn giao thành công trong ngày này.':'Không có đơn giao thành công trong kỳ đang chọn.'});
  $('#app').innerHTML=h;
  bindDateBox($('#fDay'),v=>{if(v&&v!==S.delivDay){S.delivDay=v;render();}});
}


/* ---------- Theo dõi hàng về kho ---------- */
const todayYmd=()=>{const d=new Date();return ymd(d.getFullYear(),d.getMonth()+1,d.getDate());};
const daysBetween=(a,b)=>Math.round((new Date(b+'T00:00:00')-new Date(a+'T00:00:00'))/864e5);
function khoKind(r){return r.kind==='cancel'?'<span class="b bad">Hủy – ĐVVC đã lấy hàng</span>':(r.o.rqty>0&&r.o.rqty<r.o.qty)?'<span class="b wait">Trả một phần</span>':'<span class="b wait">Trả hàng / hoàn tiền</span>';}
function khoState(r){const k=S.kho[r.id]||{};if(k.date)return '<span class="b ok">Đã về kho</span>';const n=r.evt?daysBetween(r.evt,todayYmd()):null;return '<span class="b bad">Chưa về kho</span>'+(n!=null&&n>=0?'<div class="muted" style="font-size:12px;margin-top:3px">'+n+' ngày từ khi '+(r.kind==='cancel'?'hủy':'phát sinh trả')+'</div>':'');}
function renderKho(){
  const all=khoAll().filter(r=>matchQ(r)), todo=all.filter(r=>!khoIn(r.id)), done=all.filter(r=>khoIn(r.id));
  const rows=S.khoFilter==='todo'?todo:S.khoFilter==='done'?done:all;
  let h=filterBar({lbl:'theo ngày đặt đơn'})+head('Theo dõi hàng về kho');
  h+='<p class="lead">Đơn hàng đã rời kho nhưng không bán được, cần theo dõi hàng hoàn về: <b>đơn hủy khi đơn vị vận chuyển đã lấy hàng</b> (có thời điểm gửi hàng, hoặc Income có phí vận chuyển người bán chịu) và <b>đơn trả hàng / hoàn tiền</b>. Đơn hủy khi chưa giao cho đơn vị vận chuyển không cần theo dõi nên không có ở đây. Nhập ngày hàng về kho khi nhận lại hàng; chưa về thì ghi chú để theo dõi. Dữ liệu nhập được lưu trên máy này.</p>';
  if(todo.length)h+='<div class="alert red">'+RED_ICO+'<div>Còn '+todo.length+' đơn chưa ghi nhận hàng về kho, doanh số '+fmt(todo.reduce((s,r)=>s+r.value,0))+'đ, phí vận chuyển người bán chịu '+fmt(todo.reduce((s,r)=>s+(r.ship||0),0))+'đ.</div></div>';
  h+='<div class="tools">'+[['todo','Chưa về kho',todo.length],['done','Đã về kho',done.length],['all','Tất cả',all.length]].map(([k,l,n])=>'<button type="button" class="pill '+(S.khoFilter===k?'on':'')+'" data-khof="'+k+'">'+l+'<span class="n">'+n+'</span></button>').join('')+'</div>';
  const ro=S.viewer?' disabled':'';
  const cols=[
    {k:'id',t:'Order ID',cls:'id'},
    {k:'date',t:'Ngày đặt',cls:'mono',f:r=>dmy(r.date)},
    {k:'kind',t:'Trạng thái đơn',f:r=>khoKind(r)+'<div class="muted" style="font-size:12px;margin-top:3px;white-space:normal;max-width:200px">'+(r.o.shipped?'Gửi hàng '+dmy(r.o.shipped):'')+(r.evt?(r.o.shipped?' · ':'')+(r.kind==='cancel'?'hủy':'trả')+' '+dmy(r.evt):'')+'</div>',sv:r=>r.kind},
    {k:'prod',t:'Sản phẩm',cls:'prod',f:r=>r.lines.map(l=>esc(pname(l))+' <span class="muted">× '+l.qty+'</span>').join('<br>'),sv:r=>pname(r.lines[0])},
    {k:'ship',t:'Phí vận chuyển người bán chịu',num:true,f:r=>r.ship==null?'<span class="muted" title="Đơn chưa có trong file Income">chưa có Income</span>':fmt(r.ship),sv:r=>r.ship},
    {k:'kdate',t:'Ngày hàng về kho',nosort:true,f:r=>{const k=S.kho[r.id]||{};return '<div class="kdate" data-kd="'+esc(r.id)+'">'+(S.viewer?(k.date?dmy(k.date):'<span class="muted">—</span>'):dbox('kd_'+r.id,k.date||''))+'</div>';}},
    {k:'note',t:'Ghi chú theo dõi',nosort:true,f:r=>{const k=S.kho[r.id]||{};return S.viewer?esc(k.note||''):'<input type="text" class="kin" data-kn="'+esc(r.id)+'" value="'+esc(k.note||'')+'" placeholder="VD: đã liên hệ shipper…" maxlength="200"'+ro+'>';}},
    {k:'st',t:'Tình trạng',f:khoState,sv:r=>khoIn(r.id)?1:0},
    {k:'value',t:'Doanh số đơn',num:true,f:r=>fmt(r.value)},
    {k:'trk',t:'Mã vận đơn',cls:'mono',f:r=>r.o.tracking?esc(r.o.tracking)+(r.o.carrier?'<div class="muted" style="font-size:12px">'+esc(r.o.carrier)+'</div>':''):'<span class="muted">—</span>',sv:r=>r.o.tracking}
  ];
  h+=tableHtml('kho',cols,rows,['Tổng '+rows.length+' đơn','','','',fmt(rows.reduce((s,r)=>s+(r.ship||0),0)),'','','',fmt(rows.reduce((s,r)=>s+r.value,0)),''],{rcls:r=>khoIn(r.id)?'done':'',empty:S.khoFilter==='todo'?'Không còn đơn nào chờ hàng về kho trong kỳ này.':'Không có đơn phù hợp.'});
  $('#app').innerHTML=h;
  if(!S.viewer)document.querySelectorAll('.kdate[data-kd]').forEach(el=>{const id=el.dataset.kd;bindDateBox(el.querySelector('.dbox'),v=>{const k=S.kho[id]||{};if((k.date||'')===v)return;if(v)k.date=v;else delete k.date;setKho(id,k);render();toast(v?'Đã ghi nhận hàng đơn '+id+' về kho ngày '+dmy(v)+'.':'Đã xóa ngày về kho của đơn '+id+'.');});});
}
function setKho(id,k){if(k.date||k.note)S.kho[id]=k;else delete S.kho[id];if(!S.sample)lsSet(LS.kho,S.kho);}

/* ---------- Đơn trả cần HĐ điều chỉnh ---------- */
function renderRet(){
  const all=retAll(); const todo=all.filter(r=>!S.done[r.id]);
  const rows=S.retFilter==='todo'?todo:S.retFilter==='done'?all.filter(r=>S.done[r.id]):all;
  let h=filterBar({lbl:'theo ngày giao',noSearch:true})+head('Đơn trả hàng cần hóa đơn điều chỉnh');
  h+='<p class="lead">Đơn đã giao thành công (thường đã lập hóa đơn) sau đó bị trả hàng: loại Return/Refund, có số lượng trả, hoặc Income có dòng hoàn tiền hàng. Đơn hủy trước khi giao không nằm ở đây vì chưa lập hóa đơn. Tích "Đã lập HĐ điều chỉnh" sau khi xử lý; đánh dấu được lưu trên máy này.</p>';
  if(todo.length)h+='<div class="alert red">'+RED_ICO+'<div>Còn '+todo.length+' đơn chưa lập hóa đơn điều chỉnh, tổng giá trị trả '+fmt(todo.reduce((s,r)=>s+r.value,0))+'đ.</div></div>';
  h+='<div class="tools">'+[['todo','Chưa xử lý',todo.length],['done','Đã lập HĐ điều chỉnh',all.length-todo.length],['all','Tất cả',all.length]].map(([k,l,n])=>'<button type="button" class="pill '+(S.retFilter===k?'on':'')+'" data-retf="'+k+'">'+l+'<span class="n">'+n+'</span></button>').join('')+'</div>';
  const cols=[
    {k:'done',t:'Đã lập HĐ ĐC',nosort:true,f:r=>'<input type="checkbox" class="ret-chk" data-done="'+esc(r.id)+'"'+(S.done[r.id]?' checked':'')+(S.viewer?' disabled':'')+' aria-label="Đã lập hóa đơn điều chỉnh">'},
    {k:'id',t:'Order ID',cls:'id',f:r=>esc(r.id)+(S.newRet.has(r.id)?' <span class="b new">Mới</span>':'')},
    {k:'delivered',t:'Ngày giao (HĐ gốc)',cls:'mono',f:r=>dmy(r.delivered)},
    {k:'retDate',t:'Ngày phát sinh trả',cls:'mono',f:r=>r.retDate?dmy(r.retDate):'<span class="muted">—</span>'},
    {k:'prod',t:'Sản phẩm',cls:'prod',f:r=>r.o.skus.map(l=>esc(pname(l))+' <span class="muted">SL '+l.qty+(l.rqty?', trả '+l.rqty:'')+'</span>').join('<br>'),sv:r=>pname(r.o.skus[0])},
    {k:'part',t:'Loại',f:r=>r.part?'<span class="b wait">Trả một phần</span>':'<span class="b bad">Trả toàn bộ</span>',sv:r=>r.part?1:0},
    {k:'value',t:'Giá trị hàng trả',num:true,f:r=>fmt(r.value)},
    {k:'sig',t:'Dấu hiệu',cls:'sig',f:r=>'<span class="muted" style="font-size:12px">'+esc(r.sig.join('; '))+'</span>',nosort:true},
    {k:'mark',t:'Ngày đánh dấu',cls:'mono',f:r=>S.done[r.id]?dmy(S.done[r.id]):'',sv:r=>S.done[r.id]||''}
  ];
  h+=tableHtml('ret',cols,rows,['','Tổng '+rows.length+' đơn','','','','',fmt(rows.reduce((s,r)=>s+r.value,0)),'',''],{rcls:r=>S.done[r.id]?'done':'',empty:S.retFilter==='todo'?'Không còn đơn trả hàng nào cần xử lý.':'Không có đơn phù hợp.'});
  $('#app').innerHTML=h;
}

/* ---------- Ví sàn & dòng tiền ---------- */
function renderWallet(){
  const D=S.D; const open=S.opening==null?0:S.opening; const days=walletDays(D,open);
  const inR=days.filter(d=>inRange(d.date));
  const mm=new Map(); days.forEach(d=>{const k=d.date.slice(0,7);let a=mm.get(k);if(!a){a={m:k,open:d.open,earn:0,wd:0,other:0,settle:0,close:0};mm.set(k,a);}a.earn+=d.earn;a.wd+=d.wd;a.other+=d.other;a.settle+=d.settle;a.close=d.close;});
  let h=filterBar({lbl:'theo ngày giao dịch ví',noSearch:true})+head('Ví sàn & dòng tiền');
  h+='<p class="lead">Số dư ví = số dư đầu kỳ + tiền vào ví (Earnings) − tiền rút về ngân hàng. File sàn không có số dư đầu kỳ, nhập số dư tại ngày đầu tiên có giao dịch để số dư cuối khớp với ví thực tế. Cột Quyết toán (Income) dùng để kiểm tra tiền vào ví từng ngày.</p>';
  h+='<div class="tools"><label class="oinw"><span>Số dư ví đầu kỳ'+(days[0]?' (trước ngày '+dmy(days[0].date)+')':'')+'</span><input class="oin edit-only" id="openIn" inputmode="numeric" value="'+(S.opening==null?'':fmt(S.opening))+'"></label>'+(S.viewer?'<b class="mono">'+fmt(open)+'</b>':'')+(S.opening==null?'<span class="b wait">Chưa nhập, đang tính bằng 0</span>':'')+'</div>';
  const T=inR.reduce((a,d)=>{a.earn+=d.earn;a.wd+=d.wd;a.other+=d.other;return a;},{earn:0,wd:0,other:0});
  h+='<div class="kpis">'+K('Số dư đầu kỳ lọc',fmt(inR[0]?inR[0].open:open),inR[0]?'Ngày '+dmy(inR[0].date):'')+K('Tiền vào ví',fmt(T.earn),inR.filter(d=>d.earn).length+' ngày','good')+K('Rút về ngân hàng',fmt(-T.wd),D.wallet.filter(w=>isWd(w)&&okSt(w)&&inRange(w.date)).length+' lệnh rút')+K('Số dư cuối kỳ lọc',fmt(inR.length?inR[inR.length-1].close:open),inR.length?'Ngày '+dmy(inR[inR.length-1].date):'','warn')+'</div>';
  h+='<div class="blk"><h3>Theo tháng</h3><div class="ds-tw"><table class="ip-t" style="min-width:640px"><thead><tr><th>Tháng</th><th class="num">Đầu kỳ</th><th class="num">Tiền vào ví</th><th class="num">Rút về ngân hàng</th><th class="num">Khác</th><th class="num">Cuối kỳ</th><th class="num">Quyết toán (Income)</th></tr></thead><tbody>'+[...mm.values()].map(a=>'<tr><td class="mono">'+my(a.m)+'</td><td class="num">'+fmt(a.open)+'</td><td class="num">'+fmt(a.earn)+'</td><td class="num">'+fmt(-a.wd)+'</td><td class="num">'+fmt(a.other)+'</td><td class="num"><b>'+fmt(a.close)+'</b></td><td class="num">'+fmt(a.settle)+'</td></tr>').join('')+'</tbody></table></div></div>';
  const wds=D.wallet.filter(w=>isWd(w)&&inRange(w.date));
  h+='<div class="blk"><h3>Lệnh rút tiền về ngân hàng</h3>'+tableHtml('wd',[{k:'date',t:'Ngày',cls:'mono',f:r=>dmy(r.date)},{k:'ref',t:'Mã tham chiếu',cls:'id'},{k:'amount',t:'Số tiền',num:true,f:r=>fmt(-r.amount)},{k:'bank',t:'Tài khoản nhận',cls:'mono'},{k:'status',t:'Trạng thái',f:r=>okSt(r)?'<span class="b ok">Đã chuyển</span>':'<span class="b wait">'+esc(r.status)+'</span>'}],wds,['Tổng '+wds.length+' lệnh','',fmt(-wds.reduce((s,w)=>s+w.amount,0)),'',''],{empty:'Không có lệnh rút trong kỳ.'})+'</div>';
  h+='<div class="blk"><h3>Theo ngày</h3>'+tableHtml('wday',[{k:'date',t:'Ngày',cls:'mono',f:r=>dmy(r.date)},{k:'open',t:'Đầu ngày',num:true,f:r=>fmt(r.open)},{k:'earn',t:'Tiền vào ví',num:true,f:r=>fmt(r.earn)},{k:'wd',t:'Rút về ngân hàng',num:true,f:r=>fmt(-r.wd)},{k:'close',t:'Cuối ngày',num:true,f:r=>'<b>'+fmt(r.close)+'</b>'},{k:'settle',t:'Quyết toán (Income)',num:true,f:r=>fmt(r.settle)},{k:'chk',t:'Kiểm tra',f:r=>Math.abs(r.earn-r.settle)<0.5?'<span class="b ok">Khớp</span>':r.settle&&!r.earn?'<span class="b wait">Chưa vào ví</span>':!r.settle&&r.earn?'<span class="b wait">Chưa có trong Income</span>':'<span class="b bad">Lệch '+fmt(r.earn-r.settle)+'</span>',nosort:true}],inR.slice().reverse(),null,{empty:'Chưa có dữ liệu ví trong kỳ.'})+'</div>';
  $('#app').innerHTML=h;
  const oi=$('#openIn'); if(oi)oi.addEventListener('change',()=>{const v=oi.value.trim();S.opening=v===''?null:num(v);if(!S.sample)lsSet(LS.open,S.opening);render();toast('Đã lưu số dư ví đầu kỳ.');});
}

/* ---------- Lợi nhuận ---------- */
const PV=[['line','Theo đơn'],['date','Theo ngày'],['month','Theo tháng'],['sku','Theo SKU'],['name','Theo sản phẩm']];
const SCOPES=[['settled','Đã quyết toán','Phí sàn lấy từ Income thực tế'],['est','Chưa quyết toán – ước tính','Phí sàn ước tính theo tỷ lệ bình quân'],['all','Tổng cả hai','Đã quyết toán + ước tính']];
const inScope=(l,sc)=>sc==='all'||(sc==='est'?l.est:!l.est);
function profitBase(){const q=norm(S.q);return S.L.filter(l=>inRange(l.date)&&(!q||l.id.includes(q)||l.sku.includes(q)||norm(l.name).includes(q)));}
function profitLines(){return profitBase().filter(l=>inScope(l,S.scope));}
function totP(A){return A.reduce((a,l)=>{a.rev+=l.rev;a.cogs+=l.cogs||0;a.fee+=l.kind==='sale'?l.fee:0;a.fail+=l.kind==='fail'?l.fee:0;a.profit+=l.profit;if(l.est)a.feeEst+=l.fee;if(l.noCost)a.noCost++;if(l.kind==='sale')a.ids.add(l.id);return a;},{rev:0,cogs:0,fee:0,fail:0,profit:0,feeEst:0,noCost:0,ids:new Set()});}
const pp=(v,rev)=>rev?'<span class="pp">'+fmtP(v/rev)+'</span>':'';
function renderProfit(){
  const B=profitBase(), L=B.filter(l=>inScope(l,S.scope)), v=S.profitView, T=totP(L);
  let h=filterBar({lbl:'theo ngày đặt đơn'})+head('Báo cáo lợi nhuận','<button type="button" class="btn pri" data-a="pdash"'+(L.some(l=>l.kind==='sale')&&!T.noCost?'':' disabled title="Cần đủ giá vốn cho mọi SKU trong kỳ"')+'><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg><span>Xem dashboard lợi nhuận</span></button>')+(T.noCost?'<div class="alert red">'+RED_ICO+'<div>Chưa mở được dashboard: còn '+T.noCost+' dòng SKU chưa có giá vốn. Nhập đủ giá vốn ở thẻ Giá vốn để báo cáo đúng.</div></div>':'')+'<p class="lead">Lợi nhuận = Doanh thu đơn thành công − Giá vốn − Phí sàn − Phí đơn hủy/trả hàng (phí giao thất bại, phí trả hàng sàn đã trừ vào quyết toán). Đơn chưa quyết toán dùng tỷ lệ phí ước tính '+fmtP(S.D.rate)+'. Đơn nhiều SKU chia phí theo tỷ trọng doanh thu từng SKU.</p>';
  if(T.noCost)h+='<div class="alert warn"><span class="tg">Thiếu giá vốn</span><div>'+T.noCost+' dòng SKU chưa có giá vốn nên lợi nhuận đang cao hơn thực tế. '+(S.viewer?'':'<a href="#" data-tab="cost">Nhập giá vốn</a>')+'</div></div>';
  h+='<div class="scope" role="radiogroup" aria-label="Phạm vi tính lợi nhuận"><table><thead><tr><th>Phạm vi</th><th>Số đơn</th><th>Doanh thu</th><th>Giá vốn</th><th>Phí sàn</th><th>Phí đơn hủy/trả</th><th>Lợi nhuận</th><th>% lợi nhuận</th></tr></thead><tbody>'
   +SCOPES.map(([k,l,sub])=>{const t=totP(B.filter(x=>inScope(x,k)));return '<tr class="opt '+(S.scope===k?'on':'')+'" data-scope="'+k+'" role="radio" tabindex="0" aria-checked="'+(S.scope===k)+'"><td><span class="radio"></span><b>'+l+'</b><span class="sub">'+sub+'</span></td><td>'+t.ids.size+'</td><td>'+fmt(t.rev)+'</td><td>'+fmt(t.cogs)+pp(t.cogs,t.rev)+'</td><td>'+fmt(t.fee)+pp(t.fee,t.rev)+'</td><td>'+fmt(t.fail)+pp(t.fail,t.rev)+'</td><td class="'+(t.profit<0?'neg':'')+'">'+fmt(t.profit)+'</td><td>'+fmtP(t.rev?t.profit/t.rev:null)+'</td></tr>';}).join('')+'</tbody></table></div>';
  h+='<div class="tools">'+PV.map(([k,l])=>'<button type="button" class="pill '+(v===k?'on':'')+'" data-pv="'+k+'">'+l+'</button>').join('')+'</div>';
  const pc=r=>r.pct==null?'':'<span class="'+(r.pct<0?'neg':'')+'">'+fmtP(r.pct)+'</span>';
  if(v==='line'){
    const cols=[{k:'id',t:'Order ID',cls:'id'},{k:'date',t:'Ngày đặt',cls:'mono',f:r=>dmy(r.date)},{k:'name',t:'Sản phẩm',cls:'prod',f:r=>r.kind==='fail'?'<i>'+esc(r.name)+'</i>':esc(r.name)},{k:'qty',t:'SL',num:true,f:r=>r.qty||''},{k:'rev',t:'Doanh thu',num:true,f:r=>fmt(r.rev)},{k:'cogs',t:'Giá vốn',num:true,f:r=>r.cogs==null?'<span class="b wait">chưa có</span>':fmt(r.cogs)},{k:'fee',t:'Phí sàn',num:true,f:r=>fmt(r.fee)},{k:'profit',t:'Lợi nhuận',num:true,f:r=>money(r.profit,true)},{k:'pct',t:'% lợi nhuận',num:true,f:pc},{k:'est',t:'Quyết toán',f:r=>r.est?'<span class="b est" style="margin:0">Ước tính</span>':'<span class="b ok">Đã quyết toán</span>',sv:r=>r.est?1:0}];
    h+=tableHtml('pl',cols,L,['Tổng','','',fmt(L.reduce((s,l)=>s+l.qty,0)),fmt(T.rev),fmt(T.cogs),fmt(T.fee+T.fail),fmt(T.profit),fmtP(T.rev?T.profit/T.rev:null),''],{click:r=>r.id});
  }else{
    const A=aggProfit(L,v); const first={date:['Ngày',r=>dmy(r.key)],month:['Tháng',r=>my(r.key)],sku:['SKU ID',r=>r.fail&&!r.rev?'<i>Phí đơn hủy/trả hàng</i>':esc(r.key)+'<br><span class="muted">'+esc(r.name)+'</span>'],name:['Sản phẩm',r=>r.fail&&!r.rev?'<i>'+esc(r.key)+'</i>':esc(r.key)]}[v];
    const cols=[{k:'key',t:first[0],f:first[1],cls:v==='sku'||v==='name'?'prod':'mono'},{k:'n',t:'Số đơn',num:true},{k:'qty',t:'SL',num:true},{k:'rev',t:'Doanh thu',num:true,f:r=>fmt(r.rev)},{k:'cogs',t:'Giá vốn',num:true,f:r=>fmt(r.cogs)+(r.noCost?' <span class="b wait">thiếu '+r.noCost+'</span>':'')},{k:'fee',t:'Phí sàn',num:true,f:r=>fmt(r.fee-r.fail)},{k:'fail',t:'Phí đơn hủy/trả',num:true,f:r=>fmt(r.fail)},{k:'profit',t:'Lợi nhuận',num:true,f:r=>money(r.profit,true)},{k:'pct',t:'% lợi nhuận',num:true,f:pc}];
    if(S.scope==='all')cols.splice(2,0,{k:'estN',t:'Trong đó ước tính',num:true,f:r=>r.estN?'<span class="b est" style="margin:0">'+r.estN+' đơn</span>':'<span class="muted">0</span>'});
    if(!S.sort['pa'+v])S.sort['pa'+v]={k:'key',d:v==='date'||v==='month'?-1:1};
    const ft=['Tổng',T.ids.size]; if(S.scope==='all')ft.push(new Set(L.filter(l=>l.est).map(l=>l.id)).size);
    h+=tableHtml('pa'+v,cols,A,[...ft,fmt(L.reduce((s,l)=>s+l.qty,0)),fmt(T.rev),fmt(T.cogs),fmt(T.fee),fmt(T.fail),fmt(T.profit),fmtP(T.rev?T.profit/T.rev:null)]);
  }
  $('#app').innerHTML=h;
}

/* ---------- Giá vốn ---------- */
function renderCost(){
  const skus=S.skus; const known=new Set(skus.map(s=>s.sku));
  let h=head('Giá vốn sản phẩm',S.viewer?'':'<div class="tools" style="margin:0"><button type="button" class="btn sm" data-a="cost-xlsx">Xuất file giá vốn</button><button type="button" class="btn sm" data-a="add">Nạp file giá vốn</button></div>');
  h+='<p class="lead">Giá vốn cho 1 đơn vị bán theo SKU ID. SKU combo hoặc nhiều đơn vị có thể tính từ sản phẩm thành phần (bấm "Ghép từ thành phần"). Giá vốn của đơn = số lượng × giá vốn SKU. Dữ liệu lưu trên trình duyệt này; nên xuất file để sao lưu.</p>';
  if(!skus.length){$('#app').innerHTML=h+'<div class="blk"><p class="muted">Chưa có SKU nào. Nạp file Đơn hàng trước.</p></div>';return;}
  const nameCnt={}; skus.forEach(s=>nameCnt[s.name]=(nameCnt[s.name]||0)+1);
  h+='<div class="ds-tw" style="max-height:none"><table class="ip-t"><thead><tr><th>SKU ID</th><th>Sản phẩm / phân loại</th><th>Tên rút gọn trên báo cáo</th><th class="num">Giá niêm yết</th><th class="num">SL bán thành công</th><th class="num">Giá vốn / đơn vị</th><th class="num">% giá niêm yết</th></tr></thead><tbody>';
  h+=skus.map(s=>{const c=S.cost[s.sku]||{}, cv=C(s.sku), hasParts=c.parts&&c.parts.length, hint=S.hints[s.sku];
    const partsTxt=hasParts?'<div class="parts">= '+c.parts.map(p=>p.q+' × '+esc(pname({sku:p.sku,name:(skus.find(x=>x.sku===p.sku)||{name:p.sku}).name,vari:(skus.find(x=>x.sku===p.sku)||{}).vari||''}))).join(' + ')+'</div>':'';
    const hintTxt=hint&&!S.viewer?'<div class="hint-c">'+(hint.type==='low'?'⚠ Có thể đang nhập giá vốn của 1 đơn vị. ':'')+'Gợi ý '+hint.n+' × '+fmt(hint.c1)+' = <b>'+fmt(hint.want)+'</b> <button type="button" data-usehint="'+esc(s.sku)+'">Dùng số này</button></div>':'';
    const inp=S.viewer?(cv==null?'<span class="b wait">chưa có</span>':fmt(cv)):(hasParts?'<b class="mono">'+(cv==null?'—':fmt(cv))+'</b>':'<input class="cin '+(cv==null?'miss':'')+'" inputmode="numeric" data-cost="'+esc(s.sku)+'" value="'+(cv==null?'':fmt(cv))+'" aria-label="Giá vốn">');
    return '<tr><td class="id">'+esc(s.sku)+'</td><td class="prod">'+esc(s.name)+(s.vari&&!/^mặc định$/i.test(s.vari)?'<br><span class="muted">'+esc(s.vari)+'</span>':'')+partsTxt+(S.viewer?'':'<div><button type="button" class="lnk" style="font-size:12px" data-parts="'+esc(s.sku)+'">'+(hasParts?'Sửa thành phần':'Ghép từ thành phần')+'</button></div>')+'</td><td>'+(S.viewer?esc(c.name||''):'<input class="nin" data-cname="'+esc(s.sku)+'" value="'+esc(c.name||'')+'" aria-label="Tên rút gọn">')+'</td><td class="num">'+fmt(s.price)+'</td><td class="num">'+(s.qtyOk||'')+'</td><td class="num">'+inp+hintTxt+'</td><td class="num">'+(cv!=null&&s.price?fmtP(cv/s.price):'')+'</td></tr>';}).join('');
  h+='</tbody></table></div>';
  const extra=Object.keys(S.cost).filter(k=>!known.has(k)&&S.cost[k]&&S.cost[k].cost!=null);
  if(extra.length&&!S.viewer)h+='<p class="lead" style="margin-top:10px">Đã lưu giá vốn của '+extra.length+' SKU không có trong file Đơn hàng đang nạp (giữ lại cho lần sau).</p>';
  $('#app').innerHTML=h;
}
function setCost(sku,raw){
  const s=String(raw).trim(); const c=S.cost[sku]||{};
  if(s===''){delete c.cost;}else c.cost=num(s);
  c.parts=null; S.cost[sku]=c; const ok=saveCost(); rebuild(); return ok;
}
function openParts(sku){
  const s=S.skus.find(x=>x.sku===sku); if(!s)return; const cur=(S.cost[sku]&&S.cost[sku].parts)||[];
  const q=k=>{const p=cur.find(x=>x.sku===k);return p?p.q:'';};
  openModal(mHead('Ghép giá vốn từ thành phần',esc(s.name)+(s.vari?' – '+esc(s.vari):''))+'<div class="modal-body"><p class="lead" style="margin-top:0">Nhập số lượng từng sản phẩm thành phần trong 1 đơn vị bán của SKU này. Giá vốn = tổng số lượng × giá vốn thành phần.</p><table class="ip-t" style="min-width:0"><thead><tr><th>Sản phẩm thành phần</th><th class="num">Giá vốn</th><th class="num">Số lượng</th></tr></thead><tbody>'
    +S.skus.filter(x=>x.sku!==sku).map(x=>'<tr><td>'+esc(x.name)+(x.vari?' <span class="muted">– '+esc(x.vari)+'</span>':'')+'<br><span class="muted mono" style="font-size:11.5px">'+esc(x.sku)+'</span></td><td class="num">'+(C(x.sku)==null?'<span class="b wait">chưa có</span>':fmt(C(x.sku)))+'</td><td class="num"><input class="cin" style="width:70px" inputmode="numeric" data-pq="'+esc(x.sku)+'" value="'+q(x.sku)+'"></td></tr>').join('')
    +'</tbody></table><div class="fb-act" style="margin-top:14px">'+(cur.length?'<button type="button" class="btn" data-a="parts-clear" data-sku="'+esc(sku)+'" style="margin-right:auto">Bỏ ghép, nhập trực tiếp</button>':'')+'<button type="button" class="btn" data-a="close">Hủy</button><button type="button" class="btn pri" data-a="parts-save" data-sku="'+esc(sku)+'">Lưu</button></div></div>');
}

/* ---------- Kiểm tra dữ liệu ---------- */
function renderCheck(){
  const D=S.D; const lv={err:['Lỗi','err'],warn:['Cần xem','warn'],info:['Thông tin','info'],ok:['Khớp','ok']}, order={err:0,warn:1,ok:2,info:3};
  let h=head('Kiểm tra dữ liệu')+'<p class="lead">Công cụ đọc toàn bộ worksheet, tự tính lại vùng dữ liệu thực tế, dò dòng tiêu đề theo tên cột và bỏ dòng mô tả. Dưới đây là cảnh báo thiếu, trùng, lệch dữ liệu và kết quả đọc từng file.</p>';
  h+=D.W.slice().sort((a,b)=>order[a[0]]-order[b[0]]).map(w=>'<div class="alert '+lv[w[0]][1]+'"><span class="tg">'+lv[w[0]][0]+'</span><div>'+esc(w[1])+(w[2]?'<div class="detail">'+esc(w[2])+'</div>':'')+'</div></div>').join('')||'<p class="muted">Không có cảnh báo.</p>';
  h+='<div class="blk"><h3>Các file đã nạp</h3><div class="ds-tw"><table class="ip-t"><thead><tr><th>File</th><th>Sheet</th><th>Loại nhận diện</th><th>Vùng khai báo</th><th>Vùng thực tế</th><th class="num">Dòng tiêu đề</th><th class="num">Dòng dữ liệu</th></tr></thead><tbody>';
  for(const f of S.files){
    if(f.error){h+='<tr><td>'+esc(f.name)+'</td><td colspan="6" class="neg">'+esc(f.error)+'</td></tr>';continue;}
    f.sheets.forEach((s,i)=>{h+='<tr><td>'+(i===0?esc(f.name):'')+'</td><td>'+esc(s.name)+'</td><td>'+(s.type?esc(s.label):'<span class="muted">Không dùng</span>')+'</td><td class="mono">'+esc(s.declared||'—')+'</td><td class="mono">'+esc(s.actual||'—')+'</td><td class="num">'+(s.headerRow||'')+'</td><td class="num">'+(s.type&&s.type!=='report'?s.rows:'')+'</td></tr>';});
  }
  $('#app').innerHTML=h+'</tbody></table></div></div>';
}

/* ---------- Xuất Excel ---------- */
const N=(t,w)=>({t,w:w||14,type:'n'}), T_=(t,w)=>({t,w:w||14});
function exportAll(){
  const D=S.D; if(!D)return; const k=dashData();
  const kv=[['Kỳ lọc (ngày đặt đơn)',S.from||S.to?dmy(S.from)+' – '+dmy(S.to):'Tất cả'],['Tổng số đơn',k.orders],['Đơn thành công',k.succ],['Đơn hủy',k.cancel],['Đơn trả hàng',k.ret],['Doanh thu đơn thành công',k.rev],['Tiền quyết toán',k.settle],['Phí sàn thực tế',k.fee],['Phí ước tính (đơn chưa quyết toán)',k.feeEst],['Đã vào ví',k.recv],['Chưa nhận: đã quyết toán chưa vào ví',k.unrecvSettled],['Chưa nhận: dự kiến (ước tính)',k.expect],['Chênh lệch',k.diff],['Lợi nhuận tạm tính',k.profit],['Tỷ lệ phí thực tế bình quân (%)',Math.round(D.rate*1000)/10],['Doanh số đơn hủy / trả hàng',k.failRev],['Đơn trả hàng chưa lập HĐ điều chỉnh',retTodo()],['Đơn hủy / trả chưa về kho',khoTodo()],['Xuất lúc',new Date().toLocaleString('vi-VN')]];
  const sheets=[{name:'Tong_quan',cols:[T_('Chỉ tiêu',46),N('Giá trị',22)],rows:kv.map(r=>[r[0],r[1]])}];
  const R=D.R.filter(x=>inRange(x.date)&&matchQ(x));
  sheets.push({name:'Doi_chieu',cols:[T_('Order ID',22),T_('Ngày đặt',12),T_('Trạng thái',14),T_('SKU ID',22),T_('Sản phẩm',40),N('Số lượng',9),N('Doanh thu (file Đơn)',16),...FEE_TOP.map(([,l])=>N(l,16)),N('Phí khác',12),N('Tổng phí',14),N('Phí ước tính',14),N('Tiền quyết toán',16),T_('Ngày quyết toán',14),N('Đã vào ví',14),N('Chưa vào ví',14),N('Dự kiến (ước tính)',14),N('Chênh lệch',12),T_('Trạng thái đối chiếu',22),T_('Ghi chú',50)],
    rows:R.map(x=>{const g=x.g;const other=g?g.fee-FEE_TOP.reduce((s,[kk])=>s+(g.parts[kk]||0),0):null;return [x.id,dmy(x.date),CLS[x.cls],x.o?x.o.skus.map(l=>l.sku).join('; '):'',x.o?x.o.skus.map(pname).join('; '):'',x.o?x.o.qty:null,x.revOrder,...FEE_TOP.map(([kk])=>g?g.parts[kk]||0:null),other,g?g.fee:null,x.feeEst||null,g?x.settle:null,g?g.sdates.map(dmy).join('; '):'',g?x.recv:null,g?x.unrecv:null,x.expect||null,x.diff,ST[x.st][0],x.note];})});
  const DL=delivList('*');
  sheets.push({name:'Don_giao_theo_ngay',cols:[T_('Ngày giao',12),T_('Giờ',8),T_('Order ID',22),T_('Ngày đặt',12),T_('SKU ID',22),T_('Sản phẩm',44),N('Số lượng',9),N('Tiền hàng sau giảm giá người bán',18),T_('Thanh toán',22),T_('Tình trạng hiện tại',22)],rows:DL.flatMap(o=>o.skus.map(l=>[dmy(o.delivered),hhmm(o.deliveredFull),o.id,dmy(o.created),l.sku,pname(l),l.qty,l.rev,o.pay,o.cls==='return'?'Đã trả hàng sau giao':l.rqty?'Trả '+l.rqty:'Giao thành công']))});
  sheets.push({name:'Don_tra_can_HD_DC',cols:[T_('Đã lập HĐ điều chỉnh',12),T_('Order ID',22),T_('Ngày giao (HĐ gốc)',14),T_('Ngày phát sinh trả',14),T_('Sản phẩm',44),N('SL bán',8),N('SL trả',8),T_('Loại',14),N('Giá trị hàng trả',16),T_('Dấu hiệu',40)],rows:retAll().map(r=>[S.done[r.id]?'Đã lập '+dmy(S.done[r.id]):'Chưa',r.id,dmy(r.delivered),dmy(r.retDate),r.o.skus.map(pname).join('; '),r.qty,r.rqty,r.part?'Trả một phần':'Trả toàn bộ',r.value,r.sig.join('; ')])});
  sheets.push({name:'Theo_doi_hang_ve_kho',cols:[T_('Order ID',22),T_('Ngày đặt',12),T_('Trạng thái đơn',26),T_('Ngày gửi hàng',12),T_('Ngày hủy / trả',12),T_('Sản phẩm',44),N('Số lượng',9),N('Doanh số đơn',16),N('Phí vận chuyển người bán chịu',16),T_('Mã vận đơn',22),T_('Đơn vị vận chuyển',16),T_('Ngày hàng về kho',14),T_('Tình trạng',14),T_('Ghi chú',40)],rows:khoAll().map(r=>{const kk=S.kho[r.id]||{};return [r.id,dmy(r.date),r.kind==='cancel'?'Hủy – ĐVVC đã lấy hàng':'Trả hàng / hoàn tiền',dmy(r.o.shipped),dmy(r.evt),r.lines.map(l=>pname(l)+' × '+l.qty).join('; '),r.qty,r.value,r.ship,r.o.tracking,r.o.carrier,kk.date?dmy(kk.date):'',kk.date?'Đã về kho':'Chưa về kho',kk.note||''];})});
  const days=walletDays(D,S.opening||0);
  sheets.push({name:'Vi_san',cols:[T_('Ngày',12),N('Đầu ngày',16),N('Tiền vào ví',16),N('Rút về ngân hàng',16),N('Khác',12),N('Cuối ngày',16),N('Quyết toán (Income)',16)],rows:days.filter(d=>inRange(d.date)).map(d=>[dmy(d.date),d.open,d.earn,-d.wd,d.other,d.close,d.settle])});
  const L=profitLines();
  sheets.push({name:'Loi_nhuan_theo_don',cols:[T_('Order ID',22),T_('Ngày đặt',12),T_('SKU',22),T_('Sản phẩm',40),N('Số lượng',9),N('Doanh thu'),N('Giá vốn'),{t:'% giá vốn',w:11,type:'p'},N('Phí sàn'),{t:'% phí sàn',w:11,type:'p'},N('Lợi nhuận'),{t:'% lợi nhuận',w:11,type:'p'},T_('Quyết toán',22)],rows:L.map(l=>[l.id,dmy(l.date),l.sku,l.name,l.qty,l.rev,l.cogs,l.rev&&l.cogs!=null?l.cogs/l.rev:null,l.fee,l.rev?l.fee/l.rev:null,l.profit,l.pct,l.kind==='fail'?'Phí đơn hủy/trả':l.est?'Ước tính':'Đã quyết toán'])});
  const aggCols=t=>[T_(t,t==='Sản phẩm'?40:22),N('Số đơn',9),N('Số lượng',9),N('Doanh thu'),N('Giá vốn'),{t:'% giá vốn',w:11,type:'p'},N('Phí sàn'),{t:'% phí sàn',w:11,type:'p'},N('Phí đơn hủy/trả'),{t:'% phí hủy/trả',w:11,type:'p'},N('Lợi nhuận'),{t:'% lợi nhuận',w:11,type:'p'}];
  const aggRows=(key,lab)=>aggProfit(L,key).sort((a,b)=>String(a.key).localeCompare(String(b.key))).map(a=>{const r=x=>a.rev?x/a.rev:null;return [lab(a),a.n,a.qty,a.rev,a.cogs,r(a.cogs),a.fee-a.fail,r(a.fee-a.fail),a.fail,r(a.fail),a.profit,a.pct];});
  sheets.push({name:'LN_theo_thang',cols:aggCols('Tháng'),rows:aggRows('month',a=>my(a.key))});
  sheets.push({name:'LN_theo_SKU',cols:aggCols('SKU ID'),rows:aggRows('sku',a=>a.key)});
  sheets.push({name:'LN_theo_san_pham',cols:aggCols('Sản phẩm'),rows:aggRows('name',a=>a.key)});
  sheets.push({name:'Canh_bao',cols:[T_('Mức',12),T_('Nội dung',80),T_('Chi tiết',100)],rows:D.W.map(w=>[{err:'Lỗi',warn:'Cần xem',info:'Thông tin',ok:'Khớp'}[w[0]],w[1],w[2]||''])});
  const tag=(S.from||S.to)?(S.from||'').replace(/-/g,'')+'-'+(S.to||'').replace(/-/g,''):'TatCa';
  download(buildXlsx(sheets),'DoiChieu_San_'+tag+'.xlsx'); toast('Đã xuất file Excel.');
}
function exportDeliv(){
  const L=S.delivDay?delivList(S.delivDay):[]; if(!L.length){toast('Không có đơn để xuất.');return;}
  download(buildXlsx([{name:'Don_giao',cols:[N('STT',6),T_('Ngày giao',12),T_('Giờ',8),T_('Order ID',22),T_('SKU ID',22),T_('Sản phẩm',44),N('Số lượng',9),N('Tiền hàng sau giảm giá người bán',18),T_('Thanh toán',22),T_('Tình trạng hiện tại',22)],rows:L.flatMap((o,i)=>o.skus.map(l=>[i+1,dmy(o.delivered),hhmm(o.deliveredFull),o.id,l.sku,pname(l),l.qty,l.rev,o.pay,o.cls==='return'?'Đã trả hàng sau giao':'Giao thành công']))}]),'DonGiao_'+(S.delivDay==='*'?'KyLoc':S.delivDay.replace(/-/g,''))+'.xlsx');
  toast('Đã xuất '+L.length+' đơn.');
}
function exportCost(){
  const rows=S.skus.map(s=>{const c=S.cost[s.sku]||{};return [s.sku,s.name,s.vari||'',c.name||'',s.price||null,C(s.sku)];});
  download(buildXlsx([{name:'Gia_von',cols:[T_('SKU ID',24),T_('Tên sản phẩm',50),T_('Phân loại',18),T_('Tên rút gọn',24),N('Giá niêm yết',14),N('Giá vốn',14)],rows}]),'GiaVon_San.xlsx');
  toast('Đã xuất file giá vốn. Có thể sửa trong Excel rồi nạp lại.');
}

/* ---------- Báo cáo HTML gửi sếp ---------- */
function openReportDialog(){
  const period=S.month==='all'?'Tất cả các tháng':(S.from||S.to)?dmy(S.from)+' – '+dmy(S.to):'Tất cả';
  const tabs=[['dash','Tổng quan',true],['recon','Đối chiếu đơn hàng',true],['wallet','Ví sàn & dòng tiền',true],['profit','Lợi nhuận',true],['deliv','Đơn giao theo ngày',false],['ret','Đơn trả cần HĐ điều chỉnh',false],['kho','Theo dõi hàng về kho',false],['cost','Giá vốn',false],['check','Kiểm tra dữ liệu',false]];
  openModal(mHead('Báo cáo HTML gửi sếp','Sếp mở bằng Chrome là xem được, không cần file Excel')+'<div class="modal-body"><p class="lead" style="margin-top:0">Sếp đổi được kỳ, tìm đơn, xem chi tiết và xuất Excel, nhưng không sửa được số liệu. Báo cáo không chứa thông tin người mua.</p><h4 style="margin:6px 0">Các mục đưa vào báo cáo</h4>'+tabs.map(([k,l,on])=>'<label class="ropt"><input type="checkbox" data-rt="'+k+'"'+(on?' checked':'')+'> '+l+'</label>').join('')+'<p class="lead">Kỳ mở mặc định: <b>'+esc(period)+'</b></p><h4 style="margin:6px 0">Ghi chú gửi sếp (không bắt buộc)</h4><textarea class="rn" id="rNote"></textarea><div class="fb-act" style="margin-top:14px"><button type="button" class="btn" data-a="close">Hủy</button><button type="button" class="btn pri" data-a="report-go">Tạo file HTML</button></div></div>');
}
function exportReport(tabs,note){
  const files=S.files.filter(f=>!f.error).map(f=>({...f,income:f.income.map(r=>({...r,sig:hash53(r.sig||'')})),cost:[]}));
  const data={files,cost:S.cost,done:S.done,kho:S.kho,opening:S.opening,report:{tabs,note,at:new Date().toLocaleString('vi-VN'),month:S.month,from:S.from,to:S.to,hide:S.hide,scope:S.scope}};
  const json=JSON.stringify(data).replace(/</g,'\\u003c');
  const marker='<script id="app-main">'; const i=APP_SRC.indexOf(marker); if(i<0){toast('Không tạo được báo cáo.');return;}
  const html=APP_SRC.slice(0,i)+'<script id="embedded-data" type="application/json">'+json+'</'+'script>\n'+APP_SRC.slice(i);
  const tag=(S.from||S.to)?(S.from||'').replace(/-/g,'')+'-'+(S.to||'').replace(/-/g,''):'TatCa';
  download(new Blob([html],{type:'text/html'}),'BaoCao_San_TMDT_'+tag+'.html');
  toast('Đã tạo file báo cáo HTML. Gửi file này cho sếp qua Zalo hoặc email.',4500);
}

/* ---------- Modal: hướng dẫn, video, góp ý ---------- */
function openModal(h,cls){$('#modalRoot').innerHTML='<div class="modal-ov" data-role="ov"><div class="modal-box '+(cls||'')+'" role="dialog" aria-modal="true">'+h+'</div></div>';document.body.style.overflow='hidden';}
function closeModal(){$('#modalRoot').innerHTML='';document.body.style.overflow='';}
function mHead(t,s){return '<div class="modal-head"><img src="'+DOM+'" alt=""><div><h3>'+t+'</h3>'+(s?'<p>'+s+'</p>':'')+'</div><button type="button" class="modal-x" data-a="close" aria-label="Đóng">×</button></div>';}
function openGuide(){
  const G=[['Xuất file từ TikTok Shop','Đơn hàng: Đơn hàng → Xuất đơn hàng theo tháng (file có sheet OrderSKUList). Income: Tài chính → Thu nhập → chọn kỳ → Xuất (gồm Chi tiết đơn hàng, Báo cáo, Lịch sử rút tiền). Dùng file gốc, không mở rồi lưu lại bằng Excel.'],['Thả tất cả file vào công cụ','Thả cùng lúc nhiều tháng. Công cụ tự nhận loại file, ghép theo Order ID, bỏ dòng trùng. Nên nạp Income của tháng sau để khép các đơn quyết toán vắt tháng.'],['Xem đối chiếu và cảnh báo','Thẻ Đối chiếu đơn hàng: lọc đơn Chưa quyết toán, Chưa vào ví, Có chênh lệch. Thẻ Kiểm tra dữ liệu: kiểm tổng chi tiết với sheet Báo cáo của sàn.'],['Lập hóa đơn hằng ngày','Thẻ Giao theo ngày: chọn ngày, xuất danh sách đơn giao thành công. Thẻ Trả cần HĐ điều chỉnh: đơn đã giao rồi bị trả; tích ô khi đã lập hóa đơn điều chỉnh. Thẻ Hàng về kho: đơn hủy khi đơn vị vận chuyển đã lấy hàng và đơn trả hàng; nhập ngày hàng về kho hoặc ghi chú để theo dõi. Kỳ chọn ở một thẻ áp dụng chung cho mọi thẻ.'],['Ví, giá vốn, lợi nhuận','Nhập số dư ví đầu kỳ ở thẻ Ví & dòng tiền. Nhập giá vốn ở thẻ Giá vốn (SKU combo có thể ghép từ thành phần). Xem lợi nhuận theo đơn, ngày, tháng, SKU; xuất Excel hoặc báo cáo HTML gửi sếp.']];
  openModal(mHead('Hướng dẫn sử dụng','5 bước')+'<div class="modal-body"><ol class="gsteps">'+G.map((x,i)=>'<li><span class="gn">'+(i+1)+'</span><div><h4>'+x[0]+'</h4><p>'+x[1]+'</p></div></li>').join('')+'</ol></div>');
}
var DEMO_VIDEO='';
function openVideo(){openModal(mHead('Video Demo','Đối chiếu đơn hàng và BC lợi nhuận sàn TMĐT')+'<div class="modal-body">'+(DEMO_VIDEO?'<div style="position:relative;padding-top:56.25%"><iframe style="position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:12px" src="https://www.youtube-nocookie.com/embed/'+encodeURIComponent(DEMO_VIDEO)+'?autoplay=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="Video demo"></iframe></div>':'<div style="text-align:center;padding:10px"><img src="'+DOM+'" alt="" width="70" height="70"><h3 style="font-family:var(--f-wall);margin:8px 0 4px">Video demo đang được hoàn thiện</h3><p class="muted" style="margin:0 0 14px">Trong lúc chờ, anh/chị bấm Thử với dữ liệu mẫu để xem công cụ chạy ngay.</p><button type="button" class="btn pri" data-a="sample">Thử với dữ liệu mẫu</button></div>')+'</div>');}
var fb={stars:0,type:'Đánh giá chung'};
function openFb(){
  fb={stars:0,type:'Đánh giá chung'};
  openModal(mHead('Góp ý cho Đốm','Mọi ý kiến đều được đọc để cải tiến công cụ')+'<div class="modal-body"><form class="fb-form" id="fbForm" novalidate>'+
    '<div><div style="font-size:13px;font-weight:600">Bạn thấy công cụ thế nào?</div><div class="fb-stars">'+[1,2,3,4,5].map(n=>'<button type="button" data-a="fb-star" data-n="'+n+'" aria-label="'+n+' sao">★</button>').join('')+'</div></div>'+
    '<div><div style="font-size:13px;font-weight:600;margin-bottom:4px">Bạn muốn gửi</div><div class="fb-types">'+['Đánh giá chung','Đề xuất tính năng','Báo lỗi'].map((t,i)=>'<button type="button" class="'+(i?'':'on')+'" data-a="fb-type" data-t="'+t+'">'+t+'</button>').join('')+'</div></div>'+
    '<label>Nội dung <textarea id="fbContent" rows="5" maxlength="3800"></textarea></label>'+
    '<div class="fb-row2"><label>Họ tên <input type="text" id="fbName" maxlength="120" autocomplete="name"></label><label><span>Số điện thoại <span class="opt">(không bắt buộc)</span></span><input type="tel" id="fbPhone" maxlength="20" autocomplete="tel"></label></div><label style="display:block;margin-top:8px"><span>Email <span class="opt">(không bắt buộc – để Đốm báo khi công cụ có bản mới)</span></span><input type="email" id="fbEmail" maxlength="160" autocomplete="email" style="width:100%;box-sizing:border-box"></label>'+
    '<input type="text" id="fbHp" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">'+
    '<label class="fb-consent" style="display:flex;gap:8px;align-items:flex-start;font-size:13px;font-weight:400;line-height:1.5;margin:6px 0"><input type="checkbox" id="fbConsent" style="width:auto;margin-top:3px;flex:none"><span>Tôi đồng ý để Quản trị tử tế lưu họ tên, số điện thoại, email và nội dung góp ý để phản hồi, cải thiện công cụ và gửi email báo khi công cụ có bản cập nhật (bỏ nhận bất cứ lúc nào bằng link trong thư) (<a href="https://quantritute.com/chinh-sach-du-lieu/" target="_blank" rel="noopener">Chính sách dữ liệu</a>).</span></label><p class="fb-msg" id="fbMsg" role="status"></p><div class="fb-act"><button type="button" class="btn" data-a="close">Đóng</button><button type="submit" class="btn pri" id="fbSend">Gửi góp ý</button></div></form></div>','sm');
}
function fbMsg(t,c){const m=$('#fbMsg');if(m){m.textContent=t;m.className='fb-msg '+(c||'');}}
function sendFb(){
  const content=$('#fbContent').value.trim(), name=$('#fbName').value.trim(), phone=$('#fbPhone').value.trim();
  if(content.length<5){fbMsg('Vui lòng nhập nội dung góp ý (ít nhất 5 ký tự).','err');return;}
  if(name.length<2){fbMsg('Vui lòng nhập họ tên để Đốm tiện phản hồi.','err');return;}
  if(phone&&!/^[0-9 +().-]{8,20}$/.test(phone)){fbMsg('Số điện thoại chưa đúng (có thể để trống).','err');return;}
  if(!$('#fbConsent').checked){fbMsg('Anh/chị tích ô đồng ý để Đốm lưu thông tin và phản hồi giúp em nhé.','err');return;}
  const body={tool:TOOL_SLUG,name,phone,email:(($('#fbEmail')||{}).value||'').trim(),consent:true,content:'['+fb.type+']'+(fb.stars?' · Đánh giá: '+fb.stars+'/5 ★':'')+'\n'+content,page:'Đối chiếu sàn TMĐT · bản '+VER,website:$('#fbHp').value};
  const btn=$('#fbSend'); btn.disabled=true; fbMsg('Đang gửi…');
  const online=/^https?:$/.test(location.protocol)&&!/^(localhost|127\.)/.test(location.hostname);
  const req=online?fetch('/api/feedback',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json().catch(()=>({})).then(j=>{if(!r.ok)throw new Error(j.error||'Chưa gửi được, vui lòng thử lại.');return j.message;}))
    :fetch('https://quantritute.com/api/feedback',{method:'POST',mode:'no-cors',headers:{'content-type':'text/plain'},body:JSON.stringify(body)}).then(()=>'Cảm ơn bạn! Góp ý đã được gửi tới Đốm.');
  req.then(m=>{fbMsg(m||'Cảm ơn bạn đã góp ý!','ok');btn.textContent='Đã gửi';setTimeout(()=>{if($('#fbForm'))closeModal();},2200);},e=>{btn.disabled=false;fbMsg(e&&e.message&&!/fetch|network/i.test(e.message)?e.message:'Chưa gửi được (kiểm tra kết nối mạng) – vui lòng thử lại.','err');});
}

/* ---------- Sự kiện ---------- */
function loadSample(){
  const sm=makeSample(); S.files=sm.files; S.seq=2; S.cost=sm.cost; S.opening=sm.opening; S.sample=true; S.done={}; S.kho={}; S.newRet=new Set(); S.reconCls='all';
  S.tab='dash'; S.month='all'; S.from=S.to=''; S.q=''; rebuild(false); S.view='data'; closeModal(); render(); toast('Đã nạp dữ liệu mẫu (giả lập) của shop Đốm Sáng, tháng 8–9/2026.');
}
function bindPage(){}
document.addEventListener('submit',e=>{if(e.target.id==='fbForm'){e.preventDefault();sendFb();}});
document.addEventListener('click',e=>{
  const t=e.target;
  if(t.matches&&t.matches('[data-role="ov"]')){closeModal();return;}
  const th=t.closest('th[data-k]');if(th){const id=th.closest('table').dataset.tid;const k=th.dataset.k;const s=S.sort[id];S.sort[id]={k,d:s&&s.k===k?-s.d:1};render();return;}
  const tab=t.closest('[data-tab]');if(tab){e.preventDefault();if(tab.dataset.rcls){S.reconCls=tab.dataset.rcls;S.reconFilter='all';}S.tab=tab.dataset.tab;closeDrawer();render();window.scrollTo(0,0);return;}
  const mo=t.closest('[data-more]');if(mo){S.limit[mo.dataset.more]=(S.limit[mo.dataset.more]||300)+500;render();return;}
  const rf=t.closest('[data-rf]');if(rf){S.reconFilter=rf.dataset.rf;render();return;}
  const rcf=t.closest('[data-rcf]');if(rcf){S.reconCls=rcf.dataset.rcf;render();return;}
  const khf=t.closest('[data-khof]');if(khf){S.khoFilter=khf.dataset.khof;render();return;}
  const rtf=t.closest('[data-retf]');if(rtf){S.retFilter=rtf.dataset.retf;render();return;}
  const sc=t.closest('[data-scope]');if(sc){S.scope=sc.dataset.scope;render();return;}
  const pv=t.closest('[data-pv]');if(pv){S.profitView=pv.dataset.pv;render();return;}
  const pg2=t.closest('[data-pgran]');if(pg2){S.pGran=pg2.dataset.pgran;render();return;}
  const gr=t.closest('[data-gran]');if(gr){S.chartGran=gr.dataset.gran;if($('#pdash'))openPDash();else render();return;}
  const ps=t.closest('[data-pdscope]');if(ps){S.scope=ps.dataset.pdscope;render();openPDash();return;}
  const dy=t.closest('[data-day]');if(dy){S.delivDay=dy.dataset.day;render();return;}
  const dd=t.closest('[data-dd]');if(dd){const days=delivDays().map(d=>d[0]);const i=days.indexOf(S.delivDay);if(dd.dataset.dd==='*')S.delivDay='*';else if(dd.dataset.dd==='prev'&&i>0)S.delivDay=days[i-1];else if(dd.dataset.dd==='next'&&i<days.length-1)S.delivDay=days[i+1];render();return;}
  if(t.closest('[data-kpick]')){S.kpick=!S.kpick;render();return;}
  const uh=t.closest('[data-usehint]');if(uh){const k=uh.dataset.usehint;setCost(k,S.hints[k].want);render();toast('Đã dùng giá vốn gợi ý cho SKU '+k);return;}
  const pt=t.closest('[data-parts]');if(pt){openParts(pt.dataset.parts);return;}
  if(t.closest('[data-close]')){closeDrawer();return;}
  const b=t.closest('[data-a]');
  if(b){const a=b.dataset.a;
    if(a==='home'){if(S.D){S.tab='dash';S.view='data';}render();window.scrollTo(0,0);}
    else if(a==='guide')openGuide(); else if(a==='video')openVideo(); else if(a==='sample')loadSample(); else if(a==='fb')openFb(); else if(a==='close')closeModal();
    else if(a==='pdash')openPDash(); else if(a==='pd-close')closePDash();
    else if(a==='add')$('#fileIn').click(); else if(a==='excel')exportAll(); else if(a==='report')openReportDialog(); else if(a==='deliv-xlsx')exportDeliv(); else if(a==='cost-xlsx')exportCost();
    else if(a==='report-go'){const sel=[...document.querySelectorAll('[data-rt]')].filter(c=>c.checked).map(c=>c.dataset.rt);if(!sel.length){toast('Chọn ít nhất một mục.');return;}exportReport(sel,$('#rNote').value.trim());closeModal();}
    else if(a==='fb-star'){fb.stars=+b.dataset.n;document.querySelectorAll('.fb-stars button').forEach((x,i)=>x.classList.toggle('on',i<fb.stars));}
    else if(a==='fb-type'){fb.type=b.dataset.t;document.querySelectorAll('.fb-types button').forEach(x=>x.classList.toggle('on',x===b));}
    else if(a==='parts-save'||a==='parts-clear'){const sku=b.dataset.sku;const c=S.cost[sku]||{};
      if(a==='parts-clear')c.parts=null;else{const parts=[...document.querySelectorAll('[data-pq]')].map(i=>({sku:i.dataset.pq,q:num(i.value)})).filter(p=>p.q>0);c.parts=parts.length?parts:null;}
      S.cost[sku]=c;saveCost();rebuild();closeModal();render();toast('Đã lưu giá vốn SKU '+sku);}
    return;}
  const tr=t.closest('tr.click');if(tr){openDrawer(tr.dataset.i);}
});
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.dataset.pmet!==undefined){const k=t.dataset.pmet;S.pMet=t.checked?[...new Set([...S.pMet,k])]:S.pMet.filter(x=>x!==k);if(!S.pMet.length){S.pMet=[k];toast('Cần chọn ít nhất 1 chỉ tiêu.');}render();return;}
  if(t.dataset.hk!==undefined){const k=t.dataset.hk;S.hide=t.checked?S.hide.filter(x=>x!==k):[...S.hide,k];render();return;}
  if(t.dataset.done!==undefined){const id=t.dataset.done;if(t.checked){const d=new Date();S.done[id]=ymd(d.getFullYear(),d.getMonth()+1,d.getDate());}else delete S.done[id];if(!S.sample)lsSet(LS.done,S.done);S.newRet.delete(id);render();return;}
  if(t.dataset.kn!==undefined){const id=t.dataset.kn;const k=S.kho[id]||{};const v=t.value.trim();if(v)k.note=v;else delete k.note;setKho(id,k);toast('Đã lưu ghi chú đơn '+id+'.');return;}
  if(t.dataset.cost!==undefined){const sku=t.dataset.cost;const ok=setCost(sku,t.value);render();toast(ok?'Đã lưu giá vốn SKU '+sku:'Đã áp dụng giá vốn, nhưng trình duyệt không cho lưu lâu dài. Hãy xuất file giá vốn để sao lưu.');return;}
  if(t.dataset.cname!==undefined){const sku=t.dataset.cname;const v=t.value.trim();const c=S.cost[sku]||{};if(v)c.name=v;else delete c.name;S.cost[sku]=c;saveCost();rebuild();toast('Đã lưu tên rút gọn.');return;}
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){if($('#modalRoot').innerHTML)closeModal();else if($('#pdash'))closePDash();else closeDrawer();}
  const sc=e.target.closest&&e.target.closest('[data-scope]');if(sc&&(e.key==='Enter'||e.key===' ')){e.preventDefault();S.scope=sc.dataset.scope;render();return;}
  if(e.key==='Enter'&&e.target.matches&&e.target.matches('.cin,.nin,.oin,.kin'))e.target.blur();
  if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('.ip-brand'))e.target.click();
});
$('#fileIn').addEventListener('change',e=>{addFiles(e.target.files);e.target.value='';});
let dragN=0;
window.addEventListener('dragenter',e=>{if(S.viewer)return;if(e.dataTransfer&&[...e.dataTransfer.types].includes('Files')){dragN++;document.body.classList.add('dragging');}});
window.addEventListener('dragleave',()=>{dragN=Math.max(0,dragN-1);if(!dragN)document.body.classList.remove('dragging');});
window.addEventListener('dragover',e=>e.preventDefault());
window.addEventListener('drop',e=>{e.preventDefault();dragN=0;document.body.classList.remove('dragging');if(e.dataTransfer&&e.dataTransfer.files.length)addFiles(e.dataTransfer.files);});
let rT;window.addEventListener('resize',()=>{clearTimeout(rT);rT=setTimeout(()=>{if(S.view==='data'&&S.tab==='dash'&&S.D){drawChart(dashData().R);if($('#chP'))drawPnl();}},150);});
if(typeof DecompressionStream==='undefined')toast('Trình duyệt quá cũ, không giải nén được file .xlsx. Hãy dùng Chrome hoặc Edge bản mới.',8000);
/* chế độ báo cáo gửi sếp */
(function bootViewer(){
  const el=document.getElementById('embedded-data'); if(!el)return;
  let data; try{data=JSON.parse(el.textContent);}catch(e){toast('File báo cáo bị hỏng dữ liệu.',8000);return;}
  S.viewer=data.report; S.files=data.files; S.cost=data.cost||{}; S.done=data.done||{}; S.kho=data.kho||{}; S.opening=data.opening; S.hide=data.report.hide||[]; S.scope=data.report.scope||'all';
  document.body.classList.add('viewer'); document.title='Báo cáo sàn TMĐT – lập lúc '+data.report.at;
  $('.ip-brand small').textContent='Báo cáo lập lúc '+data.report.at+' · chỉ xem';
  S.tab=data.report.tabs[0]||'dash'; S.month=data.report.month||'all'; S.from=data.report.from||''; S.to=data.report.to||'';
  rebuild(false); S.view='data';
})();
setTimeout(render,0); // chạy sau khi nạp hết script (PMET, dashboard… khai báo phía dưới)

/* ---------- Dashboard lợi nhuận ---------- */
function pdData(){
  const L=profitLines(), T=totP(L), sale=L.filter(l=>l.kind==='sale');
  const ids=new Set(sale.map(l=>l.id));
  // cơ cấu phí sàn: đơn đã quyết toán lấy theo từng khoản trong Income; đơn chưa quyết toán = phí ước tính
  const fee={}; let est=0;
  ids.forEach(id=>{const x=S.D.byId.get(id); if(!x)return; if(x.g){let known=0;FEE_TOP.forEach(([k,lab])=>{const v=-(x.g.parts[k]||0);if(Math.abs(v)>=0.5){fee[lab]=(fee[lab]||0)+v;known+=v;}});const o=-x.g.fee-known;if(Math.abs(o)>=0.5)fee['Phí khác của sàn']=(fee['Phí khác của sàn']||0)+o;}else est+=x.feeEst;});
  if(est>=0.5)fee['Phí ước tính (chưa quyết toán)']=est;
  // theo thời gian
  const span=L.length?(new Date(L.reduce((m,l)=>l.date>m?l.date:m,''))-new Date(L.reduce((m,l)=>l.date<m?l.date:m,'9999')))/864e5:0;
  const gran=S.chartGran==='month'||span>92?'month':'day';
  const tm=new Map(); L.forEach(l=>{const k=gran==='day'?l.date:l.month; if(!k)return; let a=tm.get(k); if(!a){a={rev:0,profit:0,cogs:0,fee:0};tm.set(k,a);} a.rev+=l.rev;a.profit+=l.profit;a.cogs+=l.cogs||0;a.fee+=l.fee;});
  let keys=[...tm.keys()].sort(); if(gran==='day'&&keys.length){const out=[];let d=keys[0];while(d<=keys[keys.length-1]){out.push(d);d=addDays(d,1);}keys=out;}
  const series=keys.map(k=>({k,lab:gran==='day'?k.slice(8,10)+'/'+k.slice(5,7):my(k),...(tm.get(k)||{rev:0,profit:0,cogs:0,fee:0})}));
  // sản phẩm, kênh bán
  const prod=aggProfit(sale,'name').sort((a,b)=>b.profit-a.profit);
  const ch=new Map(); sale.forEach(l=>{const o=S.D.orders.get(l.id);const k=(o&&o.channel)||'Không rõ';let a=ch.get(k);if(!a){a={key:k,ids:new Set(),rev:0,profit:0};ch.set(k,a);}a.ids.add(l.id);a.rev+=l.rev;a.profit+=l.profit;});
  const chan=[...ch.values()].sort((a,b)=>b.rev-a.rev);
  // tỷ lệ hủy/trả trong kỳ (theo ngày đặt)
  const O=[...S.D.orders.values()].filter(o=>inRange(o.created)); const st={success:0,cancel:0,return:0,other:0}; O.forEach(o=>{st[o.cls in st?o.cls:'other']++;});
  return {L,T,ids,fee,series,gran,prod,chan,st,nO:O.length};
}
const pdc=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const short=v=>{const a=Math.abs(v);return (v<0?'−':'')+(a>=1e9?(a/1e9).toLocaleString('vi-VN',{maximumFractionDigits:1})+' tỷ':a>=1e6?(a/1e6).toLocaleString('vi-VN',{maximumFractionDigits:1})+' tr':a>=1e3?Math.round(a/1e3)+'k':Math.round(a));};
function svgWaterfall(el,steps){
  const W=Math.max(320,el.clientWidth||600),H=250,pl=56,pr=10,pt=22,pb=44,n=steps.length;
  let run=0; const bars=steps.map(s=>{let y0,y1;if(s.total){y0=0;y1=s.v;run=s.v;}else{y0=run;y1=run+s.v;run=y1;}return {...s,y0,y1};});
  const max=Math.max(...bars.map(b=>Math.max(b.y0,b.y1)),1), min=Math.min(0,...bars.map(b=>Math.min(b.y0,b.y1)));
  const ih=H-pt-pb, y=v=>pt+ih-(v-min)/(max-min)*ih, bw=(W-pl-pr)/n;
  let s='<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" font-size="11" fill="'+pdc('--text-muted')+'">';
  for(let t=0;t<=4;t++){const v=min+(max-min)*t/4;s+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="'+pdc('--border')+'"/><text x="'+(pl-6)+'" y="'+(y(v)+4)+'" text-anchor="end">'+short(v)+'</text>';}
  bars.forEach((b,i)=>{const x=pl+i*bw+bw*0.18,w=bw*0.64,top=y(Math.max(b.y0,b.y1)),hgt=Math.max(1,Math.abs(y(b.y0)-y(b.y1)));
    const col=b.total?(b.v>=0?(i===0?pdc('--accent-2'):pdc('--ok')):pdc('--danger')):pdc('--danger');
    s+='<rect x="'+x+'" y="'+top+'" width="'+w+'" height="'+hgt+'" fill="'+col+'" rx="2"><title>'+esc(b.l+': '+fmt(b.v))+'</title></rect>';
    if(i<n-1){const yy=y(b.y1);s+='<line x1="'+(x+w)+'" x2="'+(pl+(i+1)*bw+bw*0.18)+'" y1="'+yy+'" y2="'+yy+'" stroke="'+pdc('--border-strong')+'" stroke-dasharray="3 3"/>';}
    s+='<text x="'+(x+w/2)+'" y="'+(top-6)+'" text-anchor="middle" font-weight="600" fill="'+pdc('--text')+'">'+(b.total?'':'−')+short(Math.abs(b.v))+'</text>';
    s+='<text x="'+(x+w/2)+'" y="'+(H-pb+16)+'" text-anchor="middle">'+esc(b.l)+'</text>'+(b.sub?'<text x="'+(x+w/2)+'" y="'+(H-pb+30)+'" text-anchor="middle" fill="'+pdc('--text-faint')+'">'+esc(b.sub)+'</text>':'');});
  el.innerHTML=s+'</svg>';
}
function svgTrend(el,ser){
  const W=Math.max(320,el.clientWidth||700),H=250,pl=56,pr=44,pt=12,pb=26,n=ser.length; if(!n){el.innerHTML='<p class="muted">Chưa có dữ liệu.</p>';return;}
  const max=Math.max(1,...ser.map(a=>a.rev)), min=Math.min(0,...ser.map(a=>a.profit)), ih=H-pt-pb, bw=(W-pl-pr)/n, y=v=>pt+ih-(v-min)/(max-min)*ih;
  const mY=v=>pt+ih-v*ih; // biên lợi nhuận 0–100%
  let s='<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" font-size="11" fill="'+pdc('--text-muted')+'">';
  for(let t=0;t<=4;t++){const v=min+(max-min)*t/4;s+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="'+pdc('--border')+'"/><text x="'+(pl-6)+'" y="'+(y(v)+4)+'" text-anchor="end">'+short(v)+'</text><text x="'+(W-pr+6)+'" y="'+(mY(t/4)+4)+'">'+(t*25)+'%</text>';}
  const gw=Math.max(1,bw*0.38), every=Math.ceil(n/Math.max(1,Math.floor((W-pl-pr)/46)));
  let pts=[];
  ser.forEach((a,i)=>{const x0=pl+i*bw+bw*0.11;
    if(a.rev>0)s+='<rect x="'+x0+'" y="'+y(a.rev)+'" width="'+gw+'" height="'+(y(0)-y(a.rev))+'" fill="'+pdc('--accent-2')+'" rx="1"/>';
    if(a.profit)s+='<rect x="'+(x0+gw)+'" y="'+y(Math.max(0,a.profit))+'" width="'+gw+'" height="'+Math.abs(y(0)-y(a.profit))+'" fill="'+(a.profit>=0?pdc('--ok'):pdc('--danger'))+'" rx="1"/>';
    if(a.rev>0)pts.push([pl+i*bw+bw/2,mY(Math.max(0,Math.min(1,a.profit/a.rev)))]);
    s+='<rect x="'+(pl+i*bw)+'" y="'+pt+'" width="'+bw+'" height="'+ih+'" fill="transparent"><title>'+esc(a.lab+'\nDoanh thu: '+fmt(a.rev)+'\nLợi nhuận: '+fmt(a.profit)+'\nBiên LN: '+(a.rev?fmtP(a.profit/a.rev):'—'))+'</title></rect>';
    if(i%every===0)s+='<text x="'+(pl+i*bw+bw/2)+'" y="'+(H-8)+'" text-anchor="middle">'+esc(a.lab)+'</text>';});
  if(pts.length>1)s+='<polyline points="'+pts.map(p=>p.join(',')).join(' ')+'" fill="none" stroke="'+pdc('--amb')+'" stroke-width="2" stroke-linejoin="round"/>';
  pts.forEach(p=>{s+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="2.5" fill="'+pdc('--amb')+'"/>';});
  el.innerHTML=s+'</svg>';
}
function hbars(list,opt){
  opt=opt||{}; const max=Math.max(1,...list.map(x=>Math.abs(x.v)));
  return '<div class="pd-hb">'+list.map(x=>'<div class="pd-hr"><div class="pd-hl" title="'+esc(x.l)+'">'+esc(x.l)+'</div><div class="pd-ht"><span style="width:'+(Math.abs(x.v)/max*100)+'%;background:'+(x.c||(x.v<0?'var(--danger)':opt.c||'var(--accent-2)'))+'"></span></div><div class="pd-hv">'+fmt(x.v)+(x.s?'<small>'+x.s+'</small>':'')+'</div></div>').join('')+'</div>';
}
function openPDash(){
  const d=pdData(), T=d.T, n=d.ids.size, sc=SCOPES.find(x=>x[0]===S.scope);
  const period=S.from||S.to?dmy(S.from)+' – '+dmy(S.to):'Toàn bộ dữ liệu đã nạp';
  const feeList=Object.entries(d.fee).map(([l,v])=>({l,v,c:/ước tính/.test(l)?'var(--amb)':'var(--danger)'})).sort((a,b)=>b.v-a.v);
  const top=d.prod.slice(0,8).map(a=>({l:a.key,v:a.profit,s:fmtP(a.pct)+' · '+a.qty+' sp',c:'var(--ok)'}));
  const chan=d.chan.map(a=>({l:a.key,v:a.rev,s:a.ids.size+' đơn · LN '+fmtP(a.rev?a.profit/a.rev:null)}));
  const st=d.st, tot=d.nO||1;
  const kp=(l,v,s,c)=>'<div class="kpi'+(c?' k-'+c:'')+'"><div class="l">'+l+'</div><div class="v">'+v+'</div><div class="s">'+s+'</div></div>';
  let h='<div class="pd-ov" id="pdash" role="dialog" aria-modal="true" aria-label="Dashboard lợi nhuận"><div class="pd-in ip-wrap">'
   +'<div class="pd-top"><div><span class="eyebrow">Dashboard lợi nhuận</span><h2>'+esc(period)+'</h2><div class="pd-sc">'+SCOPES.map(([k,l])=>'<button type="button" class="pill '+(S.scope===k?'on':'')+'" data-pdscope="'+k+'">'+l+'</button>').join('')+'</div></div><button type="button" class="btn" data-a="pd-close">Đóng ✕</button></div>'
   +(S.scope!=='settled'&&T.feeEst?'<div class="alert warn"><span class="tg">Ước tính</span><div>Có '+fmt(T.feeEst)+'đ phí sàn ước tính ('+fmtP(S.D.rate)+' doanh thu) cho đơn chưa quyết toán. Chọn "Đã quyết toán" để xem số đã chốt.</div></div>':'')
   +'<div class="kpis pd-k">'
   +kp('Doanh thu',fmt(T.rev),n+' đơn thành công')
   +kp('Lợi nhuận',fmt(T.profit),'Biên '+fmtP(T.rev?T.profit/T.rev:null),T.profit>=0?'good':'bad')
   +kp('Giá vốn',fmt(T.cogs),fmtP(T.rev?T.cogs/T.rev:null)+' doanh thu')
   +kp('Phí sàn',fmt(T.fee),fmtP(T.rev?T.fee/T.rev:null)+' doanh thu','bad')
   +kp('Phí đơn hủy/trả',fmt(T.fail),'Giao thất bại, phí trả hàng',T.fail?'warn':'')
   +kp('Giá trị TB / đơn',fmt(n?T.rev/n:0),'Lợi nhuận TB '+fmt(n?T.profit/n:0)+'đ/đơn')
   +kp('Tỷ lệ hủy / trả',fmtP((st.cancel+st.return)/tot),st.cancel+' hủy · '+st.return+' trả / '+d.nO+' đơn',st.cancel+st.return?'warn':'')
   +'</div>'
   +'<div class="pd-g2"><div class="blk"><h3>Từ doanh thu đến lợi nhuận</h3><div id="pdW"></div></div>'
   +'<div class="blk"><h3>Cơ cấu phí sàn</h3>'+(feeList.length?hbars(feeList):'<p class="muted">Không có phí.</p>')+'</div></div>'
   +'<div class="blk"><h3>Doanh thu và lợi nhuận theo '+(d.gran==='day'?'ngày':'tháng')+' đặt đơn <span class="seg"><button type="button" data-gran="day" class="'+(d.gran==='day'?'on':'')+'">Ngày</button><button type="button" data-gran="month" class="'+(d.gran==='month'?'on':'')+'">Tháng</button></span></h3><div id="pdT"></div><div class="clegend"><span><i style="background:var(--accent-2)"></i>Doanh thu</span><span><i style="background:var(--ok)"></i>Lợi nhuận</span><span><i style="background:var(--amb);height:3px"></i>Biên lợi nhuận (trục phải)</span></div></div>'
   +'<div class="pd-g2"><div class="blk"><h3>Lợi nhuận theo sản phẩm</h3>'+(top.length?hbars(top):'<p class="muted">Chưa có dữ liệu.</p>')+(d.prod.length>8?'<p class="lead" style="margin:8px 0 0;font-size:12px">8 sản phẩm lãi nhiều nhất / '+d.prod.length+'</p>':'')+'</div>'
   +'<div class="blk"><h3>Doanh thu theo kênh bán</h3>'+(chan.length?hbars(chan):'<p class="muted">Chưa có dữ liệu.</p>')+'</div></div>'
   +'<p class="lead" style="margin-top:12px;font-size:12px">'+esc(sc[1])+' · '+esc(sc[2])+'. Doanh thu = tiền hàng sau giảm giá người bán (không trừ giảm giá nền tảng). Phí đơn hủy/trả là khoản sàn trừ vào quyết toán của đơn hủy, đơn trả hàng.</p>'
   +'</div></div>';
  const old=$('#pdash'); if(old)old.remove();
  document.body.insertAdjacentHTML('beforeend',h); document.body.style.overflow='hidden';
  svgWaterfall($('#pdW'),[{l:'Doanh thu',v:T.rev,total:true,sub:'100%'},{l:'Giá vốn',v:-T.cogs,sub:fmtP(T.rev?T.cogs/T.rev:null)},{l:'Phí sàn',v:-T.fee,sub:fmtP(T.rev?T.fee/T.rev:null)},{l:'Phí hủy/trả',v:-T.fail,sub:fmtP(T.rev?T.fail/T.rev:null)},{l:'Lợi nhuận',v:T.profit,total:true,sub:fmtP(T.rev?T.profit/T.rev:null)}]);
  svgTrend($('#pdT'),d.series);
  $('#pdash .btn[data-a="pd-close"]').focus();
}
function closePDash(){const o=$('#pdash');if(o)o.remove();document.body.style.overflow='';}

/* ---------- Biểu đồ doanh thu – chi phí – lợi nhuận (Tổng quan): chọn 1 hoặc nhiều chỉ tiêu ---------- */
const PMET=[['rev','Doanh thu','#3F78AE'],['cogs','Giá vốn','#8A63B8'],['fee','Phí sàn','#C0392B'],['fail','Phí hủy/trả','#E08A2B'],['profit','Lợi nhuận','#2F7D4F']];
function pTitle(sel){const n=sel.map((m,i)=>i?m[1].toLowerCase():m[1]);if(n.length===PMET.length)return 'Doanh thu, chi phí và lợi nhuận';return n.length<2?n.join(''):n.slice(0,-1).join(', ')+' và '+n[n.length-1];}
function drawPnl(){
  const el=$('#chP'); if(!el)return; const gran=S.pGran==='month'?'month':'day', sel=PMET.filter(m=>S.pMet.includes(m[0]));
  const m=new Map();
  S.L.filter(l=>inRange(l.date)).forEach(l=>{const k=gran==='day'?l.date:l.month;if(!k)return;let a=m.get(k);if(!a){a={rev:0,cogs:0,fee:0,fail:0,profit:0};m.set(k,a);}
    a.rev+=l.rev;a.cogs+=l.cogs||0;if(l.kind==='fail')a.fail+=l.fee;else a.fee+=l.fee;a.profit+=l.profit;});
  let keys=[...m.keys()].sort(); if(gran==='day'&&keys.length){const out=[];let d=keys[0];while(d<=keys[keys.length-1]){out.push(d);d=addDays(d,1);}keys=out;}
  if(!keys.length){el.innerHTML='<p class="muted">Chưa có dữ liệu.</p>';return;}
  const g=k=>m.get(k)||{rev:0,cogs:0,fee:0,fail:0,profit:0}, lab=k=>gran==='day'?k.slice(8,10)+'/'+k.slice(5,7):my(k);
  const css=getComputedStyle(document.documentElement), col=v=>css.getPropertyValue(v).trim();
  const W=Math.max(320,el.clientWidth||700),H=gran==='day'?250:280,pl=58,pr=8,pt=gran==='month'?34:10,pb=26,n=keys.length,nb=sel.length;
  let max=1,min=0; keys.forEach(k=>{const a=g(k);sel.forEach(([f])=>{max=Math.max(max,a[f]);min=Math.min(min,a[f]);});});
  const raw=(max-min)/4, p10=Math.pow(10,Math.floor(Math.log10(raw))), step=[1,2,2.5,5,10].map(x=>x*p10).find(x=>x>=raw);
  max=Math.ceil(max/step)*step; min=Math.floor(min/step)*step;
  const iw=W-pl-pr, ih=H-pt-pb, bw=iw/n, gw=Math.max(1,Math.min(bw*0.84/nb,64)), y=v=>pt+ih-(v-min)/(max-min)*ih;
  const sh=v=>{const a=Math.abs(v);return (v<0?'−':'')+(a>=1e6?(a/1e6).toLocaleString('vi-VN',{maximumFractionDigits:1})+'tr':a>=1e3?Math.round(a/1e3)+'k':Math.round(a));};
  let s='<svg width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" font-size="11" fill="'+col('--text-muted')+'">';
  for(let v=min;v<=max+step/2;v+=step){const yy=y(v);s+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+yy+'" y2="'+yy+'" stroke="'+col('--border')+'"/><text x="'+(pl-6)+'" y="'+(yy+4)+'" text-anchor="end">'+sh(v)+'</text>';}
  const every=Math.ceil(n/Math.max(1,Math.floor(iw/46)));
  keys.forEach((k,i)=>{const a=g(k),x0=pl+i*bw+(bw-nb*gw)/2, pc=v=>a.rev?' ('+fmtP(v/a.rev)+')':'';
    sel.forEach(([f,,c],j)=>{const v=a[f],t1=y(Math.max(0,v)),t2=y(Math.min(0,v));if(t2-t1>0.2)s+='<rect x="'+(x0+j*gw)+'" y="'+t1+'" width="'+Math.max(1,gw-1)+'" height="'+(t2-t1)+'" fill="'+c+'" rx="1"/>';
      if(gran==='month'){const cx=x0+j*gw+gw/2;s+='<text x="'+cx+'" y="'+(t1-(f!=='rev'&&a.rev?18:6))+'" text-anchor="middle" font-weight="600" fill="'+col('--text')+'">'+sh(v)+'</text>'+(f!=='rev'&&a.rev?'<text x="'+cx+'" y="'+(t1-5)+'" text-anchor="middle">'+fmtP(v/a.rev)+'</text>':'');}});
    s+='<rect x="'+(pl+i*bw)+'" y="'+pt+'" width="'+bw+'" height="'+ih+'" fill="transparent"><title>'+esc(lab(k)+'\n'+sel.map(([f,l])=>l+': '+fmt(a[f])+(f!=='rev'?pc(a[f]):'')).join('\n'))+'</title></rect>';
    if(i%every===0)s+='<text x="'+(pl+i*bw+bw/2)+'" y="'+(H-8)+'" text-anchor="middle">'+esc(lab(k))+'</text>';});
  if(min<0)s+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+y(0)+'" y2="'+y(0)+'" stroke="'+col('--text-faint')+'"/>';
  el.innerHTML=s+'</svg>';
}
