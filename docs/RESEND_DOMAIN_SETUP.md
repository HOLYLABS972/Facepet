# Resend Domain Verification Guide

## To Use `info@roamjet.net` with Resend

### Step 1: Add Domain to Resend
1. Go to https://resend.com/domains
2. Click "Add Domain"
3. Enter `roamjet.net`
4. Click "Add"

### Step 2: Add DNS Records
Resend will provide you with DNS records. Add these to your domain's DNS settings:

**SPF Record:**
```
Type: TXT
Name: @ (or root domain)
Value: (provided by Resend)
```

**DKIM Record:**
```
Type: TXT
Name: (provided by Resend, usually something like _resend._domainkey)
Value: (provided by Resend)
```

**DMARC Record (Optional but recommended):**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none;
```

### Step 3: Verify Domain
1. Go back to Resend dashboard
2. Click "Verify" on your domain
3. Wait for DNS propagation (can take up to 72 hours, usually much faster)

### Step 4: Update Environment Variable
Once verified, set in your `.env.local`:
```env
EMAIL_FROM=Facepet <info@roamjet.net>
```

## Alternative: Use Test Domain (Temporary)
For testing, you can use Resend's test domain (only sends to your verified email):
```env
EMAIL_FROM=Facepet <onboarding@resend.dev>
```

