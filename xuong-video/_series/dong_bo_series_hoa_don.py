# Đồng bộ series "Hướng dẫn tính năng bộ công cụ xử lý hóa đơn" (v06–v09 = Phần 1–4)
# Sinh SEED_V7 + migrateV7 (studio-schema.js), cập nhật bảng lịch HTML, viết youtube-vNN.md
import json, re, os, shutil, sys
R = os.path.expanduser("~/mnt/Dự án 5.0")
SS = R + "/quantritute/src/studio-schema.js"
LICH = R + "/Video xây kênh/Lich-dang-4-video-dau.html"
TAP = R + "/quantritute/xuong-video/tap/"
SERIES = "Hướng dẫn tính năng bộ công cụ xử lý hóa đơn"
P = {  # code: (phần, tên ngắn, tên YouTube, thư mục, hashtag riêng)
 "v06": (1, "Tải hàng loạt hóa đơn", "Tải hàng loạt hóa đơn điện tử bằng 1 nút", "v06-tai-ca-quy-hoa-don"),
 "v07": (2, "Chuyển XML sang Excel", "Chuyển hàng loạt XML hóa đơn sang Excel", "v07-zip-ra-bang-ke"),
 "v08": (3, "Tạo tờ khai 01/GTGT", "Tạo tờ khai 01/GTGT tự động từ hóa đơn", "v08-to-khai-01gtgt"),
 "v09": (4, "Tạo sẵn file nhập lên MISA", "Tạo sẵn file nhập lên MISA từ hóa đơn", "v09-file-nhap-misa"),
}
NAME = {c: v[1] for c, v in P.items()}
ORDER = ["v06", "v07", "v08", "v09"]

V09_BODY = """Đã có đủ hóa đơn mà vẫn phải gõ lại từng chứng từ vào MISA?

Đốm hướng dẫn tạo sẵn file nhập lên MISA từ chính hóa đơn đã nạp:
① Công cụ tự tách mua vào, bán ra theo mã số thuế doanh nghiệp
② Nhà cung cấp: gom sẵn từ hóa đơn; tải lên danh mục từ MISA để tự điền mã, hoặc xuất Excel danh mục cho nhà cung cấp mới
③ Hàng hóa, dịch vụ: hiện từng dòng kèm gợi ý loại (ăn uống, xăng dầu, phí ngân hàng → nghiệp vụ khác, không cần sinh mã hàng); anh chị rà lại, chọn tài khoản, bấm ✓ xác nhận
④ Xuất file theo mẫu nhập khẩu của MISA: mua hàng trong nước, mua dịch vụ, nghiệp vụ khác, bán hàng, bán dịch vụ – tải từng file hoặc cả gói ZIP

Ô còn thiếu thông tin bắt buộc, Đốm liệt kê ngay bên dưới. Anh chị nên nhập thử vài chứng từ trước khi nhập cả kỳ.

Tính năng này được nhiều anh chị kế toán quan tâm; Đốm đang tiếp tục tối ưu để phần này dễ dùng và tiện hơn nữa.

Miễn phí, xử lý ngay trên máy anh chị, không gửi hóa đơn ra ngoài."""
V09_TAG = "#quantritute #misa #hoadondientu #ketoan #phanmemketoan"
V09_NOTE_DATA = "Lưu ý: dữ liệu trong video là dữ liệu thật đã thay đổi thông tin doanh nghiệp; tài khoản 6422 là ví dụ minh họa; chi tiết phần bán ra đã được làm mờ."
def v09_seed():
    tk = V09_BODY + "\n\nLink chi tiết Đốm để ở phần Bio nhé. Anh chị dùng thử và góp ý giúp Đốm hoàn thiện thêm nha!\n\n" + V09_TAG
    yt = V09_BODY + "\n\n🔗 Dùng thử miễn phí: https://quantritute.com/cong-cu/hoa-don-thue?nguon=youtube\n\n" + V09_NOTE_DATA + "\n\nAnh chị dùng thử và góp ý ở bình luận giúp Đốm nhé. Em cảm ơn anh chị!\n\n" + V09_TAG
    fb = V09_BODY + "\n\n🔗 Dùng thử: https://quantritute.com/cong-cu/hoa-don-thue?nguon=facebook\n\n" + V09_NOTE_DATA + "\n\nAnh chị dùng thử và góp ý ở bình luận giúp Đốm nhé. Em cảm ơn anh chị!\n\n" + V09_TAG
    return {"code": "v09", "title": "Tạo sẵn file nhập lên MISA", "date": "2026-10-26", "dur": "1:08",
      "file": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\Video xây kênh\\Source hoàn thiện\\9. Tạo sẵn file nhập lên MISA.mp4",
      "thumb": "D:\\0. Minh Tuấn 2026\\Dự án 5.0\\quantritute\\xuong-video\\tap\\v09-file-nhap-misa\\xuat\\thumb-doc-luoi-1080x1920.png",
      "pin": "Anh chị đang nhập chứng từ mua vào lên MISA bằng tay hay bằng file Excel ạ? Loại chứng từ nào anh chị muốn Đốm hướng dẫn kỹ hơn?",
      "tiktok": {"caption": tk, "note": "Xưng hô: Đốm · gọi người xem là \"anh chị\". Kiểm tra Bio TikTok đã có link trước giờ đăng."},
      "youtube": {"title": "", "caption": yt, "tags": "file nhập MISA, MISA AMIS, nhập khẩu chứng từ MISA, hóa đơn điện tử, nghiệp vụ khác, danh mục nhà cung cấp, kế toán, quantritute",
                  "note": "Shorts dọc 1:08. Hình thu nhỏ: thumb-ngang-1280x720.png. Chế độ hiển thị → Lên lịch → 26/10/2026, 19:00."},
      "facebook": {"caption": fb, "note": "Đăng dạng Reels."}}

