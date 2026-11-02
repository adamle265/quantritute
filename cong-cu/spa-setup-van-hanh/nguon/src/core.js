/* ===== Dữ liệu dùng chung cho mọi phương án giao diện ===== */
/* Giá (sau này đọc từ trang admin): gia 0 = miễn phí · null = có phí chưa đặt giá · số = giá VND */
const CONFIG = {
  m1:[{ten:"Toàn bộ",gia:0}], m2:[{ten:"Toàn bộ",gia:0}], m3:[{ten:"Toàn bộ",gia:null}],
  m4:[{ten:"Toàn bộ",gia:null}], m5:[{ten:"Bản nhanh",gia:0},{ten:"Bản đầy đủ",gia:null}],
  m6:[{ten:"Toàn bộ",gia:null}], m7:[{ten:"Toàn bộ",gia:0}], m8:[{ten:"Toàn bộ",gia:null}],
  m9:[{ten:"Toàn bộ",gia:null}], m10:[{ten:"Toàn bộ",gia:0}], m11:[{ten:"Toàn bộ",gia:null}], m12:[{ten:"Toàn bộ",gia:null}]
};
const IC = {
  m1:'<path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><circle cx="12" cy="12" r="6"/><path d="m14.5 9.5-1.6 3.4-3.4 1.6 1.6-3.4z"/>',
  m2:'<path d="M12 21s-6-5.3-6-10a6 6 0 0 1 12 0c0 4.7-6 10-6 10z"/><path d="m9.5 10.5 1.8 1.8 3.2-3.3"/>',
  m3:'<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/><path d="M8 12V9.5M10.5 12V8M13 12v-1.5"/>',
  m4:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',
  m5:'<path d="M4 19h16"/><path d="M6 16V11M10 16V7M14 16v-4M18 16V5"/>',
  m6:'<path d="M3.5 8 12 4l8.5 4v8L12 20l-8.5-4z"/><path d="M3.5 8 12 12l8.5-4M12 12v8"/>',
  m7:'<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/><path d="m9.5 14 1.8 1.8 3.2-3.3"/>',
  m8:'<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="17.5" cy="14.5" r="3"/><path d="M17.5 13v3M16.4 14.5h2.2"/>',
  m9:'<path d="M8 6h9a2 2 0 0 1 2 2v12H8a2 2 0 0 1-2-2V8"/><path d="M6 8V5a2 2 0 0 1 2-2h7"/><path d="M10.5 11h5M10.5 15h5"/>',
  m10:'<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
  m11:'<rect x="3.5" y="4" width="17" height="16" rx="2"/><path d="M7.5 15l3-3.5 2.5 2 3.5-4.5"/>',
  m12:'<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z"/>'
};
const MODULES = [
  {id:"m1",url:"chon-mo-hinh.html",gd:1,ten:"Chọn mô hình phù hợp",ngan:"Chọn mô hình",mo:"Trả lời 10 câu về ngân sách, nơi mở, mặt bằng, năng lực và nhân sự. Nhận gợi ý quy mô 30–50 m², 100–200 m² hay 500–1.000 m².",feat:["Gợi ý quy mô kèm lý do cụ thể từ câu trả lời","Danh sách việc cần chuẩn bị theo quy mô đã chọn","Lưu kết quả vào hồ sơ cơ sở để các công cụ khác dùng"],dot:1},
  {id:"m2",url:"cham-diem-mat-bang.html",gd:1,ten:"Đánh giá mặt bằng",ngan:"Mặt bằng",mo:"32 tiêu chí theo 5 hạng mục khi đi xem nhà: ngoài đường, mặt tiền, bên trong, hỏi chủ nhà, khu vực xung quanh. Chấm thang 10 có tỷ trọng, so sánh 2–3 mặt bằng.",feat:["Lựa chọn tự đổi theo quy mô 50 m², 200 m², 1.000 m²","Tiêu chí loại cảnh báo mặt bằng không nên thuê","Câu hỏi và gợi ý đàm phán với chủ nhà, căn cứ pháp lý PCCC"],dot:1},
  {id:"m3",gd:1,ten:"Khảo sát thị trường & đối thủ",ngan:"Thị trường",mo:"Ước tính số khách tiềm năng quanh cơ sở và khoảng trống thị trường. Phiếu đi trải nghiệm 5–7 đối thủ như một khách hàng.",feat:["Tính từ dân số, cơ cấu tuổi, thu nhập, khách du lịch","Ra quy mô phục vụ đề xuất mỗi tháng","Phiếu chấm đối thủ: giá, chất lượng phục vụ, chuyên môn, tầm nhìn chủ cơ sở"],dot:4},
  {id:"m4",gd:1,ten:"Thiết kế menu – thẻ – combo",ngan:"Menu & thẻ",mo:"Tính lãi thật của từng dịch vụ sau hoa hồng kỹ thuật viên và nguyên liệu. Dựng thẻ trả trước, combo không bị lỗ.",feat:["Lãi mỗi dịch vụ và lãi trên mỗi giờ giường","Thẻ trả trước: mệnh giá, giá trị tặng, hạn dùng, hoa hồng bán thẻ","Cảnh báo khi giá trị tặng vượt mức an toàn","Xuất menu để in"],dot:2},
  {id:"m5",gd:1,ten:"Dự toán vốn – dòng tiền – hòa vốn",ngan:"Dự toán vốn",mo:"Bản nhanh: cần bao nhiêu khách mỗi ngày để không lỗ. Bản đầy đủ: dự toán vốn, dòng tiền 12 tháng, tháng nào âm tiền.",feat:["Hòa vốn theo số giường, lượt khách mỗi giường, giá bình quân","Dự toán 9 nhóm hạng mục theo danh mục mẫu","Dòng tiền 12 tháng với tỷ lệ lấp đầy tăng dần","Kịch bản xấu và mức dự phòng 15–35%"],dot:1},
  {id:"m6",gd:2,ten:"Danh mục thiết bị – dụng cụ – tiêu hao",ngan:"Thiết bị",mo:"Chọn quy mô và các phòng, nhận danh sách mua sắm theo khu vực. So sánh nhà cung cấp, lập biên bản bàn giao và kiểm kê.",feat:["Danh mục theo khu vực: lễ tân, phòng trị liệu, gội đầu, xông ngâm","Giá do anh/chị nhập, tự cộng tổng","Bảng so sánh nhà cung cấp","Mẫu bàn giao và kiểm kê định kỳ"],dot:4},
  {id:"m7",gd:2,ten:"Hồ sơ pháp lý",ngan:"Pháp lý",mo:"Danh sách giấy tờ cần có: đăng ký kinh doanh, thuế, an ninh trật tự, phòng cháy chữa cháy, chứng chỉ nghề, hồ sơ nhân sự.",feat:["Checklist theo loại hình hộ kinh doanh hoặc doanh nghiệp","Dẫn văn bản pháp luật trong Cẩm nang thuế","Ghi hạn và tình trạng từng loại giấy tờ"],dot:3},
  {id:"m8",gd:2,ten:"Thu nhập trị liệu viên",ngan:"Thu nhập KTV",mo:"Cài cơ chế lương thưởng một lần, mỗi tháng nhập số liệu là ra phiếu lương từng người. Có định biên nhân sự theo số giường.",feat:["Lương cứng, chuyên cần, hoa hồng dịch vụ, thẻ, hàng hóa","Thưởng theo lượt khách, thưởng phạt theo đánh giá sao","Phiếu lương từng người","Định biên, mô tả công việc và KPI mẫu"],dot:2},
  {id:"m9",gd:2,ten:"Bộ văn bản vận hành",ngan:"Văn bản",mo:"Điền thông tin cơ sở một lần, xuất khoảng 15 văn bản Word dùng ngay: nội quy, quy trình dịch vụ, hành trình khách hàng, quy tắc ứng xử.",feat:["Nội quy lao động, nội quy phòng trị liệu, quy tắc ứng xử","Quyền lợi khách hàng, cam kết của cơ sở, bộ hỏi đáp","Quy trình dịch vụ 3 bước, thu chi, chấm công, timeline từng vị trí","Bản sắc thương hiệu, kế hoạch truyền thông"],dot:3},
  {id:"m10",gd:3,ten:"Chạy thử & khai trương",ngan:"Khai trương",mo:"Khoảng 30 việc chuẩn bị trước ngày mở cửa, lịch đếm ngược, khung kế hoạch chạy thử và khai trương, ngân sách khai trương.",feat:["Checklist chuẩn bị vận hành theo bộ phận","Lịch đếm ngược tới ngày khai trương trong hồ sơ","Khung kế hoạch chạy thử 7–15 ngày và chương trình khai trương"],dot:3},
  {id:"m11",gd:4,ten:"Báo cáo ngày – tháng – lãi lỗ",ngan:"Lãi lỗ",mo:"Nhập báo cáo cuối ca, tự tổng hợp tháng so với mục tiêu và lập báo cáo lãi lỗ. Tách riêng tiền bán thẻ để biết lãi thật.",feat:["Báo cáo ca: khách mới, khách lẻ, khách thẻ, bán thẻ, hàng hóa","Tổng hợp tháng so với kế hoạch kinh doanh","Báo cáo lãi lỗ tách tiền bán thẻ và doanh thu đã phục vụ","Sổ thu chi"],dot:4},
  {id:"m12",gd:4,ten:"Thư viện cẩm nang",ngan:"Thư viện",mo:"Cẩm nang chốt sale, 100 hành động chăm sóc khách hàng, mẫu thiết kế phòng trị liệu, câu chuyện thương hiệu mẫu.",feat:["Cẩm nang chốt sale cho trị liệu viên","100 hành động \"đặt tâm vào đôi tay\"","Mẫu bố trí và phối cảnh từng phòng","Câu chuyện thương hiệu mẫu"],dot:4}
];
const STAGES = [
  {gd:1,ten:"Nghiên cứu & lập kế hoạch",ngan:"Nghiên cứu",steps:[
    {n:1,ten:"Nghiên cứu thị trường & đối thủ",m:["m3","m2"]},
    {n:2,ten:"Xác định mô hình kinh doanh và menu dịch vụ",m:["m1","m4"]},
    {n:3,ten:"Lập dự toán ngân sách",m:["m5"]}]},
  {gd:2,ten:"Chuẩn bị kinh doanh",ngan:"Chuẩn bị",steps:[
    {n:4,ten:"Thiết kế, thi công",m:["m12"]},
    {n:5,ten:"Chuẩn bị pháp lý & giấy phép",m:["m7"]},
    {n:6,ten:"Mua thiết bị, dụng cụ, nguyên liệu tiêu hao",m:["m6"]},
    {n:7,ten:"Tuyển dụng & đào tạo chuyên môn",m:["m8"]},
    {n:8,ten:"Xây dựng & đào tạo quy trình vận hành",m:["m9"]},
    {n:9,ten:"Chiến lược và kế hoạch truyền thông",m:["m9"]}]},
  {gd:3,ten:"Chạy thử & khai trương",ngan:"Khai trương",steps:[
    {n:10,ten:"Vận hành chạy thử",m:["m10"]},
    {n:11,ten:"Khai trương",m:["m10"]}]},
  {gd:4,ten:"Vận hành chính thức",ngan:"Vận hành",steps:[
    {n:12,ten:"Vận hành chính thức, báo cáo lãi lỗ hằng tháng",m:["m11","m8"]},
    {n:13,ten:"Xây dựng thương hiệu, trách nhiệm cộng đồng",m:["m12"]}]}
];
const ALL_STEPS = STAGES.flatMap(s => s.steps.map(x => ({...x, gd:s.gd})));
const QUY_MO = ["30–50 m²","100–200 m²","500–1.000 m²"], LOAI = ["Mở mới","Đang vận hành"];
const KEY = "qtt-spa-hub-v1";
const $ = s => document.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const svgI = id => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${IC[id]}</svg>`;
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M20 6 9 17l-5-5"/></svg>';

let real = {hoso:{}, steps:[]};
try { const s = JSON.parse(localStorage.getItem(KEY) || "null"); if (s && typeof s === "object") real = {hoso:s.hoso||{}, steps:Array.isArray(s.steps)?s.steps:[]}; } catch(e) {}
let demo = null;
const cur = () => demo || real;
function save(){ if (demo) return; try { localStorage.setItem(KEY, JSON.stringify(real)); } catch(e) {} }
function toggleStep(n, on){ const s = cur().steps, i = s.indexOf(n); if (on === undefined) on = i < 0; if (on && i < 0) s.push(n); if (!on && i >= 0) s.splice(i,1); save(); redraw(); }
const isDone = n => cur().steps.includes(n);
const nextStep = () => ALL_STEPS.find(x => !isDone(x.n));

const pad = n => String(n).padStart(2,"0");
const fmtD = d => pad(d.getDate())+"/"+pad(d.getMonth()+1)+"/"+d.getFullYear();
function parseD(s){ const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s||""); if(!m) return null; const d = new Date(+m[3], +m[2]-1, +m[1]); return (d.getDate()==+m[1] && d.getMonth()==+m[2]-1) ? d : null; }
function maskD(el){ el.addEventListener("input", () => { const v = el.value.replace(/\D/g,"").slice(0,8); let o = v.slice(0,2); if (v.length>2) o += "/"+v.slice(2,4); if (v.length>4) o += "/"+v.slice(4); el.value = o; }); }
function daysLeft(){ const d = parseD(cur().hoso.ngay); if (!d) return null; const t = new Date(); t.setHours(0,0,0,0); return Math.round((d - t)/864e5); }

const money = n => n.toLocaleString("vi-VN") + "đ";
const tierLabel = t => t.gia === 0 ? "Miễn phí" : (t.gia == null ? "Có phí" : money(t.gia));
const isFree = id => (CONFIG[id]||[]).some(t => t.gia === 0);
const isPaid = id => (CONFIG[id]||[]).some(t => t.gia !== 0);
function priceBadges(id, short){
  const ts = CONFIG[id] || [];
  if (ts.length === 1 || short) { const f = isFree(id), p = isPaid(id); return `<span class="price ${f?"free":"paid"}">${f&&p?"Miễn phí + Có phí":tierLabel(ts[0])}</span>`; }
  return ts.map(t => `<span class="price ${t.gia===0?"free":"paid"}">${esc(t.ten)}: ${tierLabel(t)}</span>`).join("");
}
const mod = id => MODULES.find(m => m.id === id);

/* ===== Hộp thoại ===== */
let lastFocus = null;
function openDlg(html){ lastFocus = document.activeElement; const s = $("#scrim"); s.innerHTML = `<div class="dlg" role="dialog" aria-modal="true">${html}</div>`; s.hidden = false; const f = s.querySelector("input,button"); if (f) f.focus(); }
function closeDlg(){ const s = $("#scrim"); s.hidden = true; s.innerHTML = ""; if (lastFocus && lastFocus.focus) lastFocus.focus(); }
const closeBtn = `<button class="icon-btn" type="button" data-close aria-label="Đóng"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg></button>`;
function moduleBody(id){
  const m = mod(id);
  return `<p>${m.mo}</p>
    <div class="tiers">${(CONFIG[id]||[]).map(t => `<div class="tier ${t.gia===0?"free":"paid"}"><b>${tierLabel(t)}</b>${esc(t.ten)}</div>`).join("")}</div>
    <ul class="feat">${m.feat.map(f => `<li>${CHECK}<span>${esc(f)}</span></li>`).join("")}</ul>
    ${m.url ? `<div class="building ready"><img alt="" src="${domTL()}"><p>Công cụ đã có bản dùng thử. Anh/chị dùng xong, kết quả tự lưu vào hồ sơ cơ sở.</p><a class="btn pri" href="${m.url}">Dùng ngay</a></div>`
      : `<div class="building"><img alt="" src="${domTL()}"><p>${m.dot===1?"Công cụ này đang được xây dựng trong đợt đầu tiên.":"Công cụ này sẽ ra mắt ở đợt sau."} Khi có bản dùng thử, nút <b>Dùng ngay</b> sẽ hiện ở đây.</p></div>`}`;
}
function openModule(id){
  const m = mod(id);
  const steps = ALL_STEPS.filter(x => x.m.includes(id)).map(x => "bước " + x.n);
  openDlg(`<div class="dlg-head"><span class="ico">${svgI(id)}</span><div><span class="mono">Giai đoạn ${m.gd} · hỗ trợ ${steps.join(", ")}</span><h2>${m.ten}</h2></div>${closeBtn}</div>
    ${moduleBody(id)}<div class="dlg-acts"><button class="btn" type="button" data-close>Đóng</button></div>`);
}
function profileFields(){
  const h = real.hoso;
  return `<form class="form" novalidate onsubmit="return false">
      <div class="field full"><label for="f-ten">Tên cơ sở</label><input id="f-ten" maxlength="80" value="${esc(h.ten)}"></div>
      <div class="field"><label for="f-loai">Tình trạng</label><select id="f-loai"><option value="">Chọn</option>${LOAI.map(x=>`<option ${h.loai===x?"selected":""}>${x}</option>`).join("")}</select></div>
      <div class="field"><label for="f-quymo">Quy mô</label><select id="f-quymo"><option value="">Chưa rõ</option>${QUY_MO.map(x=>`<option ${h.quymo===x?"selected":""}>${x}</option>`).join("")}</select><small>Chưa rõ? <a href="chon-mo-hinh.html">Dùng công cụ Chọn mô hình</a></small></div>
      <div class="field"><label for="f-giuong">Số giường trị liệu</label><input id="f-giuong" inputmode="numeric" maxlength="3" value="${esc(h.giuong)}"></div>
      <div class="field"><label for="f-tinh">Tỉnh/thành</label><input id="f-tinh" maxlength="40" value="${esc(h.tinh)}"></div>
      <div class="field full"><label for="f-ngay">Ngày khai trương dự kiến</label><input id="f-ngay" inputmode="numeric" value="${esc(h.ngay)}"><small id="f-ngay-msg">Nhập theo dạng ngày/tháng/năm. Chưa có thì để trống.</small></div>
    </form>`;
}
function bindProfile(onSaved){
  maskD($("#f-ngay"));
  $("#f-giuong").addEventListener("input", e => e.target.value = e.target.value.replace(/\D/g,""));
  $("#pfSave").addEventListener("click", () => {
    const ngay = $("#f-ngay").value.trim();
    if (ngay && !parseD(ngay)){ const m = $("#f-ngay-msg"); m.textContent = "Ngày chưa đúng. Nhập đủ dạng dd/mm/yyyy, ví dụ 15/01/2027."; m.className = "err"; $("#f-ngay").focus(); return; }
    real.hoso = {...real.hoso, ten:$("#f-ten").value.trim(), loai:$("#f-loai").value, quymo:$("#f-quymo").value, giuong:$("#f-giuong").value.trim(), tinh:$("#f-tinh").value.trim(), ngay};
    demo = null; save(); closeDlg(); redraw(); (onSaved || (() => toast("Đã lưu hồ sơ cơ sở")))();
  });
}
const hasProfile = () => !!(real.hoso && (real.hoso.ten || real.hoso.quymo || real.hoso.ngay));
function openProfile(){
  openDlg(`<div class="dlg-head"><div><span class="mono">Dùng chung cho mọi công cụ</span><h2>Hồ sơ cơ sở</h2></div>${closeBtn}</div>
    ${profileFields()}
    <p class="note">Hồ sơ lưu ngay trên trình duyệt của anh/chị, không gửi đi đâu.</p>
    <div class="dlg-acts"><button class="btn" type="button" data-close>Hủy</button><button class="btn pri" type="button" id="pfSave">Lưu hồ sơ</button></div>`);
  bindProfile();
}
function toast(t){ const el = $("#toast"); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => el.hidden = true, 2200); }
function startDemo(){ const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()+75);
  demo = {hoso:{ten:"Dưỡng sinh An Nhiên (mẫu)", loai:"Mở mới", quymo:"30–50 m²", giuong:"4", tinh:"Hà Nội", ngay:fmtD(d)}, steps:[1,2,3,5]}; redraw(); toast("Đang xem số liệu giả định"); }
function stopDemo(){ demo = null; redraw(); toast("Đã xóa số liệu giả định"); }

/* ===== Sáng / tối ===== */
function isDark(){ const t = document.documentElement.dataset.theme; return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches; }
function domTL(){ return isDark() ? "{{DOM_TL_TOI}}" : "{{DOM_TL_SANG}}"; }
function syncImgs(){ const dk = isDark(); document.querySelectorAll("img[data-light]").forEach(i => i.src = dk ? i.dataset.dark : i.dataset.light); }
try { const t = localStorage.getItem("qtt-theme"); if (t === "dark" || t === "light") document.documentElement.dataset.theme = t; } catch(e) {}
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { syncImgs(); redraw(); });

function redraw(){ const b = $("#demoBar"); if (b) b.hidden = !demo; if (window.renderPage) renderPage(); }
document.addEventListener("click", e => {
  const s = $("#scrim");
  if (!s.hidden && (e.target === s || e.target.closest("[data-close]"))) return closeDlg();
  const a = e.target.closest("[data-act]");
  if (a){ const k = a.dataset.act;
    if (k === "profile") openProfile(); else if (k === "demo") startDemo(); else if (k === "demooff") stopDemo();
    else if (k === "theme"){ const n = isDark() ? "light" : "dark"; document.documentElement.dataset.theme = n; try { localStorage.setItem("qtt-theme", n); } catch(e) {} syncImgs(); redraw(); }
    return; }
  const m = e.target.closest("[data-mod]"); if (m) return openModule(m.dataset.mod);
});
document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("#scrim").hidden) closeDlg(); });
