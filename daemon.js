#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import { execSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { Zalo, ThreadType, LoginQRCallbackEventType } from "zca-js";
import qrcode from "qrcode-terminal";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import {
  findAgentApi,
  isAntigravityAvailable,
  createAntigravityConversation,
  sendToAntigravityConversation,
  waitForAntigravityResponse,
  PROJECT_ID
} from "./lib/antigravity.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SESSION_FILE = path.join(__dirname, "session.json");
const MESSAGES_FILE = path.join(__dirname, "messages.json");
const CHAT_SESSIONS_FILE = path.join(__dirname, "chat_sessions.json");
const ENV_FILE = path.join(__dirname, ".env");
const PORT = 39123;

function getEnvVar(keyName, defaultValue = "") {
  if (process.env[keyName]) return process.env[keyName];
  if (fs.existsSync(ENV_FILE)) {
    try {
      const lines = fs.readFileSync(ENV_FILE, "utf-8").split("\n");
      for (const line of lines) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match && match[1] === keyName) {
          return match[2].trim().replace(/^['"]|['"]$/g, "");
        }
      }
    } catch (_) {}
  }
  return defaultValue;
}

// TÀI KHOẢN CHÍNH (MASTER)
const APP_VERSION = "0.1.0";
const MASTER_UID = getEnvVar("MASTER_UID", "");
const MASTER_NAME = getEnvVar("MASTER_NAME", "Chủ nhân");
const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 phút
const USE_ANTIGRAVITY_CHATS = getEnvVar("USE_ANTIGRAVITY_CHATS", "true") !== "false";

function log(...args) {
  const ts = new Date().toLocaleTimeString("vi-VN");
  console.log(`[${ts}] [ZaloDaemon]`, ...args);
}

// 3 TẦNG MODEL TIẾT KIỆM CHI PHÍ
const MODEL_TIERS = {
  TIER1_SIMPLE: {
    displayName: "Gemini 3.6 Flash (Low)",
    models: ["gemini-2.0-flash-lite", "gemini-1.5-flash-8b", "gemini-1.5-flash"],
    generationConfig: {
      maxOutputTokens: 250,
      temperature: 0.6,
      thinkingConfig: { thinkingBudget: 0 }
    },
    systemInstruction: "Bạn là trợ lý Zalo cá nhân. Hãy trả lời ngắn gọn, lịch sự, thân thiện bằng tiếng Việt (khoảng 2-3 câu). Xưng 'mình' hoặc 'tôi/em'."
  },
  TIER2_ADVANCED: {
    displayName: "Gemini 3.7 Flash (Low)",
    models: ["gemini-2.0-flash", "gemini-1.5-flash"],
    generationConfig: {
      maxOutputTokens: 500,
      temperature: 0.7,
      thinkingConfig: { thinkingBudget: 1024 }
    },
    systemInstruction: "Bạn là trợ lý Zalo cá nhân thông minh. Hãy phân tích và trả lời thấu đáo nhưng súc tích bằng tiếng Việt."
  },
  TIER3_MASTER: {
    displayName: "Gemini 3.8 Flash (High)",
    models: ["gemini-2.0-flash-thinking-exp", "gemini-2.0-flash", "gemini-1.5-flash"],
    generationConfig: {
      maxOutputTokens: 1200,
      temperature: 0.7,
      thinkingConfig: { thinkingBudget: 4096 }
    },
    systemInstruction: "Bạn là trợ lý AI cao cấp phục vụ ${MASTER_NAME}."
  }
};

function getGeminiKey() {
  return getEnvVar("GEMINI_API_KEY", "");
}

let geminiApiKey = getGeminiKey();
let genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

function generateToken(length = 50) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

// Quản lý các phiên chat (Chat Sessions)
let chatSessions = {};