def nav(code):
    i = ORDER.index(code); n = i + 1; L = []
    if i > 0: L.append(f"◀ Phần trước – Phần {n-1}: {NAME[ORDER[i-1]]}")
    if i < 3: L.append(f"▶ Phần tiếp theo – Phần {n+1}: {NAME[ORDER[i+1]]}")
    else: L.append("Đây là phần cuối của series. Anh chị xem đủ 4 phần trên kênh để đi trọn quy trình: tải hóa đơn → bảng kê Excel → tờ khai 01/GTGT → file nhập MISA.")
    return "\n".join(L)
def head(code):
    n, ten = P[code][0], P[code][1]
    return f"📚 {SERIES} – Phần {n}/4: {ten}"
def series_caption(code, cap, marker):
    cap = re.sub(r"^📚 .*\n\n", "", cap)  # chạy lại không bị lặp
    cap = re.sub(r"\n\n(◀|▶|Đây là phần cuối)[^\n]*(\n(◀|▶)[^\n]*)*", "", cap)
    k = cap.find(marker)
    body = cap[:k].rstrip() + "\n\n" + nav(code) + "\n\n" + cap[k:] if k >= 0 else cap + "\n\n" + nav(code)
    tags = body.rstrip().split("\n")
    if tags[-1].startswith("#") and "#botcongcuhoadon" not in tags[-1]: tags[-1] += " #botcongcuhoadon"
    return head(code) + "\n\n" + "\n".join(tags)

