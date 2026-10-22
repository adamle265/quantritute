/* Quản trị tử tế — trang quản trị (dự án Cloudflare Pages riêng) */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dt = ms => ms ? new Date(ms).toLocaleString('vi-VN', { hour12: false, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  const money = n => new Intl.NumberFormat('vi-VN').format(n || 0) + 'đ';
  const KEY = 'qtt-admin-token';
  let token = ''; try { token = sessionStorage.getItem(KEY) || localStorage.getItem(KEY) || ''; } catch (e) { }

  function toast(msg, bad) { const t = $('#toast'); t.textContent = msg; t.classList.toggle('bad', !!bad); t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), bad ? 4500 : 2200); }
  async function api(path, opt = {}) {
    const r = await fetch('/api/admin/' + path, { ...opt, headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token, ...(opt.headers || {}) } });
    if (r.status === 401) { logout(); throw new Error('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại.'); }
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || 'Có lỗi, vui lòng thử lại.');
    return d;
  }
  async function download(path, name) {
    const r = await fetch('/api/admin/' + path, { headers: { authorization: 'Bearer ' + token } });
    if (!r.ok) return toast('Không tải được file.', true);
    const url = URL.createObjectURL(await r.blob());
    const a = Object.assign(document.createElement('a'), { href: url, download: name }); document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  /* v1.16: cửa cho module Xưởng video (admin/public/studio.js) dùng chung các hàm của trang quản trị */
  const QTT = window.QTT = { pages: {} };

  /* Icon công cụ (giống trang khách) */
  const ICON = {
    book: '<path d="M3 5.5c3-1.3 6-1.2 9 .8 3-2 6-2.1 9-.8V19c-3-1.3-6-1.2-9 .8-3-2-6-2.1-9-.8z"/><path d="M12 6.3v13.5"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    files: '<path d="M9 3h6.5L19 6.5V17H9z"/><path d="M15 3v4h4"/><path d="M6 7v14h10"/>',
    scale: '<path d="M12 4v16M8 20h8M5 7h14"/><path d="M5 7l-3 6h6zM19 7l-3 6h6z"/><path d="M2 13a3 3 0 0 0 6 0M16 13a3 3 0 0 0 6 0"/>',
    import: '<path d="M14 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5"/><path d="M3 12h11M10 8l4 4-4 4"/>',
    cart: '<path d="M3 4h2.2l2.3 11h10.3L20 8H6.4"/><circle cx="9" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/>',
    chart: '<path d="M3 21h18"/><path d="M6 17v-5M11 17V7M16 17v-8M20 17v-3"/>',
    download: '<path d="M12 4v10M8 10l4 4 4-4"/><path d="M5 17v3h14v-3"/>',
    users: '<circle cx="9" cy="8" r="3.4"/><path d="M2.6 20c.8-3.6 3.3-5.5 6.4-5.5s5.6 1.9 6.4 5.5"/><path d="M16 4.6a3.4 3.4 0 0 1 0 6.8M18 14.7c1.8.7 3 2.4 3.4 5.3"/>',
    clipboard: '<path d="M8.5 4H6v17h12V4h-2.5"/><rect x="8.5" y="2.5" width="7" height="3.2" rx="1"/><path d="M9 11h6M9 15h4"/>',
    checklist: '<path d="M10.5 6H20M10.5 12H20M10.5 18H20"/><path d="M3.5 6l1.6 1.6L8 4.8M3.5 12l1.6 1.6L8 10.8M3.5 18l1.6 1.6L8 16.8"/>',
    coins: '<circle cx="12" cy="12" r="9"/><path d="M14.6 9.4c-.5-1-1.5-1.6-2.6-1.6-1.4 0-2.5.8-2.5 2s1 1.7 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1.1 0-2.1-.6-2.6-1.6M12 6.3v1.5M12 16.2v1.5"/>',
    trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
    language: '<path d="M3 5h10M8 3v2M5.5 5c.6 3 2.6 5.6 5.5 7.2M10.5 5c-.6 3.2-2.7 6.2-6.5 8"/><path d="M12.5 21l4.2-9.5L21 21M14 17.6h5.5"/>',
    kanban: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12.2l2.8 2.8L16.5 9"/>',
    calc: '<rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M8.5 6.5h7v3h-7z"/><path d="M9 13.5h.01M12 13.5h.01M15 13.5h.01M9 17h.01M12 17h.01M15 17h.01"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5l8.5 6 8.5-6"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="16.5" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    spark: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>',
  };
  const iconSvg = k => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k] || ICON.spark}</svg>`;

  /* ---------- mô tả các loại dữ liệu ---------- */
  const OPT = {
    grp: { kt: 'Kế toán – Tài chính', hc: 'Hành chính – Nhân sự', kn: 'Hỗ trợ khởi nghiệp', ht: 'Học tập' },
    toolStatus: { soon: 'Coming soon', ok: 'Dùng được', risk: 'Đang rà soát' },
    pricing: { free: 'Free (miễn phí)', paid: 'Có phí' },
    icon: { book: 'Sách / cẩm nang', receipt: 'Hóa đơn', files: 'Văn bản hàng loạt', scale: 'Đối chiếu', import: 'Nhập dữ liệu', cart: 'Sàn TMĐT', chart: 'Báo cáo / biểu đồ',
      download: 'Tải về', users: 'Nhân sự', clipboard: 'Checklist setup', checklist: 'Checklist việc', coins: 'Tiền / thu nhập', trend: 'Dòng tiền / tăng trưởng',
      language: 'Ngoại ngữ', kanban: 'Quản lý công việc', calc: 'Máy tính', mail: 'Thư / email', calendar: 'Lịch', spark: 'Tiện ích khác' },
    epStatus: { draft: 'Bản nháp', scheduled: 'Đã lên lịch', published: 'Đã đăng' },
    postStatus: { draft: 'Bản nháp', published: 'Đã đăng' },
    blogStatus: { draft: 'Bản nháp', review: 'Chờ duyệt', published: 'Đã đăng', hidden: 'Đã ẩn' },
    topicColor: { amber: 'Vàng đèn', blue: 'Xanh dương', green: 'Xanh lá', red: 'Đỏ gạch', purple: 'Tím', teal: 'Xanh ngọc' },
    cat: { 'quan-tri': 'Quản trị', 'hanh-trinh': 'Hành trình trưởng thành', 'gia-dinh': 'Gia đình', sach: 'Sách', video: 'Video truyền cảm hứng' },
    reqStatus: { new: 'Trong đề xuất · mới', reviewing: 'Trong đề xuất · đang xem', planned: 'Sẽ làm', building: 'Đang hoàn thiện', done: 'Mới phát hành', rejected: 'Chưa làm' },
    bookStatus: { new: 'Mới', contacted: 'Đã liên hệ', scheduled: 'Đã hẹn lịch', done: 'Đã tư vấn', cancelled: 'Huỷ' },
    legalStatus: { pending: 'Chờ duyệt', approved: 'Đã duyệt · đang hiện', rejected: 'Loại', ignored: 'Tự bỏ qua', known: 'Đã có trong cẩm nang' },
    level: { cao: 'Quan trọng', tb: 'Nên xem', thap: 'Tham khảo' },
    recommend: { approve: 'Nên duyệt', reject: 'Nên loại' },
    fbStatus: { new: 'Mới', read: 'Đã xem', done: 'Đã xử lý' },
    subStatus: { pending: 'Chưa xác nhận', active: 'Đang nhận', unsubscribed: 'Đã hủy' },
    topic: { gtgt: 'Thuế GTGT', hoadon: 'Hóa đơn', tndn: 'Thuế TNDN', tncn: 'Thuế TNCN', gdlk: 'Giao dịch liên kết', qlt: 'Quản lý thuế – Kế toán', hdld: 'Lao động', bhxh: 'BHXH' },
  };
  const topicNames = v => String(v || '').split(',').filter(Boolean).map(k => OPT.topic[k] || k).join(', ');
  const ENT = {
    feedback: {
      title: 'Góp ý về công cụ', crumb: 'Bộ công cụ · góp ý từ các công cụ', one: 'góp ý', statusKey: 'status', statusOpt: OPT.fbStatus, noAdd: true,
      cols: [['created_at', 'Ngày gửi', o => dt(o.created_at)], ['tool_slug', 'Công cụ', o => ({ 'cam-nang-thue-2026': 'Cẩm nang thuế', 'ghep-doi-chieu': 'Ghép & đối chiếu' })[o.tool_slug] || o.tool_slug], ['name', 'Họ tên'], ['phone', 'SĐT'], ['content', 'Nội dung góp ý', 'clip'], ['status', 'Trạng thái', 'pill']],
      form: [['name', 'Họ tên', 'text'], ['phone', 'Số điện thoại', 'text'], ['content', 'Nội dung góp ý', 'long', { req: 1, full: 1 }], ['page', 'Gửi từ trang', 'text'],
        ['status', 'Trạng thái', 'select', { opt: OPT.fbStatus }], ['admin_note', 'Ghi chú nội bộ / đã phản hồi gì', 'long', { full: 1 }]],
    },
    subscribers: {
      api: 'subscribers', fixed: { tool: 'cam-nang-thue-2026' }, title: 'Đăng ký nhận email cập nhật', crumb: 'Bộ công cụ · Cẩm nang thuế', one: 'người đăng ký', statusKey: 'status', statusOpt: OPT.subStatus, noAdd: true,
      cols: [['created_at', 'Ngày đăng ký', o => dt(o.created_at)], ['email', 'Email'], ['status', 'Trạng thái', 'pill'], ['confirmed_at', 'Xác nhận', o => dt(o.confirmed_at)], ['last_sent_at', 'Gửi gần nhất', o => dt(o.last_sent_at)], ['id', 'Thao tác', 'rowact']],
      form: [['email', 'Email (sửa nếu người dùng gõ sai)', 'text', { req: 1, hint: 'Sau khi sửa email, đặt trạng thái "Chưa xác nhận" rồi bấm "Gửi email xác nhận" ở Cài đặt công cụ để người đó xác nhận lại.' }], ['status', 'Trạng thái', 'select', { opt: OPT.subStatus, hint: 'Đang nhận = đã bấm xác nhận trong thư, sẽ nhận bản tin. Chưa xác nhận = mới điền email, chưa bấm link trong thư nên chưa nhận bản tin. Đã hủy = tự bấm hủy hoặc anh chuyển sang.' }], ['admin_note', 'Ghi chú', 'long', { full: 1 }]],
    },
    linkreqs: {
      title: 'Gửi link về email', crumb: 'Bộ công cụ · khách xem bằng điện thoại nhờ gửi link để mở trên máy tính', one: 'lượt gửi', statusKey: 'status', statusOpt: { sent: 'Đã gửi', failed: 'Lỗi gửi' }, noAdd: true,
      cols: [['created_at', 'Thời gian', o => dt(o.created_at)], ['email', 'Email'], ['tool_slug', 'Công cụ'], ['subscribe', 'Muốn nhận tin', o => o.subscribe ? 'Có' : ''], ['status', 'Trạng thái', 'pill']],
      form: [['email', 'Email', 'text', { req: 1 }], ['status', 'Trạng thái', 'select', { opt: { sent: 'Đã gửi', failed: 'Lỗi gửi' } }], ['admin_note', 'Ghi chú nội bộ', 'long', { full: 1 }]],
    },
    toolsubs: {
      api: 'subscribers', fixed: { tool: 'bo-cong-cu' }, title: 'Đăng ký nhận tin công cụ mới', crumb: 'Bộ công cụ · người đăng ký ở trang Bộ công cụ', one: 'người đăng ký', statusKey: 'status', statusOpt: OPT.subStatus, noAdd: true,
      cols: [['created_at', 'Ngày đăng ký', o => dt(o.created_at)], ['email', 'Email'], ['status', 'Trạng thái', 'pill'], ['confirmed_at', 'Xác nhận', o => dt(o.confirmed_at)], ['last_sent_at', 'Gửi gần nhất', o => dt(o.last_sent_at)], ['id', 'Thao tác', 'rowact']],
      form: [['email', 'Email (sửa nếu người dùng gõ sai)', 'text', { req: 1, hint: 'Sau khi sửa email, đặt trạng thái "Chưa xác nhận" rồi bấm "Gửi email xác nhận" ở Cài đặt công cụ để người đó xác nhận lại.' }], ['status', 'Trạng thái', 'select', { opt: OPT.subStatus, hint: 'Đang nhận = đã bấm xác nhận trong thư, sẽ nhận bản tin. Chưa xác nhận = mới điền email, chưa bấm link trong thư nên chưa nhận bản tin. Đã hủy = tự bấm hủy hoặc anh chuyển sang.' }], ['admin_note', 'Ghi chú', 'long', { full: 1 }]],
    },
    legal: {
      title: 'Văn bản pháp luật mới', crumb: 'Bộ công cụ · Cẩm nang thuế', one: 'văn bản', statusKey: 'status', statusOpt: OPT.legalStatus, publicPath: () => '/tools/cam-nang-thue-2026/', defStatus: 'pending', noAdd: false,
      cols: [['ngay_ban_hanh', 'Ban hành', 'num'], ['so_hieu', 'Số hiệu'], ['title', 'Nội dung', o => o.title || o.trich_yeu], ['level', 'Mức độ', o => OPT.level[o.level] || ''],
        ['topics', 'Chủ đề cẩm nang', o => topicNames(o.topics)], ['score', 'Điểm lọc', 'num'], ['status', 'Trạng thái', 'pill']],
      form: [
        ['_i1', 'Bộ lọc tự động ghi nhận', 'head'],
        ['recommend', 'Đề xuất', 'info', { map: { approve: '✅ Nên duyệt', reject: '❌ Nên loại' } }], ['recommend_note', 'Lý do đề xuất', 'info'],
        ['reasons', 'Lý do chọn', 'info'], ['score', 'Điểm lọc (≥60 Quan trọng · ≥45 Nên xem · ≥30 Tham khảo)', 'info'], ['ai', 'Người tóm tắt (rule = chỉ theo quy tắc, chưa có AI)', 'info'],
        ['list_name', 'Lấy từ danh sách', 'info'], ['url', 'Văn bản gốc trên chinhphu.vn', 'infolink'], ['pdf_url', 'File PDF', 'infolink'],
        ['_h1', 'Thông tin văn bản', 'head'],
        ['so_hieu', 'Số hiệu', 'text', { req: 1 }], ['loai', 'Loại văn bản', 'text'], ['co_quan', 'Cơ quan ban hành', 'text'],
        ['ngay_ban_hanh', 'Ngày ban hành (dd/mm/yyyy)', 'text'], ['hieu_luc', 'Ngày có hiệu lực', 'text', { hint: 'Kiểm tra lại trong văn bản gốc' }],
        ['trich_yeu', 'Trích yếu (nguyên văn nguồn)', 'long', { req: 1, full: 1 }],
        ['_h2', 'Nội dung hiện trên Cẩm nang (anh sửa câu chữ trước khi duyệt)', 'head'],
        ['title', 'Tiêu đề ngắn', 'text', { full: 1 }],
        ['summary', 'Tóm tắt', 'long', { full: 1, hint: 'Chỉ nêu điều có trong văn bản. Không ghi con số khi chưa đọc toàn văn.' }],
        ['key_points', 'Các điểm cập nhật chính (mỗi dòng 1 ý – hiện dạng gạch đầu dòng trên cẩm nang)', 'long', { full: 1, big: 1 }],
        ['impact', 'Ảnh hưởng tới nội dung cẩm nang', 'long', { full: 1 }],
        ['action', 'Việc kế toán / chủ doanh nghiệp nên làm', 'long', { full: 1 }],
        ['level', 'Mức độ', 'select', { opt: OPT.level }], ['topics', 'Chủ đề (mã, cách nhau dấu phẩy)', 'text', { hint: 'gtgt, hoadon, tndn, tncn, gdlk, qlt, hdld, bhxh' }],
        ['_t1', 'Toàn văn (khi văn bản PDF là bản scan)', 'head'],
        ['full_text', 'Toàn văn (tự điền khi anh tải file Word lên; cũng có thể dán tay)', 'long', { full: 1, big: 1 }],
        ['_aibtn', '', 'aibtn'],
        ['_h3', 'Duyệt', 'head'],
        ['recommend', 'Đề xuất', 'select', { opt: OPT.recommend }], ['recommend_note', 'Lý do đề xuất', 'text'],
        ['status', 'Trạng thái', 'select', { opt: OPT.legalStatus, hint: 'Chỉ "Đã duyệt" mới hiện trên trang Cẩm nang' }],
        ['in_handbook', 'Đã cập nhật nội dung này vào cẩm nang (bỏ nhãn "đang chờ cập nhật" ở chủ đề)', 'bool'],
        ['url', 'Link văn bản gốc', 'text', { full: 1 }], ['pdf_url', 'Link file PDF', 'text', { full: 1 }],
        ['admin_note', 'Ghi chú nội bộ', 'long', { full: 1 }],
      ],
    },
    tools: {
      title: 'Danh sách công cụ', crumb: 'Bộ công cụ', one: 'công cụ', statusKey: 'status', statusOpt: OPT.toolStatus, publicPath: t => '/cong-cu/' + t.slug,
      cols: [['_d', '', 'drag'], ['icon', '', 'icon'], ['name', 'Tên công cụ'], ['grp', 'Nhóm chủ đề', o => OPT.grp[o.grp] || o.grp], ['status', 'Trạng thái', 'pill'],
        ['pricing', 'Giá', o => o.pricing === 'paid' ? (o.price > 0 ? money(o.price) + (o.price_note ? ' ' + o.price_note : '') : 'Có phí') : 'Free'],
        ['featured', 'Nổi bật', 'star'], ['visible', 'Hiển thị', 'eye'], ['announce_at', 'Báo người đăng ký', 'announce'], ['id', 'Thao tác', 'rowact']],
      form: [
        ['_h1', 'Thông tin trên thẻ công cụ', 'head'],
        ['name', 'Tên công cụ (dễ hiểu, nói rõ việc nó làm)', 'text', { req: 1, full: 1 }], ['slug', 'Đường dẫn', 'slug', { req: 1, from: 'name', hint: 'Chữ thường không dấu, VD: doc-hoa-don-xml → /cong-cu/doc-hoa-don-xml' }],
        ['grp', 'Nhóm chủ đề (tab)', 'select', { opt: OPT.grp }], ['status', 'Trạng thái sử dụng', 'select', { opt: OPT.toolStatus, hint: 'Chỉ chọn "Dùng được" khi đã có Link công cụ hoặc Link tải về' }],
        ['icon', 'Icon', 'select', { opt: OPT.icon, preview: 1 }],
        ['pricing', 'Free hay Có phí', 'select', { opt: OPT.pricing, hint: 'Free hiện màu xanh lá, Có phí hiện màu đỏ' }], ['price', 'Giá (đồng, để 0 nếu chưa chốt giá)', 'number'],
        ['price_note', 'Đơn vị giá', 'text', { hint: 'VD: / lượt, / tháng, / năm' }],
        ['featured', 'Hiện trong carousel "Tiện ích nổi bật" (tab mặc định, thứ tự theo ô Thứ tự hiển thị)', 'bool'],
        ['pain', 'Đang phải… (nỗi đau của người dùng – hiện trên bìa sau chữ "Đang phải")', 'text', { full: 1, hint: 'Viết tiếp được sau chữ "Đang phải". VD: Nhập tay hàng trăm dòng sao kê vào phần mềm kế toán' }],
        ['tags', 'Tag (cách nhau bằng dấu phẩy)', 'text', { full: 1, hint: 'VD: Hóa đơn điện tử, XML' }],
        ['_h2', 'Chi tiết trong popup', 'head'],
        ['benefits', 'Công cụ này sẽ giúp bạn (hiện trong popup)', 'long', { full: 1, hint: 'Mỗi dòng 1 lợi ích, bắt đầu bằng động từ: Nắm rõ…, Đối chiếu…, So sánh…, Tự tính… Nên 3–4 dòng. Để trống thì popup hiện câu "Giải quyết vấn đề gì"' }],
        ['who', 'Dành cho (đối tượng sử dụng – hiện trên bìa và popup)', 'text', { full: 1, hint: 'Cách nhau bằng dấu phẩy. Bìa chỉ hiện 3 đối tượng đầu' }], ['author', 'Tác giả', 'text'], ['version', 'Phiên bản', 'text', { hint: 'VD: 1.0, hoặc Nội dung cập nhật 08/2026' }],
        ['released', 'Ngày xuất bản (công cụ Active xếp ở cột "Mới phát hành" trên Bảng ghim theo ngày này)', 'date'], ['eta', 'Ngày dự kiến phát hành (công cụ chưa Active) – có ngày thì hiện ở cột "Đang hoàn thiện" trên Bảng ghim', 'date'], ['banner_url', 'Link ảnh giao diện công cụ – hiện ở khung VIDEO DEMO trong popup (để trống: dùng ảnh chụp sẵn /assets/tools/<mã>.jpg nếu có, không thì web tự vẽ)', 'text', { full: 1 }],
        ['highlights', 'Tiện ích nổi bật (hiện trong popup)', 'long', { full: 1, hint: 'Mỗi dòng 1 tiện ích, dạng: Tên tiện ích | mô tả ngắn. Chỉ giữ 2–4 giá trị lớn nhất' }],
        ['features', 'Tính năng hữu ích (lưu nội bộ, không hiện trên web)', 'long', { full: 1, hint: 'Mỗi dòng 1 tính năng' }],
        ['guide', 'Cách sử dụng (lưu nội bộ, không hiện trên web)', 'long', { full: 1, hint: 'Mỗi dòng 1 bước' }],
        ['body', 'Giới thiệu thêm (không bắt buộc)', 'long', { full: 1, hint: 'Hỗ trợ: ## Tiêu đề, - gạch đầu dòng, **đậm**, [chữ](link)' }],
        ['videos', 'Video demo (link YouTube, video thường hoặc Shorts)', 'links', { full: 1, hint: 'Hiện ở mục "Video demo" trong popup công cụ. Nên 1 video 60–90 giây; tool nhiều tính năng có thể thêm mỗi tính năng 1 video' }],
        ['_h3', 'Truy cập / tải về & hiển thị', 'head'],
        ['url', 'Link truy cập công cụ', 'text', { full: 1, hint: 'Trang Cloudflare của tool, hoặc /tools/ten-tool/ nếu đặt file HTML trong site/public/tools' }],
        ['download_url', 'Link tải về (nếu cho tải file)', 'text', { full: 1 }],
        ['visible', 'Hiển thị trên web', 'bool', { def: 1 }], ['sort', 'Thứ tự hiển thị (nhỏ đứng trước)', 'number', { def: 100 }],
      ],
    },
    episodes: {
      title: 'Hành trình (video dài)', one: 'tập', statusKey: 'status', statusOpt: OPT.epStatus, publicPath: () => '/hanh-trinh',
      cols: [['no', 'Tập', 'num'], ['title', 'Tên tập'], ['status', 'Trạng thái', 'pill'], ['publish_date', 'Ngày đăng', 'num'], ['shorts', 'Shorts', o => (JSON.parse(o.shorts || '[]').length || 0) + ' video']],
      form: [
        ['no', 'Số tập', 'text', { hint: 'VD: Tập 02' }], ['title', 'Tên tập', 'text', { req: 1 }],
        ['status', 'Trạng thái', 'select', { opt: OPT.epStatus }], ['publish_date', 'Ngày đăng', 'date'],
        ['youtube_url', 'Link video dài (YouTube)', 'text', { full: 1 }],
        ['shorts', 'Các video ngắn cắt từ tập', 'links', { full: 1 }],
        ['summary', 'Tóm tắt / ghi chú tập', 'long', { full: 1 }],
        ['sort', 'Thứ tự (nhỏ đứng trước)', 'number', { def: 100 }], ['visible', 'Hiển thị trên web', 'bool', { def: 1 }],
      ],
    },
    reflections: {
      title: 'Góc ngẫm (Tủ sách · Phòng chiếu)', one: 'mục', statusKey: 'status', statusOpt: OPT.postStatus, publicPath: o => '/goc-ngam?phong=' + (o.kind === 'video' ? 'chieu' : 'sach'),
      cols: [['kind', 'Loại', o => o.kind === 'video' ? '🎬 Video' : '📚 Sách'], ['title', 'Tên'], ['author', 'Tác giả / kênh'], ['status', 'Trạng thái', 'pill'], ['sort', 'Thứ tự', 'num']],
      form: [
        ['kind', 'Loại', 'select', { opt: { book: '📚 Sách – Tủ sách', video: '🎬 Video – Phòng chiếu' } }], ['status', 'Trạng thái', 'select', { opt: OPT.postStatus }],
        ['title', 'Tên sách / tên video', 'text', { req: 1, full: 1 }], ['slug', 'Đường dẫn', 'slug', { req: 1, from: 'title' }],
        ['author', 'Tác giả (sách) / Kênh, diễn giả (video)', 'text'], ['published_at', 'Ngày đăng', 'date'],
        ['color', 'Màu gáy sách (VD #8E3B2F, để trống: tự chọn)', 'text'], ['sort', 'Thứ tự (nhỏ đứng trước)', 'number', { def: 100 }],
        ['shelf', 'SÁCH – Ngăn sách (chủ đề, VD: Quản trị, Tài chính, Phát triển bản thân). Cùng tên = cùng ngăn', 'text'], ['shelf_sort', 'SÁCH – Thứ tự ngăn (nhỏ đứng trước)', 'number', { def: 100 }],
        ['toc', 'SÁCH – Mục lục (mỗi dòng 1 chương/phần)', 'long', { full: 1 }],
        ['lessons', 'SÁCH – Các bài học giá trị (mỗi dòng 1 ý)', 'long', { full: 1 }],
        ['quotes', 'SÁCH – Đoạn sách hay (mỗi dòng 1 đoạn: Đoạn trích | tr. 45)', 'long', { full: 1, hint: 'Chỉ trích đoạn ngắn, ghi trang nếu có' }],
        ['youtube_url', 'VIDEO – Link YouTube', 'text', { full: 1 }],
        ['channel', 'VIDEO – Kênh / danh sách phát (VD: Quản trị con người). Cùng tên = cùng kênh', 'text'], ['channel_sort', 'VIDEO – Thứ tự kênh (nhỏ đứng trước)', 'number', { def: 100 }],
        ['summary', 'VIDEO – Mô tả ngắn', 'long', { full: 1 }],
        ['reflection', 'VIDEO – Suy nghĩ của Đốm (mỗi đoạn 1 dòng, hiện dưới TV khi bấm cuộn băng)', 'long', { full: 1 }],
        ['script', 'VIDEO – Script / ghi chép gốc (CHỈ LƯU NỘI BỘ, không hiện trên web)', 'long', { full: 1, big: 1 }],
        ['visible', 'Hiển thị trên web', 'bool', { def: 1 }],
      ],
    },
    /* v1.15 Góc ngẫm tách riêng: Tủ sách và Phòng chiếu dùng chung bảng reflections, lọc theo loại */
    books: {
      api: 'reflections', fixed: { kind: 'book' }, title: 'Tủ sách', crumb: 'Góc ngẫm · những cuốn sách chọn lọc, đã thay đổi cách nghĩ', one: 'cuốn sách', statusKey: 'status', statusOpt: OPT.postStatus, publicPath: () => '/goc-ngam?phong=sach',
      cols: [['_d', '', 'drag'], ['color', '', 'spine'], ['title', 'Tên sách'], ['author', 'Tác giả'], ['status', 'Trạng thái', 'pill'], ['visible', 'Hiển thị', 'eye'], ['id', 'Thao tác', 'rowact']],
      form: [
        ['_h1', 'Thông tin sách', 'head'],
        ['title', 'Tên sách', 'text', { req: 1, full: 1 }], ['slug', 'Đường dẫn', 'slug', { req: 1, from: 'title' }],
        ['author', 'Tác giả', 'text'], ['status', 'Trạng thái', 'select', { opt: OPT.postStatus }],
        ['color', 'Màu gáy sách (VD #6B2A26, để trống: tự chọn)', 'text', { hint: 'Kiểu gáy (vải nhũ vàng, bìa mềm, da gân, giấy ngà) tự chọn theo tên sách' }], ['sort', 'Thứ tự trên kệ (nhỏ đứng trước – hoặc kéo thả ở danh sách)', 'number', { def: 100 }],
        ['published_at', 'Ngày đăng', 'date'], ['visible', 'Hiển thị trên web', 'bool', { def: 1 }],
        ['cover_url', 'Ảnh bìa sách (không bắt buộc – để trống: web tự thiết kế bìa chữ theo bộ sưu tập)', 'image', { full: 1, hint: 'Ảnh dọc tỉ lệ 2:3, VD 600×900' }],
        ['_h2', 'Nội dung khi mở sách', 'head'],
        ['toc', 'Mục lục (mỗi dòng 1 chương/phần)', 'long', { full: 1 }],
        ['lessons', 'Các bài học giá trị (mỗi dòng 1 ý)', 'long', { full: 1 }],
        ['quotes', 'Đoạn sách hay (mỗi dòng 1 đoạn: Đoạn trích | tr. 45)', 'long', { full: 1, hint: 'Chỉ trích đoạn ngắn, ghi trang nếu có' }],
      ],
    },
    videos: {
      api: 'reflections', fixed: { kind: 'video' }, title: 'Phòng chiếu', crumb: 'Góc ngẫm', one: 'video', statusKey: 'status', statusOpt: OPT.postStatus, publicPath: () => '/goc-ngam?phong=chieu',
      cols: [['youtube_url', '', 'ytthumb'], ['title', 'Tên video'], ['channel', 'Kênh (danh sách phát)'], ['author', 'Tác giả / kênh sở hữu'], ['duration', 'Thời lượng', 'num'], ['status', 'Trạng thái', 'pill'], ['visible', 'Hiển thị', 'eye']],
      form: [
        ['_h1', 'Thông tin video', 'head'],
        ['title', 'Tên video', 'text', { req: 1, full: 1 }], ['slug', 'Đường dẫn', 'slug', { req: 1, from: 'title' }],
        ['youtube_url', 'Link YouTube', 'text', { full: 1 }],
        ['author', 'Tác giả / kênh sở hữu video (hiện trên cuộn băng)', 'text'], ['duration', 'Thời lượng (VD 12:48 hoặc 1:05:20)', 'text', { hint: 'Hiện trên cuộn băng và dưới TV' }],
        ['channel', 'Thuộc kênh (danh sách phát)', 'select', { opt: {}, hint: 'Thêm / đổi tên kênh ở cột "Kênh" trong trang Phòng chiếu' }],
        ['status', 'Trạng thái', 'select', { opt: OPT.postStatus, def: 'published' }], ['published_at', 'Ngày đăng', 'date'],
        ['sort', 'Thứ tự trong kênh (nhỏ đứng trước – hoặc kéo thả ở trang Phòng chiếu)', 'number', { def: 9990 }], ['visible', 'Hiển thị trên web', 'bool', { def: 1 }],
        ['_h2', 'Nội dung dưới TV', 'head'],
        ['summary', 'Mô tả ngắn', 'long', { full: 1 }],
        ['reflection', 'Đốm ngẫm (mỗi đoạn 1 dòng, hiện dưới TV khi bấm cuộn băng)', 'long', { full: 1 }],
        ['script', 'Script / ghi chép gốc (CHỈ LƯU NỘI BỘ, không hiện trên web)', 'long', { full: 1, big: 1 }],
      ],
    },
    topics: {
      title: 'Chủ đề bài viết', crumb: 'Góc ngẫm', one: 'chủ đề', statusOpt: {}, publicPath: o => '/goc-ngam?phong=bai-viet&chu-de=' + o.slug,
      cols: [['_d', '', 'drag'], ['name', 'Tên chủ đề'], ['slug', 'Đường dẫn'], ['color', 'Màu', o => OPT.topicColor[o.color] || o.color], ['visible', 'Hiển thị', 'eye'], ['id', 'Thao tác', 'rowact']],
      form: [
        ['name', 'Tên chủ đề', 'text', { req: 1 }], ['slug', 'Đường dẫn', 'slug', { req: 1, from: 'name' }],
        ['color', 'Màu nhãn chủ đề', 'select', { opt: OPT.topicColor }], ['sort', 'Thứ tự (nhỏ đứng trước)', 'number', { def: 100 }],
        ['description', 'Mô tả ngắn (hiện khi lọc theo chủ đề)', 'text', { full: 1 }], ['visible', 'Hiển thị trên web', 'bool', { def: 1 }],
      ],
    },
    posts: {
      title: 'Bài viết', crumb: 'Góc ngẫm', one: 'bài viết', statusKey: 'status', statusOpt: OPT.blogStatus, publicPath: p => '/blog/' + p.slug + (p.status === 'published' ? '' : '?xem-truoc=' + p.preview_key),
      cols: [['cover_url', '', 'thumb'], ['title', 'Tiêu đề'], ['topics', 'Chủ đề', o => String(o.topics || '').split(',').map(x => (TOPICS.find(t => t.slug === x.trim()) || {}).name || x.trim()).filter(Boolean).join(', ')],
        ['status', 'Trạng thái', 'pill'], ['published_at', 'Ngày đăng', 'num'], ['id', 'Thao tác', 'postact']],
      form: [
        ['h1', '1. Nội dung', 'head'],
        ['title', 'Tiêu đề bài viết', 'text', { req: 1, full: 1 }], ['slug', 'Đường dẫn', 'slug', { req: 1, from: 'title' }],
        ['status', 'Trạng thái', 'select', { opt: OPT.blogStatus, hint: 'Chờ duyệt = đã soạn xong, chờ anh xem. Chỉ "Đã đăng" mới hiện trên web' }],
        ['topics', 'Nhóm chủ đề', 'topics', { full: 1 }],
        ['published_at', 'Ngày đăng', 'date', { hint: 'Để trống: tự lấy ngày bấm Duyệt & đăng' }], ['featured', 'Ghim lên đầu Blog (bài nổi bật)', 'bool'],
        ['cover_url', 'Ảnh banner (tỉ lệ 16:9, nên 1600×900)', 'image', { full: 1 }], ['cover_alt', 'Mô tả ảnh banner (cho người dùng trình đọc màn hình và Google)', 'text', { full: 1 }],
        ['excerpt', 'Sapo – 1–2 câu mở đầu, hiện trên thẻ bài và dưới tiêu đề', 'text', { full: 1 }],
        ['body', 'Nội dung', 'long', { full: 1, big: 1, hint: 'Hỗ trợ: ## Tiêu đề mục (tự tạo mục lục), ### Tiêu đề nhỏ, > Trích dẫn nổi bật, - gạch đầu dòng, 1. đánh số, **đậm**, *nghiêng*, [chữ](link), ![mô tả](link ảnh), --- đường kẻ' }],
        ['h2', '2. SEO & chia sẻ mạng xã hội', 'head'],
        ['seo_title', 'Tiêu đề SEO (Google) – nên dưới 60 ký tự, để trống = tiêu đề bài', 'text', { full: 1 }],
        ['seo_desc', 'Mô tả SEO – nên 120–160 ký tự, để trống = sapo', 'text', { full: 1 }],
        ['og_title', 'Tiêu đề khi chia sẻ Facebook / Zalo – để trống = tiêu đề bài', 'text', { full: 1 }],
        ['og_desc', 'Mô tả khi chia sẻ – để trống = mô tả SEO', 'text', { full: 1 }],
        ['og_image', 'Ảnh chia sẻ 1200×630 (có thể ghép sẵn tiêu đề) – để trống = ảnh banner', 'image', { full: 1 }],
        ['noindex', 'Ẩn bài này khỏi Google (vẫn đọc được bằng link)', 'bool'],
        ['seopv', 'Xem trước khi lên Google và Facebook', 'seopv'],
      ],
    },

    requests: {
      title: 'Bảng ghim · Đề xuất công cụ & tính năng', crumb: 'Trang người dùng', one: 'đề xuất', statusKey: 'status', statusOpt: OPT.reqStatus, publicPath: () => '/bang-ghim',
      cols: [['created_at', 'Ngày gửi', o => dt(o.created_at)], ['tool_ref', 'Đề xuất cho', o => o.tool_ref ? '➕ Tính năng: ' + o.tool_ref : '🆕 Công cụ mới'], ['pain', 'Nội dung', 'clip'], ['role', 'Vị trí'], ['votes', 'Lượt cùng cần', 'num'], ['status', 'Trạng thái', 'pill'], ['on_board', 'Bảng ghim', 'pin'], ['eta', 'Dự kiến', 'num']],
      form: [
        ['pain', 'Việc lặp lại', 'long', { req: 1, full: 1 }], ['role', 'Vị trí', 'text'], ['contact', 'Liên hệ', 'text'],
        ['status', 'Trạng thái', 'select', { opt: OPT.reqStatus }], ['votes', 'Lượt cùng cần (gộp các yêu cầu giống nhau)', 'number', { def: 1 }],
        ['tool_ref', 'Đề xuất thêm tính năng cho công cụ (slug, trống = đề xuất công cụ mới)', 'text'],
        ['tool_slug', 'Công cụ trên web gắn với tờ note (slug database)', 'text', { hint: 'Có slug: bấm vào note sẽ mở đúng popup công cụ đó; khi "Mới phát hành" note có nút "Dùng ngay"' }], ['admin_note', 'Ghi chú nội bộ', 'long', { full: 1 }],
        ['on_board', 'Ghim lên Bảng ghim (công khai)', 'bool', { hint: 'Bảng chỉ hiện Tên đề xuất, Mô tả, Trạng thái, Ngày dự kiến, Lời Đốm. Trạng thái Mới/Đang xem/Sẽ làm → cột "Danh sách chờ"; Đang làm (hoặc Sẽ làm có ngày dự kiến) → cột "Đang hoàn thiện". Không hiện nội dung gốc, vị trí, liên hệ người gửi' }],
        ['board_title', 'Tên công cụ đề xuất – trên giấy note (bắt buộc để hiện)', 'text', { full: 1 }],
        ['board_desc', 'Mô tả việc lặp lại – đã biên tập, trên giấy note', 'long', { full: 1 }],
        ['eta', 'Ngày dự kiến phát hành', 'date', { hint: 'Đổi sang ngày muộn hơn → bảng tự ghi "Lùi sang … (dự kiến cũ …)"' }],
        ['board_note', 'Lời Đốm – chữ viết tay trên note (VD lý do chưa làm)', 'text', { full: 1 }],
        ['board_link', 'Link giải pháp khác (khi Chưa làm vì đã có công cụ phù hợp)', 'text', { full: 1 }],
      ],
    },
    bookings: {
      title: 'Lịch hẹn trò chuyện 1:1', crumb: 'Tách cà phê', one: 'lời hẹn', statusKey: 'status', statusOpt: OPT.bookStatus,
      cols: [['created_at', 'Ngày gửi', o => dt(o.created_at)], ['name', 'Tên'], ['contact', 'Liên hệ'], ['topic', 'Chủ đề'], ['status', 'Trạng thái', 'pill'], ['scheduled_at', 'Lịch hẹn']],
      form: [
        ['name', 'Tên', 'text', { req: 1 }], ['contact', 'Liên hệ', 'text', { req: 1 }], ['topic', 'Chủ đề', 'text'],
        ['status', 'Trạng thái', 'select', { opt: OPT.bookStatus }], ['scheduled_at', 'Lịch hẹn', 'text', { hint: 'VD: 20:00 15/10/2026, Google Meet' }],
        ['description', 'Tình huống khách mô tả', 'long', { full: 1 }], ['admin_note', 'Ghi chú nội bộ', 'long', { full: 1 }],
      ],
    },
  };

  /* ---------- khung (v1.15: sáng, menu theo từng module trên trang người dùng) ---------- */
  let page = 'dashboard', SETTINGS = null, badge = {};
  const TOOL_TABS = [['legal', 'Văn bản pháp luật mới'], ['feedback', 'Góp ý'], ['subscribers', 'Đăng ký nhận email'], ['toolset', 'Cài đặt công cụ']];
  const TOOL_PAGES = TOOL_TABS.map(t => t[0]);
  const toolTabs = active => `<div class="tooltabs"><p class="mono">Bộ công cụ · Cẩm nang thuế · <a href="${esc(SITE_BASE())}/tools/cam-nang-thue-2026/" target="_blank" rel="noopener" id="toolLink">Mở công cụ ↗</a></p>
    <h2 class="tooltitle">📘 Cẩm nang Thuế – Kế toán – Lao động 2026</h2>
    <nav class="ttabs">${TOOL_TABS.map(([k, l]) => `<button class="ttab" data-go="${k}" aria-current="${k === active ? 'page' : 'false'}">${l}${badge['t_' + k] ? `<span class="badge">${badge['t_' + k]}</span>` : ''}</button>`).join('')}</nav></div>`;
  const NI = {
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    door: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 8h16"/><circle cx="7" cy="5.5" r=".6"/><circle cx="9.5" cy="5.5" r=".6"/>',
    dom: '<circle cx="12" cy="12" r="6"/><ellipse cx="12" cy="12" rx="10" ry="3.2" transform="rotate(-18 12 12)"/>',
    tool: '<path d="M14.5 6.5a4 4 0 0 0-5.3 5.3L3.5 17.5 6.5 20.5l5.7-5.7a4 4 0 0 0 5.3-5.3l-2.6 2.6-2.4-.6-.6-2.4z"/>',
    pin: '<path d="M9 3h6l-1 6 4 4H6l4-4z"/><path d="M12 13v8"/>',
    leaf: '<path d="M4 19c0-9 6-14 16-15-1 10-6 16-15 16"/><path d="M4 20l8-8"/>',
    cup: '<path d="M4 9h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3c0 1.5 1 1.5 1 3M12 3c0 1.5 1 1.5 1 3"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10.5l5-3v9l-5-3"/>',
    card: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10.5h18M7 15.5h3"/>',
    chart: '<path d="M4 19V5"/><path d="M4 19h16"/><path d="M7 15l4-5 3 3 5-6"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M4.2 6.2l2.1 2.1M17.7 15.7l2.1 2.1M2.5 12h3M18.5 12h3M4.2 17.8l2.1-2.1M17.7 8.3l2.1-2.1"/>',
  };
  const navIcon = k => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${NI[k]}</svg>`;
  const MENU = [
    { k: 'dashboard', t: 'Tổng quan', i: 'home' },
    { k: 'analytics', t: 'Phân tích web', i: 'chart' }, // v1.20 – trang ở admin/public/analytics.js
    { g: 'Trang người dùng' },
    { k: 'home', t: 'Trang chủ', i: 'door' },
    { k: 'about', t: 'Về Đốm', i: 'dom' },
    { k: 'tools', t: 'Bộ công cụ', i: 'tool', sub: [['tools', 'Danh sách công cụ'], ['toolsubs', 'Đăng ký tin công cụ mới'], ['linkreqs', 'Gửi link về email'], ['stats', 'Thống kê sử dụng'], ['legal', 'Cẩm nang thuế']] },
    { k: 'requests', t: 'Bảng ghim', i: 'pin' },
    { k: 'books', t: 'Góc ngẫm', i: 'leaf', sub: [['books', 'Tủ sách'], ['videos', 'Phòng chiếu'], ['posts', 'Bài viết'], ['topics', 'Chủ đề bài viết']] },
    { k: 'bookings', t: 'Tách cà phê', i: 'cup', sub: [['bookings', 'Lịch hẹn trò chuyện'], ['cafeset', 'Mã QR & lời cảm ơn']] },
    { g: 'Kênh video' },
    { k: 'studio', t: 'Xưởng video', i: 'video', sub: [['studio', 'Lịch đăng'], ['vlist', 'Kho video']] },
    { g: 'Hệ thống' },
    { k: 'subs', t: 'Dịch vụ & công cụ AI', i: 'card' },
    { k: 'system', t: 'Cài đặt chung', i: 'gear' },
  ];
  const PAGES = new Set(MENU.flatMap(m => m.sub ? m.sub.map(s => s[0]) : m.k ? [m.k] : []).concat(TOOL_PAGES));
  const OLD_HASH = { settings: 'system', reflections: 'books', episodes: 'dashboard', vcal: 'studio', vperf: 'studio' };
  const parentOf = p => { const hp = TOOL_PAGES.includes(p) ? 'legal' : p; const m = MENU.find(x => x.k === hp || (x.sub && x.sub.some(s => s[0] === hp))); return { m, hp }; };
  function shell() {
    $('#app').innerHTML = `<div class="layout"><aside aria-label="Menu quản trị">
      <div class="logo"><img src="${esc(SITE_BASE())}/assets/dom/dom-01-chao-sang.webp" alt="" width="40" height="40"><span>Quản trị tử tế<small>Phòng điều hành của Đốm</small></span></div>
      <nav class="menu">${MENU.map(m => m.g ? `<div class="grp">${m.g}</div>`
        : `<div class="mi${m.sub ? ' has-sub' : ''}" data-mi="${m.k}"><button class="nav" data-page="${m.k}">${navIcon(m.i)}<span class="nl">${m.t}</span><span class="badge" data-badge="${m.sub ? 'p_' + m.k : m.k}" hidden></span></button>
          ${m.sub ? `<div class="subnav">${m.sub.map(([k, t]) => `<button class="nav sub" data-page="${k}"><span class="nl">${t}</span><span class="badge" data-badge="${k}" hidden></span></button>`).join('')}</div>` : ''}</div>`).join('')}</nav>
      <div class="bottom"><a class="btn ghost sm" id="viewsite" href="#" target="_blank" rel="noopener">Xem trang khách ↗</a><button class="btn ghost sm" id="logout">Đăng xuất</button></div>
    </aside><main id="main"></main></div>`;
  }
  function setBadgeData(d) {
    const L = d.legal || {};
    badge = { requests: d.requests.new || 0, bookings: d.bookings.new || 0, legal: (L.pending || 0) + (L.fb_new || 0), posts: (d.posts || {}).review || 0, t_legal: L.pending || 0, t_feedback: L.fb_new || 0 };
    badge.studio = (d.studio || {}).due || 0; badge.p_studio = badge.studio; badge.subs = (d.subs || {}).due || 0;
    badge.p_tools = badge.legal; badge.p_books = badge.posts; badge.p_bookings = badge.bookings;
  }
  function setBadges() {
    document.querySelectorAll('[data-badge]').forEach(el => { const n = badge[el.dataset.badge] || 0; el.textContent = n || ''; el.hidden = !n; });
    /* menu cha chỉ hiện số khi đang thu gọn (không mở mục con) */
    document.querySelectorAll('.mi.has-sub').forEach(mi => { const b = mi.querySelector(':scope > .nav .badge'); if (b && mi.classList.contains('open')) b.hidden = true; });
  }
  async function loadSettings() { if (!SETTINGS) SETTINGS = await api('settings'); const lg = document.querySelector('.logo img'); if (lg) lg.src = SITE_BASE() + '/assets/dom/dom-01-chao-sang.webp'; const u = SETTINGS.settings.site_url; const a = $('#viewsite'); if (a) { a.href = u || '#'; a.hidden = !u; } return SETTINGS; }
  function nav(p, arg) {
    if (OLD_HASH[p]) p = OLD_HASH[p];
    if (!PAGES.has(p)) p = 'dashboard';
    page = p;
    const { m, hp } = parentOf(p);
    document.querySelectorAll('.nav').forEach(b => b.setAttribute('aria-current', b.dataset.page === hp && (b.classList.contains('sub') || !(m && m.sub)) ? 'page' : 'false'));
    document.querySelectorAll('.mi').forEach(mi => { const on = m && mi.dataset.mi === m.k; mi.classList.toggle('active', !!on); mi.classList.toggle('open', !!(on && m.sub)); });
    setBadges();
    try { history.replaceState(null, '', '#' + p); } catch (e) { }
    const v = QTT.pages[p] ? () => QTT.pages[p]() : p === 'dashboard' ? dashboard : p === 'stats' ? stats : SETPAGES[p] ? () => settingsPage(p) : p === 'toolset' ? toolSettings : p === 'videos' ? videosPage : () => list(p);
    $('#main').innerHTML = '<p class="note">Đang tải…</p>';
    window.scrollTo(0, 0);
    v(arg).catch(e => { $('#main').innerHTML = `<p class="err">${esc(e.message)}</p>`; });
  }
  const pillOf = (ent, v) => `<span class="pill p-${esc(v)}">${esc((ENT[ent].statusOpt || {})[v] || v)}</span>`;
  const head = (crumb, title, right = '', sub = '') => `<div class="bar"><div><p class="mono">${crumb}</p><h1>${title}</h1>${sub ? `<p class="note">${sub}</p>` : ''}</div>${right ? `<div class="bar-r">${right}</div>` : ''}</div>`;
  Object.assign(QTT, { api, esc, toast, dt, $, head, nav, download, siteBase: () => SITE_BASE() });

  /* ---------- v1.11 thống kê công cụ (bộ đếm) ---------- */
  let statDays = 30, statTool = '';
  async function stats() {
    const d = await api('stats?days=' + statDays);
    const nf = n => new Intl.NumberFormat('vi-VN').format(n || 0);
    const tot = Object.fromEntries(d.totals.map(r => [r.slug, r]));
    const tools = d.tools.filter(t => tot[t.slug] || t.status === 'ok');
    if (!statTool || !tools.some(t => t.slug === statTool)) statTool = (tools[0] || {}).slug || '';
    const sum = k => d.totals.reduce((a, r) => a + (r[k] || 0), 0);
    const days = []; for (let i = d.days - 1; i >= 0; i--) days.push(new Date(Date.now() + 7 * 3600000 - i * 86400000).toISOString().slice(0, 10));
    const rows = d.daily.filter(r => r.slug === statTool), by = Object.fromEntries(rows.map(r => [r.day, r]));
    const max = Math.max(1, ...days.map(x => Math.max((by[x] || {}).visits || 0, (by[x] || {}).uses || 0)));
    const ddmm = x => x.split('-').reverse().slice(0, 2).join('/');
    $('#main').innerHTML = `<div class="bar"><div><p class="mono">Bộ công cụ</p><h1>Thống kê sử dụng</h1></div>
        <div style="display:flex;gap:6px">${[7, 30, 90].map(n => `<button class="btn sm ${n === statDays ? '' : 'ghost'}" data-sdays="${n}">${n} ngày</button>`).join('')}</div></div>
      <div class="stats">
        <div class="card stat"><p class="mono">Lượt truy cập · ${d.days} ngày</p><p class="v">${nf(sum('range_visits'))}</p><p class="note">tổng ${nf(sum('visits'))} · hôm nay ${nf(sum('today_visits'))}</p></div>
        <div class="card stat"><p class="mono">Lượt dùng · ${d.days} ngày</p><p class="v">${nf(sum('range_uses'))}</p><p class="note">tổng ${nf(sum('uses'))} · hôm nay ${nf(sum('today_uses'))}</p></div>
        <div class="card stat"><p class="mono">Lượt tải offline · ${d.days} ngày</p><p class="v">${nf(sum('range_downloads'))}</p><p class="note">tổng ${nf(sum('downloads'))}</p></div>
      </div>
      <div class="card panel" style="margin-top:16px"><h2>Theo công cụ</h2>
        <div class="tbl-wrap"><table><thead><tr><th>Công cụ</th><th>Truy cập (${d.days} ngày)</th><th>Hôm nay</th><th>Dùng (${d.days} ngày)</th><th>Tải (${d.days} ngày)</th><th>Tổng truy cập / dùng / tải</th><th>Đếm từ</th></tr></thead>
        <tbody>${tools.map(t => { const r = tot[t.slug] || {}; return `<tr class="row" data-stool="${esc(t.slug)}" style="cursor:pointer${t.slug === statTool ? ';background:var(--accent-soft,#f3e3cc)' : ''}">
          <td><b>${esc(t.name)}</b></td><td>${nf(r.range_visits)}</td><td>${nf(r.today_visits)}</td><td>${nf(r.range_uses)}</td><td>${nf(r.range_downloads)}</td>
          <td>${nf(r.visits)} / ${nf(r.uses)} / ${nf(r.downloads)}</td><td>${r.first_day ? ddmm(r.first_day) + '/' + r.first_day.slice(0, 4) : '–'}</td></tr>`; }).join('') || '<tr><td colspan="7" class="note">Chưa có công cụ nào.</td></tr>'}</tbody></table></div>
        <p class="note" style="margin-top:8px">Lượt truy cập: mỗi người 1 lượt/ngày khi mở link công cụ. Lượt dùng: mở, xem nội dung trong công cụ (tối đa 20 lượt/người/ngày). Bản offline chỉ đếm lượt tải. Số liệu tính từ ngày có bộ đếm (bản 1.11), không có số trước đó.</p></div>
      ${statTool ? `<div class="card panel" style="margin-top:16px"><h2>Theo ngày · ${esc((tools.find(t => t.slug === statTool) || {}).name || '')}</h2>
        <div class="chart" aria-label="Biểu đồ lượt truy cập mỗi ngày">${days.map(x => `<i title="${ddmm(x)}: ${nf((by[x] || {}).visits)} truy cập · ${nf((by[x] || {}).uses)} dùng · ${nf((by[x] || {}).downloads)} tải" style="height:${((by[x] || {}).visits || 0) / max * 100}%"></i>`).join('')}</div>
        <p class="note">Cột = lượt truy cập mỗi ngày (rê chuột để xem cả lượt dùng, lượt tải). ${ddmm(days[0])} → ${ddmm(days[days.length - 1])}</p></div>` : ''}`;
    $('#main').querySelectorAll('[data-sdays]').forEach(b => b.onclick = () => { statDays = +b.dataset.sdays; nav('stats'); });
    $('#main').querySelectorAll('[data-stool]').forEach(r => r.onclick = () => { statTool = r.dataset.stool; nav('stats'); });
  }

  /* ---------- tổng quan (v1.15: ảnh bìa, lời chào, việc cần xử lý, thẻ từng module) ---------- */
  const imgUrl = v => v ? (/^(https?:|data:)/i.test(v) ? v : SITE_BASE() + v) : '';
  const greet = () => { const h = new Date().getHours(); return h < 11 ? 'Chào buổi sáng' : h < 13 ? 'Chào buổi trưa' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'; };
  const today = () => { const s = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }); return s.charAt(0).toUpperCase() + s.slice(1); };
  async function dashboard() {
    const [d] = await Promise.all([api('dashboard'), loadSettings()]);
    setBadgeData(d); setBadges();
    const S = SETTINGS.settings, sum = o => Object.values(o || {}).reduce((a, b) => a + b, 0);
    const R = d.reflections || {}, T = d.tools || {}, V = d.toolVis || {}, P = d.posts || {}, L = d.legal || {};
    const cover = imgUrl(S.admin_cover) || SITE_BASE() + '/assets/desk-on.jpg';
    const days = []; for (let i = 29; i >= 0; i--) days.push(new Date(Date.now() + 7 * 3600000 - i * 86400000).toISOString().slice(0, 10));
    const map = Object.fromEntries(d.dailyRequests.map(r => [r.day, r.n])); const max = Math.max(1, ...days.map(x => map[x] || 0));
    const todo = [
      ['requests', 'Đề xuất mới', d.requests.new || 0, 'chờ anh đọc và phân loại'],
      ['bookings', 'Hẹn cà phê mới', d.bookings.new || 0, 'người muốn trò chuyện 1:1'],
      ['legal', 'Văn bản chờ duyệt', L.pending || 0, L.need_full ? `${L.need_full} văn bản cần file gốc` : 'cho Cẩm nang thuế'],
      ['feedback', 'Góp ý mới', L.fb_new || 0, 'về Cẩm nang thuế'],
      ['posts', 'Bài viết chờ duyệt', P.review || 0, 'đã soạn, chờ anh xem'],
    ];
    const nTodo = todo.reduce((a, t) => a + t[2], 0);
    const tile = (go, icon, name, lines, act) => `<button class="tile" data-go="${go}"><span class="tile-i">${navIcon(icon)}</span><span class="tile-b"><b>${name}</b>${lines.map(l => `<span>${l}</span>`).join('')}</span><span class="tile-go">${act} →</span></button>`;
    $('#main').innerHTML = `<section class="hero" style="--cover:url('${esc(cover)}')">
        <div class="hero-shade"></div>
        <div class="hero-txt"><p class="hero-date">${esc(today())}</p><h1>${greet()}, anh Tuấn</h1>
          <p class="hero-sub">${nTodo ? `Hôm nay có <b>${nTodo}</b> việc đang chờ anh – Đốm đã xếp sẵn bên dưới.` : 'Mọi việc đang gọn gàng. Anh có thể dành thời gian cho một công cụ mới.'}</p>
          <p class="hero-motto">“Quản trị lấy Con người làm gốc.”</p></div>
        <img class="hero-dom" src="${esc(SITE_BASE())}/assets/dom/dom-01-chao-toi.webp" alt="" width="150" height="150">
        <div class="hero-tools"><button class="btn sm glass" id="coverUp">🖼 Đổi ảnh bìa</button>${S.admin_cover ? '<button class="btn sm glass" id="coverReset">Ảnh mặc định</button>' : ''}</div>
      </section>
      <h2 class="sec-t">Việc cần xử lý</h2>
      <div class="todo">${todo.map(([go, t, n, s]) => `<button class="todo-c${n ? ' hot' : ''}" data-go="${go}"><span class="todo-n">${n}</span><span><b>${t}</b><small>${esc(s)}</small></span></button>`).join('')}</div>
      <h2 class="sec-t">Các khu vực trên web</h2>
      <div class="tiles">
        ${tile('home', 'door', 'Trang chủ', [S.headline ? esc(S.headline).slice(0, 60) : 'Chưa có câu định vị', S.notice ? '📢 Đang bật thông báo đầu trang' : 'Không có thông báo đầu trang'], 'Sửa nội dung')}
        ${tile('about', 'dom', 'Về Đốm', [S.about_photo ? '✅ Đã có ảnh anh Minh Tuấn' : '⬜ Chưa có ảnh anh Minh Tuấn', 'Lời chào, tên, câu chuyện của Đốm'], 'Sửa trang')}
        ${tile('tools', 'tool', 'Bộ công cụ', [`<b>${(T.ok || 0)}</b> dùng được · ${T.soon || 0} sắp có · ${T.risk || 0} rà soát`, `${V.shown || 0} đang hiện · ${V.hidden || 0} đang ẩn`], 'Quản lý')}
        ${tile('requests', 'pin', 'Bảng ghim', [`<b>${sum(d.requests)}</b> đề xuất · ${d.requests.new || 0} mới`, `${(d.requests.building || 0)} đang hoàn thiện · ${(d.requests.done || 0)} mới phát hành`], 'Mở bảng')}
        ${tile('books', 'leaf', 'Góc ngẫm', [S.ngam_on === '1' ? '👁 Đang hiện trên web' : '🚫 Đang ẩn trên web', `📚 ${(R.book_published || 0)} sách · 🎬 ${(R.video_published || 0)} video đã đăng`, `✍️ ${P.published || 0} bài viết · ${P.draft || 0} nháp`], 'Mở Góc ngẫm')}
        ${tile('bookings', 'cup', 'Tách cà phê', [`<b>${sum(d.bookings)}</b> lời hẹn · ${d.bookings.new || 0} mới`, d.checklist.bank ? '✅ Mã QR đã có tài khoản' : '⬜ Chưa nhập tài khoản cho mã QR'], 'Xem lịch hẹn')}
      </div>
      <div class="two">
        <div class="card panel"><h2>Đề xuất 30 ngày qua</h2><div class="chart" aria-label="Biểu đồ số đề xuất mỗi ngày">${days.map(x => `<i title="${x.split('-').reverse().join('/')}: ${map[x] || 0}" style="height:${(map[x] || 0) / max * 100}%"></i>`).join('')}</div><p class="note" style="margin-top:6px">Cao nhất ${Object.keys(map).length ? max : 0} / ngày</p></div>
        <div class="card panel"><h2>Thiết lập cơ bản</h2><ul class="list checks">
          <li>${d.checklist.contact ? '✅' : '⬜'} Thông tin liên hệ</li><li>${d.checklist.social ? '✅' : '⬜'} Link TikTok / Fanpage / YouTube</li>
          <li>${d.checklist.bank ? '✅' : '⬜'} Tài khoản nhận ủng hộ (mã QR trên tách cà phê)</li><li>${S.site_url ? '✅' : '⬜'} Địa chỉ trang khách</li>
          <li>${S.about_photo ? '✅' : '⬜'} Ảnh anh Minh Tuấn trên trang Về Đốm</li></ul>
          <button class="btn sm ghost" data-go="system" style="margin-top:12px">Mở Cài đặt chung</button></div>
        <div class="card panel"><h2>Đề xuất gần đây</h2>${d.recentRequests.length ? `<ul class="list">${d.recentRequests.map(r => `<li><span class="clip" style="max-width:none">${esc(r.pain)}</span>${pillOf('requests', r.status)}</li>`).join('')}</ul>` : '<p class="note">Chưa có đề xuất nào.</p>'}</div>
        <div class="card panel"><h2>Lời hẹn cà phê gần đây</h2>${d.recentBookings.length ? `<ul class="list">${d.recentBookings.map(r => `<li><span><b>${esc(r.name)}</b> · ${esc(r.topic)}<br><span class="note">${dt(r.created_at)}</span></span>${pillOf('bookings', r.status)}</li>`).join('')}</ul>` : '<p class="note">Chưa có lời hẹn nào.</p>'}</div>
      </div>
      <p class="note" style="margin-top:14px">${d.lastScan ? `Quét văn bản pháp luật gần nhất: ${dt(d.lastScan.started_at)} · ${d.lastScan.ok ? `đọc ${d.lastScan.fetched} văn bản, ${d.lastScan.new_count} mới` : 'lỗi ' + esc(d.lastScan.error || '')}` : 'Chưa quét văn bản pháp luật lần nào.'}</p>`;
    const saveCover = async v => { await api('settings', { method: 'POST', body: JSON.stringify({ admin_cover: v }) }); SETTINGS = null; nav('dashboard'); };
    $('#coverUp').onclick = e => pickFile('image/jpeg,image/png,image/webp').then(async f => {
      if (!f) return; const b = e.target; b.disabled = true; b.textContent = 'Đang tải ảnh…';
      try { const r = await api('media', { method: 'POST', body: JSON.stringify({ name: f.name, data: await shrinkImage(f, 2400) }) }); await saveCover(r.url); toast('Đã đổi ảnh bìa.'); }
      catch (err) { toast(err.message, true); b.disabled = false; b.textContent = '🖼 Đổi ảnh bìa'; }
    });
    if ($('#coverReset')) $('#coverReset').onclick = () => saveCover('').then(() => toast('Đã dùng lại ảnh bìa mặc định.')).catch(err => toast(err.message, true));
  }

  /* ---------- danh sách ---------- */
  const listState = {};
  const ytId = u => (String(u || '').match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/) || [])[1] || '';
  const SPINE2 = ['#2F4A3A', '#22344F', '#9C4630', '#B07D2C', '#55344D', '#2E5A5C', '#6B2633', '#33343A', '#5F6E4E', '#E6DCC6', '#7A4A2A', '#3C4F6E']; /* cùng bảng màu gáy sách trên web */
  /* v1.15d Công tắc Bật / Ẩn Góc ngẫm + từng phòng trên web */
  const ROOMKEY = { books: ['ngam_sach_on', 'Tủ sách'], videos: ['ngam_chieu_on', 'Phòng chiếu'], posts: ['ngam_baiviet_on', 'Bài viết'], topics: ['ngam_baiviet_on', 'Bài viết'] };
  const swOn = (S, k) => String(S[k] ?? '') === '1';
  function roomBar(ent) {
    const S = SETTINGS.settings, [k, name] = ROOMKEY[ent], all = swOn(S, 'ngam_on'), me = swOn(S, k), live = all && me;
    const path = { books: 'sach', videos: 'chieu', posts: 'bai-viet', topics: 'bai-viet' }[ent];
    const EYE = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
    const tile = (key, on, kicker, title, desc) => `<button type="button" class="vt${on ? ' on' : ''}" data-vsw="${key}" aria-pressed="${on}">
        <span class="vt-k">${kicker}</span><span class="vt-row"><span class="vt-txt"><b>${title}</b><small>${desc}</small></span>
        <span class="vt-sw" aria-hidden="true"><i></i><em>${on ? 'Bật' : 'Tắt'}</em></span></span></button>`;
    return `<section class="vis card${live ? ' live' : ''}">
      <header class="vis-h"><span class="vis-ic">${EYE}</span><div><b>Hiển thị trên trang web</b><small>Khi đang ẩn, anh vẫn nhập và sửa nội dung bình thường – bật lên khi đã sẵn sàng.</small></div></header>
      <div class="vis-flow">
        ${tile('ngam_on', all, 'Bước 1 · Cả mục', 'Góc ngẫm', all ? 'Đang có trên menu web' : 'Đang ẩn khỏi menu web')}
        <span class="vis-arrow" aria-hidden="true">→</span>
        ${tile(k, me, 'Bước 2 · Phòng', name, me ? 'Phòng đang bật' : 'Phòng đang tắt')}
        <span class="vis-arrow" aria-hidden="true">=</span>
        <div class="vis-res${live ? ' on' : ''}"><span class="vis-dot" aria-hidden="true"></span><div><b>${live ? 'Khách đang xem được' : 'Khách chưa xem được'}</b>
          <small>${live ? name + ' đang hiện trên web.' : !all && !me ? 'Cần bật cả 2 bước.' : !all ? 'Bật thêm Bước 1 · Góc ngẫm.' : 'Bật thêm Bước 2 · ' + name + '.'}</small>
          ${live ? `<a href="${esc(SITE_BASE())}/goc-ngam?phong=${path}" target="_blank" rel="noopener">Mở trang ↗</a>` : ''}</div></div>
      </div></section>`;
  }
  const DRAG = { tools: 1, topics: 1, books: 1 };
  async function list(ent) {
    const E = ENT[ent], path = E.api || ent, st = listState[ent] || (listState[ent] = { q: '', status: E.defStatus || '', grp: '', vis: '' });
    const qs = new URLSearchParams({ q: st.q, status: st.status, ...(E.fixed || {}) });
    if (st.grp) qs.set('grp', st.grp); if (st.vis) qs.set('visible', st.vis);
    const d = await api(`${path}?${qs}`);
    if (ent === 'posts') await loadTopics();
    const canDrag = !!DRAG[ent];
    const cell = (o, [k, , f]) => f === 'thumb' ? (o[k] ? `<img class="thumb" src="${esc(imgUrl(o[k]))}" alt="" loading="lazy">` : '<span class="thumb none"></span>')
      : f === 'drag' ? `<span class="grip" title="Kéo để đổi vị trí" aria-hidden="true">⠿</span>`
      : f === 'icon' ? `<span class="ticon">${iconSvg(o.icon)}</span>`
      : f === 'spine' ? `<span class="spine" title="Màu gáy trên kệ" style="background:${/^#[0-9a-f]{3,8}$/i.test(o.color || '') ? o.color : SPINE2[[...String(o.slug || o.title)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % SPINE2.length]}"></span>`
      : f === 'ytthumb' ? (ytId(o[k]) ? `<img class="thumb" src="https://i.ytimg.com/vi/${ytId(o[k])}/mqdefault.jpg" alt="" loading="lazy">` : '<span class="thumb none"></span>')
      : f === 'eye' ? `<button type="button" class="eye-tg${o.visible ? ' on' : ''}" data-vis="${o.id}" aria-pressed="${!!o.visible}" title="${o.visible ? 'Đang hiện trên web – bấm để ẩn' : 'Đang ẩn – bấm để hiện'}">${o.visible ? '👁 Đang hiện' : '🚫 Đang ẩn'}</button>`
      : f === 'rowact' ? `<span class="rowact"><button type="button" class="ic" data-edit="${o.id}" title="Sửa">✎</button>${E.publicPath && o.slug ? `<a class="ic" href="${esc(SITE_BASE() + E.publicPath(o))}" target="_blank" rel="noopener" title="Xem trên web">↗</a>` : ''}<button type="button" class="ic del" data-del="${o.id}" title="Xoá">🗑</button></span>`
      : f === 'postact' ? (o.status === 'published' ? `<button type="button" class="star-tg" data-pact="hidden" data-pid="${o.id}">Ẩn</button>`
        : o.status === 'hidden' ? `<button type="button" class="star-tg" data-pact="published" data-pid="${o.id}">Hiện lại</button>`
        : o.status === 'review' ? `<button type="button" class="star-tg pin-tg on" data-pact="published" data-pid="${o.id}">✓ Duyệt & đăng</button>` : '<span class="note">Bản nháp</span>')
      : f === 'pin' ? `<button type="button" class="star-tg pin-tg${o[k] ? ' on' : ''}" data-pin="${o.id}" aria-pressed="${!!o[k]}" title="${o[k] ? 'Đang hiện trên Bảng ghim – bấm để gỡ' : (o.board_title ? 'Bấm để ghim lên Bảng ghim' : 'Mở để đặt Tên đề xuất trước khi ghim')}">${o[k] ? '📌 Đang ghim' : '+ Ghim'}</button>`
      : f === 'announce' ? (o.status !== 'ok' ? '<span class="note" title="Chỉ báo được khi công cụ ở trạng thái Dùng được">—</span>'
        : o.announce_at > 0 && o.announced_at >= o.announce_at ? `<button type="button" class="star-tg on" data-ann="${o.id}" data-state="sent" title="Đã gửi ${esc(dt(o.announced_at))}. Bấm 2 lần để gửi lại">✓ Đã báo ${esc(dt(o.announced_at).slice(0, 5))}</button>`
        : o.announce_at > 0 ? `<button type="button" class="star-tg pin-tg on" data-ann="${o.id}" data-state="queued" title="Sẽ gửi vào 10h sáng kế tiếp. Bấm để hủy hẹn">⏳ Gửi 10h sáng · hủy</button>`
        : `<button type="button" class="star-tg" data-ann="${o.id}" data-state="idle" title="Gửi thông báo công cụ mới tới người đăng ký vào 10h sáng kế tiếp">📣 Thông báo</button>`)
      : f === 'star' ? `<button type="button" class="star-tg${o[k] ? ' on' : ''}" data-star="${o.id}" aria-pressed="${!!o[k]}" title="${o[k] ? 'Đang ở Tiện ích nổi bật – bấm để bỏ' : 'Bấm để đưa vào Tiện ích nổi bật'}">${o[k] ? '★ Nổi bật' : '☆ Nổi bật'}</button>`
      : f === 'pill' ? pillOf(ent, o[k]) : f === 'num' ? `<span class="num">${esc(o[k])}</span>` : f === 'clip' ? `<span class="clip">${esc(o[k])}</span>` : typeof f === 'function' ? esc(f(o)) : esc(o[k]);
    const sel = (id, label, cur, opt) => `<select id="${id}" aria-label="${label}"><option value="">${label}</option>${Object.entries(opt).map(([k, v]) => `<option value="${k}" ${cur === k ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select>`;
    const filtered = st.q || st.status || st.grp || st.vis;
    const chips = ent === 'tools' ? `<div class="chips" role="group" aria-label="Lọc nhóm">${[['', 'Tất cả nhóm'], ...Object.entries(OPT.grp)].map(([k, v]) => `<button type="button" class="chip${st.grp === k ? ' on' : ''}" data-grp="${k}">${esc(v)}</button>`).join('')}</div>` : '';
    $('#main').innerHTML = head(E.crumb || '', E.title, `<button class="btn ghost sm" id="export">Tải Excel (CSV)</button>${E.noAdd ? '' : `<button class="btn amber sm" id="add">+ Thêm ${E.one}</button>`}`, `${d.total} ${E.one}${filtered ? ' khớp bộ lọc' : ''}`)
      + `${chips}<div class="tools"><input type="search" id="q" placeholder="Tìm ${E.one}…" value="${esc(st.q)}" aria-label="Tìm">
        ${Object.keys(E.statusOpt || {}).length ? sel('st', 'Tất cả trạng thái', st.status, E.statusOpt) : ''}
        ${ENT[ent].form.some(f => f[0] === 'visible') && ent !== 'topics' ? sel('vis', 'Hiện & ẩn', st.vis, { 1: 'Đang hiện trên web', 0: 'Đang ẩn' }) : ''}
        ${filtered ? '<button type="button" class="btn ghost sm" id="clr">Bỏ lọc</button>' : ''}
        ${canDrag ? `<span class="note drag-h">⠿ Kéo thả dòng để đổi thứ tự hiển thị trên web</span>` : ''}</div>
      ${d.items.length ? `<div class="tbl-wrap"><table class="${canDrag ? 'dragtbl' : ''}"><thead><tr>${E.cols.map(c => `<th>${c[1]}</th>`).join('')}</tr></thead>
        <tbody>${d.items.map(o => `<tr class="row${o.visible === 0 ? ' dim' : ''}" data-id="${o.id}" tabindex="0"${canDrag ? ' draggable="true"' : ''}>${E.cols.map(c => `<td>${cell(o, c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
        : `<div class="card panel empty"><p class="note">Chưa có ${E.one} nào${filtered ? ' khớp bộ lọc' : ''}.</p></div>`}`;
    const re = () => list(ent);
    let h; $('#q').oninput = e => { clearTimeout(h); h = setTimeout(() => { st.q = e.target.value; re().then(() => { const q = $('#q'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }); }, 300); };
    if ($('#st')) $('#st').onchange = e => { st.status = e.target.value; re(); };
    if ($('#vis')) $('#vis').onchange = e => { st.vis = e.target.value; re(); };
    if ($('#clr')) $('#clr').onclick = () => { Object.assign(st, { q: '', status: '', grp: '', vis: '' }); re(); };
    document.querySelectorAll('[data-grp]').forEach(b => b.onclick = () => { st.grp = b.dataset.grp; re(); });
    if ($('#add')) $('#add').onclick = () => edit(ent, null);
    $('#export').onclick = () => download(`export/${path}.csv`, `${path}.csv`);
    if (TOOL_PAGES.includes(ent)) $('#main').insertAdjacentHTML('afterbegin', toolTabs(ent));
    if (ROOMKEY[ent]) {
      await loadSettings(); document.querySelector('#main .bar').insertAdjacentHTML('afterend', roomBar(ent));
      document.querySelectorAll('[data-vsw]').forEach(b => b.onclick = async () => {
        const k = b.dataset.vsw, on = !b.classList.contains('on'); b.disabled = true; b.classList.toggle('on', on); b.classList.add('busy');
        try { await api('settings', { method: 'POST', body: JSON.stringify({ [k]: on ? '1' : '0' }) }); SETTINGS = null; await loadSettings(); toast(on ? 'Đã bật hiển thị trên web.' : 'Đã ẩn khỏi web.'); list(ent); }
        catch (err) { toast(err.message, true); b.disabled = false; }
      });
    }
    if (ent === 'legal') { legalPanel(); if (!st.q && (st.status === 'pending' || !st.status)) legalProposals(d.items.filter(x => x.status === 'pending')); }
    const put = (id, body) => api(`${path}/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    const guard = fn => async e => { e.stopPropagation(); const b = e.currentTarget; if (b.disabled) return; b.disabled = true; try { await fn(b); } catch (err) { toast(err.message, true); } finally { b.disabled = false; } };
    /* 📣 Thông báo công cụ mới tới người đăng ký (gửi 10h sáng kế tiếp) */
    document.querySelectorAll('[data-ann]').forEach(b => b.onclick = guard(async b => {
      const stt = b.dataset.state;
      if (stt === 'sent' && b.dataset.confirm !== '1') { b.dataset.confirm = '1'; b.textContent = 'Gửi lại?'; setTimeout(() => { b.dataset.confirm = ''; re(); }, 3500); return; }
      await api('tool-announce', { method: 'POST', body: JSON.stringify({ id: +b.dataset.ann, on: stt !== 'queued' }) });
      toast(stt === 'queued' ? 'Đã hủy hẹn thông báo.' : 'Đã hẹn gửi thông báo công cụ này vào 10h sáng kế tiếp.'); re();
    }));
    /* ★ Nổi bật */
    document.querySelectorAll('[data-star]').forEach(b => b.onclick = guard(async b => {
      const on = !b.classList.contains('on'); await put(b.dataset.star, { featured: on });
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); b.textContent = on ? '★ Nổi bật' : '☆ Nổi bật';
      toast(on ? 'Đã đưa vào Tiện ích nổi bật.' : 'Đã bỏ khỏi Tiện ích nổi bật.');
    }));
    /* 👁 Hiện / ẩn trên web */
    document.querySelectorAll('[data-vis]').forEach(b => b.onclick = guard(async b => {
      const on = !b.classList.contains('on'); await put(b.dataset.vis, { visible: on ? 1 : 0 });
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); b.textContent = on ? '👁 Đang hiện' : '🚫 Đang ẩn'; b.closest('tr').classList.toggle('dim', !on);
      toast(on ? 'Đã hiện trên web.' : 'Đã ẩn khỏi web.');
    }));
    /* ✎ Sửa · 🗑 Xoá (bấm 2 lần để xác nhận) */
    document.querySelectorAll('[data-edit]').forEach(b => b.onclick = e => { e.stopPropagation(); edit(ent, +b.dataset.edit); });
    document.querySelectorAll('[data-del]').forEach(b => b.onclick = guard(async b => {
      if (b.dataset.confirm !== '1') { b.dataset.confirm = '1'; b.classList.add('arm'); b.textContent = 'Xoá?'; b.title = 'Bấm lần nữa để xoá vĩnh viễn'; setTimeout(() => { b.dataset.confirm = ''; b.classList.remove('arm'); b.textContent = '🗑'; }, 3500); return; }
      await api(`${path}/${b.dataset.del}`, { method: 'DELETE' }); toast('Đã xoá.'); re();
    }));
    /* Bài viết: Duyệt & đăng / Ẩn / Hiện lại */
    document.querySelectorAll('[data-pact]').forEach(b => b.onclick = guard(async b => { await put(b.dataset.pid, { status: b.dataset.pact }); toast(b.dataset.pact === 'published' ? 'Đã đăng bài.' : 'Đã ẩn bài.'); re(); }));
    /* 📌 Ghim / gỡ khỏi Bảng ghim */
    document.querySelectorAll('[data-pin]').forEach(b => b.onclick = guard(async b => {
      const on = !b.classList.contains('on'), row = d.items.find(x => x.id === +b.dataset.pin);
      if (on && !(row && row.board_title)) { toast('Mở đề xuất này, nhập "Tên công cụ đề xuất" rồi mới ghim lên bảng.', true); return; }
      await put(b.dataset.pin, { on_board: on });
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); b.textContent = on ? '📌 Đang ghim' : '+ Ghim';
      toast(on ? 'Đã ghim lên Bảng ghim.' : 'Đã gỡ khỏi Bảng ghim.');
    }));
    document.querySelectorAll('tr.row').forEach(tr => { const open = () => edit(ent, +tr.dataset.id); tr.onclick = e => { if (!e.target.closest('button,a')) open(); }; tr.onkeydown = e => { if (e.key === 'Enter' && e.target === tr) open(); }; });
    if (canDrag) dragRows(ent, path);
  }
  /* Kéo thả đổi thứ tự. Khi đang lọc: chỉ hoán vị các mục đang hiện, giữ nguyên vị trí của các mục khác */
  function dragRows(ent, path) {
    const tb = document.querySelector('.dragtbl tbody'); if (!tb) return;
    let drag = null;
    tb.addEventListener('dragstart', e => { drag = e.target.closest('tr'); if (!drag) return; drag.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', drag.dataset.id); } catch (er) { } });
    tb.addEventListener('dragover', e => {
      if (!drag) return; e.preventDefault();
      const tr = e.target.closest('tr'); if (!tr || tr === drag) return;
      const r = tr.getBoundingClientRect(); tb.insertBefore(drag, e.clientY > r.top + r.height / 2 ? tr.nextSibling : tr);
    });
    tb.addEventListener('drop', e => e.preventDefault());
    tb.addEventListener('dragend', async () => {
      if (!drag) return; drag.classList.remove('dragging'); drag = null;
      const shown = [...tb.querySelectorAll('tr')].map(tr => +tr.dataset.id);
      try {
        const all = (await api(`${path}?q=`)).items.map(x => x.id), set = new Set(shown);
        let i = 0; const ids = all.map(id => set.has(id) ? shown[i++] : id);
        await api('reorder/' + path, { method: 'POST', body: JSON.stringify({ ids }) });
        toast('Đã lưu thứ tự mới.');
      } catch (err) { toast(err.message, true); list(ent); }
    });
  }

  /* ---------- v1.15i Phòng chiếu: kênh = danh sách phát. Trái: kênh (thêm / đổi tên / ẩn / xoá / kéo thả); phải: video của kênh ---------- */
  let pcSel = null;   /* tên kênh đang chọn ('' = chưa xếp kênh) */
  async function videosPage() {
    const [cd, vd] = await Promise.all([api('channels'), api('reflections?kind=video'), loadSettings()]);
    const chs = cd.items || [], vids = vd.items || [], names = new Set(chs.map(c => c.name));
    const inCh = n => vids.filter(v => n === '' ? !v.channel || !names.has(v.channel) : v.channel === n);
    const loose = inCh('');
    if (pcSel === null || (pcSel !== '' && !names.has(pcSel)) || (pcSel === '' && !loose.length)) pcSel = chs[0] ? chs[0].name : '';
    const list = inCh(pcSel), cur = chs.find(c => c.name === pcSel);
    const thumb = u => ytId(u) ? `<img src="https://i.ytimg.com/vi/${ytId(u)}/mqdefault.jpg" alt="" loading="lazy">` : '';
    const chOpts = sel => `<option value="">— Chưa xếp kênh —</option>${chs.map(c => `<option value="${esc(c.name)}" ${c.name === sel ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}`;
    $('#main').innerHTML = head('Góc ngẫm', 'Phòng chiếu', `<button class="btn ghost sm" id="export">Tải Excel (CSV)</button>`, `${chs.length} kênh · ${vids.length} video. Mỗi kênh là một danh sách phát – khách chọn kênh rồi xem lần lượt các video.`)
      + roomBar('videos') + `<div class="pc">
      <section class="card pc-chs"><div class="pc-h"><b>Kênh (danh sách phát)</b><button class="btn amber sm" id="chAdd">+ Thêm kênh</button></div>
        <form class="pc-new" id="chNew" hidden><input id="chName" placeholder="Tên kênh, VD: Thử thách A-Z · Lê Na" maxlength="80" required><button class="btn amber sm" type="submit">Lưu</button><button class="btn ghost sm" type="button" id="chCancel">Huỷ</button></form>
        <ul class="pc-chl" id="chList">${chs.map(c => `<li class="pc-ch${c.name === pcSel ? ' on' : ''}${c.visible ? '' : ' dim'}" data-chid="${c.id}" data-chname="${esc(c.name)}" draggable="true">
            <span class="grip" title="Kéo để đổi thứ tự kênh">⠿</span>
            <button type="button" class="pc-chn" data-pick="${esc(c.name)}"><b>${esc(c.name)}</b><small>${inCh(c.name).length} video${c.visible ? '' : ' · đang ẩn'}</small></button>
            <span class="pc-cha"><button type="button" class="ic" data-chvis="${c.id}" title="${c.visible ? 'Đang hiện – bấm để ẩn kênh' : 'Đang ẩn – bấm để hiện kênh'}">${c.visible ? '👁' : '🚫'}</button><button type="button" class="ic" data-chren="${c.id}" title="Đổi tên kênh">✎</button><button type="button" class="ic del" data-chdel="${c.id}" title="Xoá kênh (video không bị xoá)">🗑</button></span></li>`).join('')}
          ${loose.length ? `<li class="pc-ch loose${pcSel === '' ? ' on' : ''}"><span class="grip" style="visibility:hidden">⠿</span><button type="button" class="pc-chn" data-pick=""><b>Chưa xếp kênh</b><small>${loose.length} video – hiện ở cuối, tên "Kênh chung"</small></button></li>` : ''}
          ${chs.length || loose.length ? '' : '<li class="note" style="padding:10px">Chưa có kênh nào. Bấm "+ Thêm kênh" để tạo danh sách phát đầu tiên.</li>'}</ul>
        <p class="note pc-tip">⠿ Kéo thả kênh để đổi thứ tự trên web. Đổi tên kênh thì các video trong kênh tự đi theo.</p></section>
      <section class="card pc-vids"><div class="pc-h"><div><b>${pcSel === '' ? 'Chưa xếp kênh' : esc(pcSel)}</b><small>${list.length} video${cur && !cur.visible ? ' · kênh đang ẩn trên web' : ''}</small></div>
          ${chs.length || pcSel === '' ? `<button class="btn amber sm" id="vAdd">+ Thêm video${pcSel ? ' vào kênh này' : ''}</button>` : ''}</div>
        ${list.length ? `<ol class="pc-vl" id="vList">${list.map((v, i) => `<li class="pc-v${v.visible ? '' : ' dim'}" data-vid="${v.id}" draggable="true">
            <span class="grip" title="Kéo để đổi thứ tự trong kênh">⠿</span><span class="pc-no">${i + 1}</span>
            <span class="pc-th">${thumb(v.youtube_url)}${v.duration ? `<em>${esc(v.duration)}</em>` : ''}</span>
            <span class="pc-vt"><b>${esc(v.title)}</b><small>${esc(v.author || '–')} ${v.duration ? '· ⏱ ' + esc(v.duration) : '· <i>chưa nhập thời lượng</i>'}</small>
              <label class="pc-mv">Kênh: <select data-move="${v.id}">${chOpts(names.has(v.channel) ? v.channel : '')}</select></label></span>
            <span class="pc-va">${pillOf('videos', v.status)}<button type="button" class="eye-tg${v.visible ? ' on' : ''}" data-vvis="${v.id}">${v.visible ? '👁 Hiện' : '🚫 Ẩn'}</button>
              <button type="button" class="ic" data-vedit="${v.id}" title="Sửa video">✎</button><button type="button" class="ic del" data-vdel="${v.id}" title="Xoá video">🗑</button></span></li>`).join('')}</ol>
          <p class="note pc-tip">⠿ Kéo thả video để đổi thứ tự phát trong kênh. Đổi kênh nhanh bằng ô "Kênh" ở mỗi dòng.</p>`
          : `<div class="empty"><p class="note">${chs.length ? 'Kênh này chưa có video. Bấm "+ Thêm video vào kênh này".' : 'Tạo một kênh trước, rồi thêm video vào kênh.'}</p></div>`}</section></div>`;
    const re = () => videosPage().catch(e => toast(e.message, true));
    const M = $('#main'), put = (p, b) => api(p, { method: 'PUT', body: JSON.stringify(b) });
    $('#export').onclick = () => download('export/reflections.csv', 'reflections.csv');
    bindRoom('videos');
    $('#chAdd').onclick = () => { $('#chNew').hidden = false; $('#chName').focus(); };
    $('#chCancel').onclick = () => { $('#chNew').hidden = true; };
    $('#chNew').onsubmit = async e => { e.preventDefault(); const name = $('#chName').value.trim(); if (!name) return;
      try { await api('channels', { method: 'POST', body: JSON.stringify({ name, sort: (chs.length + 1) * 10, visible: 1 }) }); pcSel = name; toast('Đã thêm kênh.'); re(); } catch (err) { toast(err.message, true); } };
    M.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => { pcSel = b.dataset.pick; re(); });
    M.querySelectorAll('[data-chvis]').forEach(b => b.onclick = async () => { const c = chs.find(x => x.id === +b.dataset.chvis);
      try { await put('channels/' + c.id, { visible: c.visible ? 0 : 1 }); toast(c.visible ? 'Đã ẩn kênh khỏi web.' : 'Đã hiện kênh trên web.'); re(); } catch (err) { toast(err.message, true); } });
    M.querySelectorAll('[data-chren]').forEach(b => b.onclick = () => {
      const li = b.closest('li'), c = chs.find(x => x.id === +b.dataset.chren), box = li.querySelector('.pc-chn');
      box.outerHTML = `<form class="pc-ren"><input value="${esc(c.name)}" maxlength="80" required><button class="btn amber sm" type="submit">Lưu</button></form>`;
      const f = li.querySelector('.pc-ren'), inp = f.querySelector('input'); inp.focus(); inp.select();
      inp.onkeydown = e => { if (e.key === 'Escape') re(); };
      f.onsubmit = async e => { e.preventDefault(); const name = inp.value.trim(); if (!name || name === c.name) return re();
        try { await put('channels/' + c.id, { name }); if (pcSel === c.name) pcSel = name; toast('Đã đổi tên kênh – các video đã đi theo.'); re(); } catch (err) { toast(err.message, true); } };
    });
    M.querySelectorAll('[data-chdel]').forEach(b => b.onclick = async () => {
      if (b.dataset.confirm !== '1') { b.dataset.confirm = '1'; b.classList.add('arm'); b.textContent = 'Xoá?'; b.title = 'Bấm lần nữa để xoá kênh – video trong kênh chuyển về "Chưa xếp kênh"'; setTimeout(() => { b.dataset.confirm = ''; b.classList.remove('arm'); b.textContent = '🗑'; }, 3500); return; }
      try { await api('channels/' + b.dataset.chdel, { method: 'DELETE' }); toast('Đã xoá kênh. Video trong kênh chuyển về "Chưa xếp kênh".'); pcSel = null; re(); } catch (err) { toast(err.message, true); }
    });
    if ($('#vAdd')) $('#vAdd').onclick = () => { const f = ENT.videos.form.find(x => x[0] === 'channel'); f[3] = { ...f[3], def: pcSel }; edit('videos', null); };
    M.querySelectorAll('[data-vedit]').forEach(b => b.onclick = () => edit('videos', +b.dataset.vedit));
    M.querySelectorAll('[data-move]').forEach(s => s.onchange = async () => {
      try { await put('reflections/' + s.dataset.move, { channel: s.value }); toast(s.value ? 'Đã chuyển sang kênh "' + s.value + '".' : 'Đã chuyển về "Chưa xếp kênh".'); re(); } catch (err) { toast(err.message, true); } });
    M.querySelectorAll('[data-vvis]').forEach(b => b.onclick = async () => { const v = vids.find(x => x.id === +b.dataset.vvis);
      try { await put('reflections/' + v.id, { visible: v.visible ? 0 : 1 }); re(); } catch (err) { toast(err.message, true); } });
    M.querySelectorAll('[data-vdel]').forEach(b => b.onclick = async () => {
      if (b.dataset.confirm !== '1') { b.dataset.confirm = '1'; b.classList.add('arm'); b.textContent = 'Xoá?'; setTimeout(() => { b.dataset.confirm = ''; b.classList.remove('arm'); b.textContent = '🗑'; }, 3500); return; }
      try { await api('reflections/' + b.dataset.vdel, { method: 'DELETE' }); toast('Đã xoá video.'); re(); } catch (err) { toast(err.message, true); }
    });
    /* kéo thả: kênh → reorder/channels; video → hoán vị thứ tự trong toàn bảng (giữ nguyên vị trí các mục khác) */
    const dnd = (ul, sel, onDone) => { if (!ul) return; let drag = null;
      ul.addEventListener('dragstart', e => { drag = e.target.closest(sel); if (drag) { drag.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', '1'); } catch (er) { } } });
      ul.addEventListener('dragover', e => { if (!drag) return; e.preventDefault(); const t = e.target.closest(sel); if (!t || t === drag) return; const r = t.getBoundingClientRect(); ul.insertBefore(drag, e.clientY > r.top + r.height / 2 ? t.nextSibling : t); });
      ul.addEventListener('drop', e => e.preventDefault());
      ul.addEventListener('dragend', () => { if (!drag) return; drag.classList.remove('dragging'); drag = null; onDone([...ul.querySelectorAll(sel)]); }); };
    dnd($('#chList'), 'li[data-chid]', async lis => { try { await api('reorder/channels', { method: 'POST', body: JSON.stringify({ ids: lis.map(l => +l.dataset.chid) }) }); toast('Đã lưu thứ tự kênh.'); } catch (err) { toast(err.message, true); re(); } });
    dnd($('#vList'), 'li[data-vid]', async lis => {
      const shown = lis.map(l => +l.dataset.vid);
      try { const all = (await api('reflections?q=')).items.map(x => x.id), set = new Set(shown); let i = 0;
        await api('reorder/reflections', { method: 'POST', body: JSON.stringify({ ids: all.map(id => set.has(id) ? shown[i++] : id) }) }); toast('Đã lưu thứ tự video.'); re(); }
      catch (err) { toast(err.message, true); re(); } });
  }
  function bindRoom(ent) {
    document.querySelectorAll('[data-vsw]').forEach(b => b.onclick = async () => {
      const k = b.dataset.vsw, on = !b.classList.contains('on'); b.disabled = true; b.classList.toggle('on', on); b.classList.add('busy');
      try { await api('settings', { method: 'POST', body: JSON.stringify({ [k]: on ? '1' : '0' }) }); SETTINGS = null; await loadSettings(); toast(on ? 'Đã bật hiển thị trên web.' : 'Đã ẩn khỏi web.'); nav(ent); }
      catch (err) { toast(err.message, true); b.disabled = false; }
    });
  }

  /* ---------- sửa / thêm ---------- */
  const slugify = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  function field([k, label, type, o = {}], v) {
    const id = 'f-' + k, req = o.req ? 'required' : '', hint = o.hint ? `<span class="hint">${esc(o.hint)}</span>` : '';
    if (type === 'head') return `<h3 class="sec full">${esc(label)}</h3>`;
    if (type === 'topics') {
      const cur = String(v || '').split(',').map(x => x.trim()).filter(Boolean);
      return `<div class="full"><label>${esc(label)}</label><div class="topicpick" id="${id}">${TOPICS.length ? TOPICS.map(t => `<label class="tp tp-${esc(t.color)}"><input type="checkbox" value="${esc(t.slug)}" ${cur.includes(t.slug) ? 'checked' : ''}> ${esc(t.name)}</label>`).join('') : '<span class="hint">Chưa có chủ đề – thêm ở mục Blog · Chủ đề</span>'}</div></div>`;
    }
    if (type === 'image') return imageBox(id, label, v, o.hint || 'Ảnh tự thu nhỏ về tối đa 1600px trước khi tải lên');
    if (type === 'seopv') return `<div class="full"><label>${esc(label)}</label><div class="seopv" id="seopv"></div></div>`;
    if (type === 'info') return v === '' || v == null ? '' : `<div class="full"><span class="hint">${esc(label)}</span><div class="note" style="margin-top:2px">${esc(o.map ? (o.map[v] || v) : v)}</div></div>`;
    if (type === 'aibtn') return `<div class="full" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><button type="button" class="btn amber sm" id="upDoc">📎 Tải file Word lên (.docx)</button><button type="button" class="btn ghost sm" id="aiRead">AI đọc lại phần đã dán</button><span class="hint">AI điền sẵn tiêu đề, tóm tắt, điểm cập nhật, hiệu lực… Anh xem lại rồi bấm Duyệt. Chưa lưu cho tới khi anh bấm.</span></div>`;
    if (type === 'infolink') return v ? `<div class="full"><span class="hint">${esc(label)}</span><div style="margin-top:2px"><a href="${esc(v)}" target="_blank" rel="noopener">${esc(v)} ↗</a></div></div>` : '';
    const cls = o.full || type === 'long' || type === 'links' ? 'full' : '';
    if (type === 'bool') return `<label class="check ${cls}"><input type="checkbox" id="${id}" ${v ? 'checked' : ''}> ${esc(label)}</label>`;
    if (type === 'select') {
      const sel = `<select id="${id}">${Object.entries(o.opt).map(([a, b]) => `<option value="${a}" ${v === a ? 'selected' : ''}>${esc(b)}</option>`).join('')}</select>`;
      return `<label class="${cls}" for="${id}">${esc(label)}${o.preview ? `<span class="iconpick"><span class="ipv" data-ipv="${id}">${iconSvg(v)}</span>${sel}</span>` : sel}${hint}</label>`;
    }
    if (type === 'long') return `<label class="${cls}" for="${id}">${esc(label)}<textarea id="${id}" class="${o.big ? 'big' : ''}" ${req}>${esc(v)}</textarea>${hint}</label>`;
    if (type === 'links') {
      const arr = (() => { try { return JSON.parse(v || '[]'); } catch (e) { return []; } })();
      return `<div class="${cls}"><label>${esc(label)}</label>${hint}<div class="vlist" id="${id}" style="margin-top:6px">${arr.map(x => linkRow(x)).join('')}</div><button type="button" class="btn ghost sm" data-addlink="${id}" style="margin-top:8px">+ Thêm video</button></div>`;
    }
    const t = type === 'number' ? 'number' : type === 'date' ? 'date' : 'text';
    return `<label class="${cls}" for="${id}">${esc(label)}<input id="${id}" type="${t}" value="${esc(v)}" ${req} ${type === 'slug' ? 'pattern="[a-z0-9]+(-[a-z0-9]+)*"' : ''}>${hint}</label>`;
  }
  const linkRow = (x = {}) => `<div class="vrow"><input placeholder="Tên (VD: Tính năng gộp file)" value="${esc(x.label)}" data-l="label"><input placeholder="Link YouTube / TikTok" value="${esc(x.url)}" data-l="url"><button type="button" class="btn danger sm" data-dellink>Xoá</button></div>`;

  /* ---------- v1.9 Blog: chủ đề, ảnh, xem trước SEO ---------- */
  let TOPICS = [];
  async function loadTopics() { try { TOPICS = (await api('topics')).items || []; } catch (e) { TOPICS = []; } return TOPICS; }
  const SITE_BASE = () => ((SETTINGS && SETTINGS.settings && SETTINGS.settings.site_url) || 'https://quantritute.com').replace(/\/+$/, '');
  /* Thu nhỏ ảnh trên trình duyệt: tối đa 1600px, JPEG ~82% (ảnh gốc không gửi lên máy chủ) */
  function shrinkImage(file, maxW = 1600) {
    return new Promise((ok, bad) => {
      if (file.size > 25 * 1024 * 1024) return bad(new Error('Ảnh lớn hơn 25MB.'));
      const url = URL.createObjectURL(file), im = new Image();
      im.onload = () => {
        const k = Math.min(1, maxW / im.naturalWidth), c = document.createElement('canvas');
        c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
        const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        let q = .84, d = c.toDataURL('image/jpeg', q);
        while (d.length > 1300000 && q > .5) { q -= .1; d = c.toDataURL('image/jpeg', q); }
        ok(d);
      };
      im.onerror = () => { URL.revokeObjectURL(url); bad(new Error('Không đọc được ảnh này.')); };
      im.src = url;
    });
  }
  function seoPreview() {
    const g = k => (document.getElementById('f-' + k) || {}).value || '';
    const plain = s => s.replace(/[#>*_`]/g, '').replace(/\s+/g, ' ').trim();
    const title = g('seo_title') || g('title'), desc = g('seo_desc') || g('excerpt') || plain(g('body')).slice(0, 160);
    const ogT = g('og_title') || g('title'), ogD = g('og_desc') || desc, img = g('og_image') || g('cover_url');
    const cnt = (s, a, b) => `<span class="cnt ${s.length > b ? 'bad' : s.length >= a ? 'ok' : ''}">${s.length} ký tự</span>`;
    $('#seopv').innerHTML = `<div class="spv-g"><p class="mono">Google</p><p class="spv-url">${esc(SITE_BASE().replace(/^https?:\/\//, ''))} › blog › ${esc(g('slug'))}</p>
      <p class="spv-t">${esc(title.slice(0, 70))}${title.length > 70 ? '…' : ''}</p><p class="spv-d">${esc(desc.slice(0, 165))}${desc.length > 165 ? '…' : ''}</p>
      <p class="spv-n">Tiêu đề ${cnt(title, 30, 60)} · Mô tả ${cnt(desc, 110, 160)}</p></div>
      <div class="spv-f"><p class="mono">Facebook / Zalo</p><div class="spv-card">${img ? `<img src="${esc(/^https?:/i.test(img) ? img : SITE_BASE() + img)}" alt="">` : '<div class="spv-noimg">Chưa có ảnh</div>'}
      <div><p class="spv-url">${esc(SITE_BASE().replace(/^https?:\/\//, '').toUpperCase())}</p><p class="spv-t2">${esc(ogT)}</p><p class="spv-d2">${esc(ogD.slice(0, 110))}</p></div></div></div>`;
  }

  async function edit(ent, id) {
    if (ent === 'videos') { const f = ENT.videos.form.find(x => x[0] === 'channel'), chs = (await api('channels')).items || [];
      f[3] = { ...f[3], opt: { '': '— Chưa xếp kênh —', ...Object.fromEntries(chs.map(c => [c.name, c.name])) } }; if (id) delete f[3].def; }
    const E = ENT[ent], path = E.api || ent;
    const item = id ? (await api(`${path}/${id}`)).item : {};
    if (ent === 'posts') await loadTopics();
    const val = f => id ? item[f[0]] : (f[3]?.def ?? (f[2] === 'select' ? Object.keys(f[3].opt)[0] : ''));
    const siteUrl = (await loadSettings()).settings.site_url;
    const pub = id && E.publicPath && (siteUrl || ent === 'posts') ? SITE_BASE() + E.publicPath(item) : '';
    $('#main').innerHTML = `<div class="bar"><div><p class="mono">${E.crumb ? esc(E.crumb) + ' · ' : ''}<a href="#${ent}" id="back">← ${E.title}</a></p><h1>${id ? 'Sửa ' + E.one : 'Thêm ' + E.one}</h1>
        ${id ? `<p class="note">Tạo ${dt(item.created_at)} · Sửa ${dt(item.updated_at)}</p>` : ''}</div>
        ${pub ? `<a class="btn ghost sm" href="${esc(pub)}" target="_blank" rel="noopener">${ent === 'posts' && item.status !== 'published' ? 'Xem trước bài trên web ↗' : 'Xem trên web ↗'}</a>` : ''}</div>
      <form class="card panel" id="ef"><div class="form">${E.form.map(f => field(f, val(f))).join('')}</div>
        <div class="actions"><button class="btn amber" type="submit">Lưu</button><button class="btn ghost" type="button" id="cancel">Huỷ</button>
        ${ent === 'posts' && item.status !== 'published' ? `<button class="btn amber" type="button" data-setstatus="published">✓ Duyệt & đăng</button>` : ''}
        ${ent === 'legal' ? `<button class="btn amber" type="button" data-setstatus="approved">Duyệt & hiện trên cẩm nang</button><button class="btn ghost" type="button" data-setstatus="rejected">Loại</button>` : ''}
        ${id ? `<span style="flex:1"></span><button class="btn danger" type="button" id="del">Xoá ${E.one}</button>` : ''}<p class="err" id="ferr"></p></div></form>`;
    $('#back').onclick = e => { e.preventDefault(); nav(ent); };
    $('#cancel').onclick = () => nav(ent);
    const slugF = E.form.find(f => f[2] === 'slug');
    if (slugF && !id) { const src = $('#f-' + slugF[3].from), dst = $('#f-' + slugF[0]); let touched = false; dst.oninput = () => { touched = true; }; src.addEventListener('input', () => { if (!touched) dst.value = slugify(src.value); }); }
    $('#ef').addEventListener('change', e => { const pv = document.querySelector(`[data-ipv="${e.target.id}"]`); if (pv) pv.innerHTML = iconSvg(e.target.value); });
    /* Ảnh: cập nhật ô xem trước khi đổi link; SEO: xem trước Google / Facebook */
    $('#ef').addEventListener('input', e => {
      if ($('#seopv')) seoPreview();
    });
    if ($('#seopv')) seoPreview();
    $('#ef').onclick = e => {
      const add = e.target.closest('[data-addlink]'); if (add) { document.getElementById(add.dataset.addlink).insertAdjacentHTML('beforeend', linkRow()); return; }
      const del = e.target.closest('[data-dellink]'); if (del) del.closest('.vrow').remove();
      if (e.target.id === 'upDoc') {
        const b = e.target;
        pickFile().then(async f => {
          if (!f) return;
          b.disabled = true; b.textContent = 'Đang đọc file…';
          try { $('#f-full_text').value = await fileText(f); b.disabled = false; b.textContent = '📎 Tải file Word lên (.docx)'; $('#aiRead').click(); }
          catch (err) { toast(err.message, true); b.disabled = false; b.textContent = '📎 Tải file Word lên (.docx)'; }
        });
        return;
      }
      if (e.target.id === 'aiRead') {
        const b = e.target; b.disabled = true; b.textContent = 'AI đang đọc toàn văn… (20–60 giây)';
        api('legal-ai/' + id, { method: 'POST', body: JSON.stringify({ full_text: $('#f-full_text').value }) }).then(r => {
          for (const [k, v] of Object.entries(r.suggestion || {})) { const el = document.getElementById('f-' + k); if (el && v) el.value = v; }
          toast('AI đã điền nội dung. Anh xem lại rồi bấm "Duyệt & hiện trên cẩm nang".');
        }).catch(err => toast(err.message, true)).finally(() => { b.disabled = false; b.textContent = 'AI đọc lại phần đã dán'; });
        return;
      }
      const ss = e.target.closest('[data-setstatus]'); if (ss) { $('#f-status').value = ss.dataset.setstatus; $('#ef').requestSubmit(); }
    };
    if (id) $('#del').onclick = async () => {
      const b = $('#del');
      if (b.dataset.confirm !== '1') { b.dataset.confirm = '1'; b.textContent = 'Bấm lần nữa để xoá vĩnh viễn'; setTimeout(() => { b.dataset.confirm = ''; b.textContent = 'Xoá ' + E.one; }, 4000); return; }
      try { await api(`${path}/${id}`, { method: 'DELETE' }); toast('Đã xoá.'); nav(ent); } catch (err) { toast(err.message, true); }
    };
    $('#ef').onsubmit = async e => {
      e.preventDefault();
      const body = {};
      for (const [k, , type] of E.form) {
        if (type === 'head' || type === 'info' || type === 'infolink' || type === 'aibtn' || type === 'seopv') continue;
        const el = document.getElementById('f-' + k);
        if (type === 'bool') body[k] = el.checked ? 1 : 0;
        else if (type === 'links') body[k] = [...el.querySelectorAll('.vrow')].map(r => ({ label: r.querySelector('[data-l=label]').value, url: r.querySelector('[data-l=url]').value }));
        else if (type === 'number') body[k] = el.value === '' ? 0 : +el.value;
        else if (type === 'topics') body[k] = [...el.querySelectorAll('input:checked')].map(x => x.value).join(',');
        else if (type === 'seopv') continue;
        else body[k] = el.value;
      }
      const btn = e.submitter || $('#ef button[type=submit]'); btn.disabled = true; $('#ferr').textContent = '';
      try {
        Object.assign(body, E.fixed || {});
        if (id) await api(`${path}/${id}`, { method: 'PUT', body: JSON.stringify(body) });
        else await api(path, { method: 'POST', body: JSON.stringify(body) });
        toast('Đã lưu.'); nav(ent);
      } catch (err) { $('#ferr').textContent = err.message; btn.disabled = false; }
    };
  }

  /* ---------- đọc chữ từ file Word (.docx) ngay trên trình duyệt – file không gửi lên máy chủ, chỉ gửi phần chữ ---------- */
  async function fileText(file) {
    const name = (file.name || '').toLowerCase();
    if (file.size > 15 * 1024 * 1024) throw new Error('File lớn hơn 15MB.');
    if (name.endsWith('.txt')) return file.text();
    if (name.endsWith('.doc')) throw new Error('File .doc (Word cũ) chưa đọc được. Anh mở bằng Word → Lưu thành (Save As) .docx rồi tải lại.');
    if (name.endsWith('.pdf')) throw new Error('Chưa đọc được PDF. Anh tải bản Word (.docx) trên Thư viện pháp luật rồi tải lên.');
    if (!name.endsWith('.docx')) throw new Error('Chỉ nhận file Word .docx (hoặc .txt).');
    const buf = new Uint8Array(await file.arrayBuffer()), dv = new DataView(buf.buffer);
    let eocd = -1; for (let i = buf.length - 22; i >= Math.max(0, buf.length - 70000); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error('File Word bị lỗi hoặc không phải .docx.');
    let p = dv.getUint32(eocd + 16, true); const n = dv.getUint16(eocd + 10, true); const dec = new TextDecoder();
    for (let k = 0; k < n; k++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      const method = dv.getUint16(p + 10, true), size = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
      const fname = dec.decode(buf.subarray(p + 46, p + 46 + nl)); p += 46 + nl + xl + cl;
      if (fname !== 'word/document.xml') continue;
      const start = off + 30 + dv.getUint16(off + 26, true) + dv.getUint16(off + 28, true);
      const raw = buf.subarray(start, start + size);
      const xml = method === 0 ? dec.decode(raw) : await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).text();
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
      const out = [];
      for (const para of doc.getElementsByTagNameNS(W, 'p')) {
        let t = ''; const walk = el => { for (const c of el.children) { if (c.localName === 't') t += c.textContent; else if (c.localName === 'tab') t += '\t'; else if (c.localName === 'br') t += '\n'; else if (c.localName !== 'p') walk(c); } };
        walk(para); if (t.trim()) out.push(t.trim());
      }
      const text = out.join('\n');
      if (text.length < 200) throw new Error('File Word gần như không có chữ (có thể là ảnh scan dán vào Word).');
      return text;
    }
    throw new Error('Không tìm thấy nội dung trong file Word.');
  }
  const pickFile = (accept = '.docx,.txt') => new Promise(res => { const i = Object.assign(document.createElement('input'), { type: 'file', accept }); i.onchange = () => res(i.files[0] || null); i.click(); });
  // Tải file → AI đọc → lưu nội dung đề xuất vào văn bản (vẫn ở trạng thái Chờ duyệt)
  async function uploadAndSummarize(id, btn) {
    const f = await pickFile(); if (!f) return;
    const old = btn && btn.textContent; if (btn) { btn.disabled = true; btn.textContent = 'Đang đọc file…'; }
    try {
      const text = await fileText(f);
      if (btn) btn.textContent = 'AI đang đọc toàn văn… (20–60 giây)';
      const r = await api('legal-ai/' + id, { method: 'POST', body: JSON.stringify({ full_text: text }) });
      const body = {}; for (const [k, v] of Object.entries(r.suggestion || {})) if (v && k !== 'ai') body[k] = v;
      await api('legal/' + id, { method: 'PUT', body: JSON.stringify(body) });
      toast(`Đã đọc "${f.name}". Nội dung đề xuất đã cập nhật – anh xem lại rồi bấm Duyệt.`);
      return r.suggestion;
    } catch (err) { toast(err.message, true); }
    finally { if (btn) { btn.disabled = false; btn.textContent = old; } }
  }

  /* ---------- văn bản pháp luật mới: thẻ đề xuất + nút Duyệt / Loại ngay trên danh sách ---------- */
  function legalProposals(items) {
    const anchor = $('#lp') || document.querySelector('#main .bar'); if (!anchor || !items.length) return;
    items = [...items].sort((a, b) => (a.recommend === 'reject') - (b.recommend === 'reject') || b.score - a.score);
    const nA = items.filter(x => x.recommend !== 'reject').length, nR = items.length - nA;
    const lines = v => String(v || '').split('\n').map(x => x.trim()).filter(Boolean);
    // Cần file gốc: đề xuất duyệt nhưng chưa ai đọc toàn văn (Worker chỉ đọc trích yếu, không đọc PDF)
    const needFull = x => x.recommend !== 'reject' && !String(x.full_text || '').trim() && !/^BuBu/.test(x.ai || '');
    const nNeed = items.filter(needFull).length;
    const card = x => {
      const rej = x.recommend === 'reject';
      const nf = !rej && needFull(x);
      return `<article class="prop ${rej ? 'prop-rej' : ''}" data-pid="${x.id}">
        <div class="prop-top"><span class="prop-rec ${rej ? 'r' : 'a'}">${rej ? '❌ Đề xuất: Loại' : '✅ Đề xuất: Duyệt'}</span>
          ${x.level ? `<span class="pill">${esc(OPT.level[x.level] || x.level)}</span>` : ''}<b>${esc(x.so_hieu)}</b>
          <span class="note">Ban hành ${esc(x.ngay_ban_hanh)}${x.hieu_luc ? ' · <b>Hiệu lực ' + esc(x.hieu_luc) + '</b>' : ''}${x.topics ? ' · ' + esc(topicNames(x.topics)) : ''}</span></div>
        ${x.recommend_note ? `<p class="prop-why">${esc(x.recommend_note)}</p>` : ''}
        ${nf ? `<div class="prop-need">📄 <b>Cần file gốc:</b> nội dung hiện chỉ dựa trên trích yếu. Anh tải bản Word / PDF có chữ của <b>${esc(x.so_hieu)}</b>
          (<a href="https://www.google.com/search?q=${encodeURIComponent(x.so_hieu + ' thuvienphapluat')}" target="_blank" rel="noopener">tìm trên Thư viện pháp luật ↗</a>),
          rồi bấm <button class="btn sm amber" data-pact="upload" style="margin-left:4px">📎 Tải file Word lên</button> – AI tự đọc và soạn lại nội dung, anh chỉ cần xem rồi Duyệt.</div>` : ''}
        ${rej ? `<p class="note">${esc(x.trich_yeu)}</p>` : `<h3>${esc(x.title || x.trich_yeu)}</h3>${x.summary ? `<p>${esc(x.summary)}</p>` : ''}
          ${lines(x.key_points).length ? `<ul>${lines(x.key_points).map(k => `<li>${esc(k)}</li>`).join('')}</ul>` : '<p class="note">Chưa có điểm cập nhật chính – bấm "📎 Tải file Word" để AI đọc toàn văn.</p>'}
          ${x.action ? `<p><b>Nên làm:</b> ${esc(x.action)}</p>` : ''}`}
        <div class="prop-act"><button class="btn sm ${rej ? 'ghost' : 'amber'}" data-pact="approved">Duyệt & hiện trên cẩm nang</button>
          <button class="btn sm ${rej ? 'amber' : 'ghost'}" data-pact="rejected">Loại</button>${rej || nf ? '' : '<button class="btn sm ghost" data-pact="upload">📎 Tải file Word</button>'}<button class="btn sm ghost" data-pact="edit">Sửa chi tiết</button>
          ${x.url ? `<a class="note" href="${esc(x.url)}" target="_blank" rel="noopener" style="margin-left:auto">Văn bản gốc ↗</a>` : ''}</div></article>`;
    };
    anchor.insertAdjacentHTML('afterend', `<section class="card panel props" id="props"><div class="props-head"><div><h2>Đề xuất cập nhật chờ anh quyết định (${items.length})</h2>
        <p class="note">${nA} đề xuất duyệt · ${nR} đề xuất loại${nNeed ? ` · <b style="color:var(--risk)">${nNeed} văn bản cần anh tải file gốc</b>` : ''}. Văn bản được duyệt hiện ngay ở khối "Cập nhật pháp lý mới" trên trang chủ Cẩm nang.</p></div>
        <button class="btn sm" id="pAll">Làm theo tất cả đề xuất</button></div>${items.map(card).join('')}</section>`);
    const decide = async (id, status) => api('legal/' + id, { method: 'PUT', body: JSON.stringify({ status }) });
    $('#props').onclick = async e => {
      const b = e.target.closest('[data-pact]');
      if (b) {
        const art = b.closest('[data-pid]'), id = +art.dataset.pid, act = b.dataset.pact;
        if (act === 'edit') return edit('legal', id);
        if (act === 'upload') { const ok = await uploadAndSummarize(id, b); if (ok) nav('legal'); return; }
        art.querySelectorAll('button').forEach(x => x.disabled = true);
        try { await decide(id, act); toast(act === 'approved' ? 'Đã duyệt – đang hiện trên cẩm nang.' : 'Đã loại.'); art.remove(); setTimeout(() => nav('legal'), 400); }
        catch (err) { toast(err.message, true); art.querySelectorAll('button').forEach(x => x.disabled = false); }
        return;
      }
      if (e.target.id === 'pAll') {
        const t = e.target;
        if (t.dataset.confirm !== '1') { t.dataset.confirm = '1'; t.textContent = `Bấm lần nữa: duyệt ${nA}, loại ${nR}`; setTimeout(() => { t.dataset.confirm = ''; t.textContent = 'Làm theo tất cả đề xuất'; }, 4000); return; }
        t.disabled = true;
        try { for (const x of items) await decide(x.id, x.recommend === 'reject' ? 'rejected' : 'approved'); toast(`Đã duyệt ${nA}, loại ${nR} văn bản.`); }
        catch (err) { toast(err.message, true); }
        nav('legal');
      }
    };
  }

  /* ---------- văn bản pháp luật mới: nút quét + nhật ký ---------- */
  async function legalPanel() {
    const bar = document.querySelector('#main .bar'); if (!bar) return;
    bar.insertAdjacentHTML('afterend', `<div class="card panel" id="lp" style="margin-bottom:14px"><p class="note">Đang tải nhật ký quét…</p></div>`);
    const box = $('#lp');
    const render = d => {
      const s = d.scans || [];
      box.innerHTML = `<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;justify-content:space-between">
          <div><b>Tự quét chinhphu.vn ${d.schedule && d.schedule.days > 1 ? d.schedule.days + ' ngày/lần' : 'mỗi ngày'}</b> lúc 08:00 (<a href="#settings" data-go="settings">đổi tần suất</a>) · Tóm tắt bằng: <span class="mono">${esc(d.ai === 'rule' ? 'quy tắc (chưa bật AI)' : d.ai)}</span>
          <br><span class="note">Văn bản chỉ hiện trên Cẩm nang sau khi anh bấm "Duyệt". Luôn đối chiếu văn bản gốc trước khi duyệt.</span></div>
          <button class="btn amber sm" id="scanNow">Quét ngay</button></div>
        ${s.length ? `<div class="tbl-wrap" style="margin-top:10px"><table><thead><tr><th>Lúc</th><th>Kiểu</th><th>Kết quả</th><th>Đọc</th><th>Mới</th><th>Cần xem</th><th>Ghi chú</th></tr></thead><tbody>
          ${s.slice(0, 5).map(x => `<tr><td>${dt(x.started_at)}</td><td>${x.trigger === 'cron' ? 'Tự động' : 'Quét tay'}</td><td>${!x.finished_at ? 'Đang chạy' : x.ok ? '✅' : '❌ ' + esc(x.error)}</td>
            <td class="num">${x.fetched}</td><td class="num">${x.new_count}</td><td class="num">${x.candidates}</td><td><span class="clip">${esc(x.detail)}</span></td></tr>`).join('')}</tbody></table></div>` : '<p class="note" style="margin-top:8px">Chưa có lượt quét nào. Bấm "Quét ngay" để chạy lần đầu.</p>'}`;
      $('#scanNow').onclick = async e => {
        const b = e.target; b.disabled = true; b.textContent = 'Đang quét… (khoảng 1 phút)';
        try { const r = await api('legal-scan', { method: 'POST', body: '{}' }); toast(`Xong: đọc ${r.fetched} văn bản, ${r.new_count} mới, ${r.candidates} cần anh xem.`); nav('legal'); }
        catch (err) { toast(err.message, true); b.disabled = false; b.textContent = 'Quét ngay'; legalPanelReload(); }
      };
    };
    const legalPanelReload = () => api('legal-scans').then(render).catch(err => { box.innerHTML = `<p class="err">${esc(err.message)}</p>`; });
    legalPanelReload();
  }

  /* ---------- cài đặt riêng của công cụ Cẩm nang thuế ---------- */
  async function toolSettings() {
    SETTINGS = null;
    const [{ settings: s, meta }, st] = await Promise.all([loadSettings(), api('tool-status')]);
    const keys = Object.keys(meta).filter(k => meta[k].tool === 'cam-nang-thue-2026');
    const field = k => meta[k].bool ? `<label class="check full"><input type="checkbox" id="s-${k}" ${s[k] === '1' ? 'checked' : ''}> ${esc(meta[k].label)}</label>`
      : `<label for="s-${k}" class="full">${esc(meta[k].label)}<input id="s-${k}" value="${esc(s[k])}"></label>`;
    const m = st.mail, ok = v => v ? '✅' : '⬜', sub = st.subscribers || {}, tsub = st.toolsubs || {}, lr = m.lastResult;
    const groups = [['Theo dõi văn bản pháp luật mới', ['legal_scan_every_days']], ['Góp ý & đăng ký nhận email trên cẩm nang', ['feedback_open', 'subscribe_open']],
      ['Gửi email cập nhật', ['mail_enabled', 'mail_from_name', 'mail_from']]];
    $('#main').innerHTML = toolTabs('toolset') + `<div class="bar"><div><p class="mono">Cài đặt công cụ</p><h1>Cài đặt Cẩm nang thuế</h1></div></div>
      <div class="two" style="margin-bottom:16px">
        <div class="card panel"><h2>Tình trạng</h2><ul class="list checks stack">
          <li>🕗 Quét văn bản: ${st.schedule.days > 1 ? st.schedule.days + ' ngày/lần' : 'mỗi ngày'} lúc 08:00 · lần gần nhất ${st.schedule.last ? dt(st.schedule.last) : 'chưa có'}</li>
          <li>🤖 AI tóm tắt: <span class="mono">${esc(st.ai)}</span></li>
          <li>📬 Đăng ký nhận pháp lý: ${sub.active || 0} đang nhận · ${sub.pending || 0} chưa xác nhận · ${sub.unsubscribed || 0} đã hủy</li>
          <li>🧰 Đăng ký tin công cụ mới: ${tsub.active || 0} đang nhận · ${tsub.pending || 0} chưa xác nhận · ${tsub.unsubscribed || 0} đã hủy</li>
          <li>💬 Góp ý: ${(st.feedback || {}).new || 0} mới / ${Object.values(st.feedback || {}).reduce((a, b) => a + b, 0)} tổng</li></ul></div>
        <div class="card panel"><h2>Kênh gửi email (dùng chung cho Cẩm nang và Bộ công cụ)</h2><ul class="list checks stack">
          <li>${ok(m.hasKey)} Khóa Resend (RESEND_API_KEY) đã cài ${m.hasKey ? '' : '– <span class="note">chạy lệnh trong HUONG-DAN mục 14</span>'}</li>
          <li>${ok(/@/.test(m.from))} Email gửi đi: ${esc(m.from || 'chưa nhập')}</li><li>${ok(m.enabled)} Đã bật gửi email</li>
          <li>${m.ready ? '🟢 <b>Sẵn sàng gửi</b>' : '⚪ <b>Chưa gửi được</b> – người đăng ký đang được lưu ở "Chưa xác nhận"'}</li>
          ${lr ? `<li>Bản tin gần nhất: ${dt(lr.at)} · gửi ${lr.sent} email · ${lr.updates} văn bản${lr.errors && lr.errors.length ? ' · lỗi: ' + esc(lr.errors[0]) : ''}</li>` : ''}</ul>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;align-items:center"><input id="testTo" placeholder="Email nhận thử" style="min-width:200px">
            <button class="btn sm ghost" id="mTest">Gửi thử</button>
            <button class="btn sm ghost" id="mPend" ${m.ready && (sub.pending || tsub.pending) ? '' : 'disabled'}>Gửi email xác nhận cho ${(sub.pending || 0) + (tsub.pending || 0)} người chưa xác nhận</button>
            <button class="btn sm ghost" id="mDig" ${m.ready ? '' : 'disabled'}>Gửi bản tin ngay</button></div></div></div>
      <form id="sf" style="display:grid;gap:16px">${groups.map(([t, ks]) => `<div class="card panel"><h2>${t}</h2><div class="form">${ks.filter(k => keys.includes(k)).map(field).join('')}</div></div>`).join('')}
        <div class="actions"><button class="btn amber" type="submit">Lưu cài đặt công cụ</button><p class="err" id="serr"></p></div></form>`;
    $('#sf').onsubmit = async e => {
      e.preventDefault(); const body = {};
      for (const k of keys) { const el = $('#s-' + k); if (el) body[k] = meta[k].bool ? (el.checked ? '1' : '0') : el.value; }
      try { await api('settings', { method: 'POST', body: JSON.stringify(body) }); toast('Đã lưu cài đặt công cụ.'); nav('toolset'); } catch (err) { $('#serr').textContent = err.message; }
    };
    const run = async (b, path, body, okMsg) => { b.disabled = true; try { const r = await api(path, { method: 'POST', body: JSON.stringify(body || {}) }); toast(okMsg(r)); } catch (err) { toast(err.message, true); } b.disabled = false; };
    $('#mTest').onclick = e => run(e.target, 'mail-test', { to: $('#testTo').value }, () => 'Đã gửi thư thử, anh kiểm tra hộp thư (cả mục Spam).');
    $('#mPend').onclick = e => run(e.target, 'mail-confirm-pending', {}, r => `Đã gửi ${r.sent} email xác nhận.`);
    $('#mDig').onclick = e => run(e.target, 'mail-digest', {}, r => `Pháp lý: ${r.skipped || 'đã gửi tới ' + r.sent + ' người.'} Công cụ mới: ${r.tools_skipped || 'đã gửi tới ' + r.tools_sent + ' người.'}`);
  }

  /* ---------- cài đặt theo từng module (v1.15) ---------- */
  const SETPAGES = {
    home: { crumb: 'Trang người dùng', title: 'Trang chủ', view: '/', groups: [['Câu chữ trên trang chủ', ['headline', 'tagline', 'notice']], ['Nhạc nền', ['bg_music_url', 'bg_music_title']]] },
    about: { crumb: 'Trang người dùng', title: 'Về Đốm', view: '/ve-dom', groups: [['Đốm tự giới thiệu', ['dom_intro', 'dom_name', 'dom_hope']], ['Đốm kể nhỏ về anh Minh Tuấn', ['about_photo', 'dom_tuan']], ['Đốm cùng anh Minh Tuấn có thể hỗ trợ', ['about_services']]] },
    cafeset: { crumb: 'Tách cà phê', title: 'Mã QR & lời cảm ơn', view: '/tach-ca-phe', groups: [['Tài khoản nhận (mã QR in trên tách cà phê)', ['bank_code', 'bank_name', 'bank_acc', 'bank_holder', 'donate_content']], ['Lời nhắn của Đốm', ['donate_note', 'cafe_thanks', 'thanks_wall']], ['Form hẹn trò chuyện', ['booking_open']]] },
    system: { crumb: 'Hệ thống', title: 'Cài đặt chung', groups: [['Địa chỉ trang', ['site_url']], ['Liên hệ', ['contact_phone', 'contact_zalo', 'contact_email']], ['Mạng xã hội (chân trang)', ['social_tiktok', 'social_facebook', 'social_youtube']], ['Form trên web', ['forms_open']], ['Trang quản trị', ['admin_cover']]] },
  };
  const imageBox = (id, label, v, hint = 'Ảnh tự thu nhỏ trước khi tải lên') => {
    const src = imgUrl(v);
    return `<div class="full"><label for="${id}">${esc(label)}</label><div class="imgup"><div class="imgpv" data-imgpv="${id}">${src ? `<img src="${esc(src)}" alt="">` : '<span>Chưa có ảnh</span>'}</div>
      <div class="imgctl"><input id="${id}" type="text" value="${esc(v)}" placeholder="Bấm Tải ảnh lên (hoặc dán link ảnh)"><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn amber sm" data-upimg="${id}">⬆ Tải ảnh lên</button><button type="button" class="btn ghost sm" data-clrimg="${id}">Bỏ ảnh</button></div><span class="hint">${esc(hint)}</span></div></div></div>`;
  };
  async function settingsPage(p) {
    const P = SETPAGES[p]; SETTINGS = null; const { settings: s, meta } = await loadSettings();
    const keys = P.groups.flatMap(g => g[1]).filter(k => meta[k]);
    const lb = k => String(meta[k].label).replace(/^Về Đốm – /, '');
    const fld = k => meta[k].bool ? `<label class="check full"><input type="checkbox" id="s-${k}" ${s[k] === '1' ? 'checked' : ''}> ${esc(lb(k))}</label>`
      : meta[k].image ? imageBox('s-' + k, lb(k), s[k])
      : meta[k].long ? `<label for="s-${k}" class="full">${esc(lb(k))}<textarea id="s-${k}" rows="5">${esc(s[k])}</textarea></label>`
      : `<label for="s-${k}" class="${['donate_note', 'notice', 'headline', 'tagline', 'site_url', 'bg_music_url'].includes(k) ? 'full' : ''}">${esc(lb(k))}<input id="s-${k}" value="${esc(s[k])}"></label>`;
    const view = P.view ? `<a class="btn ghost sm" href="${esc(SITE_BASE() + P.view)}" target="_blank" rel="noopener">Xem trên web ↗</a>` : '';
    $('#main').innerHTML = head(P.crumb, P.title, view) + `<form id="sf" class="setf">${P.groups.map(([t, ks]) => `<div class="card panel"><h2>${t}</h2><div class="form">${ks.filter(k => meta[k]).map(fld).join('')}</div></div>`).join('')}
        <div class="actions sticky"><button class="btn amber" type="submit">Lưu thay đổi</button><p class="err" id="serr"></p></div></form>`;
    $('#sf').onsubmit = async e => {
      e.preventDefault(); const body = {};
      for (const k of keys) { const el = $('#s-' + k); if (el) body[k] = meta[k].bool ? (el.checked ? '1' : '0') : el.value; }
      try { await api('settings', { method: 'POST', body: JSON.stringify(body) }); SETTINGS = null; await loadSettings(); toast('Đã lưu.'); } catch (err) { $('#serr').textContent = err.message; }
    };
  }
  /* Tải ảnh lên / bỏ ảnh / xem trước – dùng chung cho form sửa và trang cài đặt */
  function bindImages(root) {
    root.addEventListener('click', e => {
      const up = e.target.closest('[data-upimg]');
      if (up) {
        e.preventDefault();
        pickFile('image/jpeg,image/png,image/webp').then(async f => {
          if (!f) return;
          up.disabled = true; up.textContent = 'Đang tải ảnh…';
          try {
            const r = await api('media', { method: 'POST', body: JSON.stringify({ name: f.name, data: await shrinkImage(f) }) });
            const inp = document.getElementById(up.dataset.upimg); inp.value = r.url; inp.dispatchEvent(new Event('input', { bubbles: true }));
            toast('Đã tải ảnh lên – nhớ bấm Lưu.');
          } catch (err) { toast(err.message, true); }
          up.disabled = false; up.textContent = '⬆ Tải ảnh lên';
        });
        return;
      }
      const clr = e.target.closest('[data-clrimg]'); if (clr) { e.preventDefault(); const inp = document.getElementById(clr.dataset.clrimg); inp.value = ''; inp.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    root.addEventListener('input', e => {
      const pv = document.querySelector(`[data-imgpv="${e.target.id}"]`);
      if (pv) { const v = e.target.value.trim(); pv.innerHTML = v ? `<img src="${esc(imgUrl(v))}" alt="">` : '<span>Chưa có ảnh</span>'; }
    });
  }

  /* ---------- đăng nhập ---------- */
  function loginView(msg) {
    $('#app').innerHTML = `<div class="login"><form class="card" id="lf"><h1>Quản trị tử tế</h1><p class="note lead">Nhập mật khẩu quản trị để tiếp tục.</p>
      <input type="password" id="pw" autocomplete="current-password" placeholder="Mật khẩu" required>
      <label class="remember" for="remember"><input type="checkbox" id="remember"> Ghi nhớ trên máy này</label>
      <button class="btn amber" type="submit">Đăng nhập</button><p class="err" id="lerr">${esc(msg || '')}</p></form></div>`;
    $('#pw').focus();
    $('#lf').onsubmit = async e => {
      e.preventDefault(); token = $('#pw').value;
      try {
        await api('ping');
        try { (($('#remember').checked) ? localStorage : sessionStorage).setItem(KEY, token); } catch (er) { }
        start();
      } catch (err) { $('#lerr').textContent = 'Sai mật khẩu quản trị.'; token = ''; }
    };
  }
  function logout() { token = ''; try { sessionStorage.removeItem(KEY); localStorage.removeItem(KEY); } catch (e) { } loginView(); }
  function start() {
    shell();
    $('#logout').onclick = logout;
    document.querySelector('aside').onclick = e => { const b = e.target.closest('[data-page]'); if (b) nav(b.dataset.page); };
    $('#main').addEventListener('click', e => { const g = e.target.closest('[data-go]'); if (g) nav(g.dataset.go); });
    bindImages($('#main'));
    nav(location.hash.slice(1) || 'dashboard');
    api('dashboard').then(d => { setBadgeData(d); setBadges(); }).catch(() => { });
  }

  if (token) api('ping').then(start).catch(() => loginView()); else loginView();
})();
