import sys
p='src/core.js'; s=open(p,encoding='utf-8').read()
assert '_mig_tools_v23' not in s
CL="1.1.0 | 06/11/2026 | Theo góp ý chị kế toán dùng thử: thẻ mới Hàng về kho – theo dõi đơn hủy khi đơn vị vận chuyển đã lấy hàng và đơn trả hàng, kèm phí vận chuyển người bán chịu, mã vận đơn, ô nhập ngày hàng về kho và ghi chú; Tổng quan: bấm Doanh thu đơn thành công hoặc Đơn hủy / trả hàng để mở đúng danh sách ở Đối chiếu đơn hàng, thêm lọc theo trạng thái đơn (thành công, hủy, trả hàng); thẻ Đơn hủy / trả hàng hiện thêm tổng doanh số; Kỳ chọn ở một thẻ áp dụng cho mọi thẻ (kể cả Giao theo ngày); số cảnh báo trên các thẻ tính đúng theo kỳ đang chọn; sửa lỗi Tổng quan không hiện trong Báo cáo HTML gửi sếp"
v='''/* 06/11/2026 – Đối chiếu đơn hàng & BC lợi nhuận sàn TMĐT 1.1.0: ghi lịch sử cập nhật (giữ nguyên tên, trạng thái hiển thị anh đã đặt) */
const MIGRATE_TOOLS_V23 = [
  `UPDATE tools SET version = 'Bản 1.1.0',
     changelog = '%s' || CASE WHEN changelog = '' THEN '' ELSE char(10) || changelog END,
     updated_at = CAST(strftime('%%s','now') AS INTEGER) * 1000
   WHERE slug = 'loi-nhuan-san-tmdt' AND instr(changelog, '1.1.0 |') = 0`,
];
''' % CL.replace("'","''")
a="const MIGRATE_TOOLS_V14 = ["; assert s.count(a)==1; s=s.replace(a,v+a)
b="    catch (e) { console.error('mig_tools_v22', e); }\n  }\n"; assert s.count(b)==1
s=s.replace(b,b+"  const done23 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v23'`).first('value');\n  if (!done23) {\n    try { await env.DB.batch([...MIGRATE_TOOLS_V23, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v23', '1')`].map(s => env.DB.prepare(s))); }\n    catch (e) { console.error('mig_tools_v23', e); }\n  }\n")
open(p,'w',encoding='utf-8',newline='').write(s); print('ok')
