#!/bin/bash

# Optimized Production Deployment Script
# This script builds and starts the application correctly with full checks

set -e  # Exit on error

echo "🚀 Starting OPTIMIZED production deployment..."
echo ""

# Navigate to project directory
PROJECT_DIR="/home/chapiz-tag/htdocs/tag.chapiz.co.il/Facepet"
cd "$PROJECT_DIR" || { echo "❌ Cannot access project directory!"; exit 1; }

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check prerequisites
echo "🔍 Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found!${NC}"
    exit 1
fi
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found!${NC}"
    exit 1
fi
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️  PM2 not found, installing...${NC}"
    npm install -g pm2
fi
echo -e "${GREEN}✅ Prerequisites OK${NC}"
echo ""

# Step 2: Free port 3000
echo "🔍 Checking port 3000..."
if lsof -ti:3000 >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 3000 is in use, freeing it...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi
echo -e "${GREEN}✅ Port 3000 is free${NC}"
echo ""

# Step 3: Stop PM2 if running
echo "📦 Stopping PM2 processes..."
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
sleep 1
pm2 resurrect 2>/dev/null || true
echo -e "${GREEN}✅ PM2 stopped${NC}"
echo ""

# Step 4: Clean old build
if [ -d ".next" ]; then
    echo "🧹 Cleaning old build..."
    rm -rf .next
    echo -e "${GREEN}✅ Old build cleaned${NC}"
    echo ""
fi

# Step 5: Install/update dependencies
echo "📥 Checking dependencies..."
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    echo "   Installing/updating dependencies..."
    npm ci --production=false
    echo -e "${GREEN}✅ Dependencies ready${NC}"
else
    echo -e "${GREEN}✅ Dependencies up to date${NC}"
fi
echo ""

# Step 6: Check environment file
if [ ! -f ".env.production" ] && [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  Warning: No .env.production or .env.local found!${NC}"
    echo "   App may not work correctly without environment variables"
    echo ""
fi

# Step 7: Build the application
echo "🔨 Building application (this may take 2-5 minutes)..."
echo ""

# Skip image conversion if it fails (non-critical)
NODE_ENV=production npm run build || {
    echo -e "${YELLOW}⚠️  Build with image conversion failed, trying without...${NC}"
    npm run build -- --no-lint || {
        echo -e "${RED}❌ Build failed! Check errors above${NC}"
        exit 1
    }
}

if [ ! -f ".next/standalone/server.js" ]; then
    echo -e "${RED}❌ Build failed! .next/standalone/server.js not found${NC}"
    echo "   Check the build logs above for errors"
    exit 1
fi

echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo ""

# Step 8: Copy public folder to standalone
echo "📁 Copying public files..."
if [ -f "scripts/copy-public-to-standalone.js" ]; then
    node scripts/copy-public-to-standalone.js
    echo -e "${GREEN}✅ Public files copied${NC}"
else
    echo -e "${YELLOW}⚠️  Copy script not found, skipping...${NC}"
fi
echo ""

# Step 9: Start with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.js
pm2 save

# Step 10: Wait and verify
echo "⏳ Waiting for app to start..."
sleep 5

# Step 11: Check status
echo ""
echo "📊 PM2 Status:"
pm2 list

# Step 12: Health check
echo ""
echo "🏥 Health check..."
sleep 2

if curl -f http://localhost:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ App is responding on port 3000!${NC}"
elif curl -f http://127.0.0.1:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ App is responding on 127.0.0.1:3000!${NC}"
else
    echo -e "${YELLOW}⚠️  App may not be responding yet, check logs${NC}"
fi

# Step 13: Show logs
echo ""
echo "📋 Recent logs (last 15 lines):"
pm2 logs my-next-app --lines 15 --nostream 2>/dev/null || echo "   No logs yet"

# Step 14: Network info
echo ""
echo "🌐 Network Information:"
SERVER_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "unknown")
echo "   Server IP: $SERVER_IP"
echo "   App URL: http://$SERVER_IP:3000"
echo "   Local URL: http://localhost:3000"

# Step 15: Final instructions
echo ""
echo -e "${GREEN}✨ Deployment complete!${NC}"
echo ""
echo "📝 Useful commands:"
echo "   View logs:    pm2 logs my-next-app"
echo "   Restart:      pm2 restart my-next-app"
echo "   Status:       pm2 status"
echo "   Stop:         pm2 stop my-next-app"
echo ""
echo "🔍 Troubleshooting:"
echo "   If site doesn't load:"
echo "   1. Check firewall allows port 3000: sudo ufw allow 3000"
echo "   2. Check DNS points to server IP: $SERVER_IP"
echo "   3. View errors: pm2 logs my-next-app --err"
echo "   4. Test locally: curl http://localhost:3000"

