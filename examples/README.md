# Code mẫu cho phần Thực hành dự án

Mỗi thư mục ứng với một chương trên trang web (mục 🛠️ Thực hành dự án). Code viết bằng Python, dùng thư viện chính thức của Anthropic.

| Thư mục | Nội dung | Cần API key? |
|---|---|---|
| `ch0/` | Gọi Claude API lần đầu, trò chuyện nhiều lượt | Có |
| `ch1/` | Agent chăm sóc khách hàng có cổng kiểm tra hoàn tiền bằng code, kèm kiểm thử dùng client giả lập | `agent.py` có; `test_agent.py` không |
| `ch2/` | Đo độ chính xác chọn công cụ, máy chủ MCP nhỏ, `.mcp.json` dùng chung cho nhóm | `tool_eval.py` có; máy chủ MCP không |
| `ch3/` | Mẫu cấu hình Claude Code cho repo của khách: CLAUDE.md, rule, slash command, skill, GitHub Actions | Bot CI cần |
| `ch4/` | Trích xuất hóa đơn ra JSON có kiểm tra và thử lại, chạy hàng loạt bằng Batch API | Có |
| `ch5/` | Đo chất lượng theo nhóm, hiệu chỉnh độ tự tin, lấy mẫu phân tầng, case facts | Không |

## Cài đặt

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
export ANTHROPIC_API_KEY="..."     # Windows (PowerShell): $env:ANTHROPIC_API_KEY="..."
```

Không ghi API key vào file code và không commit nó lên git.

## Chạy thử không tốn tiền

```bash
python ch1/test_agent.py
python ch5/quality.py
```

## Lưu ý khi dùng model mới nhất

- Code mẫu dùng `claude-opus-5-5`. Với model này, `tool_choice` kiểu `any` hoặc chỉ định đích danh công cụ bị API từ chối, nên phần trích xuất dùng structured outputs (`output_config.format`) thay cho cách “ép gọi công cụ” mà đề thi mô tả.
- Câu trả lời có thể chứa khối `thinking` trước khối chữ. Luôn lọc theo `block.type == "text"` thay vì lấy `content[0]`.
- `ch1/agent.py` bật cơ chế dự phòng phía máy chủ (`fallbacks="default"`): nếu bộ lọc an toàn từ chối yêu cầu, API tự chạy lại trên model dự phòng phù hợp.
