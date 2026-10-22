# -*- coding: utf-8 -*-
"""
TOOL TAI HOA DON DIEN TU HANG LOAT
Chay trong trinh duyet Chrome - giao dien giong ban artifact.

Cach dung: bam doi vao file nay (hoac chay: python tool_tai_hoa_don.py)
Tool se tu mo Chrome. Muon dong tool thi dong cua so den (Command Prompt).

Khong can cai them thu vien nao - chi dung thu vien co san cua Python.
"""

APP_VERSION = "1.3"

import base64
import http.cookiejar
import http.server
import json
import os
import platform
import queue
import re
import shutil
import socket
import ssl
import subprocess
import sys
import tempfile
import threading
import time
import traceback
import urllib.error
import urllib.parse
import urllib.request
import uuid
import webbrowser
import xml.etree.ElementTree as ET
import zipfile
import io
from datetime import datetime, date, timedelta

try:
    import tkinter as tk
    from tkinter import filedialog
    TK_OK = True
except Exception:
    TK_OK = False

# ==========================================================================
#  DUONG DAN
# ==========================================================================
if getattr(sys, "frozen", False):
    BASE_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))

LOG_PATH = os.path.join(BASE_DIR, "nhat-ky.txt")
LOG_OLD_PATH = os.path.join(BASE_DIR, "nhat-ky-cu.txt")
SETTINGS_PATH = os.path.join(BASE_DIR, "cai-dat.json")
LOG_MAX_BYTES = 5 * 1024 * 1024  # 5 MB


# ==========================================================================
#  CHE THONG TIN NHAY CAM  (yeu cau muc 5)
# ==========================================================================
_SECRET_KEYS = (
    "password", "matkhau", "mat_khau", "pass", "pwd",
    "token", "access_token", "refresh_token", "authorization", "bearer",
    "apikey", "api_key", "key", "ckey", "cvalue", "captcha", "cccd",
    "sotaikhoan", "cardnumber", "cmnd",
)


def mask_tail(value):
    """Che het, chi de lo 3 ky tu cuoi."""
    try:
        s = str(value)
    except Exception:
        return "***"
    if len(s) <= 3:
        return "*" * len(s)
    return "*" * (len(s) - 3) + s[-3:]


def scrub(text):
    """Xoa/che moi thong tin nhay cam truoc khi ghi vao nhat ky."""
    try:
        s = str(text)
    except Exception:
        return "<khong doc duoc noi dung>"
    try:
        # dang JSON:  "password":"abc123"
        for k in _SECRET_KEYS:
            s = re.sub(
                r'("%s"\s*:\s*")([^"]*)(")' % re.escape(k),
                lambda m: m.group(1) + mask_tail(m.group(2)) + m.group(3),
                s, flags=re.IGNORECASE)
            # dang tham so URL:  password=abc123
            s = re.sub(
                r'(\b%s=)([^&\s"\']+)' % re.escape(k),
                lambda m: m.group(1) + mask_tail(m.group(2)),
                s, flags=re.IGNORECASE)
        # header Authorization: Bearer xxxxx
        s = re.sub(r'(Bearer\s+)([A-Za-z0-9\.\-_]+)',
                   lambda m: m.group(1) + mask_tail(m.group(2)), s)
        # chuoi so dai tu 12 chu so tro len (CCCD, so the, so tai khoan)
        s = re.sub(r'(?<!\d)(\d{12,25})(?!\d)', lambda m: mask_tail(m.group(1)), s)
    except Exception:
        return "<loi khi che thong tin nhay cam>"
    return s


# ==========================================================================
#  NHAT KY  (yeu cau muc 1-4)
# ==========================================================================
class NhatKy:
    def __init__(self, path, old_path, max_bytes):
        self.path = path
        self.old_path = old_path
        self.max_bytes = max_bytes
        self.lock = threading.Lock()

    def _rotate_if_needed(self):
        try:
            if os.path.exists(self.path) and os.path.getsize(self.path) > self.max_bytes:
                if os.path.exists(self.old_path):
                    os.remove(self.old_path)
                os.rename(self.path, self.old_path)
                self._raw("[HE THONG] File nhat ky cu da doi ten thanh nhat-ky-cu.txt, bat dau file moi.")
        except Exception:
            pass  # khong duoc de viec ghi nhat ky lam chet tool

    def _raw(self, line):
        try:
            stamp = datetime.now().strftime("[%d/%m/%Y %H:%M:%S]")
            with open(self.path, "a", encoding="utf-8") as f:
                f.write(stamp + " " + line.rstrip("\n") + "\n")
        except Exception:
            try:
                print("Khong ghi duoc nhat ky:", traceback.format_exc()[:300])
            except Exception:
                pass

    def ghi(self, line):
        with self.lock:
            self._rotate_if_needed()
            self._raw(scrub(line))

    def phan_cach(self, tieu_de):
        with self.lock:
            self._rotate_if_needed()
            self._raw("")
            self._raw("=" * 62)
            self._raw("===== " + tieu_de + " =====")
            self._raw("=" * 62)

    def loi(self, mo_ta, exc=None):
        """Ghi day du traceback - khong bao gio de tool chet im lang."""
        with self.lock:
            self._rotate_if_needed()
            self._raw("[LOI] " + scrub(mo_ta))
            try:
                tb = traceback.format_exc() if exc is None else "".join(
                    traceback.format_exception(type(exc), exc, exc.__traceback__))
                for ln in scrub(tb).splitlines():
                    self._raw("       " + ln)
            except Exception:
                self._raw("       (khong lay duoc chi tiet loi)")


LOG = NhatKy(LOG_PATH, LOG_OLD_PATH, LOG_MAX_BYTES)


# ==========================================================================
#  THIET LAP - luu vao cai-dat.json, chinh duoc het qua giao dien
# ==========================================================================
DEFAULT_SETTINGS = {
    "thu_muc_luu": "",
    "mst": "",
    "mat_khau_ma_hoa": "",
    "nho_dang_nhap": True,
    "dinh_dang": ["xml"],         # loai file muon tai: xml va/hoac pdf
    "may_chu_da_chay": "",        # dia chi may chu dung duoc lan truoc
    "duong_tai_da_chay": {},      # duong dan tai xml dung duoc lan truoc
    "duong_pdf_da_chay": {},      # duong dan tai pdf dung duoc lan truoc
    "khong_co_duong_pdf": False,  # may chu khong co san PDF -> tu in
}

MAX_TRANG_TRA_CUU = 240  # 240 trang x 50 hoa don = toi da 12.000 hoa don moi nhom


def doc_thiet_lap():
    s = dict(DEFAULT_SETTINGS)
    try:
        if os.path.exists(SETTINGS_PATH):
            with open(SETTINGS_PATH, "r", encoding="utf-8") as f:
                s.update(json.load(f))
    except Exception:
        LOG.loi("Khong doc duoc file cai-dat.json, dung thiet lap mac dinh.")
    return s


def luu_thiet_lap(s):
    try:
        with open(SETTINGS_PATH, "w", encoding="utf-8") as f:
            json.dump(s, f, ensure_ascii=False, indent=2)
    except Exception:
        LOG.loi("Khong luu duoc file cai-dat.json.")


def giau(text):
    try:
        return base64.b64encode(text.encode("utf-8")).decode("ascii")
    except Exception:
        return ""


def hien(text):
    try:
        return base64.b64decode(text.encode("ascii")).decode("utf-8")
    except Exception:
        return ""


SETTINGS = doc_thiet_lap()


# ==========================================================================
#  GOI RA MANG  (yeu cau muc 3 + muc 7: tu do khi khong chac)
# ==========================================================================
MAY_CHU_UNG_VIEN = [
    "https://hoadondientu.gdt.gov.vn/api",
    "https://hoadondientu.gdt.gov.vn",
]

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36")

_ssl_ctx = ssl.create_default_context()
_ssl_ctx.check_hostname = False
_ssl_ctx.verify_mode = ssl.CERT_NONE

_COOKIE_JAR = http.cookiejar.CookieJar()
_OPENER = urllib.request.build_opener(
    urllib.request.HTTPCookieProcessor(_COOKIE_JAR),
    urllib.request.HTTPSHandler(context=_ssl_ctx),
)


def _headers_trinh_duyet(url, co_body=False, token=None):
    """Tao header giong request tu trang hoadondientu.gdt.gov.vn."""
    p = urllib.parse.urlparse(url)
    origin = "%s://%s" % (p.scheme, p.netloc)
    headers = {
        "User-Agent": UA,
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "vi,en-US;q=0.9,en;q=0.8",
        "request-id": str(uuid.uuid4()),
        "Action": "",
        "End-Point": "/",
    }
    if p.netloc.endswith("hoadondientu.gdt.gov.vn"):
        headers["Origin"] = origin
        headers["Referer"] = origin + "/"
    if co_body:
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = "Bearer " + token
        headers["Accept-Language"] = "vi"
    return headers


class KetQuaMang:
    def __init__(self, ok, status=0, data=b"", ctype="", loi=""):
        self.ok = ok
        self.status = status
        self.data = data
        self.ctype = ctype
        self.loi = loi

    def json(self):
        try:
            return json.loads(self.data.decode("utf-8"))
        except Exception:
            return None


def goi_mang(url, method="GET", body=None, token=None, timeout=60, ghi_log=True):
    """Goi mot dia chi tren mang. Luon ghi lai day du vao nhat ky."""
    headers = _headers_trinh_duyet(url, body is not None, token)
    data = None
    if body is not None:
        data = json.dumps(body).encode("utf-8")

    if ghi_log:
        LOG.ghi("[MANG] %s %s" % (method, url))

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    t0 = time.time()
    try:
        with _OPENER.open(req, timeout=timeout) as resp:
            raw = resp.read()
            ctype = resp.headers.get("Content-Type", "")
            if ghi_log:
                LOG.ghi("[MANG] -> ma tra ve %s | kieu du lieu: %s | dung luong: %d byte | mat %.1f giay"
                        % (resp.status, ctype or "khong ro", len(raw), time.time() - t0))
            return KetQuaMang(True, resp.status, raw, ctype)
    except urllib.error.HTTPError as e:
        try:
            body_err = e.read().decode("utf-8", "replace")
        except Exception:
            body_err = ""
        if ghi_log:
            LOG.ghi("[MANG] -> ma tra ve %s | dung luong loi: %d byte" % (e.code, len(body_err)))
            LOG.ghi("[MANG] -> NGUYEN VAN loi tu may chu: " + body_err[:500])
        return KetQuaMang(False, e.code, b"", "", body_err[:500])
    except urllib.error.URLError as e:
        mo_ta = str(getattr(e, "reason", e))
        if ghi_log:
            LOG.ghi("[MANG] -> khong ket noi duoc. NGUYEN VAN: " + mo_ta[:500])
        return KetQuaMang(False, 0, b"", "", mo_ta[:500])
    except socket.timeout:
        if ghi_log:
            LOG.ghi("[MANG] -> qua thoi gian cho (%d giay)" % timeout)
        return KetQuaMang(False, 0, b"", "", "Qua thoi gian cho phan hoi tu may chu.")
    except Exception as e:
        LOG.loi("Loi khong luong truoc khi goi %s" % url, e)
        return KetQuaMang(False, 0, b"", "", str(e)[:500])


def tim_may_chu():
    """Thu lan luot cac dia chi may chu, cai nao chay duoc thi nho lai."""
    uu_tien = []
    if SETTINGS.get("may_chu_da_chay"):
        uu_tien.append(SETTINGS["may_chu_da_chay"])
    for m in MAY_CHU_UNG_VIEN:
        if m not in uu_tien:
            uu_tien.append(m)

    LOG.ghi("[DO TIM] Bat dau do tim dia chi may chu, co %d dia chi de thu." % len(uu_tien))
    for m in uu_tien:
        kq = goi_mang(m + "/captcha", timeout=20)
        if kq.ok and kq.data:
            LOG.ghi("[DO TIM] -> DUNG DUOC: " + m + " (da nho lai cho lan sau)")
            SETTINGS["may_chu_da_chay"] = m
            luu_thiet_lap(SETTINGS)
            return m
        LOG.ghi("[DO TIM] -> khong dung duoc: " + m)
    LOG.ghi("[DO TIM] Khong dia chi nao dung duoc.")
    return None


# ==========================================================================
#  BANG QUY DOI CAC LUA CHON TREN GIAO DIEN
# ==========================================================================
MA_TRANG_THAI = {
    "Tất cả": None, "Hóa đơn mới": "1", "Hóa đơn thay thế": "2",
    "Hóa đơn điều chỉnh": "3", "Hóa đơn đã bị thay thế": "4",
    "Hóa đơn đã bị điều chỉnh": "5", "Hóa đơn đã bị hủy": "6",
}
MA_KET_QUA = {
    "Tất cả": None, "Cục Thuế đã nhận": "0",
    "Đang tiến hành kiểm tra điều kiện cấp mã": "1",
    "CQT từ chối hóa đơn theo từng lần phát sinh": "2",
    "Hóa đơn đủ điều kiện cấp mã": "3",
    "Hóa đơn không đủ điều kiện cấp mã": "4",
    "Đã cấp mã hóa đơn": "5",
    "Cục Thuế đã nhận không mã": "6",
    "Đã kiểm tra định kỳ HĐĐT không có mã": "7",
    "Cục Thuế đã nhận hóa đơn có mã khởi tạo từ máy tính tiền": "8",
}


def duong_tra_cuu(kind, direction):
    """kind: dt / mtt   |   direction: ban / mua"""
    goc = "/sco-query" if kind == "mtt" else "/query"
    duoi = "/invoices/sold" if direction == "ban" else "/invoices/purchase"
    return goc + duoi


def duong_tai_ung_vien(kind):
    if kind == "mtt":
        return ["/sco-query/invoices/export-xml",
                "/query/invoices/export-xml",
                "/resource/export-xml"]
    return ["/query/invoices/export-xml",
            "/sco-query/invoices/export-xml",
            "/resource/export-xml"]


