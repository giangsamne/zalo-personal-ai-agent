#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const daemonPath = path.join(projectRoot, "daemon.js");
const nodePath = process.execPath;
const platform = process.platform; // 'linux', 'darwin', 'win32'

console.log("=================================================");
console.log("🚀 THIẾT LẬP TỰ ĐỘNG KHỞI ĐỘNG (AUTOSTART)");
console.log(`Hệ điều hành phát hiện: ${platform}`);
console.log(`Đường dẫn dự án: ${projectRoot}`);
console.log(`Đường dẫn Node.js: ${nodePath}`);
console.log("=================================================");

function setupLinux() {
  const homeDir = os.homedir();
  let configured = false;

  // 1. Cấu hình systemd user service (Chuẩn & Tốt nhất trên Linux)
  const systemdDir = path.join(homeDir, ".config", "systemd", "user");
  try {
    fs.mkdirSync(systemdDir, { recursive: true });
    const serviceContent = `[Unit]
Description=Zalo Personal AI Assistant Daemon
After=network.target

[Service]
Type=simple
WorkingDirectory=${projectRoot}
ExecStart=${nodePath} ${daemonPath}
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PATH=${process.env.PATH}
Environment=DISPLAY=${process.env.DISPLAY || ":0"}
Environment=WAYLAND_DISPLAY=${process.env.WAYLAND_DISPLAY || "wayland-0"}
Environment=XDG_RUNTIME_DIR=${process.env.XDG_RUNTIME_DIR || `/run/user/${os.userInfo().uid}`}

[Install]
WantedBy=default.target
`;
    const servicePath = path.join(systemdDir, "zalo-ai-assistant.service");
    fs.writeFileSync(servicePath, serviceContent, "utf-8");
    console.log(`✅ Đã tạo systemd service: ${servicePath}`);

    try {
      execSync("systemctl --user daemon-reload");
      execSync("systemctl --user enable zalo-ai-assistant.service");
      console.log("✅ Đã kích hoạt (enable) systemd service tự chạy khi bật máy!");
      configured = true;
    } catch (e) {
      console.warn("⚠️ Không thể kích hoạt systemctl trực tiếp (có thể do môi trường container/sandbox):", e.message);
    }
  } catch (err) {
    console.warn("⚠️ Lỗi tạo systemd service:", err.message);
  }

  // 2. Cấu hình Desktop Autostart (~/.config/autostart/*.desktop)
  const autostartDir = path.join(homeDir, ".config", "autostart");
  try {
    fs.mkdirSync(autostartDir, { recursive: true });
    const desktopContent = `[Desktop Entry]
Type=Application
Version=1.0
Name=Zalo AI Assistant
Comment=Trợ lý Zalo cá nhân AI tự động chạy khi đăng nhập
Exec=${nodePath} ${daemonPath}
Path=${projectRoot}
Terminal=false
StartupNotify=false
X-GNOME-Autostart-enabled=true
`;
    const desktopPath = path.join(autostartDir, "zalo-ai-assistant.desktop");
    fs.writeFileSync(desktopPath, desktopContent, "utf-8");
    console.log(`✅ Đã tạo desktop autostart: ${desktopPath}`);
    configured = true;
  } catch (err) {
    console.warn("⚠️ Lỗi tạo autostart desktop entry:", err.message);
  }

  if (configured) {
    console.log("\n🎉 Thiết lập autostart trên Linux THÀNH CÔNG! Trợ lý sẽ tự động chạy mỗi khi máy tính khởi động.");
  }
}

function setupMacOS() {
  const homeDir = os.homedir();
  const launchAgentsDir = path.join(homeDir, "Library", "LaunchAgents");
  fs.mkdirSync(launchAgentsDir, { recursive: true });

  const plistPath = path.join(launchAgentsDir, "com.zalo.ai-assistant.plist");
  const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.zalo.ai-assistant</string>
    <key>ProgramArguments</key>
    <array>
        <string>${nodePath}</string>
        <string>${daemonPath}</string>
    </array>
    <key>WorkingDirectory</key>
    <string>${projectRoot}</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${path.join(projectRoot, "daemon.log")}</string>
    <key>StandardErrorPath</key>
    <string>${path.join(projectRoot, "daemon.error.log")}</string>
</dict>
</plist>
`;

  fs.writeFileSync(plistPath, plistContent, "utf-8");
  console.log(`✅ Đã tạo LaunchAgent plist: ${plistPath}`);

  try {
    execSync(`launchctl unload "${plistPath}" 2>/dev/null || true`);
    execSync(`launchctl load "${plistPath}"`);
    console.log("✅ Đã kích hoạt LaunchAgent trên macOS qua launchctl!");
  } catch (err) {
    console.warn("⚠️ Gợi ý: Hãy chạy lệnh sau nếu launchctl cần quyền: launchctl load " + plistPath);
  }

  console.log("\n🎉 Thiết lập autostart trên macOS THÀNH CÔNG!");
}

function setupWindows() {
  const appData = process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
  const startupDir = path.join(appData, "Microsoft", "Windows", "Start Menu", "Programs", "Startup");
  fs.mkdirSync(startupDir, { recursive: true });

  // Tạo VBScript để khởi động node daemon.js ngầm hoàn toàn không hiện cửa sổ đen (silent background)
  const vbsPath = path.join(startupDir, "zalo-ai-assistant.vbs");
  const escapedNode = nodePath.replace(/\\/g, "\\\\");
  const escapedDaemon = daemonPath.replace(/\\/g, "\\\\");
  const escapedRoot = projectRoot.replace(/\\/g, "\\\\");

  const vbsContent = `Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "${escapedRoot}"
WshShell.Run """${escapedNode}"" ""${escapedDaemon}""", 0, False
Set WshShell = Nothing
`;

  fs.writeFileSync(vbsPath, vbsContent, "utf-8");
  console.log(`✅ Đã tạo Windows Silent Startup Script: ${vbsPath}`);
  console.log("\n🎉 Thiết lập autostart trên Windows THÀNH CÔNG! Trợ lý sẽ tự động chạy ngầm khi bạn đăng nhập vào Windows.");
}

switch (platform) {
  case "linux":
    setupLinux();
    break;
  case "darwin":
    setupMacOS();
    break;
  case "win32":
    setupWindows();
    break;
  default:
    console.error(`❌ Chưa hỗ trợ nền tảng: ${platform}`);
    process.exit(1);
}
