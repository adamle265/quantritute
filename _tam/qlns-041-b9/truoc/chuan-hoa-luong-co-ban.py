# -*- coding: utf-8 -*-
"""
10/11/2026 (anh yêu cầu 08:16): làm sạch dữ liệu mẫu theo mô hình lương mới – HĐ / quyết định lương ghi ĐÚNG lương cơ bản (căn cứ đóng BHXH),
phần còn lại của mức thu nhập thỏa thuận là LƯƠNG HIỆU SUẤT trả theo quy chế (NĐ 158/2025 Điều 7.1.a: lương đóng BHXH là mức lương ghi trong HĐLĐ).

  Lương cơ bản = max(lương tối thiểu vùng I tại thời điểm, 40% mức thu nhập thỏa thuận, làm tròn lên 100.000)
     → nhân viên đóng ở mức tối thiểu vùng, cấp quản lý cao hơn nhưng không đóng trên toàn bộ thu nhập
  Lương tối thiểu vùng I: 4.180.000 (2019 – NĐ 157/2018) · 4.420.000 (01/01/2020 – NĐ 90/2019) · 4.680.000 (01/07/2022 – NĐ 38/2022)
                          4.960.000 (01/07/2024 – NĐ 74/2024) · 5.310.000 (01/01/2026 – NĐ 293/2025)
     → tự thêm quyết định "điều chỉnh theo lương tối thiểu vùng" khi lương cơ bản đang thấp hơn mức mới
  Lương hiệu suất (bảng lương T08–T10) = (thu nhập thỏa thuận − lương cơ bản) × ngày công hưởng lương ÷ công chuẩn, chịu thuế, không đóng BHXH

Sửa: 02_Hop_dong/So_theo_doi_hop_dong.xlsx (cột Mức lương theo HĐ), 02_Hop_dong/Lich_su_dieu_chinh_luong.xlsx (dựng lại theo lương cơ bản),
     05_Luong/Bang_luong_2026.xlsx (Luong_T08–T10 tính lại, thêm cột Lương hiệu suất), thang-moi/Bang_luong_2026_T10.xlsx (Edu).
Giữ nguyên: DS010 (bán thời gian), DS011 (cộng tác viên) – lương HĐ là toàn bộ thù lao.
In ra bảng THU NHẬP THỎA THUẬN từng người (dán vào luong.js – lgSample, LG_PKG).
Chạy: cd nguon → python chuan-hoa-luong-co-ban.py → node tao-du-lieu-mau.js → node build.js   (chạy lại được: luôn tính từ số liệu gốc trong bộ sinh)
"""
import os, math, importlib.util, datetime as dt, openpyxl
D = dt.date
H = os.path.dirname(os.path.abspath(__file__))
MINW = [(D(2019, 1, 1), 4180000, 'NĐ 157/2018'), (D(2020, 1, 1), 4420000, 'NĐ 90/2019'), (D(2022, 7, 1), 4680000, 'NĐ 38/2022'), (D(2024, 7, 1), 4960000, 'NĐ 74/2024'), (D(2026, 1, 1), 5310000, 'NĐ 293/2025')]
def minw(d):
    v = MINW[0][1]
    for s, m, _ in MINW:
        if d >= s: v = m
    return v
def cbv(pkg, d): return max(minw(d), int(math.ceil(pkg * 0.4 / 100000.0)) * 100000)
def load(f, name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(H, f)); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m
def cols(ws):
    for r in range(1, 10):
        v = [c.value for c in ws[r]]
        if 'Mã NV' in v: return r, {h: i + 1 for i, h in enumerate(v) if h}
    raise Exception('không thấy dòng tiêu đề')

