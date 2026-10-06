# Cẩm nang Thuế – Kế toán – Lao động 2026 · Chỉ mục căn cứ pháp lý & quy trình theo dõi văn bản mới

Cập nhật: 05/10/2026 · Sinh từ `cong-cu/cam-nang-thue-2026/app/index.html` bằng `npm run legal:index` (nguồn sự thật là file cẩm nang, file này chỉ để tra).

## Cơ chế theo dõi (2 lớp, chạy song song)
| Lớp | Chạy ở đâu | Lịch | Làm gì | Đầu ra |
|---|---|---|---|---|
| Giai đoạn 2 – tự động | Cloudflare Worker `quantritute-watch` + nút "Quét ngay" trong quản trị | 08:00 các ngày 1, 4, 7… (≈3 ngày/lần) | Đọc 5 danh sách văn bản chinhphu.vn, chấm điểm theo chỉ mục dưới, đọc trang chi tiết, AI tóm tắt | Bảng `legal_docs` trạng thái *Chờ duyệt* → anh duyệt → hiện trên cẩm nang |
| Giai đoạn 1 – kiểm tra chéo | Tác vụ định kỳ Cowork (Claude) | 08:50 cùng các ngày | Đọc lại cùng nguồn, đối chiếu chỉ mục, tìm văn bản bộ lọc có thể bỏ sót, ghi báo cáo | Mục "Nhật ký kiểm tra chéo" cuối file này + email nháp cho anh |

Nguyên tắc: không văn bản nào lên trang cẩm nang khi anh chưa duyệt. Tóm tắt chỉ dựa trên trích yếu và trang thông tin; con số chỉ ghi khi đã đọc toàn văn.

## Danh sách nguồn đọc
- https://chinhphu.vn/he-thong-van-ban?classid=0&mode=1 (Văn bản mới, ~5 ngày gần nhất)
- https://chinhphu.vn/he-thong-van-ban?classid=1&mode=1 (Văn bản QPPL)
- https://chinhphu.vn/he-thong-van-ban?classid=1&mode=1&orggroupid=4 (VBQPPL của Bộ – có Thông tư BTC, BNV)
- https://chinhphu.vn/he-thong-van-ban?classid=2&mode=1 (Văn bản chỉ đạo điều hành – công văn VPCP)
- https://chinhphu.vn/he-thong-van-ban?classid=1&mode=1&orggroupid=1 (Quốc hội)
- Trang chi tiết: https://chinhphu.vn/?pageid=27160&docid=<docid> (có ngày hiệu lực, loại, cơ quan)

## Chỉ mục theo chủ đề