def duong_pdf_ung_vien(kind):
    if kind == "mtt":
        return ["/sco-query/invoices/export-pdf",
                "/query/invoices/export-pdf",
                "/resource/export-pdf"]
    return ["/query/invoices/export-pdf",
            "/sco-query/invoices/export-pdf",
            "/resource/export-pdf"]


# ==========================================================================
#  TRANG THAI CHUNG CUA TOOL
# ==========================================================================
STATE = {
    "may_chu": None,
    "token": None,
    "ckey": None,
    "mst": "",
    "ket_qua": {"dt": [], "mtt": []},
    "tai": {"dang_chay": False, "dung": False, "tong": 0, "xong": 0,
            "ok": 0, "bo_qua": 0, "loi": 0, "hien_tai": "", "ket_thuc": ""},
}
STATE_LOCK = threading.Lock()

# hop thu de yeu cau mo cua so chon thu muc (tkinter phai chay o luong chinh)
HOP_THU_CHON_THU_MUC = queue.Queue()


# ==========================================================================
#  CAC VIEC CHINH
# ==========================================================================
def lay_captcha():
    if not STATE["may_chu"]:
        STATE["may_chu"] = tim_may_chu()
    if not STATE["may_chu"]:
        return None, "Không kết nối được tới máy chủ của Cục Thuế. Kiểm tra lại mạng Internet rồi thử lại."

    kq = goi_mang(STATE["may_chu"] + "/captcha", timeout=25)
    if not kq.ok:
        return None, "Không lấy được mã captcha. Máy chủ trả về: " + (kq.loi or "không rõ lý do")
    j = kq.json()
    if not j:
        return None, "Máy chủ trả về dữ liệu captcha không đọc được."
    STATE["ckey"] = j.get("key")
    LOG.ghi("[CAPTCHA] Da lay duoc anh captcha moi.")
    return j.get("content", ""), None


def dang_nhap(mst, mat_khau, ma_captcha):
    if not STATE["may_chu"]:
        STATE["may_chu"] = tim_may_chu()
    if not STATE["may_chu"]:
        return False, "Không kết nối được tới máy chủ của Cục Thuế. Kiểm tra lại mạng Internet rồi thử lại."

    LOG.ghi("[DANG NHAP] Bat dau dang nhap voi ma so thue %s" % mst)
    body = {"ckey": STATE["ckey"], "cvalue": ma_captcha,
            "username": mst, "password": mat_khau}
    kq = goi_mang(STATE["may_chu"] + "/security-taxpayer/authenticate",
                  method="POST", body=body, timeout=40)
    if not kq.ok:
        thong_bao = "Đăng nhập không thành công."
        if kq.status in (400, 401):
            thong_bao = "Sai mã số thuế, mật khẩu hoặc mã captcha. Bấm vào ảnh captcha để lấy mã mới rồi nhập lại."
        elif kq.status == 403:
            thong_bao = "Máy chủ Cục Thuế đang chặn yêu cầu đăng nhập. Đóng tool, mở lại rồi lấy captcha mới trước khi thử lại."
        elif kq.status == 0:
            thong_bao = "Không kết nối được tới máy chủ Cục Thuế. Kiểm tra lại mạng Internet."
        return False, thong_bao + " (Máy chủ báo: " + (kq.loi[:200] or "không rõ") + ")"

    j = kq.json() or {}
    token = j.get("token")
    if not token:
        LOG.ghi("[DANG NHAP] May chu tra ve khong co token.")
        return False, "Máy chủ không cấp phiên làm việc. Thử lấy mã captcha mới rồi đăng nhập lại."

    STATE["token"] = token
    STATE["mst"] = mst
    LOG.ghi("[DANG NHAP] THANH CONG. Ma so thue: %s | phien lam viec: %s" % (mst, mask_tail(token)))
    return True, None


def _ngay_thue(d, cuoi_ngay=False):
    """'2026-08-19' -> '19/08/2026T23:59:59'"""
    y, m, dd = d.split("-")
    gio = "23:59:59" if cuoi_ngay else "00:00:00"
    return "%s/%s/%sT%s" % (dd, m, y, gio)


def _doc_ngay_iso(s):
    return datetime.strptime(s, "%Y-%m-%d").date()


def _cong_mot_thang(d):
    nam = d.year + (1 if d.month == 12 else 0)
    thang = 1 if d.month == 12 else d.month + 1
    return date(nam, thang, 1)


def _tach_khoang_theo_thang(tu_ngay, den_ngay):
    tu = _doc_ngay_iso(tu_ngay)
    den = _doc_ngay_iso(den_ngay)
    if tu > den:
        return []

    ds = []
    bat_dau = tu
    while bat_dau <= den:
        dau_thang_sau = _cong_mot_thang(bat_dau)
        ket_thuc = min(den, dau_thang_sau - timedelta(days=1))
        ds.append((bat_dau.isoformat(), ket_thuc.isoformat()))
        bat_dau = ket_thuc + timedelta(days=1)
    return ds


def _khoa_hoa_don(hd):
    ma = hd.get("id") or hd.get("mhdon")
    if ma:
        return str(ma)
    return "|".join(str(hd.get(k, "")) for k in ("nbmst", "nmmst", "khhdon", "shdon", "khmshdon", "tdlap"))


def _tra_cuu_mot_khoang(p, tu_ngay, den_ngay):
    """Lay hoa don cho mot khoang ngay ma may chu cho phep."""
    kind = p.get("kind", "dt")
    direction = p.get("direction", "ban")

    dieu_kien = ["tdlap=ge=" + _ngay_thue(tu_ngay),
                 "tdlap=le=" + _ngay_thue(den_ngay, True)]
    ma_tt = MA_TRANG_THAI.get(p.get("trang_thai", "Tất cả"))
    if ma_tt:
        dieu_kien.append("tthai==" + ma_tt)
    ma_kq = MA_KET_QUA.get(p.get("ket_qua", "Tất cả"))
    if ma_kq is not None:
        dieu_kien.append("ttxly==" + ma_kq)
    if p.get("mst_nguoi_mua"):
        dieu_kien.append("nmmst==" + p["mst_nguoi_mua"].strip())
    if p.get("ky_hieu"):
        dieu_kien.append("khhdon==" + p["ky_hieu"].strip())
    if p.get("so_hoa_don"):
        dieu_kien.append("shdon==" + p["so_hoa_don"].strip())
    if p.get("mau_so") and p["mau_so"] != "Tất cả":
        dieu_kien.append("khmshdon==" + p["mau_so"])

    search = ";".join(dieu_kien)
    duong = STATE["may_chu"] + duong_tra_cuu(kind, direction)

    LOG.ghi("[TRA CUU] Bo loc: " + search)
    tat_ca, state_cursor, trang = [], None, 0

    while trang < MAX_TRANG_TRA_CUU:
        trang += 1
        params = {"sort": "tdlap:desc", "size": "50", "search": search}
        if state_cursor:
            params["state"] = state_cursor
        url = duong + "?" + urllib.parse.urlencode(params)

        kq = goi_mang(url, token=STATE["token"], timeout=60)
        if not kq.ok:
            if kq.status in (401, 403):
                return None, "Phiên làm việc đã hết hạn. Đăng nhập lại rồi tìm kiếm tiếp."
            if kq.status == 500 and "sort" in (kq.loi or "").lower():
                LOG.ghi("[TRA CUU] May chu tu choi cach sap xep, thu lai khong sap xep.")
                params.pop("sort", None)
                kq = goi_mang(duong + "?" + urllib.parse.urlencode(params),
                              token=STATE["token"], timeout=60)
                if not kq.ok:
                    return None, "Máy chủ Cục Thuế báo lỗi khi tìm kiếm: " + (kq.loi[:200] or "không rõ")
            else:
                return None, "Máy chủ Cục Thuế báo lỗi khi tìm kiếm: " + (kq.loi[:200] or "không rõ")

        j = kq.json() or {}
        rows = j.get("datas") or []
        tat_ca.extend(rows)
        LOG.ghi("[TRA CUU] Trang %d: nhan duoc %d hoa don (tong cong %d)." % (trang, len(rows), len(tat_ca)))
        state_cursor = j.get("state")
        if not rows or not state_cursor or len(rows) < 50:
            break

    LOG.ghi("[TRA CUU] Ket thuc khoang %s -> %s: tim duoc %d hoa don." % (tu_ngay, den_ngay, len(tat_ca)))
    if state_cursor and trang >= MAX_TRANG_TRA_CUU:
        gioi_han = MAX_TRANG_TRA_CUU * 50
        canh_bao = ("Khoảng ngày này có rất nhiều hóa đơn. Tool đã lấy tối đa %d hóa đơn cho nhóm %s. "
                    "Nếu cần đủ tuyệt đối, chia nhỏ khoảng ngày rồi tìm lại." % (gioi_han, kind))
        LOG.ghi("[TRA CUU] CANH BAO: " + canh_bao)
        return tat_ca, canh_bao
    return tat_ca, None


def tra_cuu(p):
    """Lay toan bo hoa don theo bo loc, tu dong chia nho khoang ngay va lat trang."""
    try:
        cac_khoang = _tach_khoang_theo_thang(p["tu_ngay"], p["den_ngay"])
    except Exception:
        return None, "Khoảng ngày chưa đúng."
    if not cac_khoang:
        return None, "Khoảng ngày chưa đúng."

    kind = p.get("kind", "dt")
    if len(cac_khoang) > 1:
        LOG.ghi("[TRA CUU] Khoang ngay %s -> %s duoc chia thanh %d lan goi, moi lan khong qua 1 thang."
                % (p["tu_ngay"], p["den_ngay"], len(cac_khoang)))

    tat_ca, da_co, canh_bao = [], set(), None
    for tu_ngay, den_ngay in reversed(cac_khoang):
        rows, loi = _tra_cuu_mot_khoang(p, tu_ngay, den_ngay)
        if rows is None:
            return None, loi
        if loi:
            canh_bao = loi if not canh_bao else canh_bao + " " + loi
        for hd in rows:
            khoa = _khoa_hoa_don(hd)
            if khoa in da_co:
                continue
            da_co.add(khoa)
            tat_ca.append(hd)
        if len(cac_khoang) > 1:
            time.sleep(0.15)

    LOG.ghi("[TRA CUU] Ket thuc tat ca khoang cua nhom %s: tim duoc %d hoa don." % (kind, len(tat_ca)))
    return tat_ca, canh_bao


def bo_dau(s):
    bang = {"àáạảãâầấậẩẫăằắặẳẵ": "a", "èéẹẻẽêềếệểễ": "e", "ìíịỉĩ": "i",
            "òóọỏõôồốộổỗơờớợởỡ": "o", "ùúụủũưừứựửữ": "u", "ỳýỵỷỹ": "y", "đ": "d"}
    out = []
    for ch in s:
        low = ch.lower()
        thay = None
        for nguon, dich in bang.items():
            if low in nguon:
                thay = dich.upper() if ch.isupper() else dich
                break
        out.append(thay if thay else ch)
    return "".join(out)


def ten_file(hd, direction):
    """20260816_C26TYY_00000202_CTY-4CORE.xml"""
    try:
        tdlap = (hd.get("tdlap") or "")[:10]  # 2026-08-16
        ngay = tdlap.replace("-", "") if "-" in tdlap else "00000000"
        kh = str(hd.get("khhdon") or "XX")
        so = str(hd.get("shdon") or "0").zfill(8)
        doi_tac = hd.get("nmten") if direction == "ban" else hd.get("nbten")
        ten = bo_dau(str(doi_tac or "")).upper()
        la_cong_ty = bool(re.match(r"^\s*(CONG TY|CTY|CT)\b", ten))
        # bo cac tu chi loai hinh doanh nghiep o dau ten
        for _ in range(6):
            moi = re.sub(r"^\s*(CONG TY|CTY|CT|TNHH|MTV|MOT THANH VIEN|CO PHAN|CP|"
                         r"DOANH NGHIEP TU NHAN|DNTN|TM VA DV|TM & DV|THUONG MAI VA DICH VU)\b",
                         "", ten).strip(" -&")
            if moi == ten:
                break
            ten = moi
        tu = [t for t in re.sub(r"[^A-Z0-9]+", " ", ten).split() if t]
        slug, do_dai = "", 0
        for t in tu:
            if slug and do_dai + 1 + len(t) > 22:
                break
            slug = t if not slug else slug + "-" + t
            do_dai = len(slug)
        slug = slug[:26].strip("-")
        if not slug:
            slug = "KHONG-RO"
        elif la_cong_ty:
            slug = "CTY-" + slug
        return "%s_%s_%s_%s" % (ngay, kh, so, slug)
    except Exception as e:
        LOG.loi("Khong tao duoc ten file cho mot hoa don", e)
        return "hoa-don-%d" % int(time.time() * 1000)