function loadChatSessions() {
  if (fs.existsSync(CHAT_SESSIONS_FILE)) {
    try {
      const raw = JSON.parse(fs.readFileSync(CHAT_SESSIONS_FILE, "utf-8"));
      // Xử lý nạp từ cấu trúc cũ nếu có
      if (raw.userStates) {
        chatSessions = {};
        for (const [uid, ustate] of Object.entries(raw.userStates)) {
          chatSessions[uid] = {
            uid: uid,
            name: ustate.name || "Người dùng",
            isMaster: uid === MASTER_UID,
            isActivated: ustate.defaultSession?.isActivated || (uid === MASTER_UID),
            token: ustate.defaultSession?.token || null,
            tokenCreatedAt: ustate.defaultSession?.tokenCreatedAt || null,
            activatedAt: null,
            expiresAt: ustate.defaultSession?.expiresAt || null,
            history: ustate.defaultSession?.history || []
          };
        }
      } else {
        chatSessions = raw;
      }
    } catch (e) {
      log("Lỗi đọc chat_sessions.json:", e.message);
      chatSessions = {};
    }
  }

  // Đảm bảo Master luôn có sẵn phiên mặc định
  if (!chatSessions[MASTER_UID]) {
    chatSessions[MASTER_UID] = {
      uid: MASTER_UID,
      name: MASTER_NAME,
      isMaster: true,
      isActivated: true,
      token: null,
      tokenCreatedAt: null,
      activatedAt: Date.now(),
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
      antigravityConvId: null,
      history: []
    };
  }
}

function saveChatSessions() {
  try {
    fs.writeFileSync(CHAT_SESSIONS_FILE, JSON.stringify(chatSessions, null, 2));
  } catch (e) {
    log("Lỗi lưu chat_sessions.json:", e.message);
  }
}

loadChatSessions();

function getOrCreateSession(threadId, senderName, isMaster) {
  if (!chatSessions[threadId]) {
    chatSessions[threadId] = {
      uid: threadId,
      name: senderName,
      isMaster: isMaster,
      isActivated: isMaster,
      token: null,
      tokenCreatedAt: null,
      activatedAt: isMaster ? Date.now() : null,
      expiresAt: isMaster ? (Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
      antigravityConvId: null,
      history: []
    };
  }
  if (senderName && senderName !== "Khách") {
    chatSessions[threadId].name = senderName;
  }
  chatSessions[threadId].isMaster = isMaster;
  return chatSessions[threadId];
}

let recentMessages = [];
if (fs.existsSync(MESSAGES_FILE)) {
  try {
    const parsed = JSON.parse(fs.readFileSync(MESSAGES_FILE, "utf-8"));
    if (Array.isArray(parsed)) recentMessages = parsed;
  } catch (_) {}
}

function saveRecentMessages() {
  try {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(recentMessages.slice(-200), null, 2));
  } catch (_) {}
}

let zaloApi = null;
let isConnected = false;
let shouldRun = true;

async function getUserProfile(uid) {
  if (!zaloApi) return null;
  try {
    const info = await zaloApi.getUserInfo(String(uid));
    const profile = info?.changed_profiles?.[String(uid)] || info?.unchanged_profiles?.[String(uid)];
    if (!profile) return null;
    return {
      userId: profile.userId || uid,
      displayName: profile.displayName || "",
      zaloName: profile.zaloName || "",
      username: profile.username || "",
      phoneNumber: profile.phoneNumber ? `+${profile.phoneNumber}` : null,
      gender: profile.gender === 0 ? "Nam" : (profile.gender === 1 ? "Nữ" : "Chưa rõ"),
      dob: profile.sdob || "",
      isFriend: profile.isFr === 1 ? "Đã kết bạn" : "Người lạ",
      avatar: profile.avatar || ""
    };
  } catch (err) {
    log("Lỗi lấy thông tin tài khoản:", err.message);
    return null;
  }
}

async function sendZaloMessage(threadId, text, isGroup = false) {
  if (!isConnected || !zaloApi) return false;
  try {
    const type = isGroup ? ThreadType.Group : ThreadType.User;
    await zaloApi.sendMessage({ msg: text }, String(threadId), type);
    log(`[Gửi thành công] -> ${threadId}: ${text.slice(0, 80)}...`);
    return true;
  } catch (err) {
    log(`[Lỗi gửi tin nhắn] -> ${threadId}:`, err.message);
    return false;
  }
}

