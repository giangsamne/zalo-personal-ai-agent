import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";

// Cache các thông số kết nối Antigravity Language Server
let cachedEnv = null;
let lastEnvCheck = 0;

export const PROJECT_ID = "zalo-assistant";

/**
 * Tìm file thực thi agentapi
 */
export function findAgentApi() {
  const home = os.homedir();
  const isWin = process.platform === "win32";
  const exeName = isWin ? "agentapi.exe" : "agentapi";

  const candidates = [
    path.join(home, ".gemini", "antigravity", "bin", exeName),
    path.join(home, ".antigravity", "bin", exeName),
    "/usr/local/bin/agentapi",
    "/snap/antigravity/current/opt/antigravity/resources/bin/agentapi",
    "/snap/antigravity/28/opt/antigravity/resources/bin/agentapi"
  ].filter(Boolean);

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return "agentapi";
}

/**
 * Đảm bảo file cấu hình project Zalo AI Assistant tồn tại trong ~/.gemini/config/projects/
 */
export function ensureProjectConfig() {
  try {
    const projectsDir = path.join(os.homedir(), ".gemini", "config", "projects");
    if (!fs.existsSync(projectsDir)) {
      fs.mkdirSync(projectsDir, { recursive: true });
    }
    const projectFile = path.join(projectsDir, `${PROJECT_ID}.json`);
    if (!fs.existsSync(projectFile)) {
      fs.writeFileSync(projectFile, JSON.stringify({
        id: PROJECT_ID,
        name: "Zalo AI Assistant",
        description: "Project quản lý các đoạn chat Zalo với Master và khách"
      }, null, 2));
    }
  } catch (_) {}
}

/**
 * Lấy biến môi trường để gọi agentapi kết nối vào Project zalo-assistant
 */
export function getAntigravityEnv() {
  ensureProjectConfig();
  const now = Date.now();
  const env = { ...process.env };

  // Xóa các biến của agent gọi hiện tại để không gây xung đột hội thoại
  delete env.ANTIGRAVITY_CONVERSATION_ID;
  delete env.ANTIGRAVITY_TRAJECTORY_ID;
  delete env.ANTIGRAVITY_SOURCE_METADATA;
  delete env.ANTIGRAVITY_AGENT;
  env.ANTIGRAVITY_PROJECT_ID = PROJECT_ID;

  if (env.ANTIGRAVITY_LS_ADDRESS && env.ANTIGRAVITY_CSRF_TOKEN) {
    cachedEnv = env;
    lastEnvCheck = now;
    return env;
  }

  if (cachedEnv && (now - lastEnvCheck < 30000)) {
    return { ...cachedEnv, ANTIGRAVITY_PROJECT_ID: PROJECT_ID };
  }

  try {
    const platform = process.platform;
    if (platform === "linux" || platform === "darwin") {
      const ps = execSync("ps aux | grep -E 'language_server' | grep -v grep", { timeout: 3000 }).toString();
      const tokenMatch = ps.match(/--csrf_token\s+([a-zA-Z0-9-]+)/);
      const pidMatch = ps.match(/\s+(\d+)\s+.*language_server/);

      if (tokenMatch && pidMatch) {
        const pid = pidMatch[1];
        env.ANTIGRAVITY_CSRF_TOKEN = tokenMatch[1];
        try {
          const ss = execSync(`ss -tulpn 2>/dev/null | grep "pid=${pid}," || true`, { timeout: 2000 }).toString();
          const ports = [...ss.matchAll(/:(\d+)\s/g)].map(m => parseInt(m[1]));
          const httpPort = ports.find(p => p > 30000 && p < 50000);
          if (httpPort) env.ANTIGRAVITY_LS_ADDRESS = `127.0.0.1:${httpPort}`;
        } catch (_) {}
      }
    } else if (platform === "win32") {
      try {
        const wmic = execSync("wmic process where \"name='language_server.exe'\" get CommandLine", { timeout: 3000 }).toString();
        const tokenMatch = wmic.match(/--csrf_token\s+([a-zA-Z0-9-]+)/);
        const portMatch = wmic.match(/--https_server_port\s+(\d+)/);
        if (tokenMatch) env.ANTIGRAVITY_CSRF_TOKEN = tokenMatch[1];
        if (portMatch && portMatch[1] !== "0") env.ANTIGRAVITY_LS_ADDRESS = `127.0.0.1:${portMatch[1]}`;
      } catch (_) {}
    }
  } catch (_) {}

  if (env.ANTIGRAVITY_LS_ADDRESS && env.ANTIGRAVITY_CSRF_TOKEN) {
    cachedEnv = env;
    lastEnvCheck = now;
  }
  return env;
}

