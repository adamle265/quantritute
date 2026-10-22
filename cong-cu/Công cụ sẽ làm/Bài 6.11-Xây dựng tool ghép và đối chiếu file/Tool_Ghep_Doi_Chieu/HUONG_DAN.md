# Hướng dẫn cài đặt & sử dụng Tool Ghép & Đối Chiếu 2 File Excel

Tài liệu này viết cho người **chưa từng dùng code bao giờ**. Cứ làm theo từng bước là được.

## Tool này làm gì?

Tool giúp bạn **ghép 2 file Excel/CSV lại với nhau** theo một cột chung (giống hàm VLOOKUP/Power Query nhưng dễ dùng hơn, không cần biết công thức), và **đối chiếu** xem dữ liệu ở 2 file có khớp nhau không. Tool chạy ngay trên máy tính của bạn, dữ liệu **không gửi đi đâu cả** — không cần Internet sau khi cài xong.

## Yêu cầu

- Máy tính Windows hoặc macOS.
- Cần cài **Python** (miễn phí) — hướng dẫn cài ở dưới.
- Cần có Internet **một lần duy nhất** khi chạy tool lần đầu, để tải các thư viện cần thiết. Từ lần thứ 2 trở đi có thể dùng offline.

---

## Bước 1 — Cài đặt Python (chỉ cần làm 1 lần)

### Windows

1. Mở trình duyệt (Chrome/Edge), vào trang: **https://www.python.org/downloads/**
2. Bấm nút màu vàng **"Download Python 3.x.x"** để tải file cài đặt.
3. Mở file vừa tải (thường nằm trong thư mục Downloads), tên dạng `python-3.x.x-amd64.exe`.
4. **RẤT QUAN TRỌNG**: ở màn hình cài đặt đầu tiên, tích chọn ô vuông
   **"Add python.exe to PATH"** (hoặc "Add Python to PATH") ở phía dưới cùng, TRƯỚC KHI bấm Install.
   Nếu quên bước này, tool sẽ báo "không tìm thấy Python" dù đã cài xong.
5. Bấm **"Install Now"** và chờ cài đặt xong.
6. Xong! Có thể đóng cửa sổ cài đặt lại.

### macOS

1. Mở trình duyệt, vào trang: **https://www.python.org/downloads/**
2. Bấm nút tải bản dành cho macOS (file đuôi `.pkg`).
3. Mở file `.pkg` vừa tải, làm theo các bước cài đặt (bấm Continue/Tiếp tục cho đến khi xong).
4. Xong! Có thể đóng cửa sổ cài đặt lại.

---

## Bước 2 — Chạy tool

1. Giải nén (unzip) file `Tool_Ghep_Doi_Chieu.zip` bạn đã tải về ra một thư mục bất kỳ trên máy
   (ví dụ để ra Desktop cho dễ tìm).
2. Mở thư mục `Tool_Ghep_Doi_Chieu` vừa giải nén ra.
3. **Windows**: nhấp đúp (double-click) vào file **`Chay_Tool.bat`**.
   **macOS**: nhấp đúp vào file **`Chay_Tool.command`**.
   - Nếu macOS hiện hộp thoại **"Chay_Tool.command chưa được mở"** và chỉ có 2 lựa chọn
     "Chuyển vào Thùng rác" / "Xong" (không có nút "Mở"): đây là do macOS chặn file tải từ
     Internet, không phải do file bị lỗi. Cách xử lý (chỉ cần làm 1 lần):
     1. Bấm **"Xong"** để đóng hộp thoại (đừng bấm "Chuyển vào Thùng rác").
     2. Mở ứng dụng **Terminal** (bấm `Cmd + Space`, gõ "Terminal", Enter).
     3. Gõ `cd ` (có dấu cách ở cuối), sau đó **kéo thả thư mục `Tool_Ghep_Doi_Chieu`** vào
        cửa sổ Terminal để nó tự điền đường dẫn, rồi bấm Enter.
     4. Gõ lệnh sau rồi bấm Enter:
        ```
        xattr -d com.apple.quarantine Chay_Tool.command
        ```
     5. Quay lại Finder, nhấp đúp vào `Chay_Tool.command` lại — lần này sẽ chạy được bình thường.
     Cách khác (nếu không quen dùng Terminal): mở **System Settings** (Cài đặt hệ thống) →
     **Privacy & Security** (Quyền riêng tư & Bảo mật) → cuộn xuống mục Security, sẽ thấy dòng
     thông báo "Chay_Tool.command đã bị chặn" kèm nút **"Open Anyway"** (Mở dù sao) → bấm vào đó,
     nhập mật khẩu máy nếu được hỏi, rồi nhấp đúp lại vào file như bình thường.
