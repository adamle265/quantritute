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
    subStatus: { pending: 'Chờ xác nhận', active: 'Đang nhận', unsubscribed: 'Đã hủy' },
    topic: { gtgt: 'Thuế GTGT', hoadon: 'Hóa đơn', tndn: 'Thuế TNDN', tncn: 'Thuế TNCN', gdlk: 'Giao dịch liên kết', qlt: 'Quản lý thuế – Kế toán', hdld: 'Lao động', bhxh: 'BHXH' },
  };
  const topicNames = v => String(v || '').split(',').filter(Boolean).map(k => OPT.topic[k] || k).join(', ');
  const ENT = {
    feedback: {
      title: 'Góp ý về công cụ', one: 'góp ý', statusKey: 'status', statusOpt: OPT.fbStatus, noAdd: true,
      cols: [['created_at', 'Ngày gửi', o => dt(o.created_at)], ['name', 'Họ tên'], ['phone', 'SĐT'], ['content', 'Nội dung góp ý', 'clip'], ['status', 'Trạng thái', 'pill']],
      form: [['name', 'Họ tên', 'text'], ['phone', 'Số điện thoại', 'text'], ['content', 'Nội dung góp ý', 'long', { req: 1, full: 1 }], ['page', 'Gửi từ trang', 'text'],
        ['status', 'Trạng thái', 'select', { opt: OPT.fbStatus }], ['admin_note', 'Ghi chú nội bộ / đã phản hồi gì', 'long', { full: 1 }]],
    },
    subscribers: {
      title: 'Đăng ký nhận email cập nhật', one: 'người đăng ký', statusKey: 'status', statusOpt: OPT.subStatus, noAdd: true,
      cols: [['created_at', 'Ngày đăng ký', o => dt(o.created_at)], ['email', 'Email'], ['status', 'Trạng thái', 'pill'], ['confirmed_at', 'Xác nhận', o => dt(o.confirmed_at)], ['last_sent_at', 'Gửi gần nhất', o => dt(o.last_sent_at)]],
      form: [['email', 'Email', 'text', { req: 1 }], ['status', 'Trạng thái', 'select', { opt: OPT.subStatus, hint: 'Chỉ "Đang nhận" mới được gửi bản tin. Người dùng tự xác nhận qua email.' }], ['admin_note', 'Ghi chú', 'long', { full: 1 }]],
    },
    legal: {
      title: 'Văn bản pháp luật mới', one: 'văn bản', statusKey: 'status', statusOpt: OPT.legalStatus, publicPath: () => '/tools/cam-nang-thue-2026/', defStatus: 'pending', noAdd: false,
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
      title: 'Công cụ', one: 'công cụ', statusKey: 'status', statusOpt: OPT.toolStatus, publicPath: t => '/cong-cu/' + t.slug,
      cols: [['name', 'Tên công cụ'], ['grp', 'Nhóm chủ đề', o => OPT.grp[o.grp] || o.grp], ['status', 'Trạng thái', 'pill'],
        ['pricing', 'Giá', o => o.pricing === 'paid' ? (o.price > 0 ? money(o.price) + (o.price_note ? ' ' + o.price_note : '') : 'Có phí') : 'Free'],
        ['featured', 'Nổi bật', 'star'], ['visible', 'Hiển thị', o => o.visible ? 'Có' : 'Ẩn'], ['sort', 'Thứ tự', 'num']],
      form: [
        ['_h1', 'Thông tin trên thẻ công cụ', 'head'],
        ['name', 'Tên công cụ (dễ hiểu, nói rõ việc nó làm)', 'text', { req: 1, full: 1 }], ['slug', 'Đường dẫn', 'slug', { req: 1, from: 'name', hint: 'Chữ thường không dấu, VD: doc-hoa-don-xml → /cong-cu/doc-hoa-don-xml' }],
        ['grp', 'Nhóm chủ đề (tab)', 'select', { opt: OPT.grp }], ['status', 'Trạng thái sử dụng', 'select', { opt: OPT.toolStatus, hint: 'Chỉ chọn "Dùng được" khi đã có Link công cụ hoặc Link tải về' }],
        ['icon', 'Icon', 'select', { opt: OPT.icon, preview: 1 }],
        ['pricing', 'Free hay Có phí', 'select', { opt: OPT.pricing, hint: 'Free hiện màu xanh lá, Có phí hiện màu đỏ' }], ['price', 'Giá (đồng, để 0 nếu chưa chốt giá)', 'number'],
        ['price_note', 'Đơn vị giá', 'text', { hint: 'VD: / lượt, / tháng, / năm' }],
        ['featured', 'Hiện trong carousel "Tiện ích nổi bật" (tab mặc định, thứ tự theo ô Thứ tự hiển thị)', 'bool'],
        ['pain', 'Giải quyết vấn đề gì (1 câu, nói bằng lời người dùng)', 'text', { full: 1 }],
        ['tags', 'Tag (cách nhau bằng dấu phẩy)', 'text', { full: 1, hint: 'VD: Hóa đơn điện tử, XML' }],
        ['_h2', 'Chi tiết trong popup', 'head'],
        ['benefits', 'Công cụ này sẽ giúp bạn (hiện trong popup)', 'long', { full: 1, hint: 'Mỗi dòng 1 lợi ích, bắt đầu bằng động từ: Nắm rõ…, Đối chiếu…, So sánh…, Tự tính… Nên 3–4 dòng. Để trống thì popup hiện câu "Giải quyết vấn đề gì"' }],
        ['who', 'Công cụ phù hợp với (đối tượng sử dụng)', 'text', { full: 1 }], ['author', 'Tác giả', 'text'], ['version', 'Phiên bản', 'text', { hint: 'VD: 1.0, hoặc Nội dung cập nhật 08/2026' }],
        ['released', 'Ngày xuất bản', 'date'], ['banner_url', 'Link ảnh giao diện công cụ – hiện ở khung VIDEO DEMO trong popup (để trống: dùng ảnh chụp sẵn /assets/tools/<mã>.jpg nếu có, không thì web tự vẽ)', 'text', { full: 1 }],
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
        ['before_text', 'SÁCH – Trước khi đọc, tôi nghĩ…', 'long', { full: 1 }],
        ['after_text', 'SÁCH – Sau khi đọc, tôi…', 'long', { full: 1 }],
        ['quotes', 'SÁCH – Thẻ trích dẫn (mỗi dòng 1 thẻ: Câu trích | tr. 45 | Tuấn nghĩ gì về câu này)', 'long', { full: 1, hint: 'Mỗi dòng thành 1 thẻ; phần "Tuấn nghĩ" hiện ở mặt sau thẻ (bấm lật). Chỉ trích đoạn ngắn' }],
        ['lessons', 'SÁCH – Bài học rút ra (mỗi dòng 1 ý)', 'long', { full: 1 }],
        ['youtube_url', 'VIDEO – Link YouTube', 'text', { full: 1 }],
        ['channel', 'VIDEO – Kênh / danh sách phát (VD: Quản trị con người). Cùng tên = cùng kênh', 'text'], ['channel_sort', 'VIDEO – Thứ tự kênh (nhỏ đứng trước)', 'number', { def: 100 }],
        ['summary', 'VIDEO – Mô tả ngắn', 'long', { full: 1 }],
        ['reflection', 'VIDEO – Điều tôi ngẫm (mỗi đoạn 1 dòng)', 'long', { full: 1 }],
        ['question', 'Câu hỏi để người xem tự ngẫm (cả sách và video)', 'text', { full: 1 }],
        ['script', 'VIDEO – Script / ghi chép gốc (CHỈ LƯU NỘI BỘ, không hiện trên web)', 'long', { full: 1, big: 1 }],
        ['visible', 'Hiển thị trên web', 'bool', { def: 1 }],
      ],
    },
    topics: {
      title: 'Góc ngẫm · Chủ đề bài viết', one: 'chủ đề', statusOpt: {}, publicPath: o => '/goc-ngam?phong=bai-viet&chu-de=' + o.slug,
      cols: [['name', 'Tên chủ đề'], ['slug', 'Đường dẫn'], ['color', 'Màu', o => OPT.topicColor[o.color] || o.color], ['visible', 'Hiển thị', o => o.visible ? 'Có' : 'Ẩn'], ['sort', 'Thứ tự', 'num']],
      form: [
        ['name', 'Tên chủ đề', 'text', { req: 1 }], ['slug', 'Đường dẫn', 'slug', { req: 1, from: 'name' }],
        ['color', 'Màu nhãn chủ đề', 'select', { opt: OPT.topicColor }], ['sort', 'Thứ tự (nhỏ đứng trước)', 'number', { def: 100 }],
        ['description', 'Mô tả ngắn (hiện khi lọc theo chủ đề)', 'text', { full: 1 }], ['visible', 'Hiển thị trên web', 'bool', { def: 1 }],
      ],
    },
    posts: {
      title: 'Góc ngẫm · Bài viết', one: 'bài viết', statusKey: 'status', statusOpt: OPT.blogStatus, publicPath: p => '/blog/' + p.slug + (p.status === 'published' ? '' : '?xem-truoc=' + p.preview_key),
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
      title: 'Đề xuất công cụ & tính năng · Bảng ghim', one: 'đề xuất', statusKey: 'status', statusOpt: OPT.reqStatus, publicPath: () => '/bang-ghim',
      cols: [['created_at', 'Ngày gửi', o => dt(o.created_at)], ['tool_ref', 'Đề xuất cho', o => o.tool_ref ? '➕ Tính năng: ' + o.tool_ref : '🆕 Công cụ mới'], ['pain', 'Nội dung', 'clip'], ['role', 'Vị trí'], ['votes', 'Lượt cùng cần', 'num'], ['status', 'Trạng thái', 'pill'], ['on_board', 'Bảng ghim', 'pin'], ['eta', 'Dự kiến', 'num']],
      form: [
        ['pain', 'Việc lặp lại', 'long', { req: 1, full: 1 }], ['role', 'Vị trí', 'text'], ['contact', 'Liên hệ', 'text'],
        ['status', 'Trạng thái', 'select', { opt: OPT.reqStatus }], ['votes', 'Lượt cùng cần (gộp các yêu cầu giống nhau)', 'number', { def: 1 }],
        ['tool_ref', 'Đề xuất thêm tính năng cho công cụ (slug, trống = đề xuất công cụ mới)', 'text'],
        ['tool_slug', 'Công cụ trên web gắn với tờ note (slug database)', 'text', { hint: 'Có slug: bấm vào note sẽ mở đúng popup công cụ đó; khi "Mới phát hành" note có nút "Dùng ngay"' }], ['admin_note', 'Ghi chú nội bộ', 'long', { full: 1 }],
        ['on_board', 'Ghim lên Bảng ghim (công khai)', 'bool', { hint: 'Bảng chỉ hiện Tên đề xuất, Mô tả, Trạng thái, Ngày dự kiến, Lời Tuấn. Không hiện nội dung gốc, vị trí, liên hệ người gửi' }],
        ['board_title', 'Tên công cụ đề xuất – trên giấy note (bắt buộc để hiện)', 'text', { full: 1 }],
        ['board_desc', 'Mô tả việc lặp lại – đã biên tập, trên giấy note', 'long', { full: 1 }],
        ['eta', 'Ngày dự kiến phát hành', 'date', { hint: 'Đổi sang ngày muộn hơn → bảng tự ghi "Lùi sang … (dự kiến cũ …)"' }],
        ['board_note', 'Lời Tuấn – chữ viết tay trên note (VD lý do chưa làm)', 'text', { full: 1 }],
        ['board_link', 'Link giải pháp khác (khi Chưa làm vì đã có công cụ phù hợp)', 'text', { full: 1 }],
      ],
    },
    bookings: {
      title: 'Lịch tư vấn 1:1', one: 'yêu cầu tư vấn', statusKey: 'status', statusOpt: OPT.bookStatus,
      cols: [['created_at', 'Ngày gửi', o => dt(o.created_at)], ['name', 'Tên'], ['contact', 'Liên hệ'], ['topic', 'Chủ đề'], ['status', 'Trạng thái', 'pill'], ['scheduled_at', 'Lịch hẹn']],
      form: [
        ['name', 'Tên', 'text', { req: 1 }], ['contact', 'Liên hệ', 'text', { req: 1 }], ['topic', 'Chủ đề', 'text'],
        ['status', 'Trạng thái', 'select', { opt: OPT.bookStatus }], ['scheduled_at', 'Lịch hẹn', 'text', { hint: 'VD: 20:00 15/10/2026, Google Meet' }],
        ['description', 'Tình huống khách mô tả', 'long', { full: 1 }], ['admin_note', 'Ghi chú nội bộ', 'long', { full: 1 }],
      ],
    },
  };

  /* ---------- khung ---------- */
  let page = 'dashboard', SETTINGS = null, badge = {};
  const TOOL_TABS = [['legal', 'Văn bản pháp luật mới'], ['feedback', 'Góp ý'], ['subscribers', 'Đăng ký nhận email'], ['toolset', 'Cài đặt công cụ']];
  const TOOL_PAGES = TOOL_TABS.map(t => t[0]);
  const toolTabs = active => `<div class="tooltabs"><p class="mono">Dữ liệu & cài đặt công cụ · <a href="${esc(((SETTINGS && SETTINGS.settings.site_url) || 'https://quantritute.pages.dev').replace(/\/+$/, ''))}/tools/cam-nang-thue-2026/" target="_blank" rel="noopener" id="toolLink">Mở công cụ ↗</a></p>
    <h2 class="tooltitle">📘 Cẩm nang Thuế – Kế toán – Lao động 2026</h2>
    <nav class="ttabs">${TOOL_TABS.map(([k, l]) => `<button class="ttab" data-go="${k}" aria-current="${k === active ? 'page' : 'false'}">${l}${badge['t_' + k] ? `<span class="badge">${badge['t_' + k]}</span>` : ''}</button>`).join('')}</nav></div>`;
  const MENU = [['Vận hành'], ['dashboard', 'Tổng quan'], ['stats', 'Thống kê công cụ'], ['requests', 'Đề xuất · Bảng ghim'], ['bookings', 'Lịch tư vấn 1:1'], ['Dữ liệu công cụ'], ['legal', 'Cẩm nang thuế'], ['Nội dung'], ['tools', 'Công cụ'], ['reflections', 'Góc ngẫm · Sách, Video'], ['posts', 'Góc ngẫm · Bài viết'], ['topics', 'Góc ngẫm · Chủ đề bài'], ['episodes', 'Hành trình (tạm gác)'], ['Hệ thống'], ['settings', 'Cài đặt']];
  function shell() {
    $('#app').innerHTML = `<div class="layout"><aside aria-label="Menu quản trị">
      <div class="logo">Quản trị tử tế<small>Trang quản trị</small></div>
      ${MENU.map(m => m.length === 1 ? `<div class="grp">${m[0]}</div>` : `<button class="nav" data-page="${m[0]}">${m[1]}<span class="badge" data-badge="${m[0]}" hidden></span></button>`).join('')}
      <div class="bottom"><a class="btn ghost sm" id="viewsite" href="#" target="_blank" rel="noopener">Xem trang khách ↗</a><button class="btn ghost sm" id="logout">Đăng xuất</button></div>
    </aside><main id="main"></main></div>`;
  }
  function setBadgeData(d) {
    const L = d.legal || {};
    badge = { requests: d.requests.new || 0, bookings: d.bookings.new || 0, legal: (L.pending || 0) + (L.fb_new || 0), t_legal: L.pending || 0, t_feedback: L.fb_new || 0 };
  }
  function setBadges() {
    for (const k of ['requests', 'bookings', 'legal']) { const el = document.querySelector(`[data-badge="${k}"]`); if (!el) continue; el.textContent = badge[k] || ''; el.hidden = !badge[k]; }
  }
  async function loadSettings() { if (!SETTINGS) SETTINGS = await api('settings'); const u = SETTINGS.settings.site_url; const a = $('#viewsite'); if (a) { a.href = u || '#'; a.hidden = !u; } return SETTINGS; }
  function nav(p, arg) {
    page = p;
    const hp = TOOL_PAGES.includes(p) ? 'legal' : p;
    document.querySelectorAll('.nav').forEach(b => b.setAttribute('aria-current', b.dataset.page === hp ? 'page' : 'false'));
    try { history.replaceState(null, '', '#' + p); } catch (e) { }
    const v = p === 'dashboard' ? dashboard : p === 'stats' ? stats : p === 'settings' ? settings : p === 'toolset' ? toolSettings : () => list(p);
    $('#main').innerHTML = '<p class="note">Đang tải…</p>';
    v(arg).catch(e => { $('#main').innerHTML = `<p class="err">${esc(e.message)}</p>`; });
  }
  const pillOf = (ent, v) => `<span class="pill p-${esc(v)}">${esc((ENT[ent].statusOpt || {})[v] || v)}</span>`;

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
    $('#main').innerHTML = `<div class="bar"><div><p class="mono">Bộ đếm công cụ</p><h1>Thống kê công cụ</h1></div>
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

  /* ---------- tổng quan ---------- */
  async function dashboard() {
    const [d] = await Promise.all([api('dashboard'), loadSettings()]);
    setBadgeData(d); setBadges();
    const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
    const days = []; for (let i = 29; i >= 0; i--) { const x = new Date(Date.now() + 7 * 3600000 - i * 86400000).toISOString().slice(0, 10); days.push(x); }
    const map = Object.fromEntries(d.dailyRequests.map(r => [r.day, r.n])); const max = Math.max(1, ...days.map(x => map[x] || 0));
    $('#main').innerHTML = `<div class="bar"><div><p class="mono">Tổng quan</p><h1>Chào anh Tuấn</h1></div></div>
      <div class="stats">
        <div class="card stat"><p class="mono">Đề xuất mới</p><p class="v">${d.requests.new || 0}</p><p class="note">tổng ${sum(d.requests)} đề xuất</p></div>
        <div class="card stat"><p class="mono">Yêu cầu tư vấn mới</p><p class="v">${d.bookings.new || 0}</p><p class="note">tổng ${sum(d.bookings)} yêu cầu</p></div>
        <div class="card stat"><p class="mono">Tool dùng được</p><p class="v">${(d.tools.ok || 0) + (d.tools.paid || 0)}</p><p class="note">trên ${sum(d.tools)} tool · ${d.tools.risk || 0} đang rà soát</p></div>
        <div class="card stat"><p class="mono">Nội dung đã đăng</p><p class="v">${(d.episodes.published || 0) + (d.posts.published || 0)}</p><p class="note">${d.episodes.published || 0} tập · ${d.posts.published || 0} bài viết</p></div>
      </div>
      <div class="two">
        <div class="card panel"><h2>Đề xuất 30 ngày qua</h2><div class="chart" aria-label="Biểu đồ số đề xuất mỗi ngày">${days.map(x => `<i title="${x.split('-').reverse().join('/')}: ${map[x] || 0}" style="height:${(map[x] || 0) / max * 100}%"></i>`).join('')}</div><p class="note" style="margin-top:6px">Cao nhất ${max === 1 && !Object.keys(map).length ? 0 : max} / ngày</p></div>
        <div class="card panel"><h2>Việc cần thiết lập</h2><ul class="list checks">
          <li>${d.checklist.contact ? '✅' : '⬜'} Thông tin liên hệ</li><li>${d.checklist.social ? '✅' : '⬜'} Link TikTok / Fanpage / YouTube</li>
          <li>${d.checklist.bank ? '✅' : '⬜'} Tài khoản nhận ủng hộ (mã QR)</li><li>${SETTINGS.settings.site_url ? '✅' : '⬜'} Địa chỉ trang khách</li></ul>
          <button class="btn sm ghost" data-go="settings" style="margin-top:12px">Mở Cài đặt</button></div>
        <div class="card panel"><h2>Văn bản pháp luật mới</h2>
          <p class="v" style="font-size:28px;margin:4px 0">${(d.legal || {}).pending || 0} <span class="note">chờ duyệt · ${(d.legal || {}).approved || 0} đang hiện trên cẩm nang</span></p>
          ${(d.legal || {}).need_full ? `<p class="note" style="color:var(--risk);font-weight:600">📄 ${d.legal.need_full} văn bản cần anh tải file gốc (Word / PDF có chữ)</p>` : ''}
          <p class="note">${d.lastScan ? `Lượt quét gần nhất: ${dt(d.lastScan.started_at)} · ${d.lastScan.ok ? `đọc ${d.lastScan.fetched} văn bản, ${d.lastScan.new_count} mới, ${d.lastScan.candidates} cần xem` : '<b style="color:#b42318">lỗi</b> ' + esc(d.lastScan.error || '')}` : 'Chưa quét lần nào.'}</p>
          <button class="btn sm amber" data-go="legal" style="margin-top:12px">Mở danh sách duyệt</button></div>
        <div class="card panel"><h2>Đề xuất gần đây</h2>${d.recentRequests.length ? `<ul class="list">${d.recentRequests.map(r => `<li><span class="clip" style="max-width:none">${esc(r.pain)}</span>${pillOf('requests', r.status)}</li>`).join('')}</ul>` : '<p class="note">Chưa có đặt hàng nào.</p>'}</div>
        <div class="card panel"><h2>Yêu cầu tư vấn gần đây</h2>${d.recentBookings.length ? `<ul class="list">${d.recentBookings.map(r => `<li><span><b>${esc(r.name)}</b> · ${esc(r.topic)}<br><span class="note">${dt(r.created_at)}</span></span>${pillOf('bookings', r.status)}</li>`).join('')}</ul>` : '<p class="note">Chưa có yêu cầu nào.</p>'}</div>
      </div>`;
  }

  /* ---------- danh sách ---------- */
  const listState = {};
  async function list(ent) {
    const E = ENT[ent], st = listState[ent] || (listState[ent] = { q: '', status: E.defStatus || '' });
    const qs = new URLSearchParams({ q: st.q, status: st.status });
    const d = await api(`${ent}?${qs}`);
    if (ent === 'posts') await loadTopics();
    const cell = (o, [k, , f]) => f === 'thumb' ? (o[k] ? `<img class="thumb" src="${esc(/^https?:/i.test(o[k]) ? o[k] : SITE_BASE() + o[k])}" alt="" loading="lazy">` : '<span class="thumb none"></span>')
      : f === 'postact' ? (o.status === 'published' ? `<button type="button" class="star-tg" data-pact="hidden" data-pid="${o.id}">Ẩn</button>`
        : o.status === 'hidden' ? `<button type="button" class="star-tg" data-pact="published" data-pid="${o.id}">Hiện lại</button>`
        : o.status === 'review' ? `<button type="button" class="star-tg pin-tg on" data-pact="published" data-pid="${o.id}">✓ Duyệt & đăng</button>` : '<span class="note">Bản nháp</span>')
      : f === 'pin' ? `<button type="button" class="star-tg pin-tg${o[k] ? ' on' : ''}" data-pin="${o.id}" aria-pressed="${!!o[k]}" title="${o[k] ? 'Đang hiện trên Bảng ghim – bấm để gỡ' : (o.board_title ? 'Bấm để ghim lên Bảng ghim' : 'Mở để đặt Tên đề xuất trước khi ghim')}">${o[k] ? '📌 Đang ghim' : '+ Ghim'}</button>` : f === 'star' ? `<button type="button" class="star-tg${o[k] ? ' on' : ''}" data-star="${o.id}" aria-pressed="${!!o[k]}" title="${o[k] ? 'Đang ở Tiện ích nổi bật – bấm để bỏ' : 'Bấm để đưa vào Tiện ích nổi bật'}">${o[k] ? '★ Nổi bật' : '☆ Thêm'}</button>` : f === 'pill' ? pillOf(ent, o[k]) : f === 'num' ? `<span class="num">${esc(o[k])}</span>` : f === 'clip' ? `<span class="clip">${esc(o[k])}</span>` : typeof f === 'function' ? esc(f(o)) : esc(o[k]);
    $('#main').innerHTML = `<div class="bar"><div><p class="mono">${d.total} mục</p><h1>${E.title}</h1></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn ghost sm" id="export">Tải file Excel (CSV)</button><button class="btn amber sm" id="add">+ Thêm ${E.one}</button></div></div>
      <div class="tools"><input type="search" id="q" placeholder="Tìm…" value="${esc(st.q)}" aria-label="Tìm">
        <select id="st" aria-label="Lọc trạng thái"><option value="">Tất cả trạng thái</option>${Object.entries(E.statusOpt).map(([k, v]) => `<option value="${k}" ${st.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      ${d.items.length ? `<div class="tbl-wrap"><table><thead><tr>${E.cols.map(c => `<th>${c[1]}</th>`).join('')}</tr></thead>
        <tbody>${d.items.map(o => `<tr class="row" data-id="${o.id}" tabindex="0">${E.cols.map(c => `<td>${cell(o, c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
        : `<div class="card panel"><p class="note">Chưa có ${E.one} nào${st.q || st.status ? ' khớp bộ lọc' : ''}.</p></div>`}`;
    let h; $('#q').oninput = e => { clearTimeout(h); h = setTimeout(() => { st.q = e.target.value; list(ent).then(() => { const q = $('#q'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }); }, 300); };
    $('#st').onchange = e => { st.status = e.target.value; list(ent); };
    $('#add').onclick = () => edit(ent, null);
    $('#export').onclick = () => download(`export/${ent}.csv`, `${ent}.csv`);
    if (TOOL_PAGES.includes(ent)) $('#main').insertAdjacentHTML('afterbegin', toolTabs(ent));
    if (E.noAdd) { const ad = $('#add'); if (ad) ad.remove(); }
    if (ent === 'legal') { legalPanel(); if (!st.q && (st.status === 'pending' || !st.status)) legalProposals(d.items.filter(x => x.status === 'pending')); }
    /* Nút ★ bật/tắt "Tiện ích nổi bật" ngay trên danh sách (không mở form sửa) */
    document.querySelectorAll('[data-star]').forEach(b => b.onclick = async e => {
      e.stopPropagation(); if (b.disabled) return;
      const on = !b.classList.contains('on'); b.disabled = true;
      try {
        await api(`${ent}/${b.dataset.star}`, { method: 'PUT', body: JSON.stringify({ featured: on }) });
        b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); b.textContent = on ? '★ Nổi bật' : '☆ Thêm';
        b.title = on ? 'Đang ở Tiện ích nổi bật – bấm để bỏ' : 'Bấm để đưa vào Tiện ích nổi bật';
        toast(on ? 'Đã đưa vào Tiện ích nổi bật.' : 'Đã bỏ khỏi Tiện ích nổi bật.');
      } catch (err) { toast(err.message, true); } finally { b.disabled = false; }
    });
    /* Blog: Duyệt & đăng / Ẩn / Hiện lại ngay trên danh sách */
    document.querySelectorAll('[data-pact]').forEach(b => b.onclick = async e => {
      e.stopPropagation(); if (b.disabled) return; b.disabled = true;
      try { await api(`posts/${b.dataset.pid}`, { method: 'PUT', body: JSON.stringify({ status: b.dataset.pact }) }); toast(b.dataset.pact === 'published' ? 'Đã đăng bài.' : 'Đã ẩn bài.'); list(ent); }
      catch (err) { toast(err.message, true); b.disabled = false; }
    });
    /* Nút 📌 ghim / gỡ khỏi Bảng ghim ngay trên danh sách */
    document.querySelectorAll('[data-pin]').forEach(b => b.onclick = async e => {
      e.stopPropagation(); if (b.disabled) return;
      const on = !b.classList.contains('on'), row = d.items.find(x => x.id === +b.dataset.pin);
      if (on && !(row && row.board_title)) { toast('Mở đề xuất này, nhập "Tên công cụ đề xuất" rồi mới ghim lên bảng.', true); return; }
      b.disabled = true;
      try {
        await api(`${ent}/${b.dataset.pin}`, { method: 'PUT', body: JSON.stringify({ on_board: on }) });
        b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); b.textContent = on ? '📌 Đang ghim' : '+ Ghim';
        toast(on ? 'Đã ghim lên Bảng ghim.' : 'Đã gỡ khỏi Bảng ghim.');
      } catch (err) { toast(err.message, true); } finally { b.disabled = false; }
    });
    document.querySelectorAll('tr.row').forEach(tr => { const open = () => edit(ent, +tr.dataset.id); tr.onclick = open; tr.onkeydown = e => { if (e.key === 'Enter') open(); }; });
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
    if (type === 'image') {
      const src = v ? (/^https?:/i.test(v) ? v : SITE_BASE() + v) : '';
      return `<div class="full"><label for="${id}">${esc(label)}</label><div class="imgup"><div class="imgpv" data-imgpv="${id}">${src ? `<img src="${esc(src)}" alt="">` : '<span>Chưa có ảnh</span>'}</div>
        <div class="imgctl"><input id="${id}" type="text" value="${esc(v)}" placeholder="Dán link ảnh hoặc bấm Tải ảnh lên"><div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn amber sm" data-upimg="${id}">⬆ Tải ảnh lên</button><button type="button" class="btn ghost sm" data-clrimg="${id}">Bỏ ảnh</button></div><span class="hint">Ảnh tự thu nhỏ về tối đa 1600px trước khi tải lên</span></div></div></div>`;
    }
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
  const SITE_BASE = () => ((SETTINGS && SETTINGS.settings && SETTINGS.settings.site_url) || 'https://quantritute.pages.dev').replace(/\/+$/, '');
  /* Thu nhỏ ảnh trên trình duyệt: tối đa 1600px, JPEG ~82% (ảnh gốc không gửi lên máy chủ) */
  function shrinkImage(file) {
    return new Promise((ok, bad) => {
      if (file.size > 25 * 1024 * 1024) return bad(new Error('Ảnh lớn hơn 25MB.'));
      const url = URL.createObjectURL(file), im = new Image();
      im.onload = () => {
        const k = Math.min(1, 1600 / im.naturalWidth), c = document.createElement('canvas');
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
    const E = ENT[ent];
    const item = id ? (await api(`${ent}/${id}`)).item : {};
    if (ent === 'posts') await loadTopics();
    const val = f => id ? item[f[0]] : (f[3]?.def ?? (f[2] === 'select' ? Object.keys(f[3].opt)[0] : ''));
    const siteUrl = (await loadSettings()).settings.site_url;
    const pub = id && E.publicPath && (siteUrl || ent === 'posts') ? SITE_BASE() + E.publicPath(item) : '';
    $('#main').innerHTML = `<div class="bar"><div><p class="mono"><a href="#${ent}" id="back">← ${E.title}</a></p><h1>${id ? 'Sửa ' + E.one : 'Thêm ' + E.one}</h1>
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
      const pv = document.querySelector(`[data-imgpv="${e.target.id}"]`);
      if (pv) { const v = e.target.value.trim(); pv.innerHTML = v ? `<img src="${esc(/^https?:/i.test(v) ? v : SITE_BASE() + v)}" alt="">` : '<span>Chưa có ảnh</span>'; }
      if ($('#seopv')) seoPreview();
    });
    if ($('#seopv')) seoPreview();
    $('#ef').onclick = e => {
      const add = e.target.closest('[data-addlink]'); if (add) { document.getElementById(add.dataset.addlink).insertAdjacentHTML('beforeend', linkRow()); return; }
      const del = e.target.closest('[data-dellink]'); if (del) del.closest('.vrow').remove();
      const up = e.target.closest('[data-upimg]');
      if (up) {
        pickFile('image/jpeg,image/png,image/webp').then(async f => {
          if (!f) return;
          up.disabled = true; up.textContent = 'Đang tải ảnh…';
          try {
            const r = await api('media', { method: 'POST', body: JSON.stringify({ name: f.name, data: await shrinkImage(f) }) });
            const inp = document.getElementById(up.dataset.upimg); inp.value = r.url; inp.dispatchEvent(new Event('input', { bubbles: true }));
            toast('Đã tải ảnh lên.');
          } catch (err) { toast(err.message, true); }
          up.disabled = false; up.textContent = '⬆ Tải ảnh lên';
        });
        return;
      }
      const clr = e.target.closest('[data-clrimg]'); if (clr) { const inp = document.getElementById(clr.dataset.clrimg); inp.value = ''; inp.dispatchEvent(new Event('input', { bubbles: true })); return; }
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
      try { await api(`${ent}/${id}`, { method: 'DELETE' }); toast('Đã xoá.'); nav(ent); } catch (err) { toast(err.message, true); }
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
        if (id) await api(`${ent}/${id}`, { method: 'PUT', body: JSON.stringify(body) });
        else await api(ent, { method: 'POST', body: JSON.stringify(body) });
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
    const m = st.mail, ok = v => v ? '✅' : '⬜', sub = st.subscribers || {}, lr = m.lastResult;
    const groups = [['Theo dõi văn bản pháp luật mới', ['legal_scan_every_days']], ['Góp ý & đăng ký nhận email trên cẩm nang', ['feedback_open', 'subscribe_open']],
      ['Gửi email cập nhật', ['mail_enabled', 'mail_from_name', 'mail_from']]];
    $('#main').innerHTML = toolTabs('toolset') + `<div class="bar"><div><p class="mono">Cài đặt công cụ</p><h1>Cài đặt Cẩm nang thuế</h1></div></div>
      <div class="two" style="margin-bottom:16px">
        <div class="card panel"><h2>Tình trạng</h2><ul class="list checks stack">
          <li>🕗 Quét văn bản: ${st.schedule.days > 1 ? st.schedule.days + ' ngày/lần' : 'mỗi ngày'} lúc 08:00 · lần gần nhất ${st.schedule.last ? dt(st.schedule.last) : 'chưa có'}</li>
          <li>🤖 AI tóm tắt: <span class="mono">${esc(st.ai)}</span></li>
          <li>📬 Người đăng ký: ${sub.active || 0} đang nhận · ${sub.pending || 0} chờ xác nhận · ${sub.unsubscribed || 0} đã hủy</li>
          <li>💬 Góp ý: ${(st.feedback || {}).new || 0} mới / ${Object.values(st.feedback || {}).reduce((a, b) => a + b, 0)} tổng</li></ul></div>
        <div class="card panel"><h2>Kênh gửi email</h2><ul class="list checks stack">
          <li>${ok(m.hasKey)} Khóa Resend (RESEND_API_KEY) đã cài ${m.hasKey ? '' : '– <span class="note">chạy lệnh trong HUONG-DAN mục 14</span>'}</li>
          <li>${ok(/@/.test(m.from))} Email gửi đi: ${esc(m.from || 'chưa nhập')}</li><li>${ok(m.enabled)} Đã bật gửi email</li>
          <li>${m.ready ? '🟢 <b>Sẵn sàng gửi</b>' : '⚪ <b>Chưa gửi được</b> – người đăng ký đang được lưu ở "Chờ xác nhận"'}</li>
          ${lr ? `<li>Bản tin gần nhất: ${dt(lr.at)} · gửi ${lr.sent} email · ${lr.updates} văn bản${lr.errors && lr.errors.length ? ' · lỗi: ' + esc(lr.errors[0]) : ''}</li>` : ''}</ul>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;align-items:center"><input id="testTo" placeholder="Email nhận thử" style="min-width:200px">
            <button class="btn sm ghost" id="mTest">Gửi thử</button>
            <button class="btn sm ghost" id="mPend" ${m.ready && sub.pending ? '' : 'disabled'}>Gửi email xác nhận cho ${sub.pending || 0} người chờ</button>
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
    $('#mDig').onclick = e => run(e.target, 'mail-digest', {}, r => r.skipped || `Đã gửi bản tin tới ${r.sent} người.`);
  }

  /* ---------- cài đặt ---------- */
  async function settings() {
    SETTINGS = null; const { settings: s, meta } = await loadSettings();
    const groups = [['Trang chủ', ['site_url', 'headline', 'tagline', 'notice', 'bg_music_url', 'bg_music_title']], ['Liên hệ & mạng xã hội', ['contact_phone', 'contact_zalo', 'contact_email', 'social_tiktok', 'social_facebook', 'social_youtube']],
      ['Về Minh Tuấn (trang /ve-minh-tuan)', ['about_name', 'about_role', 'about_photo', 'about_motto', 'about_intro', 'about_career', 'about_values', 'about_services']], ['Form trên web', ['forms_open', 'booking_open']], ['Tách cà phê (mã QR in trên tách, trang /tach-ca-phe)', ['bank_code', 'bank_name', 'bank_acc', 'bank_holder', 'donate_content', 'donate_note', 'cafe_thanks', 'thanks_wall']]];
    $('#main').innerHTML = `<div class="bar"><div><p class="mono">Hệ thống</p><h1>Cài đặt</h1></div></div>
      <form id="sf" style="display:grid;gap:16px">${groups.map(([t, keys]) => `<div class="card panel"><h2>${t}</h2><div class="form">${keys.map(k => meta[k].bool
        ? `<label class="check"><input type="checkbox" id="s-${k}" ${s[k] === '1' ? 'checked' : ''}> ${esc(meta[k].label)}</label>`
        : meta[k].long ? `<label for="s-${k}" class="full">${esc(meta[k].label)}<textarea id="s-${k}" rows="5">${esc(s[k])}</textarea></label>`
        : `<label for="s-${k}" class="${k === 'donate_note' || k === 'notice' || k === 'headline' ? 'full' : ''}">${esc(meta[k].label)}<input id="s-${k}" value="${esc(s[k])}"></label>`).join('')}</div></div>`).join('')}
        <p class="note">Cài đặt riêng của từng công cụ (tần suất quét, gửi email, góp ý…) nằm trong mục "Dữ liệu công cụ" của công cụ đó.</p>
        <div class="actions"><button class="btn amber" type="submit">Lưu tất cả</button><p class="err" id="serr"></p></div></form>`;
    $('#sf').onsubmit = async e => {
      e.preventDefault(); const body = {};
      for (const k of Object.keys(meta)) { const el = $('#s-' + k); if (!el) continue; body[k] = meta[k].bool ? (el.checked ? '1' : '0') : el.value; }
      try { await api('settings', { method: 'POST', body: JSON.stringify(body) }); SETTINGS = null; await loadSettings(); toast('Đã lưu cài đặt.'); } catch (err) { $('#serr').textContent = err.message; }
    };
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
    const h = location.hash.slice(1);
    nav(MENU.some(m => m[0] === h) || TOOL_PAGES.includes(h) ? h : 'dashboard');
    api('dashboard').then(d => { setBadgeData(d); setBadges(); }).catch(() => { });
  }

  if (token) api('ping').then(start).catch(() => loginView()); else loginView();
})();
