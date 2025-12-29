#!/bin/bash

# Diagnose why app appears offline

cd /home/chapiz-tag/htdocs/tag.chapiz.co.il/Facepet || exit 1

echo "🔍 Diagnosing why app is offline..."
echo ""

# 1. Check PM2 status
echo "1️⃣ PM2 Status:"
pm2 list
echo ""

# 2. Check if process is actually running
echo "2️⃣ Process Check:"
PM2_PID=$(pm2 jlist | jq -r '.[] | select(.name=="my-next-app") | .pid' 2>/dev/null || echo "")
if [ ! -z "$PM2_PID" ]; then
    echo "   PM2 PID: $PM2_PID"
    if ps -p $PM2_PID > /dev/null 2>&1; then
        echo "   ✅ Process is running"
    else
        echo "   ❌ Process is NOT running (zombie?)"
    fi
else
    echo "   ❌ No PID found"
fi
echo ""

# 3. Check port 3000
echo "3️⃣ Port 3000 Check:"
if lsof -i:3000 >/dev/null 2>&1; then
    echo "   ✅ Port 3000 is in use:"
    lsof -i:3000
else
    echo "   ❌ Port 3000 is NOT in use!"
    echo "   App is not listening on port 3000"
fi
echo ""

# 4. Check recent logs
echo "4️⃣ Recent PM2 Logs (last 30 lines):"
pm2 logs my-next-app --lines 30 --nostream 2>/dev/null || echo "   No logs available"
echo ""

# 5. Check error logs
echo "5️⃣ Recent Error Logs:"
pm2 logs my-next-app --err --lines 20 --nostream 2>/dev/null || echo "   No error logs"
echo ""

# 6. Test local connection
echo "6️⃣ Testing local connection:"
if curl -f -s http://localhost:3000 >/dev/null 2>&1; then
    echo "   ✅ App responds on localhost:3000"
elif curl -f -s http://127.0.0.1:3000 >/dev/null 2>&1; then
    echo "   ✅ App responds on 127.0.0.1:3000"
else
    echo "   ❌ App does NOT respond locally"
    echo "   Trying to get response:"
    curl -v http://localhost:3000 2>&1 | head -20
fi
echo ""

# 7. Check if build file exists
echo "7️⃣ Build File Check:"
if [ -f ".next/standalone/server.js" ]; then
    echo "   ✅ Build file exists"
    ls -lh .next/standalone/server.js
else
    echo "   ❌ Build file missing!"
fi
echo ""

# 8. Check environment
echo "8️⃣ Environment Check:"
echo "   NODE_ENV: ${NODE_ENV:-not set}"
echo "   PORT: ${PORT:-not set}"
echo ""

# 9. Restart suggestion
echo "💡 Quick Fixes:"
echo "   1. Restart PM2: pm2 restart my-next-app"
echo "   2. Check logs: pm2 logs my-next-app --lines 50"
echo "   3. Rebuild if needed: npm run build"
echo "   4. Check firewall: sudo ufw status"

