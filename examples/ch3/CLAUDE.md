# Dự án: cửa hàng ABC (backend)

## Lệnh hay dùng
- Cài đặt: `npm install`
- Chạy test: `npm test` (chạy một file: `npm test -- path/to/file.test.ts`)
- Kiểm tra kiểu và lint: `npm run check`

## Quy ước chung
- TypeScript strict, không dùng `any`.
- Mọi hàm gọi cơ sở dữ liệu nằm trong `src/db/`, không gọi trực tiếp từ route.
- Số tiền luôn là số nguyên, đơn vị VND.
- Sau khi sửa code, chạy test liên quan trước khi báo đã xong.

## Tài liệu chi tiết (chỉ đọc khi cần)
- Quy ước API: @docs/api-conventions.md
