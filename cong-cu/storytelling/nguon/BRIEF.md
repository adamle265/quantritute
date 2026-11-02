# BRIEF – Viết bài học cho công cụ "Luyện tập thuyết trình, kể chuyện (storytelling)"

Công cụ miễn phí trên quantritute.com (thương hiệu "Quản trị tử tế" của anh Minh Tuấn). Người học: người Việt, chủ yếu dân văn phòng 18–40, **mới bắt đầu**. Mỗi ngày 1 bài, **10 phút** (đọc 3' · thử nhanh 1' · thực hành 5' · ghi nhận 1'). Lộ trình 28 ngày + ngày 29 về đích. Chặng 1–2 (ngày 1–14) dùng chung; chặng 3–4 (ngày 15–28) tách 3 nhánh: **A. Kể chuyện hay hơn khi giao tiếp · B. Nói tự tin trước camera · C. Thuyết trình trong công việc**.

## Đọc trước khi viết (bắt buộc)
1. `/home/claude/st/md/lotrinh.md` – lộ trình đã duyệt (bảng tên bài từng ngày + video nguồn), khung buổi học, **bài mẫu 1 (ngày 8) và bài mẫu 2 (ngày 16 nhánh C) đã được anh duyệt văn phong**.
2. `/home/claude/st/md/chang1.md` – 7 bài chặng 1 đã viết (cùng văn phong).
3. `/home/claude/st/lessons/d08.json` – **bài mẫu dạng JSON chuẩn**. Bài của bạn phải cùng cấu trúc, cùng độ dài, cùng giọng.
4. `/home/claude/yt/kien-thuc/07-Philipp-Humm.md` – thư viện khung kiến thức (PREP, AAA, RAP, 5P, CAR/CART, PAST…), checklist, điểm cần phản biện.
5. Dữ liệu video: `/home/claude/luyen/videos.json` (mỗi video: `ma` mã PH-xxx, `t` tiêu đề gốc, `q` câu hỏi người xem, `tm` tóm tắt, `km` khoảnh khắc/ý chính, `hd` hành động, `kt` kiến thức, `lu` lưu ý). Bản phụ đề đầy đủ (chỉ dùng nội bộ để hiểu đúng ý) nằm trong `/home/claude/st/transcripts/lo-PH-0*.txt` – tìm theo dòng `### VIDEO PH-xxx`. Hãy đọc kỹ các video nguồn của bài mình viết để nắm đúng phương pháp.

## Giọng và quy tắc nội dung (bắt buộc)
- Người dẫn là **Đốm**: xưng "Đốm", gọi người học là "bạn". Ấm áp, gọn, thực tế. Không sáo rỗng, không hô khẩu hiệu.
- Câu ngắn (< 25 chữ), đoạn ≤ 3 câu. Tiếng Việt tự nhiên, không dịch kiểu Anh. Giải thích bằng ngôn ngữ bình dân.
- **Không dùng từ "sự cố"** – dùng "tình huống" hoặc "khoảnh khắc".
- **Mọi ví dụ do mình tự soạn**, bối cảnh văn phòng/đời sống Việt giả định (tên người Việt, công ty, sếp, khách, họp, Zalo, livestream bán hàng…). Không dùng chuyện đời tư, ví dụ, người nổi tiếng, hình ảnh, tên khóa học, sách bán của Philipp Humm. Không chính trị, không chuyện nhạy cảm (bệnh tật, chia tay…).
- Viết lại bằng lời mình, **không dịch nguyên văn** video/email (tối đa 12 chữ liên tiếp giống nguồn). Tên phương pháp có thể giữ tên gốc kèm tên Việt (ví dụ: "khung PREP (Ý kiến – Lý do – Ví dụ – Nhắc lại)").
- Không dùng số liệu %/"nghiên cứu" không căn cứ của nguồn. Số liệu trong ví dụ là giả định → nếu có, thêm câu "*Số liệu trong ví dụ là giả định để minh họa.*" cuối thẻ.
- Không khuyên những thử thách "ngượng có chủ đích" kiểu Mỹ; đổi sang bối cảnh Việt (phát biểu đầu tiên trong họp, hỏi đường, chào người lạ ở sự kiện…).
- Không nhắc tới AI chấm điểm (bản 1 không có AI). Người học tự chấm theo tiêu chí.
- Thực hành phải làm được trong 5 phút, một mình, với điện thoại/máy tính.

