#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "================================================="
echo "   🤖 Zalo Personal AI Agent v1.0.0             "
echo "================================================="

# 1. Kiểm tra môi trường Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Lỗi: Máy tính chưa cài Node.js. Vui lòng cài Node.js v20+ tại https://nodejs.org"
    exit 1
fi

# 2. Tự động cài đặt thư viện phụ thuộc nếu chưa có
if [ ! -d "node_modules" ]; then
    echo "📦 Lần đầu chạy: Đang tự động cài thư viện phụ thuộc..."
    npm install --quiet
fi

# 3. Khởi chạy Bot
echo "🚀 Đang khởi động Zalo AI Agent..."
exec node daemon.js
