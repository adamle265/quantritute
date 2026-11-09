# -*- coding: utf-8 -*-
"""
DỮ LIỆU MẪU HƯ CẤU – Hồ sơ giấy tờ + Quá trình học tập, công tác (07/11/2026, module Nhân sự – Hồ sơ nhân sự)
Ghi 01_Ho_so_nhan_su/Ho_so_giay_to.xlsx cho Đốm Sáng Edu và Đốm Sáng Health (2 sheet: Giay_to, Qua_trinh).
Đồng thời bổ sung 4 cột vào Danh_sach_nhan_vien.xlsx (07/11/2026): Số con từ 6 tuổi trở xuống, Người thân liên hệ, Quan hệ với người thân, SĐT người thân liên hệ.
Đọc danh sách nhân viên từ file đã sinh (chạy SAU tao-kho-du-lieu-mau.py và tao-kho-du-lieu-mau-health.py):
  python tao-ho-so-giay-to.py  →  node tao-du-lieu-mau.js  →  node build.js
Quy ước ô giấy tờ: ngày nộp dd/mm/yyyy · "Không áp dụng" · để trống = còn thiếu.
Danh mục giấy tờ là ví dụ thường gặp, KHÔNG phải danh mục bắt buộc theo luật – đơn vị tự đặt trong phần mềm.
"""
import os, importlib.util, datetime as dt
from openpyxl import Workbook, load_workbook
H = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('mau', os.path.join(H, 'tao-kho-du-lieu-mau.py')); M = importlib.util.module_from_spec(spec); spec.loader.exec_module(M)
D = dt.date
DOCS = ['Sơ yếu lý lịch', 'CV', 'Bản sao CCCD', 'Bằng cấp, chứng chỉ', 'Giấy khám sức khỏe', 'Ảnh 3x4', 'Đơn xin việc', 'Xác nhận thông tin cư trú', 'Cam kết bảo mật, nội quy']
NA = 'Không áp dụng'
# Kịch bản (tính đến 31/10/2026): ai thiếu giấy tờ gì
CASE = {
    'Du_lieu_nhan_su_Dom_Sang_Edu': dict(
        name='CÔNG TY TNHH ĐỐM SÁNG EDU',
        miss={'DS007': ['Giấy khám sức khỏe', 'Xác nhận thông tin cư trú'], 'DS006': ['Bằng cấp, chứng chỉ'], 'DS009': ['Cam kết bảo mật, nội quy']},
        na={'DS001': ['Đơn xin việc']},
        note={'DS007': 'Mới vào 05/10/2026 – hẹn nộp đủ trong tháng 11', 'DS003': 'Đã nghỉ việc 02/10/2026 – lưu hồ sơ theo quy chế'},
        qt=[('DS001', 'Học vấn', '2004-09', '2008-06', 'Cử nhân Quản trị kinh doanh', 'Trường Đại học Kinh tế Quốc dân'),
            ('DS001', 'Công tác trước', '2008-07', '2019-02', 'Trưởng phòng đào tạo', 'Trung tâm đào tạo nghề tư thục (hư cấu)'),
            ('DS002', 'Học vấn', '2004-09', '2008-06', 'Cử nhân Kế toán', 'Học viện Tài chính'),
            ('DS002', 'Chứng chỉ', '2015-03', '2015-12', 'Chứng chỉ kế toán trưởng', 'Bộ Tài chính tổ chức bồi dưỡng'),
            ('DS005', 'Học vấn', '2009-09', '2013-06', 'Cử nhân Marketing', 'Trường Đại học Thương mại'),
            ('DS005', 'Khen thưởng', '2025-12', '2025-12', 'Hoàn thành vượt chỉ tiêu tuyển sinh năm 2025', 'Đốm Sáng Edu'),
            ('DS006', 'Học vấn', '2018-09', '2022-06', 'Cử nhân Quan hệ công chúng', 'Học viện Báo chí và Tuyên truyền'),
            ('DS007', 'Học vấn', '2016-09', '2020-06', 'Kỹ sư Công nghệ thông tin', 'Trường Đại học Bách khoa Hà Nội'),
            ('DS007', 'Công tác trước', '2020-08', '2026-09', 'Lập trình viên', 'Công ty phần mềm (hư cấu)'),
            ('DS008', 'Học vấn', '2010-09', '2014-06', 'Cử nhân Sư phạm Tin học', 'Trường Đại học Sư phạm Hà Nội'),
            ('DS008', 'Khen thưởng', '2025-11', '2025-11', 'Giảng viên được học viên đánh giá cao nhất năm', 'Đốm Sáng Edu'),
            ('DS009', 'Học vấn', '2016-09', '2020-06', 'Cử nhân Truyền thông đa phương tiện', 'Trường Đại học FPT')]),
    'Du_lieu_nhan_su_Dom_Sang_Health': dict(
        name='CÔNG TY TNHH ĐỐM SÁNG HEALTH',
        miss={'SG005': ['Giấy khám sức khỏe', 'Sơ yếu lý lịch'], 'SG007': ['Ảnh 3x4']},
        na={'SG001': ['Đơn xin việc'], 'SG005': ['Bằng cấp, chứng chỉ'], 'SG007': ['Bằng cấp, chứng chỉ']},
        note={'SG005': 'Mới vào 14/09/2026 – chưa nộp sơ yếu lý lịch, giấy khám sức khỏe'},
        qt=[('SG001', 'Học vấn', '2002-09', '2007-06', 'Dược sĩ đại học', 'Trường Đại học Y Dược TP Hồ Chí Minh'),
            ('SG001', 'Công tác trước', '2007-08', '2022-02', 'Trưởng phòng nghiên cứu sản phẩm', 'Công ty dược phẩm (hư cấu)'),
            ('SG002', 'Học vấn', '2010-09', '2014-06', 'Cử nhân Kế toán', 'Trường Đại học Kinh tế TP Hồ Chí Minh'),
            ('SG003', 'Học vấn', '2008-09', '2011-06', 'Cao đẳng Quản trị kho vận', 'Trường Cao đẳng Kinh tế Đối ngoại'),
            ('SG004', 'Học vấn', '2018-09', '2022-06', 'Cử nhân Công nghệ sinh học', 'Trường Đại học Khoa học Tự nhiên TP Hồ Chí Minh'),
            ('SG006', 'Khen thưởng', '2025-12', '2025-12', 'Tổ sản xuất không để xảy ra sự cố an toàn cả năm', 'Đốm Sáng Health')])
}
def as_date(v):
    if isinstance(v, dt.datetime): return v.date()
    if isinstance(v, dt.date): return v
    if isinstance(v, str):
        try: return dt.datetime.strptime(v.strip(), '%d/%m/%Y').date()
        except ValueError: return None
    return None