## Cấu trúc JSON (mỗi file là một mảng các bài)
```
{
  "id": "d09" | "d15A" | "d29",       // 2 chữ số; bài nhánh thêm A/B/C
  "day": 9, "stage": 2,               // stage 1..4, ngày 29 = stage 5
  "branch": null | "A" | "B" | "C",
  "milestone": false,                 // true cho ngày 7,14,21,28
  "title": "Tên bài ngắn, dễ hiểu (hiện trên bản đồ)",
  "hook": "Câu dẫn 1 dòng, hấp dẫn, nói thẳng ý của bài",
  "cards": [                          // 5 thẻ theo thứ tự: story, idea, how, compare, takeaway
    {"type":"story","title":"Đốm kể","body":"md"},       // tình huống minh họa 3–5 đoạn ngắn
    {"type":"idea","title":"Ý chính","body":"md"},
    {"type":"how","title":"Cách làm: …","body":"md"},     // bảng hoặc danh sách bước, cụ thể
    {"type":"compare","title":"Yếu và mạnh","weakLabel":"…","strongLabel":"…","rows":[{"branch":"A"|"B"|"C"|null,"weak":"…","strong":"…"}]},
    {"type":"takeaway","title":"Mang theo 1 câu","body":"1 câu"}
  ],
  "quiz": {                           // 1 câu, phản hồi cho từng lựa chọn
     "kind":"choice","question":"…","options":[{"text":"…","correct":true|false,"feedback":"…"}]   // 2–3 lựa chọn, đúng 1 cái correct
     // hoặc "kind":"order","question":"Sắp xếp…","items":["theo đúng thứ tự"],"feedback":"giải thích"
  },
  "practice": {
    "intro": "1 câu nói mục tiêu",
    "steps": ["md", "..."],           // 3–4 bước
    "topics": ["…"],                  // tuỳ chọn: 3 đề có sẵn để chọn nếu người học bí
    "pickStory": false,               // true nếu cần chọn 1 chuyện trong Kho chuyện
    "fields": [{"label":"…","placeholder":"…"}],  // tuỳ chọn: ô điền (0–5 ô)
    "saveAs": null | "seeds" | "storyNote",       // seeds: mỗi ô thành 1 hạt giống trong kho; storyNote: lưu ghi chú vào chuyện đã chọn
    "widget": null | "impromptu",     // impromptu: hiện 1 đề ứng khẩu ngẫu nhiên (bộ đề do công cụ có sẵn)
    "timer": 60 | null,               // giây, nếu có phần nói thành tiếng
    "record": true | false            // có nút ghi âm + nghe lại
  },
  "review": ["tiêu chí tự chấm", "…"],  // 3 tiêu chí; ngày mốc 5 tiêu chí; viết ở ngôi "Mình…"
  "done": "Lời Đốm khi xong bài, 1–2 câu, gợi mở bài hôm sau",
  "videos": ["PH-0xx"]                // video nguồn của bài (theo bảng lộ trình), 1–3 mã
}
```
Markdown trong `body`/`steps`: đoạn văn (cách nhau 1 dòng trống), `**đậm**`, `*nghiêng*`, danh sách `- ` hoặc `1. `, bảng `| … |`, trích `> `. Không dùng tiêu đề `#`.

**Thẻ compare:**
- Chặng 1–2 (bài dùng chung): đúng 3 dòng, branch "A", "B", "C" – mỗi dòng một ví dụ hợp nhánh đó (A giao tiếp đời thường/công sở; B video, livestream, họp online; C họp, báo cáo, thuyết trình).
- Chặng 3–4 (bài nhánh): 2 dòng, branch null, đều hợp nhánh của bài.

**Ngày mốc (21, 28):** không dạy kiến thức mới. cards = story (Đốm nói trước khi bắt đầu) + idea (ôn nhanh: bảng "Ngày | Điều mang theo" của 6 bài trong chặng) + how (chuẩn bị 2 phút); có thể bỏ compare, takeaway; quiz có thể là null; practice có timer + record; review 5 tiêu chí; `done` là lời chúc qua màn.

**Ngày 29 Về đích:** xem lại bản ghi ngày 7 và ngày 28, chọn 1 điều khó chịu nhất mà có ích nhất, cam kết làm mỗi ngày trong 7 ngày; gợi ý học nhánh khác hoặc Phòng tập Nâng cao.

## Kiểm tra trước khi giao
Chạy `python3 /home/claude/st/check.py <file.json>` đến khi không còn lỗi. Đọc lại toàn bộ một lượt bằng con mắt người học: có rõ không, có làm được trong 10 phút không, ví dụ có tự nhiên kiểu Việt không.
