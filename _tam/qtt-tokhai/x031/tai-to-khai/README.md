# Tải tờ khai thuế hàng loạt

- **Slug:** `tai-to-khai` (link trên web khi đưa lên: `/tools/tai-to-khai/`)
- **Nhóm:** Kế toán – Tài chính · miễn phí (anh chốt 02/11/2026)
- **Nỗi đau:** trên dichvucong.gdt.gov.vn/tthc/tchs: tra tối đa 30 ngày/lần, mỗi lần nhập mã xác nhận, không tải hàng loạt, mở từng tờ khai xong phải tra lại, nộp nhiều lần phải tự so.
- **Trạng thái:** Bản 0.3.1 (02/11/2026) – kiểm giả lập đạt; **chờ anh test thật lần 2**. CHƯA đưa lên web (chưa có bản ghi database, chưa chạy `cap-nhat.cmd`).
- **Đề xuất anh duyệt:** https://claude.ai/artifact/Pqao8YBSA9bNCcpgevwAtq · kỹ thuật cổng: `../Công cụ sẽ làm/Tải tờ khai hàng loạt/NGHIEN-CUU.md`

## Cấu trúc
| Đường dẫn | Là gì |
|---|---|
| `app/index.html` | Trang công cụ (1 file): nút bookmark "Tải tờ khai", hướng dẫn, ảnh bảng điều khiển, hỏi đáp |
| `nguon/src/tk-panel.js` | Bảng điều khiển chạy trên trang thuế |
| `nguon/src/hd-core.js` | Lõi dùng chung, chép nguyên từ Bộ xử lý hóa đơn (ZIP, Excel, ngày, nhật ký) – sửa lõi bên đó thì chép lại |
| `nguon/src/app.html`, `style.css` | Khung trang công cụ |
| `nguon/build.js` | Ráp file: `npm i terser@5.31.0` rồi `node build.js` (trong `nguon`) → `build/index.html` (chép sang `app/`), `build/bookmarklet.txt` |
| `nguon/test/mock_test.py` | Kiểm thử Playwright trên cổng giả lập: `python mock_test.py full` · `429` · `relog` · `shot` (chụp ảnh bảng điều khiển → `panelshot.txt`) |

## Bản 0.3.1 (02/11/2026 – test thật 17:04, năm 2025: 10 hồ sơ đủ, 5 thông báo báo lỗi)
- Cổng trả 500 "Tải file thất bại." cho một số thông báo (thường là thông báo thứ 2–3 của hồ sơ tháng 09/2025), gọi lại 4 lần vẫn lỗi → tờ khai vẫn tải đủ, chỉ thiếu thông báo. Bản 0.3.0 ghi chung vào "hồ sơ / thông báo tải bị lỗi" gây hiểu nhầm hồ sơ chưa tải.
- Sửa: tách 2 mục trong HS-chua-tai-duoc.txt (HỒ SƠ chưa tải / THÔNG BÁO chưa tải – tờ khai đã đủ); bảng kết quả & Excel ghi "Đã tải (thiếu N thông báo)"; lỗi "Tải file thất bại" không gọi lại vô ích (tiết kiệm ~15 giây/thông báo); nhật ký ghi tên hàm + thuộc tính của nút thông báo lạ để tìm nguyên nhân.
- Chưa rõ nguyên nhân phía cổng: cần kiểm 1 hồ sơ trên cổng (bấm tay Tải xuống thông báo đó).

## Bản 0.3.0 (02/11/2026 – anh duyệt 4 đề xuất: không phải ngồi canh gõ mã)
- Khi cần gõ mã (từ tháng thứ 2): **chuông** (Web Audio, nhắc lại mỗi 30 giây), **nhấp nháy tên tab** "🔔 Cần gõ mã xác nhận", **thông báo hệ thống** (Notification, xin quyền khi bấm Tra cứu & tải; chỉ hiện khi tab không được chú ý). Tắt được bằng ô "Gọi khi cần gõ mã" (nhớ trên trình duyệt).
- Trong lúc tải: "Còn N tháng nữa. Tháng sau cần gõ mã sau khoảng X giây".
- Chế độ **Đầy đủ – kèm thông báo của CQT** / **Tải nhanh – chỉ tờ khai** (thay ô tick cũ).
- Mẹo trên bảng: mở trang thuế ở cửa sổ Chrome riêng (Chrome làm chậm tab ẩn lâu).
- Giả lập: full, nhanh (báo "tháng sau cần mã sau khoảng 7 giây"), shot – đạt.

## Bản 0.2.0 (02/11/2026 – test thật lần 1: 45 hồ sơ 01/01–31/10/2026, 28 lỗi)
- **Nguyên nhân (đọc nhật ký anh gửi):** cổng chỉ cho tải hồ sơ thuộc **lần tra gần nhất**. Bản 0.1.0 tra hết 10 tháng rồi mới tải → chỉ hồ sơ tháng 10 tải được, các tháng khác cổng báo 500 "Hồ sơ truyền lên không hợp lệ". Mỗi lỗi lại bị thử lại 3 lần (chờ 2–4–8 giây) nên chạy rất lâu.
- **Sửa:** tra xong tháng nào **tải luôn tháng đó** rồi mới hỏi mã tháng sau (số mã không đổi: 1 mã/tháng). Lỗi "không hợp lệ" không thử lại vô ích: đọc lại trang chứa hồ sơ (không gửi mã) rồi thử đúng 1 lần.
- Bỏ bước chọn sau khi tra (không còn chọn được vì phải tải ngay). Thay bằng ô **"Chỉ giữ lần hiệu lực cuối của mỗi kỳ"** đặt trước khi tra: tải đủ, khi đóng ZIP chỉ giữ lần cuối (hồ sơ hủy / không chấp nhận không tải); Excel vẫn liệt kê đủ, cột Kết quả tải ghi rõ.
- Hết phiên / Dừng: tự lưu ZIP phần đã tải (`_chua-xong`); lần sau bấm nút → "Điền sẵn khoảng ngày còn lại" (từ đầu tháng đang dở).
- Bảng kết quả hiện sau khi tải, có cột Tải (Đã tải + số TB / Lỗi / Bỏ).
- Giả lập đã thêm đúng ràng buộc "chỉ tải hồ sơ của lần tra gần nhất": full, last, 429, relog đều đạt.

