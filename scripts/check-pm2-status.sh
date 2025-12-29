#!/bin/bash

# Script to check PM2 status and diagnose issues

echo "🔍 Checking PM2 Status..."
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed!"
    echo "   Install it with: npm install -g pm2"
    exit 1
fi

echo "✅ PM2 is installed"
echo ""

# Show PM2 process list
echo "📊 PM2 Process List:"
pm2 list
echo ""

# Check if app is running
APP_STATUS=$(pm2 jlist | jq -r '.[] | select(.name=="my-next-app") | .pm2_env.status' 2>/dev/null || echo "not found")

if [ "$APP_STATUS" = "online" ]; then
    echo "✅ App is online"
elif [ "$APP_STATUS" = "errored" ] || [ "$APP_STATUS" = "stopped" ]; then
    echo "❌ App status: $APP_STATUS"
    echo ""
    echo "📋 Recent Error Logs:"
    pm2 logs my-next-app --err --lines 20 --nostream
elif [ "$APP_STATUS" = "not found" ]; then
    echo "⚠️  App 'my-next-app' not found in PM2"
    echo "   Start it with: pm2 start ecosystem.config.js"
else
    echo "⚠️  App status: $APP_STATUS"
fi

echo ""
echo "📋 Recent Output Logs:"
pm2 logs my-next-app --lines 10 --nostream 2>/dev/null || echo "   No logs available"

echo ""
echo "🔍 Checking if port 3000 is in use:"
if lsof -i:3000 >/dev/null 2>&1; then
    echo "✅ Port 3000 is in use:"
    lsof -i:3000
else
    echo "❌ Port 3000 is NOT in use - app might not be running!"
fi

echo ""
echo "🔍 Checking if .next/standalone/server.js exists:"
if [ -f ".next/standalone/server.js" ]; then
    echo "✅ Build file exists"
    ls -lh .next/standalone/server.js
else
    echo "❌ Build file NOT found!"
    echo "   You need to run: npm run build"
fi

echo ""
echo "💡 Common Fixes:"
echo "   1. If app not found: pm2 start ecosystem.config.js"
echo "   2. If build missing: npm run build"
echo "   3. If port in use: ./scripts/fix-port-3000.sh"
echo "   4. Restart app: pm2 restart my-next-app"
echo "   5. View live logs: pm2 logs my-next-app"

