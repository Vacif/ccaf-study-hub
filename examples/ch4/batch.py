"""Chạy trích xuất hàng loạt bằng Message Batches API (rẻ hơn khoảng 50%, có thể mất tới 24 giờ)."""
import json
import time

import anthropic
from anthropic.types.message_create_params import MessageCreateParamsNonStreaming
from anthropic.types.messages.batch_create_params import Request

from extract import build_request, validate

client = anthropic.Anthropic()


def submit(docs: dict[str, str]) -> str:
    """docs: {mã tài liệu: nội dung}. Mã tài liệu dùng luôn làm custom_id."""
    batch = client.messages.batches.create(requests=[
        Request(custom_id=doc_id, params=MessageCreateParamsNonStreaming(**build_request(text)))
        for doc_id, text in docs.items()
    ])
    return batch.id


def wait(batch_id: str) -> None:
    while client.messages.batches.retrieve(batch_id).processing_status != "ended":
        time.sleep(60)


def collect(batch_id: str) -> tuple[dict, dict]:
    """Kết quả về KHÔNG theo thứ tự gửi: luôn ghép theo custom_id."""
    ok, failed = {}, {}
    for item in client.messages.batches.results(batch_id):
        if item.result.type != "succeeded":
            failed[item.custom_id] = item.result.type          # errored / canceled / expired
            continue
        message = item.result.message
        if message.stop_reason != "end_turn":
            failed[item.custom_id] = message.stop_reason
            continue
        inv = json.loads(next(b.text for b in message.content if b.type == "text"))
        errors = validate(inv)
        if errors:
            failed[item.custom_id] = errors
        else:
            ok[item.custom_id] = inv
    return ok, failed


if __name__ == "__main__":
    docs = {"inv-0001": "...", "inv-0002": "..."}   # đọc từ kho tài liệu của bạn
    batch_id = submit(docs)
    wait(batch_id)
    ok, failed = collect(batch_id)
    print(f"Thành công: {len(ok)}, cần xử lý lại: {len(failed)}")
    # Chỉ gửi lại phần lỗi, theo custom_id; lỗi do thiếu thông tin thì chuyển người kiểm tra thay vì gửi lại
