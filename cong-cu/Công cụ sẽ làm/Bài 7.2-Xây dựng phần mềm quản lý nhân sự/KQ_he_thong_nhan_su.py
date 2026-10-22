# -*- coding: utf-8 -*-
"""
HỆ THỐNG NHÂN SỰ TÂN PHÁT
- Đọc (chỉ đọc) các file Excel trong thư mục dữ liệu nhân sự.
- Mở giao diện trên Chrome, chạy ngay trên máy tính này (địa chỉ 127.0.0.1, không gửi dữ liệu ra ngoài).
- Chỉ THÊM file mới vào thư mục chấm công khi người dùng bấm "Nạp". Không bao giờ sửa/xóa file Excel gốc.
Người dùng không cần mở file này: mọi thiết lập chỉnh trong trang "Cài đặt" của phần mềm.
"""
PHIEN_BAN = "1.0.0"

import sys, os, re, json, time, shutil, socket, platform, threading, traceback, subprocess, tempfile, uuid
import urllib.request, urllib.parse, urllib.error
from datetime import datetime, date, time as dtime, timedelta
from pathlib import Path
from collections import Counter

THU_MUC_TOOL = Path(os.path.abspath(__file__)).parent
FILE_NHAT_KY = THU_MUC_TOOL / "nhat-ky.txt"
FILE_NHAT_KY_CU = THU_MUC_TOOL / "nhat-ky-cu.txt"
FILE_CAU_HINH = THU_MUC_TOOL / "cau-hinh.json"
THU_MUC_TAM = THU_MUC_TOOL / "tam_nap"
GIOI_HAN_NHAT_KY = 5 * 1024 * 1024
CAU_HO_TRO = "Nếu lỗi lặp lại, gửi file nhat-ky.txt cho người hỗ trợ."
CONG_MAC_DINH = 8765
TEN_UNG_DUNG = "he_thong_nhan_su_tan_phat"

try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

# =====================================================================
# NHẬT KÝ
# =====================================================================
_khoa_nhat_ky = threading.Lock()
_RE_SO_DAI = re.compile(r"\d{9,}")
_RE_BI_MAT = re.compile(r"(?i)(mật khẩu|mat khau|password|passwd|token|api[_ -]?key|secret|otp|mã xác nhận|ma xac nhan)(\s*[:=]\s*)(\S+)")


def che_thong_tin(chu):
    """Che số căn cước, số tài khoản, số thẻ (chuỗi từ 9 chữ số) và mật khẩu/token: chỉ để lộ 3 ký tự cuối."""
    try:
        s = str(chu)
        s = _RE_SO_DAI.sub(lambda m: "*" * (len(m.group()) - 3) + m.group()[-3:], s)
        s = _RE_BI_MAT.sub(lambda m: m.group(1) + m.group(2) + "*" * max(0, len(m.group(3)) - 3) + m.group(3)[-3:], s)
        return s
    except Exception:
        return "(không hiển thị được nội dung)"


def ghi(noi_dung):
    """Ghi 1 mục vào nhat-ky.txt. Mỗi dòng bắt đầu bằng [ngày/tháng/năm giờ:phút:giây]. Không bao giờ làm dừng phần mềm."""
    try:
        with _khoa_nhat_ky:
            try:
                if FILE_NHAT_KY.exists() and FILE_NHAT_KY.stat().st_size > GIOI_HAN_NHAT_KY:
                    if FILE_NHAT_KY_CU.exists():
                        FILE_NHAT_KY_CU.unlink()
                    FILE_NHAT_KY.rename(FILE_NHAT_KY_CU)
            except Exception:
                pass
            moc = datetime.now().strftime("[%d/%m/%Y %H:%M:%S]")
            dong = che_thong_tin(noi_dung).splitlines() or [""]
            with open(FILE_NHAT_KY, "a", encoding="utf-8") as f:
                for i, d in enumerate(dong):
                    f.write(f"{moc} {d}\n" if i == 0 else f"{moc}     {d}\n")
    except Exception:
        try:
            sys.stderr.write("Không ghi được nhật ký: " + traceback.format_exc() + "\n")
        except Exception:
            pass


def ghi_loi(ngu_canh):
    """Ghi lỗi kèm đầy đủ traceback."""
    try:
        ghi(f"LỖI: {ngu_canh}\n{traceback.format_exc()}")
    except Exception:
        pass


def in_man_hinh(chu):
    try:
        print(chu, flush=True)
    except Exception:
        pass


def hop_thoai_bao_loi(tieu_de, noi_dung):
    """Hiện hộp thoại lỗi tiếng Việt. Tự nó không được gây lỗi mới."""
    thong_diep = f"{noi_dung}\n\n{CAU_HO_TRO}\nFile nhật ký: {FILE_NHAT_KY}"
    in_man_hinh(f"\n*** {tieu_de} ***\n{thong_diep}\n")
    try:
        import tkinter as tk
        from tkinter import messagebox
        goc = tk.Tk()
        goc.withdraw()
        try:
            goc.attributes("-topmost", True)
        except Exception:
            pass
        messagebox.showerror(tieu_de, thong_diep, parent=goc)
        goc.destroy()
    except Exception:
        pass


def rut_gon(chu, toi_da=500):
    try:
        s = str(chu)
        return s if len(s) <= toi_da else s[:toi_da] + "…"
    except Exception:
        return ""

# =====================================================================
# CẤU HÌNH (tự nhớ giữa các lần mở)
# =====================================================================
def doc_cau_hinh():
    try:
        if FILE_CAU_HINH.exists():
            with open(FILE_CAU_HINH, "r", encoding="utf-8") as f:
                ch = json.load(f)
                return ch if isinstance(ch, dict) else {}
    except Exception:
        ghi_loi("Không đọc được file cấu hình cau-hinh.json, sẽ dùng thiết lập mặc định")
    return {}


def luu_cau_hinh(ch):
    try:
        tam = FILE_CAU_HINH.with_suffix(".tmp")
        with open(tam, "w", encoding="utf-8") as f:
            json.dump(ch, f, ensure_ascii=False, indent=2)
        os.replace(tam, FILE_CAU_HINH)
        return True
    except Exception:
        ghi_loi("Không lưu được file cấu hình cau-hinh.json")
        return False


CAU_HINH = {}

