# -*- coding: utf-8 -*-
"""
DỮ LIỆU MẪU CÔNG TY THỨ 2 (hư cấu) – Công ty TNHH Đốm Sáng Health, đơn vị ĐỘC LẬP với Công ty TNHH Đốm Sáng Edu (06/11/2026: anh chốt 2 công ty độc lập, không phải mẹ – con).
Dùng chung bộ máy sinh dữ liệu của tao-kho-du-lieu-mau.py, chỉ thay phần dữ liệu riêng của công ty.
Chạy: python tao-kho-du-lieu-mau-cty-con.py  (sau khi chạy tao-kho-du-lieu-mau.py) → node tao-du-lieu-mau.js → node build.js
Kịch bản: bán sản phẩm thảo dược chăm sóc sức khỏe – RnD, Xưởng Sản xuất, Kho hàng, 7 người. Tình huống: thử việc sắp hết hạn, tăng ca gần trần tháng,
kế toán sắp hết phép năm, nhân viên mới chưa có số tài khoản, 1 HĐ xác định thời hạn lần 2 (lần tới bắt buộc không xác định thời hạn).
"""
import os, importlib.util, datetime as dt
H = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('mau', os.path.join(H, 'tao-kho-du-lieu-mau.py')); M = importlib.util.module_from_spec(spec); spec.loader.exec_module(M)
D = dt.date; hd = M.hd; TV, X12, X24, X36, KXD = M.TV, M.X12, M.X24, M.X36, M.KXD

