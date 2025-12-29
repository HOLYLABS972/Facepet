#!/bin/bash

# Quick Fix Script - Fixes common issues fast

cd /home/chapiz-tag/htdocs/tag.chapiz.co.il/Facepet || exit 1

echo "🔧 Quick Fix - Fixing common issues..."
echo ""

# 1. Kill port 3000 - find ALL processes using it
echo "1️⃣ Freeing port 3000..."
# Find all processes using port 3000 (excluding curl connections)
PORT_3000_PIDS=$(lsof -ti:3000 2>/dev/null | xargs -I {} sh -c 'ps -p {} -o comm= | grep -v curl && echo {}' | grep -E '^[0-9]+$' | sort -u)
if [ ! -z "$PORT_3000_PIDS" ]; then
    echo "   Found processes on port 3000: $PORT_3000_PIDS"
    echo "$PORT_3000_PIDS" | xargs kill -9 2>/dev/null
    sleep 2
    # Double check
    REMAINING=$(lsof -ti:3000 2>/dev/null | wc -l)
    if [ "$REMAINING" -gt 0 ]; then
        echo "   Force killing remaining processes..."
        lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
    fi
    echo "✅ Port 3000 freed"
else
    echo "✅ Port 3000 already free"
fi

# 2. Stop PM2 completely
echo "2️⃣ Stopping PM2..."
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
sleep 1
pm2 resurrect 2>/dev/null || true
echo "✅ PM2 stopped"

# 3. Build
echo "3️⃣ Building app..."
npm run build && echo "✅ Build successful" || { echo "❌ Build failed!"; exit 1; }

# 4. Verify port is free before starting
echo "4️⃣ Verifying port 3000 is free..."
sleep 1
if lsof -ti:3000 >/dev/null 2>&1; then
    echo "   ⚠️  Port still in use, force killing..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# 5. Start
echo "5️⃣ Starting app..."
pm2 start ecosystem.config.js && pm2 save && echo "✅ App started"

# 6. Wait and test
sleep 5
echo "6️⃣ Testing..."
if curl -f -s http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ App is working!"
elif curl -f -s http://127.0.0.1:3000 >/dev/null 2>&1; then
    echo "✅ App is working on 127.0.0.1!"
else
    echo "⚠️  App may need a moment to start"
    echo "   Check logs: pm2 logs my-next-app"
fi

echo ""
echo "📊 Status:"
pm2 list

echo ""
echo "✅ Quick fix complete! Check: pm2 logs my-next-app"

