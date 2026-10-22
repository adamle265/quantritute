# Đổi thông tin doanh nghiệp có dữ liệu sang thông tin giả (bản sao). python an_danh.py <zip vào> <zip ra> <loai: br|mv>
import re, sys, zipfile, io, json, html.entities, collections
import openpyxl
SRC, DST, LOAI = sys.argv[1:4]
FAKE_TEN_HOA = "CÔNG TY TNHH MINH HỌA ĐỐM SÁNG"; FAKE_TEN = "Công ty TNHH Minh Họa Đốm Sáng"
FAKE_MST = "9876543210"; FAKE_DC = "Số 01 đường Minh Họa, Phường Minh Họa, Thành phố Hà Nội"
FAKE_DT = "0900000000"; FAKE_EMAIL = "minhhoa@example.com"; FAKE_NGUOI = "Nguyễn Minh Họa"
CANHAN = {"Trần Thu Cúc": ("Nguyễn Văn A", "001200000001", "Số 2 đường Ví Dụ, Phường Minh Họa, Thành phố Hà Nội"),
          "Lê Văn Mạnh": ("Trần Thị B", "001200000002", "Số 3 đường Ví Dụ, Phường Minh Họa, Thành phố Hà Nội")}
SLUG = {"TRAN-THU-CUC": "NGUYEN-VAN-A", "LE-VAN-MANH": "TRAN-THI-B"}
EMAIL = re.compile(r'[\w.+-]+@[\w-]+\.[\w.]+')
M = {}  # chuỗi gốc -> chuỗi giả
def ten_gia(v): return FAKE_TEN_HOA if v.isupper() else FAKE_TEN
def thu(block, own=True):
    for t, v in re.findall(r'<(\w+)>([^<]+)</\1>', block):
        v2 = v.strip()
        if not v2 or v2 in (".", "0", "string", "TM/CK") or t in ("TTruong", "KDLieu"): continue
        if EMAIL.fullmatch(v2): M[v2] = FAKE_EMAIL
        elif re.fullmatch(r'0\d{9}', v2) and t in ("SDThoai", "DLieu") and v2 != "0111403942": M[v2] = FAKE_DT
        elif "an khang" in v2.lower(): M[v2] = ten_gia(v2) if t in ("Ten", "DLieu") else "MINHHOA"
        elif "0111403942" in v2: M[v2] = v2.replace("0111403942", FAKE_MST)
        elif t == "DChi": M[v2] = FAKE_DC
        elif t in ("HVTNMHang", "Ten") or re.search(r'thanh|nhung', v2, re.I) and t == "DLieu": M[v2] = FAKE_NGUOI
zin = zipfile.ZipFile(SRC)
xmls = {n: zin.read(n).decode("utf-8") for n in zin.namelist() if n.lower().endswith(".xml")}
for n, s in xmls.items():
    own = "NMua" if LOAI == "mv" else "NBan"
    m = re.search(rf'<{own}>.*?</{own}>', s, re.S)
    if m: thu(m.group(0))
    if LOAI == "br":
        b = re.search(r'<NMua>.*?</NMua>', s, re.S)
        if b:
            blk = b.group(0)
            for ten, (gia, cccd, dc) in CANHAN.items():
                if ten in blk:
                    M[ten] = gia
                    for t, v in re.findall(r'<(\w+)>([^<]+)</\1>', blk):
                        if t == "CCCDan" or (t == "DLieu" and re.fullmatch(r'\d{12}', v)): M[v] = cccd
                        if t == "DChi": M[v] = dc
                        if t in ("SDThoai",): M[v] = FAKE_DT
                        if EMAIL.fullmatch(v): M[v] = FAKE_EMAIL
M["0111403942"] = FAKE_MST
DON = {k: M.pop(k) for k in list(M) if " " not in k and not re.search(r"[\d@]", k)}
KEYS = sorted(M, key=len, reverse=True)
PAT = re.compile("|".join(r'(?<![\wÀ-ỹ])' + re.escape(k) + r'(?![\wÀ-ỹ])' for k in KEYS))
def thay(s):
    s = PAT.sub(lambda m: M[m.group(0)], s)
    for k, v in DON.items():
        s = re.sub(r'(<(?:HVTNMHang|Ten|DLieu|MKHang)>)' + re.escape(k) + r'(?=<)', lambda m: m.group(1) + v, s)
        s = re.sub(r'(người mua:?\s*(?:<[^>]*>\s*)*)' + re.escape(k) + r'(?=\s*<)', lambda m: m.group(1) + v, s)
    s = re.sub(r'(?i)c[ôo]ng\s+ty\s+tnhh\s+t[ưu]\s+v[ấa]n\s+d[ịi]ch\s+v[ụu]\s+an\s+khang', lambda m: ten_gia(m.group(0)), s)
    s = re.sub(r'(?i)an khang', "Minh Họa", s)
    s = re.sub(r'(?i)[sS]ố nh[àa] 28[^<"\n|]*?(?=[<"\n|]|$)', FAKE_DC, s)
    s = re.sub(r'(?i)[\w.+-]*(nhung|nguyenthanh|tranhongvan)[\w.+-]*@[\w.-]+', FAKE_EMAIL, s)
    s = s.replace("0111403942", FAKE_MST).replace("0969504293", FAKE_DT).replace("0366583123", FAKE_DT)
    return s
KEEP = {"lt", "gt", "amp", "quot", "apos", "nbsp"}
def unent(s):
    return re.sub(r'&(\w+);', lambda m: chr(html.entities.name2codepoint[m.group(1)]) if m.group(1) in html.entities.name2codepoint and m.group(1) not in KEEP else m.group(0), s)
def ten_file(n):
    for a, b in SLUG.items(): n = n.replace(a, b)
    return n
def xu_ly(name, data, z):
    low = name.lower()
    if low.endswith((".xml", ".html", ".htm", ".json", ".txt")):
        s = data.decode("utf-8-sig") if low.endswith(".txt") else data.decode("utf-8")
        if low.endswith((".html", ".htm")): s = unent(s)
        s = thay(s); data = (("﻿" if low.endswith(".txt") else "") + s).encode("utf-8")
    elif low.endswith(".xlsx"):
        wb = openpyxl.load_workbook(io.BytesIO(data))
        for ws in wb:
            for row in ws.iter_rows():
                for c in row:
                    if isinstance(c.value, str): c.value = ten_file(thay(c.value))
        b = io.BytesIO(); wb.save(b); data = b.getvalue()
    elif low.endswith(".zip"):
        zi = zipfile.ZipFile(io.BytesIO(data)); b = io.BytesIO()
        with zipfile.ZipFile(b, "w", zipfile.ZIP_DEFLATED) as zo:
            for n2 in zi.namelist(): xu_ly(n2, zi.read(n2), zo)
        data = b.getvalue()
    z.writestr(ten_file(name), data)
with zipfile.ZipFile(DST, "w", zipfile.ZIP_DEFLATED) as zo:
    for n in zin.namelist(): xu_ly(n, zin.read(n), zo)
print(len(M), "chuỗi được thay"); [print("  ", k[:70], "->", M[k]) for k in KEYS]