M.CT_NAME = 'CÔNG TY TNHH ĐỐM SÁNG HEALTH'
M.MAIN = os.path.join(M.OUT, 'Du_lieu_nhan_su_Dom_Sang_Health')
M.NOTE = 'DỮ LIỆU MẪU HƯ CẤU – tên, CCCD, số sổ BHXH, số tài khoản đều tự đặt'
# 06/11/2026: Đốm Sáng Health – bán sản phẩm thảo dược chăm sóc sức khỏe (anh chốt bộ phận: RnD, Sản xuất, Kho hàng)
M.PB = [('RND', 'Phòng RnD', 'SG001', 2), ('SX', 'Xưởng Sản xuất', 'SG006', 4), ('KHO', 'Kho hàng', 'SG003', 2)]
M.PBN = {p[0]: p[1] for p in M.PB}
M.NV = [
 ('SG001', 'Lý Thanh Tùng', 'Nam', D(1984, 9, 2), 'RND', 'Giám đốc', 'Giám đốc (kiêm phụ trách RnD)', D(2022, 3, 1), 'Đại học', 'Đã kết hôn', 1, 'ACB', 'Đang làm việc', None, 'TP Hồ Chí Minh', 'Số 18 đường Trần Quang Khải, phường Tân Định, TP Hồ Chí Minh'),
 ('SG002', 'Trịnh Thị Kim Ngân', 'Nữ', D(1992, 12, 6), 'KHO', 'Nhân viên', 'Kế toán kho (kiêm kế toán – nhân sự)', D(2022, 3, 15), 'Đại học', 'Đã kết hôn', 1, 'Vietcombank', 'Đang làm việc', None, 'Đồng Nai', 'Số 42 đường Nguyễn Văn Đậu, phường Bình Thạnh, TP Hồ Chí Minh'),
 ('SG003', 'Đoàn Minh Trí', 'Nam', D(1990, 4, 21), 'KHO', 'Trưởng phòng', 'Trưởng kho hàng', D(2022, 4, 1), 'Đại học', 'Đã kết hôn', 2, 'Techcombank', 'Đang làm việc', None, 'Cần Thơ', 'Số 9 đường Lê Văn Sỹ, phường Phú Nhuận, TP Hồ Chí Minh'),
 ('SG004', 'Huỳnh Ngọc Hân', 'Nữ', D(2000, 11, 15), 'RND', 'Nhân viên', 'Chuyên viên nghiên cứu sản phẩm', D(2024, 2, 19), 'Đại học', 'Độc thân', 0, 'VPBank', 'Đang làm việc', None, 'Tây Ninh', 'Số 120 đường Cách Mạng Tháng Tám, phường Bàn Cờ, TP Hồ Chí Minh'),
 ('SG005', 'Phan Gia Bảo', 'Nam', D(2003, 7, 30), 'SX', 'Nhân viên', 'Công nhân sản xuất', D(2026, 9, 14), 'Cao đẳng', 'Độc thân', 0, 'MB Bank', 'Đang làm việc', None, 'An Giang', 'Số 7 hẻm 51 đường Cao Thắng, phường Bàn Cờ, TP Hồ Chí Minh'),
 ('SG006', 'Lê Văn Phát', 'Nam', D(1987, 3, 8), 'SX', 'Phụ trách bộ phận', 'Tổ trưởng sản xuất', D(2022, 5, 1), 'Trung cấp', 'Đã kết hôn', 2, 'Agribank', 'Đang làm việc', None, 'Đắk Lắk', 'Số 3 đường Phạm Văn Chiêu, phường An Hội Tây, TP Hồ Chí Minh'),
 ('SG007', 'Võ Thành Đạt', 'Nam', D(1998, 1, 25), 'SX', 'Nhân viên', 'Công nhân sản xuất', D(2023, 8, 1), 'Trung cấp', 'Độc thân', 0, 'Agribank', 'Đang làm việc', None, 'TP Hồ Chí Minh', 'Số 66 đường Quang Trung, phường Gò Vấp, TP Hồ Chí Minh'),
]
M.E = {n[0]: n for n in M.NV}; M.ID = [n[0] for n in M.NV]
M.HD = [
 hd('01/2022/HĐLĐ-SG', 'SG001', X12, D(2022, 2, 25), D(2022, 3, 1), D(2023, 2, 28), 25000000),
 hd('02/2023/HĐLĐ-SG', 'SG001', KXD, D(2023, 2, 24), D(2023, 3, 1), None, 25000000),
 hd('01/2022/HĐTV-SG', 'SG002', TV, D(2022, 3, 14), D(2022, 3, 15), D(2022, 5, 13), 10000000),
 hd('03/2022/HĐLĐ-SG', 'SG002', X24, D(2022, 5, 12), D(2022, 5, 14), D(2024, 5, 13), 12000000),
 hd('04/2024/HĐLĐ-SG', 'SG002', KXD, D(2024, 5, 10), D(2024, 5, 14), None, 14000000),
 hd('04/2022/HĐLĐ-SG', 'SG003', X24, D(2022, 3, 30), D(2022, 4, 1), D(2024, 3, 31), 11000000),
 hd('03/2024/HĐLĐ-SG', 'SG003', KXD, D(2024, 3, 28), D(2024, 4, 1), None, 13000000),
 hd('01/2024/HĐTV-SG', 'SG004', TV, D(2024, 2, 16), D(2024, 2, 19), D(2024, 4, 18), 7000000),
 hd('05/2024/HĐLĐ-SG', 'SG004', X24, D(2024, 4, 17), D(2024, 4, 19), D(2026, 4, 18), 8000000),
 hd('02/2026/HĐLĐ-SG', 'SG004', X12, D(2026, 4, 16), D(2026, 4, 19), D(2027, 4, 18), 8500000),
 hd('04/2026/HĐTV-SG', 'SG005', TV, D(2026, 9, 11), D(2026, 9, 14), D(2026, 11, 12), 6800000),
 hd('05/2022/HĐLĐ-SG', 'SG006', X36, D(2022, 4, 28), D(2022, 5, 1), D(2025, 4, 30), 9500000),
 hd('03/2025/HĐLĐ-SG', 'SG006', KXD, D(2025, 4, 25), D(2025, 5, 1), None, 11000000),
 hd('02/2023/HĐTV-SG', 'SG007', TV, D(2023, 7, 28), D(2023, 8, 1), D(2023, 8, 30), 7500000),
 hd('06/2023/HĐLĐ-SG', 'SG007', X24, D(2023, 8, 29), D(2023, 8, 31), D(2025, 8, 30), 8500000),
 hd('05/2025/HĐLĐ-SG', 'SG007', KXD, D(2025, 8, 27), D(2025, 8, 31), None, 9000000),
]
M.LS = [
 (None, None, D(2022, 3, 1), 'SG001', 25000000, 'Lương khởi điểm khi tiếp nhận'),
 ('01/2025/QĐ-SG', D(2024, 12, 26), D(2025, 1, 1), 'SG001', 28000000, 'Điều chỉnh lương định kỳ năm 2025'),
 (None, None, D(2022, 3, 15), 'SG002', 12000000, 'Lương khởi điểm khi tiếp nhận'),
 ('02/2024/QĐ-SG', D(2024, 5, 10), D(2024, 5, 14), 'SG002', 14000000, 'Điều chỉnh khi ký HĐ không xác định thời hạn'),
 (None, None, D(2022, 4, 1), 'SG003', 11000000, 'Lương khởi điểm khi tiếp nhận'),
 ('03/2024/QĐ-SG', D(2024, 3, 28), D(2024, 4, 1), 'SG003', 13000000, 'Điều chỉnh khi ký HĐ không xác định thời hạn'),
 (None, None, D(2024, 2, 19), 'SG004', 8000000, 'Lương khởi điểm khi tiếp nhận'),
 ('01/2026/QĐ-SG', D(2026, 4, 16), D(2026, 4, 19), 'SG004', 8500000, 'Điều chỉnh khi ký HĐ lần 2'),
 (None, None, D(2026, 9, 14), 'SG005', 8000000, 'Lương khởi điểm khi tiếp nhận'),
 (None, None, D(2022, 5, 1), 'SG006', 9500000, 'Lương khởi điểm khi tiếp nhận'),
 ('02/2025/QĐ-SG', D(2025, 4, 25), D(2025, 5, 1), 'SG006', 11000000, 'Điều chỉnh khi ký HĐ không xác định thời hạn'),
 (None, None, D(2023, 8, 1), 'SG007', 8500000, 'Lương khởi điểm khi tiếp nhận'),
 ('03/2025/QĐ-SG', D(2025, 8, 27), D(2025, 8, 31), 'SG007', 9000000, 'Điều chỉnh khi ký HĐ không xác định thời hạn'),
]
M.GD = 'Lý Thanh Tùng'
M.MOVE_TEAM = []; M.TS_IDS = []
M.PB_NOTE = 'Cơ cấu tổ chức áp dụng từ 01/01/2026'
M.CC_NOTES = {m: 'Dữ liệu xuất từ máy chấm công xưởng, đã đối chiếu đơn nghỉ' for m in (8, 9, 10)}
M.XANG = {'KHO': 500000}; M.XANG_ID = {}
M.DTHOAI = {'SG001': 500000, 'SG003': 300000, 'SG006': 300000}
M.NO_BHXH = []; M.NO_STK = ['SG005']; M.QP_SKIP = []
M.TAMUNG = {8: {}, 9: {'SG007': 1500000}}; M.TAMUNG10 = {}; M.SAI10 = {}
M.KOFF = 20; M.EXTRA = False
M.KPI = {('SG003', 8): 1500000, ('SG003', 9): 2000000, ('SG003', 10): 1800000, ('SG006', 8): 700000, ('SG006', 9): 900000, ('SG006', 10): 1100000, ('SG005', 10): 400000}
# đơn nghỉ + sự kiện chấm công
M.DON = []; M.EV = {}
PN = M.PN
for i, a, b, ly in [('SG001', D(2026, 4, 27), D(2026, 4, 29), 'Việc gia đình'), ('SG002', D(2026, 3, 23), D(2026, 3, 27), 'Về quê'),
                    ('SG002', D(2026, 6, 8), D(2026, 6, 10), 'Đi du lịch cùng gia đình'), ('SG003', D(2026, 7, 20), D(2026, 7, 21), 'Việc gia đình'),
                    ('SG004', D(2026, 5, 18), D(2026, 5, 19), 'Về quê'), ('SG006', D(2026, 6, 15), D(2026, 6, 16), 'Việc gia đình'),
                    ('SG007', D(2026, 7, 6), D(2026, 7, 8), 'Về quê')]:
    M.don(i, PN, a, b, ly)
