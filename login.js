#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Zalo, LoginQRCallbackEventType } from "zca-js";
import qrcode from "qrcode-terminal";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SESSION_FILE = path.join(__dirname, "session.json");
const QR_IMAGE_FILE = path.join(__dirname, "qrcode.png");

async function main() {
  console.log("=========================================");
  console.log("   ZALO MCP - XÁC THỰC TÀI KHOẢN CÁ NHÂN  ");
  console.log("=========================================\n");

  const forceLogin = process.argv.includes("--force");

  if (fs.existsSync(SESSION_FILE) && !forceLogin) {
    try {
      console.log("Tìm thấy file session.json, đang kiểm tra kết nối...");
      const sessionData = JSON.parse(fs.readFileSync(SESSION_FILE, "utf-8"));
      const zalo = new Zalo({ selfListen: false, checkUpdate: false });
      const api = await zalo.login(sessionData);
      const ownId = api.getOwnId();
      console.log(`\n✅ Phiên đăng nhập hợp lệ! Tài khoản ID: ${ownId}`);
      console.log("Bạn đã sẵn sàng sử dụng Zalo MCP với Antigravity.");
      console.log("(Nếu muốn đăng nhập tài khoản khác, hãy chạy: node login.js --force)\n");
      process.exit(0);
    } catch (err) {
      console.warn("⚠️ Phiên cũ đã hết hạn hoặc không hợp lệ. Đang tạo mã QR mới...");
    }
  }

  const zalo = new Zalo({
    selfListen: false,
    checkUpdate: false,
  });

  let savedSession = null;

  console.log("Đang kết nối máy chủ Zalo để tạo mã QR đăng nhập...\n");

  try {
    const api = await zalo.loginQR(
      {
        userAgent: "Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0",
      },
      async (event) => {
        switch (event.type) {
          case LoginQRCallbackEventType.QRCodeGenerated: {
            console.log("\n📲 VUI LÒNG QUÉT MÃ QR BẰNG ỨNG DỤNG ZALO TRÊN ĐIỆN THOẠI:");
            console.log("------------------------------------------------------------");
            if (event.data?.code) {
              qrcode.generate(event.data.code, { small: true });
            }
            if (event.actions?.saveToFile) {
              await event.actions.saveToFile(QR_IMAGE_FILE);
              console.log(`[Ảnh QR cũng đã được lưu tại: ${QR_IMAGE_FILE}]`);
            }
            console.log("------------------------------------------------------------");
            console.log("👉 Mở Zalo trên điện thoại > Chọn biểu tượng quét QR ở góc trên.");
            break;
          }

          case LoginQRCallbackEventType.QRCodeScanned: {
            console.log("\n👀 Đã phát hiện quét mã!");
            if (event.data?.display_name) {
              console.log(`Tài khoản: ${event.data.display_name}`);
            }
            console.log("👉 Vui lòng nhấn [Đăng nhập] trên màn hình điện thoại của bạn...");
            break;
          }

          case LoginQRCallbackEventType.QRCodeExpired: {
            console.log("\n⚠️ Mã QR đã hết hạn. Đang làm mới mã...");
            if (event.actions?.retry) event.actions.retry();
            break;
          }

          case LoginQRCallbackEventType.QRCodeDeclined: {
            console.error("\n❌ Yêu cầu đăng nhập đã bị từ chối trên điện thoại.");
            process.exit(1);
            break;
          }

          case LoginQRCallbackEventType.GotLoginInfo: {
            savedSession = event.data;
            break;
          }
        }
      }
    );

    if (savedSession) {
      fs.writeFileSync(SESSION_FILE, JSON.stringify(savedSession, null, 2), { mode: 0o600 });
      console.log(`\n💾 Đã lưu thông tin phiên vào: ${SESSION_FILE}`);
    }

    const ownId = api.getOwnId();
    console.log(`\n🎉 ĐĂNG NHẬP THÀNH CÔNG!`);
    console.log(`Tài khoản ID: ${ownId}`);
    console.log("Zalo MCP Server đã sẵn sàng phục vụ Antigravity!\n");

    if (fs.existsSync(QR_IMAGE_FILE)) {
      try {
        fs.unlinkSync(QR_IMAGE_FILE);
      } catch (_) {}
    }

    process.exit(0);
  } catch (err) {
    console.error("\n❌ Đăng nhập thất bại:", err.message);
    process.exit(1);
  }
}

main();