# ---- Nội dung đăng theo hướng LỢI ÍCH (anh góp ý 20/10 16:08: không viết kiểu các bước khô khan) ----
BENEFIT = {
"v06": """Cuối kỳ kê khai, việc tốn thời gian nhất thường không phải là làm số, mà là ngồi tải từng hóa đơn trên trang thuế.

Với tính năng Tải hàng loạt hóa đơn, anh chị được:
✔ Đỡ hẳn việc bấm tải từng hóa đơn: chọn khoảng ngày, bấm một nút, nhận hóa đơn mua vào hoặc bán ra gọn trong 1 file ZIP
✔ Chọn cả quý cũng được: công cụ tự chia theo tháng, quét nhiều lượt và nhắc khi nên quét lại, để hạn chế sót hóa đơn
✔ Có sẵn bảng kê Excel và file XML ngay trong gói tải về, dùng luôn cho các bước sau
✔ Yên tâm về dữ liệu: dùng phiên đăng nhập sẵn có, không hỏi mật khẩu thuế, hóa đơn không rời máy anh chị
✔ Cài nút một lần, không cần đăng ký, hoàn toàn miễn phí

Thời gian tiết kiệm được, anh chị dành cho việc kiểm tra số liệu – phần thật sự cần đến chuyên môn của kế toán.""",
"v07": """File XML hóa đơn có đủ thông tin, nhưng mở ra đọc thì rất khó, còn chép tay sang Excel lại dễ sai.

Với tính năng Chuyển XML sang Excel, anh chị được:
✔ Kéo thả cả file ZIP hay hàng trăm file XML cùng lúc, có ngay bảng kê Excel mua vào, bán ra
✔ Biết ngay hóa đơn nào cần xem lại: hóa đơn trùng được tự bỏ, hóa đơn bị hủy hoặc thay thế không cộng vào tổng, hóa đơn không có XML gốc được đánh dấu riêng
✔ Có sẵn các bảng hay dùng: chi tiết hàng hóa, tổng hợp theo thuế suất, tra cứu mẫu người bán
✔ File Excel dùng được ngay: cột số đã định dạng, ngày dd/mm/yyyy, có sẵn bộ lọc
✔ Xử lý ngay trên máy anh chị, không gửi hóa đơn ra ngoài, miễn phí

Bớt được phần chép số, anh chị có thêm thời gian để đối chiếu và soát lỗi.""",
"v08": """Đến kỳ kê khai thuế GTGT, cộng tay từng hóa đơn theo từng thuế suất vừa lâu vừa dễ lệch.

Với tính năng Tạo tờ khai 01/GTGT, anh chị được:
✔ Số liệu tờ khai tính sẵn từ chính hóa đơn: thuế đầu ra, thuế được khấu trừ, thuế còn phải nộp
✔ Tách theo từng thuế suất, trừ chiết khấu thương mại, kèm phụ lục giảm thuế theo Nghị quyết 204
✔ Được nhắc trước những hóa đơn cần lưu ý, như hóa đơn không có XML gốc
✔ Chỉ tiêu tự nhập (như [22] lấy từ kỳ trước) và thông tin người nộp chỉ gõ một lần, công cụ tự nhớ
✔ Chọn mẫu theo Thông tư 89 hoặc Thông tư 80; tải ra Excel (tờ khai, bảng kê, phụ lục) và file XML tờ khai
✔ Miễn phí, xử lý ngay trên máy anh chị

Công cụ lập sẵn số liệu, không nộp tờ khai thay anh chị – vui lòng đối chiếu với sổ sách và kiểm tra lại trước khi ký nộp.""",
"v09": """Đã có đủ hóa đơn trong tay, nhưng nhập lại từng chứng từ vào MISA vẫn tốn cả buổi và dễ gõ nhầm.

Với tính năng Tạo file nhập lên MISA, anh chị được:
✔ Bớt việc gõ tay: chứng từ được dựng sẵn từ hóa đơn theo mẫu nhập khẩu của MISA – mua hàng trong nước, mua dịch vụ, nghiệp vụ khác, bán hàng, bán dịch vụ
✔ Đỡ lo trùng nhà cung cấp: tải lên danh mục từ MISA, công cụ đối chiếu mã số thuế và tự điền mã; nhà cung cấp mới có sẵn file danh mục để nhập trước
✔ Đỡ phân loại từng món: ăn uống, xăng dầu, phí ngân hàng được gợi ý là nghiệp vụ khác, không cần tạo mã hàng – anh chị chỉ rà lại và xác nhận
✔ Biết trước chỗ còn thiếu: ô thông tin bắt buộc còn trống được liệt kê để bổ sung trước khi nhập
✔ Miễn phí, xử lý ngay trên máy anh chị, không gửi hóa đơn ra ngoài

Anh chị nên nhập thử vài chứng từ trước khi nhập cả kỳ. Tính năng này được nhiều anh chị kế toán quan tâm, Đốm đang tiếp tục tối ưu để dễ dùng và tiện hơn nữa."""}
LUUY = {
"v06": "Lưu ý: dữ liệu trong video là dữ liệu thật đã thay đổi thông tin doanh nghiệp; cảnh trên trang thuế quay ở trang mô phỏng.",
"v07": "Lưu ý: dữ liệu trong video là dữ liệu thật đã thay đổi thông tin doanh nghiệp; cảnh mở file Excel là khung mô phỏng hiển thị đúng file công cụ xuất ra.",
"v08": "Lưu ý: dữ liệu trong video là dữ liệu thật đã thay đổi thông tin doanh nghiệp; thông tin người ký, cơ quan thuế là thông tin ví dụ minh họa; cảnh mở file Excel là khung mô phỏng hiển thị đúng file công cụ xuất ra.",
"v09": V09_NOTE_DATA}
URL = "https://quantritute.com/cong-cu/hoa-don-thue?nguon="
def hashtags(cap):
    t = [x for x in cap.rstrip().split("\n") if x.startswith("#")][-1]
    return t if "#botcongcuhoadon" in t else t + " #botcongcuhoadon"