def tai_mot_hoa_don(hd, kind, direction, thu_muc, dinh_dang, thu_thap=None):
    """dinh_dang: danh sach ['xml'] / ['pdf'] / ['xml','pdf']
       thu_thap : neu la danh sach thi doc them du lieu de gop vao file Excel
       Tra ve: 'ok' / 'bo_qua' / 'loi'"""
    goc = ten_file(hd, direction)
    dich = {"xml": os.path.join(thu_muc, goc + ".xml"),
            "pdf": os.path.join(thu_muc, goc + ".pdf")}
    can_excel = thu_thap is not None

    # nhung dinh dang thuc su con thieu
    con_thieu = [d for d in dinh_dang
                 if not (os.path.exists(dich[d]) and os.path.getsize(dich[d]) > 0)]

    if not con_thieu:
        # da co du file roi - nhung neu can lam Excel thi van phai doc noi dung XML
        if can_excel:
            noi_dung = doc_xml_co_san(dich["xml"], goc)
            if noi_dung is not None:
                thu_thap.append(noi_dung)
                LOG.ghi("[TAI] Bo qua tai (da co san), da doc du lieu cho Excel: " + goc)
                return "bo_qua"
        else:
            LOG.ghi("[TAI] Bo qua vi da co san: " + goc)
            return "bo_qua"

    params = {
        "nbmst": hd.get("nbmst", ""),
        "khhdon": hd.get("khhdon", ""),
        "shdon": hd.get("shdon", ""),
        "khmshdon": hd.get("khmshdon", ""),
        "tdlap": (hd.get("tdlap") or "")[:10],
    }

    # ---- 1. Tai goi tin chinh (chua XML va ban in HTML) ----
    goi_tin = tai_goi_tin(params, kind, goc)

    da_luu = []
    xml_bytes = None
    if goi_tin is not None:
        try:
            xml_bytes = lay_xml(goi_tin)
        except Exception as e:
            LOG.loi("Loi khi lay file XML tu goi tin " + goc, e)

    # ---- 2. Luu file XML ----
    if "xml" in con_thieu:
        if xml_bytes:
            try:
                with open(dich["xml"], "wb") as f:
                    f.write(xml_bytes)
                LOG.ghi("[TAI] THANH CONG XML: %s.xml (%d byte)" % (goc, len(xml_bytes)))
                da_luu.append("xml")
            except Exception as e:
                LOG.loi("Loi khi luu file XML " + goc, e)
        else:
            LOG.ghi("[TAI] Goi tin tai ve khong chua file .xml: " + goc)

    # ---- 3. Luu file PDF ----
    if "pdf" in con_thieu:
        try:
            noi_dung_pdf = lay_pdf(goi_tin) if goi_tin else None

            if noi_dung_pdf is None:
                noi_dung_pdf = tai_pdf_may_chu(params, kind, goc)

            if noi_dung_pdf is None and goi_tin is not None:
                html = gop_html(goi_tin)
                if html:
                    ok, loi = in_ra_pdf(html, dich["pdf"])
                    if ok:
                        LOG.ghi("[TAI] THANH CONG PDF (in tu ban in hoa don): %s.pdf (%d byte)"
                                % (goc, os.path.getsize(dich["pdf"])))
                        da_luu.append("pdf")
                    else:
                        LOG.ghi("[TAI] Khong tao duoc PDF cho %s: %s" % (goc, loi))
                else:
                    LOG.ghi("[TAI] Goi tin tai ve khong co ban in de tao PDF: " + goc)
            elif noi_dung_pdf:
                with open(dich["pdf"], "wb") as f:
                    f.write(noi_dung_pdf)
                LOG.ghi("[TAI] THANH CONG PDF (may chu cap san): %s.pdf (%d byte)"
                        % (goc, len(noi_dung_pdf)))
                da_luu.append("pdf")
        except Exception as e:
            LOG.loi("Loi khi tao file PDF " + goc, e)

    # ---- 4. Boc tach du lieu cho file Excel ----
    if can_excel:
        noi_dung = None
        if xml_bytes:
            noi_dung = doc_xml_hoa_don(xml_bytes, goc + ".xml")
        elif os.path.exists(dich["xml"]):
            noi_dung = doc_xml_co_san(dich["xml"], goc)
        if noi_dung is not None:
            thu_thap.append(noi_dung)
        else:
            LOG.ghi("[EXCEL] Khong lay duoc du lieu de gop Excel cho: " + goc)

    if not con_thieu:
        return "bo_qua"
    if da_luu:
        thieu = [d for d in con_thieu if d not in da_luu]
        if thieu:
            LOG.ghi("[TAI] Chi lay duoc %s cho %s, thieu %s"
                    % (", ".join(da_luu), goc, ", ".join(thieu)))
        return "ok"
    LOG.ghi("[TAI] LOI: khong lay duoc file nao cho " + goc)
    return "loi"


def doc_xml_co_san(duong_xml, goc):
    """Doc lai file XML da tai truoc do de lay du lieu cho Excel."""
    try:
        if os.path.exists(duong_xml) and os.path.getsize(duong_xml) > 0:
            with open(duong_xml, "rb") as f:
                return doc_xml_hoa_don(f.read(), os.path.basename(duong_xml))
    except Exception as e:
        LOG.loi("Loi khi doc lai file XML da co " + goc, e)
    return None


def tai_goi_tin(params, kind, goc):
    """Tai goi tin .zip cua mot hoa don, tu do duong dan, thu lai toi da 3 lan."""
    ung_vien = duong_tai_ung_vien(kind)
    da_chay = SETTINGS.get("duong_tai_da_chay", {}).get(kind)
    if da_chay and da_chay in ung_vien:
        ung_vien.remove(da_chay)
        ung_vien.insert(0, da_chay)

    for lan in range(1, 4):
        for duong in ung_vien:
            url = STATE["may_chu"] + duong + "?" + urllib.parse.urlencode(params)
            kq = goi_mang(url, token=STATE["token"], timeout=90)
            if kq.ok and kq.data:
                if SETTINGS.get("duong_tai_da_chay", {}).get(kind) != duong:
                    SETTINGS.setdefault("duong_tai_da_chay", {})[kind] = duong
                    luu_thiet_lap(SETTINGS)
                    LOG.ghi("[DO TIM] Da nho duong tai dung duoc cho lan sau: " + duong)
                return kq.data
        LOG.ghi("[TAI] Lan thu %d that bai cho %s, cho 2 giay roi thu lai." % (lan, goc))
        time.sleep(2)
    LOG.ghi("[TAI] Khong tai duoc goi tin cua %s sau 3 lan thu." % goc)
    return None


def tai_pdf_may_chu(params, kind, goc):
    """Thu xin file PDF san co tu may chu (neu co duong dan nay)."""
    if SETTINGS.get("khong_co_duong_pdf"):
        return None  # lan truoc da do het roi, khong do lai cho nhanh

    ung_vien = duong_pdf_ung_vien(kind)
    da_chay = SETTINGS.get("duong_pdf_da_chay", {}).get(kind)
    if da_chay and da_chay in ung_vien:
        ung_vien.remove(da_chay)
        ung_vien.insert(0, da_chay)

    for duong in ung_vien:
        url = STATE["may_chu"] + duong + "?" + urllib.parse.urlencode(params)
        kq = goi_mang(url, token=STATE["token"], timeout=90)
        if kq.ok and kq.data:
            noi_dung = lay_pdf(kq.data)
            if noi_dung:
                if SETTINGS.get("duong_pdf_da_chay", {}).get(kind) != duong:
                    SETTINGS.setdefault("duong_pdf_da_chay", {})[kind] = duong
                    luu_thiet_lap(SETTINGS)
                    LOG.ghi("[DO TIM] Da nho duong tai PDF dung duoc cho lan sau: " + duong)
                return noi_dung

    if not SETTINGS.get("duong_pdf_da_chay"):
        SETTINGS["khong_co_duong_pdf"] = True
        luu_thiet_lap(SETTINGS)
        LOG.ghi("[DO TIM] May chu khong co duong tai PDF san. Tu gio se tu in PDF tu ban in hoa don.")
    return None


def lay_xml(du_lieu):
    """Tu goi .zip tai ve, lay ra file .xml duy nhat."""
    if du_lieu[:2] == b"PK":
        with zipfile.ZipFile(io.BytesIO(du_lieu)) as z:
            for ten in z.namelist():
                if ten.lower().endswith(".xml"):
                    return z.read(ten)
        return None
    if du_lieu.lstrip()[:5].lower().startswith(b"<?xml") or du_lieu.lstrip()[:1] == b"<":
        return du_lieu
    return None


def lay_pdf(du_lieu):
    """Neu goi tin tai ve da co san file PDF thi lay ra luon."""
    if du_lieu[:4] == b"%PDF":
        return du_lieu
    if du_lieu[:2] == b"PK":
        try:
            with zipfile.ZipFile(io.BytesIO(du_lieu)) as z:
                for ten in z.namelist():
                    if ten.lower().endswith(".pdf"):
                        return z.read(ten)
        except Exception:
            return None
    return None


# --------------------------------------------------------------------------
#  TAO PDF TU BAN IN HTML CO SAN TRONG GOI TIN
# --------------------------------------------------------------------------
DUONG_CHROME = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
]
_CHROME_DA_TIM = {"duong": None, "da_tim": False}


def tim_chrome():
    if _CHROME_DA_TIM["da_tim"]:
        return _CHROME_DA_TIM["duong"]
    _CHROME_DA_TIM["da_tim"] = True
    for d in DUONG_CHROME:
        if d and os.path.exists(d):
            _CHROME_DA_TIM["duong"] = d
            LOG.ghi("[PDF] Dung trinh duyet de in PDF: " + d)
            return d
    LOG.ghi("[PDF] KHONG tim thay Chrome/Edge tren may - khong tao duoc file PDF.")
    return None


def gop_html(du_lieu_zip):
    """Gop invoice.html + jQuery + anh thanh MOT file HTML doc lap."""
    try:
        with zipfile.ZipFile(io.BytesIO(du_lieu_zip)) as z:
            ten_html = next((n for n in z.namelist() if n.lower().endswith(".html")), None)
            if not ten_html:
                return None
            html = z.read(ten_html).decode("utf-8", "replace")

            for ten in z.namelist():
                thap = ten.lower()
                goc = os.path.basename(ten)
                if thap.endswith(".js"):
                    ma = z.read(ten).decode("utf-8", "replace")
                    html = html.replace('<script type="text/javascript" src="%s"></script>' % goc,
                                        "<script>\n" + ma + "\n</script>")
                    html = html.replace('src="%s"' % goc, 'src="%s"' % goc)  # phong truong hop khac dinh dang
                elif thap.endswith((".jpg", ".jpeg", ".png", ".gif")):
                    kieu = "png" if thap.endswith(".png") else ("gif" if thap.endswith(".gif") else "jpeg")
                    b64 = base64.b64encode(z.read(ten)).decode("ascii")
                    uri = "data:image/%s;base64,%s" % (kieu, b64)
                    for mau in ('url("%s")' % goc, "url('%s')" % goc, "url(%s)" % goc, 'src="%s"' % goc):
                        thay = mau.replace(goc, uri)
                        html = html.replace(mau, thay)
        return html.encode("utf-8")
    except Exception as e:
        LOG.loi("Loi khi gop ban in HTML", e)
        return None


