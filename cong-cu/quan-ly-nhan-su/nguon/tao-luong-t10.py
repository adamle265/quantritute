# -*- coding: utf-8 -*-
# Bổ sung BẢNG LƯƠNG THÁNG 10/2026 (đã hoàn thành) vào dữ liệu mẫu 2 công ty – anh yêu cầu 07/11/2026 17:42
# Dùng đúng hàm payroll() của bộ sinh dữ liệu mẫu, tính từ file chấm công tháng 10 đang có. Thêm sheet Luong_T10 vào 05_Luong/Bang_luong_2026.xlsx.
# Chạy: cd nguon → python tao-luong-t10.py → node tao-du-lieu-mau.js → node build.js   (chạy lại được: sheet cũ bị thay)
import os, importlib.util, openpyxl
H = os.path.dirname(os.path.abspath(__file__))
def load(f, name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(H, f)); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
for co, f in (('Edu', 'tao-kho-du-lieu-mau.py'), ('Health', 'tao-kho-du-lieu-mau-health.py')):
    mod = load(f, 'm_' + co); M = mod if co == 'Edu' else mod.M
    base = os.path.join(H, 'du-lieu-mau', 'Du_lieu_nhan_su_Dom_Sang_' + co)
    ws = openpyxl.load_workbook(os.path.join(base, '03_Cham_cong', 'Cham_cong_2026_10.xlsx'), read_only=True).worksheets[0]
    rows = [r for r in ws.iter_rows(min_row=6, values_only=True) if r[1] is not None and hasattr(r[1], 'weekday') and r[3]]
    tu = M.TAMUNG10 if co == 'Edu' else {}
    bl = M.payroll(2026, 10, rows, tu)
    p = os.path.join(base, '05_Luong', 'Bang_luong_2026.xlsx'); wb = openpyxl.load_workbook(p)
    if 'Luong_T10' in wb.sheetnames: del wb['Luong_T10']
    M.sheet(wb, 'Luong_T10', 'BẢNG THANH TOÁN TIỀN LƯƠNG THÁNG 10/2026', M.T3_BL, M.BLH, bl, money=M.MONEY, first=False, tail=M.bl_tail, widths={'Ghi chú': 36})
    wb.save(p); print(co, 'T10:', len(bl), 'người, tổng thực lĩnh', sum(r[M.BLH.index('Thực lĩnh')] or 0 for r in bl))
