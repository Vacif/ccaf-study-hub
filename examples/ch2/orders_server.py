"""Máy chủ MCP nhỏ cung cấp công cụ tra đơn hàng cho Claude Code hoặc Agent SDK."""
import json
import os

from mcp.server.mcpserver import MCPServer
from mcp.server.mcpserver.exceptions import ToolError

server = MCPServer("orders")

# Dữ liệu giả lập; thực tế sẽ gọi API nội bộ bằng khóa trong biến môi trường
API_KEY = os.environ.get("ORDERS_API_KEY", "")
ORDERS = {"1234": {"status": "delivered", "amount_vnd": 1_250_000, "delivered_at": "2026-10-03"}}


def error(category: str, message: str, retryable: bool = False) -> ToolError:
    """Lỗi có cấu trúc: Claude đọc được loại lỗi và biết có nên thử lại hay không."""
    return ToolError(json.dumps({"errorCategory": category, "isRetryable": retryable, "message": message}, ensure_ascii=False))


@server.tool()
def lookup_order(order_id: str) -> dict:
    """Tra trạng thái, số tiền và ngày giao của MỘT đơn hàng theo mã đơn (ví dụ: "1234").
    Dùng khi khách hỏi đơn của họ đang ở đâu, đã giao chưa, trị giá bao nhiêu.
    Không dùng để tìm thông tin khách hàng (dùng get_customer)."""
    if not order_id.isdigit():
        raise error("validation", f"Mã đơn '{order_id}' không hợp lệ: mã đơn chỉ gồm chữ số, ví dụ 1234.")
    order = ORDERS.get(order_id)
    if order is None:
        # Không có đơn là kết quả hợp lệ, không phải lỗi hệ thống
        return {"found": False, "order_id": order_id}
    return {"found": True, "order_id": order_id, **order}


if __name__ == "__main__":
    server.run()  # mặc định giao tiếp qua stdio, đúng với cấu hình "command" trong .mcp.json