function determineTier(userMessage, isMaster) {
  if (isMaster) return MODEL_TIERS.TIER3_MASTER;
  const lower = userMessage.toLowerCase();
  const wordCount = userMessage.trim().split(/\s+/).length;
  const isAdvanced = wordCount > 18
    || /(tại sao|như thế nào|giải thích|hướng dẫn|phân tích|so sánh|làm sao để|viết giúp|thuật toán|lập trình|chi tiết|tư vấn|sửa lỗi)/i.test(lower);
  return isAdvanced ? MODEL_TIERS.TIER2_ADVANCED : MODEL_TIERS.TIER1_SIMPLE;
}

function determineAntigravityTier(userMessage, isMaster) {
  if (isMaster) return "pro";
  const wordCount = userMessage.trim().split(/\s+/).length;
  const isAdvanced = wordCount > 18
    || /(tại sao|như thế nào|giải thích|hướng dẫn|phân tích|so sánh|làm sao để|viết giúp|thuật toán|lập trình|chi tiết|tư vấn|sửa lỗi)/i.test(userMessage);
  return isAdvanced ? "flash" : "flash_lite";
}

// Xử lý sinh câu trả lời AI trong một phiên hội thoại
async function routeAndRespond(session, userMessage, isMaster = false) {
  session.history = session.history || [];
  session.history.push({ role: "user", content: userMessage, time: Date.now() });
  if (session.history.length > 20) session.history.splice(0, session.history.length - 20);

  // Tự động nạp lại API Key động nếu người dùng thêm vào file .env
  const currentKey = getGeminiKey();
  if (currentKey && (!genAI || currentKey !== geminiApiKey)) {
    geminiApiKey = currentKey;
    genAI = new GoogleGenerativeAI(geminiApiKey);
    log("Đã nạp GEMINI_API_KEY từ .env thành công!");
  }


  // =========================================================================
  // ƯU TIÊN SỐ 1: ANTIGRAVITY AI (GOM CHUNG VÀO PROJECT Zalo AI Assistant)
  // =========================================================================
  if (isAntigravityAvailable()) {
    try {
      const agTier = determineAntigravityTier(userMessage, isMaster);
      log(`[Antigravity Project: ${PROJECT_ID}] ${isMaster ? "Master" : session.name} -> Model: ${agTier}`);

      // Đảm bảo phiên đã có conversationId trên Antigravity trong project zalo-assistant
      if (!session.antigravityConvId) {
        log(`Tạo hội thoại Antigravity mới cho ${session.name} trong project ${PROJECT_ID}...`);
        const title = isMaster ? `Zalo: Master (${MASTER_NAME})` : `Zalo: ${session.name} (${session.uid})`;
        const prompt = isMaster
          ? "Bạn là trợ lý AI Antigravity cao cấp phục vụ riêng cho ${MASTER_NAME} qua Zalo."
          : `Bạn là trợ lý Zalo cá nhân. Hãy trả lời trực tiếp các câu hỏi của khách ${session.name} một cách lịch sự, thân thiện.`;

        const convId = await createAntigravityConversation({
          title,
          initialPrompt: prompt,
          modelTier: agTier
        });
        session.antigravityConvId = convId;
        saveChatSessions();
      }

      const agReply = await sendToAntigravityConversation(session.antigravityConvId, userMessage, 25000);
      if (agReply && agReply.trim()) {
        session.history.push({ role: "assistant", content: agReply, time: Date.now() });
        saveChatSessions();
        log(`[Antigravity Phản hồi]: ${agReply.slice(0, 100)}...`);
        return agReply;
      }
    } catch (agErr) {
      log("Antigravity Bridge gặp lỗi, chuyển sang cơ chế dự phòng:", agErr.message);
    }
  }

  // =========================================================================
  // DỰ PHÒNG: GEMINI API (NẾU CÓ API KEY)
  // =========================================================================
  const tier = isMaster ? MODEL_TIERS.TIER3_MASTER : determineTier(userMessage, false);
  log(`[Routing Fallback] Người gửi: ${isMaster ? "Master" : session.name} -> Áp dụng: ${tier.displayName}`);

  if (genAI) {
    for (const modelName of tier.models) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: tier.generationConfig,
          systemInstruction: tier.systemInstruction
        });

        const validHistory = [];
        let lastRole = null;
        for (const item of session.history.slice(0, -1)) {
          const geminiRole = (item.role === "assistant" || item.role === "model") ? "model" : "user";
          if (!lastRole && geminiRole === "model") continue;
          if (geminiRole === lastRole) {
            if (validHistory.length > 0) {
              validHistory[validHistory.length - 1].parts[0].text += `\n${item.content}`;
            }
          } else {
            validHistory.push({ role: geminiRole, parts: [{ text: item.content }] });
            lastRole = geminiRole;
          }
        }

        const chat = model.startChat({ history: validHistory });
        const result = await chat.sendMessage(userMessage);
        const reply = result.response.text().trim();
        session.history.push({ role: "assistant", content: reply, time: Date.now() });
        saveChatSessions();
        log(`[${tier.displayName}]: ${reply.slice(0, 100)}...`);
        return reply;
      } catch (e) {
        log(`Model ${modelName} (${tier.displayName}) lỗi: ${e.message}, thử fallback...`);
      }
    }
  }

  // Fallback cuối: không có AI nào hoạt động
  const fallbackReply = isMaster
    ? `Nhận được: "${userMessage}". Antigravity chưa sẵn sàng, vui lòng thử lại.`
    : `Xin chào ${session.name}! Hệ thống đang tạm thời bận, vui lòng nhắn lại sau nhé.`;
  session.history.push({ role: "assistant", content: fallbackReply, time: Date.now() });
  saveChatSessions();
  return fallbackReply;
}

