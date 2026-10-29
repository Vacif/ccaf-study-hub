# CCA-F Study Hub

Web ôn thi chứng chỉ **Claude Certified Architect – Foundations (CCA-F)** bằng tiếng Việt, chia theo chương (domain) và mục, kèm hệ thống học tương tác.

> Tài liệu ôn tập độc lập, không liên kết hay được xác nhận bởi Anthropic. Hãy đối chiếu với Exam Guide chính thức trước khi thi.

## Nội dung

| Chương | Lĩnh vực | Trọng số |
|---|---|---|
| 0 | Tổng quan kỳ thi | — |
| 1 | Agentic Architecture & Orchestration | 27% |
| 2 | Tool Design & MCP Integration | 18% |
| 3 | Claude Code Configuration & Workflows | 20% |
| 4 | Prompt Engineering & Structured Output | 20% |
| 5 | Context Management & Reliability | 15% |

## Tính năng

- **31 mục học**, viết cho người mới: mỗi mục mở đầu bằng một ví dụ đời thường, giải thích bằng câu văn đầy đủ, rồi tới phần **Hiểu sâu hơn** (cơ chế bên dưới, chi tiết hay bị hỏi xoáy), kèm phần tóm tắt và mẹo thi.
- **🧨 Tình huống khó & bẫy** ở mọi mục: kịch bản thực chiến, phản xạ sai thường gặp, vì sao sai, các bước xử lý đúng.
- **Quiz có câu 🔥 khó / 🪤 có bẫy**, giải thích từng phương án A–D.
- **Mô phỏng luồng dữ liệu (trace)**: các bên có icon, gói tin chạy giữa các bên; mỗi bước có một thẻ giải thích bằng lời, còn chi tiết kỹ thuật (dữ liệu được gửi, ý nghĩa các trường, bên nhận xử lý ra sao, đoạn code tương ứng, lịch sử hội thoại) nằm trong các tab riêng; có nút tự chạy, lùi/tiến, chọn tình huống. Bao gồm: vòng lặp agent đầy đủ, coordinator–Task–subagent, cổng kiểm tra, hook Pre/PostToolUse, lỗi MCP JSON-RPC, vòng đời MCP server, Grep/Read/Edit, nạp CLAUDE.md, skill `context: fork`, plan mode, CI headless, trích xuất tool_use, vòng retry, Message Batches, review nhiều lượt, lắp ráp ngữ cảnh, escalate & bàn giao, lan truyền lỗi.
- **Mô phỏng tương tác khác**: vòng lặp agent từng bước, sơ đồ coordinator–subagent, hook PreToolUse/PostToolUse, trình tạo lỗi MCP, thử nghiệm `tool_choice`, cây cấu hình CLAUDE.md, bộ kiểm tra glob của rules, demo JSON schema nullable, bộ quyết định Batch API, mô phỏng cửa sổ ngữ cảnh, trò chơi phân loại…
- **Flashcard** theo chương, có trộn thẻ và phím tắt.
- **Thi thử** chọn câu theo trọng số, có đồng hồ, quy đổi điểm thang 1000 (đạt từ 720) và phân tích theo lĩnh vực.
- Lưu tiến độ trong trình duyệt, giao diện sáng/tối, dùng tốt trên điện thoại.

## Chạy cục bộ

Đây là web tĩnh, không cần build:

```bash
python -m http.server 5173
```

Mở http://localhost:5173.

## Cấu trúc

```
index.html
assets/css/style.css
assets/js/content.js   # nội dung cơ bản: chương, mục, quiz, flashcard
assets/js/deep/d*.js   # nội dung nâng cao, tình huống khó, câu hỏi khó theo id mục
assets/js/widgets.js   # các mô phỏng tương tác đơn giản (phân loại, so sánh…)
assets/js/sim/engine.js# bộ máy mô phỏng luồng dữ liệu (trace)
assets/js/sim/d*.js    # các mô phỏng trace theo chương
assets/js/app.js       # router, quiz, flashcard, thi thử, tiến độ
```

Muốn thêm mục mới, thêm một object vào `sections` trong `content.js`; phần nâng cao/bẫy/câu khó thêm qua `DEEP_ADD({...})` trong `deep/`, mô phỏng mới viết bằng `SIM.trace({...})` trong `sim/`.