def in_ra_pdf(html_bytes, dich_pdf):
    """Dung Chrome o che do nen de in ban in HTML ra file PDF."""
    chrome = tim_chrome()
    if not chrome:
        return False, "Máy chưa cài Chrome nên tool không tạo được file PDF. Cài Google Chrome rồi thử lại."

    thu_muc_tam = tempfile.mkdtemp(prefix="hoadon-")
    duong_html = os.path.join(thu_muc_tam, "ban-in.html")
    try:
        with open(duong_html, "wb") as f:
            f.write(html_bytes)
        url = "file:///" + duong_html.replace("\\", "/")

        bo_tham_so = [
            ["--headless=new", "--no-pdf-header-footer"],
            ["--headless=new"],
            ["--headless"],
        ]
        for tham_so in bo_tham_so:
            lenh = [chrome] + tham_so + [
                "--disable-gpu", "--no-sandbox", "--disable-extensions",
                "--run-all-compositor-stages-before-draw",
                "--virtual-time-budget=8000",
                "--print-to-pdf=" + dich_pdf, url,
            ]
            try:
                kq = subprocess.run(lenh, timeout=90,
                                    stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            except subprocess.TimeoutExpired:
                LOG.ghi("[PDF] Chrome in qua lau (90 giay), bo qua cach nay.")
                continue
            except Exception as e:
                LOG.loi("Loi khi goi Chrome de in PDF", e)
                continue

            if os.path.exists(dich_pdf) and os.path.getsize(dich_pdf) > 1000:
                return True, None
            loi_chrome = (kq.stderr or b"").decode("utf-8", "replace")[:500]
            LOG.ghi("[PDF] Cach in %s khong ra file. Chrome bao: %s"
                    % (" ".join(tham_so), loi_chrome or "(khong co thong bao)"))

        return False, "Chrome không in được hóa đơn ra PDF."
    except Exception as e:
        LOG.loi("Loi khi tao file PDF", e)
        return False, "Có lỗi khi tạo file PDF."
    finally:
        try:
            shutil.rmtree(thu_muc_tam, ignore_errors=True)
        except Exception:
            pass


# ==========================================================================
#  DOC DU LIEU TU FILE XML HOA DON
# ==========================================================================
TEN_TCHAT = {"1": "Hàng hóa, dịch vụ", "2": "Khuyến mại",
             "3": "Chiết khấu thương mại", "4": "Ghi chú / diễn giải"}


def _chu(e, ten, mac_dinh=""):
    if e is None:
        return mac_dinh
    con = e.find(ten)
    if con is None or con.text is None:
        return mac_dinh
    return con.text.strip()


def _so(e, ten):
    txt = _chu(e, ten, "")
    if not txt:
        return 0
    try:
        return float(txt.replace(",", ""))
    except Exception:
        return 0


def doc_xml_hoa_don(xml_bytes, ten_file_xml=""):
    """Boc tach thong tin quan trong trong mot file XML hoa don."""
    try:
        goc = ET.fromstring(xml_bytes)
    except Exception as e:
        LOG.loi("Khong doc duoc file XML " + ten_file_xml, e)
        return None

    try:
        chung = goc.find(".//DLHDon/TTChung")
        nban = goc.find(".//NDHDon/NBan")
        nmua = goc.find(".//NDHDon/NMua")
        ttoan = goc.find(".//NDHDon/TToan")

        hd = {
            "mau_so": _chu(chung, "KHMSHDon"),
            "ky_hieu": _chu(chung, "KHHDon"),
            "so_hd": _chu(chung, "SHDon"),
            "ngay_lap": _chu(chung, "NLap"),
            "loai_hd": _chu(chung, "THDon"),
            "hinh_thuc_tt": _chu(chung, "HTTToan"),
            "don_vi_tien": _chu(chung, "DVTTe", "VND"),
            "ty_gia": _so(chung, "TGia") or 1,
            "nban_mst": _chu(nban, "MST"),
            "nban_ten": _chu(nban, "Ten"),
            "nban_dchi": _chu(nban, "DChi"),
            "nmua_mst": _chu(nmua, "MST"),
            "nmua_ten": _chu(nmua, "Ten"),
            "nmua_dchi": _chu(nmua, "DChi"),
            "nmua_nguoi": _chu(nmua, "HVTNMHang"),
            "chua_thue": _so(ttoan, "TgTCThue"),
            "tien_thue": _so(ttoan, "TgTThue"),
            "chiet_khau": _so(ttoan, "TTCKTMai"),
            "thanh_toan": _so(ttoan, "TgTTTBSo"),
            "bang_chu": _chu(ttoan, "TgTTTBChu"),
            "mccqt": _chu(goc, "MCCQT"),
            "ten_file": ten_file_xml,
            "hang_hoa": [],
            "thue_suat": [],
        }

        for hh in goc.iter("HHDVu"):
            hd["hang_hoa"].append({
                "stt": _chu(hh, "STT"),
                "tinh_chat": TEN_TCHAT.get(_chu(hh, "TChat"), _chu(hh, "TChat")),
                "ma_hang": _chu(hh, "MHHDVu"),
                "ten_hang": _chu(hh, "THHDVu"),
                "dvt": _chu(hh, "DVTinh"),
                "so_luong": _so(hh, "SLuong"),
                "don_gia": _so(hh, "DGia"),
                "chiet_khau": _so(hh, "STCKhau"),
                "thanh_tien": _so(hh, "ThTien"),
                "thue_suat": _chu(hh, "TSuat"),
            })

        for ls in goc.iter("LTSuat"):
            hd["thue_suat"].append({
                "thue_suat": _chu(ls, "TSuat"),
                "chua_thue": _so(ls, "ThTien"),
                "tien_thue": _so(ls, "TThue"),
            })

        return hd
    except Exception as e:
        LOG.loi("Loi khi boc tach du lieu tu XML " + ten_file_xml, e)
        return None


# ==========================================================================
#  GHI FILE EXCEL (.xlsx) - khong can cai them thu vien
# ==========================================================================
def _thoat(s):
    return (str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            .replace('"', "&quot;"))


def _o_excel(cot, dong, gia_tri, kieu):
    """kieu: 'chu' / 'so' / 'tieu_de'"""
    vi_tri = ""
    n = cot
    while n > 0:
        n, du = divmod(n - 1, 26)
        vi_tri = chr(65 + du) + vi_tri
    vi_tri += str(dong)

    if kieu == "tieu_de":
        return '<c r="%s" s="1" t="inlineStr"><is><t xml:space="preserve">%s</t></is></c>' % (
            vi_tri, _thoat(gia_tri))
    if kieu in ("so", "so4"):
        try:
            gt = float(gia_tri)
            chuoi = str(int(gt)) if gt == int(gt) else repr(gt)
            return '<c r="%s" s="%d"><v>%s</v></c>' % (vi_tri, 3 if kieu == "so" else 4, chuoi)
        except Exception:
            return '<c r="%s" s="2" t="inlineStr"><is><t/></is></c>' % vi_tri
    return '<c r="%s" s="2" t="inlineStr"><is><t xml:space="preserve">%s</t></is></c>' % (
        vi_tri, _thoat(gia_tri))


def viet_xlsx(duong, cac_bang):
    """cac_bang: danh sach (ten_sheet, tieu_de[], kieu_cot[], do_rong[], cac_dong[])"""
    STYLES = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="2"><numFmt numFmtId="164" formatCode="#,##0"/><numFmt numFmtId="165" formatCode="#,##0.####"/></numFmts>
<fonts count="2">
<font><sz val="11"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
</fonts>
<fills count="3">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF1D5FD6"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="2">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left style="thin"><color rgb="FFD0D7E5"/></left><right style="thin"><color rgb="FFD0D7E5"/></right><top style="thin"><color rgb="FFD0D7E5"/></top><bottom style="thin"><color rgb="FFD0D7E5"/></bottom><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="5">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="top"/></xf>
<xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="top"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>"""

    sheets_xml = []
    for ten, tieu_de, kieu_cot, do_rong, cac_dong in cac_bang:
        cols = "".join('<col min="%d" max="%d" width="%d" customWidth="1"/>' % (i + 1, i + 1, w)
                       for i, w in enumerate(do_rong))
        rows = ['<row r="1" ht="30" customHeight="1">' +
                "".join(_o_excel(i + 1, 1, t, "tieu_de") for i, t in enumerate(tieu_de)) +
                "</row>"]
        for so_dong, dong in enumerate(cac_dong, start=2):
            o = "".join(_o_excel(i + 1, so_dong, gt, kieu_cot[i] if i < len(kieu_cot) else "chu")
                        for i, gt in enumerate(dong))
            rows.append('<row r="%d">%s</row>' % (so_dong, o))

        cuoi = len(tieu_de)
        chu_cuoi, n = "", cuoi
        while n > 0:
            n, du = divmod(n - 1, 26)
            chu_cuoi = chr(65 + du) + chu_cuoi

        sheets_xml.append("""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<cols>%s</cols>
<sheetData>%s</sheetData>
<autoFilter ref="A1:%s1"/>
</worksheet>""" % (cols, "".join(rows), chu_cuoi))

    ten_sheets = "".join(
        '<sheet name="%s" sheetId="%d" r:id="rId%d"/>' % (_thoat(b[0]), i + 1, i + 1)
        for i, b in enumerate(cac_bang))
    rels = "".join(
        '<Relationship Id="rId%d" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet%d.xml"/>'
        % (i + 1, i + 1) for i in range(len(cac_bang)))
    n = len(cac_bang)

    with zipfile.ZipFile(duong, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
%s
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>""" % "".join(
            '<Override PartName="/xl/worksheets/sheet%d.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' % (i + 1)
            for i in range(n)))
        z.writestr("_rels/.rels", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>""")
        z.writestr("xl/workbook.xml", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>%s</sheets></workbook>""" % ten_sheets)
        z.writestr("xl/_rels/workbook.xml.rels", """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
%s<Relationship Id="rId%d" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>""" % (rels, n + 1))
        z.writestr("xl/styles.xml", STYLES)
        for i, sx in enumerate(sheets_xml):
            z.writestr("xl/worksheets/sheet%d.xml" % (i + 1), sx)


def xuat_excel(danh_sach_hd, thu_muc):
    """Gop danh muc tat ca hoa don thanh MOT file Excel 3 sheet."""
    if not danh_sach_hd:
        return None, "Không có hóa đơn nào để gộp vào file Excel."

    # ---- Sheet 1: bang ke hoa don, moi hoa don mot dong ----
    tieu_de_1 = ["STT", "Mẫu số", "Ký hiệu", "Số hóa đơn", "Ngày lập", "Loại hóa đơn",
                 "MST người bán", "Tên người bán", "Địa chỉ người bán",
                 "MST người mua", "Tên người mua", "Địa chỉ người mua",
                 "Hình thức TT", "Tiền tệ", "Tổng chưa thuế", "Tiền thuế",
                 "Chiết khấu", "Tổng thanh toán", "Mã CQT", "Tên file"]
    kieu_1 = ["so", "chu", "chu", "chu", "chu", "chu", "chu", "chu", "chu", "chu",
              "chu", "chu", "chu", "chu", "so", "so", "so", "so", "chu", "chu"]
    rong_1 = [5, 7, 10, 12, 11, 22, 15, 34, 34, 15, 34, 34, 12, 8, 15, 13, 12, 15, 34, 38]
    dong_1 = []
    for i, h in enumerate(danh_sach_hd, 1):
        dong_1.append([i, h["mau_so"], h["ky_hieu"], h["so_hd"], h["ngay_lap"], h["loai_hd"],
                       h["nban_mst"], h["nban_ten"], h["nban_dchi"],
                       h["nmua_mst"], h["nmua_ten"], h["nmua_dchi"],
                       h["hinh_thuc_tt"], h["don_vi_tien"], h["chua_thue"], h["tien_thue"],
                       h["chiet_khau"], h["thanh_toan"], h["mccqt"], h["ten_file"]])

    # ---- Sheet 2: chi tiet tung mat hang ----
    tieu_de_2 = ["STT", "Ký hiệu", "Số hóa đơn", "Ngày lập", "MST người bán", "Tên người bán",
                 "MST người mua", "Tên người mua", "Dòng", "Tính chất", "Mã hàng",
                 "Tên hàng hóa, dịch vụ", "ĐVT", "Số lượng", "Đơn giá",
                 "Chiết khấu", "Thành tiền", "Thuế suất"]
    kieu_2 = ["so", "chu", "chu", "chu", "chu", "chu", "chu", "chu", "chu", "chu",
              "chu", "chu", "chu", "so4", "so4", "so", "so", "chu"]
    rong_2 = [5, 10, 12, 11, 15, 30, 15, 30, 6, 20, 12, 42, 8, 10, 14, 12, 15, 9]
    dong_2, stt = [], 0
    for h in danh_sach_hd:
        for hh in h["hang_hoa"]:
            stt += 1
            dong_2.append([stt, h["ky_hieu"], h["so_hd"], h["ngay_lap"],
                           h["nban_mst"], h["nban_ten"], h["nmua_mst"], h["nmua_ten"],
                           hh["stt"], hh["tinh_chat"], hh["ma_hang"], hh["ten_hang"],
                           hh["dvt"], hh["so_luong"], hh["don_gia"], hh["chiet_khau"],
                           hh["thanh_tien"], hh["thue_suat"]])

    # ---- Sheet 3: tong hop theo thue suat ----
    gom = {}
    for h in danh_sach_hd:
        muc = h["thue_suat"] or [{"thue_suat": "Không rõ",
                                  "chua_thue": h["chua_thue"], "tien_thue": h["tien_thue"]}]
        for m in muc:
            k = m["thue_suat"] or "Không rõ"
            g = gom.setdefault(k, {"so_hd": 0, "chua_thue": 0.0, "tien_thue": 0.0})
            g["so_hd"] += 1
            g["chua_thue"] += m["chua_thue"]
            g["tien_thue"] += m["tien_thue"]

    tieu_de_3 = ["Thuế suất", "Số dòng hóa đơn", "Tiền chưa thuế", "Tiền thuế", "Tổng cộng"]
    kieu_3 = ["chu", "so", "so", "so", "so"]
    rong_3 = [14, 16, 18, 18, 18]
    dong_3 = []
    for k in sorted(gom.keys()):
        g = gom[k]
        dong_3.append([k, g["so_hd"], g["chua_thue"], g["tien_thue"],
                       g["chua_thue"] + g["tien_thue"]])
    dong_3.append(["TỔNG CỘNG", sum(g["so_hd"] for g in gom.values()),
                   sum(g["chua_thue"] for g in gom.values()),
                   sum(g["tien_thue"] for g in gom.values()),
                   sum(g["chua_thue"] + g["tien_thue"] for g in gom.values())])

    ten = "Bang-ke-hoa-don_%s.xlsx" % datetime.now().strftime("%Y%m%d-%H%M%S")
    duong = os.path.join(thu_muc, ten)
    lan = 2
    while os.path.exists(duong):
        ten = "Bang-ke-hoa-don_%s_%d.xlsx" % (datetime.now().strftime("%Y%m%d-%H%M%S"), lan)
        duong = os.path.join(thu_muc, ten)
        lan += 1
    try:
        viet_xlsx(duong, [
            ("Bảng kê hóa đơn", tieu_de_1, kieu_1, rong_1, dong_1),
            ("Chi tiết hàng hóa", tieu_de_2, kieu_2, rong_2, dong_2),
            ("Tổng hợp theo thuế suất", tieu_de_3, kieu_3, rong_3, dong_3),
        ])
        LOG.ghi("[EXCEL] Da tao file: %s (%d hoa don, %d dong hang hoa, %d muc thue suat)"
                % (ten, len(dong_1), len(dong_2), len(dong_3) - 1))
        return ten, None
    except Exception as e:
        LOG.loi("Loi khi tao file Excel", e)
        return None, "Không tạo được file Excel. Xem chi tiết trong file nhật ký."


def chay_tai(danh_sach, kind, direction, thu_muc, dinh_dang, lam_excel=False):
    with STATE_LOCK:
        t = STATE["tai"]
        t.update({"dang_chay": True, "dung": False, "tong": len(danh_sach),
                  "xong": 0, "ok": 0, "bo_qua": 0, "loi": 0,
                  "hien_tai": "", "ket_thuc": ""})

    nhan = " + ".join([d.upper() for d in dinh_dang] + (["EXCEL"] if lam_excel else []))
    LOG.ghi("[TAI] ===== Bat dau xu ly %d hoa don (%s) vao: %s"
            % (len(danh_sach), nhan or "chi gop Excel", thu_muc))
    if "pdf" in dinh_dang:
        tim_chrome()

    thu_thap = [] if lam_excel else None

    for hd in danh_sach:
        if STATE["tai"]["dung"]:
            break
        goc = ten_file(hd, direction)
        with STATE_LOCK:
            STATE["tai"]["hien_tai"] = goc
        try:
            kq = tai_mot_hoa_don(hd, kind, direction, thu_muc, dinh_dang, thu_thap)
        except Exception as e:
            LOG.loi("Loi khong luong truoc khi tai " + goc, e)
            kq = "loi"
        with STATE_LOCK:
            STATE["tai"]["xong"] += 1
            STATE["tai"][kq] += 1

    # ---- Gop danh muc thanh file Excel ----
    ten_excel, loi_excel = None, None
    if lam_excel and thu_thap:
        with STATE_LOCK:
            STATE["tai"]["hien_tai"] = "Đang gộp danh mục vào file Excel…"
        ten_excel, loi_excel = xuat_excel(thu_thap, thu_muc)
    elif lam_excel:
        loi_excel = "Không đọc được dữ liệu hóa đơn nào để gộp vào Excel."
        LOG.ghi("[EXCEL] " + loi_excel)

    t = STATE["tai"]
    if t["dung"]:
        ket = "Đã dừng. Xử lý xong %d hóa đơn, còn %d hóa đơn chưa tải." % (t["ok"], t["tong"] - t["xong"])
    elif dinh_dang:
        ket = "Xong. Đã tải %d hóa đơn (%s) vào %s" % (t["ok"], " + ".join(d.upper() for d in dinh_dang), thu_muc)
    else:
        ket = "Xong. Đã đọc %d hóa đơn." % t["xong"]
    if ten_excel:
        ket += " — File Excel: " + ten_excel
    elif loi_excel:
        ket += " — " + loi_excel

    LOG.ghi("[TAI] ===== Ket thuc: thanh cong %d | bo qua %d | loi %d" % (t["ok"], t["bo_qua"], t["loi"]))
    with STATE_LOCK:
        STATE["tai"]["dang_chay"] = False
        STATE["tai"]["ket_thuc"] = ket
        STATE["tai"]["hien_tai"] = ""


