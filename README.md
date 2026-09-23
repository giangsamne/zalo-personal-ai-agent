<div align="center">

# 🤖 Zalo Personal AI Agent

**Trợ lý AI cá nhân Zalo đa nền tảng kết nối trực tiếp Google Antigravity & Gemini**  
*Cơ chế phân quyền Master, bảo mật khách bằng mã Token 30 phút, 1-Click Startup và hoàn toàn không cần API key.*

<p align="center">
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-v20%2B-339933.svg?style=flat&logo=nodedotjs&logoColor=white" alt="Node.js" /></a>
  <a href="https://github.com/giangsamne/zalo-personal-ai-agent/releases"><img src="https://img.shields.io/badge/Release-v0.1.0--beta-orange.svg?style=flat&logo=git&logoColor=white" alt="Version" /></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat" alt="License: MIT" /></a>
  <a href="https://github.com/giangsamne/zalo-personal-ai-agent/stargazers"><img src="https://img.shields.io/github/stars/giangsamne/zalo-personal-ai-agent?style=flat&color=gold" alt="GitHub Stars" /></a>
  <a href="https://github.com/giangsamne/zalo-personal-ai-agent/issues"><img src="https://img.shields.io/github/issues/giangsamne/zalo-personal-ai-agent?style=flat&color=red" alt="GitHub Issues" /></a>
  <a href="#"><img src="https://img.shields.io/badge/Platform-Linux%20%7C%20macOS%20%7C%20Windows-blue.svg?style=flat" alt="Platforms" /></a>
</p>

</div>

---

## 📖 Giới Thiệu (Overview)

**Zalo Personal AI Agent** là giải pháp cầu nối thông minh biến tài khoản Zalo cá nhân của bạn thành một trợ lý AI thông minh, tự động trả lời tin nhắn thời gian thực dựa trên nền tảng **Google Antigravity Language Server** đang chạy trên máy tính.

Dự án được thiết kế theo tiêu chí **Zero Configuration & 1-Click Startup**: bạn không cần phải đăng ký thẻ tín dụng hay mua Gemini API key riêng, mọi hội thoại đều được nhóm gọn gàng vào một Project riêng trên Antigravity mà không làm ảnh hưởng đến môi trường làm việc cá nhân của bạn.

---

## 🏗 Kiến Trúc Hệ Thống (Architecture)

```text
               ┌────────────────────────────────────────────────────────┐
               │                     NGƯỜI DÙNG ZALO                    │
               │   (Chủ nhân / Master)             (Khách nhắn tin)     │
               └───────────┬────────────────────────────────┬───────────┘
                           │                                │
                           ▼                                ▼
               ┌────────────────────────────────────────────────────────┐
               │              Zalo Client (WebSocket / Listener)        │
               └───────────────────────────┬────────────────────────────┘
                                           │
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │                Zalo AI Daemon (daemon.js)              │
               │  - Phân luồng Master / Guest Token Authorization       │
               │  - Tự động quản lý phiên trò chuyện (Sessions)         │
               └───────────────────────────┬────────────────────────────┘
                                           │ (agentapi CLI / gRPC)
                                           ▼
               ┌────────────────────────────────────────────────────────┐
               │          Google Antigravity Language Server            │
               │          Project: [Zalo AI Assistant]                  │
               │                                                        │
               │  ┌────────────────────────┐  ┌──────────────────────┐  │
               │  │ Thread: Master Giang   │  │ Thread: Guest (<UID>)│  │
               │  │ Model: Gemini Pro      │  │ Model: Flash / Lite  │  │
               │  └────────────────────────┘  └──────────────────────┘  │
               └────────────────────────────────────────────────────────┘
```

---

## ✨ Tính Năng Nổi Bật (Key Features)

- 🧠 **Tích hợp Native Antigravity Project (`Zalo AI Assistant`)**:
  - Tận dụng sức mạnh suy luận từ session Antigravity đang chạy trên máy.
  - **Không tốn chi phí API**: Không cần `GEMINI_API_KEY`.
  - Gom toàn bộ chat vào Project riêng, không làm xáo trộn sidebar làm việc chính.
- 💬 **100% Trò chuyện với AI Agent**:
  - Không chặn bằng các lệnh cứng. Mọi tin nhắn đều được chuyển vào đoạn chat để AI Agent tự do suy nghĩ và phản hồi tự nhiên.
  - Phân tầng mô hình thông minh: Master dùng mô hình cao cấp (`pro`), khách dùng mô hình tốc độ cao (`flash` / `flash_lite`).
- 🔐 **Cơ chế cấp quyền khách bằng mã Token 50 ký tự**:
  - Người lạ nhắn tin lần đầu sẽ nhận thông báo chờ duyệt.
  - Bot gửi thông tin hồ sơ khách kèm **mã Token 50 ký tự** về Zalo của Master.
  - Khách nhập đúng mã sẽ được kích hoạt phiên trò chuyện độc lập trong **30 phút**.
  - Hỗ trợ lệnh `/exit` để khách chủ động kết thúc phiên sớm.
