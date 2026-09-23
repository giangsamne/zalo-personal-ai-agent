#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Zalo, ThreadType } from "zca-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SESSION_FILE = path.join(__dirname, "session.json");
const MESSAGES_FILE = path.join(__dirname, "messages.json");
const LOG_FILE = path.join(__dirname, "listener.log");

function log(...args) {
  const line = `[${new Date().toISOString()}] ${args.join(" ")}\n`;
  try {
    fs.appendFileSync(LOG_FILE, line);
  } catch (_) {}
  console.log(...args);
}

let recentMessages = [];
if (fs.existsSync(MESSAGES_FILE)) {
  try {
    const parsed = JSON.parse(fs.readFileSync(MESSAGES_FILE, "utf-8"));
    if (Array.isArray(parsed)) recentMessages = parsed;
  } catch (_) {}
}

async function start() {
  if (!fs.existsSync(SESSION_FILE)) {
    log("Chưa có session.json.");
    process.exit(1);
  }

  const session = JSON.parse(fs.readFileSync(SESSION_FILE, "utf-8"));
  const zalo = new Zalo({ selfListen: true, checkUpdate: false });
  const api = await zalo.login(session);
  const ownId = api.getOwnId();
  log(`Listener đã kết nối Zalo thành công! UID: ${ownId}`);

  api.listener.on("message", (msg) => {
    try {
      const contentStr = typeof msg.data?.content === "string"
        ? msg.data.content
        : (msg.data?.content?.title || msg.data?.content?.description || JSON.stringify(msg.data?.content || ""));

      const record = {
        id: msg.data?.msgId || String(Date.now()),
        threadId: String(msg.threadId),
        isGroup: msg.type === ThreadType.Group,
        isSelf: Boolean(msg.isSelf),
        senderId: String(msg.data?.uidFrom || ""),
        senderName: String(msg.data?.dName || "Unknown"),
        content: contentStr,
        timestamp: Number(msg.data?.ts) || Date.now(),
        isoTime: new Date(Number(msg.data?.ts) || Date.now()).toLocaleString("vi-VN"),
        read: false
      };

      log(`[TIN NHẮN MỚI] Từ [${record.senderName}] (${record.threadId}): ${record.content}`);
      recentMessages.push(record);
      if (recentMessages.length > 200) recentMessages.shift();
      fs.writeFileSync(MESSAGES_FILE, JSON.stringify(recentMessages, null, 2));
    } catch (err) {
      log("Lỗi xử lý tin nhắn:", err.message);
    }
  });

  api.listener.start();
  log("Đang lắng nghe tin nhắn thời gian thực...");
}

start().catch(err => {
  log("Lỗi khởi động listener:", err.message);
  process.exit(1);
});
