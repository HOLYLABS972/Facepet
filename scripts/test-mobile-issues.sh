#!/bin/bash

# Mobile Connectivity Diagnostic Script
# Tests tag.chapiz.co.il for mobile-specific issues

DOMAIN="tag.chapiz.co.il"
VPS_IP="46.224.38.1"

echo "🔍 Mobile Connectivity Diagnostic for $DOMAIN"
echo "VPS IP: $VPS_IP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1: DNS Records
echo "1️⃣ DNS RECORDS CHECK"
echo "─────────────────────────────────────────"
echo "IPv4 (A record):"
A_RECORD=$(dig A $DOMAIN +short)
if [ -z "$A_RECORD" ]; then
    echo "❌ No A record found!"
else
    echo "✅ $A_RECORD"
fi
echo ""

echo "IPv6 (AAAA record):"
AAAA_RECORD=$(dig AAAA $DOMAIN +short)
if [ -z "$AAAA_RECORD" ]; then
    echo "✅ No AAAA record (good if IPv6 not configured)"
else
    echo "⚠️  Found: $AAAA_RECORD"
    echo "   Testing if IPv6 is reachable..."
fi
echo ""

# Test 2: IPv4 Connectivity
echo "2️⃣ IPv4 CONNECTIVITY TEST"
echo "─────────────────────────────────────────"
if curl -4 -s -o /dev/null -w "%{http_code}" --connect-timeout 5 https://$DOMAIN | grep -q "200\|301\|302"; then
    echo "✅ IPv4 HTTPS working"
else
    echo "❌ IPv4 HTTPS failed"
fi
echo ""

# Test 3: IPv6 Connectivity
echo "3️⃣ IPv6 CONNECTIVITY TEST"
echo "─────────────────────────────────────────"
if [ ! -z "$AAAA_RECORD" ]; then
    if curl -6 -s -o /dev/null -w "%{http_code}" --connect-timeout 5 https://$DOMAIN 2>/dev/null | grep -q "200\|301\|302"; then
        echo "✅ IPv6 HTTPS working"
    else
        echo "❌ IPv6 HTTPS failed - THIS IS LIKELY YOUR PROBLEM!"
        echo "   Mobile devices prefer IPv6 and will fail if AAAA exists but unreachable"
        echo ""
        echo "🔧 FIX: Remove AAAA record from DNS or configure IPv6 on VPS"
    fi
else
    echo "✅ IPv6 not configured (skipped)"
fi
echo ""

# Test 4: SSL Certificate Chain
echo "4️⃣ SSL CERTIFICATE CHAIN"
echo "─────────────────────────────────────────"
CERT_CHECK=$(echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | grep "Verify return code")
echo "$CERT_CHECK"

if echo "$CERT_CHECK" | grep -q "0 (ok)"; then
    echo "✅ Certificate chain valid"
else
    echo "❌ Certificate chain broken - THIS CAUSES MOBILE FAILURES!"
    echo ""
    echo "🔧 FIX: Use fullchain.pem instead of cert.pem in Nginx"
    echo "   ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;"
fi
echo ""

# Test 5: Certificate Chain Details
echo "5️⃣ CERTIFICATE CHAIN DETAILS"
echo "─────────────────────────────────────────"
echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | grep -A1 "Certificate chain"
CHAIN_COUNT=$(echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | grep -c "s:CN")
echo ""
echo "Certificate chain length: $CHAIN_COUNT"
if [ "$CHAIN_COUNT" -ge 2 ]; then
    echo "✅ Chain includes intermediate certificates"
else
    echo "❌ Missing intermediate certificates - MOBILE WILL FAIL!"
fi
echo ""

# Test 6: TLS Version Support
echo "6️⃣ TLS VERSION SUPPORT"
echo "─────────────────────────────────────────"
if openssl s_client -connect $DOMAIN:443 -servername $DOMAIN -tls1_2 </dev/null 2>/dev/null | grep -q "Cipher"; then
    echo "✅ TLS 1.2 supported (required for older mobile devices)"
else
    echo "❌ TLS 1.2 not supported"
fi

if openssl s_client -connect $DOMAIN:443 -servername $DOMAIN -tls1_3 </dev/null 2>/dev/null | grep -q "Cipher"; then
    echo "✅ TLS 1.3 supported (modern devices)"
else
    echo "⚠️  TLS 1.3 not supported (not critical)"
fi
echo ""

# Test 7: Mobile User Agent Test
echo "7️⃣ MOBILE USER AGENT TEST"
echo "─────────────────────────────────────────"
MOBILE_RESPONSE=$(curl -A "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15" \
  -s -o /dev/null -w "%{http_code}" --connect-timeout 5 https://$DOMAIN 2>&1)

if echo "$MOBILE_RESPONSE" | grep -q "200\|301\|302"; then
    echo "✅ Mobile user agent test passed"
else
    echo "❌ Mobile user agent test failed: $MOBILE_RESPONSE"
fi
echo ""

# Test 8: Direct IP Test
echo "8️⃣ DIRECT IP TEST"
echo "─────────────────────────────────────────"
IP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://$VPS_IP:3000 2>&1)
if echo "$IP_RESPONSE" | grep -q "200\|301\|302"; then
    echo "✅ Next.js app responding on port 3000"
else
    echo "⚠️  Port 3000 not responding: $IP_RESPONSE"
    echo "   (May be normal if only accessible via reverse proxy)"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 DIAGNOSTIC SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ISSUES_FOUND=0

if [ ! -z "$AAAA_RECORD" ]; then
    if ! curl -6 -s -o /dev/null --connect-timeout 5 https://$DOMAIN 2>/dev/null; then
        echo "🚨 ISSUE 1: IPv6 record exists but not working"
        echo "   → Mobile devices try IPv6 first and fail"
        echo "   → FIX: Delete AAAA record from DNS or enable IPv6 on VPS"
        echo ""
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
fi

if ! echo "$CERT_CHECK" | grep -q "0 (ok)"; then
    echo "🚨 ISSUE 2: SSL certificate chain incomplete"
    echo "   → Mobile browsers reject incomplete chains"
    echo "   → FIX: Use fullchain.pem in Nginx/Apache config"
    echo ""
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

if [ "$CHAIN_COUNT" -lt 2 ]; then
    echo "🚨 ISSUE 3: Missing intermediate certificates"
    echo "   → Mobile needs full chain to validate"
    echo "   → FIX: Ensure ssl_certificate points to fullchain.pem"
    echo ""
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

if [ $ISSUES_FOUND -eq 0 ]; then
    echo "✅ No obvious issues found with current tests"
    echo ""
    echo "Additional debugging needed:"
    echo "1. Check mobile device error message"
    echo "2. Test on mobile data vs WiFi"
    echo "3. Check VPS firewall rules"
    echo "4. Review Nginx/Apache logs"
else
    echo "Found $ISSUES_FOUND issue(s) that could cause mobile failures"
    echo ""
    echo "📖 See docs/MOBILE_DEBUG_PLAN.md for detailed fixes"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Next steps:"
echo "1. Run: ssh chapiz-tag@$VPS_IP"
echo "2. Check: sudo nginx -t"
echo "3. View: sudo cat /etc/nginx/sites-available/$DOMAIN"
echo "4. Fix SSL: Use fullchain.pem instead of cert.pem"
echo "5. Remove IPv6: Delete AAAA DNS record if IPv6 not working"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
