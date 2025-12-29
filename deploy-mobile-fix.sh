#!/bin/bash

# Deploy Mobile Redirect Fix to VPS
# This script deploys the middleware fix that converts relative to absolute redirects

VPS_USER="chapiz-tag"
VPS_HOST="46.224.38.1"
VPS_PATH="/home/chapiz-tag/htdocs/tag.chapiz.co.il/Facepet"

echo "🚀 Deploying Mobile Redirect Fix to VPS"
echo "========================================"
echo ""

# Step 1: Commit changes locally
echo "1️⃣ Committing changes locally..."
git add src/middleware.ts
git commit -m "Fix mobile redirect issue - convert relative redirects to absolute URLs

- Some mobile browsers (especially on cellular networks) don't properly
  follow relative redirects like '/he'
- Updated middleware to detect relative redirects and convert them to
  absolute URLs like 'https://tag.chapiz.co.il/he'
- This fixes blank page / timeout issues on mobile devices" 2>/dev/null || echo "   No changes to commit (already committed)"
echo ""

# Step 2: Push to git
echo "2️⃣ Pushing to git repository..."
git push
echo ""

# Step 3: Deploy to VPS
echo "3️⃣ Connecting to VPS and deploying..."
ssh $VPS_USER@$VPS_HOST << 'ENDSSH'
echo "   Connected to VPS"
echo ""

# Navigate to project
cd /home/chapiz-tag/htdocs/tag.chapiz.co.il/Facepet || exit 1

echo "   📥 Pulling latest changes..."
git pull

echo ""
echo "   🔨 Building project..."
npm run build

echo ""
echo "   🔄 Restarting PM2..."
pm2 restart all
pm2 save

echo ""
echo "   ✅ Deployment complete!"
ENDSSH

echo ""
echo "4️⃣ Verifying deployment..."
sleep 3

# Test the redirect
echo "   Testing redirect..."
REDIRECT=$(curl -I -s https://tag.chapiz.co.il | grep -i "^location:" | awk '{print $2}' | tr -d '\r\n')

if [[ "$REDIRECT" == https://* ]]; then
    echo "   ✅ SUCCESS: Redirect is now absolute: $REDIRECT"
else
    echo "   ⚠️  WARNING: Redirect still appears relative: $REDIRECT"
    echo "   This might be cached. Wait 2 minutes and test on mobile."
fi

echo ""
echo "========================================"
echo "✅ Deployment Complete!"
echo ""
echo "Next steps:"
echo "1. Wait 1-2 minutes for changes to propagate"
echo "2. Test on mobile device:"
echo "   - Clear browser cache (Settings → Safari → Clear History)"
echo "   - Open in Private/Incognito mode"
echo "   - Visit: https://tag.chapiz.co.il"
echo "3. Should redirect to /he and load immediately"
echo ""
echo "If still having issues, check PM2 logs:"
echo "   ssh $VPS_USER@$VPS_HOST"
echo "   pm2 logs my-next-app"
echo ""