# Người thân liên hệ (hư cấu) + số con từ 6 tuổi trở xuống, tại 31/10/2026
FAM = {
    'DS001': (1, 'Trần Thị Hồng Nhung', 'Vợ'), 'DS002': (1, 'Lê Văn Phong', 'Chồng'), 'DS003': (0, 'Lê Văn Tâm', 'Bố'), 'DS004': (1, 'Đỗ Minh Quân', 'Chồng'),
    'DS005': (2, 'Nguyễn Thị Thanh Bình', 'Vợ'), 'DS006': (0, 'Vũ Văn Sơn', 'Bố'), 'DS007': (0, 'Đặng Thị Hạnh', 'Mẹ'), 'DS008': (0, 'Bùi Thị Ngọc', 'Vợ'), 'DS009': (0, 'Ngô Thị Lan', 'Mẹ'),
    'SG001': (1, 'Phạm Thị Thu Trang', 'Vợ'), 'SG002': (1, 'Trần Minh Đức', 'Chồng'), 'SG003': (0, 'Nguyễn Văn Lợi', 'Anh'), 'SG004': (0, 'Huỳnh Văn Thành', 'Bố'),
    'SG005': (0, 'Phan Thị Mai', 'Mẹ'), 'SG006': (2, 'Trương Thị Kiều', 'Vợ'), 'SG007': (0, 'Võ Văn Tài', 'Bố')}
