import json, sys
moi = [
 "Cơ cấu nhân sự: bảng chế độ của từng người mỗi tháng – lương cơ bản (căn cứ đóng BHXH), trợ cấp cố định hoặc theo ngày công (nhập theo ngày hay theo tháng, tự quy đổi), lương hiệu suất mục tiêu; quỹ lương và tổng chi phí dự kiến so với tháng trước; lấy dữ liệu tháng trước và tự cập nhật hợp đồng, quyết định lương, người mới vào, người nghỉ; duyệt trước hạn, nhắc hạn duyệt",
 "Bảng lương tự tính từ Cơ cấu nhân sự đã duyệt và bảng công đã chốt: lương theo ngày công (bán thời gian tính theo giờ), tăng ca 150/200/300%, lương hiệu suất theo tỷ lệ đạt, trợ cấp, BHXH – BHYT – BHTN, kinh phí công đoàn, thuế TNCN theo biểu lũy tiến, khấu trừ 10% với hợp đồng dưới 3 tháng; bấm tên xem từng bước tính và căn cứ pháp lý",
 "Bảng lương: nhập lương KPI, thưởng lễ tết, tạm ứng từ file Excel hoặc dán cả cột từ Excel (báo dòng sai); sửa tay có đánh dấu; đối chiếu với bảng lương đơn vị đang dùng; chốt và mở lại có lý do; xuất Excel; in bảng lương có chữ ký người lập biểu, kế toán trưởng, giám đốc",
 "Phiếu lương lấy từ bảng lương đã chốt, thiết kế theo màu giao diện người dùng chọn: in / lưu PDF từng người hoặc cả công ty; gửi lên trang nhân viên trên điện thoại, nhân viên hỏi lại từng dòng và quản lý trả lời ngay trong phần mềm (dữ liệu mẫu gửi qua máy chủ chạy thử)",
 "Bảng chi lương: lập bảng đổ lương ngân hàng (số tài khoản, ngân hàng, tên không dấu, nội dung chuyển khoản) hoặc bảng chi tiền mặt để người lao động ký nhận; mỗi lần lập lưu thành 1 bản có số, xem lại, in, xuất Excel các tháng trước",
 "Thiết lập tính lương: các khoản trợ cấp, thưởng, khấu trừ (không có khoản phạt tiền – Điều 127 Bộ luật Lao động); lựa chọn nhanh vùng lương tối thiểu, mức đóng bảo hiểm tai nạn lao động, miễn thuế tiền làm thêm giờ, đơn giá tăng ca, cách xử lý đi muộn, làm tròn; công thức chỉnh theo thành phần; tham số theo luật (lương cơ sở, lương tối thiểu vùng, giảm trừ gia cảnh, biểu thuế, tỷ lệ bảo hiểm) sửa được và thêm mức mới theo ngày hiệu lực",
 "Văn bản pháp luật làm căn cứ có link văn bản gốc, ngày ban hành, ngày hiệu lực, tình trạng; Kho quy chế 8 mẫu (thang bảng lương có phụ lục, quy chế lương thưởng và phúc lợi, đánh giá hiệu suất, quy chế tài chính, nội quy…) tự điền theo thiết lập lương – xem, sửa như Word, tải Word, tải mẫu của đơn vị lên, lưu bản scan đã ban hành",
 "Bảng nhập liệu dùng chung: chọn và kéo thả thứ tự cột hiển thị, kéo mép để co giãn cột, toàn màn hình, hoàn tác / làm lại",
 "Cách tính lương, bảo hiểm, thuế đang chờ kế toán trưởng duyệt nghiệp vụ; số liệu trong dữ liệu mẫu là giả định – đơn vị cần rà lại theo quy định và quy chế của mình"
]
nang = [
 "Cơ cấu nhân sự, Bảng lương có cột Hình thức (Fulltime, Part-time, Cộng tác viên) và Loại hợp đồng (Chính thức, Thử việc, Bán thời gian, Cộng tác viên)",
 "Mẫu hợp đồng lao động: Điều 3 sắp xếp lại thành mức lương, phụ cấp và khoản bổ sung, phúc lợi, hình thức trả lương, nâng lương",
 "Dữ liệu mẫu: lương tháng 8–10 đã hoàn thành, Cơ cấu nhân sự tháng 10 đã duyệt, bảng lương tháng 10 đã chốt để xem ngay phiếu lương và bảng chi lương; các cột trợ cấp có số ví dụ",
 "Giao diện gọn hơn: tiêu đề cột không ngắt giữa từ, căn cứ pháp lý hiện khi rê chuột, dòng nguồn dữ liệu chỉ hiện ở Bảng điều hành"
]
p = sys.argv[1]
L = json.load(open(p, encoding='utf-8'))
L = [v for v in L if v['ban'] != '0.4.1']
L.append({"ban": "0.4.1", "ngay": "10/11/2026", "gio": "16:10:00", "module": "Lương",
  "ten": "Module Lương: Cơ cấu nhân sự, Bảng lương, Phiếu lương, Bảng chi lương, Thiết lập tính lương",
  "nguon": "_ban-0.4.1", "noi_dung": moi + nang,
  "hang_muc": "Cơ cấu nhân sự · Bảng lương · Phiếu lương · Bảng chi lương · Thiết lập tính lương",
  "moi": moi, "nang_cap": nang})
json.dump(L, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
open(p, 'a', encoding='utf-8').write('\n')
dk = {"ban": "0.5.1", "module": "Tuyển dụng", "ten": "Module Tuyển dụng – từ nhu cầu tuyển đến hồ sơ nhân sự", "bat_dau": "09/11/2026",
  "ghi_chu": "Phạm vi dự kiến, có thể điều chỉnh trong lúc làm.",
  "nhom": [
   {"ten": "Nhu cầu tuyển dụng", "noi_bat": True, "muc": ["Lập phiếu nhu cầu tuyển theo vị trí, bộ phận", "Duyệt nhu cầu trước khi đăng tin"]},
   {"ten": "Tin tuyển dụng", "muc": ["Soạn tin tuyển dụng từ nhu cầu đã duyệt"]},
   {"ten": "Ứng viên & phỏng vấn", "muc": ["Theo dõi hồ sơ ứng viên, lịch phỏng vấn, đánh giá"]},
   {"ten": "Mời nhận việc", "muc": ["Thư mời nhận việc, chuyển ứng viên nhận việc thành hồ sơ nhân sự"]},
   {"ten": "Kết nối", "muc": ["Hiện ở Bảng điều hành, Việc cần xử lý, Sơ đồ tổ chức"]}]}
json.dump(dk, open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('ok', len(L))
