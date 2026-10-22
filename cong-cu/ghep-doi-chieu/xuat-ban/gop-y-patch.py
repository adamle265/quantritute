# -*- coding: utf-8 -*-
"""Nối góp ý của công cụ Ghép & đối chiếu về trang Quản trị (chạy KHI ANH DUYỆT XUẤT BẢN).
Chạy trong thư mục quantritute:  python cong-cu\\ghep-doi-chieu\\xuat-ban\\gop-y-patch.py
Sửa 2 chỗ nhỏ:
 1. src/public-api.js: thêm 'ghep-doi-chieu' vào TOOL_SLUGS (nếu thiếu, góp ý bị ghi nhầm vào Cẩm nang thuế).
 2. admin/public/admin.js: bảng Góp ý có thêm cột "Công cụ", tiêu đề chung cho mọi công cụ.
Sau đó: npm run deploy:site  +  npm run deploy:admin"""
import io, sys
def patch(path, pairs):
    s = io.open(path, encoding='utf-8').read()
    for a, b in pairs:
        if b in s: print('  đã có:', b[:60]); continue
        assert s.count(a) == 1, ('Không tìm thấy đúng 1 chỗ', path, a[:70])
        s = s.replace(a, b)
    io.open(path, 'w', encoding='utf-8', newline='').write(s); print('OK', path)
patch('src/public-api.js', [("const TOOL_SLUGS = ['cam-nang-thue-2026', 'bo-cong-cu'];", "const TOOL_SLUGS = ['cam-nang-thue-2026', 'bo-cong-cu', 'ghep-doi-chieu'];")])
patch('admin/public/admin.js', [
  ("title: 'Góp ý về công cụ', crumb: 'Bộ công cụ · Cẩm nang thuế',", "title: 'Góp ý về công cụ', crumb: 'Bộ công cụ · góp ý từ các công cụ',"),
  ("cols: [['created_at', 'Ngày gửi', o => dt(o.created_at)], ['name', 'Họ tên'], ['phone', 'SĐT'], ['content', 'Nội dung góp ý', 'clip'], ['status', 'Trạng thái', 'pill']],",
   "cols: [['created_at', 'Ngày gửi', o => dt(o.created_at)], ['tool_slug', 'Công cụ', o => ({ 'cam-nang-thue-2026': 'Cẩm nang thuế', 'ghep-doi-chieu': 'Ghép & đối chiếu' })[o.tool_slug] || o.tool_slug], ['name', 'Họ tên'], ['phone', 'SĐT'], ['content', 'Nội dung góp ý', 'clip'], ['status', 'Trạng thái', 'pill']],"),
])
