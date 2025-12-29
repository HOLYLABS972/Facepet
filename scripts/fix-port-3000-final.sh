#!/bin/bash

# Final fix for port 3000 issue

echo "🔧 Final Fix for Port 3000..."
echo ""

# Find ALL processes using port 3000
echo "1️⃣ Finding all processes on port 3000..."
ALL_PIDS=$(lsof -ti:3000 2>/dev/null)
if [ ! -z "$ALL_PIDS" ]; then
    echo "   Processes found:"
    lsof -i:3000 | grep LISTEN || lsof -i:3000
    echo ""
    echo "2️⃣ Killing all processes..."
    echo "$ALL_PIDS" | while read pid; do
        if [ ! -z "$pid" ]; then
            COMMAND=$(ps -p $pid -o comm= 2>/dev/null || echo "unknown")
            echo "   Killing PID $pid ($COMMAND)..."
            kill -9 $pid 2>/dev/null || true
        fi
    done
    sleep 2
    
    # Verify
    REMAINING=$(lsof -ti:3000 2>/dev/null)
    if [ ! -z "$REMAINING" ]; then
        echo "   ⚠️  Some processes still running, force killing..."
        echo "$REMAINING" | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
else
    echo "   ✅ No processes found on port 3000"
fi

# Final check
echo ""
echo "3️⃣ Final check..."
if lsof -ti:3000 >/dev/null 2>&1; then
    echo "   ❌ Port 3000 still in use:"
    lsof -i:3000
    echo ""
    echo "   Try manually:"
    echo "   sudo lsof -i:3000"
    echo "   sudo kill -9 <PID>"
else
    echo "   ✅ Port 3000 is now FREE!"
fi

