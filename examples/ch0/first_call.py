import anthropic

client = anthropic.Anthropic()  # tự đọc ANTHROPIC_API_KEY từ biến môi trường

response = client.messages.create(
    model="claude-opus-5-5",
    max_tokens=1024,
    system="Bạn là nhân viên chăm sóc khách hàng của cửa hàng ABC. Trả lời ngắn gọn.",
    messages=[{"role": "user", "content": "Cửa hàng cho đổi size giày trong bao lâu?"}],
)

print("stop_reason:", response.stop_reason)
for block in response.content:
    if block.type == "text":          # chỉ lấy khối chữ; có thể có khối khác như thinking
        print(block.text)
print("token vào:", response.usage.input_tokens, "| token ra:", response.usage.output_tokens)
