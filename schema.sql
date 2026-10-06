-- Quản trị tử tế · cấu trúc database (Cloudflare D1) · bản 1.2
-- Bản 1.2: database cũ được web tự bổ sung cột mới cho bảng tools và chuyển nhóm/trạng thái/icon/tag ở lần chạy đầu (không cần chạy lệnh).
-- Chạy lại nhiều lần vẫn an toàn: chỉ tạo bảng còn thiếu, dữ liệu mẫu chỉ thêm khi chưa có.

CREATE TABLE IF NOT EXISTS tools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  no TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  grp TEXT NOT NULL DEFAULT 'kt',
  sub TEXT NOT NULL DEFAULT '',
  pain TEXT NOT NULL DEFAULT '',
  who TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'soon',
  price INTEGER NOT NULL DEFAULT 0,
  pricing TEXT NOT NULL DEFAULT 'free',
  price_note TEXT NOT NULL DEFAULT '',
  featured INTEGER NOT NULL DEFAULT 0,
  icon TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '',
  features TEXT NOT NULL DEFAULT '',
  highlights TEXT NOT NULL DEFAULT '',
  guide TEXT NOT NULL DEFAULT '',
  version TEXT NOT NULL DEFAULT '',
  released TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT '',
  download_url TEXT NOT NULL DEFAULT '',
  banner_url TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  embed INTEGER NOT NULL DEFAULT 0,
  videos TEXT NOT NULL DEFAULT '[]',
  body TEXT NOT NULL DEFAULT '',
  sort INTEGER NOT NULL DEFAULT 100,
  visible INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS episodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  no TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  youtube_url TEXT NOT NULL DEFAULT '',
  shorts TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft',
  publish_date TEXT NOT NULL DEFAULT '',
  sort INTEGER NOT NULL DEFAULT 100,
  visible INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'quan-tri',
  excerpt TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  cover_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pain TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  contact TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  votes INTEGER NOT NULL DEFAULT 1,
  tool_slug TEXT NOT NULL DEFAULT '',
  admin_note TEXT NOT NULL DEFAULT '',
  ip_hash TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status, created_at);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new',
  scheduled_at TEXT NOT NULL DEFAULT '',
  admin_note TEXT NOT NULL DEFAULT '',
  ip_hash TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status, created_at);

CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);