- ⚡ **Khởi chạy siêu tốc (1-Click / 1 Lệnh)**:
  - Windows: Nhấp đúp chuột file `start.bat`.
  - Linux / macOS: Chạy script `./start.sh`.
  - Tự động cài đặt thư viện và tự động in mã QR đăng nhập nếu chưa có session.
- 🔄 **Tự động chạy ngầm cùng hệ điều hành**:
  - Hỗ trợ `systemd` trên Linux, `LaunchAgent` trên macOS và `VBS Startup` ngầm trên Windows.

---

## 🚀 Khởi Chạy Nhanh (Quick Start)

### 1. Tải về dự án
```bash
git clone https://github.com/giangsamne/zalo-personal-ai-agent.git
cd zalo-personal-ai-agent
```

### 2. Khởi chạy trong 1 thao tác

- **Trên Windows**: Nhấp đúp chuột vào file 👉 **`start.bat`**.
- **Trên Linux / macOS**: Chạy lệnh:
  ```bash
  ./start.sh
  # hoặc: npm start
  ```

> 💡 **Tự động 100%**:
> - Nếu là lần đầu tiên chạy, bot sẽ **tự động cài đặt thư viện** (`npm install`).
> - Nếu chưa có phiên đăng nhập, bot sẽ **in mã QR ngay trên màn hình terminal**. Bạn chỉ cần mở Zalo trên điện thoại quét 1 lần duy nhất!
> - Từ lần thứ hai trở đi, bot khởi động thẳng trong vòng **1 giây**.

### 3. Cấu hình tự khởi động khi bật máy (Tùy chọn)
Chạy lệnh sau đúng một lần duy nhất:
```bash
npm run setup-autostart
```
Từ nay về sau, mỗi khi bật máy tính lên, Bot sẽ tự động chạy ngầm và lắng nghe tin nhắn Zalo.

---

## 💬 Hướng Dẫn Sử Dụng Thực Tế (Cách Dùng)

### 👑 Dành cho Chủ Nhân (Master):
- **Trò chuyện trực tiếp**: Bạn chỉ cần gửi tin nhắn văn bản bình thường đến tài khoản Zalo của bot. Trợ lý AI sẽ tự động hiểu ngữ cảnh và phản hồi với mô hình cao cấp (**Gemini Pro**).
- **Phê duyệt khách nhắn tin**:
  - Khi có bạn bè hoặc người lạ nhắn tin đến lần đầu, bot sẽ lập tức gửi thông báo về Zalo của bạn:
    > 🔔 *Có người dùng mới muốn trò chuyện: [Tên khách] (UID: ...)*  
    > 🔑 *Mã Token cấp quyền (30 phút): `xxxxxxxx...`*
  - Nếu bạn đồng ý cho họ trò chuyện với AI, bạn chỉ việc chuyển tiếp (forward) mã token này cho họ.

### 👤 Dành cho Khách (Guest / Bạn bè):
- **Nhắn tin lần đầu**: Khách nhận được lời chào tự động thông báo tài khoản đang được quản lý bởi AI và cần mã xác thực.
- **Kích hoạt phiên AI**: Khách chỉ cần gửi đúng chuỗi mã Token nhận được từ chủ nhân. Hệ thống sẽ kích hoạt một phiên trò chuyện riêng tư trong **30 phút** với mô hình tốc độ cao (**Gemini Flash**).
- **Chủ động thoát**: Khách có thể gửi tin nhắn `/exit` bất cứ lúc nào để kết thúc phiên sớm.

---

## ⚙️ Cấu Hình Nâng Cao (Configuration)

Bạn có thể tạo file `.env` từ file mẫu `.env.example` để tùy chỉnh thông tin quản trị viên:

```bash
cp .env.example .env
```

| Biến Môi Trường | Mặc Định | Mô Tả |
|:---|:---|:---|
| `MASTER_UID` | `""` | ID tài khoản Zalo của Chủ nhân / Quản trị viên. |
| `MASTER_NAME` | `"Chủ nhân"` | Tên hiển thị của Master trong các đoạn chat AI. |
| `GEMINI_API_KEY` | `""` | *(Tùy chọn)* Dùng khi muốn chạy độc lập không qua Antigravity. |

> 🔒 **Bảo mật**: File `.env` và `session.json` đã được `.gitignore` bảo vệ tuyệt đối, không bao giờ bị đẩy lên GitHub.

---

## 📡 API Trạng Thái Cục Bộ (Local Status API)

Kiểm tra trạng thái daemon và kết nối Zalo qua HTTP GET:
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
  "version": "0.1.0"
}
```

---

## 🤝 Đóng Góp (Contributing)

Mọi ý kiến đóng góp, báo lỗi hoặc yêu cầu tính năng mới đều được chào đón! Vui lòng đọc kỹ [CONTRIBUTING.md](CONTRIBUTING.md) trước khi tạo Pull Request.

---

## 📄 Bản Quyền (License)

Dự án được phân phối dưới giấy phép [MIT License](LICENSE).