### gtgt – Thuế Giá trị gia tăng (GTGT)
- 48/2024/QH15 · Luật · Luật Thuế giá trị gia tăng · HL 01/07/2025 · Còn hiệu lực
- 90/2025/QH15 · Luật SĐBS · Luật sửa đổi Luật Đấu thầu, Đầu tư PPP, Hải quan, Thuế GTGT, Thuế XNK, Đầu tư, Đầu tư công, Quản lý tài sản công · HL 01/07/2025 · Còn hiệu lực
- 149/2025/QH15 · Luật SĐBS · Luật sửa đổi, bổ sung một số điều của Luật Thuế GTGT · HL 01/01/2026 · Còn hiệu lực
- 09/2026/QH16 · Luật SĐBS · Luật sửa đổi Luật Thuế TNCN, GTGT, TNDN và TTĐB · HL 01/01/2026 (Điều 1-3) · Còn hiệu lực
- 204/2025/QH15 · Nghị quyết · Về giảm thuế giá trị gia tăng · HL 01/07/2025 – 31/12/2026 · Còn hiệu lực (đến 31/12/2026)
- 174/2025/NĐ-CP · Nghị định · Quy định chính sách giảm thuế giá trị gia tăng theo Nghị quyết 204/2025/QH15 · HL 01/07/2025 – 31/12/2026 · Còn hiệu lực
- 181/2025/NĐ-CP · Nghị định · Quy định chi tiết thi hành một số điều của Luật Thuế GTGT · HL 01/07/2025 · Còn hiệu lực
- 359/2025/NĐ-CP · Nghị định SĐBS · Sửa đổi, bổ sung một số điều của Nghị định 181/2025/NĐ-CP · HL 01/01/2026 · Còn hiệu lực
- 144/2026/NĐ-CP · Nghị định SĐBS · Sửa đổi, bổ sung một số điều của Nghị định 181/2025/NĐ-CP (đã được sửa đổi bởi Nghị định 359/2025/NĐ-CP) · HL 20/06/2026 · Còn hiệu lực
- 69/2025/TT-BTC · Thông tư · Quy định chi tiết Luật Thuế GTGT và hướng dẫn Nghị định 181/2025/NĐ-CP · HL 01/07/2025 · Còn hiệu lực
- 114/VBHN-VPQH · VBHN · Văn bản hợp nhất Luật Thuế giá trị gia tăng · HL 06/06/2026 (ngày Văn phòng Quốc hội công bố) · Còn giá trị tra cứu
- 141/2026/NĐ-CP · Nghị định SĐBS · Sửa đổi, bổ sung Nghị định 68/2026/NĐ-CP và Nghị định 320/2025/NĐ-CP về chính sách thuế hộ kinh doanh, cá nhân kinh doanh và thuế TNDN · HL 01/01/2026 (ban hành 29/04/2026) · Còn hiệu lực
- Từ khóa: thuế giá trị gia tăng, GTGT, hoàn thuế, khấu trừ thuế

### hoadon – Hóa đơn & Chứng từ điện tử
- 254/2026/NĐ-CP · Nghị định · Quy định về hóa đơn, chứng từ điện tử · HL 01/07/2026 · Còn hiệu lực
- 68/2026/NĐ-CP · Nghị định · Chính sách thuế và quản lý thuế đối với hộ kinh doanh, cá nhân kinh doanh · HL 05/03/2026 · Còn hiệu lực (đã sửa đổi)
- 310/2025/NĐ-CP · Nghị định SĐBS · Sửa đổi quy định xử phạt vi phạm hành chính về thuế, hóa đơn · HL 16/01/2026 · Còn hiệu lực
- 91/2026/TT-BTC · Thông tư · Quy định chi tiết Luật Quản lý thuế và Nghị định 254/2026/NĐ-CP về hóa đơn, chứng từ điện tử · HL 01/07/2026 · Còn hiệu lực
- Từ khóa: hóa đơn, hoá đơn, chứng từ điện tử, chứng từ khấu trừ, máy tính tiền

### tndn – Thuế Thu nhập doanh nghiệp (TNDN)
- 67/2025/QH15 · Luật · Luật Thuế thu nhập doanh nghiệp · HL 01/10/2025 (áp dụng từ kỳ tính thuế 2025) · Còn hiệu lực
- 09/2026/QH16 · Luật SĐBS · Luật sửa đổi Luật Thuế TNCN, GTGT, TNDN và TTĐB · HL 01/07/2026 · Còn hiệu lực
- 320/2025/NĐ-CP · Nghị định · Quy định chi tiết một số điều và biện pháp thi hành Luật Thuế TNDN · HL Ban hành 15/12/2025 (áp dụng kỳ 2025) · Còn hiệu lực
- 20/2026/TT-BTC · Thông tư · Quy định chi tiết Luật Thuế TNDN và Nghị định 320/2025/NĐ-CP · HL 12/03/2026 (áp dụng từ kỳ 2025) · Còn hiệu lực
- 113/VBHN-VPQH · VBHN · Văn bản hợp nhất Luật Thuế thu nhập doanh nghiệp · HL 04/06/2026 (ngày Văn phòng Quốc hội công bố) · Còn giá trị tra cứu
- Từ khóa: thu nhập doanh nghiệp, TNDN, ưu đãi thuế

