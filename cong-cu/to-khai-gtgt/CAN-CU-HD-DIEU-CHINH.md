# Căn cứ kê khai hóa đơn điều chỉnh / thay thế (đọc nguyên văn 28/10/2026)

Văn bản anh gửi 28/10/2026: TT 91/2026/TT-BTC, NĐ 254/2026/NĐ-CP, NĐ 252/2026/NĐ-CP (cùng ban hành 30/06/2026), mẫu 01/KHBS.

## Nguyên văn đã đọc
| Căn cứ | Nội dung |
|---|---|
| TT 91/2026 Điều 10 khoản 1 điểm b | HĐ lập sai MST, hàng hóa, số tiền, thuế suất, tiền thuế… → người bán chọn **điều chỉnh** (ghi "Điều chỉnh cho hóa đơn Mẫu số… ký hiệu… số… ngày…") hoặc **thay thế** (ghi "Thay thế cho hóa đơn…"). Phải có văn bản thỏa thuận (người mua là tổ chức, HKD). |
| TT 91/2026 Điều 10 khoản 1 điểm c | HĐ máy tính tiền lập sai → **chỉ lập HĐ thay thế**. |
| TT 91/2026 Điều 10 khoản 5 | Không phải sai sót: thay đổi giá trị khi quyết toán, **chiết khấu thương mại**, **trả lại hàng**, hoàn/giảm phí bảo hiểm, hủy giao dịch thu tiền trước, hoàn phí ngân hàng, thẻ trả trước viễn thông, giá khí quy đổi. |
| TT 91/2026 Điều 10 khoản 6 điểm c | Điều chỉnh tăng ghi số dương, giảm ghi số âm. |
| **TT 91/2026 Điều 10 khoản 6 điểm d** | "Hóa đơn điều chỉnh đối với trường hợp quy định tại **khoản 5** Điều này thì **người bán kê khai vào kỳ phát sinh hóa đơn điều chỉnh, người mua kê khai vào kỳ nhận được hóa đơn điều chỉnh**." |
| NĐ 254/2026 | Không có quy định kỳ kê khai HĐ điều chỉnh/thay thế. |
| **NĐ 252/2026 Điều 12 khoản 6 điểm a** | Khai bổ sung **cho kỳ phát sinh sai, sót**; tăng thuế phải nộp → nộp đủ + tiền chậm nộp; giảm → giảm tiền chậm nộp, xử lý nộp thừa. "Trường hợp việc khai bổ sung làm tăng, giảm số thuế GTGT được khấu trừ chuyển kỳ sau thì người nộp thuế **khai số thuế chênh lệch tăng, giảm vào kỳ phát hiện sai, sót**." "Riêng trường hợp người nộp thuế phát hiện **số thuế GTGT đầu vào** khi kê khai, khấu trừ bị sai, sót thì thực hiện kê khai **theo quy định của pháp luật thuế GTGT**." |
| Mẫu 01/KHBS | [10] tăng/giảm thuế phải nộp, [11] phụ lục phân bổ, [12] tăng/giảm thuế được khấu trừ, [13] tăng/giảm thuế đề nghị hoàn; [14] tiền chậm nộp theo điểm b khoản 1 Điều 26 NĐ 252/2026. Số liệu = chênh lệch so với tờ khai liền trước (lần đầu / bổ sung lần trước); [10]+[11] = [07], [12] = [08], [13] = [09] phụ lục 01-1/KHBS. |

## Diễn giải để làm công cụ (CHƯA được kế toán xác nhận)
- **Điều chỉnh thương mại (khoản 5):** đã rõ – bán ra kê kỳ lập HĐ điều chỉnh, mua vào kê kỳ nhận → HĐ điều chỉnh có trong danh sách kỳ này thì tính kỳ này (công cụ đang làm đúng).
- **Sai sót (khoản 1) – bán ra:** TT 91 không nói kỳ; áp nguyên tắc chung NĐ 252 Đ12 k6a → khai bổ sung vào kỳ của HĐ gốc (kỳ phát sinh sai sót). Hệ quả:
  - Đang lập tờ khai kỳ HĐ gốc (chưa nộp) mà kỳ sau đã có HĐ điều chỉnh/thay thế do sai sót → đưa vào kỳ này (đúng nhu cầu anh Phương).
  - HĐ điều chỉnh/thay thế do sai sót nằm trong danh sách kỳ này nhưng HĐ gốc thuộc kỳ trước đã nộp → không tính kỳ này, khai bổ sung kỳ gốc (01/KHBS), trừ phần chỉ làm thay đổi thuế được khấu trừ chuyển kỳ sau → kê chênh lệch vào kỳ phát hiện.
- **Sai sót – mua vào (đã đọc nguyên văn 28/10):** Luật Thuế GTGT 48/2024 Điều 14 khoản 1 điểm đ và NĐ 181/2025 Điều 23 khoản 6: khai trước khi CQT công bố quyết định kiểm tra, thanh tra; (a) **khai bổ sung vào tháng, quý phát sinh** nếu làm tăng thuế phải nộp / giảm thuế được hoàn (nộp đủ + tiền chậm nộp); (b) **khai vào tháng, quý phát hiện** nếu làm giảm thuế phải nộp hoặc chỉ tăng/giảm thuế còn được khấu trừ chuyển kỳ sau. Chưa đọc Luật 09/2026/QH16 (có sửa Luật GTGT) – cần kiểm tra Điều 14 có bị sửa không.

## Cách công cụ áp dụng (bản 0.4.0, anh duyệt A + B 28/10)
- Mỗi HĐ điều chỉnh / thay thế có ô **Lý do**: Điều chỉnh thương mại → tính kỳ này; Sửa sai – HĐ gốc cùng kỳ → tính kỳ này; Sửa sai – HĐ gốc kỳ trước → bán ra: không tính, khai bổ sung kỳ gốc; mua vào: điều chỉnh tăng thuế đầu vào → tính kỳ này (kỳ phát hiện), còn lại → không tính, khai bổ sung kỳ gốc. Người dùng vẫn tick lại được (trường hợp chỉ ảnh hưởng thuế còn khấu trừ chuyển kỳ sau). HĐ thay thế có HĐ "đã bị thay thế" cùng đối tác trong kỳ → gợi ý "cùng kỳ"; chưa chọn → tạm tính + cảnh báo.
- Khung thêm dòng: chỉ "Điều chỉnh / Thay thế do sai sót", bắt buộc HĐ gốc (ký hiệu, số, ngày) **thuộc kỳ đang lập**; tìm thấy HĐ gốc thì tự điền; thay thế → HĐ gốc tự "Không tính".
- Chưa làm (C): số liệu khai bổ sung 01/KHBS theo từng kỳ gốc.
