/* Luyện tập thuyết trình, kể chuyện (storytelling) – Quản trị tử tế
   Dữ liệu người học lưu trên trình duyệt (localStorage + IndexedDB cho bản ghi). */
(function(){
'use strict';
var TOOL_SLUG='storytelling';
var KEY='qtt-storytelling-v1';
var $=function(s,r){ return (r||document).querySelector(s); };
var $all=function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
var DOM_SRC=(document.querySelector('link[rel="icon"]')||{}).href||'';
$all('img.dom-img').forEach(function(im){ im.src=DOM_SRC; });
function domImg(c){ return '<img src="'+DOM_SRC+'" alt="Đốm"'+(c?' class="'+c+'"':'')+'>'; }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function pad(n){ return (n<10?'0':'')+n; }
function dkey(d){ d=d||new Date(); return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
function today(){ return dkey(); }
function parseD(k){ var p=k.split('-'); return new Date(+p[0],+p[1]-1,+p[2]); }
function addDays(k,n){ var d=parseD(k); d.setDate(d.getDate()+n); return dkey(d); }
function vnDate(k){ var p=k.split('-'); return p[2]+'/'+p[1]+'/'+p[0]; }
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
function norm(s){ return String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase(); }
var PREVIEW=/[?&]xem-truoc=1/.test(location.search); try{ if(localStorage.getItem('qtt-st-preview')==='1') PREVIEW=true; }catch(e){}

/* ---------- Dữ liệu tĩnh ---------- */
var BY={}; LESSONS.forEach(function(L){ BY[L.id]=L; });
var VBY={}; VIDEOS.forEach(function(v){ VBY[v.ma]=v; });
var BRANCHES={
  A:{name:'Kể chuyện hay hơn khi giao tiếp',short:'Giao tiếp',desc:'Trò chuyện tự nhiên, cuốn hút hơn với đồng nghiệp, khách hàng, bạn bè.',pick:'Kể chuyện cuốn hơn khi trò chuyện, gặp gỡ',who:'Hay ngại khi bị hỏi "dạo này thế nào?", muốn nói chuyện tự nhiên hơn',color:'var(--s1)'},
  B:{name:'Nói tự tin trước camera',short:'Trước camera',desc:'Quay video, livestream, họp online mà vẫn tự nhiên như đang nói với một người.',pick:'Tự tin khi quay video, livestream, họp online',who:'Làm nội dung, bán hàng online, hay họp qua Zoom/Meet',color:'var(--s3)'},
  C:{name:'Thuyết trình trong công việc',short:'Thuyết trình',desc:'Báo cáo, đề xuất, trình bày rõ ràng trước sếp và đồng nghiệp.',pick:'Thuyết trình, báo cáo rõ ràng trước sếp và đồng nghiệp',who:'Nhân viên, trưởng nhóm phải báo cáo, đề xuất, trình bày trong họp',color:'var(--s4)'}
};
var STAGES=[null,
  {n:1,name:'Thấy chuyện',desc:'Tin rằng mình có chuyện để kể, tập thói quen nhặt chuyện mỗi ngày.',c:'--s1'},
  {n:2,name:'Dựng chuyện',desc:'Biến một kỷ niệm thành câu chuyện có cảnh, có căng thẳng, có điều rút ra.',c:'--s2'},
  {n:3,name:'Nói rõ, nói vững',desc:'Nói có khung, rõ ràng và bình tĩnh trước câu hỏi bất ngờ.',c:'--s3'},
  {n:4,name:'Chạm người nghe',desc:'Mở bài cuốn, kết bài đọng lại, kể bằng cả cảm xúc thật.',c:'--s4'},
  {n:5,name:'Về đích',desc:'Nhìn lại chặng đường và chọn 1 điều để luyện tiếp.',c:'--s5'}];
var LEVELS=['','Người nghe chuyện','Người nhặt chuyện','Người kể tập sự','Người kể vững vàng','Người kể truyền cảm hứng'];
var BADGES=[
  {id:'first',ic:'🌱',name:'Bước đầu tiên',how:'Xong ngày 1'},
  {id:'streak7',ic:'🔥',name:'Giữ lửa 7 ngày',how:'Chuỗi 7 ngày liên tục'},
  {id:'voice',ic:'🎙️',name:'Dám nói thành tiếng',how:'Lần đầu ghi âm và nghe lại'},
  {id:'kho10',ic:'📚',name:'Kho 10 chuyện',how:'Có 10 chuyện trong kho'},
  {id:'told',ic:'🤝',name:'Kể cho người thật',how:'Đã kể một chuyện cho người khác'},
  {id:'finish',ic:'🏁',name:'Về đích',how:'Xong 28 ngày'}];
var USES=['Trò chuyện','Phỏng vấn','Họp','Đào tạo','Video','Thuyết trình','Bán hàng'];
var BOOK_COL=['--s1','--s2','--s3','--s4','--s5'];

/* ---------- Trạng thái ---------- */
var S;
function blank(){ return {v:1,branch:null,created:today(),done:{},act:{},stories:[],badges:{},rec:{},pt:{},lastNew:null}; }
function load(){ try{ S=JSON.parse(localStorage.getItem(KEY)||'null'); }catch(e){ S=null; } if(!S||S.v!==1) S=blank(); ['done','act','badges','rec','pt'].forEach(function(k){ S[k]=S[k]||{}; }); S.stories=S.stories||[]; }
function save(){ try{ localStorage.setItem(KEY,JSON.stringify(S)); }catch(e){ toast('Trình duyệt không cho lưu dữ liệu. Hãy tắt chế độ ẩn danh.'); } }
load();

function path(b){ var p=[]; for(var i=1;i<=14;i++) p.push('d'+pad(i)); b=b||S.branch||'A'; for(i=15;i<=28;i++) p.push('d'+i+b); p.push('d29'); return p.filter(function(id){ return BY[id]; }); }
function nextId(){ var p=path(); for(var i=0;i<p.length;i++) if(!S.done[p[i]]) return p[i]; return null; }
function canStart(id){ if(PREVIEW) return true; if(S.done[id]) return true; if(id!==nextId()) return false; return S.lastNew!==today(); }
function isOpen(id){ if(PREVIEW||S.done[id]) return true; return id===nextId(); }
function totalXP(){ var x=0; for(var k in S.done) x+=S.done[k].xp||0; for(k in S.pt) x+=(S.pt[k].xp||0); return x; }
function level(){ var b=S.branch||'A', l=1; if(S.done.d07) l=2; if(S.done.d14) l=3; if(S.done['d21'+b]) l=4; if(S.done.d29) l=5; return l; }
function stageOf(L){ return STAGES[L.stage]||STAGES[1]; }
function markAct(){ var t=today(); S.act[t]=(S.act[t]||0)+1; }
function weekKey(k){ var d=parseD(k); var day=(d.getDay()+6)%7; d.setDate(d.getDate()-day); return dkey(d); }
function streakInfo(){
  var keys=Object.keys(S.act).sort(); if(!keys.length) return {n:0,rest:{}};
  var first=keys[0], d=today(), n=0, used={}, rest={};
  for(var i=0;i<500;i++){
    if(d<first) break;
    if(S.act[d]) n++;
    else if(d===today()){}
    else { var w=weekKey(d); if(!used[w]){ used[w]=1; rest[d]=1; } else break; }
    d=addDays(d,-1);
  }
  return {n:n,rest:rest};
}
function storiesAll(){ return S.stories; }
function storyCount(){ return S.stories.length; }
function checkBadges(){
  var nw=[], b=S.badges, br=S.branch||'A';
  function give(id){ if(!b[id]){ b[id]=today(); nw.push(id); } }
  if(S.done.d01) give('first');
  if(streakInfo().n>=7) give('streak7');
  if(Object.keys(S.rec).length) give('voice');
  if(storyCount()>=10) give('kho10');
  if(S.stories.some(function(s){ return s.told; })) give('told');
  if(S.done['d28'+br]) give('finish');
  return nw;
}

/* ---------- IndexedDB cho bản ghi ---------- */
var idb=null;
function db(){ if(idb) return idb; idb=new Promise(function(res,rej){ if(!window.indexedDB) return rej(new Error('no idb')); var r=indexedDB.open('qtt-storytelling',1); r.onupgradeneeded=function(){ r.result.createObjectStore('rec'); }; r.onsuccess=function(){ res(r.result); }; r.onerror=function(){ rej(r.error); }; }); return idb; }
function recPut(k,v){ return db().then(function(d){ return new Promise(function(res,rej){ var t=d.transaction('rec','readwrite'); t.objectStore('rec').put(v,k); t.oncomplete=function(){ res(); }; t.onerror=function(){ rej(t.error); }; }); }); }
function recGet(k){ return db().then(function(d){ return new Promise(function(res){ var t=d.transaction('rec','readonly'); var r=t.objectStore('rec').get(k); r.onsuccess=function(){ res(r.result||null); }; r.onerror=function(){ res(null); }; }); }).catch(function(){ return null; }); }
function recClear(){ return db().then(function(d){ return new Promise(function(res){ var t=d.transaction('rec','readwrite'); t.objectStore('rec').clear(); t.oncomplete=function(){ res(); }; }); }).catch(function(){}); }

/* ---------- Markdown nhỏ ---------- */
function inl(s){
  s=esc(s).replace(/\\([_\[\]*\\#.()\-!])/g,'$1');
  s=s.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g,'$1<i>$2</i>');
  s=s.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
  return s;
}
function md(src){
  if(!src) return '';
  var lines=String(src).replace(/\r/g,'').split('\n'), out='', i=0;
  while(i<lines.length){
    var ln=lines[i];
    if(!ln.trim()){ i++; continue; }
    if(/^\s*\|/.test(ln)){
      var rows=[]; while(i<lines.length&&/^\s*\|/.test(lines[i])){ rows.push(lines[i]); i++; }
      var cells=function(r){ return r.trim().replace(/^\||\|$/g,'').split('|').map(function(c){ return c.trim(); }); };
      var h=cells(rows[0]), body=rows.slice(1).filter(function(r){ return !/^\s*\|?\s*:?-{2,}/.test(r); });
      out+='<div class="tbl-wrap"><table><thead><tr>'+h.map(function(c){ return '<th>'+inl(c)+'</th>'; }).join('')+'</tr></thead><tbody>'+body.map(function(r){ return '<tr>'+cells(r).map(function(c){ return '<td>'+inl(c)+'</td>'; }).join('')+'</tr>'; }).join('')+'</tbody></table></div>';
      continue;
    }
    if(/^\s*>/.test(ln)){ var q=[]; while(i<lines.length&&/^\s*>/.test(lines[i])){ q.push(lines[i].replace(/^\s*>\s?/,'')); i++; } out+='<blockquote>'+inl(q.join(' '))+'</blockquote>'; continue; }
    if(/^\s*(?:[-*]|\d+\.)\s+/.test(ln)){
      var ord=/^\s*\d+\./.test(ln), items=[];
      while(i<lines.length&&(/^\s*(?:[-*]|\d+\.)\s+/.test(lines[i])||(/^\s{2,}\S/.test(lines[i])&&items.length))){
        var l2=lines[i];
        if(/^\s{2,}(?:[-*]|\d+\.)\s+/.test(l2)&&items.length){ items[items.length-1].sub.push(l2.replace(/^\s*(?:[-*]|\d+\.)\s+/,'')); }
        else if(/^\s*(?:[-*]|\d+\.)\s+/.test(l2)){ items.push({t:l2.replace(/^\s*(?:[-*]|\d+\.)\s+(\[[ x]\]\s*)?/,''),sub:[]}); }
        else items[items.length-1].t+=' '+l2.trim();
        i++;
      }
      out+='<'+(ord?'ol':'ul')+'>'+items.map(function(it){ return '<li>'+inl(it.t)+(it.sub.length?'<ul>'+it.sub.map(function(s){ return '<li>'+inl(s)+'</li>'; }).join('')+'</ul>':'')+'</li>'; }).join('')+'</'+(ord?'ol':'ul')+'>';
      continue;
    }
    var p=[]; while(i<lines.length&&lines[i].trim()&&!/^\s*(\||>|[-*]\s|\d+\.\s)/.test(lines[i])){ p.push(lines[i].trim()); i++; }
    out+='<p>'+inl(p.join(' '))+'</p>';
  }
  return out;
}
function plain(s){ return String(s||'').replace(/\*\*|\*|\\/g,''); }

/* ---------- Giao diện chung ---------- */
var IC={
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>',
  map:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></svg>',
  gym:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/></svg>',
  book:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 012-2h12v16H6a2 2 0 00-2 2V5z"/><path d="M4 19a2 2 0 012-2h12"/></svg>',
  play:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9l5 3-5 3z"/></svg>'
};
var NAV=[['','Hôm nay','home'],['ban-do','Bản đồ','map'],['phong-tap','Phòng tập','gym'],['kho','Kho chuyện','book'],['video','Video','play']];
function renderNav(r){
  var top=r.split('/')[0];
  var h=NAV.map(function(n){ return '<a href="#/'+n[0]+'" class="'+(top===n[0]?'on':'')+'">'+IC[n[2]]+'<span>'+n[1]+'</span></a>'; }).join('');
  $('#nav').innerHTML=h; $('#bnav').innerHTML=h;
  var st=streakInfo().n;
  $('#tbStats').innerHTML=S.branch?'<span class="pill fire" title="Chuỗi ngày luyện tập">🔥 '+st+'</span><span class="pill xp" title="Điểm kinh nghiệm">⭐ '+totalXP()+' XP</span>':'';
}
function toast(t){ var el=document.createElement('div'); el.className='toast'; el.textContent=t; $('#toasts').appendChild(el); setTimeout(function(){ el.remove(); },2800); }
function openModal(html,cls){ $('#modalRoot').innerHTML='<div class="modal-ov" data-role="ov"><div class="modal-box '+(cls||'')+'" role="dialog" aria-modal="true">'+html+'</div></div>'; document.body.style.overflow='hidden'; }
function closeModal(){ stopMedia(); $('#modalRoot').innerHTML=''; document.body.style.overflow=''; }
function modalHead(t,sub){ return '<div class="modal-head">'+domImg()+'<div><h3>'+t+'</h3>'+(sub?'<p>'+sub+'</p>':'')+'</div><button type="button" class="modal-x" data-act="close-modal" aria-label="Đóng">×</button></div>'; }
function stVars(L){ var c=stageOf(L).c; return '--stc:var('+c+');--stc-soft:var('+c+'-soft)'; }
function confetti(){ var w=document.createElement('div'); w.className='confetti'; var cols=['#C0763A','#2F7D4F','#3A6E9C','#7A4E9C','#B7791F']; for(var i=0;i<60;i++){ var c=document.createElement('i'); c.style.left=Math.random()*100+'%'; c.style.background=cols[i%5]; c.style.animationDelay=(Math.random()*0.8)+'s'; c.style.transform='rotate('+(Math.random()*360)+'deg)'; w.appendChild(c); } document.body.appendChild(w); setTimeout(function(){ w.remove(); },3600); }

/* ---------- Router ---------- */
var view=$('#view');
var cleanup=[];
function route(){
  stopMedia(); cleanup.forEach(function(f){ try{ f(); }catch(e){} }); cleanup=[];
  var r=(location.hash||'#/').replace(/^#\/?/,'');
  document.body.classList.toggle('in-lesson',/^bai\//.test(r));
  renderNav(r);
  var p=r.split('/');
  if(!S.branch&&p[0]!=='ve-cong-cu'&&p[0]!=='video'){ renderOnboard(); return scrollTop(); }
  if(p[0]==='') renderHome();
  else if(p[0]==='ban-do') renderMap();
  else if(p[0]==='bai') renderLesson(p[1]);
  else if(p[0]==='phong-tap') p[1]?renderExercise(p[1]):renderGym();
  else if(p[0]==='kho') p[1]==='moi'?renderWizard(p[2]):p[1]?renderStory(p[1]):renderKho();
  else if(p[0]==='video') renderVideos();
  else if(p[0]==='ve-cong-cu') renderAbout();
  else renderHome();
  scrollTop();
}
function scrollTop(){ window.scrollTo(0,0); }
function go(h){ if(location.hash==='#/'+h) route(); else location.hash='#/'+h; }
window.addEventListener('hashchange',route);

/* ---------- Màn chọn nhánh ---------- */
var onbPick=null;
function renderOnboard(){
  var h='<div class="onb"><div class="onb-hero">'+domImg()+'<div><h1>Đốm chào bạn! Mỗi ngày chỉ cần 10 phút.</h1><p>Lộ trình 28 ngày giúp bạn kể chuyện cuốn hơn, nói tự tin hơn. Không cần đăng ký, tiến độ lưu ngay trên máy bạn.</p></div></div>'+
  '<div class="bubble"><b style="font-family:var(--f-wall);font-size:17px">Trước khi bắt đầu, bạn muốn tập nói để làm gì nhất?</b><div class="br-opts">'+
  ['A','B','C'].map(function(k){ var B=BRANCHES[k]; return '<button type="button" class="br-opt'+(onbPick===k?' on':'')+'" data-act="onb-pick" data-b="'+k+'"><span class="br-ic" style="background:'+B.color+'">'+k+'</span><span><b>'+B.pick+'</b><span>'+B.who+'</span></span></button>'; }).join('')+
  '</div><p class="small muted">Ngày 1–14 là phần nền tảng dùng chung. Từ ngày 15, bài học đi theo hướng bạn chọn. Bạn đổi được bất cứ lúc nào trước ngày 15.</p></div>'+
  '<div class="onb-facts"><div><b>10 phút</b>mỗi ngày: đọc 3 phút, thử nhanh, thực hành, ghi nhận</div><div><b>28 ngày</b>4 chặng, mỗi chặng có 1 ngày "qua màn"</div><div><b>Miễn phí</b>không quảng cáo, không thu thập dữ liệu</div></div>'+
  '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-primary btn-lg" data-act="onb-go"'+(onbPick?'':' disabled')+'>Bắt đầu Ngày 1 →</button><a class="btn btn-ghost" href="#/ve-cong-cu">Tìm hiểu về công cụ</a></div></div>';
  view.innerHTML=h;
}

/* ---------- Hôm nay ---------- */
function lessonHero(id){
  if(!id){ return '<div class="lesson-hero" style="--stc:var(--s5);--stc-soft:var(--s5-soft)"><span class="lh-tag">🏁 Hoàn thành</span><h2>Bạn đã về đích!</h2><p class="hook">Tiếp tục giữ nhịp trong Phòng tập, hoặc học thêm một nhánh khác ở mục Về công cụ.</p><div class="lh-act" style="margin-top:16px"><a class="btn btn-primary btn-lg" href="#/phong-tap">Vào Phòng tập</a><a class="btn btn-secondary" href="#/ban-do">Xem lại bản đồ</a></div></div>'; }
  var L=BY[id], st=stageOf(L), ok=canStart(id);
  var steps=L.milestone?['📖 Ôn & chuẩn bị','🎙️ Kể thành tiếng','✅ Tự chấm']:['📖 Đọc 3 phút','⚡ Thử nhanh 1 phút','🎯 Thực hành 5 phút','✅ Ghi nhận 1 phút'];
  var h='<div class="lesson-hero" style="'+stVars(L)+'"><span class="lh-tag">Ngày '+L.day+' · Chặng '+L.stage+' – '+st.name+(L.branch?' · '+BRANCHES[L.branch].short:'')+(L.milestone?' · Ngày qua màn':'')+'</span>'+
    '<h2>'+esc(L.title)+'</h2><p class="hook">'+esc(L.hook)+'</p><div class="lh-steps">'+steps.map(function(s){ return '<span>'+s+'</span>'; }).join('')+'</div>';
  if(ok) h+='<div class="lh-act"><a class="btn btn-primary btn-lg" href="#/bai/'+id+'">Bắt đầu 10 phút →</a><span class="small muted">Xem video nguồn không tính vào 10 phút.</span></div>';
  else h+='<div class="lh-wait">'+domImg()+'<div><b>Bạn đã xong bài hôm nay rồi, giỏi lắm!</b><div class="small muted">Bài này mở vào ngày mai. Mỗi ngày một chút mới thành thói quen. Trong lúc chờ, ghé Phòng tập hoặc Kho chuyện nhé.</div></div></div>';
  return h+'</div>';
}
function weekStrip(){
  var t=today(), si=streakInfo(), mon=weekKey(t), names=['T2','T3','T4','T5','T6','T7','CN'], h='<div class="week">';
  for(var i=0;i<7;i++){ var k=addDays(mon,i); var c=S.act[k]?'ok':si.rest[k]?'rest':''; if(k===t) c+=' today'; h+='<div><i class="'+c+'"></i>'+names[i]+'</div>'; }
  return h+'</div>';
}
function renderHome(){
  var nid=nextId(), lv=level(), xp=totalXP(), si=streakInfo(), p=path(), dn=p.filter(function(id){ return S.done[id]; }).length;
  var hour=new Date().getHours(), hi=hour<11?'Chào buổi sáng':hour<14?'Chào buổi trưa':hour<18?'Chào buổi chiều':'Chào buổi tối';
  var h='<div class="hello">'+domImg()+'<div><h1>'+hi+'! Hôm nay mình luyện gì nhỉ?</h1><p>Hướng của bạn: <b>'+BRANCHES[S.branch].name+'</b></p></div></div>';
  h+='<div class="today"><div>'+lessonHero(nid)+'</div><div class="card stat-card">'+
     '<div class="lvl"><div class="lvl-badge">'+lv+'</div><div style="flex:1"><div class="small muted">Cấp '+lv+'/5</div><b>'+LEVELS[lv]+'</b><div class="bar"><i style="width:'+Math.round(dn/p.length*100)+'%"></i></div><div class="small muted" style="margin-top:4px">'+dn+'/'+p.length+' bài trên hành trình</div></div></div>'+
     '<div class="kpis"><div class="kpi"><b>🔥 '+si.n+'</b><span>ngày liên tục</span></div><div class="kpi"><b>'+xp+'</b><span>XP</span></div><div class="kpi"><b>'+storyCount()+'</b><span>chuyện trong kho</span></div></div>'+
     weekStrip()+'<p class="small faint" style="margin-top:8px">Mỗi tuần được nghỉ 1 ngày mà không mất chuỗi.</p></div></div>';
  if(S.done.d02){
    var tk=today(), had=S.stories.filter(function(s){ return s.seed&&s.from==='moment'&&s.created===tk; })[0];
    h+='<div class="sec-h"><h2>Khoảnh khắc hôm nay</h2><span class="small muted">2 phút, không tính vào bài học</span></div><div class="card pad">'+
      (had?'<div class="row">'+domImg()+'<div><b>Đã ghi hôm nay ✓</b><div class="muted">'+esc(had.text)+'</div></div></div>':
      '<p class="muted" style="margin-bottom:10px">Nếu hôm nay phải kể một khoảnh khắc, bạn sẽ kể khoảnh khắc nào?</p><div class="moment"><textarea class="inp" id="momentTx" rows="2" placeholder="Một câu thôi, đủ để mình nhớ lại…"></textarea><button class="btn btn-primary" data-act="save-moment">Lưu</button></div>')+'</div>';
  }
  h+='<div class="sec-h"><h2>Huy hiệu</h2><a class="small" href="#/ban-do">Xem bản đồ hành trình →</a></div><div class="card pad"><div class="badges-new" style="justify-content:flex-start">'+BADGES.map(function(b){ var on=S.badges[b.id]; return '<div class="bdg'+(on?'':' off')+'" title="'+esc(b.how)+'"><i>'+b.ic+'</i><b>'+b.name+'</b><span class="faint">'+(on?vnDate(on):b.how)+'</span></div>'; }).join('')+'</div></div>';
  h+='<div class="grid2" style="margin-top:16px"><a class="card pad" href="#/phong-tap" style="text-decoration:none;color:inherit"><b style="font-family:var(--f-wall)">Phòng tập 3 cấp</b><p class="muted small">Bài tập ngắn 1–10 phút, luyện thêm bất cứ lúc nào.</p></a><a class="card pad" href="#/kho" style="text-decoration:none;color:inherit"><b style="font-family:var(--f-wall)">Kho chuyện của bạn</b><p class="muted small">'+storyCount()+' chuyện và hạt giống. Mở ra để tập kể.</p></a></div>';
  view.innerHTML=h;
}

/* ---------- Bản đồ ---------- */
function renderMap(){
  var b=S.branch, p=path(), nid=nextId();
  var h='<div class="page-h"><h1>Bản đồ hành trình 28 ngày</h1><p>Hướng: <b>'+BRANCHES[b].name+'</b>. Bấm vào ngày đã học để ôn lại.</p></div><div class="map">';
  for(var s=1;s<=4;s++){
    var ids=p.filter(function(id){ return BY[id].stage===s; }), dn=ids.filter(function(id){ return S.done[id]; }).length, st=STAGES[s];
    var locked=!ids.some(function(id){ return isOpen(id); });
    h+='<section class="region'+(locked?' locked':'')+'" style="--rc:var('+st.c+');--rs:var('+st.c+'-soft)"><div class="rg-h"><div class="rg-n">'+s+'</div><div><h3>Chặng '+s+' – '+st.name+(s>=3?' · '+BRANCHES[b].short:'')+'</h3><p>'+st.desc+'</p></div><div class="rg-prog">'+dn+'/'+ids.length+'</div></div><div class="path">';
    ids.forEach(function(id){ var L=BY[id], cls=S.done[id]?'done':id===nid?'cur':''; if(L.milestone) cls+=' ms'; var open=isOpen(id);
      h+='<button class="node '+cls+'" '+(open?'data-act="open-lesson" data-id="'+id+'"':'disabled')+' title="'+esc(L.title)+'"><span class="dot"><span>'+(S.done[id]&&!L.milestone?'✓':L.milestone?'★':L.day)+'</span></span><small>'+(L.milestone?'Qua màn: ':'')+esc(L.title)+'</small></button>'; });
    h+='</div></section>';
  }
  var L29=BY.d29;
  if(L29){ var o=isOpen('d29'); h+='<section class="region" style="--rc:var(--s5);--rs:var(--s5-soft)"><div class="finish">'+domImg()+'<div style="flex:1"><h3>Ngày 29 – Về đích</h3><p class="muted">'+esc(L29.hook)+'</p></div>'+(o?'<a class="btn btn-primary" href="#/bai/d29">'+(S.done.d29?'Ôn lại':'Vào')+'</a>':'<span class="pill">🔒 Sau ngày 28</span>')+'</div></section>'; }
  h+='</div><p class="small muted" style="margin-top:16px">Đổi hướng học: vào <a href="#/ve-cong-cu">Về công cụ</a>.</p>';
  view.innerHTML=h;
}

/* ---------- Bài học ---------- */
var LP=null;
function renderLesson(id){
  var L=BY[id]; if(!L||!(id==='d29'?isOpen(id):path().indexOf(id)>=0||PREVIEW)){ go(''); return; }
  if(!canStart(id)){ go(''); toast('Bài này mở vào ngày mai nhé.'); return; }
  if(!LP||LP.id!==id) LP={id:id,step:0,card:0,quiz:null,ord:[],picked:null,f:{},rv:[],good:'',next:'',w:{},replay:!!S.done[id]};
  drawLesson();
}
function lsSteps(L){ return L.quiz?['Đọc','Thử nhanh','Thực hành','Ghi nhận']:['Ôn & chuẩn bị','Thực hành','Ghi nhận']; }
function stepKind(L,i){ return L.quiz?['read','quiz','prac','rev'][i]:['read','prac','rev'][i]; }
function drawLesson(){
  stopMedia();
  var L=BY[LP.id], st=stageOf(L), steps=lsSteps(L), k=stepKind(L,LP.step);
  var h='<div class="ls-wrap" style="'+stVars(L)+'"><div class="ls-top"><button class="back" data-act="ls-exit">← Thoát</button><div class="ls-meta">Ngày '+L.day+' · Chặng '+L.stage+' – '+st.name+(L.branch?' · '+BRANCHES[L.branch].short:'')+' · 10 phút'+(LP.replay?' · <b>Ôn lại</b>':'')+'</div></div>'+
    '<div class="ls-steps">'+steps.map(function(s,i){ return '<div class="ls-step'+(i===LP.step?' on':i<LP.step?' ok':'')+'"><i></i>'+s+'</div>'; }).join('')+'</div>'+
    '<div class="ls-title">'+esc(L.title)+'</div><h2 class="ls-hook">'+esc(L.hook)+'</h2><div id="lsBody"></div></div>';
  view.innerHTML=h;
  var body=$('#lsBody');
  if(k==='read') body.innerHTML=drawRead(L);
  else if(k==='quiz') body.innerHTML=drawQuiz(L);
  else if(k==='prac'){ body.innerHTML=drawPractice(L); mountPractice(L); }
  else body.innerHTML=drawReview(L);
}
var CARD_IC={story:'💬',idea:'💡',how:'🛠️',compare:'⚖️',takeaway:'📌',recap:'🗂️'};
function cardHtml(L,c){
  if(c.type==='takeaway') return '<div class="rcard takeaway">'+domImg()+'<div class="small muted" style="margin-bottom:8px">Mang theo 1 câu</div><div class="big">'+inl(plain(c.body))+'</div></div>';
  var ill=(c.type==='story'||c.type==='compare')?'<span class="tag-ill">ví dụ minh họa</span>':'';
  var h='<div class="rcard"><div class="rc-h"><span class="rc-ic">'+(CARD_IC[c.type]||'•')+'</span><h3>'+esc(c.title||'')+'</h3>'+ill+'</div>';
  if(c.type==='compare'){
    var rows=c.rows.slice();
    var main=rows.filter(function(r){ return !r.branch||r.branch===S.branch; }), rest=rows.filter(function(r){ return r.branch&&r.branch!==S.branch; });
    var row=function(r){ return (r.branch?'<div class="cmp-br">'+BRANCHES[r.branch].short+'</div>':'')+'<div class="cmp-row"><div class="cmp-w"><b>✗ '+esc(c.weakLabel)+'</b>'+inl(r.weak)+'</div><div class="cmp-s"><b>✓ '+esc(c.strongLabel)+'</b>'+inl(r.strong)+'</div></div>'; };
    h+='<div class="cmp">'+main.map(row).join('')+'</div>';
    if(c.note) h+='<p class="small faint" style="margin-top:10px">'+inl(c.note)+'</p>';
    if(rest.length) h+='<details style="margin-top:12px"><summary class="small" style="cursor:pointer;color:var(--accent-strong);font-weight:600">Xem thêm ví dụ ở hướng khác</summary><div class="cmp" style="margin-top:10px">'+rest.map(row).join('')+'</div></details>';
  } else h+='<div class="md">'+md(c.body)+'</div>';
  return h+'</div>';
}
function drawRead(L){
  var n=L.cards.length, c=L.cards[LP.card];
  var h=cardHtml(L,c)+'<div class="dots">'+L.cards.map(function(_,i){ return '<i class="'+(i===LP.card?'on':'')+'"></i>'; }).join('')+'</div>';
  h+='<div class="ls-nav"><button class="btn btn-secondary" data-act="card-prev"'+(LP.card?'':' disabled')+'>← Trước</button>'+(LP.card<n-1?'<button class="btn btn-primary" data-act="card-next">Tiếp →</button>':'<button class="btn btn-primary" data-act="step-next">'+(L.quiz?'Thử nhanh →':'Bắt đầu thực hành →')+'</button>')+'</div>';
  return h;
}
function drawQuiz(L){
  var q=L.quiz, h='<div class="rcard"><div class="rc-h"><span class="rc-ic">⚡</span><h3>Thử nhanh – 1 phút</h3></div><p style="font-weight:600;font-size:16px">'+inl(q.question)+'</p>';
  if(q.kind==='order'){
    if(!LP.qshuf){ var a=q.items.map(function(_,i){ return i; }); for(var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; } if(a.join()===q.items.map(function(_,i){ return i; }).join()) a.reverse(); LP.qshuf=a; }
    h+='<div class="ord-pick">'+LP.ord.map(function(ix,n){ return '<button class="ord-it" data-act="ord-un" data-i="'+ix+'"><span class="n">'+(n+1)+'</span>'+inl(q.items[ix])+'</button>'; }).join('')+'</div>';
    h+='<div class="ord-pool">'+LP.qshuf.filter(function(ix){ return LP.ord.indexOf(ix)<0; }).map(function(ix){ return '<button class="ord-it" data-act="ord-add" data-i="'+ix+'">'+inl(q.items[ix])+'</button>'; }).join('')+'</div>';
    if(LP.quiz!=null) h+='<div class="q-fb '+(LP.quiz?'ok':'no')+'">'+domImg()+'<div><b>'+(LP.quiz?'Chuẩn rồi!':'Chưa đúng thứ tự, thử lại nhé.')+'</b><div>'+inl(q.feedback)+'</div></div></div>';
    h+='</div><div class="ls-nav"><button class="btn btn-secondary" data-act="step-prev">← Đọc lại</button>'+(LP.quiz?'<button class="btn btn-primary" data-act="step-next">Thực hành →</button>':'<button class="btn btn-primary" data-act="ord-check"'+(LP.ord.length===q.items.length?'':' disabled')+'>Kiểm tra</button>')+'</div>';
    return h;
  }
  h+='<div class="q-opts">'+q.options.map(function(o,i){ var cls=''; if(LP.qsel===i) cls=o.correct?'right':'wrong'; else if(LP.quiz&&o.correct) cls='right'; return '<button class="q-opt '+cls+'" data-act="q-pick" data-i="'+i+'"><span class="k">'+'ABCD'[i]+'</span><span>'+inl(o.text)+'</span></button>'; }).join('')+'</div>';
  if(LP.qsel!=null){ var o=q.options[LP.qsel]; h+='<div class="q-fb '+(o.correct?'ok':'no')+'">'+domImg()+'<div>'+inl(o.feedback)+'</div></div>'; }
  h+='</div><div class="ls-nav"><button class="btn btn-secondary" data-act="step-prev">← Đọc lại</button><button class="btn btn-primary" data-act="step-next"'+(LP.quiz?'':' disabled')+'>Thực hành →</button></div>';
  return h;
}
function storyLabel(s){ return s.seed?(s.text||''):(s.title||'(chưa đặt tên)'); }
function pickStoryHtml(sel){
  if(!S.stories.length) return '<p class="small muted">Kho chuyện đang trống. Cứ nhớ lại một lần căng thẳng hoặc vui ở chỗ làm, rồi viết vào các ô bên dưới.</p>';
  return '<div class="pick-st">'+S.stories.slice().reverse().map(function(s){ return '<label class="'+(sel===s.id?'on':'')+'"><input type="radio" name="pst" value="'+s.id+'"'+(sel===s.id?' checked':'')+' data-act="pick-st"><span>'+(s.seed?'🌱 ':'📗 ')+esc(storyLabel(s))+'</span></label>'; }).join('')+'</div>';
}
function drawPractice(L){
  var p=L.practice||{}, h='<div class="rcard"><div class="rc-h"><span class="rc-ic">🎯</span><h3>Thực hành – '+(L.milestone?'6':'5')+' phút</h3></div>';
  if(p.intro) h+='<p class="muted" style="margin-bottom:12px">'+inl(p.intro)+'</p>';
  h+='<ol class="pr-steps">'+(p.steps||[]).map(function(s){ return '<li><div class="md">'+md(s)+'</div></li>'; }).join('')+'</ol>';
  if(p.topics&&p.topics.length&&p.widget!=='flbw') h+='<div class="pr-box"><h4>Đề gợi ý (nếu bạn bí)</h4><div class="chips">'+p.topics.map(function(t,i){ return '<button class="chip'+(LP.w.topic===i?' on':'')+'" data-act="topic" data-i="'+i+'">'+esc(t)+'</button>'; }).join('')+'</div></div>';
  if(p.pickStory) h+='<div class="pr-box"><h4>Chọn 1 chuyện trong kho</h4>'+pickStoryHtml(LP.picked)+'</div>';
  if(p.widget) h+='<div class="pr-box" id="wg"></div>';
  if(p.fields&&p.fields.length) h+='<div class="pr-box">'+p.fields.map(function(f,i){ return '<label class="fld">'+esc(f.label)+'<textarea class="inp" rows="2" data-fld="'+i+'" placeholder="'+esc(f.placeholder||'')+'">'+esc(LP.f[i]||'')+'</textarea></label>'; }).join('')+'</div>';
  if(p.timer) h+='<div class="pr-box"><h4>Nói thành tiếng</h4><div id="timerBox"></div></div>';
  if(p.record) h+='<div class="pr-box"><h4>Ghi lại để nghe lại</h4><div id="recBox"></div></div>';
  h+='</div><div class="ls-nav"><button class="btn btn-secondary" data-act="step-prev">← Quay lại</button><button class="btn btn-primary" data-act="prac-done">Xong, sang tự chấm →</button></div>';
  return h;
}
function mountPractice(L){
  var p=L.practice||{};
  if(p.timer) mountTimer($('#timerBox'),p.timer);
  if(p.record) mountRecorder($('#recBox'),LP.id,S.branch==='B'&&L.stage>=3?'video':'audio');
  if(p.widget) mountWidget($('#wg'),p.widget,L);
}
function drawReview(L){
  var h='<div class="rcard"><div class="rc-h"><span class="rc-ic">✅</span><h3>Ghi nhận – tự chấm</h3></div><p class="muted">Nghe lại (hoặc nhớ lại) phần vừa làm, rồi tích những điều bạn đã làm được.</p><div class="rv-list">'+
    L.review.map(function(r,i){ return '<button class="rv'+(LP.rv[i]?' on':'')+'" data-act="rv" data-i="'+i+'"><span class="box">'+(LP.rv[i]?'✓':'')+'</span><span>'+inl(r)+'</span></button>'; }).join('')+'</div>'+
    '<label class="fld">Một điều mình làm tốt hôm nay<textarea class="inp" rows="2" id="rvGood" placeholder="Ví dụ: mình dám nói hết 60 giây mà không dừng lại">'+esc(LP.good)+'</textarea></label>'+
    (L.milestone&&L.day<28?'<label class="fld" style="margin-top:10px">Một điều mình muốn khác đi ở lần qua màn sau<textarea class="inp" rows="2" id="rvNext">'+esc(LP.next)+'</textarea></label>':'')+
    '</div><div class="ls-nav"><button class="btn btn-secondary" data-act="step-prev">← Quay lại</button><button class="btn btn-primary btn-lg" data-act="finish">'+(LP.replay?'Xong ôn lại':'Hoàn thành bài ✓')+'</button></div>';
  return h;
}
function collectPractice(){
  $all('[data-fld]').forEach(function(t){ LP.f[t.getAttribute('data-fld')]=t.value; });
}
function savePracticeData(L){
  var p=L.practice||{}, vals=(p.fields||[]).map(function(f,i){ return {label:f.label,val:(LP.f[i]||'').trim()}; }).filter(function(x){ return x.val; });
  var t=today(), n=0;
  if(p.saveAs==='seeds') vals.forEach(function(v){ S.stories.push({id:uid(),seed:true,text:v.val,tag:v.label,from:L.id,created:t}); n++; });
  if(p.saveAs==='storyNote'&&vals.length){
    var s=S.stories.filter(function(x){ return x.id===LP.picked; })[0];
    if(s){ s.notes=s.notes||[]; s.notes.push({day:L.day,lid:L.id,title:L.title,items:vals,at:t}); if(!s.seed&&(s.stars||1)<2) s.stars=2; }
    else { S.stories.push({id:uid(),seed:true,text:vals.map(function(v){ return v.val; }).join(' · '),tag:L.title,from:L.id,created:t}); n++; }
  }
  if(p.widget&&WIDGET_SAVE[p.widget]) n+=WIDGET_SAVE[p.widget](L)||0;
  return n;
}
function finishLesson(){
  var L=BY[LP.id], good=($('#rvGood')||{}).value||LP.good, nx=($('#rvNext')||{}).value||LP.next;
  if(LP.replay){ S.done[LP.id].good2=good; markAct(); save(); toast('Đã ôn lại xong. Giỏi lắm!'); LP=null; go('ban-do'); return; }
  var lvBefore=level(), xp=L.milestone?100:50;
  S.done[LP.id]={at:today(),xp:xp,review:L.review.map(function(_,i){ return !!LP.rv[i]; }),good:good,next:nx,fields:LP.f,branch:L.branch||null};
  S.lastNew=today(); markAct();
  var seeds=LP.savedN||0;
  var nb=checkBadges(); save();
  var lvAfter=level(), nid=nextId();
  var h='<div class="celebrate" style="'+stVars(L)+'">'+domImg()+'<h1>'+(L.milestone?'Qua màn rồi!':'Xong Ngày '+L.day+'!')+'</h1><div class="bubble" style="text-align:left;margin-top:10px"><b>Đốm:</b> '+inl(L.done)+'</div><div class="xp-pop">+'+xp+' XP</div>';
  if(lvAfter>lvBefore) h+='<div class="lvup">Lên cấp '+lvAfter+'<b>'+LEVELS[lvAfter]+'</b></div>';
  if(nb.length) h+='<p class="small muted">Huy hiệu mới</p><div class="badges-new">'+nb.map(function(id){ var b=BADGES.filter(function(x){ return x.id===id; })[0]; return '<div class="bdg"><i>'+b.ic+'</i><b>'+b.name+'</b></div>'; }).join('')+'</div>';
  if(seeds) h+='<p class="small muted">Đã thêm '+seeds+' mục vào Kho chuyện.</p>';
  if(L.milestone&&L.day===7) h+='<div class="lock-note" style="margin-top:14px;text-align:left">'+domImg()+'<div class="small"><b>Nhớ sao lưu tiến độ.</b> Tiến độ lưu trên trình duyệt này. Muốn chuyển máy hoặc phòng khi xóa dữ liệu trình duyệt, vào <a href="#/ve-cong-cu">Về công cụ</a> → Sao lưu.</div></div>';
  h+='<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:18px"><a class="btn btn-primary btn-lg" href="#/">Về trang Hôm nay</a><a class="btn btn-secondary" href="#/ban-do">Xem bản đồ</a></div>';
  if(nid) h+='<p class="small muted" style="margin-top:12px">Bài tiếp theo: <b>Ngày '+BY[nid].day+' – '+esc(BY[nid].title)+'</b> mở vào ngày mai.</p>';
  h+=moreVideos(L)+'</div>';
  LP=null; view.innerHTML=h; scrollTop(); confetti();
  renderNav('bai');
}
function moreVideos(L){
  var vs=(L.videos||[]).map(function(m){ return VBY[m]; }).filter(Boolean);
  if(!vs.length) return '';
  return '<div class="more-v" style="text-align:left"><h4>Đọc thêm (không tính vào 10 phút) – video tiếng Anh</h4>'+vs.map(function(v){ return '<button class="vlink" data-act="video" data-m="'+v.ma+'"><i>▶</i><span><b>'+esc(v.vi)+'</b><small>Philipp Humm · tiếng Anh · '+Math.round(v.min)+' phút</small></span></button>'; }).join('')+'</div>';
}

/* ---------- Đồng hồ ---------- */
var media={stream:null,rec:null,timer:null};
function stopMedia(){ if(media.timer){ clearInterval(media.timer); media.timer=null; } try{ if(media.rec&&media.rec.state!=='inactive') media.rec.stop(); }catch(e){} if(media.stream){ media.stream.getTracks().forEach(function(t){ t.stop(); }); media.stream=null; } stopSpeech(); }
function beep(){ try{ var C=window.AudioContext||window.webkitAudioContext; var c=new C(), o=c.createOscillator(), g=c.createGain(); o.frequency.value=880; g.gain.value=.15; o.connect(g); g.connect(c.destination); o.start(); setTimeout(function(){ o.stop(); c.close(); },350); }catch(e){} if(navigator.vibrate) navigator.vibrate(200); }
function mountTimer(box,sec){
  var left=sec, run=false, R=66, C=2*Math.PI*R;
  box.innerHTML='<div class="timer"><div class="t-ring"><svg viewBox="0 0 150 150"><circle class="bg" cx="75" cy="75" r="'+R+'"/><circle class="fg" cx="75" cy="75" r="'+R+'" stroke-dasharray="'+C+'" stroke-dashoffset="0"/></svg><b>0:00</b></div><div class="t-act"><button class="btn btn-primary btn-sm" data-t="go">▶ Bắt đầu</button><button class="btn btn-secondary btn-sm" data-t="reset">↺ Làm lại</button></div></div>';
  var ring=$('.t-ring',box), fg=$('.fg',box), lbl=$('b',ring), btn=$('[data-t="go"]',box);
  function draw(){ lbl.textContent=Math.floor(left/60)+':'+pad(left%60); fg.setAttribute('stroke-dashoffset',String(C*(1-left/sec))); ring.classList.toggle('warn',left<=5&&left>0); }
  function tick(){ left--; if(left<=0){ left=0; stop(); beep(); toast('Hết giờ! Nói nốt câu đang dở rồi dừng nhé.'); } draw(); }
  function stop(){ run=false; clearInterval(media.timer); media.timer=null; btn.textContent='▶ Tiếp tục'; }
  btn.onclick=function(){ if(run){ stop(); return; } if(left<=0) left=sec; run=true; btn.textContent='⏸ Tạm dừng'; clearInterval(media.timer); media.timer=setInterval(tick,1000); };
  $('[data-t="reset"]',box).onclick=function(){ stop(); left=sec; btn.textContent='▶ Bắt đầu'; draw(); };
  draw();
}

/* ---------- Ghi âm / quay ---------- */
function mountRecorder(box,key,mode){
  var can=!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&window.MediaRecorder);
  if(!can){ box.innerHTML='<p class="small muted">Trình duyệt này chưa hỗ trợ ghi âm. Bạn dùng ứng dụng ghi âm của điện thoại rồi nghe lại nhé.</p>'; return; }
  var chunks=[], url=null;
  function ui(state,blob){
    var h='<div class="rec"><div class="rec-row"><span class="rec-mode"><button data-m="audio" class="'+(mode==='audio'?'on':'')+'">🎙️ Ghi âm</button><button data-m="video" class="'+(mode==='video'?'on':'')+'">🎥 Quay video</button></span>';
    if(state==='rec') h+='<span class="rec-dot"></span><b>Đang ghi…</b><button class="btn btn-primary btn-sm" data-r="stop">■ Dừng</button>';
    else h+='<button class="btn btn-primary btn-sm" data-r="start">● '+(blob?'Ghi lại lần nữa':'Bắt đầu ghi')+'</button>';
    h+='</div>';
    if(state==='rec'&&mode==='video') h+='<video id="recLive" autoplay muted playsinline></video>';
    if(blob&&state!=='rec'){ if(url) URL.revokeObjectURL(url); url=URL.createObjectURL(blob.blob||blob); h+=(/video/.test((blob.blob||blob).type)?'<video controls playsinline src="'+url+'"></video>':'<audio controls src="'+url+'"></audio>')+'<p class="small faint">Bản ghi lưu trên máy bạn'+(blob.at?' · '+vnDate(blob.at):'')+'. Không gửi đi đâu.</p>'; }
    box.innerHTML=h+'</div>';
    $all('[data-m]',box).forEach(function(b){ b.onclick=function(){ if(state==='rec') return; mode=b.getAttribute('data-m'); ui(state,blob); }; });
    var st=$('[data-r="start"]',box); if(st) st.onclick=start;
    var sp=$('[data-r="stop"]',box); if(sp) sp.onclick=function(){ try{ media.rec.stop(); }catch(e){} };
  }
  function start(){
    navigator.mediaDevices.getUserMedia(mode==='video'?{audio:true,video:{facingMode:'user',width:{ideal:720}}}:{audio:true}).then(function(stream){
      media.stream=stream; chunks=[];
      var r; try{ r=new MediaRecorder(stream); }catch(e){ toast('Không ghi được trên trình duyệt này.'); return; }
      media.rec=r;
      r.ondataavailable=function(e){ if(e.data&&e.data.size) chunks.push(e.data); };
      r.onstop=function(){ stream.getTracks().forEach(function(t){ t.stop(); }); media.stream=null; var b=new Blob(chunks,{type:r.mimeType||(mode==='video'?'video/webm':'audio/webm')}); var rec={blob:b,at:today()};
        recPut(key,rec).then(function(){ var first=!Object.keys(S.rec).length; S.rec[key]=today(); markAct(); var nb=checkBadges(); save(); if(nb.indexOf('voice')>=0) toast('🎙️ Huy hiệu mới: Dám nói thành tiếng!'); else if(first) toast('Đã lưu bản ghi.'); }).catch(function(){ toast('Không lưu được bản ghi trên máy này, nhưng bạn vẫn nghe lại được ngay.'); });
        ui('idle',rec); };
      r.start(); ui('rec');
      if(mode==='video'){ var v=$('#recLive',box); if(v) v.srcObject=stream; }
    }).catch(function(){ toast('Bạn cần cho phép dùng micro'+(mode==='video'?'/camera':'')+' để ghi.'); });
  }
  ui('idle',null);
  recGet(key).then(function(b){ if(b&&!media.rec) ui('idle',b); });
}

/* ---------- Widget riêng ---------- */
var WIDGET_SAVE={};
function mountWidget(box,w,L){
  var p=L.practice||{};
  if(w==='impromptu'){
    var bank=(PT.impromptu&&PT.impromptu[S.branch||'A'])||[];
    if(LP.w.imp==null) LP.w.imp=Math.floor(Math.random()*bank.length);
    var draw=function(){ box.innerHTML='<div class="imp"><small>Đề ứng khẩu của bạn</small><b>'+esc(bank[LP.w.imp]||'Kể về một khoảnh khắc đáng nhớ trong tuần này.')+'</b><button class="btn btn-secondary btn-sm" data-w="re">🎲 Đổi đề khác</button></div><p class="small faint">Muốn luyện thêm bằng tiếng Anh? Thử <a href="https://speaking.games/" target="_blank" rel="noopener">speaking.games</a> của Philipp Humm.</p>'; $('[data-w="re"]',box).onclick=function(){ LP.w.imp=(LP.w.imp+1+Math.floor(Math.random()*(bank.length-1)))%bank.length; draw(); }; };
    draw();
  }
  if(w==='flbw'){
    var tp=p.topics||['Sếp','Đồng nghiệp','Khách hàng','Buổi họp','Ngày đi làm đầu tiên'];
    var K=['Lần đầu','Gần nhất','Tốt nhất','Tệ nhất'];
    LP.w.fl=LP.w.fl||{t:0,v:['','','','']};
    var drawF=function(){ box.innerHTML='<h4>Chọn 1 chủ đề</h4><div class="chips">'+tp.map(function(t,i){ return '<button class="chip'+(LP.w.fl.t===i?' on':'')+'" data-i="'+i+'">'+esc(t)+'</button>'; }).join('')+'</div><div class="flbw">'+K.map(function(k,i){ return '<label class="fld">'+k+' – '+esc(tp[LP.w.fl.t])+'<textarea class="inp" rows="2" data-k="'+i+'" placeholder="1 dòng thôi">'+esc(LP.w.fl.v[i])+'</textarea></label>'; }).join('')+'</div>';
      $all('.chip',box).forEach(function(c){ c.onclick=function(){ LP.w.fl.t=+c.getAttribute('data-i'); drawF(); }; });
      $all('[data-k]',box).forEach(function(t){ t.oninput=function(){ LP.w.fl.v[+t.getAttribute('data-k')]=t.value; }; }); };
    drawF();
    WIDGET_SAVE.flbw=function(){ var n=0, f=LP.w.fl; if(!f) return 0; f.v.forEach(function(v,i){ if(v.trim()){ S.stories.push({id:uid(),seed:true,text:v.trim(),tag:K[i]+' – '+tp[f.t],from:LP.id,created:today()}); n++; } }); return n; };
  }
  if(w==='highlow'){
    LP.w.hl=LP.w.hl||{g:'',r:[['',2],['',-2],['',1],['',-3],['',3],['',-1]],link:''};
    var drawH=function(){ var H=LP.w.hl; var pts=H.r.map(function(x,i){ return (20+i*(560/5))+','+(70-x[1]*18); }).join(' ');
      box.innerHTML='<label class="fld">Giai đoạn bạn chọn<input class="inp" data-h="g" value="'+esc(H.g)+'" placeholder="Ví dụ: năm đầu đi làm"></label><h4>3 đỉnh và 3 đáy, theo thứ tự thời gian (kéo thanh: phải là vui, trái là buồn)</h4><div class="hl">'+H.r.map(function(x,i){ return '<div class="hl-row"><span>'+(i+1)+'</span><input class="inp" data-hr="'+i+'" value="'+esc(x[0])+'" placeholder="'+(x[1]>=0?'Một đỉnh: lúc vui, tự hào…':'Một đáy: lúc hụt hẫng, bế tắc…')+'"><input type="range" min="-3" max="3" step="1" value="'+x[1]+'" data-hv="'+i+'" aria-label="Mức vui buồn"></div>'; }).join('')+'</div>'+
        '<svg class="hl-svg" viewBox="0 0 600 140" preserveAspectRatio="none"><line x1="0" y1="70" x2="600" y2="70" stroke="var(--border-strong)" stroke-dasharray="4 4"/><polyline points="'+pts+'" fill="none" stroke="var(--stc)" stroke-width="3" stroke-linejoin="round"/>'+H.r.map(function(x,i){ return '<circle cx="'+(20+i*112)+'" cy="'+(70-x[1]*18)+'" r="6" fill="'+(x[1]>=0?'var(--accent)':'var(--danger)')+'"/>'; }).join('')+'</svg>'+
        '<label class="fld">Câu nối: Từ ___ đến ___, mình đã hiểu ra ___<textarea class="inp" rows="2" data-h="link">'+esc(H.link)+'</textarea></label>';
      $all('[data-hr]',box).forEach(function(t){ t.oninput=function(){ H.r[+t.getAttribute('data-hr')][0]=t.value; }; });
      $all('[data-hv]',box).forEach(function(t){ t.oninput=function(){ H.r[+t.getAttribute('data-hv')][1]=+t.value; drawH(); }; });
      $all('[data-h]',box).forEach(function(t){ t.oninput=function(){ H[t.getAttribute('data-h')]=t.value; }; }); };
    drawH();
    WIDGET_SAVE.highlow=function(){ var H=LP.w.hl, n=0; if(!H) return 0; H.r.forEach(function(x){ if(x[0].trim()){ S.stories.push({id:uid(),seed:true,text:x[0].trim(),tag:(x[1]>=0?'Đỉnh':'Đáy')+(H.g?' – '+H.g:''),from:LP.id,created:today(),lesson:H.link||''}); n++; } }); return n; };
  }
  if(w==='shelf'){
    LP.w.sh=LP.w.sh||{};
    var drawS=function(){ var seeds=S.stories.filter(function(s){ return s.seed; });
      if(!seeds.length){ box.innerHTML='<p class="small muted">Chưa có hạt giống nào. Bạn có thể vào Kho chuyện để thêm chuyện mới.</p>'; return; }
      var picked=Object.keys(LP.w.sh);
      box.innerHTML='<h4>Chọn tối đa 5 hạt giống để lên kệ ('+picked.length+'/5)</h4><div class="pick-st">'+seeds.map(function(s){ var on=!!LP.w.sh[s.id]; return '<label class="'+(on?'on':'')+'"><input type="checkbox" data-sid="'+s.id+'"'+(on?' checked':'')+'><span>🌱 '+esc(s.text)+(s.tag?' <span class="faint">· '+esc(s.tag)+'</span>':'')+'</span></label>'; }).join('')+'</div>'+
        picked.map(function(id){ var s=S.stories.filter(function(x){ return x.id===id; })[0]; if(!s) return ''; var d=LP.w.sh[id]; return '<div class="card pad" style="margin-top:6px"><div class="small faint">🌱 '+esc(s.text)+'</div><label class="fld" style="margin-top:8px">Tên chuyện (3–5 chữ, có hình ảnh)<input class="inp" data-sh="'+id+'" data-k="title" value="'+esc(d.title||'')+'"></label><label class="fld" style="margin-top:8px">Ý chính (1 câu)<input class="inp" data-sh="'+id+'" data-k="idea" value="'+esc(d.idea||'')+'"></label><div class="chips" style="margin-top:8px">'+USES.map(function(u){ return '<button class="chip'+((d.uses||[]).indexOf(u)>=0?' on':'')+'" data-shu="'+id+'" data-u="'+u+'">'+u+'</button>'; }).join('')+'</div></div>'; }).join('');
      $all('[data-sid]',box).forEach(function(c){ c.onchange=function(){ var id=c.getAttribute('data-sid'); if(c.checked){ if(Object.keys(LP.w.sh).length>=5){ c.checked=false; toast('Tối đa 5 chuyện mỗi lần nhé.'); return; } LP.w.sh[id]={uses:[]}; } else delete LP.w.sh[id]; drawS(); }; });
      $all('[data-sh]',box).forEach(function(t){ t.oninput=function(){ LP.w.sh[t.getAttribute('data-sh')][t.getAttribute('data-k')]=t.value; }; });
      $all('[data-shu]',box).forEach(function(b){ b.onclick=function(){ var d=LP.w.sh[b.getAttribute('data-shu')], u=b.getAttribute('data-u'), i=d.uses.indexOf(u); if(i>=0) d.uses.splice(i,1); else d.uses.push(u); b.classList.toggle('on'); }; }); };
    drawS();
    WIDGET_SAVE.shelf=function(){ var n=0; Object.keys(LP.w.sh||{}).forEach(function(id){ var s=S.stories.filter(function(x){ return x.id===id; })[0], d=LP.w.sh[id]; if(!s) return; s.seed=false; s.title=(d.title||'').trim()||s.text.slice(0,40); s.idea=(d.idea||'').trim(); s.uses=d.uses||[]; s.stars=1; s.body=s.body||s.text; n++; }); return n; };
  }
  if(w==='compare7'){
    box.innerHTML='<h4>Nghe lại bản ghi ngày 7 và ngày 28</h4><div class="grid2"><div><b class="small">Ngày 7</b><div id="c7a" class="small muted">Đang tìm…</div></div><div><b class="small">Ngày 28</b><div id="c7b" class="small muted">Đang tìm…</div></div></div>';
    [['d07','#c7a'],['d28'+(S.branch||'A'),'#c7b']].forEach(function(x){ recGet(x[0]).then(function(r){ var el=$(x[1],box); if(!el) return; if(!r){ el.textContent='Chưa có bản ghi trên máy này. Hãy nhớ lại lần kể hôm đó.'; return; } var u=URL.createObjectURL(r.blob); el.innerHTML=/video/.test(r.blob.type)?'<video controls playsinline src="'+u+'" style="width:100%;border-radius:12px"></video>':'<audio controls src="'+u+'" style="width:100%"></audio>'; }); });
  }
}

/* ---------- Phòng tập ---------- */
var gymLv=null;
function maxDayDone(){ var m=0; for(var k in S.done){ var L=BY[k]; if(L&&L.day>m) m=L.day; } return m; }
function lvOpen(lv){ return PREVIEW||maxDayDone()+1>=lv.unlockDay||(lv.unlockDay<=1); }
function renderGym(){
  var lvs=PT.levels||[]; if(gymLv==null){ gymLv=0; lvs.forEach(function(l,i){ if(lvOpen(l)) gymLv=i; }); }
  var lv=lvs[gymLv];
  var h='<div class="page-h"><h1>Phòng tập</h1><p>Bài tập ngắn để luyện thêm ngoài lộ trình. Cấp mới mở dần theo hành trình của bạn.</p></div><div class="lv-tabs">'+lvs.map(function(l,i){ var o=lvOpen(l); return '<button class="lv-tab'+(i===gymLv?' on':'')+'" data-act="gym-lv" data-i="'+i+'"'+(o?'':' disabled')+'>'+(o?'':'🔒 ')+esc(l.name)+'</button>'; }).join('')+'</div>';
  if(!lvOpen(lv)) h+='<div class="lock-note">'+domImg()+'<div>Cấp này mở sau khi bạn học tới ngày '+lv.unlockDay+'.</div></div>';
  else h+='<div class="ex-grid">'+lv.exercises.map(function(e){ var c=(S.pt[e.id]||{}).n||0; return '<button class="ex" data-act="open-ex" data-id="'+e.id+'"><b>'+esc(e.title)+'</b><span>'+esc(e.desc)+'</span><div class="meta"><em>⏱ '+(e.minutes||2)+' phút</em>'+(e.record?'<em>🎙️ Ghi âm</em>':'')+(e.impromptu?'<em>🎲 Đề ngẫu nhiên</em>':'')+(c?'<em>✓ Đã tập '+c+' lần</em>':'')+'</div></button>'; }).join('')+'</div>';
  view.innerHTML=h;
}
function findEx(id){ var r=null; (PT.levels||[]).forEach(function(l){ l.exercises.forEach(function(e){ if(e.id===id) r={e:e,l:l}; }); }); return r; }
function renderExercise(id){
  var f=findEx(id); if(!f||!lvOpen(f.l)){ go('phong-tap'); return; }
  var e=f.e;
  var h='<div class="ls-wrap" style="--stc:var(--s2);--stc-soft:var(--s2-soft)"><div class="ls-top"><a class="back btn btn-secondary btn-sm" href="#/phong-tap">← Phòng tập</a><div class="ls-meta">'+esc(f.l.name)+' · '+(e.minutes||2)+' phút</div></div><h2 class="ls-hook">'+esc(e.title)+'</h2><div class="rcard"><p class="muted" style="margin-bottom:12px">'+esc(e.desc)+'</p><ol class="pr-steps">'+(e.steps||[]).map(function(s){ return '<li><div class="md">'+md(s)+'</div></li>'; }).join('')+'</ol>'+
    (e.impromptu?'<div class="pr-box" id="exImp"></div>':'')+(e.pickStory?'<div class="pr-box"><h4>Chuyện trong kho để tập</h4>'+pickStoryHtml(null)+'</div>':'')+
    (e.timer?'<div class="pr-box"><h4>Nói thành tiếng</h4><div id="timerBox"></div></div>':'')+(e.record?'<div class="pr-box"><h4>Ghi lại để nghe lại</h4><div id="recBox"></div></div>':'')+
    '</div><div class="ls-nav"><span></span><button class="btn btn-primary" data-act="ex-done" data-id="'+e.id+'">Xong bài tập ✓</button></div></div>';
  view.innerHTML=h;
  if(e.impromptu){ LP={id:'pt-'+e.id,w:{}}; mountWidget($('#exImp'),'impromptu',{practice:{}}); }
  if(e.timer) mountTimer($('#timerBox'),e.timer);
  if(e.record) mountRecorder($('#recBox'),'pt-'+e.id,S.branch==='B'?'video':'audio');
}

/* ---------- Kho chuyện ---------- */
var khoUse='';
function renderKho(){
  var stories=S.stories.filter(function(s){ return !s.seed&&(!khoUse||(s.uses||[]).indexOf(khoUse)>=0); }), seeds=S.stories.filter(function(s){ return s.seed; });
  var h='<div class="page-h" style="display:flex;justify-content:space-between;align-items:end;gap:12px;flex-wrap:wrap"><div><h1>Kho chuyện</h1><p>Mỗi chuyện có tên thì mới gọi ra được. Kho chỉ lưu trên máy bạn.</p></div><a class="btn btn-primary" href="#/kho/moi">+ Dựng chuyện mới</a></div>';
  h+='<div class="chips" style="margin-bottom:14px"><button class="chip'+(khoUse?'':' on')+'" data-act="kho-use" data-u="">Tất cả</button>'+USES.map(function(u){ return '<button class="chip'+(khoUse===u?' on':'')+'" data-act="kho-use" data-u="'+u+'">'+u+'</button>'; }).join('')+'</div>';
  if(!stories.length) h+='<div class="empty card">'+domImg()+'<p>'+(khoUse?'Chưa có chuyện nào cho dịp "'+esc(khoUse)+'".':'Kệ chuyện còn trống. Bấm <b>Dựng chuyện mới</b> để Đốm hỏi bạn từng câu, hoặc biến một hạt giống bên dưới thành chuyện.')+'</p></div>';
  else h+='<div class="shelf">'+stories.map(function(s,i){ var c=BOOK_COL[i%5]; return '<button class="book" style="--bk:var('+c+'-soft);--bkc:var('+c+')" data-act="open-story" data-id="'+s.id+'"><b>'+esc(s.title)+'</b><span class="op">'+esc(s.idea||s.body||'')+'</span><div class="ft"><span class="stars">'+'★★★'.slice(0,s.stars||1)+'<span class="faint">'+'★★★'.slice(0,3-(s.stars||1))+'</span></span>'+(s.told?'<span class="told">Đã kể</span>':'')+'</div></button>'; }).join('')+'</div>';
  h+='<div class="sec-h"><h2>Hạt giống ('+seeds.length+')</h2><span class="small muted">Những khoảnh khắc bạn nhặt được, chưa thành chuyện</span></div>';
  h+=seeds.length?'<div class="seeds">'+seeds.slice().reverse().map(function(s){ return '<div class="seed"><span class="s-ic">🌱</span><div class="s-tx">'+esc(s.text)+'<small>'+(s.tag?esc(s.tag)+' · ':'')+vnDate(s.created||today())+'</small></div><a class="btn btn-ghost btn-sm" href="#/kho/moi/'+s.id+'">Dựng thành chuyện</a><button class="btn btn-ghost btn-sm" data-act="del-seed" data-id="'+s.id+'" title="Xóa">✕</button></div>'; }).join('')+'</div>':'<p class="muted small">Chưa có hạt giống. Học Ngày 1–2 hoặc ghi "Khoảnh khắc hôm nay" ở trang Hôm nay.</p>';
  h+='<p class="small faint" style="margin-top:16px">Độ sẵn sàng: ★ hạt giống mới dựng · ★★ đã dựng khung · ★★★ đã kể thử.</p>';
  view.innerHTML=h;
}
var WQ=[['where','Chuyện này xảy ra ở đâu, khi nào?','Ví dụ: 8 giờ sáng thứ Hai, ở bàn làm việc'],['doing','Lúc đó bạn đang làm gì?','Ví dụ: mình đang mở laptop chuẩn bị họp'],['turn','Có điều gì bất ngờ hay khó khăn xảy ra?','Ví dụ: khách gọi, giọng rất gắt'],['thought','Trong đầu bạn nghĩ gì, nguyên văn?','Ví dụ: "Chết rồi, mình quên mất"'],['end','Rồi bạn đã làm gì? Chuyện kết thúc ra sao?','Ví dụ: mình xin lỗi, giao lại ngay trong buổi chiều'],['lesson','Bạn rút ra điều gì?','Ví dụ: chậm 5 phút xác nhận còn hơn sửa cả ngày'],['title','Đặt cho chuyện một cái tên ngắn, có hình ảnh','Ví dụ: "Cuộc gọi 8 giờ sáng"']];
var WZ=null;
function renderWizard(seedId){
  if(!WZ||WZ.seed!==(seedId||null)){ WZ={seed:seedId||null,i:0,a:{}}; var s=seedId&&S.stories.filter(function(x){ return x.id===seedId; })[0]; if(s){ WZ.a.turn=s.text; WZ.prefill=s.text; } }
  var h='<div class="wiz"><div class="ls-top"><a class="back btn btn-secondary btn-sm" href="#/kho">← Kho chuyện</a><div class="ls-meta">Dựng chuyện cùng Đốm · '+Math.min(WZ.i+1,WQ.length)+'/'+WQ.length+'</div></div><div class="chat">';
  if(WZ.prefill) h+='<div class="msg">'+domImg()+'<div class="b">Mình cùng dựng hạt giống này thành chuyện nhé: <i>"'+esc(WZ.prefill)+'"</i></div></div>';
  for(var i=0;i<WZ.i&&i<WQ.length;i++){ h+='<div class="msg">'+domImg()+'<div class="b">'+WQ[i][1]+'</div></div>'; h+='<div class="msg me"><div class="b">'+(WZ.a[WQ[i][0]]?esc(WZ.a[WQ[i][0]]):'<i class="faint">(bỏ qua)</i>')+'</div></div>'; }
  if(WZ.i<WQ.length){
    var q=WQ[WZ.i];
    h+='<div class="msg">'+domImg()+'<div class="b">'+q[1]+'</div></div></div><div class="ans"><textarea class="inp" id="wzA" rows="3" placeholder="'+esc(q[2])+'">'+esc(WZ.a[q[0]]||'')+'</textarea>'+(SR?'<button class="mic" id="wzMic" title="Nói thay vì gõ">🎙️</button>':'')+'</div><div class="ls-nav"><button class="btn btn-ghost" data-act="wz-skip">Bỏ qua</button><button class="btn btn-primary" data-act="wz-next">'+(WZ.i===WQ.length-1?'Xong':'Trả lời')+' →</button></div>'+(SR?'<p class="small faint" style="margin-top:6px">Bấm 🎙️ để nói, Đốm sẽ chép lại giúp bạn (cần mạng, tùy trình duyệt).</p>':'');
  } else {
    var a=WZ.a, body=composeStory(a);
    h+='<div class="msg">'+domImg()+'<div class="b">Đây là câu chuyện của bạn. Sửa lại cho giống giọng mình rồi lưu lên kệ nhé!</div></div></div><div class="card pad"><label class="fld">Tên chuyện<input class="inp" id="wzT" value="'+esc(a.title||'')+'"></label><label class="fld" style="margin-top:10px">Câu chuyện<textarea class="inp" id="wzB" rows="8">'+esc(body)+'</textarea></label><label class="fld" style="margin-top:10px">Ý chính (1 câu)<input class="inp" id="wzI" value="'+esc(a.lesson||'')+'"></label><div class="fld" style="margin-top:10px">Dùng khi nào<div class="chips" id="wzU">'+USES.map(function(u){ return '<button class="chip" data-u="'+u+'">'+u+'</button>'; }).join('')+'</div></div><div class="ls-nav" style="margin-top:14px"><button class="btn btn-ghost" data-act="wz-back">← Sửa câu trả lời</button><button class="btn btn-primary" data-act="wz-save">Lưu lên kệ chuyện</button></div></div>';
  }
  view.innerHTML=h+'</div>';
  var ta=$('#wzA'); if(ta){ ta.focus(); ta.onkeydown=function(e){ if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)) wzNext(false); }; }
  var mic=$('#wzMic'); if(mic) mic.onclick=function(){ toggleSpeech(mic,ta); };
  $all('#wzU .chip').forEach(function(c){ c.onclick=function(){ c.classList.toggle('on'); }; });
}
function composeStory(a){
  var p=[];
  var s1=[a.where,a.doing].filter(Boolean).map(function(x){ return x.trim().replace(/[.。]$/,''); }).join('. ');
  if(s1) p.push(s1+'.');
  if(a.turn) p.push(a.turn.trim().replace(/[^.!?…"]$/,'$&.'));
  if(a.thought) p.push('Mình nghĩ: "'+a.thought.trim().replace(/^"|"$/g,'')+'"');
  if(a.end) p.push(a.end.trim().replace(/[^.!?…"]$/,'$&.'));
  if(a.lesson) p.push('Điều mình rút ra: '+a.lesson.trim().replace(/[^.!?…]$/,'$&.'));
  return p.join('\n\n');
}
function wzNext(skip){ var ta=$('#wzA'); stopSpeech(); if(ta) WZ.a[WQ[WZ.i][0]]=skip?'':ta.value.trim(); WZ.i++; renderWizard(WZ.seed); }
function wzSave(){
  var t=$('#wzT').value.trim(), b=$('#wzB').value.trim(); if(!t&&!b){ toast('Bạn chưa viết gì cả.'); return; }
  var uses=$all('#wzU .chip.on').map(function(c){ return c.getAttribute('data-u'); });
  var st={id:uid(),seed:false,title:t||b.slice(0,40),body:b,idea:$('#wzI').value.trim(),uses:uses,stars:2,created:today(),notes:[]};
  if(WZ.seed){ var i=S.stories.findIndex(function(x){ return x.id===WZ.seed; }); if(i>=0){ st.id=WZ.seed; st.text=S.stories[i].text; S.stories[i]=st; } else S.stories.push(st); } else S.stories.push(st);
  markAct(); var nb=checkBadges(); save(); WZ=null; toast(nb.indexOf('kho10')>=0?'📚 Huy hiệu mới: Kho 10 chuyện!':'Đã lưu chuyện lên kệ.'); go('kho/'+st.id);
}
function renderStory(id){
  var s=S.stories.filter(function(x){ return x.id===id; })[0]; if(!s||s.seed){ go('kho'); return; }
  var h='<div class="ls-wrap st-view"><div class="ls-top"><a class="back btn btn-secondary btn-sm" href="#/kho">← Kho chuyện</a></div><div class="card pad"><label class="fld">Tên chuyện<input class="inp" id="stT" value="'+esc(s.title)+'"></label>'+
    '<div class="row" style="margin-top:12px;flex-wrap:wrap"><span class="small muted">Độ sẵn sàng</span>'+[1,2,3].map(function(n){ return '<button class="chip'+((s.stars||1)===n?' on':'')+'" data-act="st-star" data-n="'+n+'">'+'★★★'.slice(0,n)+'</button>'; }).join('')+'<button class="chip'+(s.told?' on':'')+'" data-act="st-told">🤝 Đã kể cho người thật</button></div>'+
    '<label class="fld" style="margin-top:12px">Ý chính<input class="inp" id="stI" value="'+esc(s.idea||'')+'"></label><label class="fld" style="margin-top:12px">Câu chuyện<textarea class="inp" id="stB" rows="9">'+esc(s.body||s.text||'')+'</textarea></label>'+
    '<div class="fld" style="margin-top:12px">Dùng khi nào<div class="chips" id="stU">'+USES.map(function(u){ return '<button class="chip'+((s.uses||[]).indexOf(u)>=0?' on':'')+'" data-u="'+u+'">'+u+'</button>'; }).join('')+'</div></div>'+
    '<div class="ls-nav" style="margin-top:14px"><button class="btn btn-ghost" data-act="st-del" data-id="'+s.id+'" style="color:var(--danger)">Xóa chuyện</button><button class="btn btn-primary" data-act="st-save" data-id="'+s.id+'">Lưu thay đổi</button></div></div>';
  if(s.notes&&s.notes.length) h+='<div class="sec-h"><h2>Ghi chú từ các bài học</h2></div><div class="note-list">'+s.notes.map(function(n){ return '<div class="note-it"><small>Ngày '+n.day+' – '+esc(n.title)+' · '+vnDate(n.at)+'</small>'+n.items.map(function(x){ return '<div><b>'+esc(x.label)+'</b> '+esc(x.val)+'</div>'; }).join('')+'</div>'; }).join('')+'</div>';
  h+='<div class="sec-h"><h2>Tập kể chuyện này</h2><span class="small muted">60 giây, ghi lại để nghe</span></div><div class="grid2"><div class="card pad" id="timerBox"></div><div class="card pad" id="recBox"></div></div></div>';
  view.innerHTML=h;
  $all('#stU .chip').forEach(function(c){ c.onclick=function(){ c.classList.toggle('on'); }; });
  mountTimer($('#timerBox'),60); mountRecorder($('#recBox'),'st-'+s.id,S.branch==='B'?'video':'audio');
}

/* ---------- Nhập bằng giọng nói ---------- */
var SR=window.SpeechRecognition||window.webkitSpeechRecognition, srObj=null;
function stopSpeech(){ if(srObj){ try{ srObj.stop(); }catch(e){} srObj=null; } }
function toggleSpeech(btn,ta){
  if(srObj){ stopSpeech(); btn.classList.remove('on'); return; }
  var r=new SR(); r.lang='vi-VN'; r.interimResults=false; r.continuous=true;
  r.onresult=function(e){ for(var i=e.resultIndex;i<e.results.length;i++) if(e.results[i].isFinal) ta.value=(ta.value?ta.value.replace(/\s*$/,' '):'')+e.results[i][0].transcript; };
  r.onend=function(){ btn.classList.remove('on'); srObj=null; };
  r.onerror=function(){ toast('Không nghe được. Kiểm tra quyền micro hoặc gõ giúp Đốm nhé.'); };
  try{ r.start(); srObj=r; btn.classList.add('on'); }catch(e){}
}

/* ---------- Video ---------- */
var VF={tag:'',lv:'',len:'',q:'',use:false};
function videoUses(){ var m={}; path().forEach(function(id){ (BY[id].videos||[]).forEach(function(v){ (m[v]=m[v]||[]).push(BY[id].day); }); }); return m; }
function renderVideos(){
  var uses=videoUses(), TAGS=['Kể chuyện','Mở bài','Kết bài','Nói rõ','Tự tin','Trước camera'];
  var list=VIDEOS.filter(function(v){ if(VF.tag&&v.tags.indexOf(VF.tag)<0) return false; if(VF.lv&&v.level!==VF.lv) return false; if(VF.len==='s'&&v.min>=10) return false; if(VF.len==='m'&&(v.min<10||v.min>20)) return false; if(VF.len==='l'&&v.min<=20) return false; if(VF.use&&!uses[v.ma]) return false; if(VF.q&&norm(v.vi+' '+v.sum).indexOf(norm(VF.q))<0) return false; return true; });
  var h='<div class="page-h"><h1>Video nguồn</h1><p>'+VIDEOS.length+' video tiếng Anh của Philipp Humm, đặt tên tiếng Việt và tóm tắt ý chính. Bài học đã đủ để học, video là phần đọc thêm.</p></div>';
  h+='<div class="vf"><input class="inp" id="vfQ" placeholder="Tìm video…" value="'+esc(VF.q)+'"><select class="inp" id="vfLv" style="max-width:160px"><option value="">Mọi cấp độ</option><option'+(VF.lv==='Cơ bản'?' selected':'')+'>Cơ bản</option><option'+(VF.lv==='Nâng cao'?' selected':'')+'>Nâng cao</option></select><select class="inp" id="vfLen" style="max-width:170px"><option value="">Mọi độ dài</option><option value="s"'+(VF.len==='s'?' selected':'')+'>Dưới 10 phút</option><option value="m"'+(VF.len==='m'?' selected':'')+'>10–20 phút</option><option value="l"'+(VF.len==='l'?' selected':'')+'>Trên 20 phút</option></select><button class="chip'+(VF.use?' on':'')+'" data-act="vf-use">Dùng trong bài học của tôi</button></div>';
  h+='<div class="chips" style="margin-bottom:16px"><button class="chip'+(VF.tag?'':' on')+'" data-act="vf-tag" data-t="">Tất cả chủ đề</button>'+TAGS.map(function(t){ return '<button class="chip'+(VF.tag===t?' on':'')+'" data-act="vf-tag" data-t="'+t+'">'+t+'</button>'; }).join('')+'</div>';
  h+=list.length?'<div class="v-grid">'+list.map(function(v){ return '<button class="vcard" data-act="video" data-m="'+v.ma+'"><div class="vthumb" style="background-image:url(https://i.ytimg.com/vi/'+esc(v.id)+'/mqdefault.jpg)"><em>'+Math.round(v.min)+' phút</em></div><div class="vbody"><b>'+esc(v.vi)+'</b><p>'+esc(v.sum)+'</p><div class="vtags"><em class="lv">'+esc(v.level)+'</em>'+v.tags.map(function(t){ return '<em>'+esc(t)+'</em>'; }).join('')+(uses[v.ma]?'<em class="use">Dùng trong: Ngày '+uses[v.ma].join(', ')+'</em>':'')+'</div></div></button>'; }).join('')+'</div>':'<div class="empty card">'+domImg()+'<p>Không có video phù hợp bộ lọc.</p></div>';
  view.innerHTML=h;
  var q=$('#vfQ'); q.oninput=function(){ VF.q=q.value; clearTimeout(q._t); q._t=setTimeout(function(){ var pos=q.selectionStart; renderVideos(); var n=$('#vfQ'); n.focus(); try{ n.setSelectionRange(pos,pos); }catch(e){} },250); };
  $('#vfLv').onchange=function(){ VF.lv=this.value; renderVideos(); };
  $('#vfLen').onchange=function(){ VF.len=this.value; renderVideos(); };
}
function openVideo(ma){
  var v=VBY[ma]; if(!v) return;
  openModal(modalHead(esc(v.vi),'Philipp Humm · tiếng Anh · '+Math.round(v.min)+' phút')+'<div class="modal-body"><div class="video-wrap"><iframe src="https://www.youtube-nocookie.com/embed/'+encodeURIComponent(v.id)+'?rel=0" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="'+esc(v.vi)+'"></iframe></div><p style="margin-top:12px">'+esc(v.sum)+'</p><p class="small muted" style="margin-top:10px">Bật phụ đề tự dịch: bấm ⚙ → Phụ đề → Tự động dịch → Tiếng Việt. <a href="https://www.youtube.com/watch?v='+encodeURIComponent(v.id)+'" target="_blank" rel="noopener">Mở trên YouTube</a></p></div>');
}

/* ---------- Về công cụ ---------- */
function renderAbout(){
  var b=S.branch;
  var h='<div class="about"><div class="page-h"><h1>Về công cụ</h1><p>Luyện tập thuyết trình, kể chuyện (storytelling) – mỗi ngày 10 phút.</p></div>'+
  '<div class="credit">'+domImg()+'<div><b>Nguồn kiến thức</b><p>Nội dung được tổng hợp, viết lại bằng tiếng Việt và thiết kế thành lộ trình từ kiến thức trên kênh YouTube của <a href="https://www.youtube.com/@Philipp-Humm" target="_blank" rel="noopener">Philipp Humm</a> (tiếng Anh) và bài tập "Homework for Life" của người kể chuyện Matthew Dicks. Mọi ví dụ trong bài là ví dụ minh họa do Quản trị tử tế soạn. Công cụ miễn phí và <b>không có liên kết với các tác giả</b>.</p></div></div>';
  h+='<h2>Hướng học của bạn</h2>'+(b?'<p>Đang học: <b>'+BRANCHES[b].name+'</b>. Ngày 1–14 dùng chung; từ ngày 15 bài học đi theo hướng này. Đổi hướng sau ngày 15 thì chặng 3–4 bắt đầu lại từ ngày 15 của hướng mới (bài đã học vẫn được giữ).</p>':'<p>Bạn chưa chọn hướng học.</p>')+'<div class="chips" style="margin-top:10px">'+['A','B','C'].map(function(k){ return '<button class="chip'+(b===k?' on':'')+'" data-act="set-branch" data-b="'+k+'">'+k+'. '+BRANCHES[k].name+'</button>'; }).join('')+'</div>';
  h+='<h2>Nhắc học mỗi ngày</h2><p>Tải file lịch để điện thoại nhắc bạn 10 phút luyện kể mỗi ngày (mở được bằng Lịch Google, Apple, Outlook).</p><div class="row" style="margin-top:10px;flex-wrap:wrap"><input type="time" class="inp" id="remT" value="21:00" style="max-width:140px"><button class="btn btn-secondary" data-act="ics">📅 Tải lịch nhắc</button></div>';
  h+='<h2>Dữ liệu của bạn</h2><p>Tiến độ, kho chuyện và bản ghi chỉ lưu trên trình duyệt này, không gửi đi đâu. Xóa dữ liệu trình duyệt sẽ mất tiến độ, nên thỉnh thoảng hãy sao lưu.</p><div class="row" style="margin-top:10px;flex-wrap:wrap"><button class="btn btn-primary" data-act="backup">⬇ Sao lưu tiến độ</button><label class="btn btn-secondary">⬆ Khôi phục từ file<input type="file" accept=".json,application/json" id="restoreF" hidden></label><button class="btn btn-ghost" data-act="reset" style="color:var(--danger)">Xóa toàn bộ và học lại</button></div><p class="small faint" style="margin-top:6px">File sao lưu gồm tiến độ và kho chuyện; bản ghi âm/video không nằm trong file.</p>';
  h+='<h2>Cách học hiệu quả</h2><ul><li>Học đúng 1 bài mỗi ngày, cùng một giờ. Bài tiếp theo mở vào ngày hôm sau.</li><li>Luôn nói thành tiếng, dù chỉ một mình. Đọc thầm không luyện được giọng.</li><li>Ghi lại và nghe lại. Lần đầu nghe giọng mình ai cũng thấy lạ, nghe nhiều sẽ quen.</li><li>Mỗi lần chỉ sửa 1 điểm.</li></ul>';
  h+='<p class="ver" style="margin-top:24px" data-act="ver-tap">Phiên bản cập nhật ngày '+VERDATE+' · bản '+VER+(PREVIEW?' · <b>Chế độ xem trước: mở tất cả bài</b> <a href="#" data-act="preview-off">tắt</a>':'')+'</p></div>';
  view.innerHTML=h;
  $('#restoreF').onchange=function(){ var f=this.files[0]; if(!f) return; var r=new FileReader(); r.onload=function(){ try{ var d=JSON.parse(r.result); if(!d||d.app!=='storytelling'||!d.state) throw 0; if(!confirm('Khôi phục sẽ thay toàn bộ tiến độ hiện tại bằng dữ liệu trong file. Tiếp tục?')) return; S=d.state; save(); load(); toast('Đã khôi phục tiến độ.'); go(''); }catch(e){ toast('File không đúng định dạng sao lưu của công cụ.'); } }; r.readAsText(f); };
}
var VERDATE=(document.querySelector('.ver')||{textContent:''}).textContent.replace(/.*ngày\s*([\d/]+).*/,'$1');
function download(name,text,type){ var b=new Blob([text],{type:type}); var a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=name; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); },500); }
function ics(){
  var t=($('#remT').value||'21:00').split(':'), d=new Date(); d.setHours(+t[0],+t[1],0,0); if(d<new Date()) d.setDate(d.getDate()+1);
  var f=function(x){ return x.getFullYear()+pad(x.getMonth()+1)+pad(x.getDate())+'T'+pad(x.getHours())+pad(x.getMinutes())+'00'; }, e=new Date(d.getTime()+10*60000);
  var url=location.href.split('#')[0];
  var s=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Quan tri tu te//Storytelling//VI','BEGIN:VEVENT','UID:'+uid()+'@quantritute.com','DTSTAMP:'+f(new Date()),'DTSTART:'+f(d),'DTEND:'+f(e),'RRULE:FREQ=DAILY;COUNT=30','SUMMARY:10 phút luyện kể chuyện cùng Đốm','DESCRIPTION:Mở bài hôm nay: '+url,'URL:'+url,'BEGIN:VALARM','TRIGGER:PT0M','ACTION:DISPLAY','DESCRIPTION:Đến giờ luyện kể chuyện rồi!','END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n');
  download('nhac-luyen-ke-chuyen.ics',s,'text/calendar');
}

/* ---------- Góp ý ---------- */
var verTap=0;
var fb={stars:0,type:'Đánh giá chung'};
function openFeedback(){
  fb={stars:0,type:'Đánh giá chung'};
  openModal(modalHead('Góp ý cho Đốm','Mọi ý kiến đều được đọc để cải tiến công cụ')+'<div class="modal-body"><form class="fb-form" id="fbForm" novalidate><div><div class="fb-lbl">Bạn thấy công cụ thế nào?</div><div class="fb-stars">'+[1,2,3,4,5].map(function(n){ return '<button type="button" data-act="fb-star" data-n="'+n+'" aria-label="'+n+' sao">★</button>'; }).join('')+'</div></div><div><div class="fb-lbl">Bạn muốn gửi</div><div class="chips">'+['Đánh giá chung','Đề xuất nội dung','Báo lỗi'].map(function(t,i){ return '<button type="button" class="chip'+(i===0?' on':'')+'" data-act="fb-type" data-t="'+t+'">'+t+'</button>'; }).join('')+'</div></div><label class="fld">Nội dung<textarea class="inp" id="fbContent" rows="5" maxlength="3800" placeholder="Bài nào hữu ích, chỗ nào chưa rõ, bạn muốn có thêm gì…"></textarea></label><div class="fb-row2"><label class="fld">Họ tên<input class="inp" id="fbName" maxlength="120" autocomplete="name"></label><label class="fld">Số điện thoại <span class="faint" style="font-weight:400">(không bắt buộc)</span><input class="inp" type="tel" id="fbPhone" maxlength="20"></label></div><label style="display:block;margin-top:8px" class="fld">Email <span class="faint" style="font-weight:400">(không bắt buộc – để Đốm báo khi công cụ có bản mới)</span><input class="inp" type="email" id="fbEmail" autocomplete="email" maxlength="160" style="width:100%;box-sizing:border-box"></label><input type="text" id="fbHp" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true"><p class="fb-msg" id="fbMsg" role="status"></p><div class="fb-act"><button type="button" class="btn btn-secondary" data-act="close-modal">Đóng</button><button type="submit" class="btn btn-primary" id="fbSend">Gửi góp ý</button></div></form></div>','sm');
}
function fbMsg(t,c){ var m=$('#fbMsg'); if(m){ m.textContent=t; m.className='fb-msg '+(c||''); } }
function sendFeedback(){
  var content=$('#fbContent').value.trim(), name=$('#fbName').value.trim(), phone=$('#fbPhone').value.trim();
  if(content.length<5){ fbMsg('Vui lòng nhập nội dung góp ý (ít nhất 5 ký tự).','err'); return; }
  if(name.length<2){ fbMsg('Vui lòng nhập họ tên để Đốm tiện phản hồi.','err'); return; }
  if(phone&&!/^[0-9 +().-]{8,20}$/.test(phone)){ fbMsg('Số điện thoại chưa đúng (có thể để trống).','err'); return; }
  var nid=nextId();
  var body={tool:TOOL_SLUG,name:name,phone:phone, email: ((document.getElementById('fbEmail')||{}).value||'').trim(),content:'['+fb.type+']'+(fb.stars?' · Đánh giá: '+fb.stars+'/5 ★':'')+'\n'+content,page:'Luyện kể chuyện · '+(S.branch?'Hướng '+S.branch:'chưa chọn hướng')+' · '+(nid?'đang ở '+nid:'đã về đích')+' · bản '+VER,website:$('#fbHp').value};
  var btn=$('#fbSend'); btn.disabled=true; fbMsg('Đang gửi…');
  var online=/^https?:$/.test(location.protocol)&&!/^(localhost|127\.)/.test(location.hostname);
  var req=online?fetch('/api/feedback',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}).then(function(r){ return r.json().catch(function(){ return {}; }).then(function(j){ if(!r.ok) throw new Error(j.error||'Chưa gửi được, vui lòng thử lại.'); return j.message; }); })
    :fetch('https://quantritute.com/api/feedback',{method:'POST',mode:'no-cors',headers:{'content-type':'text/plain'},body:JSON.stringify(body)}).then(function(){ return 'Cảm ơn bạn! Góp ý đã được gửi tới Đốm.'; });
  req.then(function(m){ fbMsg(m||'Cảm ơn bạn đã góp ý!','ok'); btn.textContent='Đã gửi'; setTimeout(function(){ if($('#fbForm')) closeModal(); },2200); },function(e){ btn.disabled=false; fbMsg(e&&e.message&&!/fetch|network/i.test(e.message)?e.message:'Chưa gửi được (kiểm tra kết nối mạng) – vui lòng thử lại.','err'); });
}

/* ---------- Sự kiện ---------- */
document.addEventListener('click',function(e){
  var t=e.target.closest('[data-act]'); if(!t){ if(e.target.matches&&e.target.matches('[data-role="ov"]')) closeModal(); return; }
  var a=t.getAttribute('data-act'), id=t.getAttribute('data-id');
  switch(a){
    case 'onb-pick': onbPick=t.getAttribute('data-b'); renderOnboard(); break;
    case 'onb-go': if(!onbPick) return; S.branch=onbPick; S.created=S.created||today(); save(); go('bai/d01'); break;
    case 'open-lesson': go('bai/'+id); break;
    case 'ls-exit': if(LP&&!LP.replay&&(LP.step>0||LP.card>0)&&!confirm('Thoát bây giờ thì phần đang làm chưa được lưu. Thoát?')) return; LP=null; go(''); break;
    case 'card-next': LP.card++; drawLesson(); scrollTop(); break;
    case 'card-prev': if(LP.card>0) LP.card--; drawLesson(); break;
    case 'step-next': LP.step++; drawLesson(); scrollTop(); break;
    case 'step-prev': collectPractice(); var gb=$('#rvGood'); if(gb) LP.good=gb.value; if(LP.step===0) return; LP.step--; if(LP.step===0) LP.card=BY[LP.id].cards.length-1; drawLesson(); break;
    case 'q-pick': LP.qsel=+t.getAttribute('data-i'); if(BY[LP.id].quiz.options[LP.qsel].correct) LP.quiz=true; drawLesson(); break;
    case 'ord-add': LP.ord.push(+t.getAttribute('data-i')); LP.quiz=null; drawLesson(); break;
    case 'ord-un': var ix=+t.getAttribute('data-i'); LP.ord=LP.ord.filter(function(x){ return x!==ix; }); LP.quiz=null; drawLesson(); break;
    case 'ord-check': LP.quiz=LP.ord.every(function(x,i){ return x===i; }); if(!LP.quiz) LP.ord=[]; drawLesson(); if(!LP.quiz){ var fbx=$('.q-fb'); } break;
    case 'topic': LP.w.topic=+t.getAttribute('data-i'); $all('[data-act="topic"]').forEach(function(c){ c.classList.toggle('on',c===t); }); break;
    case 'pick-st': LP.picked=t.value; $all('.pick-st label').forEach(function(l){ l.classList.toggle('on',l.contains(t)); }); break;
    case 'prac-done': collectPractice(); var L=BY[LP.id]; if(!LP.replay&&!LP.saved){ LP.savedN=savePracticeData(L); LP.saved=true; save(); } stopMedia(); LP.step++; drawLesson(); scrollTop(); break;
    case 'rv': var i=+t.getAttribute('data-i'); LP.rv[i]=!LP.rv[i]; t.classList.toggle('on'); $('.box',t).textContent=LP.rv[i]?'✓':''; break;
    case 'finish': finishLesson(); break;
    case 'save-moment': var v=$('#momentTx').value.trim(); if(!v){ toast('Viết một câu thôi cũng được.'); return; } S.stories.push({id:uid(),seed:true,text:v,tag:'Khoảnh khắc hôm nay',from:'moment',created:today()}); markAct(); checkBadges(); save(); toast('Đã lưu vào Kho chuyện 🌱'); renderHome(); renderNav(''); break;
    case 'gym-lv': gymLv=+t.getAttribute('data-i'); renderGym(); break;
    case 'open-ex': go('phong-tap/'+id); break;
    case 'ex-done': var pe=S.pt[id]||(S.pt[id]={n:0,xp:0}); pe.n++; if(pe.last!==today()){ pe.xp+=5; pe.last=today(); } markAct(); checkBadges(); save(); toast('Xong bài tập! +5 XP'); go('phong-tap'); break;
    case 'kho-use': khoUse=t.getAttribute('data-u'); renderKho(); break;
    case 'open-story': go('kho/'+id); break;
    case 'del-seed': if(!confirm('Xóa hạt giống này?')) return; S.stories=S.stories.filter(function(s){ return s.id!==id; }); save(); renderKho(); break;
    case 'wz-next': wzNext(false); break;
    case 'wz-skip': wzNext(true); break;
    case 'wz-back': WZ.i=0; renderWizard(WZ.seed); break;
    case 'wz-save': wzSave(); break;
    case 'st-star': var s1=S.stories.filter(function(x){ return x.id===location.hash.split('/')[2]; })[0]; s1.stars=+t.getAttribute('data-n'); save(); $all('[data-act="st-star"]').forEach(function(c){ c.classList.toggle('on',c===t); }); break;
    case 'st-told': var s2=S.stories.filter(function(x){ return x.id===location.hash.split('/')[2]; })[0]; s2.told=!s2.told; if(s2.told) s2.stars=3; t.classList.toggle('on',s2.told); var nb=checkBadges(); save(); if(nb.indexOf('told')>=0){ toast('🤝 Huy hiệu mới: Kể cho người thật!'); confetti(); } break;
    case 'st-save': var s3=S.stories.filter(function(x){ return x.id===id; })[0]; s3.title=$('#stT').value.trim()||s3.title; s3.idea=$('#stI').value.trim(); s3.body=$('#stB').value; s3.uses=$all('#stU .chip.on').map(function(c){ return c.getAttribute('data-u'); }); save(); toast('Đã lưu.'); break;
    case 'st-del': if(!confirm('Xóa chuyện này khỏi kho?')) return; S.stories=S.stories.filter(function(x){ return x.id!==id; }); save(); go('kho'); break;
    case 'video': openVideo(t.getAttribute('data-m')); break;
    case 'vf-tag': VF.tag=t.getAttribute('data-t'); renderVideos(); break;
    case 'vf-use': VF.use=!VF.use; renderVideos(); break;
    case 'set-branch': var nbr=t.getAttribute('data-b'); if(nbr===S.branch) return; if(S.done.d14&&!confirm('Đổi sang hướng "'+BRANCHES[nbr].name+'"? Chặng 3–4 sẽ bắt đầu lại từ ngày 15 của hướng mới. Bài đã học vẫn được giữ.')) return; S.branch=nbr; save(); toast('Đã đổi hướng học.'); renderAbout(); renderNav('ve-cong-cu'); break;
    case 'ics': ics(); break;
    case 'backup': download('sao-luu-luyen-ke-chuyen-'+today()+'.json',JSON.stringify({app:'storytelling',ver:VER,at:new Date().toISOString(),state:S},null,1),'application/json'); break;
    case 'reset': if(!confirm('Xóa toàn bộ tiến độ, kho chuyện và bản ghi trên máy này?')) return; if(!confirm('Chắc chắn chứ? Không khôi phục được nếu chưa sao lưu.')) return; S=blank(); save(); recClear(); toast('Đã xóa. Bắt đầu lại nhé!'); go(''); break;
    case 'ver-tap': verTap=(verTap||0)+1; if(verTap>=5&&!PREVIEW){ try{ localStorage.setItem('qtt-st-preview','1'); }catch(e){} PREVIEW=true; toast('Đã bật chế độ xem trước: mở tất cả bài.'); renderAbout(); } break;
    case 'preview-off': e.preventDefault(); try{ localStorage.removeItem('qtt-st-preview'); }catch(x){} location.href=location.pathname+'#/ve-cong-cu'; location.reload(); break;
    case 'open-fb': openFeedback(); break;
    case 'close-modal': closeModal(); break;
    case 'fb-star': fb.stars=+t.getAttribute('data-n'); $all('[data-act="fb-star"]').forEach(function(b,i){ b.classList.toggle('on',i<fb.stars); }); break;
    case 'fb-type': fb.type=t.getAttribute('data-t'); $all('[data-act="fb-type"]').forEach(function(b){ b.classList.toggle('on',b===t); }); break;
  }
});
document.addEventListener('submit',function(e){ if(e.target.id==='fbForm'){ e.preventDefault(); sendFeedback(); } });
document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&$('#modalRoot').innerHTML) closeModal(); });
route();
})();
