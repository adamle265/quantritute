-- Xóa toàn bộ nội dung mẫu (đường dẫn bắt đầu bằng mau-)
DELETE FROM posts WHERE instr(slug, 'mau-') = 1;
DELETE FROM reflections WHERE instr(slug, 'mau-') = 1;
