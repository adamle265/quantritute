p='src/core.js'; s=open(p,encoding='utf-8').read()
assert '_mig_tools_v24' not in s
import re
OLD=re.search(r"const MIGRATE_TOOLS_V23 = \[\n  `UPDATE tools SET version = 'Bản 1.1.0',\n     changelog = '(.*?)' \|\| CASE",s,re.S).group(1)
NEW="1.1.0 | 06/11/2026 | Thẻ mới Hàng về kho: theo dõi đơn hủy khi đơn vị vận chuyển đã lấy hàng và đơn trả hàng, kèm phí vận chuyển người bán chịu và mã vận đơn; Ghi ngày hàng về kho và ghi chú cho từng đơn, xuất được ra Excel; Tổng quan: bấm Doanh thu đơn thành công hoặc Đơn hủy / trả hàng để mở đúng danh sách đơn; Đối chiếu đơn hàng: thêm lọc theo trạng thái đơn (thành công, hủy, trả hàng); Thẻ Đơn hủy / trả hàng hiện thêm tổng doanh số các đơn này; Chọn kỳ ở một thẻ thì mọi thẻ cùng theo kỳ đó; Số cảnh báo trên các thẻ tính đúng theo kỳ đang chọn; Sửa lỗi phần Tổng quan không hiện trong Báo cáo HTML gửi sếp"
q=lambda x:x.replace("'","''")
v='''/* 06/11/2026 – Đối chiếu đơn hàng & BC lợi nhuận sàn TMĐT: viết lại dòng 1.1.0 của Lịch sử cập nhật cho gọn (8 ý = 8 dòng trong thư Báo cập nhật), đổi nhãn Beta 05.11 → Beta 06.11 (chỉ chạy 1 lần; anh đã sửa tay thì không đụng) */
const MIGRATE_TOOLS_V24 = [
  `UPDATE tools SET changelog = replace(changelog, '%s', '%s'), updated_at = CAST(strftime('%%s','now') AS INTEGER) * 1000
   WHERE slug = 'loi-nhuan-san-tmdt' AND instr(changelog, '%s') > 0`,
  `UPDATE tools SET name = replace(name, 'Beta 05.11', 'Beta 06.11'), updated_at = CAST(strftime('%%s','now') AS INTEGER) * 1000
   WHERE slug = 'loi-nhuan-san-tmdt' AND instr(name, 'Beta 05.11') > 0`,
];
''' % (q(OLD),q(NEW),q(OLD))
a="const MIGRATE_TOOLS_V14 = ["; assert s.count(a)==1; s=s.replace(a,v+a)
b="    catch (e) { console.error('mig_tools_v23', e); }\n  }\n"; assert s.count(b)==1
s=s.replace(b,b+"  const done24 = await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_tools_v24'`).first('value');\n  if (!done24) {\n    try { await env.DB.batch([...MIGRATE_TOOLS_V24, `INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_tools_v24', '1')`].map(s => env.DB.prepare(s))); }\n    catch (e) { console.error('mig_tools_v24', e); }\n  }\n")
open(p,'w',encoding='utf-8',newline='').write(s); print('ok', len(NEW.split('|')[2].split(';')))