### tncn – Thuế Thu nhập cá nhân (TNCN)
- 109/2025/QH15 · Luật SĐBS · Luật Thuế thu nhập cá nhân (sửa đổi) · HL 01/07/2026 · Còn hiệu lực
- 09/2026/QH16 · Luật SĐBS · Luật sửa đổi Luật Thuế TNCN, GTGT, TNDN và TTĐB · HL 01/07/2026 · Còn hiệu lực
- 253/2026/NĐ-CP · Nghị định · Quy định chi tiết một số điều và biện pháp thi hành Luật Thuế TNCN · HL 01/07/2026 (ban hành 30/06/2026) · Còn hiệu lực
- 87/2026/TT-BTC · Thông tư · Quy định chi tiết Luật Thuế TNCN và Nghị định 253/2026/NĐ-CP · HL 01/07/2026 · Còn hiệu lực
- Từ khóa: thu nhập cá nhân, TNCN, giảm trừ gia cảnh

### gdlk – Giao dịch liên kết
- 255/2026/NĐ-CP · Nghị định · Quản lý thuế đối với giao dịch liên kết của doanh nghiệp có quan hệ liên kết · HL 01/07/2026 (áp dụng kỳ TNDN 2026) · Còn hiệu lực — đã xác minh toàn văn (bản ký, 30/6/2026)
- Từ khóa: giao dịch liên kết, chuyển giá

### qlt – Quản lý thuế chung
- 108/2025/QH15 · Luật SĐBS · Luật Quản lý thuế (sửa đổi) · HL 01/07/2026 (riêng hộ KD & hóa đơn điện tử: 01/01/2026) · Còn hiệu lực
- 252/2026/NĐ-CP · Nghị định · Quy định chi tiết và biện pháp thi hành Luật Quản lý thuế · HL 01/07/2026 · Còn hiệu lực
- 89/2026/TT-BTC · Thông tư · Quy định chi tiết Luật Quản lý thuế và Nghị định 252/2026/NĐ-CP · HL 01/07/2026 · Còn hiệu lực
- 99/2025/TT-BTC · Thông tư · Hướng dẫn Chế độ kế toán doanh nghiệp · HL 01/01/2026 · Còn hiệu lực
- Từ khóa: quản lý thuế, chế độ kế toán, chuẩn mực kế toán, Luật Kế toán, kế toán, kiểm toán, hộ kinh doanh, cá nhân kinh doanh, lệ phí môn bài, xử phạt vi phạm hành chính về thuế, khai thuế, nộp thuế, tiền thuế, mã số thuế, đăng ký thuế, gia hạn thời hạn nộp, miễn thuế, giảm thuế, thuế tiêu thụ đặc biệt, thuế bảo vệ môi trường, thuế suất

### hdld – HĐLĐ - Lao động
- 45/2019/QH14 · Bộ luật · Bộ luật Lao động · HL 01/01/2021 · Còn hiệu lực
- Từ khóa: Bộ luật Lao động, hợp đồng lao động, người lao động, tiền lương, lương tối thiểu, thời giờ làm việc, thời giờ nghỉ ngơi, an toàn, vệ sinh lao động, công đoàn, Luật Việc làm, việc làm, kỷ luật lao động

### bhxh – Bảo hiểm xã hội (BHXH)
- 41/2024/QH15 · Luật · Luật Bảo hiểm xã hội · HL 01/07/2025 · Còn hiệu lực
- 158/2025/NĐ-CP · Nghị định · Quy định chi tiết và hướng dẫn thi hành Luật BHXH về BHXH bắt buộc · HL 01/07/2025 · Còn hiệu lực
- Từ khóa: bảo hiểm xã hội, BHXH, bảo hiểm thất nghiệp, bảo hiểm y tế, bảo hiểm tai nạn lao động, lương hưu, trợ cấp hưu trí

