# Thư mục công cụ

Mỗi công cụ một thư mục, tên thư mục = slug (chữ thường, không dấu, nối bằng gạch ngang).

```
cong-cu/
  _mau/                 ← mẫu, chép ra để làm công cụ mới
  <slug>/
    app/index.html      ← file đưa lên web (bản gốc để sửa là ở đây)
    video/ke-hoach-video.md
    README.md           ← thông tin, chỗ khác bản gốc, nhật ký
    cap-nhat.cmd        ← chép app\ lên site\public\tools\<slug>\ rồi deploy
```

**Nguyên tắc:** chỉ sửa trong `cong-cu/<slug>/app/`. Không sửa trực tiếp `site/public/tools/<slug>/` vì `cap-nhat.cmd` sẽ ghi đè.

| Công cụ | Slug | Trạng thái |
|---|---|---|
| Cẩm nang tra cứu Thuế – Kế toán – Lao động 2026 | cam-nang-thue-2026 | Đã lên web; chưa có kế hoạch video |
| Tạo văn bản hàng loạt (Word, Excel, PDF, ảnh) | tao-van-ban-hang-loat | DONE 09/10/2026 (bản 1.7.2, đã lên web); slug database `van-ban-hang-loat`; chưa có video |