M.pdon('SG002', D(2026, 8, 17), D(2026, 8, 18), 'Việc gia đình')
M.pdon('SG002', D(2026, 9, 28), D(2026, 9, 28), 'Việc cá nhân')          # cố ý: còn 1 ngày phép năm
M.pdon('SG004', D(2026, 10, 9), D(2026, 10, 9), 'Việc cá nhân')
M.pdon('SG006', D(2026, 9, 11), D(2026, 9, 11), 'Việc gia đình')
M.pdon('SG001', D(2026, 8, 24), D(2026, 8, 24), 'Việc gia đình')
M.don('SG007', PN, D(2026, 11, 16), D(2026, 11, 17), 'Về quê dự đám giỗ', st='Chờ duyệt', tao=D(2026, 10, 30))
M.ev('SG003', D(2026, 10, 21), D(2026, 10, 22), 'CT', 'Ra Hà Nội họp tổng kết quý tại công ty mẹ')
M.ev('SG001', D(2026, 10, 21), D(2026, 10, 22), 'CT', 'Ra Hà Nội họp tổng kết quý tại công ty mẹ')
M.LATE = {('SG004', D(2026, 10, 12)): 8, ('SG004', D(2026, 10, 26)): 6, ('SG007', D(2026, 9, 16)): 15, ('SG005', D(2026, 10, 5)): 10}
M.OT = {}
for i, days, h in [('SG006', [D(2026, 8, k) for k in (5, 12, 19, 26, 27)], 2), ('SG006', [D(2026, 9, k) for k in (8, 9, 16, 22, 23, 30)], 2),
                   ('SG006', [D(2026, 10, k) for k in (1, 2, 6, 7, 8, 13, 14, 20, 21, 27)], 2),
                   ('SG007', [D(2026, 8, k) for k in (12, 26)], 2), ('SG007', [D(2026, 9, k) for k in (16, 23)], 2), ('SG007', [D(2026, 10, k) for k in (7, 14, 21, 27, 28)], 2)]:
    for d in days: M.OT[(i, d)] = h
M.SUN_NOTE = 'Sản xuất bổ sung đơn hàng cuối tuần'
M.SUN_OT = {('SG006', D(2026, 10, 18)): 8, ('SG006', D(2026, 10, 25)): 8, ('SG007', D(2026, 10, 18)): 8, ('SG006', D(2026, 9, 20)): 6}
if __name__ == '__main__':
    print('Tạo dữ liệu mẫu công ty con →', M.MAIN)
    M.build()
    print('Xong. Tiếp theo: node tao-du-lieu-mau.js  →  node build.js')
