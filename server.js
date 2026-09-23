#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const DAEMON_URL = "http://127.0.0.1:39123";

function log(...args) {
  console.error("[Zalo-MCP]", ...args);
}

const server = new McpServer({
  name: "zalo-mcp",
  version: "1.0.0",
});

async function callDaemon(endpoint, method = "GET", body = null) {
  try {
    const options = {
      method,
      headers: { "Content-Type": "application/json" }
    };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${DAEMON_URL}${endpoint}`, options);
    return await res.json();
  } catch (err) {
    return { error: `Không thể kết nối Zalo Daemon: ${err.message}` };
  }
}

// Tool: zalo_status
server.tool(
  "zalo_status",
  "Kiểm tra trạng thái kết nối tới tài khoản Zalo cá nhân",
  {},
  async () => {
    const data = await callDaemon("/status");
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
    };
  }
);

// Tool: zalo_get_recent_messages
server.tool(
  "zalo_get_recent_messages",
  "Lấy danh sách các tin nhắn mới nhận được từ Zalo (cá nhân hoặc nhóm)",
  {
    limit: z.number().optional().default(10).describe("Số lượng tin nhắn gần nhất cần lấy (mặc định 10)"),
    unread_only: z.boolean().optional().default(false).describe("Chỉ lấy tin nhắn chưa đọc")
  },
  async ({ limit, unread_only }) => {
    const data = await callDaemon(`/messages?limit=${limit}&unread_only=${unread_only}`);
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
    };
  }
);

// Tool: zalo_send_message
server.tool(
  "zalo_send_message",
  "Gửi tin nhắn trả lời hoặc chủ động nhắn tin tới bạn bè hoặc nhóm trên Zalo",
  {
    thread_id: z.string().describe("ID của người nhận hoặc nhóm chat trên Zalo"),
    message: z.string().describe("Nội dung tin nhắn cần gửi"),
    is_group: z.boolean().optional().default(false).describe("True nếu gửi vào nhóm chat, False nếu gửi cho cá nhân")
  },
  async ({ thread_id, message, is_group }) => {
    const data = await callDaemon("/send", "POST", { threadId: thread_id, message, isGroup: is_group });
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
    };
  }
);

// Tool: zalo_get_friends
server.tool(
  "zalo_get_friends",
  "Lấy danh bạ bạn bè trên Zalo kèm ID và tên hiển thị",
  {},
  async () => {
    const data = await callDaemon("/friends");
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }]
    };
  }
);

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log("Zalo MCP Server đã kết nối Stdio thành công qua Daemon.");
}

run().catch((err) => {
  log("Fatal server error:", err);
  process.exit(1);
});
