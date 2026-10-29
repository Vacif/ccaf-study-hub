"""Đo xem Claude chọn đúng công cụ bao nhiêu phần trăm, trước và sau khi sửa mô tả."""
import sys
from pathlib import Path

import anthropic

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "ch1"))
from agent import TOOLS  # dùng đúng bộ công cụ của agent ở chương 1

client = anthropic.Anthropic()

# Mỗi dòng: câu hỏi thật của khách, công cụ đúng (None = không cần công cụ)
CASES = [
    ("Đơn 1234 của tôi giao chưa vậy?", "lookup_order"),
    ("Email tôi là lan@example.com, kiểm tra tài khoản giúp", "get_customer"),
    ("Cho tôi gặp nhân viên thật", "escalate_to_human"),
    ("Cửa hàng mở cửa mấy giờ?", None),
    ("Hoàn tiền đơn 1234 giúp tôi, email lan@example.com", "get_customer"),  # phải xác minh trước
]


def first_tool(question: str) -> str | None:
    response = client.messages.create(
        model="claude-opus-5-5",
        max_tokens=4096,
        tools=TOOLS,
        messages=[{"role": "user", "content": question}],
    )
    return next((b.name for b in response.content if b.type == "tool_use"), None)


if __name__ == "__main__":
    correct = 0
    for question, expected in CASES:
        got = first_tool(question)
        correct += got == expected
        print("✓" if got == expected else "✗", f"{question!r} → {got} (đúng: {expected})")
    print(f"Chọn đúng {correct}/{len(CASES)}")