// =============================================================================
// XỬ LÝ TOÀN BỘ TIN NHẮN ĐẾN TỪ ZALO
// =============================================================================

async function handleIncomingMessage(msg) {
  try {
    if (msg.isSelf) return;

    const rawContent = msg.data?.content;
    const text = typeof rawContent === "string"
      ? rawContent
      : (rawContent?.title || rawContent?.description || JSON.stringify(rawContent || ""));

    const senderId = String(msg.data?.uidFrom || "");
    const senderName = String(msg.data?.dName || "Khách");
    const threadId = String(msg.threadId);
    const isGroup = msg.type === ThreadType.Group;
    const isMaster = (senderId === MASTER_UID);
    const now = Date.now();

    const record = {
      id: msg.data?.msgId || String(now),
      threadId,
      isGroup,
      isSelf: false,
      senderId,
      senderName,
      content: text,
      timestamp: Number(msg.data?.ts) || now,
      isoTime: new Date(Number(msg.data?.ts) || now).toLocaleString("vi-VN"),
      read: false
    };

    recentMessages.push(record);
    saveRecentMessages();

    log(`[TIN NHẮN ĐẾN] [${senderName}] (isMaster: ${isMaster}): ${text}`);

    // =========================================================================
    // 1. TIN NHẮN TỪ TÀI KHOẢN CHÍNH (MASTER)
    // =========================================================================
    if (isMaster) {
      log(`Xử lý tin nhắn từ Master (${MASTER_NAME})...`);
      const session = getOrCreateSession(MASTER_UID, MASTER_NAME, true);
      const aiReply = await routeAndRespond(session, text, true);
      await sendZaloMessage(MASTER_UID, aiReply);
      return;
    }

    // =========================================================================
    // 2. TIN NHẮN TỪ KHÁCH (GUEST)
    // =========================================================================
    const session = getOrCreateSession(threadId, senderName, false);

    // LỆNH /exit THOÁT PHIÊN SỚM
    if (text.trim().toLowerCase() === "/exit") {
      if (session.isActivated) {
        session.isActivated = false;
        session.expiresAt = null;
        saveChatSessions();
        await sendZaloMessage(threadId, "👋 Bạn đã thoát phiên trò chuyện. Cảm ơn bạn!");
        await sendZaloMessage(MASTER_UID, `🚪 [KHÁCH THOÁT PHIÊN]\nKhách: ${senderName} (${threadId}) vừa kết thúc phiên bằng lệnh /exit.`);
        return;
      }
    }

    // BƯỚC A: KIỂM TRA XÁC THỰC MÃ TOKEN KHÁCH
    if (session.token && text.includes(session.token)) {
      log(`[XÁC THỰC THÀNH CÔNG] Khách ${senderName} (${threadId}) đã nhập đúng mã Token! Kích hoạt 30 phút.`);
      session.isActivated = true;
      session.activatedAt = now;
      session.expiresAt = now + SESSION_DURATION_MS;

      let initialGreeting = "";
      if (isAntigravityAvailable()) {
        try {
          log(`Đang tạo hội thoại Antigravity riêng cho khách ${senderName} trong project ${PROJECT_ID}...`);
          const title = `Zalo: ${senderName} (${threadId})`;
          const prompt = `Bạn là trợ lý Zalo cá nhân. Hãy chào mừng khách ${senderName} đã kích hoạt phiên kết nối 30 phút thành công và hỏi xem bạn có thể giúp gì.`;
          const convId = await createAntigravityConversation({
            title,
            initialPrompt: prompt,
            modelTier: "flash_lite"
          });
          session.antigravityConvId = convId;
          initialGreeting = await waitForAntigravityResponse(convId, 0, 15000);
          log(`Đã tạo hội thoại Antigravity cho khách: ${convId}`);
        } catch (err) {
          log("Lỗi tạo hội thoại Antigravity cho khách:", err.message);
        }
      }
      saveChatSessions();

      const expireTimeStr = new Date(session.expiresAt).toLocaleTimeString("vi-VN");
      const replyText = initialGreeting
        ? `✅ Mã xác thực chính xác! Phiên trò chuyện của bạn đã được kích hoạt trong 30 phút (đến ${expireTimeStr}).\n\n${initialGreeting}`
        : `✅ Mã xác thực chính xác! Phiên trò chuyện của bạn đã được kích hoạt trong 30 phút (đến ${expireTimeStr}).\nTôi là trợ lý AI Antigravity, bạn cần tôi hỗ trợ gì nào?`;

      await sendZaloMessage(threadId, replyText);

      await sendZaloMessage(
        MASTER_UID,
        `🟢 [XÁC THỰC THÀNH CÔNG & ĐÃ TẠO PHIÊN ANTIGRAVITY]\n` +
        `Khách: ${senderName} (ID: ${threadId})\n` +
        `Project: zalo-assistant\n` +
        `ID Antigravity: ${session.antigravityConvId || "Chưa tạo"}\n` +
        `Đã kích hoạt phiên trò chuyện 30 phút (đến ${expireTimeStr}).`
      );
      return;
    }

    // BƯỚC B: KIỂM TRA PHIÊN KHÁCH ĐANG KÍCH HOẠT VÀ CÒN HẠN 30 PHÚT
    const isActive = session.isActivated && session.expiresAt && (now < session.expiresAt);

    if (isActive) {
      const remainingMinutes = Math.max(1, Math.round((session.expiresAt - now) / 60000));
      log(`Phiên của ${senderName} đang hoạt động (còn ${remainingMinutes} phút). Phân luồng AI...`);

      // Thông báo tin nhắn đến cho Master
      await sendZaloMessage(
        MASTER_UID,
        `📩 [TIN NHẮN ĐẾN TỪ ${senderName}]:\n"${text}"\n(Phiên đang kích hoạt, còn ${remainingMinutes} phút)`
      );

      // Phân luồng AI và phản hồi
      const aiReply = await routeAndRespond(session, text, false);
      await sendZaloMessage(threadId, aiReply);

      // Báo kết quả trả lời về cho Master
      await sendZaloMessage(
        MASTER_UID,
        `🤖 [BOT ĐÃ TRẢ LỜI ${senderName}]:\n"${aiReply}"`
      );
      return;
    }

    // BƯỚC C: NẾU CHƯA KÍCH HOẠT HOẶC ĐÃ HẾT HẠN -> TẠO TOKEN MỚI VÀ BÁO CHO MASTER
    const newToken = generateToken(50);
    session.token = newToken;
    session.tokenCreatedAt = now;
    session.isActivated = false;
    session.activatedAt = null;
    session.expiresAt = null;
    saveChatSessions();

    log(`Đã tạo mã Token 50 ký tự cho khách ${senderName}: ${newToken}`);

    const profile = await getUserProfile(threadId);

    let infoBlock = `👤 Tên Zalo: ${profile?.zaloName || senderName}\n`;
    if (profile?.displayName && profile.displayName !== profile.zaloName) {
      infoBlock += `📛 Tên gợi nhớ: ${profile.displayName}\n`;
    }
    infoBlock += `🆔 ID tài khoản: ${threadId}\n`;
    if (profile?.username) infoBlock += `🔗 Username: @${profile.username}\n`;
    if (profile?.phoneNumber) infoBlock += `📞 SĐT: ${profile.phoneNumber}\n`;
    if (profile?.gender) infoBlock += `⚧ Giới tính: ${profile.gender}\n`;
    if (profile?.dob) infoBlock += `🎂 Ngày sinh: ${profile.dob}\n`;
    infoBlock += `👥 Quan hệ: ${profile?.isFriend || "Người lạ"}`;

    // Gửi báo cáo thông tin khách và Token về cho Master
    await sendZaloMessage(
      MASTER_UID,
      `🔑 [YÊU CẦU XÁC THỰC - KHÁCH MỚI]\n` +
      `----------------------------------------\n` +
      `📋 THÔNG TIN TÀI KHOẢN KHÁCH:\n` +
      `${infoBlock}\n` +
      `----------------------------------------\n` +
      `💬 Tin nhắn gửi đến: "${text}"\n` +
      `⏰ Lúc: ${record.isoTime}\n\n` +
      `📌 MÃ TOKEN XÁC THỰC (50 ký tự):\n` +
      `${newToken}\n\n` +
      `👉 Khi bạn gửi mã này cho khách và KHÁCH NHẮN TIN CHỨA MÃ NÀY vào khung chat, phiên trò chuyện 30 phút sẽ được tự động kích hoạt.`
    );

    // Phản hồi tạm thời cho khách
    await sendZaloMessage(
      threadId,
      `Xin chào ${senderName}! Cảm ơn bạn đã nhắn tin. Hệ thống đã chuyển tiếp thông tin và tin nhắn của bạn tới quản trị viên để xác thực. Vui lòng chờ quản trị viên cấp mã xác thực để bắt đầu trò chuyện!`
    );

  } catch (err) {
    log("Lỗi xử lý tin nhắn đến:", err.message);
  }
}

