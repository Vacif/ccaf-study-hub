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

- **31 mục học**, mỗi mục có phần lý thuyết, ghi nhớ, mẹo thi và quiz có giải thích.
- **31 mô phỏng tương tác**: vòng lặp agent từng bước, sơ đồ coordinator–subagent, hook PreToolUse/PostToolUse, trình tạo lỗi MCP, thử nghiệm `tool_choice`, cây cấu hình CLAUDE.md, bộ kiểm tra glob của rules, demo JSON schema nullable, bộ quyết định Batch API, mô phỏng cửa sổ ngữ cảnh, trò chơi phân loại…
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
assets/js/content.js   # nội dung chương, mục, quiz, flashcard
assets/js/widgets.js   # các mô phỏng tương tác
assets/js/app.js       # router, quiz, flashcard, thi thử, tiến độ
```

Muốn thêm mục mới, chỉ cần thêm một object vào `sections` trong `content.js` (và tùy chọn một widget trong `widgets.js`).
