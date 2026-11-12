# 11/11/2026: Kho hàng, Xưởng Sản xuất chuyển sang khối sản xuất (xếp ca, nghỉ 1 ngày/tuần không cố định)
# → bỏ các dòng chấm công đi làm thường (X / trống) của 2 bộ phận này trong file mẫu; app tự sinh lượt chấm theo lịch xếp ca.
# Giữ dòng có ký hiệu khác (TB, P, Ô...) vì là sự kiện/đơn nghỉ. Dữ liệu mẫu hư cấu.
import glob, os, openpyxl
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'du-lieu-mau', 'Du_lieu_nhan_su_Dom_Sang_Health', '03_Cham_cong')
for f in sorted(glob.glob(os.path.join(D, 'Cham_cong_2026_*.xlsx'))):
    wb = openpyxl.load_workbook(f); ws = wb.active; H = [c.value for c in ws[5]]
    iPB, iK = H.index('Phòng ban') + 1, H.index('Ký hiệu') + 1; rm = []
    for r in range(6, ws.max_row + 1):
        pb = ws.cell(r, iPB).value; k = str(ws.cell(r, iK).value or '').strip().upper()
        if pb in ('Kho hàng', 'Xưởng Sản xuất') and k in ('', 'X'): rm.append(r)
    for r in reversed(rm): ws.delete_rows(r)
    n = 0
    for r in range(6, ws.max_row + 1):
        if ws.cell(r, 4).value: n += 1; ws.cell(r, 1).value = n
    wb.save(f); print(os.path.basename(f), 'bỏ', len(rm), 'dòng, còn', n)
