"""Trích xuất hóa đơn ra JSON, kiểm tra hợp lệ và thử lại kèm lỗi cụ thể."""
import json
from datetime import date

import anthropic

client = anthropic.Anthropic()
MODEL = "claude-opus-5-5"

SYSTEM = """Bạn trích xuất dữ liệu từ hóa đơn.
Chỉ ghi những gì có trên tài liệu. Trường nào tài liệu không có thì để null, tuyệt đối không đoán."""

NULLABLE_STR = {"anyOf": [{"type": "string"}, {"type": "null"}]}
INVOICE_SCHEMA = {
    "type": "object",
    "properties": {
        "invoice_number": NULLABLE_STR,
        "invoice_date": {"anyOf": [{"type": "string", "format": "date"}, {"type": "null"}]},
        "tax_id": NULLABLE_STR,
        "currency": {"type": "string", "enum": ["VND", "USD", "other"]},
        "lines": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "description": {"type": "string"},
                    "quantity": {"type": "number"},
                    "unit_price": {"type": "number"},
                },
                "required": ["description", "quantity", "unit_price"],
                "additionalProperties": False,
            },
        },
        "stated_total": {"anyOf": [{"type": "number"}, {"type": "null"}]},
    },
    "required": ["invoice_number", "invoice_date", "tax_id", "currency", "lines", "stated_total"],
    "additionalProperties": False,
}


def build_request(doc_text: str, feedback: str | None = None) -> dict:
    """Tham số cho một lần gọi; dùng chung cho gọi trực tiếp và Batch API."""
    content = f"Trích xuất hóa đơn sau:\n<invoice>\n{doc_text}\n</invoice>"
    if feedback:
        content += f"\n\nLần trích xuất trước có lỗi. Hãy đọc lại tài liệu và sửa:\n{feedback}"
    return {
        "model": MODEL,
        "max_tokens": 4096,
        "system": SYSTEM,
        "messages": [{"role": "user", "content": content}],
        "output_config": {"format": {"type": "json_schema", "schema": INVOICE_SCHEMA}},
    }


def parse(response) -> dict:
    if response.stop_reason != "end_turn":
        raise RuntimeError(f"Không lấy được JSON hoàn chỉnh: {response.stop_reason}")
    text = next(b.text for b in response.content if b.type == "text")
    return json.loads(text)


def validate(inv: dict) -> list[str]:
    """Kiểm tra ý nghĩa. Schema đã lo phần cấu trúc, phần này lo phần giá trị."""
    errors = []
    if inv["invoice_date"]:
        try:
            date.fromisoformat(inv["invoice_date"])
        except ValueError:
            errors.append(f"invoice_date '{inv['invoice_date']}' không phải ngày có thật.")
    calculated = sum(line["quantity"] * line["unit_price"] for line in inv["lines"])
    if inv["stated_total"] is not None and abs(calculated - inv["stated_total"]) > 1:
        errors.append(f"Tổng các dòng là {calculated:,.0f} nhưng tổng ghi trên hóa đơn là {inv['stated_total']:,.0f}. Hãy đọc lại từng dòng.")
    return errors


def extract(doc_text: str, max_retries: int = 2) -> dict:
    feedback = None
    for attempt in range(max_retries + 1):
        inv = parse(client.messages.create(**build_request(doc_text, feedback)))
        errors = validate(inv)
        if not errors:
            return {"status": "ok", "invoice": inv}
        feedback = "\n".join(f"- {e}" for e in errors)
    # Thử lại không hết lỗi: chuyển người kiểm tra, kèm lỗi để họ biết cần xem chỗ nào
    return {"status": "needs_review", "invoice": inv, "errors": errors}


if __name__ == "__main__":
    sample = """CÔNG TY TNHH ABC - HÓA ĐƠN SỐ 0001234
Ngày 15/03/2026
Bút bi xanh   x 10   5.000
Sổ tay A5     x 3    25.000
Tổng cộng: 125.000 VND"""
    print(json.dumps(extract(sample), ensure_ascii=False, indent=2))
