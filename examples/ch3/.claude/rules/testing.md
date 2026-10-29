---
paths:
  - "**/*.test.ts"
---

# Quy ước viết test

- Mỗi test kiểm tra một hành vi, tên test mô tả hành vi đó bằng câu đầy đủ.
- Không gọi mạng thật: dùng `mockFetch` trong `test/helpers.ts`.
- Dữ liệu mẫu lấy từ `test/fixtures/`, không tự tạo số tiền hay ngày ngẫu nhiên.
- Mọi lỗi nghiệp vụ phải có test cho cả trường hợp đúng và trường hợp bị từ chối.
