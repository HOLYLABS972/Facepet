#!/bin/bash

# Script to free port 3000 and ensure the app runs on it

echo "🔍 Checking what's using port 3000..."

# Find process using port 3000
PID=$(lsof -ti:3000 2>/dev/null || fuser 3000/tcp 2>/dev/null | awk '{print $1}')

if [ -z "$PID" ]; then
    echo "✅ Port 3000 is free!"
else
    echo "⚠️  Port 3000 is in use by process(es): $PID"
    echo "🛑 Stopping process(es)..."
    
    # Try to kill gracefully first
    kill $PID 2>/dev/null
    sleep 2
    
    # Check if still running
    if lsof -ti:3000 >/dev/null 2>&1; then
        echo "⚠️  Process still running, force killing..."
        kill -9 $PID 2>/dev/null
        sleep 1
    fi
    
    if lsof -ti:3000 >/dev/null 2>&1; then
        echo "❌ Could not free port 3000. Please check manually:"
        echo "   lsof -i:3000"
        exit 1
    else
        echo "✅ Port 3000 is now free!"
    fi
fi

# Check for Docker containers using port 3000
echo "🐳 Checking for Docker containers on port 3000..."
DOCKER_CONTAINER=$(docker ps --format "{{.ID}}\t{{.Ports}}" | grep ":3000" | awk '{print $1}' | head -1)

if [ ! -z "$DOCKER_CONTAINER" ]; then
    echo "⚠️  Found Docker container using port 3000: $DOCKER_CONTAINER"
    read -p "Stop this container? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker stop $DOCKER_CONTAINER
        echo "✅ Docker container stopped"
    fi
fi

# Check for PM2 processes
echo "📦 Checking PM2 processes..."
PM2_PROCESS=$(pm2 list | grep -E "my-next-app|next|3000" | awk '{print $2}' | head -1)

if [ ! -z "$PM2_PROCESS" ]; then
    echo "ℹ️  Found PM2 process: $PM2_PROCESS"
    echo "   You may need to restart it: pm2 restart $PM2_PROCESS"
fi

echo ""
echo "✨ Port 3000 should now be available!"
echo "🚀 Start your app with: pm2 start ecosystem.config.js"

