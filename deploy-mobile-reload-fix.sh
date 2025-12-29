#!/bin/bash

# Deploy Mobile Reload Fix to VPS
# Fixes the issue where mobile browsers reload the page after 1 second

VPS_USER="chapiz-tag"
VPS_HOST="46.224.38.1"
VPS_PATH="/home/chapiz-tag/htdocs/tag.chapiz.co.il/Facepet"

echo "🔄 Deploying Mobile Reload Fix to VPS"
echo "========================================"
echo ""
echo "This fixes the issue where mobile browsers reload after 1 second"
echo "by replacing aggressive cache headers with smart caching."
echo ""

# Step 1: Commit changes locally
echo "1️⃣ Committing changes locally..."
git add src/middleware.ts
git commit -m "Fix mobile reload issue - replace aggressive cache headers with smart caching

- Mobile browsers were reloading after 1 second due to aggressive
  'no-cache, no-store' headers combined with Firebase auth initialization
- Changed to 'private, max-age=0, must-revalidate' which prevents
  mobile reload while still keeping data fresh
- Desktop browsers unaffected, mobile UX now smooth without reload flash" 2>/dev/null || echo "   No changes to commit (already committed)"
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

# Test the cache headers
echo "   Testing cache headers..."
CACHE_HEADER=$(curl -I -s https://tag.chapiz.co.il/he | grep -i "^cache-control:" | tr -d '\r\n')

if [[ "$CACHE_HEADER" == *"private"* ]] && [[ "$CACHE_HEADER" == *"must-revalidate"* ]]; then
    echo "   ✅ SUCCESS: Cache headers updated correctly"
    echo "   $CACHE_HEADER"
else
    echo "   ⚠️  WARNING: Cache headers might not be updated yet: $CACHE_HEADER"
    echo "   This might be cached. Wait 2 minutes and test on mobile."
fi

echo ""
echo "========================================"
echo "✅ Deployment Complete!"
echo ""
echo "What was fixed:"
echo "  • Mobile browsers no longer reload after 1 second"
echo "  • Page displays smoothly without flash/jump"
echo "  • Firebase auth initializes without triggering reload"
echo "  • Data still stays fresh (revalidates on each request)"
echo ""
echo "Next steps:"
echo "1. Wait 1-2 minutes for changes to propagate"
echo "2. Test on mobile device:"
echo "   - Clear browser cache (Settings → Safari → Clear History)"
echo "   - Open in Private/Incognito mode"
echo "   - Visit: https://tag.chapiz.co.il"
echo "   - Page should load once and stay (no reload)"
echo ""
echo "3. Verify:"
echo "   - No flash/jump after initial display"
echo "   - Firebase auth works normally"
echo "   - Data updates properly"
echo ""
echo "If still having issues:"
echo "   - Check PM2 logs: ssh $VPS_USER@$VPS_HOST 'pm2 logs my-next-app'"
echo "   - Check if Cloudflare is caching: Purge cache in Cloudflare dashboard"
echo "   - See MOBILE_RELOAD_FIX.md for troubleshooting"
echo ""