4. Một cửa sổ đen (cửa sổ dòng lệnh) sẽ hiện ra. Lần đầu tiên chạy, tool sẽ tự động tải và cài
   đặt các thư viện cần thiết — quá trình này có thể mất **1–3 phút**, cần có Internet.
   Từ lần chạy thứ 2 trở đi sẽ nhanh hơn nhiều (vài giây).
5. Khi thấy dòng chữ báo **"Đang khởi động máy chủ..."** và một **địa chỉ truy cập**
   (dạng `http://127.0.0.1:5000`), trình duyệt sẽ **tự động mở** trang tool lên.
   Nếu trình duyệt không tự mở, hãy copy địa chỉ đó và dán vào thanh địa chỉ của Chrome/Edge/Firefox.
6. Bắt đầu sử dụng tool theo 4 bước hiện trên màn hình: Tải file → Chọn cột khóa → Chọn kiểu ghép
   → Xem kết quả và tải file Excel.

### Muốn tắt tool?

Quay lại cửa sổ đen (cửa sổ dòng lệnh) đang chạy, bấm tổ hợp phím **Ctrl + C**, hoặc đóng hẳn
cửa sổ đó lại. Đóng trình duyệt không làm tắt tool — vì tool chạy nền ở cửa sổ dòng lệnh đó.

### Muốn chạy lại tool lần sau?

Chỉ cần mở lại thư mục `Tool_Ghep_Doi_Chieu` và nhấp đúp vào `Chay_Tool.bat`
(Windows) hoặc `Chay_Tool.command` (macOS) như Bước 2 ở trên. Không cần cài lại gì nữa.

---

## Xử lý sự cố thường gặp

**"Không tìm thấy Python trong máy tính này"**
→ Bạn chưa cài Python, hoặc khi cài quên tích "Add Python to PATH" (Windows). Hãy cài lại theo
Bước 1, nhớ tích đúng ô đó.

**Cửa sổ đen hiện lỗi khi cài thư viện ("pip install" bị lỗi)**
→ Thường do không có Internet hoặc mạng chặn. Hãy kiểm tra kết nối mạng rồi chạy lại file
`Chay_Tool.bat`/`Chay_Tool.command`.

**Trình duyệt không tự mở**
→ Copy địa chỉ `http://127.0.0.1:xxxx` hiện trong cửa sổ đen, dán vào trình duyệt.

**Báo "Cổng 5000 đang bận"**
→ Không sao — tool tự động chuyển sang cổng khác (5001, 5002, …) và vẫn hiện đúng địa chỉ mới
trong cửa sổ đen, cứ dùng địa chỉ đó là được.

**Tải file lên báo lỗi "file có thể đang mở trong Excel"**
→ Đóng file Excel/CSV đó lại (thoát hẳn khỏi Excel) rồi tải lên lại.

**File quá lớn / máy báo hết bộ nhớ**
→ Đóng bớt các phần mềm khác đang chạy để giải phóng RAM, hoặc thử với file nhỏ hơn.

**Vẫn không chạy được**
→ Chụp lại màn hình cửa sổ đen lúc báo lỗi để gửi cho người hỗ trợ kỹ thuật.

---

## Về việc bảo mật dữ liệu

Tool chỉ chạy **trên chính máy tính của bạn** (địa chỉ `127.0.0.1` nghĩa là "chính máy này"),
không có bước nào gửi dữ liệu ra Internet hay lên bất kỳ máy chủ nào khác. Toàn bộ việc đọc file,
ghép dữ liệu, xuất Excel đều xử lý cục bộ ngay trên máy bạn.
