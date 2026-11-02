/* ===== Bộ máy chấm mặt bằng dùng chung (phương án X, Y) ===== */
const SC = [
  {ten:"30–50 m²", ngan:"Cơ sở nhỏ", dt:50, tol:20},
  {ten:"100–200 m²", ngan:"Cơ sở vừa", dt:200, tol:50},
  {ten:"500–1.000 m²", ngan:"Trung tâm lớn", dt:1000, tol:200}
];
const GROUPS = [{k:"vt",ten:"Vị trí",ngan:"Vị trí"},{k:"nt",ten:"Ngoại thất có thể bố trí",ngan:"Ngoại thất"},{k:"ts",ten:"Thông số mặt bằng",ngan:"Thông số"},{k:"in",ten:"Nội thất, hạ tầng",ngan:"Nội thất"},{k:"tc",ten:"Lợi thế khi thi công",ngan:"Thi công"},{k:"kh",ten:"Vấn đề khác",ngan:"Khác"}];
/* fix: khắc phục được bằng tiền; cost: chi phí sửa tham khảo (triệu đồng) theo [nhỏ, vừa, lớn], null = chưa có số;
   chang: chặng khi đi xem nhà; ask: câu nên hỏi; nego: đề nghị đàm phán khi chưa đạt */
const CRIT = [
  {id:"diachi",g:"vt",ten:"Địa chỉ",chang:0,std:"Rõ ràng, tìm được trên bản đồ; tránh địa chỉ dạng lô, khu hoặc trùng với cơ sở khác"},
  {id:"xe",g:"vt",ten:"Chỗ để xe",chang:0,std:["Để được 5 xe máy hoặc 1 ô tô, hoặc gần bãi trông xe","Để được 15 xe máy và 3 ô tô, hoặc gần bãi trông xe","Để được 50 xe máy và 10 ô tô, hoặc gần bãi trông xe"],ask:"Khách để xe ở đâu, có mất phí không? Giờ cao điểm có bị cấm đỗ không?"},
  {id:"yentinh",g:"vt",ten:"Không gian yên tĩnh",chang:0,std:"Không sát chợ, xưởng, quán ồn; đủ yên cho phòng trị liệu"},
  {id:"bien",g:"nt",ten:"Biển chính",chang:1,fix:true,cost:[12,null,null],std:"Bố trí được biển hiệu chính, nhìn rõ từ đường",nego:"Xin chủ nhà cho phép lắp biển chính đúng kích thước mong muốn, ghi vào hợp đồng."},
  {id:"vay",g:"nt",ten:"Biển vẫy",chang:1,fix:true,cost:[1.8,null,null],std:"Bố trí được biển vẫy vuông góc mặt đường"},
  {id:"standee",g:"nt",ten:"Standee",chang:1,std:"Đặt được standee trước cửa"},
  {id:"noithuoc",g:"nt",ten:"Chỗ đặt nồi thuốc thảo dược",chang:1,std:"Đặt được nồi thuốc trước cửa ở nơi nhiều người đi bộ qua lại"},
  {id:"mt",g:"ts",ten:"Mặt tiền",chang:1,auto:"mt",std:[null,"Từ 4 – 6 m trở lên","Từ 20 m trở lên"]},
  {id:"dt",g:"ts",ten:"Diện tích",chang:2,auto:"dt",std:["Khoảng 50 m², sai lệch không quá 20 m²","Khoảng 200 m², sai lệch không quá 50 m²","Khoảng 1.000 m², sai lệch không quá 200 m²"],nego:"Diện tích lệch nhiều so với nhu cầu: tránh thuê rộng hơn cần thiết vì tiền thuê, điện nước tăng theo."},
  {id:"hinh",g:"ts",ten:"Hình dáng",chang:2,std:"Cân đối, hình chữ nhật hoặc vuông"},
  {id:"tran",g:"in",ten:"Trần",chang:2,fix:true,cost:[null,null,null],std:"Có trần, cao không quá 3,5 m",nego:"Đề nghị chủ nhà làm trần trước khi bàn giao, hoặc trừ chi phí vào tiền thuê."},
  {id:"san",g:"in",ten:"Sàn",chang:2,fix:true,cost:[null,null,null],std:"Sàn gỗ hoặc gạch men",nego:"Đề nghị chủ nhà lát lại sàn hoặc trừ chi phí vào tiền thuê."},
  {id:"dien",g:"in",ten:"Điện",chang:2,fix:true,cost:[15,null,null],std:"Điện lưới, 1 pha hoặc 3 pha",ask:"Điện tính giá kinh doanh hay sinh hoạt? Công tơ riêng chưa? Có cho nâng công suất không?",nego:"Đề nghị chủ nhà nâng cấp đường điện, lắp công tơ riêng; thống nhất giá điện ghi vào hợp đồng."},
  {id:"nuoc",g:"in",ten:"Nước",chang:2,fix:true,cost:[6,null,null],std:"Nước máy",nego:"Đề nghị chủ nhà đấu nối nước máy, lắp đồng hồ riêng."},
  {id:"wc",g:"in",ten:"Nhà vệ sinh",chang:2,fix:true,cost:[15,null,null],std:"Đủ bồn, bệ, vòi sen, tủ đồ",nego:"Đề nghị chủ nhà hoàn thiện thiết bị vệ sinh trước khi bàn giao."},
  {id:"dieuhoa",g:"in",ten:"Điều hòa",chang:2,fix:true,cost:[30,null,null],std:"Đủ điều hòa 2 chiều cho các phòng",nego:"Đề nghị chủ nhà lắp thêm điều hòa, hoặc giảm giá thuê tương ứng."},
  {id:"cua",g:"in",ten:"Cửa",chang:2,fix:true,cost:[null,null,null],std:"Cửa sổ, cửa chính bằng kính"},
  {id:"thue",g:"vt",ten:"Giá thuê",chang:3,auto:"thue",std:["Dưới 10 triệu/tháng","15 – 25 triệu/tháng","40 – 60 triệu/tháng"],ask:"Giá đã gồm thuế, phí chưa? Bao lâu tăng giá một lần, tăng bao nhiêu %? Đặt cọc mấy tháng?",nego:"Giá thuê cao hơn mức phù hợp: thương lượng giảm giá, giãn lộ trình tăng giá, hoặc xin thời gian miễn tiền thuê lúc thi công."},
  {id:"chunha",g:"tc",ten:"Chủ nhà",chang:3,std:"Hợp tác, đồng ý cho cải tạo",ask:"Anh/chị có đồng ý cho cải tạo trần, sàn, vách ngăn không? Khi hết hạn có bắt hoàn trả nguyên trạng không?"},
  {id:"pccc",g:"in",ten:"Phòng cháy chữa cháy",chang:3,fix:true,cost:[null,null,null],must:[false,true,true],std:[null,"Đạt tiêu chuẩn PCCC","Đạt tiêu chuẩn PCCC"],ask:"Nhà đã được thẩm duyệt, nghiệm thu PCCC chưa? Có lối thoát nạn, bình chữa cháy chưa?",nego:"Yêu cầu chủ nhà hoàn thiện điều kiện PCCC trước khi ký; đây là điều kiện bắt buộc với quy mô này."},
  {id:"hst",g:"vt",ten:"Hệ sinh thái liền kề (bán kính 500 m)",chang:4,std:["Có nhà hàng, cafe, karaoke","Có nhà hàng, cafe, karaoke, văn phòng, trung tâm thương mại, cơ quan nhà nước, cơ sở tôn giáo, khách sạn từ 3 sao","Gần phố ẩm thực, phố đi bộ, khu vui chơi, trung tâm thương mại lớn, khách sạn 5 sao, trung tâm hội nghị"]},
  {id:"hangxom",g:"tc",ten:"Hàng xóm",chang:4,std:"Cởi mở",ask:"Hỏi hàng xóm: chủ nhà có dễ chịu không, khu này có hay ngập, mất điện, bị phản ánh tiếng ồn không?"},
  {id:"chinhquyen",g:"tc",ten:"Chính quyền địa phương",chang:4,std:"Thân thiện"},
  {id:"vatlieu",g:"tc",ten:"Điểm mua vật liệu",chang:4,std:"Gần"},
  {id:"phethai",g:"tc",ten:"Điểm đổ phế thải xây dựng",chang:4,std:"Gần"},
  {id:"hatang",g:"tc",ten:"Hạ tầng phục vụ thi công",chang:4,fix:true,cost:[null,null,null],std:"Có sẵn điện và nước"}
];
const CHANG = [
  {ten:"Ngoài đường",mo:"Đứng ở đầu đường, nhìn như một khách lần đầu tìm đến."},
  {ten:"Mặt tiền",mo:"Đứng đối diện cửa, hình dung biển hiệu, standee, nồi thuốc."},
  {ten:"Bên trong",mo:"Đi hết các phòng, mở thử điện nước, đo diện tích."},
  {ten:"Hỏi chủ nhà",mo:"Những câu nên hỏi trước khi bàn đến chuyện cọc."},
  {ten:"Một vòng 500 m",mo:"Đi bộ quanh khu, hỏi chuyện hàng xóm."}
];
const CLAUSES = [
  "Xin thời gian miễn tiền thuê trong lúc xin phép và thi công cải tạo.",
  "Thống nhất khi hết hạn hoàn trả nguyên trạng hay giữ hiện trạng sau cải tạo; thời gian hoàn trả không tính tiền thuê.",
  "Biên bản bàn giao liệt kê thiết bị, tình trạng, kèm ảnh hiện trạng.",
  "Hư hỏng do hao mòn tự nhiên, bất khả kháng thuộc trách nhiệm bên cho thuê (Điều 477 Bộ luật Dân sự 2015).",
  "Bên cho thuê chậm sửa sau khi được báo thì bên thuê được tự sửa và trừ chi phí hợp lý vào tiền thuê.",
  "Thời hạn hợp đồng đủ dài để thu hồi chi phí cải tạo; ghi rõ lộ trình tăng giá."
];
const LV = ["Chưa đạt","Đạt","Vượt"];
const stdOf = (c, s) => Array.isArray(c.std) ? c.std[s] : c.std;
const mustOf = (c, s) => !!(c.must && c.must[s]);
const num = v => { const n = parseFloat(String(v ?? "").replace(/\s/g,"").replace(",", ".")); return n > 0 ? n : null; };
const KEY2 = "qtt-spa-m2";
let D = {scale:null, sites:[], cur:0};
try { const v = JSON.parse(localStorage.getItem(KEY2) || "null"); if (v && Array.isArray(v.sites)) D = v; } catch(e) {}
let sampleMode = false, backup = null;
const keep = () => { if (sampleMode) return; try { localStorage.setItem(KEY2, JSON.stringify(D)); } catch(e) { toast("Bộ nhớ trình duyệt đầy, ảnh mới có thể không được lưu"); } };
const scaleFromProfile = () => { const i = SC.findIndex(s => s.ten === (real.hoso||{}).quymo); return i >= 0 ? i : null; };
const newSite = (ten, dc) => ({ten: ten || `Mặt bằng ${D.sites.length+1}`, dc:dc||"", dt:"", mt:"", thue:"", han:"", marks:{}, notes:{}, custom:[], fix:{}, cost:{}, photos:{}});
function fixSite(s){ ["fix","cost","photos","notes","marks"].forEach(k => s[k] = s[k] || {}); s.custom = s.custom || []; return s; }
D.sites.forEach(fixSite);