-- ===== Dữ liệu ban đầu: danh sách tool theo sơ đồ của anh Tuấn =====
INSERT OR IGNORE INTO tools (slug,no,name,grp,sub,pain,who,status,sort,created_at,updated_at) VALUES
('doc-hoa-don-xml','#01','Đọc hóa đơn điện tử XML','vp','Kế toán – tài chính','Nhận file XML mà mở ra chỉ thấy toàn ký tự.','Kế toán','ok',1,CAST(strftime('%s','now') AS INTEGER)*1000,CAST(strftime('%s','now') AS INTEGER)*1000),
('van-ban-hang-loat','#02','Tạo văn bản, thiết kế hàng loạt từ danh sách','vp','Hành chính – nhân sự – marketing','50 giấy mời, 50 lần sửa tên bằng tay.','Hành chính, marketing','ok',2,CAST(strftime('%s','now') AS INTEGER)*1000,CAST(strftime('%s','now') AS INTEGER)*1000),
('doi-chieu-sao-ke','#03','Đối chiếu sao kê và sổ phụ ngân hàng','vp','Kế toán – tài chính','Lệch vài trăm nghìn mà dò cả buổi không ra.','Kế toán','ok',3,CAST(strftime('%s','now') AS INTEGER)*1000,CAST(strftime('%s','now') AS INTEGER)*1000),
('import-misa-sao-ke','#04','Tạo file import MISA từ sao kê','vp','Kế toán – tài chính','Sao kê hàng trăm dòng, nhập tay vào phần mềm.','Kế toán','ok',4,CAST(strftime('%s','now') AS INTEGER)*1000,CAST(strftime('%s','now') AS INTEGER)*1000),
('doi-soat-san-tmdt','#05','Đối soát đơn hàng sàn TMĐT','vp','Kế toán – tài chính','Sàn trả tiền thiếu mà không biết thiếu ở đơn nào.','Người làm sổ cho shop','ok',5,CAST(strftime('%s','now') AS INTEGER)*1000,CAST(strftime('%s','now') AS INTEGER)*1000),
('loi-nhuan-san-tmdt','#06','Báo cáo lợi nhuận từ sàn TMĐT','vp','Kế toán – tài chính','Bán nhiều mà cuối tháng không biết lãi bao nhiêu.','Chủ shop, kế toán','ok',6,CAST(strftime('%s','now') AS INTEGER)*1000,CAST(strftime('%s','now') AS INTEGER)*1000),
('tai-hoa-don-hang-loat','#07','Tải hóa đơn hàng loạt từ cổng thuế','vp','Kế toán – tài chính','Tải từng hóa đơn một trên cổng thuế.','Kế toán','risk',7,CAST(strftime('%s','now') AS INTEGER)*1000,CAST(strftime('%s','now') AS INTEGER)*1000),
('tra-cuu-van-ban','','Tra cứu văn bản pháp luật kế toán – thuế – BHXH','vp','Kế toán – tài chính','Không chắc văn bản nào còn hiệu lực.','Kế toán','soon',20,CAST(strftime('%s','now') AS INTEGER)*1000,CAST(strftime('%s','now') AS INTEGER)*1000),
('quan-ly-nhan-su','','Quản lý nhân sự, hội nhập, chấm công vào – ra','vp','Hành chính – nhân sự – marketing','Hồ sơ nhân sự nằm rải rác nhiều file.','Hành chính – nhân sự','soon',21,CAST(strftime('%s','now') AS INTEGER)*1000,CAST(strftime('%s','now') AS INTEGER)*1000),
('checklist-setup-spa','','Checklist setup spa','kn','Ngành spa','Mở spa mà sót hạng mục, phát sinh chi phí.','Chủ spa','soon',30,CAST(strftime('%s','now') AS INTEGER)*1000,CAST(strftime('%s','now') AS INTEGER)*1000),
('thu-nhap-tri-lieu-vien','','Tính thu nhập trị liệu viên','kn','Ngành spa','Cơ chế lương, hoa hồng gây tranh cãi mỗi kỳ.','Chủ spa, quản lý','paid',31,CAST(strftime('%s','now') AS INTEGER)*1000,CAST(strftime('%s','now') AS INTEGER)*1000),
('dong-tien-du-an','','Hiệu quả tài chính, dòng tiền dự án','kn','Ngành spa','Không biết bao lâu thu hồi vốn.','Chủ spa','soon',32,CAST(strftime('%s','now') AS INTEGER)*1000,CAST(strftime('%s','now') AS INTEGER)*1000),
('checklist-van-hanh','','Checklist vận hành hằng ngày tại cơ sở','kn','Ngành spa','Ca nào cũng quên một vài việc.','Quản lý cơ sở','soon',33,CAST(strftime('%s','now') AS INTEGER)*1000,CAST(strftime('%s','now') AS INTEGER)*1000),
('luyen-doc-tieng-anh','','Luyện đọc tiếng Anh miễn phí','ht','Hỗ trợ học tập','Muốn đọc đều mỗi ngày mà không có lộ trình.','Người tự học','soon',40,CAST(strftime('%s','now') AS INTEGER)*1000,CAST(strftime('%s','now') AS INTEGER)*1000),
('quan-ly-cong-viec','','Quản lý công việc cá nhân','ht','Hỗ trợ học tập','Việc nhiều, nhớ không hết.','Mọi người','soon',41,CAST(strftime('%s','now') AS INTEGER)*1000,CAST(strftime('%s','now') AS INTEGER)*1000);

INSERT INTO episodes (no,title,summary,status,sort,created_at,updated_at)
SELECT 'Tập 01','Vì sao mình bắt đầu','Video dài mở đầu tuyến Hành trình.','draft',1,CAST(strftime('%s','now') AS INTEGER)*1000,CAST(strftime('%s','now') AS INTEGER)*1000
WHERE NOT EXISTS (SELECT 1 FROM episodes);

INSERT OR IGNORE INTO settings (key,value) VALUES
('tagline','Chia sẻ hành trình học, tạo giá trị mỗi ngày.'),
('headline','Quản trị lấy Con người làm gốc'),
('forms_open','1'),
('booking_open','1'),
('donate_note','Nếu một công cụ giúp được bạn, ủng hộ tùy tâm để kho công cụ có thêm tool mới.'),
('donate_content','CAFE QTT');

-- v1.1: gắn Cẩm nang Thuế & Kế toán 2026 (do anh Tuấn biên soạn) vào tool tra cứu văn bản.
-- Chỉ cập nhật khi tool chưa có link, không ghi đè nếu anh đã sửa trong quản trị.
UPDATE tools SET name='Cẩm nang tra cứu Thuế – Kế toán – Lao động 2026', url='/tools/cam-nang-thue-2026/', status='ok', embed=0,
  sub='Kế toán – tài chính', pain='Không chắc văn bản nào còn hiệu lực, điều khoản nào đã bị sửa.', who='Kế toán, chủ doanh nghiệp nhỏ',
  updated_at=CAST(strftime('%s','now') AS INTEGER)*1000
WHERE slug='tra-cuu-van-ban' AND url='';
