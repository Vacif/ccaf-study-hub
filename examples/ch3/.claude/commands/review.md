---
description: Review thay đổi hiện tại theo tiêu chí của nhóm
---

Review các thay đổi chưa commit (hoặc phạm vi được nêu: $ARGUMENTS).

Chỉ báo những vấn đề thuộc các nhóm sau, mỗi vấn đề ghi rõ file, dòng và cách sửa:
1. Bảo mật: SQL ghép chuỗi, lộ khóa bí mật, thiếu kiểm tra quyền.
2. Sai logic: điều kiện ngược, bỏ sót trường hợp null, số tiền tính sai.
3. Thiếu test cho hành vi mới.

Không báo về định dạng code hay cách đặt tên, vì đã có công cụ lint lo phần đó.
Nếu không có vấn đề nào, chỉ trả lời: "Không phát hiện vấn đề."