FAMH = ['Số con từ 6 tuổi trở xuống', 'Người thân liên hệ', 'Quan hệ với người thân', 'SĐT người thân liên hệ']
from openpyxl.styles import Font, Alignment
for folder, c in CASE.items():
    root = os.path.join(M.OUT, folder)
    p_nv = os.path.join(root, '01_Ho_so_nhan_su', 'Danh_sach_nhan_vien.xlsx'); wbn = load_workbook(p_nv); wsn = wbn.worksheets[0]
    hd0 = [wsn.cell(row=5, column=k).value for k in range(1, wsn.max_column + 1)]
    if FAMH[0] not in hd0:
        c0 = len([h for h in hd0 if h]) + 1; src = wsn.cell(row=5, column=1)
        for j, h in enumerate(FAMH):
            x = wsn.cell(row=5, column=c0 + j, value=h); x.font = Font(bold=True); x.fill = M.HFILL; x.border = M.BOX; x.alignment = Alignment(wrap_text=True, vertical='center', horizontal='center')
            wsn.column_dimensions[M.get_column_letter(c0 + j)].width = 16 if j != 1 else 24
        for r in range(6, wsn.max_row + 1):
            i = wsn.cell(row=r, column=1).value
            if not i or str(i) not in FAM: continue
            k = list(FAM).index(str(i)); n, ten, qh = FAM[str(i)]
            for j, v in enumerate([n, ten, qh, '09000002%02d' % (k + 1)]):
                x = wsn.cell(row=r, column=c0 + j, value=v); x.border = M.BOX
                if j == 3: x.number_format = '@'
        wbn.save(p_nv); print('  ✓', folder + '/01_Ho_so_nhan_su/Danh_sach_nhan_vien.xlsx (+4 cột người thân)')
    ws = load_workbook(p_nv, data_only=True).worksheets[0]
    hdr = [ws.cell(row=5, column=k).value for k in range(1, ws.max_column + 1)]
    ix = {h: k for k, h in enumerate(hdr) if h}
    staff = []
    for r in ws.iter_rows(min_row=6, values_only=True):
        if r[ix['Mã NV']] and str(r[ix['Mã NV']])[:2] in ('DS', 'SG'): staff.append((str(r[ix['Mã NV']]), r[ix['Họ và tên']], as_date(r[ix['Ngày vào làm']])))
    rows = []
    for k, (i, n, v) in enumerate(staff):
        sub = (v - dt.timedelta(days=3 + k % 4)).strftime('%d/%m/%Y') if v else ''
        row = [i, n]
        for d in DOCS:
            if d == 'CV': row.append(NA)  # 07/11: CV tạm mặc định Không áp dụng với mọi người
            elif d in c['na'].get(i, []): row.append(NA)
            elif d in c['miss'].get(i, []): row.append(None)
            else: row.append(v.strftime('%d/%m/%Y') if d == 'Cam kết bảo mật, nội quy' and v else sub)
        row.append(c['note'].get(i))
        rows.append(row)
    M.CT_NAME = c['name']
    wb = Workbook()
    M.sheet(wb, 'Giay_to', 'HỒ SƠ GIẤY TỜ NHÂN SỰ', 'Ghi ngày nộp (dd/mm/yyyy) · "Không áp dụng" nếu vị trí không cần · để trống = còn thiếu · ' + M.NOTE,
            ['Mã NV', 'Họ và tên'] + DOCS + ['Ghi chú hồ sơ'], rows, widths={'Ghi chú hồ sơ': 40}, first=True)
    qt = [['QT%03d' % (k + 1), x[0], next((s[1] for s in staff if s[0] == x[0]), ''), x[1], x[2][5:] + '/' + x[2][:4], x[3][5:] + '/' + x[3][:4], x[4], x[5], None] for k, x in enumerate(c['qt'])]
    M.sheet(wb, 'Qua_trinh', 'QUÁ TRÌNH HỌC TẬP, CÔNG TÁC, KHEN THƯỞNG', 'Mỗi dòng 1 mục · Loại quá trình: Học vấn / Chứng chỉ / Công tác trước / Khen thưởng / Kỷ luật · ' + M.NOTE,
            ['Mã dòng', 'Mã NV', 'Họ và tên', 'Loại quá trình', 'Từ tháng', 'Đến tháng', 'Nội dung', 'Nơi', 'Ghi chú'], qt, widths={'Nội dung': 44, 'Nơi': 40})
    M.save(wb, root, '01_Ho_so_nhan_su', 'Ho_so_giay_to.xlsx')
print('Xong. Tiếp theo: node tao-du-lieu-mau.js  →  node build.js')