PKG_OUT = {}
for co, f in (('Edu', 'tao-kho-du-lieu-mau.py'), ('Health', 'tao-kho-du-lieu-mau-health.py')):
    mod = load(f, 'm_' + co); M = mod if co == 'Edu' else mod.M
    base = os.path.join(H, 'du-lieu-mau', 'Du_lieu_nhan_su_Dom_Sang_' + co)
    SUF = 'DS' if co == 'Edu' else 'SG'
    pkg = M.salary                      # thu nhập thỏa thuận theo bộ sinh gốc (HĐ thử việc / quyết định lương)
    # ---- 1) Lương cơ bản theo thời gian: các mốc HĐ thử việc, quyết định lương gốc, mốc tăng lương tối thiểu vùng ----
    LS2 = []                            # (số QĐ, ngày QĐ, hiệu lực, id, lương cơ bản mới, lý do)
    for i in M.ID:
        ev = sorted([x for x in M.LS if x[3] == i], key=lambda x: x[2])
        if not ev: continue
        start = ev[0][2]; cur = None
        pts = sorted(set([x[2] for x in ev] + [s for s, _, _ in MINW if s > start] + [h['hl'] for h in M.HD if h['id'] == i and h['loai'] != M.TV and h['hl'] > start]))
        for d in pts:
            if M.nghi(i) and d > M.nghi(i): break
            v = cbv(pkg(i, d), d)
            src = [x for x in ev if x[2] == d]
            if src:
                x = src[0]; LS2.append((x[0], x[1], d, i, v, x[5])); cur = v; continue
            if cur is not None and v != cur:
                mw = [m for m in MINW if m[0] == d]
                if mw: LS2.append(('TLTT-%d/QĐ-%s' % (d.year, SUF), d - dt.timedelta(days=5), d, i, v, 'Điều chỉnh lương cơ bản theo lương tối thiểu vùng mới (%s)' % mw[0][2]))
                else: LS2.append((None, None, d, i, v, 'Lương cơ bản theo HĐLĐ chính thức'))
                cur = v
    def cb_at(i, d):
        s = [x for x in sorted(LS2, key=lambda x: x[2]) if x[3] == i and x[2] <= d]
        return s[-1][4] if s else None
    # ---- 2) Sổ hợp đồng: Mức lương theo HĐ = lương cơ bản ----
    p = os.path.join(base, '02_Hop_dong', 'So_theo_doi_hop_dong.xlsx'); wb = openpyxl.load_workbook(p); ws = wb.active; hr, C = cols(ws); n = 0
    HDM = {h['so']: h for h in M.HD}
    for r in range(hr + 1, ws.max_row + 1):
        h = HDM.get(ws.cell(r, C['Số hợp đồng']).value)
        if not h: continue
        ws.cell(r, C['Mức lương theo HĐ']).value = cbv(h['luong'], h['hl']); n += 1
    wb.save(p); print(co, 'HĐ: sửa', n, 'dòng')
    # ---- 3) Lịch sử điều chỉnh lương: dựng lại (giữ dòng của người không có trong bộ sinh, ví dụ DS010, DS011) ----
    p = os.path.join(base, '02_Hop_dong', 'Lich_su_dieu_chinh_luong.xlsx'); old = openpyxl.load_workbook(p); ws = old.active; hr, C = cols(ws)
    HEAD = ['STT', 'Số quyết định', 'Ngày quyết định', 'Ngày hiệu lực', 'Mã NV', 'Họ và tên', 'Phòng ban', 'Chức danh', 'Lương cũ', 'Lương mới', 'Mức tăng', 'Tỷ lệ tăng (%)', 'Phụ cấp chức vụ', 'Lý do']
    keep = [[ws.cell(r, C[h]).value if h in C else None for h in HEAD] for r in range(hr + 1, ws.max_row + 1) if ws.cell(r, C['Mã NV']).value and ws.cell(r, C['Mã NV']).value not in M.ID]
    rows = []; prev = {}
    for x in sorted(LS2, key=lambda x: (x[2], x[3])):
        o = prev.get(x[3]); nw = x[4]
        rows.append([0, x[0], x[1], x[2], x[3], M.nm(x[3]), M.dept(x[3]), M.cdanh(x[3]), o, nw, (nw - o) if o else None, round((nw - o) / o * 100, 1) if o else None, M.pccv(x[3]), x[5]]); prev[x[3]] = nw
    rows += keep
    for k, r in enumerate(rows, 1): r[0] = k
    wb = openpyxl.Workbook()
    M.sheet(wb, 'Lich_su_luong', 'LỊCH SỬ ĐIỀU CHỈNH LƯƠNG', 'Lương cơ bản (căn cứ đóng BHXH, chưa gồm phụ cấp) theo từng quyết định; lương hiệu suất trả theo quy chế đánh giá · ' + M.NOTE, HEAD, rows, money=('Lương cũ', 'Lương mới', 'Mức tăng', 'Phụ cấp chức vụ'), first=True)
    wb.save(p); print(co, 'Lịch sử lương:', len(rows), 'dòng (', len(keep), 'dòng giữ nguyên )')
    # ---- 4) Bảng lương T08–T10 tính lại: lương cơ bản thấp + cột Lương hiệu suất ----
    BLH = list(M.BLH); BLH.insert(BLH.index('Lương thời gian') + 1, 'Lương hiệu suất'); MONEY = tuple(h for h in BLH if h not in M.NOT_MONEY)
    def bl_tail(ws, r):
        from openpyxl.styles import Font
        from openpyxl.utils import get_column_letter
        ws.cell(row=r, column=2, value='TỔNG CỘNG').font = Font(bold=True)
        for c, h in enumerate(BLH, 1):
            if h in MONEY:
                col = get_column_letter(c); x = ws.cell(row=r, column=c, value='=SUM(%s6:%s%d)' % (col, col, r - 1)); x.font = Font(bold=True); x.number_format = '#,##0'
        for col, t in ((2, 'Người lập biểu'), (13, 'Kế toán trưởng'), (24, 'Giám đốc')):
            ws.cell(row=r + 2, column=col, value=t).font = Font(bold=True); ws.cell(row=r + 3, column=col, value='(Ký, ghi rõ họ tên)')
    def payroll2(y, m, cc_rows, tam_ung=None, sai=None):
        tam_ung = tam_ung or {}; sai = sai or {}
        first = D(y, m, 1); last = D(y + (m == 12), m % 12 + 1, 1) - dt.timedelta(1)
        std = sum(1 for k in range(last.day) if (first + dt.timedelta(k)).weekday() < 5)
        out = []
        for i in M.ID:
            if not (M.vao(i) <= last and (M.nghi(i) is None or M.nghi(i) >= first)): continue
            mine = [r for r in cc_rows if r[3] == i]
            def cnt(code, sun=False): return sum(1 for r in mine if r[14] == code and ((r[1].weekday() == 6) == sun))
            cong = cnt('X') + cnt('CT') + cnt('TB'); sunw = cnt('X', True)
            p_, rr, l, o, ts, kl = cnt('P'), cnt('R'), cnt('L'), cnt('Ô'), cnt('TS'), cnt('KL') + cnt('KP')
            ot_n = sum(r[12] or 0 for r in mine if r[13] == 'Ngày thường'); ot_c = sum(r[12] or 0 for r in mine if r[13] == 'Chủ nhật')
            lcb = cb_at(i, last); pc = M.pccv(i)
            if i in sai: lcb = cbv(sai[i], last)            # bảng lương cố ý dùng mức cũ (thử bước kiểm tra trước khi nạp)
            full = cong + p_ + rr + l
            ltg = round((lcb + pc) / std * full)
            hs_mt = max(0, (sai.get(i) or pkg(i, last)) - lcb); hs = round(hs_mt / std * full / 1000) * 1000
            hour = (lcb + pc + hs_mt) / std / 8; tc = round(hour * (1.5 * ot_n + 2 * ot_c)); tc_free = tc
            anca = 30000 * (cong + sunw)
            def pro(x): return x if full >= std / 2 else M.r1000(x * full / std)
            xang = 0 if ts else pro(M.XANG_ID.get(i, M.XANG.get(M.E[i][4], 0)))
            dthoai = 0 if ts else pro(M.DTHOAI.get(i, 0))
            lates = sum(1 for r in mine if r[11])
            cc_ok = M.E[i][5] in ('Nhân viên', 'Phụ trách bộ phận')
            chuyencan = 300000 if (cc_ok and not ts and lates == 0 and o == 0 and kl == 0 and M.vao(i) <= first and (M.nghi(i) is None or M.nghi(i) >= last)) else 0
            kpi = M.KPI.get((i, m), 0)
            tong = ltg + hs + tc + anca + xang + dthoai + chuyencan + kpi
            prob = M.on_prob(i, last)
            dong_bh = 0 if (ts or prob or full < 14) else min(lcb + pc, 46800000)
            bhxh, bhyt, bhtn = round(dong_bh * .08), round(dong_bh * .015), round(dong_bh * .01)
            chiu = max(0, tong - min(anca, 1200000) - tc_free)
            npt = M.E[i][10]; gt = 15500000 + 6200000 * npt; note = None
            if prob:
                tinh = chiu; thue = round(chiu * .10) if tong >= 5000000 else 0; gt_show = 0
                note = 'Thử việc – khấu trừ 10% (giả định, đơn vị rà lại)'
            else:
                tinh = max(0, chiu - bhxh - bhyt - bhtn - gt); thue = M.pit(tinh); gt_show = gt
            if ts: note = 'Nghỉ thai sản – BHXH chi trả'
            if M.nghi(i) and first <= M.nghi(i) <= last: note = 'Nghỉ việc từ %s – thanh toán đến ngày nghỉ' % M.nghi(i).strftime('%d/%m/%Y')
            tu = tam_ung.get(i, 0); thuc = tong - bhxh - bhyt - bhtn - thue - tu
            k = M.ID.index(i) + 1 + M.KOFF
            out.append([i, M.nm(i), M.dept(i), M.cdanh(i), lcb, pc, std, cong, p_ + rr, l, o, kl, ts, ltg, hs, ot_n, ot_c, tc, 0, 0, anca, xang, dthoai, chuyencan, kpi,
                        tong, dong_bh, bhxh, bhyt, bhtn, 0, chiu, npt, gt_show, tinh, thue, tu, thuc, M.stk(k), M.E[i][11], note])
        return out
    def ccrows(m):
        ws = openpyxl.load_workbook(os.path.join(base, '03_Cham_cong', 'Cham_cong_2026_%02d.xlsx' % m), read_only=True).worksheets[0]
        return [r for r in ws.iter_rows(min_row=6, values_only=True) if r[1] is not None and hasattr(r[1], 'weekday') and r[3]]
    T3 = 'Đơn vị tính: đồng. Lương cơ bản = mức lương ghi trên HĐ / quyết định lương (căn cứ đóng BHXH); lương hiệu suất trả theo quy chế đánh giá, không đóng BHXH, chịu thuế · ' + M.NOTE
    p = os.path.join(base, '05_Luong', 'Bang_luong_2026.xlsx'); wb = openpyxl.Workbook()
    TU = {8: M.TAMUNG.get(8, {}), 9: M.TAMUNG.get(9, {}), 10: M.TAMUNG10 if co == 'Edu' else {}}
    for k, m in enumerate((8, 9, 10)):
        bl = payroll2(2026, m, ccrows(m), TU[m])
        M.sheet(wb, 'Luong_T%02d' % m, 'BẢNG THANH TOÁN TIỀN LƯƠNG THÁNG %02d/2026' % m, T3, BLH, bl, money=MONEY, first=(k == 0), tail=bl_tail, widths={'Ghi chú': 36})
        print(co, 'T%02d:' % m, len(bl), 'người, thực lĩnh', sum(r[BLH.index('Thực lĩnh')] for r in bl))
    wb.save(p)
    if co == 'Edu':
        p = os.path.join(H, 'du-lieu-mau', 'thang-moi', 'Bang_luong_2026_T10.xlsx'); wb = openpyxl.Workbook()
        M.sheet(wb, 'Luong_T10', 'BẢNG THANH TOÁN TIỀN LƯƠNG THÁNG 10/2026', T3, BLH, payroll2(2026, 10, ccrows(10), M.TAMUNG10, sai=M.SAI10), money=MONEY, first=True, tail=bl_tail, widths={'Ghi chú': 36})
        wb.save(p); print('thang-moi T10 (cố ý sai lương DS005) xong')
    # ---- 5) Thu nhập thỏa thuận tại 31/10/2026 (để phần mềm chia lương hiệu suất mục tiêu) ----
    d = D(2026, 10, 31)
    for i in M.ID:
        if M.nghi(i) and M.nghi(i) < D(2026, 10, 1): continue
        if M.vao(i) > d: continue
        PKG_OUT[i] = (pkg(i, d), cb_at(i, d))
print('LG_PKG = {' + ', '.join("%s: %d" % (i, v[0]) for i, v in sorted(PKG_OUT.items())) + '}')
print('lương cơ bản 31/10:', ', '.join('%s %d' % (i, v[1] or 0) for i, v in sorted(PKG_OUT.items())))
