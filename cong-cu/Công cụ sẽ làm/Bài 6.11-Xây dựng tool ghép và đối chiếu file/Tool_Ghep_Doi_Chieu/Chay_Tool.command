#!/bin/bash
# Tool Ghép & Đối Chiếu 2 File Excel — chạy trên macOS
cd "$(dirname "$0")"

echo "============================================================"
echo "  TOOL GHÉP & ĐỐI CHIẾU 2 FILE EXCEL"
echo "============================================================"
echo ""

PYCMD=""

if command -v python3 >/dev/null 2>&1; then
    PYCMD="python3"
elif command -v python >/dev/null 2>&1; then
    PYCMD="python"
fi

if [ -z "$PYCMD" ]; then
    echo "[!] Không tìm thấy Python trên máy này."
    echo ""
    echo "    Vui lòng cài đặt Python trước khi chạy tool:"
    echo "    1. Mở trình duyệt, vào trang: https://www.python.org/downloads/"
    echo "    2. Tải bản Python mới nhất cho macOS và cài đặt."
    echo "    3. Cài xong, mở lại file Chay_Tool.command này"
    echo "       (nếu macOS chặn, xem hướng dẫn 'mở file không rõ nguồn gốc'"
    echo "       trong file HUONG_DAN.md)."
    echo ""
    read -p "Bấm Enter để đóng cửa sổ này..."
    exit 1
fi

echo "[OK] Đã tìm thấy Python ($PYCMD). Đang kiểm tra các thư viện cần thiết..."
echo "     (Lần đầu chạy sẽ mất vài phút để cài đặt, các lần sau sẽ nhanh hơn)"
echo ""

"$PYCMD" -m pip install --disable-pip-version-check -q -r requirements.txt
if [ $? -ne 0 ]; then
    echo ""
    echo "[!] Cài đặt thư viện bị lỗi. Đang thử lại với quyền người dùng..."
    "$PYCMD" -m pip install --disable-pip-version-check -q --user -r requirements.txt
fi
if [ $? -ne 0 ]; then
    echo ""
    echo "[!] Vẫn không cài đặt được thư viện cần thiết."
    echo "    Vui lòng kiểm tra kết nối Internet rồi thử lại."
    echo "    Nếu vẫn lỗi, hãy xem hướng dẫn xử lý trong file HUONG_DAN.md."
    echo ""
    read -p "Bấm Enter để đóng cửa sổ này..."
    exit 1
fi

echo "[OK] Đã sẵn sàng. Đang khởi động tool..."
echo ""

"$PYCMD" app.py

echo ""
echo "============================================================"
echo "  Tool đã dừng. Bạn có thể đóng cửa sổ này lại."
echo "============================================================"
read -p "Bấm Enter để đóng cửa sổ này..."