/**
 * Kiểm tra Antigravity Language Server có sẵn sàng không
 */
export function isAntigravityAvailable() {
  try {
    const env = getAntigravityEnv();
    if (!env.ANTIGRAVITY_LS_ADDRESS || !env.ANTIGRAVITY_CSRF_TOKEN) return false;
    const agentApi = findAgentApi();
    execSync(`"${agentApi}" --help`, { env, timeout: 2000 });
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * Đọc phản hồi mới nhất từ transcript.jsonl
 */
export async function waitForAntigravityResponse(convId, startLineCount = 0, timeoutMs = 25000) {
  const transcriptPath = path.join(os.homedir(), ".gemini", "antigravity", "brain", convId, ".system_generated", "logs", "transcript.jsonl");
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    if (fs.existsSync(transcriptPath)) {
      try {
        const lines = fs.readFileSync(transcriptPath, "utf-8").trim().split("\n").filter(l => l.trim());
        if (lines.length > startLineCount) {
          for (let i = lines.length - 1; i >= startLineCount; i--) {
            try {
              const step = JSON.parse(lines[i]);
              if (step.source === "MODEL" && step.type === "PLANNER_RESPONSE" && step.status === "DONE") {
                if (step.content && step.content.trim()) {
                  return step.content.trim();
                }
              }
            } catch (_) {}
          }
        }
      } catch (_) {}
    }
    await new Promise(r => setTimeout(r, 400));
  }
  return null;
}

/**
 * Tạo một đoạn chat mới trên Antigravity thuộc Project "Zalo AI Assistant"
 */
export async function createAntigravityConversation({ title, initialPrompt, modelTier = "flash" }) {
  const agentApi = findAgentApi();
  const env = getAntigravityEnv();

  const systemNotice = `${initialPrompt}\n\nLƯU Ý QUAN TRỌNG: Bạn đang phục vụ qua Zalo. Hãy luôn trả lời trực tiếp bằng văn bản tiếng Việt ngắn gọn, súc tích (1-3 câu). TUYỆT ĐỐI KHÔNG gọi bất kỳ tool nào (không MCP, không đọc file, không chạy lệnh), CHỈ trả lời trực tiếp bằng text.`;

  try {
    const safeTitle = title.replace(/"/g, '\\"');
    const safePrompt = systemNotice.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
    const cmd = `"${agentApi}" new-conversation --model=${modelTier} --title="${safeTitle}" "${safePrompt}"`;
    const out = execSync(cmd, { env, timeout: 15000 }).toString();
    const parsed = JSON.parse(out);
    const convId = parsed?.response?.newConversation?.conversationId;
    if (!convId) throw new Error("Không nhận được conversationId từ agentapi");

    return convId;
  } catch (err) {
    throw new Error(`Lỗi tạo hội thoại Antigravity: ${err.message}`);
  }
}

/**
 * Gửi tin nhắn vào đoạn chat Antigravity sẵn có và đợi phản hồi
 */
export async function sendToAntigravityConversation(convId, userMessage, timeoutMs = 25000) {
  const agentApi = findAgentApi();
  const env = getAntigravityEnv();

  const transcriptPath = path.join(os.homedir(), ".gemini", "antigravity", "brain", convId, ".system_generated", "logs", "transcript.jsonl");
  let startLineCount = 0;
  if (fs.existsSync(transcriptPath)) {
    startLineCount = fs.readFileSync(transcriptPath, "utf-8").trim().split("\n").filter(l => l.trim()).length;
  }

  try {
    const safeMsg = userMessage.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
    execSync(`"${agentApi}" send-message "${convId}" "${safeMsg}"`, { env, timeout: 10000 });
    const response = await waitForAntigravityResponse(convId, startLineCount, timeoutMs);
    return response;
  } catch (err) {
    throw new Error(`Lỗi gửi tin nhắn tới Antigravity: ${err.message}`);
  }
}