### Số hiệu khác đã được nhắc trong cẩm nang (228)
123/2020/NĐ-CP, 2026/TT-BTC, 125/2020/NĐ-CP, 2014/TT-BTC, 2015/TT-BTC, 132/2020/NĐ-CP, 20/2025/NĐ-CP, 80/2021/TT-BTC, 2025/TT-BTC, 58/2014/QH13, 88/2015/QH13, 38/2019/QH14, 56/2024/QH15, 126/2020/NĐ-CP, 78/2014/TT-BTC, 96/2015/TT-BTC, 103/2014/TT-BTC, 119/2014/TT-BTC, 151/2014/TT-BTC, 130/2016/TT-BTC, 25/2018/TT-BTC, 67/2022/TT-BTC, 83/2016/TT-BTC, 128/2011/TT-BTC, 12/2015/NĐ-CP, 218/2013/NĐ-CP, 156/2013/TT-BTC, 111/2013/TT-BTC, 219/2013/TT-BTC, 08/2013/TT-BTC, 85/2011/TT-BTC, 39/2014/TT-BTC, 91/2014/NĐ-CP, 100/2016/NĐ-CP, 146/2017/NĐ-CP, 118/2015/NĐ-CP, 04/2007/QH12, 26/2012/QH13, 71/2014/QH13, 31/2024/QH15, 56/2025/QH15, 71/2025/QH15, 93/2025/QH15, 13/2008/QH12, 31/2013/QH13, 106/2016/QH13, 22/2023/QH15, 27/2023/QH15, 43/2024/QH15, 47/2024/QH15, 20/2017/QH14, 57/2024/QH15, 58/2024/QH15, 61/2020/QH14, 72/2020/QH14, 03/2022/QH15, 05/2022/QH15, 08/2022/QH15, 09/2022/QH15, 20/2023/QH15, 26/2023/QH15, 28/2023/QH15, 33/2024/QH15, 43/2018/QĐ-TTg, 27/2008/QH12, 70/2014/QH13, 66/2025/QH15, 117/2025/NĐ-CP, 06/2021/NĐ-CP, 72/2015/NĐ-CP, 68/2016/NĐ-CP, 67/2020/NĐ-CP, 52/2024/NĐ-CP, 209/2013/NĐ-CP, 49/2022/NĐ-CP, 134/2016/NĐ-CP, 18/2021/NĐ-CP, 26/2023/NĐ-CP, 13/2023/TT-BTC, 193/2015/TT-BTC, 173/2016/TT-BTC, 26/2015/TT-BTC, 82/2018/TT-BTC, 43/2021/TT-BTC, 09/2011/TT-BTC, 93/2017/TT-BTC, 203/2025/QH15, 64/2020/QH14, 35/2024/QH15, 54/2014/QH13, 35/2018/QH14, 07/2022/QH15, 107/2016/QH13, 15/2017/QH14, 24/2023/QH15, 116/2025/QH15, 127/2025/QH15, 133/2025/QH15, 141/2025/QH15, 143/2025/QH15, 08/2019/NĐ-CP, 349/2025/NĐ-CP, 265/2025/NĐ-CP, 267/2025/NĐ-CP, 268/2025/NĐ-CP, 353/2025/NĐ-CP, 65/2013/NĐ-CP, 92/2015/TT-BTC, 79/2022/TT-BTC, 14/2008/QH12, 32/2013/QH13, 12/2022/QH15, 15/2023/QH15, 21/2008/QH12, 182/2024/NĐ-CP, 60/2021/NĐ-CP, 111/2025/NĐ-CP, 126/2024/NĐ-CP, 107/2023/QH15, 206/2025/QH15, 31/2021/NĐ-CP, 239/2025/NĐ-CP, 198/2025/QH15, 57/2021/NĐ-CP, 86/2015/QH13, 24/2018/QH14, 41/2019/QH14, 59/2024/QH15, 86/2025/QH15, 54/2022/QH15, 67/2014/QH13, 236/2025/NĐ-CP, 32/2024/QH15, 96/2025/QH15, 139/2025/QH15, 194/2025/NĐ-CP, 186/2025/NĐ-CP, 362/2025/NĐ-CP, 347/2025/NĐ-CP, 41/2022/NĐ-CP, 70/2025/NĐ-CP, 15/2022/NĐ-CP, 43/2022/QH15, 168/2025/NĐ-CP, 291/2026/NĐ-CP, 102/2021/NĐ-CP, 94/2026/TT-BTC, 51/2010/NĐ-CP, 04/2014/NĐ-CP, 32/2025/TT-BTC, 142/2025/QH15, 278/2025/NĐ-CP, 217/2025/NĐ-CP, 296/2025/NĐ-CP, 91/2022/NĐ-CP, 49/2025/NĐ-CP, 373/2025/NĐ-CP, 72/2025/QH15, 118/2025/NĐ-CP, 367/2025/NĐ-CP, 18/2026/TT-BTC, 50/2026/TT-BTC, 254/2025/NĐ-CP, 312/2025/NĐ-CP, 360/2025/NĐ-CP, 05/2025/NQ-CP, 41/2026/TT-BTC, 89/2025/QH15, 313/2025/NĐ-CP, 50/2020/NĐ-CP, 242/2025/NĐ-CP, 119/2026/NĐ-CP, 230/2025/NĐ-CP, 18/2018/TT-BLĐTBXH, 179/2013/TT-BTC, 96/2016/TT-BTC, 97/2016/TT-BTC, 84/2016/TT-BTC, 19/2021/TT-BTC, 46/2024/TT-BTC, 94/2025/TT-BTC, 40/2021/TT-BTC, 21/2026/TT-BTC, 12/2010/TTLT-BKHĐT-BTC, 119/2009/QĐ-TTg, 43/2023/TT-BTC, 40/2025/TT-BTC, 158/2025/TT-BTC, 328/2016/TT-BTC, 72/2021/TT-BTC, 200/2014/TT-BTC, 75/2015/TT-BTC, 53/2016/TT-BTC, 195/2012/TT-BTC, 21/2006/TT-BTC, 202/2014/TT-BTC, 84/2015/QH13, 92/2015/QH13, 10/2012/QH13, 38/2013/QH13, 39/2009/QH12, 2015/QH13, 2013/QH13, 93/2015/QH13, 2019/QH14, 01/2003/NĐ-CP, 09/1998/NĐ-CP, 142/2024/QH15, 91/2000/QĐ-TTg, 613/QĐ-TTg, 142/2008/QĐ-TTg, 38/2010/QĐ-TTg, 53/2010/QĐ-TTg, 62/2011/QĐ-TTg, 205/2004/NĐ-CP, 115/2015/NĐ-CP, 33/2023/NĐ-CP, 92/2009/NĐ-CP, 29/2013/NĐ-CP, 34/2019/NĐ-CP, 47/2002/QĐ-TTg, 290/2005/QĐ-TTg, 92/2005/QĐ-TTg, 88/2020/NĐ-CP, 58/2020/NĐ-CP, 143/2018/NĐ-CP, 135/2020/NĐ-CP, 12/TT-LB

## Nhật ký kiểm tra chéo
- 05/10/2026 (lần chạy thử đầu, dữ liệu thật từ chinhphu.vn): bộ lọc chọn 7/40 văn bản mẫu. Đáng chú ý nhất: **43/2026/QH16** (24/08/2026) "Về giảm thuế thu nhập cá nhân, thuế thu nhập doanh nghiệp đối với cá nhân và doanh nghiệp" – cẩm nang CHƯA nhắc tới. Nên xem thêm: 43/2026/NQ-CP (30/09/2026, kéo dài thuế GTGT/BVMT xăng dầu), 19/2026/QH16 (12/04/2026, thuế BVMT/GTGT/TTĐB xăng dầu – cũ hơn 60 ngày, cẩm nang chưa nhắc), 10065/VPCP-KGVX (nghỉ Lễ, Tết 2026–2027), 371/2026/NĐ-CP (lao động Việt Nam làm cho tổ chức nước ngoài). Các nhận định trên chỉ dựa trên trích yếu, chưa đọc toàn văn.
