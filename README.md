# 🤖 Zalo Personal AI Agent

> **Trợ lý AI cá nhân Zalo đa nền tảng (Linux, macOS, Windows) tích hợp trực tiếp Antigravity Project, cơ chế cấp quyền khách bằng mã Token bảo mật 30 phút và 100% đàm thoại với AI Agent.**

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org/)
[![Version](https://img.shields.io/badge/Release-v1.0.0-blue.svg)](https://github.com/giangsamne/zalo-personal-ai-agent/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platforms](https://img.shields.io/badge/Platform-Linux%20%7C%20macOS%20%7C%20Windows-blue.svg)]()

---

## ✨ Điểm Nổi Bật (Features)

1. **Tích hợp Native Antigravity Project (`Zalo AI Assistant`)**:
   - Sử dụng trí tuệ nhân tạo của Antigravity đang chạy trên máy, **hoàn toàn không cần mua hay điền API key**.
   - **Gom tất cả các phiên chat vào Project riêng `zalo-assistant`**: Quản lý gọn gàng trong Antigravity, **không làm ảnh hưởng hay xáo trộn** không gian làm việc code cá nhân của bạn.
   - Master sở hữu một đoạn chat riêng biệt cao cấp (`Zalo: Master`, model `pro`).
   - Mỗi khách khi kích hoạt Token thành công sẽ được tạo một đoạn chat riêng (`Zalo: <Tên khách> (<UID>)`, model `flash_lite` / `flash`).

2. **100% Trò Chuyện Trực Tiếp Với AI Agent**:
   - Không can thiệp bằng các lệnh gán sẵn cục bộ. Mọi tin nhắn đều được chuyển trực tiếp vào đoạn chat để AI Agent tự do suy nghĩ và phản hồi một cách thông minh, tự nhiên.

3. **Cơ chế cấp quyền khách bằng Token 50 ký tự (Guest Token Authorization)**:
   - Khi có người lạ nhắn tin lần đầu: Bot tự động trích xuất thông tin hồ sơ Zalo và tạo **mã Token 50 ký tự** gửi riêng cho Master duyệt.
   - Khách chỉ trò chuyện được với Bot sau khi nhập đúng mã Token.
   - Phiên kết nối duy trì trong **30 phút** hoặc kết thúc ngay khi khách gõ lệnh `/exit`.

4. **Đa nền tảng 100% & Tự khởi động cùng hệ điều hành**:
   - Chạy trên **Ubuntu/Debian Linux**, **macOS** và **Windows 10/11**.
   - Hỗ trợ thiết lập tự chạy khi bật máy (`systemd` trên Linux, `LaunchAgent` trên macOS, `VBS Startup` trên Windows).

---

## 📁 Cấu Trúc Dự Án

```text
zalo-personal-ai-agent/
├── daemon.js              # Dịch vụ nền chính (Zalo client, AI Router, HTTP API)
├── lib/
│   └── antigravity.js     # Bridge kết nối Antigravity Language Server
├── server.js              # MCP Server (Model Context Protocol)
├── login.js               # Tiện ích đăng nhập quét mã QR Zalo
├── package.json           # Khai báo cấu hình và scripts npm
├── .env.example           # Mẫu biến môi trường (MASTER_UID)
├── chat_sessions.json     # Quản lý phiên và ID chat của từng người
└── scripts/
    └── setup-autostart.js # Thiết lập tự động khởi động cùng hệ thống
```

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Cài đặt các gói phụ thuộc
```bash
git clone https://github.com/giangsamne/zalo-personal-ai-agent.git
cd zalo-personal-ai-agent
npm install
```

### 2. Khởi chạy SIÊU ĐƠN GIẢN (1 Click / 1 Lệnh)

- **Trên Windows**: Nhấp đúp chuột vào file **`start.bat`**.
- **Trên Linux / macOS**: Chạy script:
  ```bash
  ./start.sh
  # hoặc: npm start
  ```

> 💡 **Tự động 100%**: 
> - Nếu lần đầu chạy, bot sẽ **tự động cài đặt thư viện** và **hiển thị mã QR** ngay trên màn hình.
> - Bạn chỉ cần mở Zalo quét mã 1 lần duy nhất, bot sẽ tự lưu phiên và khởi động ngay lập tức!
> - Từ lần sau, bot khởi động thẳng chỉ trong **1 giây**.

### 3. Tự Động Khởi Động Khi Bật Máy Tính
Chỉ cần chạy lệnh này một lần duy nhất:
```bash
npm run setup-autostart
```
Bot sẽ tự động chạy ngầm mỗi khi bạn bật máy (hỗ trợ Linux systemd, Windows VBS Startup, macOS LaunchAgent).

---

## 📡 API Trạng Thái Cục Bộ (Local Status API)

Kiểm tra trạng thái daemon, tài khoản Zalo và phiên bản bot đang chạy:
```bash
curl http://127.0.0.1:39123/status
```

Phản hồi mẫu:
```json
{
  "connected": true,
  "ownId": "123456789012345678",
  "masterUid": "987654321098765432",
  "activeSessions": 1,
  "antigravity": {
    "available": true,
    "projectId": "zalo-assistant",
    "masterConvId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "agentApi": "agentapi"
  },
  "version": "1.0.0"
}
```

---

## 📄 Bản Quyền (License)

Dự án được phân phối dưới giấy phép [MIT License](LICENSE).