function autoMark(site, c){
  const s = D.scale, S = SC[s];
  if (c.auto === "dt"){ const x = num(site.dt); if (x == null) return null; return Math.abs(x - S.dt) <= S.tol ? 1 : 0; }
  if (c.auto === "mt"){ const x = num(site.mt), min = [0,4,20][s]; if (x == null || !min) return null; return x >= min*1.5 ? 2 : (x >= min ? 1 : 0); }
  if (c.auto === "thue"){ const x = num(site.thue); if (x == null) return null; const r = [[6,10],[15,25],[40,60]][s]; return x < r[0] ? 2 : (x <= r[1] ? 1 : 0); }
  return null;
}
function critsFor(site){ return CRIT.filter(c => stdOf(c, D.scale) != null).concat((site.custom||[]).map((t,i) => ({id:"c"+i, g:"kh", ten:t, std:"Tiêu chí anh/chị tự thêm", chang:4, custom:i}))); }
function markOf(site, c){ const m = site.marks[c.id]; if (m != null) return {v:m, auto:false}; const a = autoMark(site, c); return a == null ? null : {v:a, auto:true}; }
const canFix = (site, c) => site.fix[c.id] != null ? site.fix[c.id] : !!c.fix;
const costOf = (site, c) => site.cost[c.id] != null && site.cost[c.id] !== "" ? num(site.cost[c.id]) : (c.cost ? c.cost[D.scale] : null);

