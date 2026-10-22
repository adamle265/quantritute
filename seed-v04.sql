-- Du lieu minh hoa cho video v04 (chi dung tren ban chay thu local .state-v04, khong dung cho web that)
UPDATE tools SET eta = '2026-10-19' WHERE slug = 'doc-hoa-don-xml';
UPDATE tools SET eta = '2026-10-21' WHERE slug = 'doi-soat-san-tmdt';
INSERT INTO requests (pain, status, votes, on_board, board_title, board_desc, created_at, updated_at)
VALUES ('Tự động đối soát các đơn hàng trên Shopee,Tiktokshop', 'new', 1, 1, 'Đối soát đơn hàng TMĐT', 'Tự động đối soát các đơn hàng trên Shopee,Tiktokshop',
  CAST(strftime('%s','now') AS INTEGER)*1000, CAST(strftime('%s','now') AS INTEGER)*1000);
