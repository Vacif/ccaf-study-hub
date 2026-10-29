---
name: release-notes
description: Viết ghi chú phát hành (release notes) bằng tiếng Việt từ các commit kể từ tag gần nhất. Dùng khi người dùng nhờ viết release notes, changelog, hoặc tóm tắt thay đổi cho một phiên bản.
context: fork
allowed-tools: Bash(git log:*), Bash(git describe:*), Read
---

# Viết release notes

1. Tìm tag gần nhất: `git describe --tags --abbrev=0`.
2. Lấy danh sách commit từ tag đó tới HEAD: `git log <tag>..HEAD --oneline`.
3. Nhóm thay đổi thành: Tính năng mới, Sửa lỗi, Thay đổi cần lưu ý khi nâng cấp.
4. Viết cho người dùng cuối đọc: nói thay đổi mang lại gì, không chép nguyên câu commit.
5. Trả về bản ghi chú hoàn chỉnh dạng Markdown, không kèm các bước trung gian.