# =====================================================================
# THƯ VIỆN CẦN DÙNG (tự cài nếu thiếu)
# =====================================================================
def goi_mang(url, timeout=8):
    """Gọi ra mạng và ghi nhật ký đầy đủ: địa chỉ, mã trạng thái, dung lượng, kiểu dữ liệu, lời nhắn lỗi nguyên văn."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": f"HeThongNhanSu/{PHIEN_BAN}"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = r.read()
            ghi(f"Gọi mạng GET {url} → mã {r.status}, {len(body)} byte, kiểu {r.headers.get('Content-Type')}")
            return r.status, body
    except urllib.error.HTTPError as e:
        try:
            loi = e.read().decode("utf-8", "replace")
        except Exception:
            loi = str(e)
        ghi(f"Gọi mạng GET {url} → mã {e.code}, lời nhắn máy chủ: {rut_gon(loi)}")
        return e.code, None
    except Exception as e:
        ghi(f"Gọi mạng GET {url} → không kết nối được, lời nhắn: {rut_gon(repr(e))}")
        return None, None


def dam_bao_thu_vien():
    try:
        import openpyxl  # noqa
        ghi(f"Thư viện openpyxl đã có sẵn (phiên bản {openpyxl.__version__})")
        return True
    except ImportError:
        pass
    in_man_hinh("Đang cài thư viện đọc Excel (openpyxl). Lần đầu mất khoảng 1 phút, vui lòng chờ…")
    ghi("Thiếu thư viện openpyxl → bắt đầu tự cài")
    goi_mang("https://pypi.org/simple/openpyxl/")
    cac_cach = [
        ("cài mặc định", [sys.executable, "-m", "pip", "install", "--disable-pip-version-check", "openpyxl"]),
        ("cài cho riêng tài khoản này", [sys.executable, "-m", "pip", "install", "--disable-pip-version-check", "--user", "openpyxl"]),
        ("cài bỏ qua kiểm tra chứng chỉ mạng công ty", [sys.executable, "-m", "pip", "install", "--disable-pip-version-check", "--user",
                                                       "--trusted-host", "pypi.org", "--trusted-host", "files.pythonhosted.org", "openpyxl"]),
    ]
    for ten, lenh in cac_cach:
        try:
            ghi(f"Thử {ten}: {' '.join(lenh)} (tải từ https://pypi.org/simple/openpyxl/)")
            kq = subprocess.run(lenh, capture_output=True, text=True, encoding="utf-8", errors="replace")
            dau_ra = (kq.stdout or "") + (kq.stderr or "")
            ghi(f"Kết quả {ten}: mã trả về {kq.returncode}. Lời nhắn: {rut_gon(dau_ra[-500:] if kq.returncode else dau_ra[-300:])}")
            if kq.returncode == 0:
                import importlib
                importlib.invalidate_caches()
                try:
                    import site
                    up = site.getusersitepackages()
                    if up not in sys.path:
                        sys.path.append(up)
                except Exception:
                    pass
                import openpyxl  # noqa
                ghi("Đã cài xong openpyxl")
                return True
            if "No module named pip" in dau_ra:
                ghi("Máy chưa có pip → thử python -m ensurepip")
                k2 = subprocess.run([sys.executable, "-m", "ensurepip", "--upgrade"], capture_output=True, text=True, encoding="utf-8", errors="replace")
                ghi(f"Kết quả ensurepip: mã {k2.returncode}. Lời nhắn: {rut_gon(((k2.stdout or '') + (k2.stderr or ''))[-500:])}")
        except Exception:
            ghi_loi(f"Lỗi khi {ten}")
    return False

# =====================================================================
# ĐỌC EXCEL
# =====================================================================
LOAI_BANG = [
    ("BANG_LUONG", ["Mã NV", "Tổng thu nhập", "Thực lĩnh"]),
    ("CHAM_CONG", ["Mã NV", "Ngày", "Ký hiệu", "Giờ vào"]),
    ("SO_THEO_DOI_HDLD", ["Mã NV", "Số hợp đồng", "Loại hợp đồng"]),
    ("LICH_SU_LUONG", ["Mã NV", "Ngày hiệu lực", "Lương mới"]),
    ("DON_NGHI_PHEP", ["Mã NV", "Số đơn", "Loại nghỉ"]),
    ("QUY_PHEP_NAM", ["Mã NV", "Phép cơ bản", "Còn lại"]),
    ("DANH_SACH_NHAN_VIEN", ["Mã NV", "Họ và tên", "Ngày vào làm", "Trạng thái"]),
    ("PHONG_BAN", ["Mã phòng ban", "Tên phòng ban"]),
    ("CHUC_VU", ["Mã chức vụ", "Tên chức vụ"]),
    ("CA_LAM_VIEC", ["Mã ca", "Tên ca"]),
    ("KY_HIEU_CHAM_CONG", ["Ký hiệu", "Ý nghĩa"]),
]
COT_CAN = {
    "PHONG_BAN": ["Mã phòng ban", "Tên phòng ban", "Mã NV trưởng bộ phận", "Trưởng bộ phận", "Định biên", "Nhân sự hiện có", "Lịch làm việc"],
    "CHUC_VU": ["Mã chức vụ", "Tên chức vụ", "Cấp bậc", "Phụ cấp chức vụ (đồng/tháng)"],
    "CA_LAM_VIEC": ["Mã ca", "Tên ca", "Giờ bắt đầu", "Giờ kết thúc"],
    "KY_HIEU_CHAM_CONG": ["Ký hiệu", "Ý nghĩa", "Công ty trả lương"],
    "DANH_SACH_NHAN_VIEN": ["Mã NV", "Họ và tên", "Giới tính", "Ngày sinh", "Số CCCD/Mã số thuế", "Ngày cấp CCCD", "Dân tộc", "Quê quán", "Địa chỉ thường trú",
                            "Số điện thoại", "Email công ty", "Phòng ban", "Chức vụ", "Chức danh công việc", "Tổ/Ca", "Ngày vào làm", "Trình độ",
                            "Tình trạng hôn nhân", "Số người phụ thuộc", "Số sổ BHXH", "Ngân hàng", "Số tài khoản", "Trạng thái", "Ngày nghỉ việc"],
    "SO_THEO_DOI_HDLD": ["STT", "Số hợp đồng", "Mã NV", "Họ và tên", "Phòng ban", "Chức danh", "Loại hợp đồng", "Ngày ký", "Ngày hiệu lực", "Ngày hết hạn",
                         "Mức lương theo HĐ", "Phụ cấp chức vụ", "Tình trạng", "Ngày chấm dứt", "Lý do chấm dứt"],
    "LICH_SU_LUONG": ["STT", "Số quyết định", "Ngày quyết định", "Ngày hiệu lực", "Mã NV", "Họ và tên", "Phòng ban", "Chức danh", "Lương cũ", "Lương mới",
                      "Mức tăng", "Tỷ lệ tăng (%)", "Phụ cấp chức vụ", "Lý do"],
    "DON_NGHI_PHEP": ["STT", "Số đơn", "Ngày tạo đơn", "Mã NV", "Họ và tên", "Phòng ban", "Loại nghỉ", "Từ ngày", "Đến ngày", "Số ngày", "Lý do",
                      "Người duyệt", "Trạng thái", "Ngày duyệt"],
    "QUY_PHEP_NAM": ["Mã NV", "Họ và tên", "Phòng ban", "Ngày vào làm", "Thâm niên (năm)", "Phép cơ bản", "Phép thâm niên", "Tổng phép năm*", "Đã nghỉ", "Còn lại", "Ghi chú"],
    "CHAM_CONG": ["STT", "Ngày", "Thứ", "Mã NV", "Họ và tên", "Phòng ban", "Tổ", "Ca", "Giờ vào", "Giờ ra", "Số giờ công", "Đi muộn (phút)", "Giờ tăng ca",
                  "Loại tăng ca", "Ký hiệu", "Ghi chú"],
    "BANG_LUONG": ["Mã NV", "Họ và tên", "Phòng ban", "Chức danh", "Lương cơ bản", "Phụ cấp chức vụ", "Công chuẩn", "Ngày công thực tế",
                   "Nghỉ phép/việc riêng có lương", "Nghỉ lễ", "Nghỉ ốm (BHXH trả)", "Nghỉ không lương/không phép", "Nghỉ thai sản", "Lương thời gian",
                   "Giờ tăng ca ngày thường", "Giờ tăng ca Chủ nhật", "Tiền tăng ca", "Giờ làm đêm", "Phụ cấp làm đêm", "Tiền ăn ca", "Phụ cấp xăng xe",
                   "Phụ cấp điện thoại", "Phụ cấp chuyên cần", "Tổng thu nhập", "Lương đóng BH", "BHXH (8%)", "BHYT (1,5%)", "BHTN (1%)",
                   "Đoàn phí công đoàn (1%)", "Thu nhập chịu thuế", "Số người phụ thuộc", "Giảm trừ gia cảnh", "Thu nhập tính thuế", "Thuế TNCN",
                   "Tạm ứng", "Thực lĩnh", "Số tài khoản", "Ngân hàng", "Ghi chú"],
}
TEN_LOAI = {"PHONG_BAN": "Danh mục phòng ban", "CHUC_VU": "Danh mục chức vụ", "CA_LAM_VIEC": "Ca làm việc", "KY_HIEU_CHAM_CONG": "Ký hiệu chấm công",
            "DANH_SACH_NHAN_VIEN": "Hồ sơ nhân viên", "SO_THEO_DOI_HDLD": "Sổ hợp đồng", "LICH_SU_LUONG": "Lịch sử lương", "DON_NGHI_PHEP": "Đơn nghỉ phép",
            "QUY_PHEP_NAM": "Quỹ phép năm", "CHAM_CONG": "Chấm công", "BANG_LUONG": "Bảng lương"}
COT_KHOA = {"PHONG_BAN": "Mã phòng ban", "CHUC_VU": "Mã chức vụ", "CA_LAM_VIEC": "Mã ca", "KY_HIEU_CHAM_CONG": "Ký hiệu"}
COT_DANG_CHU = {"Số CCCD/Mã số thuế", "Số tài khoản", "Số sổ BHXH", "Số điện thoại", "Mã NV", "Số hợp đồng", "Số quyết định", "Số đơn",
                "Mã phòng ban", "Mã chức vụ", "Mã ca", "Ký hiệu", "Mã NV trưởng bộ phận", "Tổ", "Tổ/Ca", "Ca"}
TEN_COT_KHAC = {"Mã nhân viên": "Mã NV", "Ma NV": "Mã NV", "Họ tên": "Họ và tên", "Ho va ten": "Họ và tên"}
TEN_QUEN = {c for _, cs in LOAI_BANG for c in cs} | {"Phòng ban", "Họ và tên", "STT"}
RE_MA_NV = re.compile(r"^[A-Za-z]{1,6}\d+$")
RE_NGAY_VN = re.compile(r"^(\d{1,2})/(\d{1,2})/(\d{4})$")


def bo_dau(s):
    import unicodedata
    s = unicodedata.normalize("NFD", str(s))
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return s.replace("đ", "d").replace("Đ", "D")


def chuan_ten_cot(h):
    if h is None:
        return None
    s = " ".join(str(h).split())
    return TEN_COT_KHAC.get(s, s) if s else None


def la_cot_ngay(cot):
    return cot.startswith("Ngày") and cot not in ("Ngày công thực tế",) or cot in ("Từ ngày", "Đến ngày")


def chuan_gia_tri(cot, v):
    if v is None:
        return None
    if isinstance(v, datetime):
        if cot in ("Giờ vào", "Giờ ra"):
            return v.strftime("%H:%M")
        return v.strftime("%Y-%m-%d")
    if isinstance(v, date):
        return v.strftime("%Y-%m-%d")
    if isinstance(v, dtime):
        return v.strftime("%H:%M")
    if isinstance(v, timedelta):
        phut = int(v.total_seconds() // 60)
        return f"{phut // 60:02d}:{phut % 60:02d}"
    if isinstance(v, bool):
        return v
    if isinstance(v, float):
        if v != v:
            return None
        if cot in COT_DANG_CHU and v.is_integer():
            return str(int(v))
        return int(v) if v.is_integer() else round(v, 4)
    if isinstance(v, int):
        return str(v) if cot in COT_DANG_CHU else v
    if isinstance(v, str):
        s = v.strip()
        if not s:
            return None
        if la_cot_ngay(cot):
            m = RE_NGAY_VN.match(s)
            if m:
                return f"{m.group(3)}-{int(m.group(2)):02d}-{int(m.group(1)):02d}"
        return s
    return str(v)


def tim_dong_tieu_de(cac_dong):
    """Tiêu đề thường ở dòng 5. Nếu không thấy thì tự dò 30 dòng đầu."""
    def diem(dong):
        return sum(1 for c in dong if chuan_ten_cot(c) in TEN_QUEN)
    if len(cac_dong) >= 5 and diem(cac_dong[4]) >= 2:
        return 4
    for i, dong in enumerate(cac_dong[:30]):
        if diem(dong) >= 2:
            return i
    return None


def nhan_dien(tieu_de):
    tap = set(tieu_de)
    for loai, can in LOAI_BANG:
        if all(c in tap for c in can):
            return loai
    return None


def cot_thieu(loai, tieu_de):
    tap = set(tieu_de)
    thieu = []
    for c in COT_CAN.get(loai, []):
        if c.endswith("*"):
            if not any(t.startswith(c[:-1]) for t in tap if t):
                thieu.append(c[:-1] + "…")
        elif c not in tap:
            thieu.append(c)
    return thieu


def thang_tu_tieu_de(cac_dong, ten_sheet, ten_file):
    chu = " ".join(str(c) for d in cac_dong[:4] for c in d if c)
    m = re.search(r"TH[ÁA]NG\s*(\d{1,2})\s*/\s*(\d{4})", chu, re.I) or re.search(r"TH[ÁA]NG\s*(\d{1,2})\s*/\s*(\d{4})", bo_dau(chu), re.I)
    if m:
        return f"{m.group(2)}-{int(m.group(1)):02d}"
    ms = re.search(r"T(\d{1,2})\b", ten_sheet, re.I)
    my = re.search(r"(20\d\d)", ten_file)
    if ms:
        return f"{my.group(1) if my else date.today().year}-{int(ms.group(1)):02d}"
    return None


def mo_workbook(duong_dan):
    """Mở file chỉ để đọc. Nếu file đang mở trong Excel và bị khóa, đọc bản sao tạm (file gốc không bị đụng tới)."""
    import openpyxl
    try:
        return openpyxl.load_workbook(duong_dan, read_only=True, data_only=True), None
    except PermissionError:
        ghi(f"File đang bị khóa (có thể đang mở trong Excel): {duong_dan.name} → đọc bản sao tạm")
        tam = Path(tempfile.gettempdir()) / f"hts_{uuid.uuid4().hex}.xlsx"
        shutil.copy2(duong_dan, tam)
        return openpyxl.load_workbook(tam, read_only=True, data_only=True), tam


def doc_mot_file(duong_dan):
    """Đọc 1 file Excel → danh sách bảng tìm được. Không ghi gì vào file."""
    ket_qua = []
    wb, tam = mo_workbook(duong_dan)
    try:
        for ws in wb.worksheets:
            muc = {"sheet": ws.title, "loai": None, "dongTieuDe": None, "soDong": 0, "thieuCot": [], "rows": [], "thang": None, "boQua": 0}
            try:
                cac_dong = [list(r) for r in ws.iter_rows(values_only=True)]
                i_td = tim_dong_tieu_de(cac_dong)
                if i_td is None:
                    muc["ghiChu"] = "Không thấy dòng tiêu đề quen thuộc, bỏ qua sheet này"
                    ket_qua.append(muc)
                    continue
                tieu_de = [chuan_ten_cot(c) for c in cac_dong[i_td]]
                loai = nhan_dien([t for t in tieu_de if t])
                muc["dongTieuDe"] = i_td + 1
                if not loai:
                    muc["ghiChu"] = "Không nhận ra đây là bảng nào trong bản đồ dữ liệu"
                    ket_qua.append(muc)
                    continue
                muc["loai"] = loai
                muc["thieuCot"] = cot_thieu(loai, [t for t in tieu_de if t])
                khoa = COT_KHOA.get(loai, "Mã NV")
                rows = []
                for dong in cac_dong[i_td + 1:]:
                    ban_ghi = {}
                    for j, ten in enumerate(tieu_de):
                        if ten and j < len(dong) and ten not in ban_ghi:
                            ban_ghi[ten] = chuan_gia_tri(ten, dong[j])
                    gt = ban_ghi.get(khoa)
                    if khoa == "Mã NV":
                        hop_le = isinstance(gt, str) and bool(RE_MA_NV.match(gt))
                    else:
                        hop_le = gt not in (None, "") and not str(gt).upper().startswith("TỔNG")
                    if not hop_le:
                        if any(v not in (None, "") for v in ban_ghi.values()):
                            muc["boQua"] += 1
                        continue
                    rows.append(ban_ghi)
                muc["rows"] = rows
                muc["soDong"] = len(rows)
                if loai == "CHAM_CONG":
                    dem = Counter(str(r.get("Ngày") or "")[:7] for r in rows if r.get("Ngày"))
                    muc["thang"] = dem.most_common(1)[0][0] if dem else None
                elif loai == "BANG_LUONG":
                    muc["thang"] = thang_tu_tieu_de(cac_dong, ws.title, duong_dan.name)
                ket_qua.append(muc)
            except Exception as e:
                ghi_loi(f"Lỗi khi đọc sheet '{ws.title}' của file {duong_dan.name}")
                muc["loi"] = f"Không đọc được sheet này ({type(e).__name__})"
                ket_qua.append(muc)
    finally:
        try:
            wb.close()
        except Exception:
            pass
        if tam:
            try:
                tam.unlink()
            except Exception:
                pass
    return ket_qua


def la_thu_muc_cham_cong(p):
    return "cham_cong" in bo_dau(p.name).lower().replace(" ", "_")


def tim_thu_muc_cham_cong(goc):
    try:
        for p in sorted(goc.rglob("*")):
            if p.is_dir() and la_thu_muc_cham_cong(p) and THU_MUC_TAM not in p.parents and p != THU_MUC_TAM:
                return p
    except Exception:
        ghi_loi("Lỗi khi tìm thư mục chấm công")
    return None


def liet_ke_file(goc):
    files = []
    for duoi in ("*.xlsx", "*.xlsm"):
        for p in goc.rglob(duoi):
            if p.name.startswith("~$") or THU_MUC_TAM in p.parents:
                continue
            files.append((p, False))
    # Tự dò: file chấm công để lẻ ngay bên ngoài thư mục dữ liệu (như Cham_cong_2026_09.xlsx)
    try:
        for p in goc.parent.glob("*.xlsx"):
            if p.name.startswith("~$") or not bo_dau(p.name).lower().startswith("cham_cong"):
                continue
            if goc not in p.parents:
                files.append((p, True))
    except Exception:
        ghi_loi("Lỗi khi dò file để lẻ bên ngoài thư mục dữ liệu")
    return sorted(files, key=lambda x: str(x[0]).lower())


def quet_thu_muc(goc):
    """Quét toàn bộ thư mục → dữ liệu cho giao diện + báo cáo từng file. File lỗi không làm dừng các file khác."""
    goc = Path(goc)
    ghi(f"----- Bắt đầu quét thư mục: {goc} -----")
    t0 = time.time()
    du_lieu = {k: [] for k in COT_CAN if k not in ("CHAM_CONG", "BANG_LUONG")}
    du_lieu["CHAM_CONG"], du_lieu["BANG_LUONG"] = {}, {}
    nguon, ung_vien = [], {}
    for p, ngoai in liet_ke_file(goc):
        try:
            thu_muc = "(ngoài thư mục dữ liệu)" if ngoai else (str(p.parent.relative_to(goc)) if p.parent != goc else "(thư mục gốc)")
        except Exception:
            thu_muc = str(p.parent)
        try:
            cac_bang = doc_mot_file(p)
        except Exception as e:
            ghi_loi(f"Không đọc được file {p.name}")
            ly_do = "file đang bị khóa hoặc không có quyền đọc" if isinstance(e, PermissionError) else \
                    "file hỏng hoặc không phải file Excel chuẩn (.xlsx)" if type(e).__name__ in ("BadZipFile", "InvalidFileException", "KeyError") else \
                    f"lỗi {type(e).__name__}"
            ghi(f"  ✕ {thu_muc}/{p.name}: KHÔNG ĐỌC ĐƯỢC – {ly_do}. Các file khác vẫn đọc tiếp.")
            nguon.append({"thuMuc": thu_muc, "file": p.name, "sheet": "", "loai": None, "loi": ly_do.capitalize(), "duongDan": str(p)})
            continue
        for b in cac_bang:
            muc = {"thuMuc": thu_muc, "file": p.name, "sheet": b["sheet"], "loai": b.get("loai"), "thang": b.get("thang"), "dongTieuDe": b.get("dongTieuDe"),
                   "soDong": b.get("soDong", 0), "thieuCot": b.get("thieuCot", []), "loi": b.get("loi"), "ghiChu": b.get("ghiChu"), "duongDan": str(p)}
            if b.get("loai") == "CHAM_CONG" and (ngoai or not la_thu_muc_cham_cong(p.parent)):
                muc["canhBao"] = "Đang để ngoài thư mục 03_Cham_cong"
            if b.get("loai") == "BANG_LUONG" and b.get("boQua"):
                muc["ghiChu"] = f"Đã bỏ qua {b['boQua']} dòng tổng cộng/chữ ký"
            nguon.append(muc)
            if b.get("loi"):
                ghi(f"  ✕ {thu_muc}/{p.name} [{b['sheet']}]: {b['loi']}")
                continue
            if not b.get("loai"):
                ghi(f"  – {thu_muc}/{p.name} [{b['sheet']}]: {b.get('ghiChu')}")
                continue
            du_cot = "đủ cột cần dùng" if not b["thieuCot"] else "THIẾU CỘT: " + ", ".join(b["thieuCot"])
            ghi(f"  ✓ {thu_muc}/{p.name} [{b['sheet']}] → {TEN_LOAI[b['loai']]}{' tháng ' + b['thang'] if b.get('thang') else ''}: "
                f"tiêu đề ở dòng {b['dongTieuDe']}, dữ liệu từ dòng {b['dongTieuDe'] + 1}, đọc được {b['soDong']} dòng"
                f"{', bỏ qua ' + str(b['boQua']) + ' dòng tổng cộng/chữ ký/không có mã' if b.get('boQua') else ''}; {du_cot}")
            khoa = (b["loai"], b.get("thang"))
            uu_tien = (0 if muc.get("canhBao") else 1, b["soDong"], p.stat().st_mtime)
            ung_vien.setdefault(khoa, []).append((uu_tien, b, muc))
    # Chọn bảng dùng khi có trùng (ví dụ cùng tháng chấm công ở 2 nơi)
    for (loai, thang), ds in ung_vien.items():
        ds.sort(key=lambda x: x[0], reverse=True)
        _, b, muc = ds[0]
        if loai in ("CHAM_CONG", "BANG_LUONG"):
            if not thang:
                muc["ghiChu"] = "Không xác định được tháng nên chưa dùng"
                ghi(f"  ! {muc['file']} [{muc['sheet']}]: không xác định được tháng, chưa dùng bảng này")
                continue
            du_lieu[loai][thang] = b["rows"]
        else:
            du_lieu[loai] = b["rows"]
        for _, b2, m2 in ds[1:]:
            m2["ghiChu"] = f"Trùng với {muc['file']}, không dùng"
            ghi(f"  ! Trùng dữ liệu {TEN_LOAI[loai]}{' tháng ' + thang if thang else ''}: dùng {muc['thuMuc']}/{muc['file']}, bỏ qua {m2['thuMuc']}/{m2['file']}")
    du_lieu["CHAM_CONG"] = dict(sorted(du_lieu["CHAM_CONG"].items()))
    du_lieu["BANG_LUONG"] = dict(sorted(du_lieu["BANG_LUONG"].items()))
    for loai in TEN_LOAI:
        if loai not in ("CHAM_CONG", "BANG_LUONG") and not du_lieu[loai]:
            ghi(f"  ! Không tìm thấy bảng {TEN_LOAI[loai]} trong thư mục")
    ghi(f"----- Quét xong sau {time.time() - t0:.1f} giây -----")
    return du_lieu, nguon

# =====================================================================
# ĐẾM VIỆC CẦN XỬ LÝ (cùng quy tắc với giao diện, để ghi nhật ký)
# =====================================================================
def _ngay(s):
    try:
        return datetime.strptime(str(s)[:10], "%Y-%m-%d").date()
    except Exception:
        return None


def dem_viec_can_xu_ly(du_lieu, hom_nay):
    try:
        nv = {e.get("Mã NV"): e for e in du_lieu["DANH_SACH_NHAN_VIEN"]}
        dang_lam = lambda e: e and e.get("Trạng thái") in ("Đang làm việc", "Nghỉ thai sản")
        dem = Counter()
        for h in du_lieu["SO_THEO_DOI_HDLD"]:
            het = _ngay(h.get("Ngày hết hạn"))
            if h.get("Tình trạng") == "Đang hiệu lực" and het and h.get("Loại hợp đồng") != "HĐLĐ không xác định thời hạn" and dang_lam(nv.get(h.get("Mã NV"))):
                if 0 <= (het - hom_nay).days <= 60:
                    dem["Hợp đồng/thử việc sắp hết hạn"] += 1
        dem["Đơn nghỉ chờ duyệt"] = sum(1 for d in du_lieu["DON_NGHI_PHEP"] if d.get("Trạng thái") == "Chờ duyệt")
        for q in du_lieu["QUY_PHEP_NAM"]:
            try:
                if dang_lam(nv.get(q.get("Mã NV"))) and float(q.get("Còn lại") or 0) <= 1:
                    dem["Hết/sắp hết phép năm"] += 1
            except Exception:
                pass
        cc = du_lieu["CHAM_CONG"]
        if cc:
            th = hom_nay.strftime("%Y-%m") if hom_nay.strftime("%Y-%m") in cc else sorted(cc)[-1]
            tc = Counter()
            for r in cc[th]:
                try:
                    tc[r.get("Mã NV")] += float(r.get("Giờ tăng ca") or 0)
                except Exception:
                    pass
            dem["Tăng ca từ 36 giờ trở lên"] = sum(1 for v in tc.values() if v >= 36)
        for d in du_lieu["DON_NGHI_PHEP"]:
            den = _ngay(d.get("Đến ngày"))
            e = nv.get(d.get("Mã NV"))
            if d.get("Loại nghỉ") == "Nghỉ thai sản" and d.get("Trạng thái") == "Đã duyệt" and den and e and e.get("Trạng thái") == "Nghỉ thai sản":
                if 0 <= (den + timedelta(days=1) - hom_nay).days <= 45:
                    dem["Thai sản sắp quay lại"] += 1
        return sum(dem.values()), dem
    except Exception:
        ghi_loi("Lỗi khi đếm việc cần xử lý")
        return 0, Counter()

# =====================================================================
# TRẠNG THÁI PHẦN MỀM
# =====================================================================
TT = {"du_lieu": None, "nguon": [], "luc_quet": "", "so_viec": 0, "cong": None, "chrome": None, "tam": {}}
_khoa_quet = threading.Lock()


def thu_muc_du_lieu():
    p = CAU_HINH.get("thu_muc_du_lieu")
    return Path(p) if p else None


def quet_va_tong_ket():
    with _khoa_quet:
        goc = thu_muc_du_lieu()
        if not goc or not goc.is_dir():
            raise LoiNguoiDung("Chưa có thư mục dữ liệu hoặc thư mục đã bị đổi tên/di chuyển. Vào trang Cài đặt, bấm \"Chọn thư mục khác…\" để chọn lại thư mục Du_lieu_nhan_su_Tan_Phat.")
        du_lieu, nguon = quet_thu_muc(goc)
        hom_nay = date.today()
        so_viec, chi_tiet = dem_viec_can_xu_ly(du_lieu, hom_nay)
        ds = du_lieu["DANH_SACH_NHAN_VIEN"]
        dang = sum(1 for e in ds if e.get("Trạng thái") in ("Đang làm việc", "Nghỉ thai sản"))
        ghi(f"TỔNG KẾT QUÉT (ngày {hom_nay.strftime('%d/%m/%Y')}): {len(ds)} hồ sơ nhân viên, {dang} người đang làm; "
            f"{len(du_lieu['CHAM_CONG'])} tháng chấm công ({', '.join(du_lieu['CHAM_CONG']) or 'không có'}); "
            f"{len(du_lieu['BANG_LUONG'])} tháng lương ({', '.join(du_lieu['BANG_LUONG']) or 'không có'}); "
            f"{so_viec} việc cần xử lý" + (f" ({'; '.join(f'{k}: {v}' for k, v in chi_tiet.items() if v)})" if so_viec else "") +
            f"; {sum(1 for n in nguon if n.get('loi'))} mục đọc lỗi")
        TT.update(du_lieu=du_lieu, nguon=nguon, luc_quet=datetime.now().strftime("%H:%M:%S %d/%m/%Y"), so_viec=so_viec)


class LoiNguoiDung(Exception):
    """Lỗi có lời nhắn tiếng Việt dành cho người dùng."""


def thong_tin_cai_dat():
    goc = thu_muc_du_lieu()
    tmcc = tim_thu_muc_cham_cong(goc) if goc and goc.is_dir() else None
    return {"thu_muc_du_lieu": str(goc) if goc else "", "thu_muc_cham_cong": str(tmcc) if tmcc else "", "nhat_ky": str(FILE_NHAT_KY),
            "phien_ban": PHIEN_BAN, "python": platform.python_version(), "cong": TT["cong"], "cong_luu": CAU_HINH.get("cong") or TT["cong"],
            "chrome": TT["chrome"] or "", "chrome_luu": CAU_HINH.get("chrome", "")}


def goi_du_lieu():
    return {"ok": True, "hom_nay": date.today().strftime("%Y-%m-%d"), "luc_quet": TT["luc_quet"], "du_lieu": TT["du_lieu"], "nguon": TT["nguon"],
            "cai_dat": thong_tin_cai_dat(), "so_viec": TT["so_viec"], "phien_ban": PHIEN_BAN}

# =====================================================================
# KIỂM TRA & NẠP FILE CHẤM CÔNG MỚI
# =====================================================================
def kiem_tra_file_moi(ten_goc, noi_dung):
    THU_MUC_TAM.mkdir(exist_ok=True)
    token = uuid.uuid4().hex
    tam = THU_MUC_TAM / f"{token}.xlsx"
    with open(tam, "wb") as f:
        f.write(noi_dung)
    ghi(f"Nhận file để kiểm tra: {ten_goc} ({len(noi_dung)} byte)")
    try:
        cac_bang = doc_mot_file(tam)
    except Exception:
        ghi_loi(f"Không đọc được file tải lên {ten_goc}")
        raise LoiNguoiDung(f"Không đọc được file \"{ten_goc}\". File có thể bị hỏng hoặc không phải file Excel .xlsx. Hãy mở file bằng Excel, bấm Lưu (Save) rồi chọn lại.")
    bang = next((b for b in cac_bang if b.get("loai") == "CHAM_CONG"), None)
    if not bang:
        loai_khac = list(dict.fromkeys(TEN_LOAI[b["loai"]] for b in cac_bang if b.get("loai")))
        raise LoiNguoiDung(f"File \"{ten_goc}\" không phải file chấm công" + (f" (phần mềm nhận ra đây là: {', '.join(loai_khac)})" if loai_khac else "") +
                           ". File chấm công cần có các cột Mã NV, Ngày, Ký hiệu, Giờ vào… với tiêu đề ở dòng 5.")
    rows, du, kq = bang["rows"], TT["du_lieu"] or {}, []
    nv = {e.get("Mã NV"): e for e in du.get("DANH_SACH_NHAN_VIEN", [])}
    kq.append({"m": "err", "t": f"Thiếu {len(bang['thieuCot'])} cột so với mẫu", "s": ", ".join(bang["thieuCot"])} if bang["thieuCot"] else
              {"m": "ok", "t": "Đủ 16 cột theo mẫu", "s": f"Tiêu đề ở dòng {bang['dongTieuDe']}, dữ liệu từ dòng {bang['dongTieuDe'] + 1}"})
    if not rows:
        kq.append({"m": "err", "t": "Không tìm thấy dòng dữ liệu nào", "s": "Cột Mã NV phải có dạng TP0001."})
    thangs = sorted({str(r.get("Ngày") or "")[:7] for r in rows if r.get("Ngày")})
    thang = bang.get("thang")
    ngays = sorted(str(r.get("Ngày"))[:10] for r in rows if r.get("Ngày"))
    if len(thangs) > 1:
        kq.append({"m": "err", "t": f"File chứa dữ liệu của {len(thangs)} tháng", "s": ", ".join(thangs) + " — mỗi file chỉ được chứa một tháng"})
    elif thang:
        kq.append({"m": "ok", "t": f"Tháng {thang[5:7]}/{thang[:4]}: {len(rows)} dòng, từ {ngays[0][8:10]}/{ngays[0][5:7]} đến {ngays[-1][8:10]}/{ngays[-1][5:7]}",
                   "s": f"{len({r.get('Mã NV') for r in rows})} người có chấm công"})
    nguon_cu = next((n for n in TT["nguon"] if n.get("loai") == "CHAM_CONG" and n.get("thang") == thang and not (n.get("ghiChu") or "").startswith("Trùng")), None)
    if thang and nguon_cu:
        if nguon_cu.get("canhBao"):
            kq.append({"m": "warn", "t": f"Tháng này đang có file để ngoài thư mục chấm công ({nguon_cu['file']})",
                       "s": "Nạp xong, phần mềm dùng file mới trong thư mục chấm công. File cũ để nguyên, không bị xóa."})
        else:
            kq.append({"m": "err", "t": f"Tháng {thang[5:7]}/{thang[:4]} đã có file {nguon_cu['file']} trong thư mục {nguon_cu['thuMuc']}",
                       "s": "Phần mềm không ghi đè file cũ. Nếu muốn thay, hãy tự chuyển file cũ ra chỗ khác, bấm \"Quét lại thư mục\" rồi nạp lại."})
    ma = {r.get("Mã NV") for r in rows}
    khop = sorted(m for m in ma if m in nv)
    khong_khop = sorted(m for m in ma if m not in nv)
    kq.append({"m": "warn", "t": f"{len(khong_khop)} Mã NV không có trong hồ sơ nhân viên", "s": ", ".join(khong_khop[:10]) + " — cần bổ sung hồ sơ trước khi tính lương"}
              if khong_khop else {"m": "ok", "t": f"Cả {len(khop)} Mã NV đều khớp hồ sơ nhân viên"})
    lech = {r.get("Mã NV") for r in rows if r.get("Mã NV") in nv and (nv[r["Mã NV"]].get("Họ và tên") != r.get("Họ và tên") or nv[r["Mã NV"]].get("Phòng ban") != r.get("Phòng ban"))}
    if lech:
        kq.append({"m": "warn", "t": f"{len(lech)} người có họ tên hoặc phòng ban khác hồ sơ", "s": ", ".join(sorted(lech)[:8])})
    seen, trung = set(), []
    for r in rows:
        k = (r.get("Mã NV"), r.get("Ngày"))
        if k in seen:
            trung.append(k)
        seen.add(k)
    kq.append({"m": "err", "t": f"{len(trung)} dòng bị trùng Mã NV và ngày", "s": "; ".join(f"{a} ngày {b}" for a, b in trung[:4])} if trung else {"m": "ok", "t": "Không có dòng trùng"})
    kh_hop_le = {k.get("Ký hiệu") for k in du.get("KY_HIEU_CHAM_CONG", [])} or {"X", "CT", "P", "R", "L", "Ô", "TS", "KL", "KP"}
    kh_la = sorted({str(r.get("Ký hiệu")) for r in rows if r.get("Ký hiệu") not in kh_hop_le})
    kq.append({"m": "err", "t": "Có ký hiệu không nằm trong danh mục ký hiệu chấm công", "s": ", ".join(kh_la)} if kh_la else {"m": "ok", "t": "Ký hiệu chấm công hợp lệ"})
    co_don = set()
    for d in du.get("DON_NGHI_PHEP", []):
        tu, den = _ngay(d.get("Từ ngày")), _ngay(d.get("Đến ngày"))
        if d.get("Trạng thái") == "Đã duyệt" and tu and den and (den - tu).days < 400:
            x = tu
            while x <= den:
                co_don.add((d.get("Mã NV"), x.strftime("%Y-%m-%d")))
                x += timedelta(days=1)
    khong_don = [r for r in rows if r.get("Ký hiệu") in ("P", "R", "Ô", "KL", "TS") and (r.get("Mã NV"), str(r.get("Ngày"))[:10]) not in co_don]
    kq.append({"m": "warn", "t": f"{len(khong_don)} ngày nghỉ chưa có đơn đã duyệt", "s": "; ".join(f"{r.get('Mã NV')} {str(r.get('Ngày'))[8:10]}/{str(r.get('Ngày'))[5:7]} ({r.get('Ký hiệu')})" for r in khong_don[:5])}
              if khong_don else {"m": "ok", "t": "Mọi ngày nghỉ đều có đơn đã duyệt"})
    sau_nghi = sorted({r.get("Mã NV") for r in rows if nv.get(r.get("Mã NV"), {}).get("Ngày nghỉ việc") and str(r.get("Ngày")) > str(nv[r["Mã NV"]]["Ngày nghỉ việc"])})
    kq.append({"m": "err", "t": f"{len(sau_nghi)} người đã nghỉ việc vẫn có chấm công sau ngày nghỉ", "s": ", ".join(sau_nghi)} if sau_nghi else {"m": "ok", "t": "Không chấm công cho người đã nghỉ việc"})
    tc = Counter()
    for r in rows:
        try:
            tc[r.get("Mã NV")] += float(r.get("Giờ tăng ca") or 0)
        except Exception:
            pass
    vuot = [(m, v) for m, v in tc.items() if v > 40]
    kq.append({"m": "warn", "t": f"{len(vuot)} người tăng ca quá 40 giờ trong tháng", "s": "; ".join(f"{m}: {v:g} giờ" for m, v in vuot[:5])} if vuot else
              {"m": "ok", "t": "Không ai tăng ca quá 40 giờ", "s": f"Cao nhất {max(tc.values(), default=0):g} giờ"})
    cho_phep = bool(rows) and thang is not None and not any(k["m"] == "err" for k in kq)
    goc = thu_muc_du_lieu()
    tmcc = tim_thu_muc_cham_cong(goc) or (goc / "03_Cham_cong")
    dich = tmcc / f"Cham_cong_{thang.replace('-', '_')}.xlsx" if thang else None
    if dich:
        n = 2
        while dich.exists():
            dich = tmcc / f"Cham_cong_{thang.replace('-', '_')}_ban{n}.xlsx"
            n += 1
    TT["tam"][token] = {"ten": ten_goc, "tam": tam, "thang": thang, "dich": dich, "so_dong": len(rows), "khop": len(khop), "khong_khop": khong_khop, "cho_phep": cho_phep}
    ghi(f"Kết quả kiểm tra {ten_goc}: {len(rows)} dòng, tháng {thang}, {len(khop)} Mã NV khớp, {len(khong_khop)} không khớp"
        f"{' (' + ', '.join(khong_khop[:10]) + ')' if khong_khop else ''}; {sum(1 for k in kq if k['m'] == 'err')} lỗi, "
        f"{sum(1 for k in kq if k['m'] == 'warn')} lưu ý → {'CHO PHÉP nạp' if cho_phep else 'CHƯA cho nạp'}")
    return {"ok": True, "token": token, "ten": ten_goc, "thang": thang, "so_dong": len(rows), "khop": len(khop), "khong_khop": khong_khop,
            "kiem_tra": kq, "xem_truoc": rows[:12], "cho_phep_nap": cho_phep, "dich_du_kien": str(dich) if dich else ""}


def nap_file(token):
    muc = TT["tam"].get(token)
    if not muc:
        raise LoiNguoiDung("Phiên kiểm tra đã hết hạn (có thể phần mềm vừa được mở lại). Hãy chọn lại file chấm công.")
    if not muc["cho_phep"]:
        raise LoiNguoiDung("File này còn lỗi nên chưa được nạp. Sửa các lỗi có dấu ✕ rồi chọn lại file.")
    dich = muc["dich"]
    if dich.exists():
        raise LoiNguoiDung(f"Đã có file {dich.name} trong thư mục chấm công. Phần mềm không ghi đè. Hãy bấm \"Quét lại thư mục\" rồi chọn lại file.")
    dich.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(muc["tam"], dich)
    if dich.stat().st_size != muc["tam"].stat().st_size:
        raise LoiNguoiDung("Chép file chưa trọn vẹn (dung lượng không khớp). Hãy kiểm tra ổ đĩa còn trống rồi nạp lại.")
    ghi(f"NẠP FILE MỚI: {muc['ten']} → đã chép vào {dich} | {muc['so_dong']} dòng, tháng {muc['thang']}, "
        f"{muc['khop']} Mã NV khớp, {len(muc['khong_khop'])} không khớp{' (' + ', '.join(muc['khong_khop'][:10]) + ')' if muc['khong_khop'] else ''}")
    try:
        muc["tam"].unlink()
    except Exception:
        ghi_loi("Không xóa được file tạm trong thư mục tam_nap (không ảnh hưởng dữ liệu)")
    TT["tam"].pop(token, None)
    quet_va_tong_ket()
    kq = goi_du_lieu()
    kq["da_chep_vao"] = str(dich)
    return kq


def don_file_tam():
    try:
        if THU_MUC_TAM.exists():
            for p in THU_MUC_TAM.glob("*.xlsx"):
                p.unlink()
    except Exception:
        ghi_loi("Không dọn được thư mục tạm tam_nap (không ảnh hưởng dữ liệu)")

# =====================================================================
# CHỌN THƯ MỤC, CHROME, MỞ FILE
# =====================================================================
TEN_THU_MUC_MAU = "Du_lieu_nhan_su_Tan_Phat"


def cac_vi_tri_thu():
    nha = Path.home()
    return [THU_MUC_TOOL / TEN_THU_MUC_MAU, THU_MUC_TOOL.parent / TEN_THU_MUC_MAU, THU_MUC_TOOL,
            nha / "Downloads" / "Buoi7_Du_lieu_nhan_su_Tan_Phat" / TEN_THU_MUC_MAU, nha / "Downloads" / TEN_THU_MUC_MAU,
            nha / "Desktop" / TEN_THU_MUC_MAU, nha / "Documents" / TEN_THU_MUC_MAU, nha / "OneDrive" / "Desktop" / TEN_THU_MUC_MAU]


def co_file_excel(p):
    try:
        return any(x for x in Path(p).rglob("*.xlsx") if not x.name.startswith("~$"))
    except Exception:
        return False


def tu_do_thu_muc():
    ghi("Tự dò thư mục dữ liệu ở các vị trí thường gặp:")
    for p in cac_vi_tri_thu():
        co = p.is_dir() and p.name == TEN_THU_MUC_MAU and co_file_excel(p)
        ghi(f"  {'CÓ' if co else 'không có'}: {p}")
        if co:
            return p
    return None


def hop_thoai_chon_thu_muc(goi_y=None):
    """Mở cửa sổ chọn thư mục. Trả về đường dẫn hoặc '' nếu bấm Hủy."""
    import tkinter as tk
    from tkinter import filedialog
    goc = tk.Tk()
    goc.withdraw()
    try:
        goc.attributes("-topmost", True)
    except Exception:
        pass
    chon = filedialog.askdirectory(parent=goc, title="Chọn thư mục dữ liệu nhân sự (thư mục Du_lieu_nhan_su_Tan_Phat)",
                                   initialdir=str(goi_y) if goi_y else str(Path.home()), mustexist=True)
    goc.destroy()
    return chon or ""


def chon_thu_muc_bang_tien_trinh_rieng(goi_y):
    """Mở cửa sổ chọn thư mục trong một tiến trình riêng (an toàn khi máy chủ đang chạy)."""
    lenh = [sys.executable, str(THU_MUC_TOOL / Path(__file__).name), "--chon-thu-muc", str(goi_y or "")]
    ghi(f"Mở cửa sổ chọn thư mục (gợi ý: {goi_y})")
    kq = subprocess.run(lenh, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if kq.returncode != 0:
        ghi(f"Cửa sổ chọn thư mục lỗi, mã {kq.returncode}: {rut_gon(kq.stderr)}")
        raise LoiNguoiDung("Không mở được cửa sổ chọn thư mục. Hãy thử lại; nếu vẫn lỗi, đóng phần mềm rồi mở lại.")
    return (kq.stdout or "").strip().splitlines()[-1].strip() if (kq.stdout or "").strip() else ""


def kiem_tra_thu_muc_chon(p):
    p = Path(p)
    if not p.is_dir():
        return "Thư mục không tồn tại."
    if not co_file_excel(p):
        return "Trong thư mục này không có file Excel (.xlsx) nào. Hãy chọn thư mục Du_lieu_nhan_su_Tan_Phat (thư mục chứa 01_Ho_so_nhan_su … 05_Luong)."
    return None


def xac_dinh_thu_muc_luc_mo():
    """Lần đầu: hiện cửa sổ chọn. Lần sau: dùng thư mục đã nhớ; nếu thư mục đã bị di chuyển thì tự dò, không được mới hỏi lại."""
    luu = CAU_HINH.get("thu_muc_du_lieu")
    if luu:
        if Path(luu).is_dir():
            ghi(f"Dùng thư mục dữ liệu đã nhớ: {luu}")
            return True
        ghi(f"Thư mục đã nhớ không còn tồn tại: {luu}")
        thay = None
        for p in [Path(luu)] + cac_vi_tri_thu():
            co = p.is_dir() and co_file_excel(p) and p.name == Path(luu).name
            ghi(f"  Thử {p}: {'CÓ' if co else 'không có'}")
            if co:
                thay = p
                break
        if thay:
            CAU_HINH["thu_muc_du_lieu"] = str(thay)
            luu_cau_hinh(CAU_HINH)
            ghi(f"Đã tìm lại được thư mục dữ liệu và ghi nhớ: {thay}")
            return True
    goi_y = tu_do_thu_muc() or Path.home() / "Downloads"
    for lan in range(3):
        try:
            in_man_hinh("Hãy chọn thư mục dữ liệu nhân sự trong cửa sổ vừa hiện ra…")
            chon = hop_thoai_chon_thu_muc(goi_y)
        except Exception:
            ghi_loi("Không mở được cửa sổ chọn thư mục bằng tkinter, chuyển sang nhập đường dẫn trong cửa sổ đen")
            try:
                chon = input("Dán đường dẫn thư mục dữ liệu rồi bấm Enter: ").strip().strip('"')
            except Exception:
                chon = ""
        if not chon:
            ghi("Người dùng bấm Hủy, chưa chọn thư mục")
            hop_thoai_bao_loi("Chưa chọn thư mục dữ liệu", "Phần mềm cần biết thư mục dữ liệu nhân sự để đọc. Hãy bấm đúp lại file chay_phan_mem.bat và chọn thư mục Du_lieu_nhan_su_Tan_Phat.")
            return False
        loi = kiem_tra_thu_muc_chon(chon)
        ghi(f"Người dùng chọn thư mục: {chon} → {'hợp lệ' if not loi else loi}")
        if not loi:
            CAU_HINH["thu_muc_du_lieu"] = str(Path(chon))
            luu_cau_hinh(CAU_HINH)
            return True
        hop_thoai_bao_loi("Thư mục chưa đúng", loi + " Bấm OK để chọn lại.")
        goi_y = chon
    return False


def tim_chrome():
    ung_vien = []
    if CAU_HINH.get("chrome"):
        ung_vien.append(("đường dẫn bạn đã nhập trong Cài đặt", CAU_HINH["chrome"]))
    if CAU_HINH.get("chrome_tim_thay"):
        ung_vien.append(("đường dẫn đã tìm thấy lần trước", CAU_HINH["chrome_tim_thay"]))
    for bien in ("PROGRAMFILES", "PROGRAMFILES(X86)", "LOCALAPPDATA"):
        g = os.environ.get(bien)
        if g:
            ung_vien.append((f"thư mục %{bien}%", str(Path(g) / "Google" / "Chrome" / "Application" / "chrome.exe")))
    if os.name == "nt":
        try:
            import winreg
            for goc in (winreg.HKEY_CURRENT_USER, winreg.HKEY_LOCAL_MACHINE):
                try:
                    with winreg.OpenKey(goc, r"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe") as k:
                        ung_vien.append(("sổ đăng ký Windows", winreg.QueryValue(k, None)))
                except OSError:
                    pass
        except Exception:
            ghi_loi("Không đọc được sổ đăng ký Windows để tìm Chrome")
    else:
        ung_vien += [("macOS", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"), ("Linux", "/usr/bin/google-chrome")]
    for nguon_goc, p in ung_vien:
        co = bool(p) and Path(p).is_file()
        ghi(f"  Tìm Chrome ở {nguon_goc}: {p} → {'CÓ' if co else 'không có'}")
        if co:
            if CAU_HINH.get("chrome_tim_thay") != p:
                CAU_HINH["chrome_tim_thay"] = p
                luu_cau_hinh(CAU_HINH)
            return p
    return None


def mo_trinh_duyet(url):
    chrome = TT["chrome"]
    if chrome:
        try:
            subprocess.Popen([chrome, "--new-window", url])
            ghi(f"Đã mở Chrome: {chrome} {url}")
            return
        except Exception:
            ghi_loi(f"Không mở được Chrome ở {chrome}, chuyển sang trình duyệt mặc định")
    try:
        import webbrowser
        webbrowser.open(url)
        ghi(f"Đã mở trình duyệt mặc định: {url}")
    except Exception:
        ghi_loi("Không mở được trình duyệt")
        in_man_hinh(f"Hãy tự mở Chrome và gõ địa chỉ: {url}")


def mo_tren_may(p):
    p = str(p)
    if os.name == "nt":
        os.startfile(p)  # noqa
    elif sys.platform == "darwin":
        subprocess.Popen(["open", p])
    else:
        subprocess.Popen(["xdg-open", p])

# =====================================================================
# MÁY CHỦ TRÊN MÁY (127.0.0.1)
# =====================================================================
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler


class XuLy(BaseHTTPRequestHandler):
    server_version = "HeThongNhanSu"

    def log_message(self, *a):
        pass

    def _gui(self, ma, du_lieu, kieu="application/json; charset=utf-8", loi=None):
        try:
            body = du_lieu if isinstance(du_lieu, bytes) else json.dumps(du_lieu, ensure_ascii=False, default=str).encode("utf-8")
            self.send_response(ma)
            self.send_header("Content-Type", kieu)
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)
            ghi(f"Yêu cầu {self.command} {self.path} → mã {ma}, {len(body)} byte, kiểu {kieu.split(';')[0]}" + (f" | Lời nhắn: {rut_gon(loi)}" if loi else ""))
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            ghi(f"Yêu cầu {self.command} {self.path}: trình duyệt đã ngắt kết nối trước khi nhận xong (thường do tải lại trang, không ảnh hưởng)")
        except Exception:
            ghi_loi(f"Lỗi khi gửi phản hồi cho {self.path}")

    def _loi(self, ma, thong_diep):
        self._gui(ma, {"ok": False, "loi": thong_diep, "nhat_ky": str(FILE_NHAT_KY)}, loi=thong_diep)

    def _cung_nguon(self):
        goc = self.headers.get("Origin")
        if not goc:
            return True
        cho = {f"http://127.0.0.1:{TT['cong']}", f"http://localhost:{TT['cong']}"}
        return goc in cho

    def _doc_json(self):
        n = int(self.headers.get("Content-Length") or 0)
        if n <= 0:
            return {}
        try:
            return json.loads(self.rfile.read(n).decode("utf-8"))
        except Exception:
            raise LoiNguoiDung("Yêu cầu gửi lên không đọc được. Hãy tải lại trang (bấm F5) rồi thử lại.")

    def do_GET(self):
        try:
            duong = urllib.parse.urlparse(self.path).path
            if duong in ("/", "/index.html"):
                self._gui(200, TRANG_HTML.encode("utf-8"), "text/html; charset=utf-8")
            elif duong == "/api/ping":
                self._gui(200, {"ok": True, "ung_dung": TEN_UNG_DUNG, "phien_ban": PHIEN_BAN})
            elif duong == "/api/du-lieu":
                if TT["du_lieu"] is None:
                    quet_va_tong_ket()
                self._gui(200, goi_du_lieu())
            elif duong == "/favicon.ico":
                self._gui(204, b"", "image/x-icon")
            else:
                self._loi(404, "Không có trang này. Hãy mở lại địa chỉ gốc của phần mềm.")
        except LoiNguoiDung as e:
            self._loi(400, str(e))
        except Exception:
            ghi_loi(f"Lỗi khi xử lý GET {self.path}")
            self._loi(500, "Phần mềm gặp lỗi khi đọc dữ liệu. Hãy bấm \"Quét lại thư mục\"; nếu vẫn lỗi, đóng cửa sổ đen và mở lại phần mềm.")

    def do_POST(self):
        try:
            if not self._cung_nguon():
                ghi(f"Từ chối yêu cầu {self.path} từ trang khác: {self.headers.get('Origin')}")
                return self._loi(403, "Yêu cầu bị từ chối vì không đến từ giao diện của phần mềm.")
            duong = urllib.parse.urlparse(self.path).path
            if duong == "/api/quet-lai":
                quet_va_tong_ket()
                self._gui(200, goi_du_lieu())
            elif duong == "/api/kiem-tra-file":
                n = int(self.headers.get("Content-Length") or 0)
                if n <= 0:
                    raise LoiNguoiDung("Không nhận được nội dung file. Hãy chọn lại file.")
                if n > 80 * 1024 * 1024:
                    raise LoiNguoiDung("File quá lớn (trên 80 MB). File chấm công một tháng thường chỉ vài MB, hãy kiểm tra lại có chọn nhầm file không.")
                ten = urllib.parse.unquote(self.headers.get("X-Ten-File") or "file.xlsx")
                self._gui(200, kiem_tra_file_moi(ten, self.rfile.read(n)))
            elif duong == "/api/nap-file":
                self._gui(200, nap_file(self._doc_json().get("token")))
            elif duong == "/api/cai-dat":
                d = self._doc_json()
                thong_bao = []
                cong = str(d.get("cong") or "").strip()
                if cong:
                    if not cong.isdigit() or not 1024 <= int(cong) <= 65535:
                        raise LoiNguoiDung("Cổng phải là số từ 1024 đến 65535 (ví dụ 8765).")
                    if int(cong) != CAU_HINH.get("cong"):
                        CAU_HINH["cong"] = int(cong)
                        thong_bao.append(f"Cổng {cong} sẽ dùng từ lần mở sau")
                chrome = str(d.get("chrome") or "").strip().strip('"')
                if chrome and not Path(chrome).is_file():
                    raise LoiNguoiDung(f"Không thấy file Chrome ở đường dẫn: {chrome}. Để trống ô này và bấm \"Tự tìm Chrome\".")
                if chrome != CAU_HINH.get("chrome", ""):
                    CAU_HINH["chrome"] = chrome
                    TT["chrome"] = chrome or tim_chrome()
                    thong_bao.append("Đã lưu đường dẫn Chrome")
                luu_cau_hinh(CAU_HINH)
                ghi(f"Người dùng lưu cài đặt: cổng={CAU_HINH.get('cong')}, chrome={CAU_HINH.get('chrome') or '(tự tìm)'}")
                self._gui(200, {"ok": True, "cai_dat": thong_tin_cai_dat(), "thong_bao": ". ".join(thong_bao) or "Không có gì thay đổi."})
            elif duong == "/api/tu-tim-chrome":
                ghi("Người dùng bấm Tự tìm Chrome")
                CAU_HINH.pop("chrome_tim_thay", None)
                TT["chrome"] = tim_chrome()
                self._gui(200, {"ok": True, "cai_dat": thong_tin_cai_dat(),
                                "thong_bao": f"Đã tìm thấy Chrome: {TT['chrome']}" if TT["chrome"] else "Không tìm thấy Chrome, phần mềm sẽ dùng trình duyệt mặc định."})
            elif duong == "/api/chon-thu-muc":
                chon = chon_thu_muc_bang_tien_trinh_rieng(thu_muc_du_lieu() or Path.home())
                if not chon:
                    ghi("Người dùng bấm Hủy khi đổi thư mục")
                    return self._gui(200, {"ok": True, "huy": True})
                loi = kiem_tra_thu_muc_chon(chon)
                ghi(f"Người dùng đổi thư mục dữ liệu sang: {chon} → {'hợp lệ' if not loi else loi}")
                if loi:
                    raise LoiNguoiDung(loi)
                CAU_HINH["thu_muc_du_lieu"] = str(Path(chon))
                luu_cau_hinh(CAU_HINH)
                quet_va_tong_ket()
                self._gui(200, goi_du_lieu())
            elif duong == "/api/mo":
                loai = self._doc_json().get("loai")
                p = {"nhat-ky": FILE_NHAT_KY, "thu-muc-du-lieu": thu_muc_du_lieu(), "thu-muc-tool": THU_MUC_TOOL}.get(loai)
                if not p or not Path(p).exists():
                    raise LoiNguoiDung("Không tìm thấy file hoặc thư mục cần mở.")
                mo_tren_may(p)
                self._gui(200, {"ok": True})
            elif duong == "/api/ghi-loi-giao-dien":
                d = self._doc_json()
                ghi(f"LỖI TRÊN GIAO DIỆN: {rut_gon(d.get('thong_diep'), 500)}\n{rut_gon(d.get('chi_tiet'), 3000)}")
                self._gui(200, {"ok": True})
            else:
                self._loi(404, "Không có chức năng này.")
        except LoiNguoiDung as e:
            ghi(f"Thông báo cho người dùng ({self.path}): {e}")
            self._loi(400, str(e))
        except Exception:
            ghi_loi(f"Lỗi khi xử lý POST {self.path}")
            self._loi(500, "Phần mềm gặp lỗi khi thực hiện thao tác này. Hãy thử lại; nếu vẫn lỗi, đóng cửa sổ đen và mở lại phần mềm.")


def dang_chay_o_cong(cong):
    url = f"http://127.0.0.1:{cong}/api/ping"
    try:
        with urllib.request.urlopen(url, timeout=1.5) as r:
            body = r.read()
            ghi(f"Kiểm tra {url} → mã {r.status}, {len(body)} byte, kiểu {r.headers.get('Content-Type')}")
            return json.loads(body.decode("utf-8")).get("ung_dung") == TEN_UNG_DUNG
    except urllib.error.HTTPError as e:
        ghi(f"Kiểm tra {url} → mã {e.code} (cổng đang bị chương trình khác dùng)")
    except Exception as e:
        ghi(f"Kiểm tra {url} → chưa có gì chạy ({type(e).__name__})")
    return False


def khoi_dong_may_chu():
    thu = []
    for c in [CAU_HINH.get("cong"), CAU_HINH.get("cong_chay_duoc"), CONG_MAC_DINH] + list(range(CONG_MAC_DINH + 1, CONG_MAC_DINH + 12)):
        if c and c not in thu:
            thu.append(int(c))
    for c in thu:
        if dang_chay_o_cong(c):
            ghi(f"Phần mềm đã đang chạy ở cổng {c} → mở lại trình duyệt, không mở thêm bản thứ hai")
            return None, c
        try:
            may_chu = ThreadingHTTPServer(("127.0.0.1", c), XuLy)
            ghi(f"Mở máy chủ ở cổng {c}: thành công")
            if CAU_HINH.get("cong_chay_duoc") != c:
                CAU_HINH["cong_chay_duoc"] = c
                luu_cau_hinh(CAU_HINH)
            return may_chu, c
        except OSError as e:
            ghi(f"Mở máy chủ ở cổng {c}: không được ({rut_gon(e)}) → thử cổng khác")
    raise LoiNguoiDung("Không tìm được cổng trống để chạy phần mềm. Hãy khởi động lại máy tính rồi mở lại.")

# =====================================================================
# CHƯƠNG TRÌNH CHÍNH
# =====================================================================
def chinh():
    global CAU_HINH
    ghi("=" * 20 + " Mở tool " + "=" * 20)
    ghi(f"Phiên bản tool: {PHIEN_BAN} | Python {platform.python_version()} ({sys.executable}) | Hệ điều hành: {platform.platform()}")
    CAU_HINH = doc_cau_hinh()
    ghi(f"Thư mục tool: {THU_MUC_TOOL} | File cấu hình: {FILE_CAU_HINH} | Nhật ký: {FILE_NHAT_KY}")
    ghi(f"Thiết lập đang dùng: thư mục dữ liệu = {CAU_HINH.get('thu_muc_du_lieu') or '(chưa chọn)'}; "
        f"cổng ưu tiên = {CAU_HINH.get('cong') or CAU_HINH.get('cong_chay_duoc') or CONG_MAC_DINH}; "
        f"Chrome = {CAU_HINH.get('chrome') or CAU_HINH.get('chrome_tim_thay') or '(tự tìm)'}; địa chỉ máy chủ = 127.0.0.1")
    if sys.version_info < (3, 8):
        hop_thoai_bao_loi("Python quá cũ", f"Máy đang dùng Python {platform.python_version()}. Hãy cài Python 3.10 trở lên từ python.org rồi mở lại.")
        return 1
    in_man_hinh(f"HỆ THỐNG NHÂN SỰ TÂN PHÁT – phiên bản {PHIEN_BAN}")
    if not dam_bao_thu_vien():
        hop_thoai_bao_loi("Chưa cài được thư viện đọc Excel",
                          "Phần mềm cần thư viện openpyxl nhưng tự cài không được. Hãy kiểm tra máy có kết nối Internet rồi bấm đúp lại chay_phan_mem.bat.")
        return 1
    don_file_tam()
    may_chu, cong = khoi_dong_may_chu()
    TT["cong"] = cong
    url = f"http://127.0.0.1:{cong}/"
    TT["chrome"] = tim_chrome()
    if may_chu is None:
        mo_trinh_duyet(url)
        in_man_hinh("Phần mềm đã đang chạy ở một cửa sổ khác. Đã mở lại trình duyệt.")
        time.sleep(2)
        return 0
    if not xac_dinh_thu_muc_luc_mo():
        may_chu.server_close()
        return 1
    ghi(f"Thiết lập sau khi mở: thư mục dữ liệu = {CAU_HINH.get('thu_muc_du_lieu')}; địa chỉ máy chủ = {url}; Chrome = {TT['chrome'] or 'không tìm thấy, dùng trình duyệt mặc định'}")
    in_man_hinh("Đang đọc dữ liệu Excel…")
    try:
        quet_va_tong_ket()
    except LoiNguoiDung as e:
        ghi(f"Chưa quét được lúc mở: {e}")
    except Exception:
        ghi_loi("Lỗi khi quét thư mục lúc mở (giao diện vẫn mở để người dùng xử lý)")
    if "--khong-mo-trinh-duyet" not in sys.argv:
        mo_trinh_duyet(url)
    in_man_hinh("")
    in_man_hinh(f"Phần mềm đang chạy tại: {url}")
    in_man_hinh("ĐỪNG TẮT cửa sổ màu đen này khi còn dùng phần mềm (có thể thu nhỏ xuống thanh tác vụ).")
    in_man_hinh("Muốn thoát: đóng cửa sổ này.")
    in_man_hinh(f"Nhật ký: {FILE_NHAT_KY}")
    try:
        may_chu.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        ghi("===== Đóng tool =====")
    return 0


# =====================================================================
# GIAO DIỆN (đã duyệt) – không cần sửa
# =====================================================================
TRANG_HTML = r'''<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Nhân sự Tân Phát</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500&display=swap">
<style>
/* Bố cục: menu dọc cố định bên trái, vùng làm việc bên phải; hồ sơ nhân viên mở dạng ngăn trượt từ phải. */
:root{
  --bg:#f2f4f1; --surface:#ffffff; --surface-2:#eef1ed; --fg:#1b2420; --muted:#5b6964; --line:#dde3de; --line-2:#c9d2cc;
  --accent:#0e6655; --accent-fg:#ffffff; --accent-soft:#dcefe9;
  --side:#15332c; --side-fg:#cfe0da; --side-mute:#86a39a; --side-active:#224a40;
  --warn:#9a6310; --warn-soft:#fbefd8; --crit:#b3261e; --crit-soft:#fbe3e0; --ok:#2b7a4b; --ok-soft:#dff1e5; --info:#2b5c9e; --info-soft:#e2ebf7;
  --bar-2:#9dcfc2;
  --f-ui:"Be Vietnam Pro",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --f-mono:"IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace;
  --r:8px;
}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){
  --bg:#101614; --surface:#171f1c; --surface-2:#1e2824; --fg:#e3ebe7; --muted:#95a49e; --line:#29352f; --line-2:#36443e;
  --accent:#4fb8a0; --accent-fg:#08201a; --accent-soft:#173a32;
  --side:#0b1210; --side-fg:#c6d6d0; --side-mute:#6f8a82; --side-active:#1a302a;
  --warn:#e3aa4f; --warn-soft:#3a2b10; --crit:#f07a70; --crit-soft:#3d1a17; --ok:#6cc28f; --ok-soft:#15301f; --info:#86ade8; --info-soft:#182840;
  --bar-2:#2d6b5c; color-scheme:dark}}
:root[data-theme="dark"]{
  --bg:#101614; --surface:#171f1c; --surface-2:#1e2824; --fg:#e3ebe7; --muted:#95a49e; --line:#29352f; --line-2:#36443e;
  --accent:#4fb8a0; --accent-fg:#08201a; --accent-soft:#173a32;
  --side:#0b1210; --side-fg:#c6d6d0; --side-mute:#6f8a82; --side-active:#1a302a;
  --warn:#e3aa4f; --warn-soft:#3a2b10; --crit:#f07a70; --crit-soft:#3d1a17; --ok:#6cc28f; --ok-soft:#15301f; --info:#86ade8; --info-soft:#182840;
  --bar-2:#2d6b5c; color-scheme:dark}
[hidden]{display:none!important}
html,body{height:100%}
body{background:var(--bg);color:var(--fg);font-family:var(--f-ui);font-size:14px;line-height:1.45}
*{box-sizing:border-box}
button,input,select{font:inherit;color:inherit}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.app{display:grid;grid-template-columns:236px minmax(0,1fr);min-height:100%}
/* Menu trái */
.side{background:var(--side);color:var(--side-fg);position:sticky;top:0;height:100vh;display:flex;flex-direction:column;padding-block:18px 14px}
.brand{padding-inline:20px;display:flex;gap:10px;align-items:center;margin-bottom:22px}
.brand-mark{width:34px;height:34px;border-radius:8px;background:var(--accent);color:var(--accent-fg);display:grid;place-items:center;font-weight:700;font-size:15px;letter-spacing:.02em}
.brand b{display:block;font-size:15px;color:#fff;font-weight:600;line-height:1.2}
:root[data-theme="dark"] .brand b{color:var(--fg)}
.brand small{color:var(--side-mute);font-size:12px}
.nav{display:flex;flex-direction:column;gap:2px;padding-inline:10px;overflow-y:auto}
.nav-group{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--side-mute);padding:14px 12px 6px}
.nav button{all:unset;cursor:pointer;display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:7px;color:var(--side-fg);font-size:14px}
.nav button:hover{background:var(--side-active)}
.nav button[aria-current="page"]{background:var(--side-active);color:#fff;font-weight:600;box-shadow:inset 3px 0 0 var(--accent)}
:root[data-theme="dark"] .nav button[aria-current="page"]{color:var(--fg)}
.nav button:focus-visible{outline:2px solid var(--accent)}
.nav svg{width:18px;height:18px;flex:none;stroke:currentColor;fill:none;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;opacity:.85}
.nav .badge{margin-left:auto;background:var(--crit);color:#fff;font-size:11px;font-weight:600;border-radius:10px;padding:1px 7px;font-variant-numeric:tabular-nums}
.side-foot{margin-top:auto;padding:14px 20px 0;font-size:12px;color:var(--side-mute);border-top:1px solid rgba(255,255,255,.08)}
.side-foot b{color:var(--side-fg);font-weight:500}
/* Vùng chính */
.main{min-width:0;padding-inline:28px;padding-block:22px 48px}
.sample{display:flex;gap:8px;align-items:center;background:var(--info-soft);color:var(--info);border-radius:var(--r);padding:8px 12px;font-size:13px;margin-bottom:18px}
.page-head{display:flex;flex-wrap:wrap;gap:12px 20px;align-items:flex-end;justify-content:space-between;margin-bottom:18px}
.page-head h1{margin:0;font-size:22px;font-weight:700;letter-spacing:-.01em;text-wrap:balance}
.page-head p{margin:4px 0 0;color:var(--muted);font-size:13px}
.src{display:inline-flex;flex-wrap:wrap;gap:6px}
.chip{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;padding:2px 8px;border-radius:20px;background:var(--surface-2);color:var(--muted);border:1px solid var(--line);white-space:nowrap}
.chip.file::before{content:"";width:9px;height:11px;border:1.5px solid currentColor;border-radius:2px;opacity:.7}
.card{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:16px 18px;min-width:0}
.card h2{margin:0 0 2px;font-size:15px;font-weight:600}
.card .sub{color:var(--muted);font-size:12.5px;margin:0 0 14px}
.grid-kpi{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:14px}
.kpi{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:14px 16px;display:flex;flex-direction:column;gap:4px;min-width:0}
.kpi .lbl{font-size:12.5px;color:var(--muted);display:flex;justify-content:space-between;gap:6px}
.kpi .val{font-size:28px;font-weight:700;letter-spacing:-.02em;font-variant-numeric:tabular-nums;line-height:1.15}
.kpi .val small{font-size:14px;font-weight:500;color:var(--muted);margin-left:4px}
.kpi .note{font-size:12.5px;color:var(--muted)}
.kpi .note b{font-weight:600;color:var(--fg)}
.kpi.alert{border-color:var(--warn)}
.kpi select{border:1px solid var(--line);background:var(--surface-2);border-radius:6px;font-size:12px;padding:1px 4px}
.linkish{all:unset;cursor:pointer;color:var(--accent);font-weight:500;font-size:13px}
.linkish:hover{text-decoration:underline}
.grid-2{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:14px;margin-bottom:14px}
/* Biểu đồ phòng ban */
.hbar{display:grid;grid-template-columns:minmax(120px,190px) minmax(0,1fr) 64px;gap:8px 12px;align-items:center;font-size:13px}
.hbar .nm{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hbar .track{position:relative;height:16px;background:var(--surface-2);border-radius:4px}
.hbar .fill{position:absolute;inset:0 auto 0 0;background:var(--accent);border-radius:4px}
.hbar .fill.ts{background:repeating-linear-gradient(135deg,var(--bar-2) 0 4px,transparent 4px 7px);border-radius:0 4px 4px 0}
.hbar .mark{position:absolute;top:-4px;bottom:-4px;width:2px;background:var(--fg);opacity:.55}
.hbar .num{text-align:right;font-variant-numeric:tabular-nums;color:var(--muted)}
.hbar .num b{color:var(--fg)}
.hbar .num.over b{color:var(--warn)}
.legend{display:flex;flex-wrap:wrap;gap:14px;margin-top:14px;font-size:12px;color:var(--muted)}
.legend i{display:inline-block;width:12px;height:10px;border-radius:2px;margin-right:5px;vertical-align:-1px}
.lg-a{background:var(--accent)} .lg-b{background:var(--bar-2)} .lg-ts{background:repeating-linear-gradient(135deg,var(--bar-2) 0 3px,transparent 3px 5px);border:1px solid var(--bar-2)}
.lg-m{width:2px!important;height:12px!important;background:var(--fg);opacity:.55}
/* Biểu đồ cột */
svg.vchart{width:100%;height:auto;display:block}
.vchart .grid{stroke:var(--line);stroke-width:1}
.vchart .axis{fill:var(--muted);font-size:11px;font-family:var(--f-ui)}
.vchart .b-tong{fill:var(--bar-2)} .vchart .b-thuc{fill:var(--accent)}
.vchart .b-none{fill:none;stroke:var(--line-2);stroke-dasharray:4 4}
.vchart .vl{fill:var(--fg);font-size:11.5px;font-weight:600;font-family:var(--f-ui)}
.vchart .vl2{fill:var(--muted);font-size:10.5px;font-family:var(--f-ui)}
/* Cảnh báo */
.alist{display:flex;flex-direction:column}
.aitem{display:grid;grid-template-columns:6px minmax(0,1fr) auto;gap:0 14px;padding:11px 0;border-top:1px solid var(--line);align-items:start}
.aitem:first-child{border-top:0}
.aitem .sev{align-self:stretch;border-radius:3px;background:var(--info)}
.aitem.crit .sev{background:var(--crit)} .aitem.warn .sev{background:var(--warn)}
.aitem .t{font-weight:600;font-size:13.5px;display:flex;flex-wrap:wrap;gap:4px 8px;align-items:center}
.aitem .d{color:var(--muted);font-size:12.5px;margin-top:2px}
.aitem .src{margin-top:6px}
.aitem .when{font-size:12px;color:var(--muted);text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
.aitem .when b{display:block;font-size:13px;color:var(--fg)}
.pill{display:inline-flex;align-items:center;font-size:11.5px;font-weight:600;padding:1px 8px;border-radius:20px;white-space:nowrap}
.p-ok{background:var(--ok-soft);color:var(--ok)} .p-warn{background:var(--warn-soft);color:var(--warn)} .p-crit{background:var(--crit-soft);color:var(--crit)} .p-info{background:var(--info-soft);color:var(--info)} .p-mute{background:var(--surface-2);color:var(--muted)}
.namebtn{all:unset;cursor:pointer;color:var(--accent);font-weight:600}
.namebtn:hover{text-decoration:underline}
.namebtn:focus-visible{outline:2px solid var(--accent)}
.mono{font-family:var(--f-mono);font-size:12.5px}
.typebar{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
.tbtn{all:unset;cursor:pointer;display:inline-flex;gap:8px;align-items:center;padding:7px 12px;border-radius:8px;background:var(--surface);border:1px solid var(--line);font-size:13px}
.tbtn b{font-variant-numeric:tabular-nums}
.tbtn[aria-pressed="true"]{border-color:var(--accent);background:var(--accent-soft);color:var(--accent);font-weight:600}
.tbtn:focus-visible{outline:2px solid var(--accent)}
/* Bộ lọc & bảng */
.filters{display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end;margin-bottom:12px}
.fld{display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--muted)}
.fld input,.fld select{border:1px solid var(--line-2);background:var(--surface);border-radius:7px;padding:7px 10px;font-size:13.5px;min-width:0}
.fld input[type=search]{width:250px;max-width:100%}
.seg{display:inline-flex;border:1px solid var(--line-2);border-radius:8px;overflow:hidden;background:var(--surface)}
.seg button{all:unset;cursor:pointer;padding:7px 12px;font-size:13px}
.seg button[aria-pressed="true"]{background:var(--accent);color:var(--accent-fg);font-weight:600}
.seg button:focus-visible{outline:2px solid var(--accent);outline-offset:-2px}
.stats{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:12px}
.stat{background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:8px 14px;min-width:0}
.stat span{display:block;font-size:11.5px;color:var(--muted)}
.stat b{font-size:17px;font-variant-numeric:tabular-nums}
.stat.warn b{color:var(--warn)}
.tbl-wrap{overflow:auto;border:1px solid var(--line);border-radius:10px;background:var(--surface);max-height:70vh}
table{border-collapse:separate;border-spacing:0;width:100%;font-size:13px}
th,td{padding:8px 12px;text-align:left;white-space:nowrap;border-bottom:1px solid var(--line)}
thead th{position:sticky;top:0;background:var(--surface-2);font-weight:600;font-size:12px;color:var(--muted);cursor:pointer;user-select:none;z-index:1}
thead th:hover{color:var(--fg)}
thead th .src-mark{color:var(--accent);font-weight:700;margin-left:3px}
th.num,td.num{text-align:right;font-variant-numeric:tabular-nums}
tbody tr:hover td{background:var(--surface-2)}
tfoot td{position:sticky;bottom:0;background:var(--surface-2);font-weight:700;border-top:1px solid var(--line-2)}
td.dim{color:var(--muted)}
.pager{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:10px;font-size:12.5px;color:var(--muted);flex-wrap:wrap}
.pager button{border:1px solid var(--line-2);background:var(--surface);border-radius:6px;padding:4px 10px;cursor:pointer}
.pager button:disabled{opacity:.4;cursor:default}
.note-line{font-size:12.5px;color:var(--muted);margin:0 0 10px}
.note-line b{color:var(--accent)}
.empty{padding:30px;text-align:center;color:var(--muted)}
/* Lưới chấm công */
.kh{display:inline-block;min-width:22px;text-align:center;border-radius:4px;font-size:11px;font-weight:600;padding:1px 3px}
.kh-X{color:var(--muted)} .kh-CT{background:var(--info-soft);color:var(--info)} .kh-P,.kh-R{background:var(--accent-soft);color:var(--accent)} .kh-L{background:var(--surface-2);color:var(--fg)}
.kh-Ô,.kh-TS{background:var(--warn-soft);color:var(--warn)} .kh-KL,.kh-KP{background:var(--crit-soft);color:var(--crit)}
.kh-late{box-shadow:inset 0 -2px 0 var(--crit)} .kh-ot{box-shadow:inset 0 -2px 0 var(--info)}
table.grid td,table.grid th{padding:5px 4px}
table.grid td:first-child,table.grid th:first-child{position:sticky;left:0;background:var(--surface);padding-inline:12px;z-index:1}
table.grid thead th:first-child{background:var(--surface-2);z-index:2}
table.grid th.sun{color:var(--crit)}
/* Ngăn hồ sơ */
.backdrop{position:fixed;inset:0;background:rgba(10,20,16,.38);z-index:20}
.drawer{position:fixed;top:0;right:0;bottom:0;width:min(760px,100%);background:var(--bg);z-index:21;display:flex;flex-direction:column;box-shadow:-10px 0 30px rgba(0,0,0,.18);padding-top:env(safe-area-inset-top,0px)}
.dr-head{background:var(--surface);border-bottom:1px solid var(--line);padding:18px 22px 0}
.dr-top{display:flex;gap:14px;align-items:flex-start}
.avatar{width:48px;height:48px;border-radius:50%;background:var(--accent-soft);color:var(--accent);display:grid;place-items:center;font-weight:700;font-size:17px;flex:none}
.dr-top h2{margin:0;font-size:19px}
.dr-top p{margin:3px 0 0;color:var(--muted);font-size:13px}
.xbtn{margin-left:auto;border:1px solid var(--line-2);background:var(--surface);border-radius:8px;padding:6px 12px;cursor:pointer}
.tabs{display:flex;gap:4px;margin-top:14px;overflow-x:auto}
.tabs button{all:unset;cursor:pointer;padding:9px 12px;font-size:13.5px;color:var(--muted);border-bottom:2px solid transparent;white-space:nowrap}
.tabs button[aria-selected="true"]{color:var(--accent);border-color:var(--accent);font-weight:600}
.tabs button:focus-visible{outline:2px solid var(--accent)}
.dr-body{overflow:auto;padding:18px 22px 40px;display:flex;flex-direction:column;gap:14px}
.kv{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 28px}
.kv div{display:grid;grid-template-columns:150px minmax(0,1fr);gap:10px;padding:7px 0;border-bottom:1px dashed var(--line);font-size:13px}
.kv dt,.kv .k{color:var(--muted)}
.kv .v{overflow-wrap:anywhere}
.sec-title{font-size:12px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);margin:0 0 6px;font-weight:600}
.mini-kpi{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.mini-kpi .stat b{font-size:18px}
/* Nhập dữ liệu */
.steps{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.step{display:flex;gap:8px;align-items:center;font-size:13px;color:var(--muted)}
.step i{font-style:normal;width:22px;height:22px;border-radius:50%;border:1.5px solid var(--line-2);display:grid;place-items:center;font-size:12px;font-weight:600}
.step.on{color:var(--fg);font-weight:600} .step.on i{background:var(--accent);border-color:var(--accent);color:var(--accent-fg)}
.step.done i{background:var(--accent-soft);border-color:var(--accent);color:var(--accent)}
.step+.step::before{content:"";width:24px;height:1px;background:var(--line-2)}
.drop{border:2px dashed var(--line-2);border-radius:12px;padding:28px 18px;text-align:center;background:var(--surface);transition:border-color .15s,background .15s}
.drop.over{border-color:var(--accent);background:var(--accent-soft)}
.drop b{display:block;font-size:15px;margin-bottom:4px}
.drop p{margin:0 0 12px;color:var(--muted);font-size:13px}
.btn{border:1px solid var(--line-2);background:var(--surface);border-radius:8px;padding:8px 14px;cursor:pointer;font-weight:500;font-size:13.5px}
.btn.pri{background:var(--accent);border-color:var(--accent);color:var(--accent-fg);font-weight:600}
.btn:disabled{opacity:.45;cursor:not-allowed}
.btn-row{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.checks{list-style:none;margin:0;padding:0;display:flex;flex-direction:column}
.checks li{display:grid;grid-template-columns:26px minmax(0,1fr);gap:8px;padding:9px 0;border-top:1px solid var(--line);font-size:13px}
.checks li:first-child{border-top:0}
.checks .ic{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:700}
.ic.ok{background:var(--ok-soft);color:var(--ok)} .ic.warn{background:var(--warn-soft);color:var(--warn)} .ic.err{background:var(--crit-soft);color:var(--crit)}
.checks small{display:block;color:var(--muted);margin-top:2px}
.toast{position:fixed;bottom:calc(20px + env(safe-area-inset-bottom,0px));left:50%;transform:translateX(-50%);background:var(--fg);color:var(--bg);padding:10px 18px;border-radius:8px;font-size:13.5px;z-index:30;box-shadow:0 6px 20px rgba(0,0,0,.2);max-width:calc(100% - 32px)}
.statusbar{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:8px 12px;font-size:13px;margin-bottom:18px;color:var(--muted)}
.statusbar b{color:var(--fg);font-weight:600}
.statusbar .warnt{color:var(--warn);font-weight:600}
.side-foot .path{display:block;word-break:break-all;font-weight:500;margin-bottom:10px}
.rescan{all:unset;cursor:pointer;display:block;text-align:center;background:var(--side-active);color:#fff;border-radius:7px;padding:8px 10px;font-weight:600;font-size:13px}
.rescan:hover{filter:brightness(1.15)}
.overlay{position:fixed;inset:0;background:rgba(10,20,16,.45);display:grid;place-items:center;z-index:40}
.ov-box{background:var(--surface);border-radius:12px;padding:26px 30px;text-align:center;max-width:360px;box-shadow:0 10px 40px rgba(0,0,0,.25)}
.ov-box p{margin:6px 0 0;color:var(--muted);font-size:13px}
.spin{width:34px;height:34px;border:3px solid var(--accent-soft);border-top-color:var(--accent);border-radius:50%;margin:0 auto 12px;animation:sp 0.9s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
.errbox{position:fixed;inset:0;background:rgba(10,20,16,.45);display:grid;place-items:center;z-index:50;padding:16px}
.err-in{background:var(--surface);border-radius:12px;padding:22px 24px;max-width:560px;width:100%;border-top:4px solid var(--crit);box-shadow:0 10px 40px rgba(0,0,0,.25)}
.err-in b{font-size:16px;color:var(--crit)}
.err-in p{margin:10px 0}
.err-help{font-size:12.5px;color:var(--muted);background:var(--surface-2);border-radius:8px;padding:10px 12px}
.err-help .mono{word-break:break-all;color:var(--fg)}
@media (max-width:1100px){.grid-kpi{grid-template-columns:repeat(2,minmax(0,1fr))}.grid-2{grid-template-columns:minmax(0,1fr)}}
@media (max-width:860px){
  .app{grid-template-columns:minmax(0,1fr)}
  .side{position:static;height:auto;padding-block:12px 8px}
  .brand{margin-bottom:8px;padding-inline:16px}
  .nav{flex-direction:row;overflow-x:auto;padding-inline:8px;padding-bottom:4px}
  .nav-group{display:none}
  .nav button{white-space:nowrap;padding:8px 10px}
  .side-foot{display:none}
  .main{padding-inline:16px}
  .kv{grid-template-columns:minmax(0,1fr)}
  .mini-kpi{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:520px){.grid-kpi{grid-template-columns:minmax(0,1fr)}.hbar{grid-template-columns:minmax(0,1fr) 56px}.hbar .nm{grid-column:1/-1}.kv div{grid-template-columns:120px minmax(0,1fr)}.fld input[type=search]{width:100%}.fld{flex:1 1 140px}}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
</head><body>
<div class="app">
  <aside class="side">
    <div class="brand"><div class="brand-mark">TP</div><div><b>Nhân sự Tân Phát</b><small>Công ty TNHH Thực phẩm Tân Phát</small></div></div>
    <nav class="nav" id="nav" aria-label="Menu chính">
      <div class="nav-group">Tổng quan</div>
      <button data-page="dash"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>Bảng điều hành</button>
      <button data-page="viec"><svg viewBox="0 0 24 24"><path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 10v4.5M12 17.5v.01"/></svg>Việc cần xử lý<span class="badge" id="navBadge"></span></button>
      <div class="nav-group">Dữ liệu nhân sự</div>
      <button data-page="nv"><svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.8c1.6.8 2.6 2.5 3 5.2"/></svg>Nhân viên</button>
      <button data-page="hd"><svg viewBox="0 0 24 24"><path d="M6 2.5h8.5L19 7v14.5H6z"/><path d="M14 2.5V7h5M9 12h7M9 16h5"/></svg>Hợp đồng</button>
      <button data-page="cc"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>Chấm công</button>
      <button data-page="np"><svg viewBox="0 0 24 24"><rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4M9 15l2 2 4-4"/></svg>Nghỉ phép</button>
      <button data-page="bl"><svg viewBox="0 0 24 24"><rect x="2.5" y="6" width="19" height="12.5" rx="2"/><circle cx="12" cy="12.2" r="2.8"/><path d="M6 9.5v5.5M18 9.5v5.5"/></svg>Bảng lương</button>
      <div class="nav-group">Hệ thống</div>
      <button data-page="nhap"><svg viewBox="0 0 24 24"><path d="M12 15V3.5M7.5 8 12 3.5 16.5 8"/><path d="M4 14.5v5h16v-5"/></svg>Nhập thêm dữ liệu</button>
      <button data-page="caidat"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>Cài đặt</button>
    </nav>
    <div class="side-foot">Hôm nay: <b id="footDate"></b><br>Thư mục dữ liệu:<br><b id="footFolder" class="path"></b><button class="rescan" data-rescan>↻ Quét lại thư mục</button></div>
  </aside>

  <main class="main" id="main">
    <div class="statusbar" id="statusbar"><span id="sbText">Đang đọc dữ liệu…</span><button class="btn" data-rescan>↻ Quét lại thư mục</button></div>

    <section id="p-dash" hidden>
      <div class="page-head"><div><h1>Bảng điều hành</h1><p>Số liệu tổng hợp tính đến ngày <span class="today"></span></p></div></div>
      <div class="grid-kpi" id="kpis"></div>
      <div class="grid-2">
        <div class="card"><h2>Nhân sự theo phòng ban</h2><p class="sub">So với định biên trong danh mục phòng ban</p><div id="chartPB"></div></div>
        <div class="card"><h2>Quỹ lương theo tháng</h2><p class="sub">Tổng thu nhập và thực lĩnh, đơn vị: tỷ đồng</p><div id="chartLuong"></div></div>
      </div>
      <div class="card"><div style="display:flex;justify-content:space-between;gap:10px;align-items:baseline;flex-wrap:wrap"><div><h2>Việc cần xử lý gấp</h2><p class="sub">Những việc đến hạn sớm nhất, đối chiếu từ nhiều file</p></div><button class="linkish" data-go="viec">Xem tất cả →</button></div><div class="alist" id="dashAlerts"></div></div>
    </section>

    <section id="p-viec" hidden>
      <div class="page-head"><div><h1>Việc cần xử lý</h1><p>Mỗi cảnh báo chỉ thấy được khi ghép nhiều file với nhau qua cột Mã NV</p></div></div>
      <div class="typebar" id="viecTypes"></div>
      <div class="filters">
        <label class="fld">Tìm kiếm<input type="search" id="vSearch" placeholder="Tên hoặc Mã NV"></label>
        <label class="fld">Mức độ<select id="vSev"><option value="">Tất cả</option><option value="crit">Gấp</option><option value="warn">Sắp đến hạn</option><option value="info">Theo dõi</option></select></label>
        <label class="fld">Phòng ban<select id="vPB" class="pb-select"></select></label>
      </div>
      <div class="card"><div class="alist" id="viecList"></div></div>
    </section>

    <section id="p-nv" hidden>
      <div class="page-head"><div><h1>Danh sách nhân viên</h1><p>Bấm vào tên để mở hồ sơ đầy đủ</p></div><div class="src"><span class="chip file" data-loai="DANH_SACH_NHAN_VIEN">Danh_sach_nhan_vien.xlsx</span></div></div>
      <div class="filters">
        <label class="fld">Tìm kiếm<input type="search" id="nSearch" placeholder="Tên, Mã NV, số điện thoại"></label>
        <label class="fld">Phòng ban<select id="nPB" class="pb-select"></select></label>
        <label class="fld">Chức vụ<select id="nCV"></select></label>
        <label class="fld">Trạng thái<select id="nTT"><option value="dang">Đang làm (kể cả thai sản)</option><option value="Đang làm việc">Đang làm việc</option><option value="Nghỉ thai sản">Nghỉ thai sản</option><option value="Đã nghỉ việc">Đã nghỉ việc</option><option value="">Tất cả</option></select></label>
      </div>
      <p class="note-line">Cột có dấu <b>↗</b> được lấy từ file khác, nối qua Mã NV.</p>
      <div id="nvTable"></div>
    </section>

    <section id="p-hd" hidden>
      <div class="page-head"><div><h1>Hợp đồng lao động</h1><p>Toàn bộ hợp đồng từ 2012, kể cả hợp đồng thử việc</p></div><div class="src"><span class="chip file" data-loai="SO_THEO_DOI_HDLD">So_theo_doi_hop_dong.xlsx</span></div></div>
      <div class="filters">
        <label class="fld">Tìm kiếm<input type="search" id="hSearch" placeholder="Tên, Mã NV, số hợp đồng"></label>
        <label class="fld">Tháng hết hạn<select id="hThang"></select></label>
        <label class="fld">Tình trạng<select id="hTT"><option value="Đang hiệu lực">Đang hiệu lực</option><option value="Đã hết hạn">Đã hết hạn</option><option value="Đã chấm dứt">Đã chấm dứt</option><option value="">Tất cả</option></select></label>
        <label class="fld">Loại hợp đồng<select id="hLoai"></select></label>
        <label class="fld">Phòng ban<select id="hPB" class="pb-select"></select></label>
      </div>
      <div class="stats" id="hStats"></div>
      <div id="hdTable"></div>
    </section>

    <section id="p-cc" hidden>
      <div class="page-head"><div><h1>Chấm công</h1><p id="ccSub">Dữ liệu máy chấm công vân tay, đã đối chiếu đơn nghỉ phép</p></div><div class="src" id="ccSrc"></div></div>
      <div class="filters">
        <label class="fld">Tháng<select id="cThang"></select></label>
        <label class="fld">Tìm kiếm<input type="search" id="cSearch" placeholder="Tên hoặc Mã NV"></label>
        <label class="fld">Phòng ban<select id="cPB" class="pb-select"></select></label>
        <label class="fld">Ký hiệu<select id="cKH"></select></label>
        <div class="fld">Cách xem<div class="seg" id="cView"><button data-v="tong" aria-pressed="true">Tổng hợp</button><button data-v="luoi" aria-pressed="false">Lưới theo ngày</button><button data-v="chitiet" aria-pressed="false">Chi tiết</button></div></div>
      </div>
      <div class="stats" id="cStats"></div>
      <div id="ccTable"></div>
    </section>

    <section id="p-np" hidden>
      <div class="page-head"><div><h1>Nghỉ phép</h1><p>Đơn xin nghỉ năm <span class="nam"></span> và quỹ phép năm của từng người</p></div><div class="src"><span class="chip file" data-loai="DON_NGHI_PHEP">Don_nghi_phep_2026.xlsx</span></div></div>
      <div class="filters">
        <div class="fld">Xem<div class="seg" id="pView"><button data-v="don" aria-pressed="true">Đơn nghỉ phép</button><button data-v="quy" aria-pressed="false">Quỹ phép năm</button></div></div>
        <label class="fld">Tìm kiếm<input type="search" id="pSearch" placeholder="Tên, Mã NV, số đơn"></label>
        <label class="fld p-don">Tháng nghỉ<select id="pThang"></select></label>
        <label class="fld p-don">Trạng thái<select id="pTT"><option value="">Tất cả</option><option>Chờ duyệt</option><option>Đã duyệt</option><option>Từ chối</option></select></label>
        <label class="fld p-don">Loại nghỉ<select id="pLoai"></select></label>
        <label class="fld">Phòng ban<select id="pPB" class="pb-select"></select></label>
        <label class="fld p-quy" hidden>Còn lại<select id="pCon"><option value="">Tất cả</option><option value="1">Còn ≤ 1 ngày</option><option value="10">Còn ≥ 10 ngày</option></select></label>
      </div>
      <div class="stats" id="pStats"></div>
      <div id="npTable"></div>
    </section>

    <section id="p-bl" hidden>
      <div class="page-head"><div><h1>Bảng lương</h1><p>Bảng thanh toán tiền lương, đơn vị: đồng</p></div><div class="src"><span class="chip file" data-loai="BANG_LUONG">Bang_luong_2026.xlsx</span></div></div>
      <div class="filters">
        <label class="fld">Tháng<select id="bThang"></select></label>
        <label class="fld">Tìm kiếm<input type="search" id="bSearch" placeholder="Tên hoặc Mã NV"></label>
        <label class="fld">Phòng ban<select id="bPB" class="pb-select"></select></label>
        <div class="fld">Số cột<div class="seg" id="bCols"><button data-v="gon" aria-pressed="true">Cột chính</button><button data-v="du" aria-pressed="false">Đủ 39 cột</button></div></div>
      </div>
      <div class="stats" id="bStats"></div>
      <div id="blTable"></div>
    </section>

    <section id="p-nhap" hidden>
      <div class="page-head"><div><h1>Nhập thêm dữ liệu</h1><p>Nạp file chấm công của tháng mới. Phần mềm kiểm tra trước, chỉ thêm khi không có lỗi.</p></div></div>
      <div class="grid-2">
        <div class="card">
          <h2>Nạp file chấm công tháng mới</h2>
          <p class="sub">File Excel xuất từ máy chấm công, cùng mẫu với các file Cham_cong_NNNN_TT.xlsx đang có: tiêu đề cột ở dòng 5, dữ liệu từ dòng 6. Khi bấm nạp, phần mềm <b>chép</b> file vào thư mục chấm công, không sửa file nào đang có.</p>
          <div class="steps" id="steps"><div class="step on"><i>1</i>Chọn file</div><div class="step"><i>2</i>Kiểm tra</div><div class="step"><i>3</i>Nạp vào thư mục</div></div>
          <div class="drop" id="drop">
            <b>Kéo thả file .xlsx vào đây</b>
            <p>hoặc bấm nút bên dưới để chọn từ máy</p>
            <div class="btn-row"><label class="btn pri" for="fileIn" tabindex="0">Chọn file chấm công</label></div>
            <input type="file" id="fileIn" accept=".xlsx,.xlsm" hidden>
          </div>
          <div id="checkBox" hidden style="margin-top:16px">
            <div class="stats" id="napStats"></div>
            <p class="sec-title" id="checkTitle"></p>
            <ul class="checks" id="checks"></ul>
            <p class="note-line" id="napDich"></p>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn pri" id="addBtn">Nạp vào thư mục</button><button class="btn" id="cancelBtn">Chọn file khác</button></div>
          </div>
        </div>
        <div class="card">
          <h2>Quy tắc kiểm tra khi nạp</h2>
          <p class="sub">Đối chiếu file mới với hồ sơ, danh mục và đơn nghỉ phép hiện có</p>
          <ul class="checks">
            <li><span class="ic ok">1</span><div>Đúng 16 cột, đúng tên và thứ tự như mẫu<small>STT, Ngày, Thứ, Mã NV … Ký hiệu, Ghi chú</small></div></li>
            <li><span class="ic ok">2</span><div>Chỉ chứa dữ liệu của một tháng<small>Tháng đã có thì hỏi lại trước khi thay thế</small></div></li>
            <li><span class="ic ok">3</span><div>Mã NV phải có trong hồ sơ nhân viên<small>Họ tên, phòng ban phải khớp hồ sơ</small></div></li>
            <li><span class="ic ok">4</span><div>Không trùng dòng cùng Mã NV và cùng ngày</div></li>
            <li><span class="ic ok">5</span><div>Ký hiệu nằm trong danh mục ký hiệu chấm công</div></li>
            <li><span class="ic ok">6</span><div>Ngày nghỉ P, R, Ô, KL, TS phải có đơn đã duyệt</div></li>
            <li><span class="ic ok">7</span><div>Không chấm công cho người đã nghỉ việc</div></li>
            <li><span class="ic ok">8</span><div>Cảnh báo người tăng ca vượt 40 giờ trong tháng</div></li>
          </ul>
        </div>
      </div>
      <div class="card" style="margin-bottom:14px" id="previewCard" hidden><h2>Xem trước 12 dòng đầu</h2><p class="sub" id="previewSub"></p><div id="previewTable"></div></div>
      <div class="card"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:baseline"><div><h2>Kết quả quét thư mục gần nhất</h2><p class="sub" id="srcSub">Mỗi sheet: phần mềm tìm dòng tiêu đề (thường là dòng 5) rồi đọc dữ liệu bên dưới</p></div><button class="btn" data-rescan>↻ Quét lại thư mục</button></div><div id="srcTable"></div></div>
    </section>

    <section id="p-caidat" hidden>
      <div class="page-head"><div><h1>Cài đặt</h1><p>Mọi thiết lập đều chỉnh ở đây, không cần mở file code</p></div></div>
      <div class="grid-2">
        <div class="card">
          <h2>Thư mục dữ liệu</h2><p class="sub">Thư mục chứa các thư mục con 01_Ho_so_nhan_su … 05_Luong</p>
          <div class="kv" style="grid-template-columns:minmax(0,1fr)"><div><span class="k">Đang dùng</span><span class="v mono" id="cdFolder"></span></div><div><span class="k">Thư mục chấm công</span><span class="v mono" id="cdCC"></span></div></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px"><button class="btn pri" id="cdDoiFolder">Chọn thư mục khác…</button><button class="btn" data-mo="thu-muc-du-lieu">Mở thư mục trong máy</button><button class="btn" data-rescan>↻ Quét lại thư mục</button></div>
        </div>
        <div class="card">
          <h2>Nhật ký</h2><p class="sub">Khi có lỗi, gửi file này cho người hỗ trợ. File đã che số căn cước, số tài khoản.</p>
          <div class="kv" style="grid-template-columns:minmax(0,1fr)"><div><span class="k">File nhật ký</span><span class="v mono" id="cdLog"></span></div><div><span class="k">Phiên bản</span><span class="v" id="cdVer"></span></div></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px"><button class="btn" data-mo="nhat-ky">Mở file nhật ký</button><button class="btn" data-mo="thu-muc-tool">Mở thư mục phần mềm</button></div>
        </div>
      </div>
      <div class="card">
        <h2>Máy chủ và trình duyệt</h2><p class="sub">Phần mềm chạy ngay trên máy của bạn, không gửi dữ liệu ra ngoài. Thay đổi cổng có hiệu lực từ lần mở sau.</p>
        <div class="filters" style="margin-top:6px">
          <label class="fld">Cổng máy chủ<input type="number" id="cdPort" min="1024" max="65535" style="width:130px"></label>
          <label class="fld" style="flex:1 1 360px">Đường dẫn Chrome (để trống để tự tìm)<input type="text" id="cdChrome" placeholder="C:\Program Files\Google\Chrome\Application\chrome.exe"></label>
          <button class="btn" id="cdTimChrome">Tự tìm Chrome</button>
          <button class="btn pri" id="cdLuu">Lưu cài đặt</button>
        </div>
        <p class="note-line" id="cdAddr"></p>
      </div>
    </section>
  </main>
</div>

<div class="backdrop" id="backdrop" hidden></div>
<aside class="drawer" id="drawer" hidden role="dialog" aria-modal="true" aria-labelledby="drName">
  <div class="dr-head">
    <div class="dr-top"><div class="avatar" id="drAv"></div><div style="min-width:0"><h2 id="drName"></h2><p id="drSub"></p></div><button class="xbtn" id="drClose">Đóng</button></div>
    <div class="tabs" role="tablist" id="drTabs">
      <button role="tab" data-t="tt" aria-selected="true">Thông tin cá nhân</button>
      <button role="tab" data-t="hd" aria-selected="false">Hợp đồng</button>
      <button role="tab" data-t="luong" aria-selected="false">Lương</button>
      <button role="tab" data-t="phep" aria-selected="false">Nghỉ phép</button>
      <button role="tab" data-t="cc" aria-selected="false">Chấm công</button>
    </div>
  </div>
  <div class="dr-body" id="drBody"></div>
</aside>
<div class="toast" id="toast" hidden></div>
<div class="overlay" id="loading"><div class="ov-box"><div class="spin"></div><b id="loadingText">Đang đọc dữ liệu từ thư mục…</b><p>Lần đầu có thể mất vài chục giây.</p></div></div>
<div class="errbox" id="errbox" hidden role="alertdialog" aria-labelledby="errTitle"><div class="err-in"><b id="errTitle">Có lỗi</b><p id="errMsg"></p><p class="err-help">Nếu lỗi lặp lại, gửi file nhat-ky.txt cho người hỗ trợ.<br>File nhật ký: <span class="mono" id="errLog"></span></p><button class="btn" id="errClose">Đã hiểu</button></div></div>
<script>
/* =====================================================================
   GIAO DIỆN – chỉ đọc từ DATA, nối các bảng qua cột "Mã NV".
   ===================================================================== */
/* ---------- Biến dùng chung – được điền khi nhận dữ liệu từ máy tính ---------- */
let HOM_NAY='', NAM='', DATA=null, NGUON=[], CAI_DAT={}, QTONG='Tổng phép năm', PB_LIST=[], LUC_QUET='';
const RONG={PHONG_BAN:[],CHUC_VU:[],CA_LAM_VIEC:[],KY_HIEU_CHAM_CONG:[],DANH_SACH_NHAN_VIEN:[],SO_THEO_DOI_HDLD:[],LICH_SU_LUONG:[],DON_NGHI_PHEP:[],QUY_PHEP_NAM:[],CHAM_CONG:{},BANG_LUONG:{}};
const CC_COLS=['STT','Ngày','Thứ','Mã NV','Họ và tên','Phòng ban','Tổ','Ca','Giờ vào','Giờ ra','Số giờ công','Đi muộn (phút)','Giờ tăng ca','Loại tăng ca','Ký hiệu','Ghi chú'];
const LUONG_COLS=['Mã NV','Họ và tên','Phòng ban','Chức danh','Lương cơ bản','Phụ cấp chức vụ','Công chuẩn','Ngày công thực tế','Nghỉ phép/việc riêng có lương','Nghỉ lễ','Nghỉ ốm (BHXH trả)','Nghỉ không lương/không phép','Nghỉ thai sản','Lương thời gian','Giờ tăng ca ngày thường','Giờ tăng ca Chủ nhật','Tiền tăng ca','Giờ làm đêm','Phụ cấp làm đêm','Tiền ăn ca','Phụ cấp xăng xe','Phụ cấp điện thoại','Phụ cấp chuyên cần','Tổng thu nhập','Lương đóng BH','BHXH (8%)','BHYT (1,5%)','BHTN (1%)','Đoàn phí công đoàn (1%)','Thu nhập chịu thuế','Số người phụ thuộc','Giảm trừ gia cảnh','Thu nhập tính thuế','Thuế TNCN','Tạm ứng','Thực lĩnh','Số tài khoản','Ngân hàng','Ghi chú'];
const dt=s=>{const[y,m,d]=String(s).slice(0,10).split('-').map(Number);return new Date(Date.UTC(y,m-1,d||1))};
const iso=d=>d.toISOString().slice(0,10);
const cong=(s,n)=>{const d=dt(s);d.setUTCDate(d.getUTCDate()+n);return iso(d)};
const thu=s=>dt(s).getUTCDay();
const THU=['Chủ nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'];
const soNgay=(a,b)=>Math.round((dt(b)-dt(a))/864e5);
const ngayCuoiThang=(y,m)=>iso(new Date(Date.UTC(y,m,0)));
const boDau=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D');
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>v==null?'':String(v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fD=s=>s&&String(s).length>=10?`${s.slice(8,10)}/${s.slice(5,7)}/${s.slice(0,4)}`:(s||'');
const fN=n=>n==null||n===''||isNaN(Number(n))?(n??''):Number(n).toLocaleString('vi-VN');
const fTy=n=>(n/1e9).toLocaleString('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2});
const fThang=k=>`${k.slice(5,7)}/${k.slice(0,4)}`;
const conNgay=s=>soNgay(HOM_NAY,s);
const khongDau=s=>boDau(String(s||'')).toLowerCase();
const PB_NGAN={'Phòng Hành chính - Nhân sự':'Hành chính - Nhân sự','Phòng Quản lý chất lượng (QA/QC)':'QA/QC'};
const pbNgan=t=>PB_NGAN[t]||String(t||'').replace(/^Phòng /,'');
function F(loai,arg){
  const ds=NGUON.filter(n=>n.loai===loai&&(typeof arg!=='string'||n.thang===arg)); const n=ds[0];
  if(!n)return loai==='CHAM_CONG'&&typeof arg==='string'?`Cham_cong_${arg.replace('-','_')}.xlsx`:loai;
  const nhieuSheet=NGUON.filter(x=>x.file===n.file&&x.loai).length>1;
  return arg===1||!nhieuSheet?n.file:`${n.file} (${n.sheet})`;
}

/* ---------- Các phép nối giữa file (qua Mã NV) ---------- */
const J={};
function lapChiMuc(){
  J.nv=Object.fromEntries(DATA.DANH_SACH_NHAN_VIEN.map(e=>[e['Mã NV'],e]));
  J.hdHienHanh={};DATA.SO_THEO_DOI_HDLD.forEach(h=>{if(h['Tình trạng']==='Đang hiệu lực')J.hdHienHanh[h['Mã NV']]=h});
  J.hdCuaNV={};DATA.SO_THEO_DOI_HDLD.forEach(h=>(J.hdCuaNV[h['Mã NV']]||(J.hdCuaNV[h['Mã NV']]=[])).push(h));
  J.luongCuaNV={};DATA.LICH_SU_LUONG.forEach(r=>(J.luongCuaNV[r['Mã NV']]||(J.luongCuaNV[r['Mã NV']]=[])).push(r));
  J.luongHienHanh={};Object.entries(J.luongCuaNV).forEach(([m,a])=>J.luongHienHanh[m]=a[a.length-1]);
  J.quyPhep=Object.fromEntries(DATA.QUY_PHEP_NAM.map(q=>[q['Mã NV'],q]));
  J.donCuaNV={};DATA.DON_NGHI_PHEP.forEach(d=>(J.donCuaNV[d['Mã NV']]||(J.donCuaNV[d['Mã NV']]=[])).push(d));
  J.thangCC=Object.keys(DATA.CHAM_CONG).sort();
  J.thangLuong=Object.keys(DATA.BANG_LUONG).sort();
  J.ccTheoNV={};J.thangCC.forEach(t=>{const m={};DATA.CHAM_CONG[t].forEach(r=>(m[r['Mã NV']]||(m[r['Mã NV']]=[])).push(r));J.ccTheoNV[t]=m});
}
const dangLamViec=e=>e['Trạng thái']==='Đang làm việc'||e['Trạng thái']==='Nghỉ thai sản';
const laHDCoThoiHan=h=>h&&h['Ngày hết hạn']&&h['Loại hợp đồng']!=='HĐLĐ không xác định thời hạn';
const soHDCoThoiHan=ma=>(J.hdCuaNV[ma]||[]).filter(h=>/xác định thời hạn \d/.test(h['Loại hợp đồng'])).length;
function tomTatCC(rs){
  const o={X:0,CT:0,P:0,R:0,L:0,'Ô':0,TS:0,KL:0,KP:0,muon:0,phutMuon:0,tc:0,cn:0};
  (rs||[]).forEach(r=>{o[r['Ký hiệu']]=(o[r['Ký hiệu']]||0)+1;if(r['Đi muộn (phút)']){o.muon++;o.phutMuon+=r['Đi muộn (phút)']}if(r['Giờ tăng ca'])o.tc+=r['Giờ tăng ca'];if(r['Thứ']==='Chủ nhật')o.cn++});
  return o;
}
const pillTT=t=>t==='Đang làm việc'?'<span class="pill p-ok">Đang làm việc</span>':t==='Nghỉ thai sản'?'<span class="pill p-warn">Nghỉ thai sản</span>':'<span class="pill p-mute">Đã nghỉ việc</span>';
const pillHD=t=>t==='Đang hiệu lực'?'<span class="pill p-ok">Đang hiệu lực</span>':t==='Đã chấm dứt'?'<span class="pill p-crit">Đã chấm dứt</span>':'<span class="pill p-mute">Đã hết hạn</span>';
const pillDon=t=>t==='Chờ duyệt'?'<span class="pill p-warn">Chờ duyệt</span>':t==='Từ chối'?'<span class="pill p-crit">Từ chối</span>':'<span class="pill p-ok">Đã duyệt</span>';
const nameBtn=(ma,ten)=>`<button class="namebtn" data-ma="${esc(ma)}">${esc(ten)}</button>`;
const fileChip=f=>`<span class="chip file">${esc(f)}</span>`;
const fileCC=t=>F('CHAM_CONG',t);

/* ---------- Cảnh báo đối chiếu nhiều file ---------- */
function lapCanhBao(){
  const out=[], nv=J.nv;
  // 1. Hợp đồng sắp hết hạn & thử việc sắp kết thúc
  Object.values(J.hdHienHanh).forEach(h=>{
    if(!laHDCoThoiHan(h))return;
    const e=nv[h['Mã NV']]; if(!dangLamViec(e))return;
    const n=conNgay(h['Ngày hết hạn']); if(n<0||n>60)return;
    const luong=J.luongHienHanh[h['Mã NV']];
    if(h['Loại hợp đồng']==='Hợp đồng thử việc'){
      const rs=J.thangCC.flatMap(t=>J.ccTheoNV[t][h['Mã NV']]||[]).filter(r=>r['Ngày']>=h['Ngày hiệu lực']);
      const s=tomTatCC(rs);
      out.push({loai:'tv',muc:n<=7?'crit':n<=30?'warn':'info',ma:h['Mã NV'],ten:e['Họ và tên'],pb:e['Phòng ban'],han:h['Ngày hết hạn'],con:n,
        tieuDe:'Thử việc sắp kết thúc',chiTiet:`Hết thử việc ngày ${fD(h['Ngày hết hạn'])} · Trong thời gian thử việc: ${s.X+s.CT} ngày đi làm, ${s.muon} lần đi muộn, ${s.KP} ngày nghỉ không phép · Lương chính thức dự kiến ${fN(luong?.['Lương mới'])} đ`,
        nguon:[F('SO_THEO_DOI_HDLD'),F('DANH_SACH_NHAN_VIEN'),...J.thangCC.map(fileCC).slice(-2),F('LICH_SU_LUONG')]});
    }else{
      const lan=soHDCoThoiHan(h['Mã NV']);
      out.push({loai:'hd',muc:n<=15?'crit':n<=30?'warn':'info',ma:h['Mã NV'],ten:e['Họ và tên'],pb:e['Phòng ban'],han:h['Ngày hết hạn'],con:n,
        tieuDe:'Hợp đồng sắp hết hạn',chiTiet:`${h['Loại hợp đồng']} (${h['Số hợp đồng']}) hết hạn ${fD(h['Ngày hết hạn'])} · Lương theo HĐ ${fN(h['Mức lương theo HĐ'])} đ, lương hiện hành ${fN(luong?.['Lương mới'])} đ`+(lan>=2?' · Đã ký 2 lần HĐ xác định thời hạn: lần tới phải ký HĐ không xác định thời hạn':''),
        nguon:[F('SO_THEO_DOI_HDLD'),F('DANH_SACH_NHAN_VIEN'),F('LICH_SU_LUONG')]});
    }
  });
  // 2. Đơn nghỉ chờ duyệt
  DATA.DON_NGHI_PHEP.filter(d=>d['Trạng thái']==='Chờ duyệt').forEach(d=>{
    const n=conNgay(d['Từ ngày']), q=J.quyPhep[d['Mã NV']];
    const vuot=d['Loại nghỉ']==='Nghỉ phép năm'&&q&&d['Số ngày']>q['Còn lại'];
    out.push({loai:'don',muc:n<=3||vuot?'crit':n<=7?'warn':'info',ma:d['Mã NV'],ten:d['Họ và tên'],pb:d['Phòng ban'],han:d['Từ ngày'],con:n,
      tieuDe:'Đơn nghỉ chờ duyệt',chiTiet:`${d['Số đơn']} · ${d['Loại nghỉ']} ${d['Số ngày']} ngày, từ ${fD(d['Từ ngày'])} đến ${fD(d['Đến ngày'])} · Người duyệt: ${d['Người duyệt']}`+(q&&d['Loại nghỉ']==='Nghỉ phép năm'?` · Quỹ phép còn ${q['Còn lại']} ngày`:'')+(vuot?' · VƯỢT QUỸ PHÉP':''),
      nguon:[F('DON_NGHI_PHEP'),F('QUY_PHEP_NAM')]});
  });
  // 3. Hết phép năm
  DATA.QUY_PHEP_NAM.forEach(q=>{
    const e=nv[q['Mã NV']]; if(!dangLamViec(e)||q['Còn lại']>1)return;
    const tuongLai=(J.donCuaNV[q['Mã NV']]||[]).filter(d=>d['Loại nghỉ']==='Nghỉ phép năm'&&d['Từ ngày']>HOM_NAY&&d['Trạng thái']!=='Từ chối').reduce((s,d)=>s+d['Số ngày'],0);
    out.push({loai:'phep',muc:q['Còn lại']<=0?'warn':'info',ma:q['Mã NV'],ten:q['Họ và tên'],pb:q['Phòng ban'],han:null,con:null,
      tieuDe:q['Còn lại']<=0?'Đã hết phép năm':'Sắp hết phép năm',chiTiet:`Đã nghỉ ${q['Đã nghỉ']}/${q[QTONG]} ngày, còn ${q['Còn lại']} ngày`+(tuongLai?` · Đang có đơn xin thêm ${tuongLai} ngày sau 29/09`:'')+' · Ngày nghỉ tiếp theo cần chuyển sang nghỉ không lương',
      nguon:[F('QUY_PHEP_NAM'),F('DON_NGHI_PHEP'),F('DANH_SACH_NHAN_VIEN')]});
  });
  // 4. Tăng ca gần 40 giờ (tháng chấm công mới nhất)
  const tHomNay=HOM_NAY.slice(0,7), tMoi=J.thangCC.includes(tHomNay)?tHomNay:J.thangCC[J.thangCC.length-1];
  if(tMoi)Object.entries(J.ccTheoNV[tMoi]).forEach(([ma,rs])=>{
    const s=tomTatCC(rs); if(s.tc<36)return; const e=nv[ma];
    const nam=J.thangCC.reduce((a,t)=>a+tomTatCC(J.ccTheoNV[t][ma]).tc,0);
    out.push({loai:'tc',muc:s.tc>=40?'crit':'warn',ma,ten:e['Họ và tên'],pb:e['Phòng ban'],han:null,con:null,giaTri:s.tc,
      tieuDe:s.tc>=40?'Đã chạm giới hạn 40 giờ tăng ca':'Tăng ca gần 40 giờ',chiTiet:`Tháng ${fThang(tMoi)}: ${s.tc} giờ (còn ${Math.max(0,40-s.tc)} giờ đến giới hạn tháng) · ${e['Tổ/Ca']||''} · Cộng dồn ${J.thangCC.length} tháng có dữ liệu: ${nam} giờ / 300 giờ năm`,
      nguon:J.thangCC.map(fileCC).concat([F('DANH_SACH_NHAN_VIEN')])});
  });
  // 5. Nghỉ thai sản sắp quay lại
  DATA.DON_NGHI_PHEP.filter(d=>d['Loại nghỉ']==='Nghỉ thai sản'&&d['Trạng thái']==='Đã duyệt').forEach(d=>{
    const e=nv[d['Mã NV']]; const ve=cong(d['Đến ngày'],1), n=conNgay(ve);
    if(e['Trạng thái']!=='Nghỉ thai sản'||n<0||n>45)return;
    out.push({loai:'ts',muc:n<=14?'warn':'info',ma:d['Mã NV'],ten:e['Họ và tên'],pb:e['Phòng ban'],han:ve,con:n,
      tieuDe:'Nghỉ thai sản sắp quay lại',chiTiet:`Hết thai sản ${fD(d['Đến ngày'])}, đi làm lại ${fD(ve)} · ${e['Chức danh công việc']}${e['Tổ/Ca']?', '+e['Tổ/Ca']:''} · Việc cần làm: xếp ca, đổi trạng thái hồ sơ, đưa vào bảng lương tháng ${ve.slice(5,7)}`,
      nguon:[F('DON_NGHI_PHEP'),F('DANH_SACH_NHAN_VIEN')].concat(tMoi?[fileCC(tMoi)]:[])});
  });
  const thuTu={crit:0,warn:1,info:2};
  return out.sort((a,b)=>thuTu[a.muc]-thuTu[b.muc]||(a.con??99)-(b.con??99));
}
const LOAI_CB=[['hd','Hợp đồng sắp hết hạn'],['tv','Thử việc sắp kết thúc'],['don','Đơn nghỉ chờ duyệt'],['phep','Hết phép năm'],['tc','Tăng ca gần 40 giờ'],['ts','Thai sản sắp quay lại']];
function veCanhBao(list,gon){
  if(!list.length)return '<div class="empty">Không có việc nào khớp bộ lọc.</div>';
  return list.map(a=>`<div class="aitem ${a.muc}"><span class="sev"></span><div>
    <div class="t">${esc(a.tieuDe)} · ${nameBtn(a.ma,a.ten)} <span class="mono" style="color:var(--muted);font-weight:500">${a.ma}</span> <span class="chip">${esc(pbNgan(a.pb))}</span></div>
    <div class="d">${esc(a.chiTiet)}</div>${gon?'':`<div class="src">${[...new Set(a.nguon)].map(fileChip).join('')}</div>`}</div>
    <div class="when">${a.con!=null?`<b>${a.con===0?'Hôm nay':a.con+' ngày nữa'}</b>${fD(a.han)}`:a.giaTri!=null?`<b>${a.giaTri} giờ</b>tháng này`:''}</div></div>`).join('');
}

/* ---------- Bảng dùng chung: sắp xếp, phân trang ---------- */
function bang(host,cfg){
  host._cfg=cfg; const st=host._st||(host._st={sort:null,dir:1,page:0});
  if(cfg.giuTrang!==true)st.page=0;
  veBang(host);
  if(!host._wired){host._wired=1;host.addEventListener('click',ev=>{
    const th=ev.target.closest('th[data-i]');
    if(th){const i=+th.dataset.i;st.dir=st.sort===i?-st.dir:1;st.sort=i;st.page=0;veBang(host);return}
    const pg=ev.target.closest('[data-pg]');
    if(pg){st.page+=+pg.dataset.pg;veBang(host)}
  })}
}
function veBang(host){
  const cfg=host._cfg, st=host._st, cols=cfg.cols, size=cfg.size||30;
  let rows=cfg.rows.slice();
  if(st.sort!=null&&cols[st.sort]){const c=cols[st.sort],g=c.v||(r=>r[c.k]);rows.sort((a,b)=>{const x=g(a),y=g(b);if(x==null&&y==null)return 0;if(x==null)return 1;if(y==null)return -1;return(x<y?-1:x>y?1:0)*st.dir})}
  const pages=Math.max(1,Math.ceil(rows.length/size)); st.page=Math.min(Math.max(0,st.page),pages-1);
  const part=rows.slice(st.page*size,st.page*size+size);
  const cell=(c,r)=>{if(c.r)return c.r(r);const v=r[c.k];if(c.t==='date')return fD(v);if(c.t==='money'||c.t==='num')return fN(v);return esc(v)};
  const cls=c=>(c.t==='money'||c.t==='num'?'num':'')+(c.cls?' '+c.cls:'');
  host.innerHTML=`<div class="tbl-wrap"><table class="${cfg.tableClass||''}"><thead><tr>${cols.map((c,i)=>`<th class="${cls(c)}${c.thCls?' '+c.thCls:''}" data-i="${i}" ${c.title?`title="${esc(c.title)}"`:''}>${esc(c.label||c.k)}${c.noi?'<span class="src-mark">↗</span>':''}${st.sort===i?(st.dir>0?' ▲':' ▼'):''}</th>`).join('')}</tr></thead>
   <tbody>${part.length?part.map(r=>`<tr>${cols.map(c=>`<td class="${cls(c)}">${cell(c,r)}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${cols.length}" class="empty">Không có dòng nào khớp bộ lọc.</td></tr>`}</tbody>
   ${cfg.foot?`<tfoot><tr>${cols.map((c,i)=>`<td class="${cls(c)}">${cfg.foot(c,i,rows)??''}</td>`).join('')}</tr></tfoot>`:''}</table></div>
   ${rows.length>size?`<div class="pager"><span>Dòng ${fN(st.page*size+1)}–${fN(Math.min(rows.length,st.page*size+size))} / ${fN(rows.length)}</span><span><button data-pg="-1" ${st.page===0?'disabled':''}>‹ Trước</button> Trang ${st.page+1}/${pages} <button data-pg="1" ${st.page>=pages-1?'disabled':''}>Sau ›</button></span></div>`:`<div class="pager"><span>${fN(rows.length)} dòng</span></div>`}`;
}
const khop=(r,q,keys)=>!q||keys.some(k=>khongDau(r[k]).includes(q));

/* ---------- Trang: Bảng điều hành ---------- */
let thangKPI=null;
function trangDash(){
  const ds=DATA.DANH_SACH_NHAN_VIEN, dang=ds.filter(dangLamViec), ts=dang.filter(e=>e['Trạng thái']==='Nghỉ thai sản').length;
  const tl=J.thangLuong; if(!thangKPI||!tl.includes(thangKPI))thangKPI=tl[tl.length-1];
  const sum=(t,c)=>(DATA.BANG_LUONG[t]||[]).reduce((s,r)=>s+(Number(r[c])||0),0);
  const tong=thangKPI?sum(thangKPI,'Tổng thu nhập'):0, thuc=thangKPI?sum(thangKPI,'Thực lĩnh'):0, i=tl.indexOf(thangKPI), truoc=i>0?sum(tl[i-1],'Tổng thu nhập'):null;
  const hdh=Object.values(J.hdHienHanh).filter(h=>laHDCoThoiHan(h)&&dangLamViec(J.nv[h['Mã NV']]));
  const hh30=hdh.filter(h=>{const n=conNgay(h['Ngày hết hạn']);return n>=0&&n<=30}), hh60=hdh.filter(h=>{const n=conNgay(h['Ngày hết hạn']);return n>=0&&n<=60});
  const cho=DATA.DON_NGHI_PHEP.filter(d=>d['Trạng thái']==='Chờ duyệt'), cho7=cho.filter(d=>conNgay(d['Từ ngày'])<=7);
  const thangCCMoi=J.thangCC[J.thangCC.length-1], coLuongThangMoi=!thangCCMoi||tl.includes(thangCCMoi);
  $('#kpis').innerHTML=`
   <div class="kpi"><div class="lbl">Nhân viên đang làm</div><div class="val">${dang.length}<small>người</small></div><div class="note"><b>${dang.length-ts}</b> đang đi làm · <b>${ts}</b> nghỉ thai sản</div></div>
   <div class="kpi"><div class="lbl">Quỹ lương tháng <select id="kThang" aria-label="Chọn tháng lương">${tl.map(t=>`<option value="${t}" ${t===thangKPI?'selected':''}>${fThang(t)}</option>`).join('')}</select></div><div class="val">${fTy(tong)}<small>tỷ</small></div><div class="note">Thực lĩnh <b>${fTy(thuc)} tỷ</b>${truoc?` · ${tong>=truoc?'+':''}${((tong/truoc-1)*100).toLocaleString('vi-VN',{maximumFractionDigits:1})}% so với tháng trước`:''}${!coLuongThangMoi?`<br>Tháng ${fThang(thangCCMoi)} chưa có bảng lương`:''}${!tl.length?'<br>Chưa tìm thấy file bảng lương':''}</div></div>
   <div class="kpi ${hh30.length?'alert':''}"><div class="lbl">Hợp đồng sắp hết hạn</div><div class="val">${hh30.length}<small>trong 30 ngày</small></div><div class="note"><b>${hh60.length}</b> trong 60 ngày · <button class="linkish" data-go="hd">Xem danh sách</button></div></div>
   <div class="kpi ${cho7.length?'alert':''}"><div class="lbl">Đơn nghỉ chờ duyệt</div><div class="val">${cho.length}<small>đơn</small></div><div class="note"><b>${cho7.length}</b> đơn nghỉ trong 7 ngày tới · <button class="linkish" data-go="np" data-arg="cho">Duyệt ngay</button></div></div>`;
  if($('#kThang'))$('#kThang').onchange=e=>{thangKPI=e.target.value;trangDash()};
  // Biểu đồ phòng ban
  const rows=DATA.PHONG_BAN.map(p=>{const nv=dang.filter(e=>e['Phòng ban']===p['Tên phòng ban']);return{ten:p['Tên phòng ban'],db:p['Định biên'],n:nv.length,ts:nv.filter(e=>e['Trạng thái']==='Nghỉ thai sản').length}});
  const max=Math.max(1,...rows.map(r=>Math.max(r.n,Number(r.db)||0)))*1.05;
  $('#chartPB').innerHTML=`<div class="hbar">${rows.map(r=>`<div class="nm" title="${esc(r.ten)}">${esc(pbNgan(r.ten))}</div>
    <div class="track"><div class="fill" style="width:${(r.n-r.ts)/max*100}%"></div>${r.ts?`<div class="fill ts" style="left:${(r.n-r.ts)/max*100}%;width:${r.ts/max*100}%"></div>`:''}<div class="mark" style="left:${r.db/max*100}%" title="Định biên ${r.db}"></div></div>
    <div class="num ${r.n>r.db?'over':''}"><b>${r.n}</b> / ${r.db}</div>`).join('')}</div>
    <div class="legend"><span><i class="lg-a"></i>Đang đi làm</span><span><i class="lg-ts"></i>Nghỉ thai sản</span><span><i class="lg-m"></i>Định biên</span>${rows.filter(r=>r.n>r.db).map(r=>`<span style="color:var(--warn)">${esc(pbNgan(r.ten))} vượt định biên ${r.n-r.db} người</span>`).join('')}</div>`;
  // Biểu đồ quỹ lương
  const thangs=[...new Set([...tl,...J.thangCC])].sort();
  const vals=thangs.map(t=>DATA.BANG_LUONG[t]?{t,tong:sum(t,'Tổng thu nhập'),thuc:sum(t,'Thực lĩnh')}:{t,none:1});
  const W=520,H=250,L=40,B=34,T=24,Rr=8, yMax=Math.max(0.25e9,Math.ceil(Math.max(0,...vals.filter(v=>!v.none).map(v=>v.tong))/0.25e9)*0.25e9);
  const y=v=>T+(H-T-B)*(1-v/yMax), bw=(W-L-Rr)/thangs.length;
  let svg=`<svg class="vchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Quỹ lương theo tháng">`;
  const buocY=yMax>3e9?1e9:yMax>1.5e9?0.5e9:0.25e9;
  for(let v=0;v<=yMax+1;v+=buocY)svg+=`<line class="grid" x1="${L}" x2="${W-Rr}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${L-6}" y="${y(v)+4}" text-anchor="end">${fTy(v)}</text>`;
  vals.forEach((v,i)=>{const cx=L+bw*i+bw/2, w=Math.min(64,bw*.56);
    if(v.none){svg+=`<rect class="b-none" x="${cx-w/2}" y="${y(yMax*0.55)}" width="${w}" height="${y(0)-y(yMax*0.55)}" rx="3"/><text class="vl2" x="${cx}" y="${y(yMax*0.55)-8}" text-anchor="middle">Chưa có bảng lương</text>`}
    else{svg+=`<rect class="b-tong" x="${cx-w/2}" y="${y(v.tong)}" width="${w}" height="${y(0)-y(v.tong)}" rx="3"><title>Tổng thu nhập ${fN(v.tong)} đ</title></rect><rect class="b-thuc" x="${cx-w/2+w*.18}" y="${y(v.thuc)}" width="${w*.64}" height="${y(0)-y(v.thuc)}" rx="2"><title>Thực lĩnh ${fN(v.thuc)} đ</title></rect><text class="vl" x="${cx}" y="${y(v.tong)-7}" text-anchor="middle">${fTy(v.tong)}</text>`}
    svg+=`<text class="axis" x="${cx}" y="${H-12}" text-anchor="middle">Tháng ${fThang(v.t)}</text>`});
  svg+='</svg>';
  $('#chartLuong').innerHTML=svg+`<div class="legend"><span><i class="lg-b"></i>Tổng thu nhập</span><span><i class="lg-a"></i>Thực lĩnh (sau bảo hiểm, thuế, tạm ứng)</span></div>`;
  $('#dashAlerts').innerHTML=veCanhBao(lapCanhBao().slice(0,6),true);
}

/* ---------- Trang: Việc cần xử lý ---------- */
let loaiCB='';
function trangViec(){
  const all=lapCanhBao();
  $('#viecTypes').innerHTML=`<button class="tbtn" data-l="" aria-pressed="${loaiCB===''}">Tất cả <b>${all.length}</b></button>`+LOAI_CB.map(([k,t])=>`<button class="tbtn" data-l="${k}" aria-pressed="${loaiCB===k}">${t} <b>${all.filter(a=>a.loai===k).length}</b></button>`).join('');
  const q=khongDau($('#vSearch').value), sev=$('#vSev').value, pb=$('#vPB').value;
  const list=all.filter(a=>(!loaiCB||a.loai===loaiCB)&&(!sev||a.muc===sev)&&(!pb||a.pb===pb)&&(!q||khongDau(a.ten+' '+a.ma).includes(q)));
  $('#viecList').innerHTML=veCanhBao(list,false);
}

/* ---------- Trang: Nhân viên ---------- */
function trangNV(){
  const q=khongDau($('#nSearch').value), pb=$('#nPB').value, cv=$('#nCV').value, tt=$('#nTT').value;
  const rows=DATA.DANH_SACH_NHAN_VIEN.filter(e=>(!pb||e['Phòng ban']===pb)&&(!cv||e['Chức vụ']===cv)&&(tt==='dang'?dangLamViec(e):!tt||e['Trạng thái']===tt)&&khop(e,q,['Họ và tên','Mã NV','Số điện thoại']));
  bang($('#nvTable'),{rows,cols:[
    {k:'Mã NV',r:r=>`<span class="mono">${r['Mã NV']}</span>`},
    {k:'Họ và tên',r:r=>nameBtn(r['Mã NV'],r['Họ và tên'])},
    {k:'Phòng ban'},{k:'Chức vụ'},{k:'Chức danh công việc'},{k:'Tổ/Ca',r:r=>esc(r['Tổ/Ca']||'—')},
    {k:'Ngày vào làm',t:'date'},
    {label:'Hợp đồng hiện tại',noi:1,title:'Từ sổ theo dõi hợp đồng',v:r=>J.hdHienHanh[r['Mã NV']]?.['Loại hợp đồng'],r:r=>{const h=J.hdHienHanh[r['Mã NV']];if(!h)return '<span class="dim">—</span>';const ten=h['Loại hợp đồng'].replace('HĐLĐ xác định thời hạn','Xác định').replace('HĐLĐ không xác định thời hạn','Không xác định TH').replace('Hợp đồng thử việc','Thử việc');const n=h['Ngày hết hạn']?conNgay(h['Ngày hết hạn']):null;return esc(ten)+(n!=null&&n<=60?` <span class="pill ${n<=30?'p-crit':'p-warn'}">còn ${n} ngày</span>`:'')}},
    {label:'Lương hiện hành',noi:1,t:'money',title:'Từ lịch sử điều chỉnh lương',v:r=>J.luongHienHanh[r['Mã NV']]?.['Lương mới'],r:r=>fN(J.luongHienHanh[r['Mã NV']]?.['Lương mới'])},
    {label:'Phép còn lại',noi:1,t:'num',title:'Từ sheet Quy_phep_nam',v:r=>J.quyPhep[r['Mã NV']]?.['Còn lại'],r:r=>{const c=J.quyPhep[r['Mã NV']]?.['Còn lại'];return c==null?'':c<=1?`<span class="pill p-warn">${c}</span>`:c}},
    {k:'Trạng thái',r:r=>pillTT(r['Trạng thái'])}]});
}

/* ---------- Hồ sơ nhân viên (ngăn trượt) ---------- */
let hoSoMa=null;
function moHoSo(ma,tab='tt'){
  hoSoMa=ma; const e=J.nv[ma];
  $('#drAv').textContent=e['Họ và tên'].split(' ').slice(-1)[0].slice(0,2);
  $('#drName').textContent=e['Họ và tên'];
  $('#drSub').innerHTML=`<span class="mono">${ma}</span> · ${esc(e['Chức danh công việc'])} · ${esc(e['Phòng ban'])} &nbsp;${pillTT(e['Trạng thái'])}`;
  $('#backdrop').hidden=false;$('#drawer').hidden=false;document.body.style.overflow='hidden';
  chonTab(tab);$('#drClose').focus();
}
function dongHoSo(){$('#backdrop').hidden=true;$('#drawer').hidden=true;document.body.style.overflow='';hoSoMa=null}
function kv(obj,keys){return `<div class="kv">${keys.map(k=>{let v=obj[k];if(/^Ngày/.test(k))v=fD(v);else if(typeof v==='number'&&k!=='Số người phụ thuộc')v=fN(v);return `<div><span class="k">${esc(k)}</span><span class="v">${v==null||v===''?'<span class="dim">—</span>':k==='Trạng thái'?pillTT(v):esc(v)}</span></div>`}).join('')}</div>`}
function chonTab(t){
  $$('#drTabs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.t===t));
  const ma=hoSoMa, e=J.nv[ma], body=$('#drBody');
  if(t==='tt'){
    body.innerHTML=`<div class="card"><p class="sec-title">Thông tin cá nhân</p>${kv(e,['Mã NV','Họ và tên','Giới tính','Ngày sinh','Dân tộc','Quê quán','Số CCCD/Mã số thuế','Ngày cấp CCCD','Địa chỉ thường trú','Số điện thoại','Email công ty','Trình độ','Tình trạng hôn nhân','Số người phụ thuộc'])}</div>
     <div class="card"><p class="sec-title">Công việc</p>${kv(e,['Phòng ban','Chức vụ','Chức danh công việc','Tổ/Ca','Ngày vào làm','Trạng thái','Ngày nghỉ việc'])}</div>
     <div class="card"><p class="sec-title">Bảo hiểm và ngân hàng</p>${kv(e,['Số sổ BHXH','Ngân hàng','Số tài khoản'])}</div>
     <div class="src">${fileChip(F('DANH_SACH_NHAN_VIEN'))}</div>`;
  }else if(t==='hd'){
    const ds=(J.hdCuaNV[ma]||[]).slice().reverse(), h=J.hdHienHanh[ma];
    body.innerHTML=`${h?`<div class="card"><p class="sec-title">Hợp đồng đang hiệu lực</p>${kv(h,['Số hợp đồng','Loại hợp đồng','Ngày ký','Ngày hiệu lực','Ngày hết hạn','Mức lương theo HĐ','Phụ cấp chức vụ'])}${J.luongHienHanh[ma]&&J.luongHienHanh[ma]['Lương mới']!==h['Mức lương theo HĐ']&&h['Loại hợp đồng']!=='Hợp đồng thử việc'?`<p class="note-line" style="margin:10px 0 0">Lương hiện hành ${fN(J.luongHienHanh[ma]?.['Lương mới'])} đ khác mức ghi trên hợp đồng: cần phụ lục hợp đồng.</p>`:''}</div>`:''}
      <div><p class="sec-title">Lịch sử hợp đồng (${ds.length})</p><div id="drT1"></div></div><div class="src">${fileChip(F('SO_THEO_DOI_HDLD'))}</div>`;
    bang($('#drT1'),{rows:ds,size:20,cols:[{k:'Số hợp đồng',r:r=>`<span class="mono">${r['Số hợp đồng']}</span>`},{k:'Loại hợp đồng'},{k:'Ngày hiệu lực',t:'date'},{k:'Ngày hết hạn',t:'date'},{k:'Mức lương theo HĐ',t:'money'},{k:'Tình trạng',r:r=>pillHD(r['Tình trạng'])},{k:'Lý do chấm dứt'}]});
  }else if(t==='luong'){
    const ls=(J.luongCuaNV[ma]||[]).slice().reverse(), cur=ls[0]||{};
    const bl=J.thangLuong.map(t=>({t,r:DATA.BANG_LUONG[t].find(x=>x['Mã NV']===ma)})).filter(x=>x.r);
    body.innerHTML=`<div class="mini-kpi"><div class="stat"><span>Lương cơ bản hiện hành</span><b>${fN(cur['Lương mới'])}</b></div><div class="stat"><span>Phụ cấp chức vụ</span><b>${fN(cur['Phụ cấp chức vụ'])}</b></div><div class="stat"><span>Hiệu lực từ</span><b>${fD(cur['Ngày hiệu lực'])}</b></div><div class="stat"><span>Số lần điều chỉnh</span><b>${Math.max(0,ls.length-1)}</b></div></div>
      <div><p class="sec-title">Lương các tháng</p><div id="drT2"></div></div>
      <div><p class="sec-title">Lịch sử điều chỉnh lương</p><div id="drT1"></div></div>
      <div class="src">${fileChip(F('LICH_SU_LUONG'))}${fileChip(F('BANG_LUONG',1))}</div>`;
    bang($('#drT2'),{rows:bl.map(x=>({...x.r,_t:x.t})),cols:[{label:'Tháng',k:'_t',r:r=>fThang(r._t)},{k:'Lương cơ bản',t:'money'},{k:'Ngày công thực tế',t:'num'},{k:'Tiền tăng ca',t:'money'},{k:'Tổng thu nhập',t:'money'},{k:'Thuế TNCN',t:'money'},{k:'Thực lĩnh',t:'money'},{k:'Ghi chú'}]});
    bang($('#drT1'),{rows:ls,size:20,cols:[{k:'Ngày hiệu lực',t:'date'},{k:'Số quyết định',r:r=>r['Số quyết định']?`<span class="mono">${r['Số quyết định']}</span>`:'<span class="dim">—</span>'},{k:'Lương cũ',t:'money'},{k:'Lương mới',t:'money'},{k:'Tỷ lệ tăng (%)',t:'num'},{k:'Lý do'}]});
  }else if(t==='phep'){
    const q=J.quyPhep[ma]||{}, ds=(J.donCuaNV[ma]||[]).slice().reverse();
    body.innerHTML=`<div class="mini-kpi"><div class="stat"><span>${esc(QTONG)}</span><b>${q[QTONG]}</b></div><div class="stat"><span>Đã nghỉ</span><b>${q['Đã nghỉ']}</b></div><div class="stat ${q['Còn lại']<=1?'warn':''}"><span>Còn lại</span><b>${q['Còn lại']}</b></div><div class="stat"><span>Thâm niên</span><b>${q['Thâm niên (năm)']} năm</b></div></div>
      <p class="note-line">Phép cơ bản ${q['Phép cơ bản']} ngày + phép thâm niên ${q['Phép thâm niên']} ngày. "Đã nghỉ" chỉ tính đơn đã duyệt có ngày nghỉ đến ${fD(HOM_NAY)}.</p>
      <div><p class="sec-title">Đơn nghỉ năm ${NAM} (${ds.length})</p><div id="drT1"></div></div><div class="src">${fileChip(F('DON_NGHI_PHEP',1))}</div>`;
    bang($('#drT1'),{rows:ds,cols:[{k:'Số đơn',r:r=>`<span class="mono">${r['Số đơn']}</span>`},{k:'Loại nghỉ'},{k:'Từ ngày',t:'date'},{k:'Đến ngày',t:'date'},{k:'Số ngày',t:'num'},{k:'Lý do'},{k:'Trạng thái',r:r=>pillDon(r['Trạng thái'])}]});
  }else if(t==='cc'){
    const rows=J.thangCC.map(t=>({t,...tomTatCC(J.ccTheoNV[t][ma])}));
    body.innerHTML=`<div><p class="sec-title">Tổng hợp chấm công theo tháng</p><div id="drT1"></div></div><p class="note-line">Tăng ca tối đa 40 giờ/tháng.${J.thangCC.length?` Tháng ${fThang(J.thangCC[J.thangCC.length-1])} có dữ liệu đến ${fD(DATA.CHAM_CONG[J.thangCC[J.thangCC.length-1]].slice(-1)[0]?.['Ngày'])}.`:''}</p><div class="src">${J.thangCC.map(t=>fileChip(fileCC(t))).join('')}</div>`;
    bang($('#drT1'),{rows,cols:[{label:'Tháng',k:'t',r:r=>fThang(r.t)},{label:'Đi làm (X)',k:'X',t:'num'},{label:'Công tác',k:'CT',t:'num'},{label:'Phép (P+R)',v:r=>r.P+r.R,r:r=>r.P+r.R,t:'num'},{label:'Lễ',k:'L',t:'num'},{label:'Ốm',k:'Ô',t:'num'},{label:'Thai sản',k:'TS',t:'num'},{label:'KL + KP',v:r=>r.KL+r.KP,r:r=>r.KL+r.KP,t:'num'},{label:'Lần đi muộn',k:'muon',t:'num'},{label:'Giờ tăng ca',k:'tc',t:'num',r:r=>r.tc>=36?`<span class="pill p-warn">${r.tc}</span>`:r.tc}]});
  }
}

/* ---------- Trang: Hợp đồng ---------- */
function trangHD(){
  const q=khongDau($('#hSearch').value), th=$('#hThang').value, tt=$('#hTT').value, loai=$('#hLoai').value, pb=$('#hPB').value;
  const rows=DATA.SO_THEO_DOI_HDLD.filter(h=>(!tt||h['Tình trạng']===tt)&&(!loai||h['Loại hợp đồng']===loai)&&(!pb||h['Phòng ban']===pb)&&(!th||(h['Ngày hết hạn']||'').startsWith(th))&&khop(h,q,['Họ và tên','Mã NV','Số hợp đồng']));
  const cur=DATA.SO_THEO_DOI_HDLD.filter(h=>h['Tình trạng']==='Đang hiệu lực');
  const dem=l=>cur.filter(h=>h['Loại hợp đồng']===l).length;
  const s30=cur.filter(h=>h['Ngày hết hạn']&&conNgay(h['Ngày hết hạn'])>=0&&conNgay(h['Ngày hết hạn'])<=30).length;
  $('#hStats').innerHTML=`<div class="stat"><span>Đang hiệu lực</span><b>${cur.length}</b></div><div class="stat"><span>Không xác định thời hạn</span><b>${dem('HĐLĐ không xác định thời hạn')}</b></div><div class="stat"><span>Xác định thời hạn</span><b>${cur.filter(h=>/thời hạn \d/.test(h['Loại hợp đồng'])).length}</b></div><div class="stat"><span>Thử việc</span><b>${dem('Hợp đồng thử việc')}</b></div><div class="stat ${s30?'warn':''}"><span>Hết hạn trong 30 ngày</span><b>${s30}</b></div><div class="stat"><span>Đang lọc</span><b>${rows.length}</b></div>`;
  bang($('#hdTable'),{rows,cols:[{k:'STT',t:'num'},{k:'Số hợp đồng',r:r=>`<span class="mono">${r['Số hợp đồng']}</span>`},{k:'Mã NV',r:r=>`<span class="mono">${r['Mã NV']}</span>`},{k:'Họ và tên',r:r=>nameBtn(r['Mã NV'],r['Họ và tên'])},{k:'Phòng ban'},{k:'Chức danh'},{k:'Loại hợp đồng'},{k:'Ngày ký',t:'date'},{k:'Ngày hiệu lực',t:'date'},
    {k:'Ngày hết hạn',t:'date',r:r=>{if(!r['Ngày hết hạn'])return '<span class="dim">—</span>';const n=conNgay(r['Ngày hết hạn']);return fD(r['Ngày hết hạn'])+(r['Tình trạng']==='Đang hiệu lực'&&n<=60?` <span class="pill ${n<=30?'p-crit':'p-warn'}">${n} ngày</span>`:'')}},
    {k:'Mức lương theo HĐ',t:'money'},{k:'Phụ cấp chức vụ',t:'money'},{k:'Tình trạng',r:r=>pillHD(r['Tình trạng'])},{k:'Ngày chấm dứt',t:'date'},{k:'Lý do chấm dứt'}]});
}

/* ---------- Trang: Chấm công ---------- */
let ccView='tong';
function trangCC(){
  const t=$('#cThang').value||'', all=DATA.CHAM_CONG[t]||[];
  if(!t){$('#ccSrc').innerHTML='';$('#cStats').innerHTML='';$('#ccTable').innerHTML='<div class="card empty">Chưa tìm thấy file chấm công nào trong thư mục dữ liệu.</div>';return}
  const q=khongDau($('#cSearch').value), pb=$('#cPB').value, kh=$('#cKH').value;
  const rows=all.filter(r=>(!pb||r['Phòng ban']===pb)&&(!kh||r['Ký hiệu']===kh)&&khop(r,q,['Họ và tên','Mã NV']));
  const ngayCuoi=all.length?all[all.length-1]['Ngày']:null, y=+t.slice(0,4), m=+t.slice(5,7), soNgayThang=+ngayCuoiThang(y,m).slice(8);
  const du=ngayCuoi&&+ngayCuoi.slice(8)===soNgayThang;
  const nguon=NGUON.find(n=>n.loai==='CHAM_CONG'&&n.thang===t);
  $('#ccSrc').innerHTML=fileChip(nguon?nguon.file:fileCC(t))+(nguon&&nguon.canhBao?`<span class="chip" style="color:var(--warn);border-color:var(--warn)">${esc(nguon.canhBao)}</span>`:'')+(!du&&ngayCuoi?`<span class="chip">Dữ liệu đến ${fD(ngayCuoi)}</span>`:'')+(nguon&&nguon.thuMuc?`<span class="chip" title="${esc(nguon.duongDan||'')}">${esc(nguon.thuMuc)}</span>`:'');
  const s=tomTatCC(rows), soNV=new Set(rows.map(r=>r['Mã NV'])).size;
  $('#cStats').innerHTML=`<div class="stat"><span>Số người</span><b>${soNV}</b></div><div class="stat"><span>Số dòng</span><b>${fN(rows.length)}</b></div><div class="stat"><span>Ngày công (X + CT)</span><b>${fN(s.X+s.CT)}</b></div><div class="stat"><span>Nghỉ có phép (P, R, L)</span><b>${fN(s.P+s.R+s.L)}</b></div><div class="stat"><span>Ốm, thai sản</span><b>${fN(s['Ô']+s.TS)}</b></div><div class="stat ${s.KP?'warn':''}"><span>Không lương, không phép</span><b>${s.KL+s.KP}</b></div><div class="stat"><span>Lượt đi muộn</span><b>${fN(s.muon)}</b></div><div class="stat"><span>Giờ tăng ca</span><b>${fN(s.tc)}</b></div>`;
  const host=$('#ccTable');
  if(ccView==='chitiet'){
    bang(host,{rows,size:50,cols:CC_COLS.map(k=>k==='Ngày'?{k,t:'date'}:k==='Họ và tên'?{k,r:r=>nameBtn(r['Mã NV'],r[k])}:k==='Mã NV'?{k,r:r=>`<span class="mono">${r[k]}</span>`}:k==='Ký hiệu'?{k,r:r=>`<span class="kh kh-${r[k]}">${r[k]}</span>`}:['STT','Số giờ công','Đi muộn (phút)','Giờ tăng ca'].includes(k)?{k,t:'num'}:{k})});
    return;
  }
  const theo={};rows.forEach(r=>(theo[r['Mã NV']]||(theo[r['Mã NV']]=[])).push(r));
  if(ccView==='tong'){
    const tg=Object.entries(theo).map(([ma,rs])=>{const e=J.nv[ma];return{'Mã NV':ma,'Họ và tên':e['Họ và tên'],'Phòng ban':e['Phòng ban'],'Tổ':e['Tổ/Ca'],...tomTatCC(rs)}});
    bang(host,{rows:tg,cols:[{k:'Mã NV',r:r=>`<span class="mono">${r['Mã NV']}</span>`},{k:'Họ và tên',r:r=>nameBtn(r['Mã NV'],r['Họ và tên'])},{k:'Phòng ban'},{k:'Tổ',r:r=>esc(r['Tổ']||'—')},
      ...['X','CT','P','R','L','Ô','TS','KL','KP'].map(k=>({k,t:'num',title:DATA.KY_HIEU_CHAM_CONG.find(x=>x['Ký hiệu']===k)?.['Ý nghĩa']||k,r:r=>r[k]?(k==='KP'?`<span class="pill p-crit">${r[k]}</span>`:r[k]):'<span class="dim">·</span>'})),
      {label:'Lần đi muộn',k:'muon',t:'num',r:r=>r.muon>=3?`<span class="pill p-warn">${r.muon}</span>`:r.muon||'<span class="dim">·</span>'},{label:'Phút muộn',k:'phutMuon',t:'num'},
      {label:'Giờ tăng ca',k:'tc',t:'num',r:r=>r.tc>=36?`<span class="pill ${r.tc>=40?'p-crit':'p-warn'}">${r.tc}</span>`:r.tc||'<span class="dim">·</span>'}]});
  }else{
    const days=[];for(let d=1;d<=soNgayThang;d++)days.push(`${t}-${String(d).padStart(2,'0')}`);
    const tg=Object.entries(theo).map(([ma,rs])=>{const o={'Mã NV':ma,'Họ và tên':J.nv[ma]['Họ và tên']};rs.forEach(r=>o[r['Ngày']]=r);return o});
    bang(host,{rows:tg,size:40,tableClass:'grid',cols:[{k:'Họ và tên',r:r=>nameBtn(r['Mã NV'],r['Họ và tên'])+` <span class="mono" style="color:var(--muted)">${r['Mã NV']}</span>`},
      ...days.map(d=>({label:d.slice(8),thCls:thu(d)===0?'sun':'',title:`${THU[thu(d)]} ${fD(d)}`,v:r=>r[d]?.['Ký hiệu'],r:r=>{const c=r[d];if(!c)return '<span class="dim">·</span>';const cls=`kh kh-${c['Ký hiệu']}${c['Đi muộn (phút)']?' kh-late':''}${c['Giờ tăng ca']?' kh-ot':''}`;return `<span class="${cls}" title="${esc([c['Ca'],c['Giờ vào']&&c['Giờ vào']+'–'+c['Giờ ra'],c['Ghi chú']].filter(Boolean).join(' · '))}">${c['Ký hiệu']}</span>`}}))]});
    host.insertAdjacentHTML('beforeend',`<div class="legend">${DATA.KY_HIEU_CHAM_CONG.map(k=>`<span><span class="kh kh-${k['Ký hiệu']}">${k['Ký hiệu']}</span> ${esc(k['Ý nghĩa'])}</span>`).join('')}<span><span class="kh kh-X kh-late">X</span> Đi muộn</span><span><span class="kh kh-X kh-ot">X</span> Có tăng ca</span></div>`);
  }
}

/* ---------- Trang: Nghỉ phép ---------- */
let npView='don';
function trangNP(){
  const q=khongDau($('#pSearch').value), pb=$('#pPB').value;
  $$('.p-don').forEach(x=>x.hidden=npView!=='don');$$('.p-quy').forEach(x=>x.hidden=npView!=='quy');
  const don=DATA.DON_NGHI_PHEP, cho=don.filter(d=>d['Trạng thái']==='Chờ duyệt');
  if(npView==='don'){
    const th=$('#pThang').value, tt=$('#pTT').value, loai=$('#pLoai').value;
    const rows=don.filter(d=>(!th||d['Từ ngày'].startsWith(th)||d['Đến ngày'].startsWith(th))&&(!tt||d['Trạng thái']===tt)&&(!loai||d['Loại nghỉ']===loai)&&(!pb||d['Phòng ban']===pb)&&khop(d,q,['Họ và tên','Mã NV','Số đơn']));
    $('#pStats').innerHTML=`<div class="stat"><span>Tổng số đơn năm ${NAM}</span><b>${don.length}</b></div><div class="stat warn"><span>Chờ duyệt</span><b>${cho.length}</b></div><div class="stat"><span>Đã duyệt</span><b>${don.filter(d=>d['Trạng thái']==='Đã duyệt').length}</b></div><div class="stat"><span>Từ chối</span><b>${don.filter(d=>d['Trạng thái']==='Từ chối').length}</b></div><div class="stat"><span>Đang lọc</span><b>${rows.length} đơn · ${rows.reduce((s,d)=>s+d['Số ngày'],0)} ngày</b></div>`;
    bang($('#npTable'),{rows:rows.slice().reverse(),cols:[{k:'STT',t:'num'},{k:'Số đơn',r:r=>`<span class="mono">${r['Số đơn']}</span>`},{k:'Ngày tạo đơn',t:'date'},{k:'Mã NV',r:r=>`<span class="mono">${r['Mã NV']}</span>`},{k:'Họ và tên',r:r=>nameBtn(r['Mã NV'],r['Họ và tên'])},{k:'Phòng ban'},{k:'Loại nghỉ'},{k:'Từ ngày',t:'date'},{k:'Đến ngày',t:'date'},{k:'Số ngày',t:'num'},{k:'Lý do'},{k:'Người duyệt'},{k:'Trạng thái',r:r=>pillDon(r['Trạng thái'])},{k:'Ngày duyệt',t:'date'},
      {label:'Phép còn lại',noi:1,t:'num',title:'Từ sheet Quy_phep_nam',v:r=>J.quyPhep[r['Mã NV']]?.['Còn lại'],r:r=>{const c=J.quyPhep[r['Mã NV']]?.['Còn lại'];return r['Trạng thái']==='Chờ duyệt'&&r['Loại nghỉ']==='Nghỉ phép năm'&&c<r['Số ngày']?`<span class="pill p-crit">${c} · thiếu phép</span>`:fN(c)}}]});
  }else{
    const con=$('#pCon').value;
    const rows=DATA.QUY_PHEP_NAM.filter(r=>(!pb||r['Phòng ban']===pb)&&(!con||(con==='1'?r['Còn lại']<=1:r['Còn lại']>=10))&&khop(r,q,['Họ và tên','Mã NV']));
    const dang=DATA.QUY_PHEP_NAM.filter(r=>!r['Ghi chú']);
    $('#pStats').innerHTML=`<div class="stat"><span>Tổng ngày phép cấp năm ${NAM}</span><b>${fN(dang.reduce((s,r)=>s+r[QTONG],0))}</b></div><div class="stat"><span>Đã nghỉ</span><b>${fN(dang.reduce((s,r)=>s+r['Đã nghỉ'],0))}</b></div><div class="stat warn"><span>Người còn ≤ 1 ngày</span><b>${dang.filter(r=>r['Còn lại']<=1).length}</b></div><div class="stat"><span>Người còn ≥ 10 ngày</span><b>${dang.filter(r=>r['Còn lại']>=10).length}</b></div>`;
    bang($('#npTable'),{rows,cols:[{k:'Mã NV',r:r=>`<span class="mono">${r['Mã NV']}</span>`},{k:'Họ và tên',r:r=>nameBtn(r['Mã NV'],r['Họ và tên'])},{k:'Phòng ban'},{k:'Ngày vào làm',t:'date'},{k:'Thâm niên (năm)',t:'num'},{k:'Phép cơ bản',t:'num'},{k:'Phép thâm niên',t:'num'},{k:QTONG,t:'num'},{k:'Đã nghỉ',t:'num'},{k:'Còn lại',t:'num',r:r=>r['Còn lại']<=1&&!r['Ghi chú']?`<span class="pill p-warn">${r['Còn lại']}</span>`:r['Còn lại']},{k:'Ghi chú'}]});
  }
}

/* ---------- Trang: Bảng lương ---------- */
let blCols='gon';
const BL_GON=['Mã NV','Họ và tên','Phòng ban','Chức danh','Lương cơ bản','Phụ cấp chức vụ','Công chuẩn','Ngày công thực tế','Lương thời gian','Tiền tăng ca','Tổng thu nhập','BHXH (8%)','Thuế TNCN','Tạm ứng','Thực lĩnh','Ghi chú'];
const BL_CHU=['Mã NV','Họ và tên','Phòng ban','Chức danh','Số tài khoản','Ngân hàng','Ghi chú'];
function trangBL(){
  const t=$('#bThang').value||'', all=DATA.BANG_LUONG[t]||[];
  if(!all.length){$('#bStats').innerHTML='';$('#blTable').innerHTML='<div class="card empty">Chưa có bảng lương cho tháng này.</div>';return}
  const q=khongDau($('#bSearch').value), pb=$('#bPB').value;
  const rows=all.filter(r=>(!pb||r['Phòng ban']===pb)&&khop(r,q,['Họ và tên','Mã NV']));
  const sum=(a,c)=>a.reduce((s,r)=>s+(r[c]||0),0), i=J.thangLuong.indexOf(t), truoc=i>0?DATA.BANG_LUONG[J.thangLuong[i-1]]:null;
  const bh=a=>sum(a,'BHXH (8%)')+sum(a,'BHYT (1,5%)')+sum(a,'BHTN (1%)')+sum(a,'Đoàn phí công đoàn (1%)');
  const tong=sum(rows,'Tổng thu nhập'), tt=truoc&&!pb&&!q?(tong/sum(truoc,'Tổng thu nhập')-1)*100:null;
  $('#bStats').innerHTML=`<div class="stat"><span>Số người</span><b>${rows.length}</b></div><div class="stat"><span>Tổng thu nhập</span><b>${fN(tong)}</b></div><div class="stat"><span>Tiền tăng ca</span><b>${fN(sum(rows,'Tiền tăng ca'))}</b></div><div class="stat"><span>Bảo hiểm + công đoàn (người lao động)</span><b>${fN(bh(rows))}</b></div><div class="stat"><span>Thuế TNCN</span><b>${fN(sum(rows,'Thuế TNCN'))}</b></div><div class="stat"><span>Thực lĩnh</span><b>${fN(sum(rows,'Thực lĩnh'))}</b></div>${tt!=null?`<div class="stat"><span>So với tháng trước</span><b>${tt>=0?'+':''}${tt.toLocaleString('vi-VN',{maximumFractionDigits:1})}%</b></div>`:''}`;
  const keys=blCols==='gon'?BL_GON:LUONG_COLS;
  bang($('#blTable'),{rows,cols:keys.map(k=>k==='Mã NV'?{k,r:r=>`<span class="mono">${r[k]}</span>`}:k==='Họ và tên'?{k,r:r=>nameBtn(r['Mã NV'],r[k])}:BL_CHU.includes(k)?{k}:{k,t:'money'}),
    foot:(c,i,rs)=>i===0?'TỔNG CỘNG':(c.t==='money'&&!['Công chuẩn','Số người phụ thuộc'].includes(c.k)?fN(sum(rs,c.k)):'')});
}

/* ---------- Trao đổi với phần mềm Python trên máy ---------- */
const CAU_HO_TRO='Nếu lỗi lặp lại, gửi file nhat-ky.txt cho người hỗ trợ.';
function hienLoi(tieuDe,thongDiep,duongDanNhatKy){
  try{
    $('#errTitle').textContent=tieuDe||'Có lỗi';
    $('#errMsg').textContent=thongDiep||'Đã có lỗi không mong muốn. Hãy thử lại.';
    $('#errLog').textContent=duongDanNhatKy||CAI_DAT.nhat_ky||'nhat-ky.txt (nằm cùng thư mục với phần mềm)';
    $('#errbox').hidden=false; $('#errClose').focus();
  }catch(e){
    try{alert((tieuDe||'Có lỗi')+'\n\n'+(thongDiep||'')+'\n\n'+CAU_HO_TRO)}catch(e2){}
  }
}
function ghiLoiGiaoDien(thongDiep,chiTiet){
  try{fetch('/api/ghi-loi-giao-dien',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({thong_diep:String(thongDiep||''),chi_tiet:String(chiTiet||'')})}).catch(()=>{})}catch(e){}
}
window.addEventListener('error',e=>{ghiLoiGiaoDien(e.message,(e.error&&e.error.stack)||`${e.filename}:${e.lineno}`)});
window.addEventListener('unhandledrejection',e=>{ghiLoiGiaoDien('Lỗi không bắt được',e.reason&&(e.reason.stack||e.reason.message||e.reason))});
function dangTai(bat,chu){try{$('#loading').hidden=!bat;if(chu)$('#loadingText').textContent=chu}catch(e){}}
async function api(duongDan,tuyChon={}){
  let res;
  try{res=await fetch(duongDan,tuyChon)}
  catch(e){const err=new Error('Không kết nối được với phần mềm trên máy. Có thể cửa sổ màu đen chạy phần mềm đã bị tắt. Hãy bấm đúp lại file chay_phan_mem.bat rồi mở lại trang này.');err.matKetNoi=1;throw err}
  let data=null;
  try{data=await res.json()}catch(e){const err=new Error(`Phần mềm trả về dữ liệu không đọc được (mã ${res.status}). Hãy bấm "Quét lại thư mục" hoặc mở lại phần mềm.`);ghiLoiGiaoDien('Không đọc được phản hồi '+duongDan,res.status);throw err}
  if(!res.ok||data.ok===false){const err=new Error(data&&data.loi?data.loi:`Có lỗi khi xử lý yêu cầu (mã ${res.status}).`);err.nhatKy=data&&data.nhat_ky;throw err}
  return data;
}
function nhanDuLieu(d){
  HOM_NAY=d.hom_nay; NAM=HOM_NAY.slice(0,4); LUC_QUET=d.luc_quet||''; CAI_DAT=d.cai_dat||{}; NGUON=d.nguon||[];
  DATA={...RONG,...(d.du_lieu||{})};
  const k=Object.keys(DATA.QUY_PHEP_NAM[0]||{}).find(x=>/^Tổng phép năm/.test(x)); QTONG=k||('Tổng phép năm '+NAM);
  PB_LIST=DATA.PHONG_BAN.map(p=>p['Tên phòng ban']).filter(Boolean);
  const ngoai=DATA.DANH_SACH_NHAN_VIEN.map(e=>e['Phòng ban']).filter(p=>p&&!PB_LIST.includes(p)); PB_LIST=PB_LIST.concat([...new Set(ngoai)]);
  apDungDuLieu();
}
async function quetLai(){
  dangTai(true,'Đang quét lại thư mục dữ liệu…');
  try{const d=await api('/api/quet-lai',{method:'POST'});nhanDuLieu(d);moTrang(trangHienTai);toast(`Đã quét lại lúc ${LUC_QUET}: ${NGUON.filter(n=>n.loai).length} bảng dữ liệu, ${d.so_viec??0} việc cần xử lý.`)}
  catch(e){hienLoi('Không quét lại được thư mục',e.message,e.nhatKy)}
  finally{dangTai(false)}
}

/* ---------- Trang: Nhập thêm dữ liệu ---------- */
let choNap=null;
function trangNhap(){
  const soLoi=NGUON.filter(n=>n.loi).length;
  $('#srcSub').textContent=`Quét lúc ${LUC_QUET} · ${NGUON.length} mục${soLoi?` · ${soLoi} mục đọc lỗi (các file khác vẫn đọc bình thường)`:''}`;
  const TEN_LOAI={PHONG_BAN:'Danh mục phòng ban',CHUC_VU:'Danh mục chức vụ',CA_LAM_VIEC:'Ca làm việc',KY_HIEU_CHAM_CONG:'Ký hiệu chấm công',DANH_SACH_NHAN_VIEN:'Hồ sơ nhân viên',SO_THEO_DOI_HDLD:'Sổ hợp đồng',LICH_SU_LUONG:'Lịch sử lương',DON_NGHI_PHEP:'Đơn nghỉ phép',QUY_PHEP_NAM:'Quỹ phép năm',CHAM_CONG:'Chấm công',BANG_LUONG:'Bảng lương'};
  bang($('#srcTable'),{rows:NGUON,size:60,cols:[
    {label:'Thư mục',k:'thuMuc',r:r=>r.canhBao?`<span style="color:var(--warn)">${esc(r.thuMuc)}</span>`:esc(r.thuMuc)},
    {label:'File',k:'file',r:r=>`<span class="mono" title="${esc(r.duongDan||'')}">${esc(r.file)}</span>`},
    {label:'Sheet',k:'sheet',r:r=>`<span class="mono">${esc(r.sheet||'')}</span>`},
    {label:'Nhận ra là',k:'loai',r:r=>r.loai?esc(TEN_LOAI[r.loai]||r.loai)+(r.thang?' '+fThang(r.thang):''):'<span class="dim">Không dùng</span>'},
    {label:'Dòng tiêu đề',k:'dongTieuDe',t:'num'},{label:'Số dòng',k:'soDong',t:'num'},
    {label:'Tình trạng',r:r=>r.loi?`<span class="pill p-crit">Lỗi</span> ${esc(r.loi)}`:(r.ghiChu||'').startsWith('Trùng')?`<span class="pill p-mute">Không dùng</span> ${esc(r.ghiChu)}`:r.thieuCot&&r.thieuCot.length?`<span class="pill p-warn">Thiếu cột</span> ${esc(r.thieuCot.join(', '))}`:r.canhBao?`<span class="pill p-warn">${esc(r.canhBao)}</span>`:r.loai?'<span class="pill p-ok">Đủ cột</span>'+(r.ghiChu?' '+esc(r.ghiChu):''):`<span class="dim">${esc(r.ghiChu||'')}</span>`}]});
}
function buoc(n){$$('#steps .step').forEach((s,i)=>{s.className='step'+(i+1<n?' done':i+1===n?' on':'')})}
async function guiFileKiemTra(file){
  if(!file)return;
  if(!/\.xls[xm]$/i.test(file.name)){hienLoi('File không đúng loại',`"${file.name}" không phải file Excel .xlsx. Hãy chọn file chấm công xuất từ máy chấm công (đuôi .xlsx).`);return}
  buoc(2); dangTai(true,'Đang đọc và kiểm tra file…');
  try{
    const d=await api('/api/kiem-tra-file',{method:'POST',headers:{'X-Ten-File':encodeURIComponent(file.name)},body:file});
    hienKetQua(d);
  }catch(e){buoc(1);hienLoi('Không kiểm tra được file',e.message,e.nhatKy)}
  finally{dangTai(false);try{$('#fileIn').value=''}catch(e){}}
}
function hienKetQua(d){
  choNap=d.cho_phep_nap?d.token:null;
  buoc(d.cho_phep_nap?3:2);
  $('#checkBox').hidden=false;
  $('#napStats').innerHTML=`<div class="stat"><span>Đọc được</span><b>${fN(d.so_dong)} dòng</b></div><div class="stat"><span>Tháng</span><b>${d.thang?fThang(d.thang):'—'}</b></div><div class="stat"><span>Mã NV khớp hồ sơ</span><b>${fN(d.khop)}</b></div><div class="stat ${d.khong_khop&&d.khong_khop.length?'warn':''}"><span>Mã NV không khớp</span><b>${fN((d.khong_khop||[]).length)}</b></div>`;
  const loi=d.kiem_tra.filter(k=>k.m==='err').length, canh=d.kiem_tra.filter(k=>k.m==='warn').length;
  $('#checkTitle').textContent=`Kết quả kiểm tra: ${d.ten} — ${loi?loi+' lỗi phải sửa':'không có lỗi'}${canh?', '+canh+' điểm cần lưu ý':''}`;
  $('#checks').innerHTML=d.kiem_tra.map(k=>`<li><span class="ic ${k.m}">${k.m==='ok'?'✓':k.m==='warn'?'!':'✕'}</span><div>${esc(k.t)}${k.s?`<small>${esc(k.s)}</small>`:''}</div></li>`).join('');
  $('#napDich').textContent=d.cho_phep_nap?`Khi bấm nạp, file sẽ được chép thành: ${d.dich_du_kien}`:'Chưa nạp được. Sửa các lỗi có dấu ✕ trong file Excel rồi chọn lại file.';
  $('#addBtn').disabled=!choNap;
  $('#addBtn').textContent=choNap?`Nạp tháng ${fThang(d.thang)} vào thư mục`:'Chưa nạp được';
  $('#previewCard').hidden=!(d.xem_truoc&&d.xem_truoc.length);
  if(d.xem_truoc&&d.xem_truoc.length){$('#previewSub').textContent=`${d.ten} · ${fN(d.so_dong)} dòng`;bang($('#previewTable'),{rows:d.xem_truoc,cols:CC_COLS.map(k=>k==='Ngày'?{k,t:'date'}:{k})})}
}
async function napFile(){
  if(!choNap)return;
  $('#addBtn').disabled=true; dangTai(true,'Đang chép file và quét lại thư mục…');
  try{
    const d=await api('/api/nap-file',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:choNap})});
    nhanDuLieu(d);
    toast(`Đã chép file vào ${d.da_chep_vao}. Số liệu đã cập nhật.`);
    huyNap(); trangNhap();
  }catch(e){$('#addBtn').disabled=false;hienLoi('Chưa nạp được file',e.message,e.nhatKy)}
  finally{dangTai(false)}
}
function huyNap(){choNap=null;$('#checkBox').hidden=true;$('#previewCard').hidden=true;buoc(1);try{$('#fileIn').value=''}catch(e){}}
let toastT;function toast(m){try{const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,5000)}catch(e){}}

/* ---------- Trang: Cài đặt ---------- */
function trangCaiDat(){
  $('#cdFolder').textContent=CAI_DAT.thu_muc_du_lieu||'(chưa chọn)';
  $('#cdCC').textContent=CAI_DAT.thu_muc_cham_cong||'(sẽ tạo 03_Cham_cong khi nạp file đầu tiên)';
  $('#cdLog').textContent=CAI_DAT.nhat_ky||'';
  $('#cdVer').textContent=`Phần mềm ${CAI_DAT.phien_ban||''} · Python ${CAI_DAT.python||''}`;
  $('#cdPort').value=CAI_DAT.cong_luu||CAI_DAT.cong||'';
  $('#cdChrome').value=CAI_DAT.chrome_luu||'';
  $('#cdAddr').textContent=`Địa chỉ đang chạy: ${location.origin} · Chrome đang dùng: ${CAI_DAT.chrome||'không tìm thấy, dùng trình duyệt mặc định'}`;
}
async function luuCaiDat(){
  try{
    const d=await api('/api/cai-dat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cong:$('#cdPort').value,chrome:$('#cdChrome').value})});
    CAI_DAT=d.cai_dat||CAI_DAT; trangCaiDat(); toast(d.thong_bao||'Đã lưu cài đặt.');
  }catch(e){hienLoi('Chưa lưu được cài đặt',e.message,e.nhatKy)}
}
async function timChrome(){
  try{const d=await api('/api/tu-tim-chrome',{method:'POST'});CAI_DAT=d.cai_dat||CAI_DAT;trangCaiDat();toast(d.thong_bao)}
  catch(e){hienLoi('Không tìm được Chrome',e.message,e.nhatKy)}
}
async function doiThuMuc(){
  dangTai(true,'Hãy chọn thư mục trong cửa sổ vừa mở (có thể nằm phía sau trình duyệt)…');
  try{const d=await api('/api/chon-thu-muc',{method:'POST'});if(d.huy){toast('Bạn chưa chọn thư mục mới. Giữ nguyên thư mục cũ.');return}nhanDuLieu(d);trangCaiDat();toast('Đã đổi thư mục dữ liệu và quét lại.')}
  catch(e){hienLoi('Không đổi được thư mục dữ liệu',e.message,e.nhatKy)}
  finally{dangTai(false)}
}
async function moTrenMay(loai){try{await api('/api/mo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({loai})})}catch(e){hienLoi('Không mở được',e.message,e.nhatKy)}}

/* ---------- Điều hướng & khởi động ---------- */
const TRANG={dash:trangDash,viec:trangViec,nv:trangNV,hd:trangHD,cc:trangCC,np:trangNP,bl:trangBL,nhap:trangNhap,caidat:trangCaiDat};
let trangHienTai='dash';
function moTrang(p){
  if(!TRANG[p])p='dash'; trangHienTai=p;
  $$('main > section').forEach(s=>s.hidden=s.id!=='p-'+p);
  $$('#nav button').forEach(b=>{if(b.dataset.page===p)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
  try{TRANG[p]()}catch(e){ghiLoiGiaoDien('Lỗi khi hiển thị trang '+p,e.stack||e.message);hienLoi('Không hiển thị được trang này','Một phần dữ liệu có thể chưa đúng mẫu. Hãy xem trang "Nhập thêm dữ liệu" để biết file nào đọc lỗi, sửa file rồi bấm "Quét lại thư mục".')}
  try{history.replaceState(null,'','#'+p)}catch(e){}
  window.scrollTo(0,0);
}
function napSelectThang(){
  const opt=(arr,sel)=>arr.map(([v,t])=>`<option value="${v}" ${v===sel?'selected':''}>${t}</option>`).join('');
  const cc=J.thangCC, c0=$('#cThang').value;
  $('#cThang').innerHTML=cc.length?opt(cc.map(t=>[t,'Tháng '+fThang(t)]),cc.includes(c0)?c0:cc[cc.length-1]):'<option value="">Chưa có dữ liệu</option>';
  const bl=J.thangLuong, b0=$('#bThang').value;
  $('#bThang').innerHTML=(bl.length?opt(bl.map(t=>[t,'Tháng '+fThang(t)]),bl.includes(b0)?b0:bl[bl.length-1]):'<option value="">Chưa có bảng lương</option>')+cc.filter(t=>!bl.includes(t)).map(t=>`<option disabled>Tháng ${fThang(t)} – chưa có</option>`).join('');
}
function apDungDuLieu(){
  lapChiMuc();
  $$('.nam').forEach(x=>x.textContent=NAM);
  $('#footDate').textContent=fD(HOM_NAY);
  $$('.today').forEach(x=>x.textContent=fD(HOM_NAY));
  $('#footFolder').textContent=CAI_DAT.thu_muc_du_lieu||'';
  $$('[data-loai]').forEach(x=>x.textContent=F(x.dataset.loai,1));
  const soLoi=NGUON.filter(n=>n.loi).length, ngoai=NGUON.filter(n=>n.canhBao&&!(n.ghiChu||'').startsWith('Trùng')).length;
  $('#sbText').innerHTML=`Dữ liệu thật · Quét lúc <b>${esc(LUC_QUET)}</b> · <b>${NGUON.filter(n=>n.loai).length}</b> bảng từ <b>${new Set(NGUON.map(n=>n.duongDan)).size}</b> file`+(soLoi?` · <span class="warnt">${soLoi} mục đọc lỗi</span>`:'')+(ngoai?` · <span class="warnt">${ngoai} file để ngoài chỗ quy định</span>`:'')+(!DATA.DANH_SACH_NHAN_VIEN.length?' · <span class="warnt">Chưa tìm thấy hồ sơ nhân viên</span>':'');
  const giuChon=(sel,html)=>{const v=sel.value;sel.innerHTML=html;if([...sel.options].some(o=>o.value===v))sel.value=v};
  $$('.pb-select').forEach(s=>giuChon(s,'<option value="">Tất cả phòng ban</option>'+PB_LIST.map(p=>`<option>${esc(p)}</option>`).join('')));
  giuChon($('#nCV'),'<option value="">Tất cả chức vụ</option>'+[...new Set(DATA.CHUC_VU.map(c=>c['Tên chức vụ']).concat(DATA.DANH_SACH_NHAN_VIEN.map(e=>e['Chức vụ'])).filter(Boolean))].map(c=>`<option>${esc(c)}</option>`).join(''));
  giuChon($('#hLoai'),'<option value="">Tất cả loại</option>'+[...new Set(DATA.SO_THEO_DOI_HDLD.map(h=>h['Loại hợp đồng']).filter(Boolean))].map(l=>`<option>${esc(l)}</option>`).join(''));
  const hetHan=[...new Set(DATA.SO_THEO_DOI_HDLD.filter(h=>h['Tình trạng']==='Đang hiệu lực'&&h['Ngày hết hạn']).map(h=>String(h['Ngày hết hạn']).slice(0,7)))].sort();
  giuChon($('#hThang'),'<option value="">Tất cả</option>'+hetHan.map(t=>`<option value="${t}">Tháng ${fThang(t)}</option>`).join(''));
  giuChon($('#cKH'),'<option value="">Tất cả ký hiệu</option>'+DATA.KY_HIEU_CHAM_CONG.map(k=>`<option value="${esc(k['Ký hiệu'])}">${esc(k['Ký hiệu'])} – ${esc(k['Ý nghĩa'])}</option>`).join(''));
  const namDon=[...new Set(DATA.DON_NGHI_PHEP.map(d=>String(d['Từ ngày']||'').slice(0,4)).filter(Boolean).concat([NAM]))].sort();
  giuChon($('#pThang'),'<option value="">Tất cả</option>'+namDon.flatMap(y=>Array.from({length:12},(_,i)=>{const t=`${y}-${String(i+1).padStart(2,'0')}`;return `<option value="${t}">Tháng ${fThang(t)}</option>`})).join(''));
  giuChon($('#pLoai'),'<option value="">Tất cả loại</option>'+[...new Set(DATA.DON_NGHI_PHEP.map(d=>d['Loại nghỉ']).filter(Boolean))].map(l=>`<option>${esc(l)}</option>`).join(''));
  napSelectThang();capNhatBadge();
}
function ganSuKien(){
  $('#nav').addEventListener('click',e=>{const b=e.target.closest('button[data-page]');if(b)moTrang(b.dataset.page)});
  document.addEventListener('click',e=>{
    const n=e.target.closest('.namebtn');if(n){try{moHoSo(n.dataset.ma)}catch(err){ghiLoiGiaoDien('Lỗi mở hồ sơ',err.stack);hienLoi('Không mở được hồ sơ','Hồ sơ của nhân viên này có thể thiếu thông tin. Hãy kiểm tra file hồ sơ nhân viên.')}return}
    const r=e.target.closest('[data-rescan]');if(r){quetLai();return}
    const m=e.target.closest('[data-mo]');if(m){moTrenMay(m.dataset.mo);return}
    const g=e.target.closest('[data-go]');if(g){if(g.dataset.arg==='cho'){$('#pTT').value='Chờ duyệt';npView='don';$$('#pView button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v==='don'))}if(g.dataset.go==='hd'){$('#hTT').value='Đang hiệu lực'}moTrang(g.dataset.go)}
  });
  $('#viecTypes').addEventListener('click',e=>{const b=e.target.closest('[data-l]');if(b){loaiCB=b.dataset.l;trangViec()}});
  const nhom=[[['#vSearch','#vSev','#vPB'],trangViec],[['#nSearch','#nPB','#nCV','#nTT'],trangNV],[['#hSearch','#hThang','#hTT','#hLoai','#hPB'],trangHD],[['#cThang','#cSearch','#cPB','#cKH'],trangCC],[['#pSearch','#pThang','#pTT','#pLoai','#pPB','#pCon'],trangNP],[['#bThang','#bSearch','#bPB'],trangBL]];
  nhom.forEach(([ids,fn])=>ids.forEach(id=>{const el=$(id);el.addEventListener(el.tagName==='INPUT'?'input':'change',()=>{try{fn()}catch(err){ghiLoiGiaoDien('Lỗi lọc '+id,err.stack)}})}));
  const seg=(id,cb)=>$(id).addEventListener('click',e=>{const b=e.target.closest('button[data-v]');if(!b)return;$$(id+' button').forEach(x=>x.setAttribute('aria-pressed',x===b));cb(b.dataset.v)});
  seg('#cView',v=>{ccView=v;trangCC()});seg('#pView',v=>{npView=v;trangNP()});seg('#bCols',v=>{blCols=v;trangBL()});
  $('#drClose').onclick=dongHoSo;$('#backdrop').onclick=dongHoSo;
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('#errbox').hidden)$('#errbox').hidden=true;else if(!$('#drawer').hidden)dongHoSo()}});
  $('#errClose').onclick=()=>{$('#errbox').hidden=true};
  $('#drTabs').addEventListener('click',e=>{const b=e.target.closest('button[data-t]');if(b)chonTab(b.dataset.t)});
  $('#fileIn').addEventListener('change',e=>guiFileKiemTra(e.target.files[0]));
  $('label[for=fileIn]').addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('#fileIn').click()}});
  const drop=$('#drop');
  ['dragenter','dragover'].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.classList.add('over')}));
  ['dragleave','drop'].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.classList.remove('over')}));
  drop.addEventListener('drop',e=>guiFileKiemTra(e.dataTransfer.files[0]));
  $('#addBtn').onclick=napFile; $('#cancelBtn').onclick=huyNap;
  $('#cdLuu').onclick=luuCaiDat; $('#cdTimChrome').onclick=timChrome; $('#cdDoiFolder').onclick=doiThuMuc;
}
function capNhatBadge(){try{const n=lapCanhBao().filter(a=>a.muc==='crit').length;$('#navBadge').textContent=n||'';$('#navBadge').hidden=!n}catch(e){ghiLoiGiaoDien('Lỗi đếm cảnh báo',e.stack)}}
async function khoiDong(){
  ganSuKien();
  dangTai(true,'Đang đọc dữ liệu từ thư mục…');
  try{
    const d=await api('/api/du-lieu');
    nhanDuLieu(d);
    const h=(location.hash||'').slice(1);
    moTrang(TRANG[h]?h:'dash');
  }catch(e){
    ghiLoiGiaoDien('Không tải được dữ liệu lúc mở',e.stack||e.message);
    hienLoi('Không mở được dữ liệu',e.message,e.nhatKy);
    try{$('#sbText').textContent='Chưa có dữ liệu. Kiểm tra thư mục ở trang Cài đặt rồi bấm "Quét lại thư mục".';DATA={...RONG};HOM_NAY=HOM_NAY||new Date().toISOString().slice(0,10);NAM=HOM_NAY.slice(0,4);apDungDuLieu();moTrang('caidat')}catch(e2){}
  }finally{dangTai(false)}
}
khoiDong();

</script>
</body></html>
'''


if __name__ == "__main__":
    if len(sys.argv) >= 2 and sys.argv[1] == "--chon-thu-muc":
        try:
            print(hop_thoai_chon_thu_muc(sys.argv[2] if len(sys.argv) > 2 else None), flush=True)
            sys.exit(0)
        except Exception:
            ghi_loi("Lỗi trong tiến trình chọn thư mục")
            sys.exit(2)
    try:
        sys.exit(chinh())
    except SystemExit:
        raise
    except LoiNguoiDung as e:
        ghi(f"Dừng phần mềm: {e}")
        hop_thoai_bao_loi("Phần mềm chưa chạy được", str(e))
        sys.exit(1)
    except Exception:
        ghi_loi("Lỗi không mong muốn làm phần mềm dừng")
        hop_thoai_bao_loi("Phần mềm gặp lỗi và phải dừng", "Đã có lỗi không mong muốn. Hãy đóng cửa sổ này rồi bấm đúp lại file chay_phan_mem.bat.")
        sys.exit(1)