# ==========================================================================
#  MAY CHU NOI BO - phuc vu giao dien trong Chrome
# ==========================================================================
class Handler(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass  # khong in ra man hinh den

    def _tra(self, doi_tuong, ma=200):
        try:
            raw = json.dumps(doi_tuong, ensure_ascii=False).encode("utf-8")
            self.send_response(ma)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(raw)))
            self.end_headers()
            self.wfile.write(raw)
        except Exception as e:
            LOG.loi("Khong tra duoc du lieu ve giao dien", e)

    def do_GET(self):
        try:
            duong = urllib.parse.urlparse(self.path).path
            if duong in ("/", "/index.html"):
                raw = GIAO_DIEN.encode("utf-8")
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(raw)))
                self.end_headers()
                self.wfile.write(raw)
                return

            if duong == "/api/thiet-lap":
                self._tra({
                    "thu_muc_luu": SETTINGS.get("thu_muc_luu", ""),
                    "mst": SETTINGS.get("mst", ""),
                    "mat_khau": hien(SETTINGS.get("mat_khau_ma_hoa", "")) if SETTINGS.get("nho_dang_nhap") else "",
                    "nho_dang_nhap": SETTINGS.get("nho_dang_nhap", True),
                    "dinh_dang": SETTINGS.get("dinh_dang", ["xml"]),
                    "co_chrome": bool(tim_chrome()),
                    "duong_nhat_ky": LOG_PATH,
                    "phien_ban": APP_VERSION,
                })
                return

            if duong == "/api/captcha":
                anh, loi = lay_captcha()
                self._tra({"ok": loi is None, "anh": anh, "loi": loi})
                return

            if duong == "/api/tien-trinh":
                with STATE_LOCK:
                    self._tra(dict(STATE["tai"]))
                return

            if duong == "/api/chon-thu-muc":
                tra_loi = queue.Queue()
                HOP_THU_CHON_THU_MUC.put(tra_loi)
                try:
                    thu_muc = tra_loi.get(timeout=300)
                except Exception:
                    thu_muc = ""
                if thu_muc:
                    SETTINGS["thu_muc_luu"] = thu_muc
                    luu_thiet_lap(SETTINGS)
                    LOG.ghi("[THIET LAP] Thu muc luu moi: " + thu_muc)
                self._tra({"ok": bool(thu_muc), "thu_muc": thu_muc})
                return

            if duong == "/api/mo-nhat-ky":
                try:
                    if platform.system() == "Windows":
                        os.startfile(LOG_PATH)
                    elif platform.system() == "Darwin":
                        os.system('open "%s"' % LOG_PATH)
                    else:
                        os.system('xdg-open "%s"' % LOG_PATH)
                    self._tra({"ok": True})
                except Exception as e:
                    LOG.loi("Khong mo duoc file nhat ky", e)
                    self._tra({"ok": False, "loi": "Không mở được file nhật ký. Bạn mở thủ công tại: " + LOG_PATH})
                return

            self._tra({"loi": "Không có đường dẫn này."}, 404)
        except Exception as e:
            LOG.loi("Loi khi xu ly yeu cau GET " + str(self.path), e)
            self._tra({"ok": False, "loi": "Tool gặp lỗi bên trong. Xem chi tiết trong file nhật ký."}, 500)

    def do_POST(self):
        try:
            duong = urllib.parse.urlparse(self.path).path
            do_dai = int(self.headers.get("Content-Length") or 0)
            p = json.loads(self.rfile.read(do_dai).decode("utf-8")) if do_dai else {}

            if duong == "/api/dang-nhap":
                ok, loi = dang_nhap(p.get("mst", "").strip(),
                                    p.get("mat_khau", ""),
                                    p.get("captcha", "").strip())
                if ok:
                    SETTINGS["mst"] = p.get("mst", "").strip()
                    SETTINGS["nho_dang_nhap"] = bool(p.get("nho", True))
                    SETTINGS["mat_khau_ma_hoa"] = giau(p.get("mat_khau", "")) if p.get("nho", True) else ""
                    luu_thiet_lap(SETTINGS)
                self._tra({"ok": ok, "loi": loi, "mst": p.get("mst", "").strip()})
                return

            if duong == "/api/tra-cuu":
                if not STATE["token"]:
                    self._tra({"ok": False, "loi": "Bạn cần đăng nhập trước khi tìm kiếm."})
                    return
                loai = p.get("loai")
                if loai is None:
                    loai = ["dt", "mtt"]
                loai = [k for k in ("dt", "mtt") if k in loai]
                if not loai:
                    self._tra({"ok": False, "loi": "Chưa chọn loại hóa đơn cần tra cứu. Tick vào “Hóa đơn điện tử” hoặc “Hóa đơn có mã khởi tạo từ máy tính tiền” ở Bước 3."})
                    return
                LOG.ghi("[TRA CUU] Loai hoa don duoc chon: " + ", ".join(loai))
                ket_qua = {"dt": [], "mtt": []}
                loi_cuoi = None
                for kind in loai:
                    p2 = dict(p); p2["kind"] = kind
                    rows, loi = tra_cuu(p2)
                    if loi:
                        loi_cuoi = loi
                        LOG.ghi("[TRA CUU] Nhom %s bao loi: %s" % (kind, loi))
                    else:
                        ket_qua[kind] = rows
                with STATE_LOCK:
                    STATE["ket_qua"] = ket_qua
                if not ket_qua["dt"] and not ket_qua["mtt"] and loi_cuoi:
                    self._tra({"ok": False, "loi": loi_cuoi})
                    return
                self._tra({"ok": True,
                           "dt": [gon(h, p.get("direction", "ban")) for h in ket_qua["dt"]],
                           "mtt": [gon(h, p.get("direction", "ban")) for h in ket_qua["mtt"]],
                           "canh_bao": loi_cuoi})
                return

            if duong == "/api/tai":
                if STATE["tai"]["dang_chay"]:
                    self._tra({"ok": False, "loi": "Tool đang tải dở. Đợi tải xong hoặc bấm Dừng lại."})
                    return
                thu_muc = SETTINGS.get("thu_muc_luu", "")
                if not thu_muc or not os.path.isdir(thu_muc):
                    self._tra({"ok": False, "loi": "Chưa chọn thư mục lưu, hoặc thư mục đã bị xóa. Bấm “Chọn thư mục lưu” rồi thử lại."})
                    return
                dinh_dang = p.get("dinh_dang")
                if dinh_dang is None:
                    dinh_dang = ["xml"]
                lam_excel = "excel" in dinh_dang
                dinh_dang = [d for d in ("xml", "pdf") if d in dinh_dang]
                if not dinh_dang and not lam_excel:
                    self._tra({"ok": False, "loi": "Chưa chọn việc cần làm. Tick vào “File XML”, “File PDF” hoặc “Gộp danh mục và tải file Excel” rồi thử lại."})
                    return
                if "pdf" in dinh_dang and not tim_chrome():
                    self._tra({"ok": False, "loi": "Máy chưa cài Google Chrome nên tool không tạo được file PDF. Cài Chrome rồi thử lại, hoặc bỏ tick “File PDF” để chỉ tải XML."})
                    return
                SETTINGS["dinh_dang"] = dinh_dang + (["excel"] if lam_excel else [])
                luu_thiet_lap(SETTINGS)
                kind = p.get("kind", "dt")
                direction = p.get("direction", "ban")
                chi_so = p.get("chi_so", [])
                nguon = STATE["ket_qua"].get(kind, [])
                danh_sach = [nguon[i] for i in chi_so if 0 <= i < len(nguon)]
                if not danh_sach:
                    self._tra({"ok": False, "loi": "Chưa chọn hóa đơn nào để tải."})
                    return
                threading.Thread(target=chay_tai,
                                 args=(danh_sach, kind, direction, thu_muc, dinh_dang, lam_excel),
                                 daemon=True).start()
                self._tra({"ok": True, "tong": len(danh_sach)})
                return

            if duong == "/api/dung":
                with STATE_LOCK:
                    STATE["tai"]["dung"] = True
                LOG.ghi("[TAI] Nguoi dung bam Dung lai.")
                self._tra({"ok": True})
                return

            self._tra({"loi": "Không có đường dẫn này."}, 404)
        except Exception as e:
            LOG.loi("Loi khi xu ly yeu cau POST " + str(self.path), e)
            self._tra({"ok": False, "loi": "Tool gặp lỗi bên trong. Xem chi tiết trong file nhật ký."}, 500)


def gon(hd, direction):
    """Rut gon mot hoa don de gui ra giao dien."""
    try:
        tdlap = (hd.get("tdlap") or "")[:10]
        ngay = "/".join(reversed(tdlap.split("-"))) if "-" in tdlap else tdlap
        return {
            "mst": hd.get("nbmst", ""),
            "mau": str(hd.get("khmshdon", "")),
            "kh": hd.get("khhdon", ""),
            "so": str(hd.get("shdon", "")),
            "ngay": ngay,
            "ten": (hd.get("nmten") if direction == "ban" else hd.get("nbten")) or "",
            "file": ten_file(hd, direction),
            "base": hd.get("tgtcthue") or 0,
            "vat": hd.get("tgtthue") or 0,
            "total": hd.get("tgtttbso") or 0,
            "trang_thai": TEN_TTXLY.get(str(hd.get("ttxly")), "Không rõ"),
        }
    except Exception as e:
        LOG.loi("Loi khi rut gon mot hoa don", e)
        return {"mst": "", "mau": "", "kh": "", "so": "", "ngay": "", "ten": "(lỗi đọc dữ liệu)",
                "file": "", "base": 0, "vat": 0, "total": 0, "trang_thai": ""}


TEN_TTXLY = {
    "0": "Cục Thuế đã nhận", "1": "Đang kiểm tra điều kiện cấp mã",
    "2": "CQT từ chối", "3": "Đủ điều kiện cấp mã",
    "4": "Không đủ điều kiện cấp mã", "5": "Đã cấp mã hóa đơn",
    "6": "Cục Thuế đã nhận không mã", "7": "Đã kiểm tra định kỳ",
    "8": "Đã nhận HĐ máy tính tiền",
}