function evaluate(site){
  const cs = critsFor(site), per = {}; let n0=0,n1=0,n2=0,un=0; const mustFail = [], fails = [];
  GROUPS.forEach(g => per[g.k] = {f:0,v:0,ok:0,n:0,sc:0,sn:0});
  cs.forEach(c => { const m = markOf(site, c); const p = per[c.g]; p.n++; if (!m){ un++; return; }
    p.sn++; p.sc += m.v;
    if (m.v === 0){ n0++; if (mustOf(c, D.scale)) mustFail.push(c); else { p.f++; fails.push(c); } }
    else if (m.v === 1){ n1++; p.ok++; } else { n2++; p.v++; p.ok++; } });
  const offs = []; let F = 0, V = 0;
  GROUPS.forEach(g => { const p = per[g.k]; const o = Math.min(p.f, p.v); if (o) offs.push(`${g.ten}: ${o} yếu tố vượt chuẩn bù ${o} yếu tố chưa đạt`); F += p.f - o; V += p.v - o; });
  const cross = Math.min(F, Math.floor(V/2)); if (cross) offs.push(`Khác nhóm: ${cross*2} yếu tố vượt chuẩn bù ${cross} yếu tố chưa đạt`);
  const remain = F - cross, scored = n0+n1+n2, total = cs.length;
  let cls, title, msg;
  if (!scored){ cls = ""; title = "Chưa chấm"; msg = "Chấm từng tiêu chí, kết luận cập nhật ngay."; }
  else if (mustFail.length){ cls = "bad"; title = "Chưa đạt"; msg = `${mustFail.map(c=>c.ten).join(", ")} là yêu cầu bắt buộc với quy mô này, không bù trừ được.`; }
  else if (remain > 0){ cls = "bad"; title = "Chưa đạt"; msg = `Còn ${remain} yếu tố chưa đạt chưa được bù. Trường hợp ngoại lệ cần trao đổi với chuyên gia.`; }
  else if (offs.length){ cls = "mid"; title = "Đạt nhờ bù trừ"; msg = "Yếu tố chưa đạt đã được bù bằng yếu tố vượt chuẩn."; }
  else { cls = "ok"; title = "Đạt chuẩn"; msg = "Mọi tiêu chí đã chấm đều đạt hoặc vượt chuẩn."; }
  if (scored && un) msg += ` Còn ${un} tiêu chí chưa chấm.`;
  /* chi phí thật */
  const failsAll = mustFail.concat(fails);
  const dead = failsAll.filter(c => !canFix(site, c));
  const fixable = failsAll.filter(c => canFix(site, c));
  const fixCost = fixable.reduce((a,c) => a + (costOf(site, c) || 0), 0);
  const noCost = fixable.filter(c => costOf(site, c) == null);
  const rent = num(site.thue), han = num(site.han);
  const realRent = rent != null && han ? rent + fixCost/han : null;
  const rate = scored ? Math.round((n1+n2)/total*100) : 0;
  const rank = (cls === "ok" ? 3 : cls === "mid" ? 2 : cls === "bad" ? 1 : 0)*10000 + rate*100 + n2;
  return {cs, per, n0,n1,n2,un, scored, total, offs, fails, mustFail, failsAll, remain, cls, title, msg, rate, rank, dead, fixable, fixCost, noCost, rent, han, realRent};
}
const groupPct = (p) => p.sn ? Math.round(p.sc/(2*p.sn)*100) : 0;
function negoList(site, e){
  const items = e.failsAll.map(c => c.nego || (canFix(site, c) ? `${c.ten}: đề nghị chủ nhà khắc phục trước khi bàn giao hoặc trừ chi phí vào tiền thuê.` : null)).filter(Boolean);
  return items;
}
function sampleData(){
  return {scale:1, cur:0, sites:[
    fixSite({ten:"Nhà phố đường Hoa Sữa (mẫu)", dc:"", dt:"190", mt:"6", thue:"18", han:"36", notes:{}, custom:[], fix:{}, cost:{dieuhoa:"40", tran:"20"}, photos:{},
      marks:{diachi:1,xe:1,hst:2,yentinh:1,bien:1,vay:1,standee:1,noithuoc:2,hinh:1,dien:1,nuoc:1,tran:0,san:1,wc:1,pccc:1,dieuhoa:0,cua:1,hangxom:1,chunha:2,chinhquyen:1,vatlieu:1,phethai:1,hatang:1}}),
    fixSite({ten:"Tầng 1 tòa văn phòng (mẫu)", dc:"", dt:"150", mt:"4", thue:"22", han:"24", notes:{}, custom:[], fix:{}, cost:{tran:"25"}, photos:{},
      marks:{diachi:2,xe:2,hst:2,yentinh:0,bien:1,vay:0,standee:1,noithuoc:0,hinh:1,dien:1,nuoc:1,tran:0,san:1,wc:1,pccc:1,dieuhoa:1,cua:1,hangxom:1,chunha:1,chinhquyen:1,vatlieu:1,phethai:0,hatang:1}})]};
}
function startSampleData(after){ backup = JSON.parse(JSON.stringify(D)); sampleMode = true; D = sampleData(); after(); toast("Đang xem số liệu giả định"); }
function undoSampleData(after){ D = backup; backup = null; sampleMode = false; after(); toast("Đã hoàn tác"); }
const fmtTr = n => (Math.round(n*10)/10).toLocaleString("vi-VN") + " tr";
