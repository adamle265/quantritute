import sys,io
p=sys.argv[1]
s=io.open(p,encoding='utf-8').read()
s=s.replace("Bản **1.4.1** (21/10/2026)","Bản **1.5.0** (22/10/2026 – chờ anh test & duyệt)",1)
s=s.replace("Xem `video/diem-noi-bat-truyen-thong.md` – 9 tính năng","Xem `video/diem-noi-bat-truyen-thong.md` – 9 tính năng (mục A) + 5 tính năng mở rộng ứng dụng 1.5.0 (mục D)",1)
s=s.replace("mig-v8.js                 ←","nguon/du-lieu-thu/kich-ban/ ← 10 file dữ liệu GIẢ để thử 5 kịch bản (hóa đơn, công nợ, nhân sự, sự kiện, 2 phiên bản)\nmig-v8.js                 ←",1)
add='''## Kiểm thử 22/10/2026 – bản 1.5.0 (dữ liệu giả `nguon/du-lieu-thu/kich-ban/`)
| Kịch bản | File | Kết quả |
|---|---|---|
| Sao kê ↔ sổ (có phí chuyển khoản, dung sai ± 20.000) | sao kê thêm 1 dòng bị trừ phí ↔ sổ ACB | 107 khớp + **1 khớp nhờ dung sai**, 1 cặp lệch ngày |
| Hóa đơn ↔ sổ | hd_A_bang_ke ↔ hd_B_so | **tự gộp File A theo số HĐ**, MST "0101-234-567" = "0101234567"; 38 khớp, 1 lệch thuế 5.000, 1 chỉ A, 1 chỉ B |
| Công nợ | cn_A_so131 ↔ cn_B_doitac | gộp theo mã đối tượng; 13 khớp, 1 lệch, 1 chỉ A |
| Nhân sự | ns_A_danhsach ↔ ns_B_chamcong | khóa họ tên bỏ dấu; 7 khớp, 1 chỉ A, 1 chỉ B |
| Sự kiện | sk_A_dangky ↔ sk_B_checkin | SĐT "0912 345 678" = "+84 912.345.678"; 3 khớp, 2 chưa đến, 1 đến chưa đăng ký |
| 2 phiên bản | pb_A_cu ↔ pb_B_moi | 17 khớp, 2 dòng sửa (**4 ô tô vàng** trên bảng + Excel), 1 dòng bị xoá, 1 dòng thêm |
| Hồi quy 01 ↔ 03 (200k dòng) | | 191.539 khớp / 8.461 chỉ A; kiểu 7: 1.742 lệch, 120 chỉ B – giữ nguyên |
| Hồi quy sao kê ↔ ACB, ca tách BHXH | | 108 khớp, 1 cặp lệch ngày; 1 nhóm 4 dòng = 20.000.000 – giữ nguyên |

'''
s=s.replace("## Nhật ký\n",add+"## Nhật ký\n- 22/10/2026 – Bản **1.5.0** (anh chọn 5 đề xuất P1 sau nghiên cứu mở rộng ứng dụng, xem `de-xuat-mo-rong-ung-dung.md`): (P1.4) Bước 1 có thẻ **\"Bạn đang cần đối chiếu gì?\"** – 7 kịch bản: Tự thiết lập, Sao kê ↔ TK 112, Hóa đơn ↔ sổ/bảng kê thuế, Công nợ theo đối tượng, Nhân sự ↔ chấm công/lương/BHXH, Đăng ký ↔ check-in, So 2 phiên bản; chọn xong bấm Tiếp tục là tự đặt khóa, làm sạch, kiểu ghép, cặp so sánh, gộp dòng (vẫn sửa được). (P1.1) **Dung sai số tiền** ± X đồng hoặc ± Y% (Tuỳ chọn nâng cao) – khớp chính xác trước, phần còn lại mới ghép theo dung sai; dòng khớp nhờ dung sai báo \"Lệch giá trị\" + thẻ \"Khớp nhờ dung sai\". (P1.2) Chuẩn hoá khóa: chỉ giữ chữ & số (KH-001 = KH001, MST có gạch), bỏ dấu tiếng Việt, chuẩn hoá SĐT (0912…, +84…, 84…). (P1.3) **Gộp dòng theo khóa** ở Bước 1 từng file: cộng các cột tiền, thêm cột \"Số dòng gộp\" (hóa đơn nhiều dòng hàng, công nợ nhiều phát sinh). (P1.5) So 2 phiên bản: ô bị sửa tô vàng trên bảng và trong Excel. Lưu/nạp thiết lập có đủ mục mới.\n",1)
io.open(p,'w',encoding='utf-8').write(s)
print('ok')
