#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MESSAGES_FILE = path.join(__dirname, "messages.json");

if (!fs.existsSync(MESSAGES_FILE)) {
  console.log("Chưa có tin nhắn mới nào được ghi nhận trong messages.json.");
  process.exit(0);
}

try {
  const messages = JSON.parse(fs.readFileSync(MESSAGES_FILE, "utf-8"));
  if (!Array.isArray(messages) || messages.length === 0) {
    console.log("Hộp thư tin nhắn trống.");
  } else {
    console.log(`=== DANH SÁCH TIN NHẮN MỚI (${messages.length} tin nhắn) ===\n`);
    messages.slice(-20).forEach((m, idx) => {
      console.log(`[${idx + 1}] Lúc: ${m.isoTime || m.timestamp}`);
      console.log(`    Người gửi: ${m.senderName} (${m.senderId})`);
      console.log(`    Cuộc trò chuyện ID: ${m.threadId} ${m.isGroup ? "[Nhóm]" : "[Cá nhân]"}`);
      console.log(`    Nội dung: ${m.content}\n`);
    });
  }
} catch (err) {
  console.error("Lỗi đọc messages.json:", err.message);
}
