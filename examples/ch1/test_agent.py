"""Kiểm thử vòng lặp agent mà không gọi API thật (không tốn tiền, kết quả luôn giống nhau).

Kịch bản: Claude cố hoàn tiền trước khi xác minh, rồi cố hoàn một đơn vượt hạn mức.
Cổng kiểm tra bằng code phải chặn cả hai lần. Chạy: python test_agent.py
"""
import json
import sys
import types

# Thay thư viện anthropic bằng một bản giả trước khi import agent, để không cần API key
sys.modules.setdefault("anthropic", types.SimpleNamespace(Anthropic=lambda: None))
import agent  # noqa: E402


def block(**fields):
    return types.SimpleNamespace(**fields)


def tool_use(id_, name, **args):
    return block(type="tool_use", id=id_, name=name, input=args)


# Các câu trả lời Claude "giả" sẽ trả về, lần lượt theo từng lần gọi API
SCRIPT = [
    block(stop_reason="tool_use", content=[
        block(type="text", text="Mình hoàn tiền ngay cho bạn."),
        tool_use("t1", "process_refund", order_id="1234", amount=1_250_000, reason="khách yêu cầu"),
    ]),
    block(stop_reason="tool_use", content=[
        tool_use("t2", "get_customer", email="Lan@example.com"),
        tool_use("t3", "lookup_order", order_id="1234"),
    ]),
    block(stop_reason="tool_use", content=[
        tool_use("t4", "process_refund", order_id="5678", amount=3_400_000, reason="khách yêu cầu"),
    ]),
    block(stop_reason="tool_use", content=[
        tool_use("t5", "process_refund", order_id="1234", amount=1_250_000, reason="khách yêu cầu"),
    ]),
    block(stop_reason="end_turn", content=[
        block(type="thinking", thinking=""),
        block(type="text", text="Đã hoàn 1.250.000đ cho đơn 1234."),
    ]),
]


class FakeMessages:
    def __init__(self):
        self.calls = []

    def create(self, **request):
        self.calls.append(request)
        return SCRIPT[len(self.calls) - 1]


def main():
    fake = FakeMessages()
    agent.client = types.SimpleNamespace(beta=types.SimpleNamespace(messages=fake))
    messages, session = [], {"verified_customer": None}

    answer = agent.chat("Hoàn tiền đơn 1234 giúp tôi, email lan@example.com", messages, session)

    results = {}
    for m in messages:
        if m["role"] == "user" and isinstance(m["content"], list):
            for r in m["content"]:
                results[r["tool_use_id"]] = (r["is_error"], json.loads(r["content"]))

    assert results["t1"][0] and results["t1"][1]["errorCategory"] == "permission", "Phải chặn khi chưa xác minh"
    assert results["t4"][0] and results["t4"][1]["errorCategory"] == "business", "Phải chặn khi vượt hạn mức"
    assert not results["t5"][0], "Đơn hợp lệ của khách đã xác minh phải được hoàn"
    assert {"t2", "t3"} <= results.keys(), "Hai kết quả của cùng một lượt phải được gửi lại"
    assert fake.calls[0]["fallbacks"] == "default"
    print("Tất cả kiểm thử đều đạt. Câu trả lời cuối:", answer)


if __name__ == "__main__":
    main()
