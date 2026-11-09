import re
def patch(p, pairs):
    s=open(p,encoding='utf-8').read()
    for a,b in pairs:
        assert s.count(a)==1,(p,a[:70],s.count(a)); s=s.replace(a,b)
    open(p,'w',encoding='utf-8').write(s); print('ok',p)
CHANGELOG = ("0.2.1 | 07/11/2026 | Module Nhân sự: Sơ đồ tổ chức tự vẽ từ danh mục phòng ban, thêm sửa chuyển phòng ban ngay trên sơ đồ; "
 "Danh sách nhân sự: lọc nhanh có số đếm, chọn cột hiển thị, xuất Excel, thêm sửa người có kiểm tra dữ liệu; "
 "Hồ sơ nhân sự: bảng giấy tờ từng người, kho lưu bản scan xem phóng to; "
 "Hợp đồng: danh sách người cần ký, lập hợp đồng có kiểm tra theo Bộ luật Lao động 2019; "
 "Kho hợp đồng mẫu soạn như Word, ghép trường bằng kéo thả hoặc gõ /, xuất file Word điền sẵn; "
 "Việc cần xử lý lọc theo hạn (Quá hạn, Trong 07 / 14 / 30 ngày, Sau 30 ngày), gộp giấy tờ còn thiếu thành một việc\\n"
 "0.1.1 | 06/11/2026 | Bản mở đầu – module Tổng quan: Bảng điều hành (đội ngũ, sự kiện sắp tới, quỹ lương, lịch đi làm); "
 "Việc cần xử lý: tự đối chiếu hồ sơ, hợp đồng, chấm công, nghỉ phép, bảng lương để nhắc việc dễ sót; "
 "Việc định kỳ hằng tháng tự nhắc khi sắp đến hạn; Xem nhiều công ty hoặc gộp dữ liệu các công ty")
