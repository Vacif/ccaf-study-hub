"""Hai mẫu nhỏ cho chương 5: giữ case facts nguyên văn, và giữ nguồn gốc cho từng nhận định."""
import json

BASE_SYSTEM = "Bạn là nhân viên chăm sóc khách hàng của cửa hàng ABC. Khi nhắc tới số liệu, luôn dựa vào <case_facts>."


def system_prompt(case_facts: dict) -> str:
    """Dữ kiện quan trọng nằm ở đầu, nguyên văn, và không bao giờ đi qua bước tóm tắt.
    Khối này cố định trong suốt cuộc trò chuyện nên vẫn tận dụng được prompt caching."""
    facts = json.dumps(case_facts, ensure_ascii=False, indent=2)
    return f"{BASE_SYSTEM}\n<case_facts>\n{facts}\n</case_facts>"


def update_facts(case_facts: dict, tool_name: str, result: dict) -> dict:
    """Backend tự chép các con số từ kết quả công cụ vào case facts, không nhờ model nhớ."""
    if tool_name == "lookup_order" and result.get("found"):
        case_facts.setdefault("orders", {})[result["order_id"]] = {
            "status": result["status"],
            "amount_vnd": result["amount_vnd"],
        }
    return case_facts


# Nguồn gốc thông tin: mỗi nhận định là một bản ghi có cấu trúc, đi nguyên vẹn qua mọi bước
Finding = dict  # {"claim", "source", "url", "published", "kind"}

findings: list[Finding] = [
    {"claim": "Thị trường tăng 12% năm 2025", "source": "Báo cáo A", "url": "https://example.com/a",
     "published": "2025-01-15", "kind": "dự báo"},
    {"claim": "Thị trường tăng 19% năm 2025", "source": "Báo cáo B", "url": "https://example.com/b",
     "published": "2025-11-20", "kind": "số liệu cả năm"},
]


def render_conflict(items: list[Finding]) -> str:
    """Số liệu mâu thuẫn: trình bày cả hai kèm nguồn, ngày và loại số liệu, không tự chọn."""
    lines = [f"- {f['claim']} ({f['source']}, {f['published']}, {f['kind']}): {f['url']}" for f in items]
    return "Các nguồn đưa ra con số khác nhau:\n" + "\n".join(lines)


if __name__ == "__main__":
    facts = update_facts({"customer_id": "C-301"}, "lookup_order",
                         {"found": True, "order_id": "8812", "status": "delivered", "amount_vnd": 1_250_000})
    print(system_prompt(facts))
    print(render_conflict(findings))