def build(code, ch, old):
    b = head(code) + "\n\n" + BENEFIT[code] + "\n\n" + nav(code) + "\n\n"
    if ch == "tiktok": b += "Link dùng thử Đốm để ở phần Bio nhé. Anh chị dùng thử và góp ý giúp Đốm hoàn thiện thêm nha!"
    else: b += ("🔗 Dùng thử miễn phí: " + URL + "youtube" if ch == "youtube" else "🔗 Dùng thử: " + URL + "facebook") + "\n\n" + LUUY[code] + "\n\nAnh chị dùng thử và góp ý ở bình luận giúp Đốm nhé. Em cảm ơn anh chị!"
    return b + "\n\n" + hashtags(old)

def transform(v):
    c = v["code"]; n, ten, yt, _ = P[c]
    v = json.loads(json.dumps(v))
    v["title"] = f"{SERIES} – Phần {n}: {ten}"
    for ch in ("tiktok", "youtube", "facebook"): v[ch]["caption"] = build(c, ch, v[ch]["caption"])
    v["youtube"]["title"] = f"{SERIES} – Phần {n}/4: {yt}"
    note = v["youtube"]["note"]
    if "danh sách phát" not in note: note += f" Thêm vào danh sách phát \"{SERIES}\" (tạo 1 lần ở Phần 1)."
    v["youtube"]["note"] = note
    return v

src = open(SS, encoding="utf-8").read()
def seed(name):
    m = re.search(r"const " + name + r" = (\[.*?\n\]);", src, re.S); return json.loads(m.group(1))
base = {s["code"]: s for nm in ("SEED_V4", "SEED_V5", "SEED_V6") for s in seed(nm)}
base["v09"] = v09_seed()
V7 = [transform(base[c]) for c in ORDER]
for v in V7: assert len(v["youtube"]["title"]) <= 100, (v["code"], len(v["youtube"]["title"]))

# 1) studio-schema.js
if "SEED_V7" in src:
    src = re.sub(r"const SEED_V7 = \[.*?\n\];\n", lambda m: "const SEED_V7 = " + json.dumps(V7, ensure_ascii=False, indent=1) + ";\n", src, count=1, flags=re.S)
    src = src.replace("'_mig_studio_v7'", "'_mig_studio_v7b'")
    open(SS, "w", encoding="utf-8").write(src); print("studio-schema.js: thay nội dung SEED_V7 (khóa _mig_studio_v7b)")
else:
    shutil.copy(SS, SS + ".truoc-v7.bak")
    block = ("\n/* v06–v09 (20/10/2026, anh duyệt 15:42): gộp thành series \"" + SERIES + "\" Phần 1–4 – đổi tên, nội dung 3 kênh (chỉ bài chưa đăng), thumbnail mới; thêm v09 đăng T2 26/10/2026 19:00. */\n"
      "const SEED_V7 = " + json.dumps(V7, ensure_ascii=False, indent=1) + ";\n"
      """async function migrateV7(env) {
  try {
    if (await env.DB.prepare(`SELECT value FROM settings WHERE key = '_mig_studio_v7'`).first('value')) return;
    const t = Date.now(), st = [];
    for (const v of SEED_V7) {
      st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_items (code, title, kind, tool_slug, stage, plan_date, plan_time, duration, file_path, thumb_path, pin_comment, log, created_at, updated_at)
        VALUES (?1, ?2, 'demo', 'hoa-don-thue', 'saved', ?3, '19:00', ?4, ?5, ?6, ?7, '[]', ?8, ?8)`).bind(v.code, v.title, v.date, v.dur, v.file, v.thumb, v.pin, t));
      st.push(env.DB.prepare(`UPDATE video_items SET title = ?2, thumb_path = ?3, updated_at = ?4 WHERE code = ?1`).bind(v.code, v.title, v.thumb, t));
      for (const ch of ['tiktok', 'youtube', 'facebook']) {
        const c = v[ch];
        st.push(env.DB.prepare(`INSERT OR IGNORE INTO video_posts (video_id, channel, status, created_at, updated_at) SELECT id, ?2, 'todo', ?3, ?3 FROM video_items WHERE code = ?1`).bind(v.code, ch, t));
        st.push(env.DB.prepare(`UPDATE video_posts SET title = ?3, caption = ?4, tags = ?5, note = ?6, updated_at = ?7
          WHERE channel = ?2 AND status <> 'posted' AND video_id = (SELECT id FROM video_items WHERE code = ?1)`).bind(v.code, ch, c.title || '', c.caption || '', c.tags || '', c.note || '', t));
      }
    }
    st.push(env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('_mig_studio_v7', '1')`));
    await env.DB.batch(st);
  } catch (e) { console.error('studio v7', e); }
}
""")
    src = src.replace("\nexport async function ensureStudioSchema", block + "\nexport async function ensureStudioSchema", 1)
    a = "await migrateV5(env); return migrateV6(env); }"; assert a in src; src = src.replace(a, "await migrateV5(env); await migrateV6(env); return migrateV7(env); }")
    a = "  await migrateV6(env);\n}"; assert a in src; src = src.replace(a, "  await migrateV6(env);\n  await migrateV7(env);\n}")
    open(SS, "w", encoding="utf-8").write(src); print("studio-schema.js: thêm SEED_V7 + migrateV7")

