# Chính Sách Quyền Riêng Tư (Privacy Policy)

Dự án **Zalo Personal AI Agent** được xây dựng với ưu tiên hàng đầu là bảo vệ quyền riêng tư cá nhân và dữ liệu cuộc trò chuyện của người dùng.

---

## 1. Thu Thập Dữ Liệu (Data Collection)

- **Không Thu Thập Dữ Liệu Từ Xa (Zero Telemetry)**: Dự án hoàn toàn KHÔNG thu thập, lưu trữ hay gửi bất kỳ dữ liệu cá nhân, số điện thoại, danh bạ hay nội dung tin nhắn nào về máy chủ của tác giả hay bất kỳ bên thứ ba nào.
- **Hoạt Động Cục Bộ (Local Sandbox First)**: Toàn bộ quá trình xử lý tin nhắn, lưu trữ phiên đăng nhập (`session.json`), và token ủy quyền đều diễn ra 100% trên thiết bị cá nhân của bạn.

---

## 2. Kết Nối Trí Tuệ Nhân Tạo (AI Processing)

- Nội dung tin nhắn chỉ được gửi trực tiếp đến phiên làm việc Google Antigravity / Gemini đang chạy trên máy của bạn (hoặc Gemini API nếu cấu hình khóa riêng).
- Không có bất kỳ máy chủ trung gian (proxy / relay) nào can thiệp vào giữa luồng trao đổi dữ liệu.

---

## 3. Quản Lý Phiên & Quyền Khách (Guest Token Security)

- Người dùng lạ không thể truy cập AI trừ khi nhận được mã Token xác thực 50 ký tự từ Chủ nhân.
- Toàn bộ phiên trò chuyện của khách tự động hết hạn và bị xóa khỏi bộ nhớ sau **30 phút**.

---

## 4. Liên Hệ & Quyền Của Bạn (Contact & Rights)

Vì mọi dữ liệu đều nằm trên máy tính của bạn, bạn có toàn quyền xóa dữ liệu bất kỳ lúc nào bằng cách xóa các file cấu hình cục bộ (`session.json`, `chat_sessions.json`, `.env`). Mọi thắc mắc vui lòng liên hệ qua GitHub: [@giangsamne](https://github.com/giangsamne).
