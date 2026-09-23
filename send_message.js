#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Zalo, ThreadType } from "zca-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SESSION_FILE = path.join(__dirname, "session.json");

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Cách dùng: node send_message.js <threadId> <nội dung tin nhắn> [--group]");
  process.exit(1);
}

const threadId = args[0];
const isGroup = args.includes("--group");
const message = args.filter(a => a !== "--group" && a !== threadId).join(" ");

if (!fs.existsSync(SESSION_FILE)) {
  console.error("Lỗi: Chưa đăng nhập. Hãy chạy `npm run login`.");
  process.exit(1);
}

async function main() {
  const session = JSON.parse(fs.readFileSync(SESSION_FILE, "utf-8"));
  const zalo = new Zalo({ selfListen: false, checkUpdate: false });
  const api = await zalo.login(session);
  const type = isGroup ? ThreadType.Group : ThreadType.User;

  console.log(`Đang gửi tin nhắn tới ${threadId}...`);
  const res = await api.sendMessage({ msg: message }, threadId, type);
  console.log("✅ Đã gửi thành công:", res);
  process.exit(0);
}

main().catch(err => {
  console.error("❌ Lỗi khi gửi tin nhắn:", err.message);
  process.exit(1);
});
