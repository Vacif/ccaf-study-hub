# CCA-F Study Hub

Web ôn thi chứng chỉ **Claude Certified Architect – Foundations (CCA-F)** bằng tiếng Việt, chia theo chương (domain) và mục, kèm hệ thống học tương tác và bài thực hành triển khai cho khách hàng.

> Tài liệu ôn tập độc lập, không liên kết hay được xác nhận bởi Anthropic. Hãy đối chiếu với Exam Guide chính thức trước khi thi.

## Nội dung

| Chương | Lĩnh vực | Trọng số |
|---|---|---|
| 0 | Nhập môn & tổng quan kỳ thi (có bài kiến thức nền cho người mới) | — |
| 1 | Kiến trúc agent & điều phối (Agentic Architecture & Orchestration) | 27% |
| 2 | Thiết kế công cụ & tích hợp MCP (Tool Design & MCP Integration) | 18% |
| 3 | Cấu hình & quy trình Claude Code (Claude Code Configuration & Workflows) | 20% |
| 4 | Viết prompt & đầu ra có cấu trúc (Prompt Engineering & Structured Output) | 20% |
| 5 | Quản lý ngữ cảnh & độ tin cậy (Context Management & Reliability) | 15% |

## Tính năng

- **32 mục học** viết cho người mới, bắt đầu từ bài **0-0 Kiến thức nền** (API, token, công cụ, ba cách dùng Claude). Mỗi mục có: mục tiêu học, thời gian ước tính, phần cơ bản mở đầu bằng ví dụ đời thường, phần **Hiểu sâu hơn**, tóm tắt và mẹo thi.
- **Mục lục dính** ở đầu mỗi bài, tự sáng phần đang đọc; mục tự được đánh dấu hoàn thành khi làm hết câu hỏi.
- **Bảng thuật ngữ** gần 70 từ; trong bài học, từ có gạch chân chấm hiện giải thích khi rê chuột hoặc chạm vào.
- **Tình huống khó & bẫy** ở mọi mục: kịch bản thực tế, cách làm dễ sai, vì sao sai, cách xử lý đúng (lời giải ẩn cho tới khi bấm xem).
- **Mô phỏng luồng dữ liệu (trace)**: các bên có icon, gói tin chạy giữa các bên; mỗi bước có thẻ giải thích bằng lời và các tab chi tiết (dữ liệu được gửi, ý nghĩa các trường, bên nhận xử lý ra sao, đoạn code tương ứng, lịch sử). Mô phỏng dài có chế độ **Tóm tắt** (chỉ các bước chính) và **Đầy đủ**.
- **Ngân hàng 148 câu hỏi thi thử**, giải thích từng phương án; thứ tự câu và phương án được trộn mỗi lần làm, độ dài phương án được cân để không đoán được đáp án. Mọi câu có **bản tiếng Anh** (nút chuyển ngôn ngữ) để quen với đề thật.
- **Thi thử** giống đề thật (60 câu, 120 phút, theo trọng số), đề nhanh 20 câu, luyện theo chương, và **Ôn câu sai** (gom từ bài học lẫn thi thử). Kết quả có phân tích theo lĩnh vực và gợi ý mục nên đọc lại.
- **Flashcard** khoảng 150 thẻ theo từng mục, có đánh dấu đã nhớ và chế độ chỉ ôn thẻ chưa nhớ.
- **Thực hành dự án**: mỗi chương một bài làm thật có code Python chạy được (thư mục [`examples/`](examples/)), cùng checklist trước khi giao hệ thống cho khách hàng.
- Lưu tiến độ trong trình duyệt, giao diện sáng/tối, dùng tốt trên điện thoại.

## Chạy cục bộ

Đây là web tĩnh, không cần build:

```bash
python -m http.server 5173
```

Mở http://localhost:5173. (Trang thực hành tải code mẫu từ `examples/`, nên cần mở qua máy chủ như trên thay vì mở file trực tiếp.)

## Cấu trúc

```
index.html
assets/css/style.css
assets/js/content.js    # nội dung cơ bản: chương, mục, mục tiêu, quiz, flashcard cấp chương
assets/js/deep/d*.js    # nội dung nâng cao, tình huống khó, câu hỏi khó theo id mục
assets/js/glossary.js   # bảng thuật ngữ
assets/js/bank.js       # câu hỏi chỉ dùng cho thi thử
assets/js/flash.js      # flashcard theo mục
assets/js/practice.js   # bài thực hành và checklist triển khai
assets/js/widgets.js    # các mô phỏng tương tác đơn giản
assets/js/sim/engine.js # bộ máy mô phỏng luồng dữ liệu (trace)
assets/js/sim/d*.js     # các mô phỏng trace theo chương
assets/js/app.js        # router, quiz, flashcard, thi thử, thuật ngữ, thực hành, tiến độ
examples/               # code mẫu cho phần thực hành (xem examples/README.md)
```

Muốn thêm mục mới, thêm một object vào `sections` trong `content.js`; phần nâng cao, tình huống khó, câu hỏi khó thêm qua `DEEP_ADD({...})` trong `deep/`; mô phỏng mới viết bằng `SIM.trace({...})` trong `sim/` (đánh dấu `key: true` cho các bước chính để có chế độ tóm tắt). Câu hỏi mới nên có trường `en` (bản tiếng Anh), và các phương án nên dài tương đương nhau.
