#!/bin/bash

# Comprehensive Production Debugging Script
# Run this on your server to diagnose all issues

set -e

PROJECT_DIR="/home/chapiz-tag/htdocs/tag.chapiz.co.il/Facepet"
cd "$PROJECT_DIR" || { echo "❌ Cannot access project directory!"; exit 1; }

echo "🔍 COMPREHENSIVE PRODUCTION DEBUG"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. System Info
echo -e "${BLUE}1️⃣ SYSTEM INFORMATION${NC}"
echo "   Server: $(hostname)"
echo "   User: $(whoami)"
echo "   Date: $(date)"
echo "   Node: $(node --version 2>/dev/null || echo 'NOT FOUND')"
echo "   npm: $(npm --version 2>/dev/null || echo 'NOT FOUND')"
echo "   PM2: $(pm2 --version 2>/dev/null || echo 'NOT FOUND')"
echo ""

# 2. PM2 Status
echo -e "${BLUE}2️⃣ PM2 STATUS${NC}"
pm2 list
echo ""

# 3. Port 3000 Analysis
echo -e "${BLUE}3️⃣ PORT 3000 ANALYSIS${NC}"
PORT_USERS=$(lsof -i:3000 2>/dev/null || echo "")
if [ ! -z "$PORT_USERS" ]; then
    echo -e "${YELLOW}   Port 3000 is in use:${NC}"
    echo "$PORT_USERS"
    echo ""
    echo "   PIDs using port 3000:"
    lsof -ti:3000 | while read pid; do
        if [ ! -z "$pid" ]; then
            CMD=$(ps -p $pid -o comm=,args= 2>/dev/null | head -1 || echo "unknown")
            echo "   - PID $pid: $CMD"
        fi
    done
else
    echo -e "${GREEN}   ✅ Port 3000 is free${NC}"
fi
echo ""

# 4. Build Status
echo -e "${BLUE}4️⃣ BUILD STATUS${NC}"
if [ -f ".next/standalone/server.js" ]; then
    echo -e "${GREEN}   ✅ Build file exists${NC}"
    ls -lh .next/standalone/server.js
    echo "   Build date: $(stat -c %y .next/standalone/server.js 2>/dev/null || stat -f %Sm .next/standalone/server.js 2>/dev/null || echo 'unknown')"
else
    echo -e "${RED}   ❌ Build file missing!${NC}"
    echo "   Run: npm run build"
fi
echo ""

# 5. PM2 Logs Analysis
echo -e "${BLUE}5️⃣ RECENT PM2 LOGS (Last 30 lines)${NC}"
pm2 logs my-next-app --lines 30 --nostream 2>/dev/null | tail -30 || echo "   No logs available"
echo ""

# 6. Error Logs
echo -e "${BLUE}6️⃣ ERROR LOGS (Last 20 lines)${NC}"
pm2 logs my-next-app --err --lines 20 --nostream 2>/dev/null | tail -20 || echo "   No error logs"
echo ""

# 7. Process Check
echo -e "${BLUE}7️⃣ PROCESS CHECK${NC}"
PM2_PID=$(pm2 jlist 2>/dev/null | grep -o '"pid":[0-9]*' | head -1 | cut -d: -f2 || echo "")
if [ ! -z "$PM2_PID" ] && [ "$PM2_PID" != "null" ]; then
    if ps -p $PM2_PID > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ PM2 process $PM2_PID is running${NC}"
        ps -p $PM2_PID -o pid,comm,etime,pcpu,pmem
    else
        echo -e "${RED}   ❌ PM2 process $PM2_PID is NOT running (zombie)${NC}"
    fi
else
    echo -e "${YELLOW}   ⚠️  No PM2 process found${NC}"
fi
echo ""

# 8. Network Test
echo -e "${BLUE}8️⃣ NETWORK CONNECTIVITY TEST${NC}"
echo "   Testing localhost:3000..."
if timeout 2 curl -f -s http://localhost:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}   ✅ App responds on localhost:3000${NC}"
elif timeout 2 curl -f -s http://127.0.0.1:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}   ✅ App responds on 127.0.0.1:3000${NC}"
else
    echo -e "${RED}   ❌ App does NOT respond${NC}"
    echo "   Trying to get response:"
    timeout 3 curl -v http://localhost:3000 2>&1 | head -15 || echo "   Connection refused or timeout"
fi
echo ""

# 9. Environment Check
echo -e "${BLUE}9️⃣ ENVIRONMENT CHECK${NC}"
if [ -f ".env.production" ]; then
    echo -e "${GREEN}   ✅ .env.production exists${NC}"
elif [ -f ".env.local" ]; then
    echo -e "${GREEN}   ✅ .env.local exists${NC}"
else
    echo -e "${YELLOW}   ⚠️  No .env file found${NC}"
fi
echo "   NODE_ENV: ${NODE_ENV:-not set}"
echo "   PORT: ${PORT:-not set}"
echo ""

# 10. Disk Space
echo -e "${BLUE}🔟 DISK SPACE${NC}"
df -h . | tail -1
echo ""

# 11. Recommendations
echo -e "${BLUE}💡 RECOMMENDATIONS${NC}"
echo ""

# Check if port is in use
if lsof -ti:3000 >/dev/null 2>&1; then
    echo -e "${YELLOW}   ⚠️  Port 3000 is in use${NC}"
    echo "   Fix: ./scripts/fix-port-3000-final.sh"
    echo ""
fi

# Check if PM2 is errored
PM2_STATUS=$(pm2 jlist 2>/dev/null | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
if [ "$PM2_STATUS" = "errored" ]; then
    echo -e "${RED}   ❌ PM2 status is 'errored'${NC}"
    echo "   Fix: pm2 delete all && pm2 kill"
    echo "   Then: ./scripts/quick-fix.sh"
    echo ""
fi

# Check if build is missing
if [ ! -f ".next/standalone/server.js" ]; then
    echo -e "${RED}   ❌ Build is missing${NC}"
    echo "   Fix: npm run build"
    echo ""
fi

echo -e "${GREEN}✅ Debug complete!${NC}"
echo ""
echo "📋 Next steps:"
echo "   1. Review errors above"
echo "   2. Run: ./scripts/fix-all.sh (if exists)"
echo "   3. Or manually fix issues shown above"
echo "   4. Check: pm2 logs my-next-app --lines 50"