BEN = "Nắm nhanh tình hình nhân sự và việc cần xử lý trên một bảng điều hành\\nTheo dõi hồ sơ, giấy tờ còn thiếu của từng người\\nLập hợp đồng lao động có kiểm tra thời gian, lương thử việc theo Bộ luật Lao động 2019\\nSoạn mẫu hợp đồng như Word, xuất file điền sẵn cho từng người"
HL = "Bảng điều hành | Đội ngũ, sự kiện sắp tới, quỹ lương và việc cần xử lý theo hạn\\nHồ sơ nhân sự | Mỗi người một bảng giấy tờ, kho lưu bản scan, nhắc phần còn thiếu\\nHợp đồng lao động | Nhắc người cần ký, kiểm tra thử việc và số lần ký theo Bộ luật Lao động 2019\\nKho hợp đồng mẫu | Soạn như Word, kéo thả trường thông tin, xuất file Word điền sẵn"
NOTICE = "ĐANG XÂY DỰNG\\nTheo dõi hành trình và trải nghiệm các tính năng đã hoàn thành: mỗi bản có link dùng thử ngay trên trình duyệt với dữ liệu mẫu."
def q(x): return "'" + x.replace("'", "''") + "'"
def nl(x): return "replace(" + q(x) + ", '\\n', char(10))"
MIG = f'''/* 07/11/2026 – Phần mềm quản lý nhân sự: đưa lên Bộ công cụ (Active, Nổi bật, đứng đầu) với ghi chú ĐANG XÂY DỰNG; nút dẫn ra trang Lịch sử phiên bản /quan-ly-nhan-su/.
   Chỉ chạy khi bản ghi còn chưa có link (url = ''); ô nào anh đã tự nhập thì giữ nguyên. */
const MIGRATE_TOOLS_V25 = [
  `UPDATE tools SET status = 'ok', featured = 1, sort = 5, visible = 1, url = '/quan-ly-nhan-su/',
     version = 'Bản 0.2.1', released = CASE WHEN released = '' THEN '2026-11-06' ELSE released END,
     who = CASE WHEN who IN ('', 'Hành chính – nhân sự') THEN 'Hành chính – Nhân sự, C&B, Chủ doanh nghiệp nhỏ' ELSE who END,
     benefits = CASE WHEN benefits = '' THEN {nl(BEN)} ELSE benefits END,
     highlights = CASE WHEN highlights = '' THEN {nl(HL)} ELSE highlights END,
     changelog = CASE WHEN changelog = '' THEN {nl(CHANGELOG)} ELSE changelog END,
     notice = CASE WHEN notice = '' THEN {nl(NOTICE)} ELSE notice END,
     cta_label = CASE WHEN cta_label = '' THEN 'Theo dõi hành trình & trải nghiệm ↗' ELSE cta_label END,
     updated_at = CAST(strftime('%s','now') AS INTEGER) * 1000
   WHERE slug = 'quan-ly-nhan-su' AND url = ''`,
];
'''
patch('src/core.js', [
 ("  announce_at: 'INTEGER NOT NULL DEFAULT 0', announced_at: 'INTEGER NOT NULL DEFAULT 0',\n",
  "  announce_at: 'INTEGER NOT NULL DEFAULT 0', announced_at: 'INTEGER NOT NULL DEFAULT 0',\n  // 07/11/2026: ghi chú nổi bật trong popup (dòng 1 = nhãn, VD ĐANG XÂY DỰNG; các dòng sau = lời ghi chú) + chữ trên nút dùng công cụ\n  notice: \"TEXT NOT NULL DEFAULT ''\", cta_label: \"TEXT NOT NULL DEFAULT ''\",\n"),
 ("const MIGRATE_TOOLS_V14 = [", MIG + "const MIGRATE_TOOLS_V14 = ["),
 ("    catch (e) { console.error('mig_tools_v24', e); }\n  }\n",
  "    catch (e) { console.error('mig_tools_v24', e); }\n  }\n  const done25 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v25'`).first('value');\n  if (!done25) {\n    try { await env.DB.batch([...MIGRATE_TOOLS_V25, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v25', '1')`].map(s => env.DB.prepare(s))); }\n    catch (e) { console.error('mig_tools_v25', e); }\n  }\n"),
 ("banner_url: { type: 'text', max: 500 }, eta: { type: 'date' },",
  "banner_url: { type: 'text', max: 500 }, eta: { type: 'date' },\n      notice: { type: 'long', max: 600 }, cta_label: { type: 'text', max: 60 },"),
])
patch('src/public-api.js', [("sort, updated_at, changelog';", "sort, updated_at, changelog, notice, cta_label';")])
s=open('admin/public/admin.js',encoding='utf-8').read()
a="        ['features', 'Tính năng hữu ích (lưu nội bộ, không hiện trên web)'"
patch('admin/public/admin.js', [(a, "        ['notice', 'Ghi chú nổi bật trong popup (VD công cụ đang xây dựng)', 'long', { full: 1, hint: 'Dòng 1 = nhãn in hoa (VD: ĐANG XÂY DỰNG), các dòng sau = lời ghi chú. Có ghi chú thì nhãn trên bìa và popup đổi từ Active thành Đang xây dựng. Để trống = không hiện' }],\n        ['cta_label', 'Chữ trên nút dùng công cụ', 'text', { hint: 'Để trống = Dùng công cụ ↗ / Dùng online ↗. VD: Theo dõi hành trình & trải nghiệm ↗' }],\n" + a)])
patch('site/public/app.js', [
 ("  const stBadge = st => st === 'ok' ? '<span class=\"stb on\">Active</span>' : '<span class=\"stb\">Coming soon</span>';",
  "  const stBadge = (st, t) => st === 'ok' ? (t && t.notice ? '<span class=\"stb on build\">Đang xây dựng</span>' : '<span class=\"stb on\">Active</span>') : '<span class=\"stb\">Coming soon</span>';\n  // 07/11/2026: ghi chú nổi bật trong popup (dòng 1 = nhãn, các dòng sau = lời ghi chú)\n  const noticeOf = t => { const L = lines(t.notice); return L.length ? `<div class=\"bk-notice\"><b>${esc(L[0])}</b>${L.length > 1 ? `<p>${L.slice(1).map(esc).join('<br>')}</p>` : ''}</div>` : ''; };"),
 ("<span class=\"cb-foot\">${stBadge(t.status)}${priceTag(t)}</span>", "<span class=\"cb-foot\">${stBadge(t.status, t)}${priceTag(t)}</span>"),
 ("<div class=\"bk-meta\">${stBadge(t.status)}${priceTag(t)}</div>", "<div class=\"bk-meta\">${stBadge(t.status, t)}${priceTag(t)}</div>\n          ${noticeOf(t)}"),
 ("data-newtab>${dl ? 'Dùng online ↗' : 'Dùng công cụ ↗'}</a>", "data-newtab>${esc(t.cta_label || (dl ? 'Dùng online ↗' : 'Dùng công cụ ↗'))}</a>"),
])
open('site/public/style.css','a',encoding='utf-8').write('''
/* v1.34 (07/11/2026): công cụ đang xây dựng – nhãn "Đang xây dựng" trên bìa/popup + hộp ghi chú nổi bật trong popup (cột notice) */
.stb.on.build{background:#fff4d6;color:#8a5a00;border-color:#e9c46a}
:root[data-lamp="off"] .stb.on.build{background:rgba(233,196,106,.16);color:#f2c96b;border-color:rgba(233,196,106,.45)}
.bk-notice{margin:12px 0 4px;padding:10px 14px;border:1.5px dashed #d9a63a;border-radius:10px;background:#fffaf0;color:#5c4400}
.bk-notice b{display:block;font-family:var(--f-wall);font-size:13px;letter-spacing:.08em;color:#9a6200}
.bk-notice p{margin:4px 0 0;font-size:14px;line-height:1.5}
:root[data-lamp="off"] .bk-notice{background:rgba(233,196,106,.08);border-color:rgba(233,196,106,.5);color:#ecdcb8}
:root[data-lamp="off"] .bk-notice b{color:#f2c96b}
''')
print('css ok')
