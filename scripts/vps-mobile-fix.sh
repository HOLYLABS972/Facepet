#!/bin/bash

# VPS Mobile Fix Script
# For tag.chapiz.co.il on VPS 46.224.38.1

echo "🔧 VPS Mobile Connectivity Fix"
echo "================================"
echo ""

# Check if running on VPS
if [ -d "/home/chapiz-tag/htdocs/tag.chapiz.co.il/Facepet" ]; then
    APP_DIR="/home/chapiz-tag/htdocs/tag.chapiz.co.il/Facepet"
    echo "✅ Running on VPS"
else
    echo "⚠️  Not on VPS, using current directory"
    APP_DIR="."
fi

cd "$APP_DIR" || exit 1

echo "Working directory: $APP_DIR"
echo ""

# Step 1: Check if app is running
echo "1️⃣ Checking if Next.js app is running..."
if curl -f -s http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ App is responding on port 3000"
else
    echo "❌ App is NOT responding on port 3000"
    echo "   Attempting to restart..."

    # Kill any process on port 3000
    PORT_3000_PIDS=$(lsof -ti:3000 2>/dev/null)
    if [ ! -z "$PORT_3000_PIDS" ]; then
        echo "   Killing processes on port 3000..."
        echo "$PORT_3000_PIDS" | xargs kill -9 2>/dev/null || true
        sleep 2
    fi

    # Start app
    echo "   Starting app with PM2..."
    pm2 start ecosystem.config.js 2>/dev/null || pm2 restart all
    pm2 save
    sleep 5

    # Verify
    if curl -f -s http://localhost:3000 >/dev/null 2>&1; then
        echo "✅ App started successfully"
    else
        echo "❌ Failed to start app"
        echo "   Check: pm2 logs"
        exit 1
    fi
fi
echo ""

# Step 2: Check Nginx
echo "2️⃣ Checking Nginx configuration..."
if command -v nginx >/dev/null 2>&1; then
    if sudo nginx -t 2>&1 | grep -q "successful"; then
        echo "✅ Nginx config is valid"
    else
        echo "❌ Nginx config has errors:"
        sudo nginx -t
        exit 1
    fi

    # Check if Nginx is running
    if sudo systemctl is-active --quiet nginx; then
        echo "✅ Nginx is running"
    else
        echo "⚠️  Nginx is not running, starting..."
        sudo systemctl start nginx
    fi
else
    echo "⚠️  Nginx not found (may not be needed if using Cloudflare)"
fi
echo ""

# Step 3: Test SSL
echo "3️⃣ Testing SSL/HTTPS connectivity..."
if curl -f -s https://tag.chapiz.co.il >/dev/null 2>&1; then
    echo "✅ HTTPS is working"
else
    echo "⚠️  HTTPS test failed"
    echo "   This may be normal if behind Cloudflare"
    echo "   Check Cloudflare SSL/TLS mode in dashboard"
fi
echo ""

# Step 4: Check certificate
echo "4️⃣ Checking SSL certificate..."
CERT_CHECK=$(echo | openssl s_client -connect tag.chapiz.co.il:443 -servername tag.chapiz.co.il 2>/dev/null | grep "Verify return code")
echo "$CERT_CHECK"

if echo "$CERT_CHECK" | grep -q "0 (ok)"; then
    echo "✅ Certificate is valid"
else
    echo "⚠️  Certificate may have issues"
fi
echo ""

# Step 5: Mobile user agent test
echo "5️⃣ Testing with mobile user agent..."
MOBILE_TEST=$(curl -A "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)" \
  -s -o /dev/null -w "%{http_code}" https://tag.chapiz.co.il 2>&1)

if echo "$MOBILE_TEST" | grep -q "200\|301\|302"; then
    echo "✅ Mobile user agent test passed (HTTP $MOBILE_TEST)"
else
    echo "❌ Mobile user agent test failed (HTTP $MOBILE_TEST)"
fi
echo ""

# Step 6: PM2 status
echo "6️⃣ PM2 Process Status:"
pm2 list
echo ""

# Summary
echo "================================"
echo "📊 Fix Summary"
echo "================================"
echo ""
echo "If mobile still doesn't work, check:"
echo ""
echo "🔹 Cloudflare Dashboard (dash.cloudflare.com):"
echo "   1. SSL/TLS → Overview → Set to 'Full (strict)'"
echo "   2. Security → Bots → Disable 'Bot Fight Mode' temporarily"
echo "   3. SSL/TLS → Edge Certificates → Enable 'Always Use HTTPS'"
echo ""
echo "🔹 Test on mobile:"
echo "   - Clear browser cache"
echo "   - Try incognito/private mode"
echo "   - Test on both WiFi and mobile data"
echo ""
echo "🔹 View logs:"
echo "   - PM2: pm2 logs my-next-app"
echo "   - Nginx: sudo tail -50 /var/log/nginx/error.log"
echo ""
echo "🔹 Compare with working Vercel:"
echo "   - Vercel: https://facepet-silk.vercel.app/en ✅"
echo "   - VPS: https://tag.chapiz.co.il ❌"
echo ""
echo "================================"
echo "See MOBILE_FIX_ACTION_PLAN.md for detailed fixes"
echo "================================"
