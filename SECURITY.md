# Chính Sách Bảo Mật (Security Policy)

Chúng tôi rất coi trọng vấn đề bảo mật và quyền riêng tư của người dùng trong dự án **Zalo Personal AI Agent**. Mọi mã nguồn được thiết kế theo nguyên tắc bảo vệ dữ liệu cục bộ (Local Sandbox First).

---

## 🛡 Các Phiên Bản Được Hỗ Trợ (Supported Versions)

Chúng tôi cung cấp các bản vá bảo mật và cải tiến cho các phiên bản đang hoạt động:

| Phiên Bản | Được Hỗ Trợ |
|:---|:---:|
| `0.1.x` (Beta) | :white_check_mark: Có |
| `< 0.1.0` | :x: Không |

---

## 🔒 Nguyên Tắc An Toàn & Quyền Riêng Tư (Security Principles)

1. **Lưu Trữ Cục Bộ (Zero Cloud Relay)**:
   - Toàn bộ phiên đăng nhập Zalo (`session.json`), khóa môi trường (`.env`) và lịch sử tin nhắn chỉ tồn tại trên máy tính cá nhân của người dùng.
   - Không có máy chủ trung gian (third-party telemetry/relay) thu thập dữ liệu cuộc trò chuyện.
2. **Cơ Chế Phân Quyền Token Khách (Guest Token Sandbox)**:
   - Người lạ nhắn tin không thể tương tác trực tiếp với AI trừ khi được Chủ nhân cấp mã Token xác thực 50 ký tự.
   - Phiên khách tự động hết hạn và xóa sạch sau **30 phút**.
3. **Bảo Vệ Kho Lưu Trữ (Git Secrets Prevention)**:
   - Các tệp tin chứa token, UID cá nhân, cookies đăng nhập đều được khai báo nghiêm ngặt trong `.gitignore`.
   - Tuyệt đối không đẩy bất kỳ thông tin nhạy cảm nào lên GitHub.

---

## 🚨 Báo Cáo Lỗ Hổng Bảo Mật (Reporting a Vulnerability)

Nếu bạn phát hiện bất kỳ vấn đề bảo mật hoặc lỗ hổng tiềm ẩn nào trong mã nguồn:

1. **Vui lòng KHÔNG mở Issue công khai trên GitHub** để tránh kẻ xấu lợi dụng trước khi lỗ hổng được khắc phục.
2. Gửi thông tin chi tiết qua tính năng bảo mật riêng tư:
   - [Mở GitHub Private Vulnerability Report](https://github.com/giangsamne/zalo-personal-ai-agent/security/advisories/new)
   - Hoặc liên hệ trực tiếp với tác giả qua hồ sơ GitHub: [@giangsamne](https://github.com/giangsamne)
3. Chúng tôi cam kết phản hồi trong vòng **48 giờ** và nhanh chóng phát hành bản vá bảo mật.

Xin chân thành cảm ơn sự đóng góp của bạn vào sự an toàn của cộng đồng!