## Cách hoạt động (theo khảo sát cổng thật 02/11/2026)
1. Mở `/tthc/tchs` để kiểm tra đăng nhập, lấy mã CSRF và danh mục loại tờ khai.
2. (Từ bản 0.2.0: tra tháng nào tải luôn tháng đó – xem mục trên.) Chia khoảng ngày nộp theo **từng tháng dương lịch** (luôn ≤ 30 ngày chênh lệch, đúng giới hạn cổng). Mỗi tháng: hiện ảnh `/tthc/getCaptcha`, **người dùng tự gõ mã** → `GET /tthc/ho-so/search` (giống hệt lệnh của trang). Sai mã → cổng báo lỗi → hỏi mã mới, không gửi lặp mã cũ.
3. Tháng > 10 hồ sơ: đọc lại theo trang 50 dòng, mã để trống – đúng cách lật trang của cổng.
4. Gom theo **tờ khai + kỳ tính thuế**, xếp theo ngày nộp; **lần hiệu lực cuối** = lần nộp sau cùng, bỏ qua trạng thái hủy / từ chối / không chấp nhận; cảnh báo lần cuối chưa có kết quả.
5. Tải: `POST /tthc/tchs/downloadhoso {maHoSo}` (ZIP: XML tờ khai + đính kèm) và nếu tick "Kèm thông báo": trang chi tiết `/tthc/tchs/files/detail/<mã>` → `POST /tthc/tchs/downloadthongbao {idTbao}`.
6. Nhịp 1,2 giây/lệnh; cổng báo 429 → giãn thêm 0,8 giây và chờ 6–12–24 giây.
7. Hết phiên (cổng chuyển về trang đăng nhập / 401 / 403): dừng, nút "Lưu phần đã tải"; danh sách còn lại ghi vào trình duyệt (3 ngày) → đăng nhập lại, bấm nút → "Tải tiếp phần còn lại" → ZIP `_phan2`.
8. **Không** gọi lệnh nộp / bổ sung / hủy; không tự đọc mã; không giữ phiên.

## File ZIP nhận về
`ToKhai_<MST>_<ddmmyyyy>-<ddmmyyyy>.zip` gồm thư mục theo tờ khai (`01-GTGT/`, `05-KK-TNCN/`…), tên file `01-GTGT_Q3-2026_Lan2_BoSung1_nop-20-10-2026_00090001.xml` (+ `_DinhKemN.pdf`, `_TBN_<tên thông báo>.xml`), `Bang-ke-to-khai.xlsx` (sheet Danh sách hồ sơ · Theo tờ khai & kỳ, ngày dd/mm/yyyy kiểu ngày thật), `HS-chua-tai-duoc.txt` (nếu có), `danh-sach.json`, `nhat-ky.txt`.

## Đã kiểm thử (cổng giả lập, Playwright – 02/11/2026)
- 2 tháng, 17 hồ sơ (tháng 10 có 14 hồ sơ → lật trang 50), gõ sai mã 1 lần → báo lỗi, gõ lại → đúng; 4 lần nộp 01/GTGT Q3 (1 "Không chấp nhận", lần cuối "Đang xử lý") → chọn đúng lần 4; "Chỉ chọn lần hiệu lực cuối" 12/17.
- Tải 16/17 + 32 thông báo, 1 hồ sơ lỗi 500 → ghi `HS-chua-tai-duoc.txt`; Excel mở bằng openpyxl đúng 2 sheet.
- Cổng báo 429 → tự chờ, vẫn đủ. Hết phiên ở hồ sơ thứ 5 → lưu phần 1 (4 hồ sơ), tải tiếp phần 2 (12 + 1 lỗi), bảng kê phần 2 ghi "Đã tải ở phần trước".
- **Chưa kiểm trên cổng thật:** cổng trả gì khi gõ sai mã (giả lập theo tab Thuế điện tử: lỗi "Mã captcha không chính xác"); tháng không có hồ sơ; hết phiên thật; tháng > 50 hồ sơ; tài khoản đại lý thuế (khai thay); Firefox/Safari.

## Bước tiếp theo
1. Anh test thật (mục "Test thật" trong file tiến độ chung).
2. Anh duyệt → làm ảnh 1280×720, migration bản ghi database (`_mig_tools_*`), bài hướng dẫn SEO, rồi `.\cap-nhat.cmd`.
3. Bản sau: tab Thuế điện tử (hồ sơ trước 01/07/2025), khai thay đại lý thuế, đọc số liệu chính trong XML (VD chỉ tiêu [40] 01/GTGT qua các lần nộp).
