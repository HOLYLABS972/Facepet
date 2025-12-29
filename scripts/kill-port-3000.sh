#!/bin/bash

# Kill process on port 3000 (Mac/Linux)

echo "🔍 Finding process on port 3000..."

# Find process ID using port 3000
PID=$(lsof -ti:3000 2>/dev/null)

if [ -z "$PID" ]; then
    echo "✅ Port 3000 is already free!"
    exit 0
fi

echo "⚠️  Found process $PID using port 3000"
echo "   Process details:"
lsof -i:3000

echo ""
read -p "Kill process $PID? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🛑 Killing process $PID..."
    kill -9 $PID
    sleep 1
    
    # Verify it's killed
    if lsof -ti:3000 >/dev/null 2>&1; then
        echo "❌ Process still running, trying force kill..."
        kill -9 $PID 2>/dev/null
    else
        echo "✅ Port 3000 is now free!"
    fi
else
    echo "❌ Cancelled"
    exit 1
fi