# 2) Bảng lịch HTML
h = open(LICH, encoding="utf-8").read()
m = re.search(r"const DATA = (\[.*?\]);\n", h, re.S); D = json.loads(m.group(1))
idx = {d["code"]: d for d in D}
for v in V7:
    c = v["code"]; d = idx.get(c)
    if d is None:
        d = {"code": c, "so": "9", "thu": "Thứ hai", "ngay": "26/10/2026", "loai": "Hướng dẫn công cụ", "dai": "68 giây", "video": v["file"], "thumb": v["thumb"], "ghim": v["pin"]}
        D.append(d)
    d["ten"] = v["title"]
    d["tiktok"] = dict(d.get("tiktok", {}), caption=v["tiktok"]["caption"], note=v["tiktok"]["note"])
    d["youtube"] = dict(d.get("youtube", {}), title=v["youtube"]["title"], caption=v["youtube"]["caption"], desc=v["youtube"]["caption"], tags=v["youtube"]["tags"], note=v["youtube"]["note"])
    d["facebook"] = dict(d.get("facebook", {}), caption=v["facebook"]["caption"], note=v["facebook"]["note"])
if not os.path.exists(LICH + ".truoc-v7.bak"): shutil.copy(LICH, LICH + ".truoc-v7.bak")
h = h[:m.start(1)] + json.dumps(D, ensure_ascii=False) + h[m.end(1):]
open(LICH, "w", encoding="utf-8").write(h); print("Lịch HTML:", len(D), "video")

# 3) youtube-vNN.md
for v in V7:
    c = v["code"]; n, ten, _, thu = P[c]; d = idx.get(c) or D[-1]
    out = TAP + thu + "/xuat/youtube-" + c + ".md"
    if os.path.exists(out):
        os.makedirs(TAP + thu + "/xuat/_thumb-cu", exist_ok=True); bk = TAP + thu + "/xuat/_thumb-cu/youtube-" + c + "-cu.md"
        if not os.path.exists(bk): shutil.copy(out, bk)
    md = f"""# Nội dung đăng – {c} · {SERIES} – Phần {n}/4: {ten}

Lịch: **{d['thu']} {d['ngay']}, 19:00** · 3 kênh · file: `Video xây kênh/Source hoàn thiện/{os.path.basename(v['file'].replace(chr(92), '/'))}`
Hình thu nhỏ (series, PHẦN {n}/4 + nút "{ten.upper()}"): `xuat/thumb-doc-luoi-1080x1920.png` (TikTok, Shorts, Reels) · `xuat/thumb-ngang-1280x720.png` (YouTube)
Xưng hô: chỉ có Đốm → "Đốm/em" + "anh chị". Bình luận ghim: {v['pin']}

## TikTok
{v['tiktok']['caption']}

## YouTube
**Tiêu đề:** {v['youtube']['title']}

**Mô tả:**
{v['youtube']['caption']}

**Thẻ:** {v['youtube']['tags']}

**Ghi chú:** {v['youtube']['note']}

## Facebook (Reels)
{v['facebook']['caption']}
"""
    open(out, "w", encoding="utf-8").write(md); print("viết", out.split("tap/")[1])
json.dump(V7, open(os.path.dirname(os.path.abspath(__file__)) + "/series-v06-v09.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
for v in V7: print(v["code"], len(v["youtube"]["title"]), v["youtube"]["title"])
