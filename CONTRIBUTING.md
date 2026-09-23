# Hướng Dẫn Đóng Góp (Contributing Guidelines)

Cảm ơn bạn đã quan tâm và muốn đóng góp cho dự án **Zalo Personal AI Agent**! Mọi đóng góp từ báo lỗi, cải tiến tài liệu đến bổ sung tính năng đều rất được trân trọng.

---

## 🛠 Quy Trình Đóng Góp

1. **Fork Repository** về tài khoản GitHub của bạn.
2. **Clone** nhánh fork về máy tính:
   ```bash
   git clone https://github.com/<your-username>/zalo-personal-ai-agent.git
   cd zalo-personal-ai-agent
   npm install
   ```
3. **Tạo Branch mới** cho tính năng hoặc bản sửa lỗi:
   ```bash
   git checkout -b feature/ten-tinh-nang
   # hoặc:
   git checkout -b fix/ten-loi
   ```
4. **Viết Code & Kiểm Tra**:
   - Tuân thủ cấu trúc mã nguồn hiện tại (ES Module, Node.js 20+).
   - Kiểm tra cú pháp trước khi commit:
     ```bash
     node -c daemon.js
     node -c lib/antigravity.js
     ```
   - **Tuyệt đối không commit các file nhạy cảm** (`session.json`, `.env`, `chat_sessions.json`, `messages.json`).
5. **Commit với thông điệp rõ ràng**:
   ```bash
   git commit -m "feat: mô tả tính năng mới"
   # hoặc:
   git commit -m "fix: mô tả lỗi đã sửa"
   ```
6. **Push lên GitHub & Tạo Pull Request**:
   - Push lên nhánh trên fork của bạn:
     ```bash
     git push origin feature/ten-tinh-nang
     ```
   - Mở Pull Request vào nhánh `main` của repo gốc kèm mô tả chi tiết các thay đổi.

---

## 🔒 Nguyên Tắc Bảo Mật

- Không đưa bất kỳ thông tin cá nhân, UID thật, số điện thoại, cookie hoặc API key vào mã nguồn hay tài liệu.
- Mọi cấu hình riêng tư phải luôn được đọc từ biến môi trường qua file `.env`.

Xin chân thành cảm ơn sự đóng góp của bạn!
