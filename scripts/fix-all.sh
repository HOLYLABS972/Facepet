#!/bin/bash

# Complete Fix Script - Fixes all common production issues

set -e

PROJECT_DIR="/home/chapiz-tag/htdocs/tag.chapiz.co.il/Facepet"
cd "$PROJECT_DIR" || { echo "❌ Cannot access project directory!"; exit 1; }

echo "🔧 COMPLETE PRODUCTION FIX"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Stop everything
echo "1️⃣ Stopping all processes..."
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
sleep 2
echo -e "${GREEN}✅ All PM2 processes stopped${NC}"
echo ""

# Step 2: Free port 3000
echo "2️⃣ Freeing port 3000..."
PORT_PIDS=$(lsof -ti:3000 2>/dev/null || echo "")
if [ ! -z "$PORT_PIDS" ]; then
    echo "   Found processes: $PORT_PIDS"
    echo "$PORT_PIDS" | xargs kill -9 2>/dev/null || true
    sleep 2
    # Double check
    REMAINING=$(lsof -ti:3000 2>/dev/null || echo "")
    if [ ! -z "$REMAINING" ]; then
        echo "   Force killing remaining..."
        echo "$REMAINING" | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
    echo -e "${GREEN}✅ Port 3000 freed${NC}"
else
    echo -e "${GREEN}✅ Port 3000 already free${NC}"
fi
echo ""

# Step 3: Verify port is free
echo "3️⃣ Verifying port 3000..."
if lsof -ti:3000 >/dev/null 2>&1; then
    echo -e "${RED}❌ Port 3000 still in use!${NC}"
    echo "   Manual fix needed:"
    echo "   sudo lsof -i:3000"
    echo "   sudo kill -9 <PID>"
    exit 1
else
    echo -e "${GREEN}✅ Port 3000 is free${NC}"
fi
echo ""

# Step 4: Check build
echo "4️⃣ Checking build..."
if [ ! -f ".next/standalone/server.js" ]; then
    echo -e "${YELLOW}⚠️  Build missing, building now...${NC}"
    npm run build || {
        echo -e "${RED}❌ Build failed!${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Build completed${NC}"
else
    echo -e "${GREEN}✅ Build exists${NC}"
fi
echo ""

# Step 5: Restart PM2 daemon
echo "5️⃣ Restarting PM2 daemon..."
pm2 resurrect 2>/dev/null || pm2 ping 2>/dev/null || true
echo -e "${GREEN}✅ PM2 daemon ready${NC}"
echo ""

# Step 6: Start app
echo "6️⃣ Starting application..."
pm2 start ecosystem.config.js
pm2 save
echo -e "${GREEN}✅ App started${NC}"
echo ""

# Step 7: Wait and verify
echo "7️⃣ Waiting for app to start..."
sleep 5

# Step 8: Check status
echo "8️⃣ Final status check..."
pm2 list
echo ""

# Step 9: Test
echo "9️⃣ Testing application..."
if timeout 3 curl -f -s http://localhost:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ App is responding!${NC}"
    echo ""
    echo "🌐 Your app should be accessible at:"
    echo "   http://46.224.38.1:3000"
    echo "   http://tag.chapiz.co.il:3000 (if DNS is configured)"
elif timeout 3 curl -f -s http://127.0.0.1:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ App is responding on 127.0.0.1!${NC}"
else
    echo -e "${YELLOW}⚠️  App may need more time to start${NC}"
    echo "   Check logs: pm2 logs my-next-app"
    echo ""
    echo "   Recent logs:"
    pm2 logs my-next-app --lines 10 --nostream 2>/dev/null || echo "   No logs yet"
fi

echo ""
echo -e "${GREEN}✨ Fix complete!${NC}"
echo ""
echo "📋 Useful commands:"
echo "   View logs:    pm2 logs my-next-app"
echo "   Restart:      pm2 restart my-next-app"
echo "   Status:       pm2 status"
echo "   Debug:        ./scripts/debug-production.sh"

