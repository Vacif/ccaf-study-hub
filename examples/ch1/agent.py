"""Agent chăm sóc khách hàng: vòng lặp agent + cổng kiểm tra hoàn tiền bằng code."""
import json

import anthropic

client = anthropic.Anthropic()  # tự đọc ANTHROPIC_API_KEY từ biến môi trường
MODEL = "claude-opus-5-5"
MAX_TURNS = 15              # lưới an toàn, không phải tín hiệu hoàn thành
REFUND_LIMIT = 2_000_000    # VND; vượt mức này phải có người duyệt

SYSTEM = """Bạn là nhân viên chăm sóc khách hàng của cửa hàng ABC.
- Trước mọi thao tác trên đơn hàng, xác minh khách bằng get_customer.
- Khách yêu cầu gặp nhân viên, hoặc chính sách không quy định trường hợp này: gọi escalate_to_human.
- Trả lời ngắn gọn, lịch sự, bằng tiếng Việt."""

TOOLS = [
    {
        "name": "get_customer",
        "description": "Xác minh khách hàng bằng email họ cung cấp. Gọi trước mọi thao tác trên đơn hàng. Trả về customer_id nếu khớp.",
        "input_schema": {
            "type": "object",
            "properties": {"email": {"type": "string", "description": "Email khách cung cấp trong cuộc trò chuyện"}},
            "required": ["email"],
        },
    },
    {
        "name": "lookup_order",
        "description": "Tra trạng thái và số tiền của MỘT đơn theo mã đơn (ví dụ: 1234). Không dùng để tìm khách hàng.",
        "input_schema": {
            "type": "object",
            "properties": {"order_id": {"type": "string"}},
            "required": ["order_id"],
        },
    },
    {
        "name": "process_refund",
        "description": "Hoàn tiền cho một đơn của khách ĐÃ xác minh. Số tiền tính bằng VND.",
        "input_schema": {
            "type": "object",
            "properties": {
                "order_id": {"type": "string"},
                "amount": {"type": "integer", "description": "Số tiền hoàn, VND"},
                "reason": {"type": "string"},
            },
            "required": ["order_id", "amount", "reason"],
        },
    },
    {
        "name": "escalate_to_human",
        "description": "Chuyển cho nhân viên, kèm bản tóm tắt để nhân viên không phải hỏi lại khách.",
        "input_schema": {
            "type": "object",
            "properties": {
                "summary": {"type": "string", "description": "Chuyện gì đã xảy ra, các con số chính xác"},
                "actions_taken": {"type": "array", "items": {"type": "string"}},
                "recommended_action": {"type": "string"},
            },
            "required": ["summary", "actions_taken", "recommended_action"],
        },
    },
]

# Dữ liệu giả lập; thực tế là cơ sở dữ liệu và API nội bộ
CUSTOMERS = {"lan@example.com": "C-301"}
ORDERS = {
    "1234": {"customer_id": "C-301", "status": "delivered", "amount": 1_250_000},
    "5678": {"customer_id": "C-301", "status": "delivered", "amount": 3_400_000},
}


def run_tool(name: str, args: dict, session: dict) -> tuple[dict, bool]:
    """Chạy công cụ thật. Trả về (nội dung, có phải lỗi không)."""
    def fail(category, message):
        return {"errorCategory": category, "isRetryable": False, "message": message}, True

    if name == "get_customer":
        customer_id = CUSTOMERS.get(args["email"].strip().lower())
        if customer_id is None:
            return fail("validation", "Không tìm thấy khách với email này. Hãy hỏi lại email.")
        session["verified_customer"] = customer_id  # backend tự ghi nhận, model không điền được
        return {"customer_id": customer_id}, False

    if name == "lookup_order":
        order = ORDERS.get(args["order_id"])
        if order is None:
            return fail("validation", "Mã đơn không tồn tại. Hãy hỏi lại khách mã đơn.")
        return {"order_id": args["order_id"], **order}, False

    if name == "process_refund":
        # Cổng kiểm tra bằng code: luôn chạy, không phụ thuộc model có nhớ quy trình hay không
        if session.get("verified_customer") is None:
            return fail("permission", "Chưa xác minh khách. Hãy gọi get_customer trước.")
        order = ORDERS.get(args["order_id"])
        if order is None or order["customer_id"] != session["verified_customer"]:
            return fail("permission", "Đơn này không thuộc khách đã xác minh.")
        if args["amount"] > min(order["amount"], REFUND_LIMIT):
            return fail("business", "Vượt hạn mức hoàn tiền tự động. Hãy chuyển cho nhân viên bằng escalate_to_human.")
        return {"refund_id": f"RF-{args['order_id']}", "status": "succeeded"}, False

    if name == "escalate_to_human":
        return {"ticket": "T-20931", "eta_minutes": 8}, False

    return fail("validation", f"Không có công cụ tên {name}.")


def chat(user_text: str, messages: list, session: dict) -> str:
    """Xử lý một tin nhắn của khách. messages và session được giữ qua các lượt."""
    messages.append({"role": "user", "content": user_text})
    for _ in range(MAX_TURNS):
        response = client.beta.messages.create(
            model=MODEL,
            max_tokens=16000,
            system=SYSTEM,
            tools=TOOLS,
            messages=messages,
            # Nếu bộ lọc an toàn từ chối, API tự chạy lại yêu cầu trên model dự phòng phù hợp
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
        )

        if response.stop_reason == "max_tokens":
            raise RuntimeError("Câu trả lời bị cắt: không gửi cho khách, cần tăng max_tokens.")
        if response.stop_reason == "refusal":
            return "Xin lỗi, mình không thể hỗ trợ yêu cầu này. Mình chuyển bạn tới nhân viên nhé."

        # Giữ nguyên toàn bộ nội dung Claude trả về (chữ, tool_use, thinking...)
        messages.append({"role": "assistant", "content": response.content})

        if response.stop_reason == "end_turn":
            return "".join(b.text for b in response.content if b.type == "text")

        if response.stop_reason == "tool_use":
            results = []
            for block in response.content:
                if block.type == "tool_use":
                    content, is_error = run_tool(block.name, block.input, session)
                    results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,          # phải khớp với yêu cầu
                        "content": json.dumps(content, ensure_ascii=False),
                        "is_error": is_error,
                    })
            messages.append({"role": "user", "content": results})  # mọi kết quả trong MỘT tin nhắn
            continue

        raise RuntimeError(f"stop_reason chưa xử lý: {response.stop_reason}")

    # Chạm giới hạn vòng: có gì đó bất thường, dừng có kiểm soát
    raise RuntimeError("Vượt quá số vòng cho phép; chuyển cho nhân viên xem lại.")


if __name__ == "__main__":
    messages, session = [], {"verified_customer": None}
    print("Gõ tin nhắn (Ctrl+C để thoát).")
    while True:
        print("Agent:", chat(input("Bạn: "), messages, session))