# ==========================================================================
#  GIAO DIEN (giong het ban artifact da duyet)
# ==========================================================================
GIAO_DIEN = r"""<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tải hóa đơn hàng loạt</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#F2F5FA; --surface:#FFFFFF; --ink:#0E1B33; --ink-soft:#5B6B85;
  --line:#E1E7F0; --line-strong:#CBD6E6; --blue:#1D5FD6; --blue-deep:#12408F;
  --blue-tint:#EAF1FE; --green:#0F7A57; --green-tint:#E6F5EF;
  --amber:#9C6100; --amber-tint:#FDF2DE; --red:#C0392B; --red-tint:#FCEDEB;
  --radius:12px; --radius-sm:8px;
  --shadow:0 1px 2px rgba(14,27,51,.05), 0 8px 24px -12px rgba(14,27,51,.18);
  --mono:'JetBrains Mono', ui-monospace, monospace;
}
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{background:var(--bg);color:var(--ink);font-family:'Be Vietnam Pro',system-ui,'Segoe UI',sans-serif;font-size:14px;line-height:1.55;-webkit-font-smoothing:antialiased}
button,input,select{font-family:inherit;font-size:inherit;color:inherit}
:focus-visible{outline:2px solid var(--blue);outline-offset:2px;border-radius:4px}
.wrap{max-width:1280px;margin:0 auto;padding:0 20px 64px}
.topbar{position:sticky;top:0;z-index:40;background:rgba(255,255,255,.92);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.topbar-in{max-width:1280px;margin:0 auto;padding:12px 20px;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.brand{display:flex;align-items:center;gap:11px;margin-right:auto}
.mark{width:34px;height:34px;border-radius:9px;flex:none;background:var(--blue);color:#fff;display:grid;place-items:center;font-weight:800;font-size:15px;letter-spacing:-.5px}
.brand h1{margin:0;font-size:16px;font-weight:700;letter-spacing:-.2px}
.brand p{margin:0;font-size:12px;color:var(--ink-soft)}
.chip{display:inline-flex;align-items:center;gap:7px;padding:6px 12px;border-radius:999px;font-size:12.5px;font-weight:600;border:1px solid var(--line-strong);background:#fff;color:var(--ink-soft)}
.chip .dot{width:8px;height:8px;border-radius:50%;background:var(--line-strong);flex:none}
.chip.on{background:var(--green-tint);border-color:#B9E3D2;color:var(--green)}
.chip.on .dot{background:var(--green)}
.card{background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow);margin-top:18px}
.card-head{padding:14px 18px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.card-head h2{margin:0;font-size:14.5px;font-weight:700;letter-spacing:-.1px}
.card-body{padding:18px}
.eyebrow{font-size:11px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--blue);font-family:var(--mono)}
.grid{display:grid;gap:14px 22px}
.g3{grid-template-columns:repeat(3,minmax(0,1fr))}
.field{display:flex;flex-direction:column;gap:6px;min-width:0}
label{font-size:12.5px;font-weight:600;color:var(--ink-soft)}
label .req{color:var(--red);font-weight:700}
input[type=text],input[type=password],input[type=date],select{width:100%;padding:9px 11px;border:1px solid var(--line-strong);border-radius:var(--radius-sm);background:#fff;transition:border-color .15s,box-shadow .15s}
input:hover,select:hover{border-color:#A9BCD8}
input:focus,select:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 3px var(--blue-tint)}
select{appearance:none;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%235B6B85' stroke-width='2.5' stroke-linecap='round'><path d='M6 9l6 6 6-6'/></svg>");background-repeat:no-repeat;background-position:right 10px center;padding-right:32px;cursor:pointer}
.password-wrap{position:relative}
.password-wrap input{padding-right:58px}
.toggle-pass{position:absolute;right:7px;top:50%;transform:translateY(-50%);border:none;background:transparent;color:var(--blue);font-size:12.5px;font-weight:700;cursor:pointer;padding:5px 6px;border-radius:6px}
.toggle-pass:hover{background:var(--blue-tint)}
.daterow{display:flex;align-items:center;gap:8px}
.daterow span{font-size:12.5px;color:var(--ink-soft);white-space:nowrap}
.range-tools{display:flex;gap:6px;flex-wrap:wrap}
.range-btn{border:1px solid var(--line-strong);background:#fff;color:var(--ink-soft);border-radius:7px;padding:6px 9px;font-size:12px;font-weight:600;cursor:pointer}
.range-btn:hover{background:var(--bg);color:var(--ink)}
.range-btn.active{background:var(--blue-tint);border-color:#9EBDF2;color:var(--blue)}
.check{display:flex;align-items:center;gap:9px;font-size:13.5px;cursor:pointer;user-select:none}
input[type=checkbox]{width:17px;height:17px;accent-color:var(--blue);cursor:pointer;margin:0;flex:none}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:10px 18px;border-radius:var(--radius-sm);border:1px solid transparent;font-weight:600;cursor:pointer;transition:background .15s,border-color .15s,transform .05s;background:#fff}
.btn:active{transform:translateY(1px)}
.btn:disabled{opacity:.45;cursor:not-allowed;transform:none}
.btn-primary{background:var(--blue);color:#fff}
.btn-primary:hover:not(:disabled){background:var(--blue-deep)}
.btn-ghost{border-color:var(--line-strong);color:var(--ink)}
.btn-ghost:hover:not(:disabled){background:var(--bg);border-color:#A9BCD8}
.btn-lg{padding:13px 26px;font-size:15px;border-radius:10px}
.btn-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.tabs{display:flex;gap:6px;padding:5px;background:var(--bg);border-radius:10px;flex-wrap:wrap}
.tab{padding:9px 18px;border-radius:7px;border:none;background:transparent;font-weight:600;color:var(--ink-soft);cursor:pointer;white-space:nowrap}
.tab:hover{color:var(--ink)}
.tab[aria-selected=true]{background:#fff;color:var(--blue);box-shadow:0 1px 3px rgba(14,27,51,.12)}
.subtabs{display:flex;gap:22px;border-bottom:1px solid var(--line);padding:0 18px;flex-wrap:wrap;align-items:center}
.subtab-item{display:flex;align-items:center;gap:9px}
.subtab{padding:12px 2px;border:none;background:none;cursor:pointer;font-weight:600;color:var(--ink-soft);border-bottom:2px solid transparent;margin-bottom:-1px}
.subtab:hover{color:var(--ink)}
.subtab[aria-selected=true]{color:var(--blue);border-bottom-color:var(--blue)}
.subtab:disabled{opacity:.4;cursor:not-allowed;color:var(--ink-soft);border-bottom-color:transparent}
.loai-note{margin-left:auto;font-size:12px;color:var(--ink-soft);padding:12px 0}
.subtab .count{font-family:var(--mono);font-size:11.5px;margin-left:6px;padding:1px 7px;border-radius:999px;background:var(--bg);color:var(--ink-soft)}
.subtab[aria-selected=true] .count{background:var(--blue-tint);color:var(--blue)}
.tablewrap{max-height:430px;overflow:auto;border-top:1px solid var(--line)}
table{width:100%;border-collapse:collapse;font-size:13px}
thead th{position:sticky;top:0;z-index:2;background:#F7F9FD;padding:11px 12px;text-align:left;font-size:11.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--ink-soft);border-bottom:1px solid var(--line-strong);white-space:nowrap}
tbody td{padding:11px 12px;border-bottom:1px solid var(--line);vertical-align:top}
tbody tr:hover{background:#FAFCFF}
tbody tr.picked{background:var(--blue-tint)}
tbody tr.picked:hover{background:#DEEAFD}
.num{font-family:var(--mono);text-align:right;white-space:nowrap;font-size:12.5px}
.mono{font-family:var(--mono);font-size:12.5px;white-space:nowrap}
.seller{font-weight:600;display:block}
.seller-mst{font-size:12px;color:var(--ink-soft);font-family:var(--mono)}
.tag{display:inline-block;padding:3px 9px;border-radius:6px;font-size:11.5px;font-weight:600;white-space:nowrap;background:var(--green-tint);color:var(--green)}
.col-check{width:44px}
.empty{padding:56px 20px;text-align:center;color:var(--ink-soft)}
.empty strong{display:block;color:var(--ink);font-size:15px;margin-bottom:5px}
.toolbar{padding:12px 18px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;background:#FAFCFF;border-bottom:1px solid var(--line)}
.selected-count{font-size:13px;color:var(--ink-soft)}
.selected-count b{color:var(--blue);font-family:var(--mono);font-size:14px}
.linkbtn{background:none;border:none;color:var(--blue);font-weight:600;cursor:pointer;padding:4px 2px}
.linkbtn:hover{text-decoration:underline}
.folder{display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px dashed var(--line-strong);border-radius:var(--radius-sm);background:#FAFCFF;flex-wrap:wrap}
.dinh-dang{display:flex;align-items:center;gap:22px;flex-wrap:wrap;padding:12px 14px;background:var(--blue-tint);border-radius:var(--radius-sm)}
.dd-label{font-size:12.5px;font-weight:700;color:var(--blue-deep);text-transform:uppercase;letter-spacing:.05em;font-family:var(--mono)}
.dd-hint{color:var(--ink-soft);font-weight:400;font-size:12.5px}
.dd-note{margin-left:auto;font-size:12px;color:var(--amber);font-weight:600}
.folder .path{font-family:var(--mono);font-size:12.5px;color:var(--ink-soft);word-break:break-all;flex:1;min-width:180px}
.folder .path.set{color:var(--ink)}
.progress-block{margin-top:18px;display:none}
.progress-block.show{display:block}
.progress-top{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:9px;flex-wrap:wrap}
.progress-figure{font-family:var(--mono);font-size:26px;font-weight:700;letter-spacing:-1px;line-height:1}
.progress-figure .of{color:var(--ink-soft);font-weight:400;font-size:17px}
.progress-pct{font-family:var(--mono);font-size:14px;font-weight:700;color:var(--blue)}
.rail{height:12px;border-radius:999px;background:var(--bg);overflow:hidden;border:1px solid var(--line)}
.rail-fill{height:100%;width:0%;border-radius:999px;transition:width .28s ease;background-image:linear-gradient(90deg,var(--blue) 0%,#3E86F0 100%)}
.progress-meta{display:flex;gap:18px;flex-wrap:wrap;margin-top:10px;font-size:12.5px;color:var(--ink-soft)}
.progress-meta b{font-family:var(--mono)}
.progress-meta .ok b{color:var(--green)}
.progress-meta .skip b{color:var(--amber)}
.progress-meta .err b{color:var(--red)}
.current-file{margin-top:10px;font-family:var(--mono);font-size:12px;color:var(--ink-soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.note{margin-top:16px;padding:13px 15px;background:var(--blue-tint);border-radius:var(--radius-sm);font-size:12.5px;color:var(--blue-deep)}
.note ul{margin:7px 0 0;padding-left:18px}
.note li{margin:3px 0}
#captchaBox{width:118px;height:44px;border:1px solid var(--line-strong);border-radius:8px;display:grid;place-items:center;background:#fff;flex:none;cursor:pointer;overflow:hidden}
#captchaBox svg{max-width:100%;max-height:100%}
.overlay{position:fixed;inset:0;background:rgba(14,27,51,.45);display:none;place-items:center;z-index:99;padding:20px}
.overlay.show{display:grid}
.modal{background:#fff;border-radius:14px;max-width:520px;width:100%;padding:24px;box-shadow:0 20px 60px -20px rgba(14,27,51,.5)}
.modal h3{margin:0 0 10px;font-size:17px}
.modal p{margin:0 0 12px;color:var(--ink)}
.modal .small{font-size:12.5px;color:var(--ink-soft);word-break:break-all}
@media (max-width:900px){.g3{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:620px){.g3{grid-template-columns:1fr}.wrap{padding:0 12px 48px}.card-body{padding:14px}}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
</head>
<body>

<div class="topbar"><div class="topbar-in">
  <div class="brand">
    <div class="mark">HĐ</div>
    <div><h1>Tải hóa đơn hàng loạt</h1>
    <p>hoadondientu.gdt.gov.vn — tải file XML nhiều hóa đơn cùng lúc</p></div>
  </div>
  <button class="linkbtn" id="btnLog">Mở file nhật ký</button>
  <span class="chip" id="statusChip"><span class="dot"></span><span id="statusText">Chưa đăng nhập</span></span>
</div></div>

<div class="wrap">

  <section class="card">
    <div class="card-head"><span class="eyebrow">Bước 1</span><h2>Đăng nhập trang thuế</h2></div>
    <div class="card-body">
      <div class="grid g3">
        <div class="field"><label for="mst">Mã số thuế <span class="req">*</span></label>
          <input type="text" id="mst" placeholder="0700922112" autocomplete="off"></div>
        <div class="field"><label for="pwd">Mật khẩu <span class="req">*</span></label>
          <div class="password-wrap">
            <input type="password" id="pwd" placeholder="Nhập mật khẩu">
            <button type="button" class="toggle-pass" id="togglePwd" aria-label="Hiện mật khẩu">Hiện</button>
          </div></div>
        <div class="field"><label for="captcha">Mã captcha <span class="req">*</span> — bấm vào ảnh để đổi mã</label>
          <div class="daterow">
            <input type="text" id="captcha" placeholder="Nhập mã bên cạnh" style="flex:1" autocomplete="off">
            <div id="captchaBox" title="Bấm để lấy mã khác">…</div>
          </div></div>
      </div>
      <div class="btn-row" style="margin-top:16px">
        <button class="btn btn-primary" id="btnLogin">Đăng nhập</button>
        <label class="check"><input type="checkbox" id="remember" checked> Nhớ mã số thuế và mật khẩu cho lần sau</label>
      </div>
    </div>
  </section>

  <section class="card">
    <div class="card-head" style="justify-content:space-between">
      <div style="display:flex;align-items:center;gap:12px"><span class="eyebrow">Bước 2</span><h2>Tra cứu hóa đơn</h2></div>
      <div class="tabs" role="tablist">
        <button class="tab" role="tab" aria-selected="true" data-dir="ban">Hóa đơn bán ra</button>
        <button class="tab" role="tab" aria-selected="false" data-dir="mua">Hóa đơn mua vào</button>
      </div>
    </div>
    <div class="card-body">
      <div class="grid g3">
        <div class="field"><label for="fStatus">Trạng thái hóa đơn <span class="req">*</span></label>
          <select id="fStatus">
            <option>Tất cả</option><option>Hóa đơn mới</option><option>Hóa đơn thay thế</option>
            <option>Hóa đơn điều chỉnh</option><option>Hóa đơn đã bị thay thế</option>
            <option>Hóa đơn đã bị điều chỉnh</option><option>Hóa đơn đã bị hủy</option>
          </select></div>
        <div class="field"><label for="fCheck">Kết quả kiểm tra <span class="req">*</span></label>
          <select id="fCheck">
            <option>Tất cả</option><option>Cục Thuế đã nhận</option>
            <option>Đang tiến hành kiểm tra điều kiện cấp mã</option>
            <option>CQT từ chối hóa đơn theo từng lần phát sinh</option>
            <option>Hóa đơn đủ điều kiện cấp mã</option><option>Hóa đơn không đủ điều kiện cấp mã</option>
            <option>Đã cấp mã hóa đơn</option><option>Cục Thuế đã nhận không mã</option>
            <option>Đã kiểm tra định kỳ HĐĐT không có mã</option>
            <option>Cục Thuế đã nhận hóa đơn có mã khởi tạo từ máy tính tiền</option>
          </select></div>
        <div class="field"><label>Ngày lập hóa đơn <span class="req">*</span></label>
          <div class="range-tools" aria-label="Chọn nhanh khoảng ngày">
            <button type="button" class="range-btn" data-range="month">Tháng này</button>
            <button type="button" class="range-btn" data-range="quarter">Quý này</button>
            <button type="button" class="range-btn active" data-range="year">Năm nay</button>
            <button type="button" class="range-btn" data-range="last-year">Năm trước</button>
            <button type="button" class="range-btn" data-range="custom">Tùy chọn</button>
          </div>
          <div class="daterow"><span>Từ</span><input type="date" id="fFrom">
          <span>đến</span><input type="date" id="fTo"></div></div>
        <div class="field"><label for="fMst">Mã số thuế người mua</label>
          <input type="text" id="fMst" placeholder="Để trống nếu lấy tất cả"></div>
        <div class="field"><label for="fCccd">CCCD người mua</label>
          <input type="text" id="fCccd" placeholder="Để trống nếu lấy tất cả"></div>
        <div class="field"><label for="fMau">Ký hiệu mẫu số hóa đơn</label>
          <select id="fMau"><option>Tất cả</option><option>1</option><option>2</option>
          <option>3</option><option>4</option><option>5</option><option>6</option></select></div>
        <div class="field"><label for="fKh">Ký hiệu hóa đơn</label>
          <input type="text" id="fKh" placeholder="Ví dụ: C26TYY"></div>
        <div class="field"><label for="fSo">Số hóa đơn</label>
          <input type="text" id="fSo" placeholder="Ví dụ: 00000202"></div>
        <div class="field" style="justify-content:flex-end">
          <label class="check" style="padding-bottom:9px"><input type="checkbox" id="fUyNhiem"> Chỉ lấy hóa đơn ủy nhiệm</label></div>
      </div>
      <div class="btn-row" style="margin-top:18px">
        <button class="btn btn-primary" id="btnSearch">Tìm kiếm</button>
        <button class="btn btn-ghost" id="btnReset">Xóa bộ lọc</button>
        <span id="searchNote" style="font-size:12.5px;color:var(--ink-soft)"></span>
      </div>
    </div>
  </section>

  <section class="card">
    <div class="card-head"><span class="eyebrow">Bước 3</span><h2>Chọn hóa đơn cần tải</h2></div>
    <div class="subtabs" role="tablist">
      <div class="subtab-item">
        <input type="checkbox" id="useDt" checked title="Tick để tra cứu loại hóa đơn này">
        <button class="subtab" role="tab" aria-selected="true" data-kind="dt">Hóa đơn điện tử <span class="count" id="cntDt">0</span></button>
      </div>
      <div class="subtab-item">
        <input type="checkbox" id="useMtt" checked title="Tick để tra cứu loại hóa đơn này">
        <button class="subtab" role="tab" aria-selected="false" data-kind="mtt">Hóa đơn có mã khởi tạo từ máy tính tiền <span class="count" id="cntMtt">0</span></button>
      </div>
      <span class="loai-note" id="loaiNote"></span>
    </div>
    <div class="toolbar">
      <span class="selected-count">Đã chọn <b id="selCount">0</b> / <span id="totalCount">0</span> hóa đơn</span>
      <button class="linkbtn" id="btnSelectAll">Chọn tất cả</button>
      <button class="linkbtn" id="btnClearAll">Bỏ chọn tất cả</button>
      <span style="margin-left:auto;font-size:12.5px;color:var(--ink-soft)" id="sumMoney"></span>
    </div>
    <div class="tablewrap">
      <table><thead><tr>
        <th class="col-check"><input type="checkbox" id="checkAll" title="Chọn tất cả hóa đơn"></th>
        <th>STT</th><th>Mã số thuế</th><th>Mẫu số</th><th>Ký hiệu</th><th>Số hóa đơn</th>
        <th>Ngày lập</th><th>Thông tin hóa đơn</th>
        <th style="text-align:right">Chưa thuế</th><th style="text-align:right">Tiền thuế</th>
        <th style="text-align:right">Thanh toán</th><th>Trạng thái</th>
      </tr></thead><tbody id="tbody"></tbody></table>
      <div class="empty" id="emptyBox"><strong>Chưa có kết quả</strong>
      Chọn khoảng ngày rồi bấm “Tìm kiếm” để lấy danh sách hóa đơn.</div>
    </div>
  </section>

  <section class="card">
    <div class="card-head"><span class="eyebrow">Bước 4</span><h2>Tải file về máy</h2></div>
    <div class="card-body">
      <div class="dinh-dang">
        <span class="dd-label">Loại file muốn tải</span>
        <label class="check"><input type="checkbox" id="ddXml" checked> File XML <span class="dd-hint">(bản gốc để kê khai)</span></label>
        <label class="check"><input type="checkbox" id="ddPdf"> File PDF <span class="dd-hint">(bản in để xem, lưu trữ)</span></label>
        <label class="check"><input type="checkbox" id="ddExcel"> Gộp danh mục và tải file Excel <span class="dd-hint">(1 file tổng hợp mọi hóa đơn)</span></label>
        <span class="dd-note" id="ddNote"></span>
      </div>
      <div class="folder" style="margin-top:14px">
        <button class="btn btn-ghost" id="btnFolder">Chọn thư mục lưu</button>
        <span class="path" id="folderPath">Chưa chọn thư mục lưu</span>
      </div>
      <div class="btn-row" style="margin-top:16px">
        <button class="btn btn-primary btn-lg" id="btnDownload" disabled>Tải hàng loạt</button>
        <button class="btn btn-ghost" id="btnStop" style="display:none">Dừng lại</button>
      </div>
      <div class="progress-block" id="progressBlock">
        <div class="progress-top">
          <div class="progress-figure"><span id="pDone">0</span><span class="of"> / <span id="pTotal">0</span> hóa đơn</span></div>
          <div class="progress-pct" id="pPct">0%</div>
        </div>
        <div class="rail"><div class="rail-fill" id="railFill"></div></div>
        <div class="progress-meta">
          <span class="ok">Thành công <b id="pOk">0</b></span>
          <span class="skip">Bỏ qua vì đã có <b id="pSkip">0</b></span>
          <span class="err">Lỗi <b id="pErr">0</b></span>
        </div>
        <div class="current-file" id="pCurrent"></div>
      </div>
      <div class="note"><b>Tool sẽ tự làm giúp bạn:</b>
        <ul>
          <li>Tải file .zip của từng hóa đơn rồi giải nén, chỉ giữ lại file bạn cần</li>
          <li>File PDF được in ra từ chính bản in hóa đơn của Cục Thuế, giống hệt bản bạn tải thủ công</li>
          <li>Đặt tên file theo dạng <span style="font-family:var(--mono)">20260816_C26TYY_00000202_CTY-4CORE.xml</span> (bản PDF cùng tên, đuôi .pdf)</li>
          <li>File nào đã có sẵn trong thư mục thì bỏ qua, không tải lại</li>
          <li>Hóa đơn nào lỗi mạng sẽ thử lại tối đa 3 lần</li>
          <li>File Excel gồm 3 sheet: Bảng kê hóa đơn · Chi tiết hàng hóa · Tổng hợp theo thuế suất</li>
        </ul>
      </div>
    </div>
  </section>
</div>

<div class="overlay" id="overlay"><div class="modal">
  <h3 id="mTitle">Thông báo</h3>
  <p id="mBody"></p>
  <p class="small" id="mLog"></p>
  <div class="btn-row" style="margin-top:16px">
    <button class="btn btn-primary" id="mClose">Đã hiểu</button>
    <button class="btn btn-ghost" id="mOpenLog">Mở file nhật ký</button>
  </div>
</div></div>

<script>
const $ = id => document.getElementById(id);
let DATA = {dt:[], mtt:[]};
let kind = "dt", direction = "ban";
let picked = new Set();
let timer = null;
let DUONG_NHAT_KY = "";

const money = n => (Number(n)||0).toLocaleString('vi-VN');

function baoLoi(tieuDe, noiDung){
  $("mTitle").textContent = tieuDe;
  $("mBody").textContent = noiDung + "\n\nNếu lỗi lặp lại, gửi file nhat-ky.txt cho người hỗ trợ.";
  $("mLog").textContent = "File nhật ký: " + DUONG_NHAT_KY;
  $("overlay").classList.add("show");
}
$("mClose").onclick = () => $("overlay").classList.remove("show");
$("mOpenLog").onclick = () => fetch("/api/mo-nhat-ky");
$("btnLog").onclick = () => fetch("/api/mo-nhat-ky");

async function goi(duong, body){
  try{
    const opt = body ? {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body)} : {};
    const r = await fetch(duong, opt);
    return await r.json();
  }catch(e){
    baoLoi("Không liên lạc được với tool",
      "Cửa sổ đen của tool có thể đã bị đóng. Mở lại file tool rồi thử lại.");
    return {ok:false};
  }
}

function isoNgay(d){
  const pad = n => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + pad(d.getMonth()+1) + "-" + pad(d.getDate());
}
function danhDauKhoang(mode){
  document.querySelectorAll(".range-btn").forEach(b => b.classList.toggle("active", b.dataset.range === mode));
}
function chonKhoangNgay(mode){
  danhDauKhoang(mode);
  if(mode === "custom") return;
  const now = new Date();
  let from, to = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if(mode === "month"){
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  }else if(mode === "quarter"){
    const qStart = Math.floor(now.getMonth()/3) * 3;
    from = new Date(now.getFullYear(), qStart, 1);
  }else if(mode === "last-year"){
    from = new Date(now.getFullYear()-1, 0, 1);
    to = new Date(now.getFullYear()-1, 11, 31);
  }else{
    from = new Date(now.getFullYear(), 0, 1);
  }
  $("fFrom").value = isoNgay(from);
  $("fTo").value = isoNgay(to);
}
document.querySelectorAll(".range-btn").forEach(b => b.onclick = () => chonKhoangNgay(b.dataset.range));
$("fFrom").onchange = () => danhDauKhoang("custom");
$("fTo").onchange = () => danhDauKhoang("custom");

/* ---- nạp thiết lập đã lưu ---- */
(async function init(){
  const s = await goi("/api/thiet-lap");
  DUONG_NHAT_KY = s.duong_nhat_ky || "";
  if(s.mst) $("mst").value = s.mst;
  if(s.mat_khau) $("pwd").value = s.mat_khau;
  $("remember").checked = !!s.nho_dang_nhap;
  const dd = s.dinh_dang || ["xml"];
  $("ddXml").checked = dd.includes("xml");
  $("ddPdf").checked = dd.includes("pdf");
  $("ddExcel").checked = dd.includes("excel");
  COC_CHROME = s.co_chrome !== false;
  capNhatDinhDang();
  if(s.thu_muc_luu){ $("folderPath").textContent = s.thu_muc_luu; $("folderPath").classList.add("set"); }
  chonKhoangNgay("year");
  moiCaptcha();
})();

/* ---- captcha ---- */
async function moiCaptcha(){
  $("captchaBox").innerHTML = "…";
  const r = await goi("/api/captcha");
  if(r.ok && r.anh){ $("captchaBox").innerHTML = r.anh; }
  else { $("captchaBox").textContent = "Lỗi"; if(r.loi) baoLoi("Không lấy được mã captcha", r.loi); }
}
$("captchaBox").onclick = () => { $("captcha").value=""; moiCaptcha(); };

$("togglePwd").onclick = () => {
  const pwd = $("pwd");
  const dangHien = pwd.type === "text";
  pwd.type = dangHien ? "password" : "text";
  $("togglePwd").textContent = dangHien ? "Hiện" : "Ẩn";
  $("togglePwd").setAttribute("aria-label", dangHien ? "Hiện mật khẩu" : "Ẩn mật khẩu");
};

/* ---- đăng nhập ---- */
$("btnLogin").onclick = async () => {
  if(!$("mst").value.trim() || !$("pwd").value || !$("captcha").value.trim()){
    baoLoi("Thiếu thông tin","Nhập đủ mã số thuế, mật khẩu và mã captcha rồi bấm Đăng nhập."); return;
  }
  $("btnLogin").disabled = true; $("btnLogin").textContent = "Đang đăng nhập…";
  const r = await goi("/api/dang-nhap", {mst:$("mst").value.trim(), mat_khau:$("pwd").value,
                                          captcha:$("captcha").value.trim(), nho:$("remember").checked});
  $("btnLogin").disabled = false; $("btnLogin").textContent = "Đăng nhập";
  if(r.ok){
    $("statusChip").classList.add("on");
    $("statusText").textContent = "Đã đăng nhập · " + r.mst;
  } else {
    baoLoi("Đăng nhập không thành công", r.loi || "Không rõ lý do.");
    $("captcha").value=""; moiCaptcha();
  }
};

/* ---- tabs ---- */
document.querySelectorAll(".tab").forEach(t => t.onclick = () => {
  document.querySelectorAll(".tab").forEach(x=>x.setAttribute("aria-selected","false"));
  t.setAttribute("aria-selected","true"); direction = t.dataset.dir; xoaKetQua();
});
document.querySelectorAll(".subtab").forEach(t => t.onclick = () => {
  if(t.disabled) return;
  document.querySelectorAll(".subtab").forEach(x=>x.setAttribute("aria-selected","false"));
  t.setAttribute("aria-selected","true"); kind = t.dataset.kind; picked.clear(); ve();
});

/* ---- 2 ô tick chọn loại hóa đơn cần tra cứu ---- */
function layLoai(){
  const ds = [];
  if($("useDt").checked) ds.push("dt");
  if($("useMtt").checked) ds.push("mtt");
  return ds;
}
function capNhatLoai(){
  const ds = layLoai();
  document.querySelectorAll(".subtab").forEach(t => {
    t.disabled = !ds.includes(t.dataset.kind);
  });
  // neu the dang xem bi bo tick thi chuyen sang the con lai
  if(ds.length && !ds.includes(kind)){
    kind = ds[0];
    document.querySelectorAll(".subtab").forEach(x =>
      x.setAttribute("aria-selected", x.dataset.kind===kind ? "true" : "false"));
    picked.clear(); ve();
  }
  if(ds.length === 0) $("loaiNote").textContent = "Chưa chọn loại hóa đơn nào — tick ít nhất 1 ô";
  else if(ds.length === 2) $("loaiNote").textContent = "Sẽ tra cứu cả 2 loại hóa đơn";
  else $("loaiNote").textContent = "Chỉ tra cứu: " + (ds[0]==="dt" ? "Hóa đơn điện tử" : "Hóa đơn máy tính tiền");
}
$("useDt").onchange = capNhatLoai;
$("useMtt").onchange = capNhatLoai;

/* ---- tìm kiếm ---- */
$("btnSearch").onclick = async () => {
  if(!$("fFrom").value || !$("fTo").value){
    baoLoi("Thiếu khoảng ngày","Chọn Từ ngày và Đến ngày rồi bấm Tìm kiếm."); return; }
  if($("fFrom").value > $("fTo").value){
    baoLoi("Khoảng ngày chưa đúng","Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc."); return; }
  const loai = layLoai();
  if(loai.length === 0){
    baoLoi("Chưa chọn loại hóa đơn",
      "Xuống Bước 3 và tick vào “Hóa đơn điện tử” hoặc “Hóa đơn có mã khởi tạo từ máy tính tiền” rồi tìm lại."); return; }
  $("btnSearch").disabled = true; $("btnSearch").textContent = "Đang tìm…";
  $("searchNote").textContent = "Đang lấy dữ liệu từ máy chủ Cục Thuế, vui lòng đợi…";
  const r = await goi("/api/tra-cuu", {
    direction, loai, tu_ngay:$("fFrom").value, den_ngay:$("fTo").value,
    trang_thai:$("fStatus").value, ket_qua:$("fCheck").value,
    mst_nguoi_mua:$("fMst").value, ky_hieu:$("fKh").value,
    so_hoa_don:$("fSo").value, mau_so:$("fMau").value
  });
  $("btnSearch").disabled = false; $("btnSearch").textContent = "Tìm kiếm"; $("searchNote").textContent = "";
  if(!r.ok){ baoLoi("Không tìm được hóa đơn", r.loi || "Không rõ lý do."); return; }
  DATA = {dt:r.dt||[], mtt:r.mtt||[]};
  picked.clear();
  $("cntDt").textContent = DATA.dt.length; $("cntMtt").textContent = DATA.mtt.length;
  // tu chuyen sang the co ket qua
  if(!loai.includes(kind) || (DATA[kind].length === 0 && loai.some(k=>DATA[k].length))){
    kind = loai.find(k => DATA[k].length) || loai[0];
    document.querySelectorAll(".subtab").forEach(x =>
      x.setAttribute("aria-selected", x.dataset.kind===kind ? "true" : "false"));
  }
  if(r.canh_bao) $("searchNote").textContent = "Lưu ý: " + r.canh_bao;
  ve();
};
$("btnReset").onclick = () => {
  ["fMst","fCccd","fKh","fSo"].forEach(i=>$(i).value="");
  $("fStatus").selectedIndex=0; $("fCheck").selectedIndex=0; $("fMau").selectedIndex=0;
  $("fUyNhiem").checked=false; xoaKetQua();
};
function xoaKetQua(){
  DATA={dt:[],mtt:[]}; picked.clear();
  $("cntDt").textContent="0"; $("cntMtt").textContent="0";
  $("progressBlock").classList.remove("show"); $("searchNote").textContent=""; ve();
}

/* ---- vẽ bảng ---- */
function ve(){
  const rows = DATA[kind] || [];
  const tb = $("tbody"); tb.innerHTML = "";
  $("emptyBox").style.display = rows.length ? "none" : "block";
  rows.forEach((r,i)=>{
    const tr = document.createElement("tr");
    if(picked.has(i)) tr.className="picked";
    tr.innerHTML =
      '<td><input type="checkbox" data-i="'+i+'" '+(picked.has(i)?"checked":"")+'></td>'+
      '<td class="mono">'+(i+1)+'</td><td class="mono">'+r.mst+'</td>'+
      '<td class="mono">'+r.mau+'</td><td class="mono">'+r.kh+'</td>'+
      '<td class="mono">'+r.so+'</td><td class="mono">'+r.ngay+'</td>'+
      '<td><span class="seller"></span><span class="seller-mst"></span></td>'+
      '<td class="num">'+money(r.base)+'</td><td class="num">'+money(r.vat)+'</td>'+
      '<td class="num"><b>'+money(r.total)+'</b></td>'+
      '<td><span class="tag"></span></td>';
    tr.querySelector(".seller").textContent = r.ten;
    tr.querySelector(".seller-mst").textContent = r.file;
    tr.querySelector(".tag").textContent = r.trang_thai;
    tb.appendChild(tr);
  });
  tb.querySelectorAll("input[type=checkbox]").forEach(cb=>{
    cb.onchange = () => {
      const i = Number(cb.dataset.i);
      cb.checked ? picked.add(i) : picked.delete(i);
      cb.closest("tr").classList.toggle("picked", cb.checked);
      capNhat();
    };
  });
  capNhat();
}
function capNhat(){
  const rows = DATA[kind] || [];
  $("selCount").textContent = picked.size;
  $("totalCount").textContent = rows.length;
  $("checkAll").checked = rows.length>0 && picked.size===rows.length;
  $("checkAll").indeterminate = picked.size>0 && picked.size<rows.length;
  let sum = 0; picked.forEach(i => { if(rows[i]) sum += Number(rows[i].total)||0; });
  $("sumMoney").textContent = picked.size ? "Tổng thanh toán đã chọn: " + money(sum) + " ₫" : "";
  $("btnDownload").disabled = picked.size===0;
}
$("checkAll").onchange = e => e.target.checked ? chonHet() : boHet();
$("btnSelectAll").onclick = chonHet;
$("btnClearAll").onclick = boHet;
function chonHet(){ (DATA[kind]||[]).forEach((_,i)=>picked.add(i)); ve(); }
function boHet(){ picked.clear(); ve(); }

/* ---- 2 ô tick chọn loại file muốn tải ---- */
let COC_CHROME = true;
function layDinhDang(){
  const ds = [];
  if($("ddXml").checked) ds.push("xml");
  if($("ddPdf").checked) ds.push("pdf");
  if($("ddExcel").checked) ds.push("excel");
  return ds;
}
function capNhatDinhDang(){
  const ds = layDinhDang();
  let ghi = "";
  if(ds.length === 0) ghi = "Tick ít nhất 1 lựa chọn";
  else if($("ddPdf").checked && !COC_CHROME) ghi = "Máy chưa cài Chrome — không tạo được PDF";
  else {
    const luu = [];
    if($("ddXml").checked) luu.push(".xml");
    if($("ddPdf").checked) luu.push(".pdf");
    if(luu.length === 2) ghi = "Mỗi hóa đơn lưu 2 file: .xml và .pdf";
    if($("ddExcel").checked) ghi += (ghi ? " · " : "") + "Kèm 1 file Excel tổng hợp";
  }
  $("ddNote").textContent = ghi;
}
$("ddXml").onchange = capNhatDinhDang;
$("ddPdf").onchange = capNhatDinhDang;
$("ddExcel").onchange = capNhatDinhDang;

/* ---- chọn thư mục (mở hộp thoại Windows thật) ---- */
$("btnFolder").onclick = async () => {
  $("btnFolder").disabled = true; $("btnFolder").textContent = "Đang mở hộp thoại…";
  const r = await goi("/api/chon-thu-muc");
  $("btnFolder").disabled = false; $("btnFolder").textContent = "Chọn thư mục lưu";
  if(r.ok && r.thu_muc){
    $("folderPath").textContent = r.thu_muc; $("folderPath").classList.add("set");
  }
};

/* ---- tải hàng loạt ---- */
$("btnStop").onclick = () => goi("/api/dung", {});
$("btnDownload").onclick = async () => {
  const dinh_dang = layDinhDang();
  if(dinh_dang.length === 0){
    baoLoi("Chưa chọn việc cần làm","Tick vào “File XML”, “File PDF” hoặc “Gộp danh mục và tải file Excel” ở Bước 4 rồi bấm lại."); return; }
  const r = await goi("/api/tai", {kind, direction, dinh_dang, chi_so: Array.from(picked)});
  if(!r.ok){ baoLoi("Chưa tải được", r.loi || "Không rõ lý do."); return; }
  $("progressBlock").classList.add("show");
  $("pTotal").textContent = r.tong;
  $("btnDownload").disabled = true; $("btnStop").style.display = "inline-flex";
  if(timer) clearInterval(timer);
  timer = setInterval(theoDoi, 500);
};
async function theoDoi(){
  const t = await goi("/api/tien-trinh");
  if(!t || t.tong===undefined) return;
  const pct = t.tong ? Math.round(t.xong/t.tong*100) : 0;
  $("pDone").textContent = t.xong; $("pTotal").textContent = t.tong;
  $("pPct").textContent = pct + "%"; $("railFill").style.width = pct + "%";
  $("pOk").textContent = t.ok; $("pSkip").textContent = t.bo_qua; $("pErr").textContent = t.loi;
  $("pCurrent").textContent = t.dang_chay ? ("Đang tải: " + (t.hien_tai||"")) : (t.ket_thuc||"");
  if(!t.dang_chay){
    clearInterval(timer); timer = null;
    $("btnStop").style.display = "none"; capNhat();
  }
}
capNhatLoai();
ve();
</script>
</body>
</html>
"""


