# 11/11/2026: bổ sung / chỉnh cột Tổ/Ca trong danh sách nhân viên mẫu (dữ liệu hư cấu) – khớp khối văn phòng / sản xuất
import os, openpyxl
B = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'du-lieu-mau')
FIX = {'Health': {'SG002': 'Tổ kho – theo lịch xếp ca', 'SG003': 'Tổ kho – theo lịch xếp ca', 'SG005': 'Tổ sản xuất – theo lịch xếp ca', 'SG006': 'Tổ sản xuất – theo lịch xếp ca', 'SG007': 'Tổ sản xuất – theo lịch xếp ca',
                  'SG008': 'Tổ đóng gói 1 – theo lịch xếp ca', 'SG009': 'Tổ đóng gói 1 – theo lịch xếp ca', 'SG010': 'Tổ đóng gói 2 – theo lịch xếp ca', 'SG011': 'Tổ đóng gói 2 – theo lịch xếp ca', 'SG012': 'Tổ máy đóng gói – theo lịch xếp ca', 'SG013': 'Tổ máy đóng gói – theo lịch xếp ca'},
       'Edu': {'DS010': 'Bán thời gian – buổi chiều', 'DS011': 'Cộng tác viên – theo lịch giảng'}}
for co, fx in FIX.items():
    f = os.path.join(B, 'Du_lieu_nhan_su_Dom_Sang_' + co, '01_Ho_so_nhan_su', 'Danh_sach_nhan_vien.xlsx'); wb = openpyxl.load_workbook(f); ws = wb.active
    hr = next(r for r in range(1, 10) if 'Tổ/Ca' in [c.value for c in ws[r]]); H = [c.value for c in ws[hr]]; ci = H.index('Tổ/Ca') + 1
    for r in range(hr + 1, ws.max_row + 1):
        id = ws.cell(r, 1).value
        if id in fx: ws.cell(r, ci).value = fx[id]
    wb.save(f); print(co, 'xong')
