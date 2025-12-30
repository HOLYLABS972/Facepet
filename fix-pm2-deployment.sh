#!/bin/bash

# Fix PM2 Deployment Script for tag.chapiz.co.il
# Run this on the server via SSH

echo "🔍 Checking PM2 status..."
pm2 list

echo ""
echo "📋 Checking PM2 logs for errors..."
pm2 logs my-next-app --lines 50 --nostream

echo ""
echo "🔍 Checking if build exists..."
if [ ! -f ".next/standalone/server.js" ]; then
    echo "❌ Build not found! Need to rebuild..."
    echo "📦 Installing dependencies..."
    npm install
    
    echo "🏗️  Building application..."
    npm run build
    
    if [ ! -f ".next/standalone/server.js" ]; then
        echo "❌ Build failed! Check the build output above."
        exit 1
    fi
    echo "✅ Build completed successfully!"
else
    echo "✅ Build exists at .next/standalone/server.js"
fi

echo ""
echo "🛑 Stopping PM2 process..."
pm2 stop my-next-app || pm2 delete my-next-app

echo ""
echo "🚀 Starting PM2 process..."
pm2 start ecosystem.config.js

echo ""
echo "⏳ Waiting 3 seconds for app to start..."
sleep 3

echo ""
echo "📊 PM2 Status:"
pm2 list

echo ""
echo "📋 Recent logs:"
pm2 logs my-next-app --lines 20 --nostream

echo ""
echo "🌐 Testing if app responds on port 3000..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|301\|302"; then
    echo "✅ App is responding on port 3000!"
else
    echo "❌ App is not responding on port 3000. Check logs above."
    echo "Run: pm2 logs my-next-app --lines 100"
fi

echo ""
echo "💾 Saving PM2 configuration..."
pm2 save

echo ""
echo "✅ Done! Check the output above for any errors."

