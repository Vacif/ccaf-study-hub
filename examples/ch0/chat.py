import anthropic

client = anthropic.Anthropic()
SYSTEM = "Bạn là nhân viên chăm sóc khách hàng của cửa hàng ABC. Trả lời ngắn gọn."
history = []  # Claude không nhớ gì: chương trình tự giữ lịch sử và gửi lại mỗi lần


def ask(question: str) -> str:
    history.append({"role": "user", "content": question})
    response = client.messages.create(
        model="claude-opus-5-5",
        max_tokens=1024,
        system=SYSTEM,
        messages=history,
    )
    if response.stop_reason != "end_turn":
        raise RuntimeError(f"Chưa trả lời xong: {response.stop_reason}")
    history.append({"role": "assistant", "content": response.content})
    print(f"(token vào: {response.usage.input_tokens})")  # tăng dần theo độ dài lịch sử
    return "".join(b.text for b in response.content if b.type == "text")


print(ask("Cửa hàng cho đổi size giày trong bao lâu?"))
print(ask("Mua online thì đổi thế nào?"))