# ==========================================================================
#  KHOI DONG
# ==========================================================================
def tim_cong_trong(bat_dau=8765):
    for cong in range(bat_dau, bat_dau + 40):
        try:
            s = socket.socket()
            s.bind(("127.0.0.1", cong))
            s.close()
            return cong
        except Exception:
            continue
    return 0


def mo_chrome(url):
    duong_chrome = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    ]
    for d in duong_chrome:
        if os.path.exists(d):
            try:
                webbrowser.register("chrome", None, webbrowser.BackgroundBrowser(d))
                webbrowser.get("chrome").open(url)
                LOG.ghi("[KHOI DONG] Da mo Chrome tai: " + d)
                return True
            except Exception as e:
                LOG.loi("Khong mo duoc Chrome tai " + d, e)
    try:
        webbrowser.open(url)
        LOG.ghi("[KHOI DONG] Khong tim thay Chrome, da mo trinh duyet mac dinh.")
        return True
    except Exception as e:
        LOG.loi("Khong mo duoc trinh duyet nao", e)
        return False


def main():
    LOG.phan_cach("Mo tool")
    LOG.ghi("Phien ban tool      : %s" % APP_VERSION)
    LOG.ghi("Phien ban Python    : %s" % sys.version.replace("\n", " "))
    LOG.ghi("He dieu hanh        : %s %s (%s)" % (platform.system(), platform.release(), platform.machine()))
    LOG.ghi("Thu muc chua tool   : %s" % BASE_DIR)
    LOG.ghi("File nhat ky        : %s" % LOG_PATH)
    LOG.ghi("Thu muc luu hoa don : %s" % (SETTINGS.get("thu_muc_luu") or "(chua chon)"))
    LOG.ghi("Ma so thue da nho   : %s" % (SETTINGS.get("mst") or "(chua co)"))
    LOG.ghi("May chu dung lan truoc: %s" % (SETTINGS.get("may_chu_da_chay") or "(chua co, se tu do tim)"))
    LOG.ghi("Duong tai dung lan truoc: %s" % json.dumps(SETTINGS.get("duong_tai_da_chay", {}), ensure_ascii=False))
    LOG.ghi("Hop thoai chon thu muc: %s" % ("dung duoc" if TK_OK else "KHONG dung duoc (thieu tkinter)"))

    cong = tim_cong_trong()
    if not cong:
        print("Khong tim duoc cong trong de chay tool. Xem file nhat ky:", LOG_PATH)
        LOG.ghi("[KHOI DONG] LOI: khong tim duoc cong trong.")
        input("Nhan Enter de dong...")
        return

    dia_chi = "http://127.0.0.1:%d" % cong
    LOG.ghi("[KHOI DONG] Giao dien chay tai: " + dia_chi)

    server = http.server.ThreadingHTTPServer(("127.0.0.1", cong), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()

    print("=" * 58)
    print("  TOOL TAI HOA DON DIEN TU HANG LOAT - phien ban", APP_VERSION)
    print("=" * 58)
    print("  Giao dien dang mo trong Chrome:", dia_chi)
    print("  File nhat ky:", LOG_PATH)
    print()
    print("  GIU NGUYEN cua so nay trong luc dung tool.")
    print("  Dong cua so nay = tat tool.")
    print("=" * 58)

    time.sleep(0.6)
    mo_chrome(dia_chi)

    # Luong chinh: cho de mo hop thoai chon thu muc (tkinter chi chay o luong chinh)
    if TK_OK:
        root = tk.Tk()
        root.withdraw()

        def kiem_tra():
            try:
                while True:
                    tra_loi = HOP_THU_CHON_THU_MUC.get_nowait()
                    try:
                        root.deiconify(); root.withdraw()
                        root.attributes("-topmost", True)
                        thu_muc = filedialog.askdirectory(
                            title="Chọn thư mục lưu file XML hóa đơn",
                            initialdir=SETTINGS.get("thu_muc_luu") or os.path.expanduser("~"))
                        root.attributes("-topmost", False)
                        tra_loi.put(thu_muc or "")
                    except Exception as e:
                        LOG.loi("Loi khi mo hop thoai chon thu muc", e)
                        tra_loi.put("")
            except queue.Empty:
                pass
            except Exception as e:
                LOG.loi("Loi trong vong lap chon thu muc", e)
            root.after(200, kiem_tra)

        root.after(200, kiem_tra)
        try:
            root.mainloop()
        except KeyboardInterrupt:
            pass
    else:
        LOG.ghi("[KHOI DONG] Khong co tkinter - nut chon thu muc se khong mo duoc hop thoai.")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            pass

    LOG.ghi("[KET THUC] Nguoi dung dong tool.")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        LOG.loi("Loi nghiem trong lam tool phai dung", e)
        try:
            print()
            print("Tool gap loi va phai dung lai.")
            print("Chi tiet da duoc ghi vao file:", LOG_PATH)
            print("Neu loi lap lai, gui file nhat-ky.txt cho nguoi ho tro.")
            input("Nhan Enter de dong...")
        except Exception:
            pass