async function autoLoginQR() {
  log("Chưa có session.json hoặc phiên hết hạn. Đang tạo mã QR đăng nhập tự động...");
  console.log("\n============================================================");
  console.log("📲 QUÉT MÃ QR BẰNG ỨNG DỤNG ZALO TRÊN ĐIỆN THOẠI:");
  console.log("============================================================\n");

  const zalo = new Zalo({ selfListen: true, checkUpdate: false });
  let savedSession = null;

  try {
    const api = await zalo.loginQR(
      {
        userAgent: "Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0"
      },
      async (event) => {
        switch (event.type) {
          case LoginQRCallbackEventType.QRCodeGenerated: {
            if (event.data?.code) {
              qrcode.generate(event.data.code, { small: true });
            }
            console.log("\n👉 Mở Zalo trên điện thoại > Chọn biểu tượng quét QR ở góc trên.");
            break;
          }
          case LoginQRCallbackEventType.QRCodeScanned: {
            console.log("\n👀 Đã phát hiện quét mã! Nhấn [Đăng nhập] trên điện thoại...");
            break;
          }
          case LoginQRCallbackEventType.QRCodeExpired: {
            console.log("\n⚠️ Mã QR đã hết hạn. Đang làm mới...");
            if (event.actions?.retry) event.actions.retry();
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
      log("Đã lưu phiên đăng nhập thành công vào session.json!");
    }
    return api;
  } catch (err) {
    log("Lỗi đăng nhập QR:", err.message);
    return null;
  }
}

async function connectZalo() {
  if (!fs.existsSync(SESSION_FILE)) {
    zaloApi = await autoLoginQR();
    if (!zaloApi) return false;
  } else {
    try {
      log("Đang kết nối Zalo với session đã lưu...");
      const session = JSON.parse(fs.readFileSync(SESSION_FILE, "utf-8"));
      const zalo = new Zalo({ selfListen: true, checkUpdate: false });
      zaloApi = await zalo.login(session);
    } catch (err) {
      log("Phiên session.json cũ không hợp lệ hoặc hết hạn. Chuyển sang quét mã QR...");
      zaloApi = await autoLoginQR();
      if (!zaloApi) return false;
    }
  }

  try {
    const ownId = zaloApi.getOwnId();
    isConnected = true;
    log(`Kết nối Zalo thành công! UID: ${ownId}`);

    zaloApi.listener.on("message", handleIncomingMessage);

    zaloApi.listener.on("closed", () => {
      log("Phiên kết nối Zalo đã đóng. Sẽ thử kết nối lại sau 15 giây...");
      isConnected = false;
      zaloApi = null;
    });

    zaloApi.listener.on("error", (err) => {
      log("Lỗi listener:", err?.message || err);
      isConnected = false;
      zaloApi = null;
    });

    zaloApi.listener.start();
    log("Đang lắng nghe tin nhắn thời gian thực và sẵn sàng xác thực...");
    return true;
  } catch (err) {
    log("Khởi động listener thất bại:", err.message);
    isConnected = false;
    zaloApi = null;
    return false;
  }
}

async function maintainConnection() {
  while (shouldRun) {
    if (!isConnected) {
      log("Trạng thái: Mất kết nối. Đang thử kết nối lại...");
      await connectZalo();
    }
    await new Promise(r => setTimeout(r, 15000));
  }
}

// HTTP API Server cục bộ
const server = http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/status") {
    res.end(JSON.stringify({
      connected: isConnected,
      ownId: zaloApi ? zaloApi.getOwnId() : null,
      masterUid: MASTER_UID,
      activeSessions: Object.keys(chatSessions).length,
      antigravity: {
        available: isAntigravityAvailable(),
        projectId: "zalo-assistant",
        masterConvId: chatSessions[MASTER_UID]?.antigravityConvId || null,
        agentApi: findAgentApi()
      },
      version: APP_VERSION,
      tiers: {
        guestSimple: "Antigravity Flash Lite (3.6 Low)",
        guestAdvanced: "Antigravity Flash (3.7 Low)",
        master: "Antigravity Pro (3.8 High)"
      },
      messagesCount: recentMessages.length
    }, null, 2));
    return;
  }

  if (req.method === "GET" && url.pathname === "/sessions") {
    res.end(JSON.stringify(chatSessions, null, 2));
    return;
  }

  if (req.method === "GET" && url.pathname === "/messages") {
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const unreadOnly = url.searchParams.get("unread_only") === "true";
    let list = [...recentMessages];
    if (unreadOnly) list = list.filter(m => !m.read && !m.isSelf);
    const results = list.slice(-limit);
    results.forEach(m => { m.read = true; });
    saveRecentMessages();
    res.end(JSON.stringify(results));
    return;
  }

  if (req.method === "POST" && url.pathname === "/send") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", async () => {
      try {
        const { threadId, message, isGroup } = JSON.parse(body);
        const ok = await sendZaloMessage(threadId, message, isGroup);
        res.end(JSON.stringify({ success: ok }));
      } catch (e) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, "127.0.0.1", () => {
  log(`Zalo Antigravity Connected Daemon đang chạy tại http://127.0.0.1:${PORT}`);
  maintainConnection();
});

process.on("SIGINT", () => { shouldRun = false; process.exit(0); });
process.on("SIGTERM", () => { shouldRun = false; process.exit(0); });
