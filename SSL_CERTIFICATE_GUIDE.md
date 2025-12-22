# SSL Certificate Setup for chapiz.holylabs.net

## 🔒 Option 1: Let's Encrypt (FREE - Recommended)

Let's Encrypt provides free SSL certificates that auto-renew. This is the best option for production.

### Using Certbot with Docker

#### Step 1: Install Certbot on your server
```bash
# On Ubuntu/Debian
sudo apt update
sudo apt install certbot

# On CentOS/RHEL
sudo yum install certbot
```

#### Step 2: Get SSL Certificate
```bash
# Stop your containers first
docker-compose down

# Get certificate (standalone mode)
sudo certbot certonly --standalone \
  -d chapiz.holylabs.net \
  -d www.chapiz.holylabs.net \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email

# Certificates will be saved to:
# /etc/letsencrypt/live/chapiz.holylabs.net/fullchain.pem
# /etc/letsencrypt/live/chapiz.holylabs.net/privkey.pem
```

#### Step 3: Update docker-compose.yml
```yaml
services:
  nginx:
    image: nginx:alpine
    container_name: facepet-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./logs/nginx:/var/log/nginx
      - /etc/letsencrypt:/etc/letsencrypt:ro  # Add SSL certs
    depends_on:
      - nextjs
    networks:
      - facepet-network
```

#### Step 4: Update nginx.conf

Add HTTPS server block:

```nginx
# Add this inside the http block, after the existing server block

server {
    listen 443 ssl http2;
    server_name chapiz.holylabs.net www.chapiz.holylabs.net;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/chapiz.holylabs.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chapiz.holylabs.net/privkey.pem;

    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Same locations as HTTP server
    location /_next/static {
        proxy_pass http://nextjs;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /api {
        limit_req zone=general burst=20 nodelay;
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}

# Update the HTTP server to redirect to HTTPS
server {
    listen 80;
    server_name chapiz.holylabs.net www.chapiz.holylabs.net;

    # ACME challenge for Let's Encrypt renewal
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Redirect all other HTTP traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}
```

#### Step 5: Create certbot renewal directory
```bash
mkdir -p /var/www/certbot
```

#### Step 6: Start containers
```bash
docker-compose up -d
```

#### Step 7: Auto-renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Add cron job for auto-renewal (runs twice daily)
sudo crontab -e

# Add this line:
0 0,12 * * * certbot renew --quiet --deploy-hook "docker-compose -f /path/to/your/Facepet/docker-compose.yml exec nginx nginx -s reload"
```

---

## 🔒 Option 2: Certbot with Docker Compose (All-in-one)

Use certbot container alongside your app.

### docker-compose.yml
```yaml
version: '3.8'

services:
  nextjs:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: facepet-nextjs
    restart: unless-stopped
    expose:
      - "3000"
    environment:
      - NODE_ENV=production
      - NEXT_TELEMETRY_DISABLED=1
      - PORT=3000
    env_file:
      - .env.production
    networks:
      - facepet-network

  nginx:
    image: nginx:alpine
    container_name: facepet-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./logs/nginx:/var/log/nginx
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
    depends_on:
      - nextjs
    networks:
      - facepet-network

  certbot:
    image: certbot/certbot
    container_name: facepet-certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

networks:
  facepet-network:
    driver: bridge
```

### Initial Certificate Generation
```bash
# Create directories
mkdir -p certbot/conf certbot/www

# Get initial certificate
docker-compose run --rm certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  -d chapiz.holylabs.net \
  -d www.chapiz.holylabs.net \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email

# Start all services
docker-compose up -d
```

---

## 🔒 Option 3: Cloudflare (FREE + CDN)

If you use Cloudflare for DNS:

### Advantages
- ✅ Free SSL certificate
- ✅ Automatic HTTPS
- ✅ CDN included
- ✅ DDoS protection
- ✅ No server configuration needed

### Setup Steps

1. **Add your domain to Cloudflare**
   - Go to https://dash.cloudflare.com/
   - Add `holylabs.net` as a site
   - Follow DNS setup instructions

2. **Configure DNS**
   ```
   Type: A
   Name: chapiz
   Content: YOUR_SERVER_IP
   Proxy: ✅ Proxied (orange cloud)
   ```

3. **SSL/TLS Settings**
   - Go to SSL/TLS tab
   - Set mode to "Full" or "Full (strict)"

4. **Update your nginx.conf**
   ```nginx
   # Keep only HTTP on port 80
   # Cloudflare will handle HTTPS

   server {
       listen 80;
       server_name chapiz.holylabs.net;

       # Trust Cloudflare's real IP
       set_real_ip_from 173.245.48.0/20;
       set_real_ip_from 103.21.244.0/22;
       set_real_ip_from 103.22.200.0/22;
       # ... (add all Cloudflare IP ranges)
       real_ip_header CF-Connecting-IP;

       # Your existing config...
   }
   ```

5. **Force HTTPS (in Cloudflare)**
   - Go to SSL/TLS > Edge Certificates
   - Enable "Always Use HTTPS"

---

## 🔒 Option 4: Buy SSL Certificate

If you need an Extended Validation (EV) certificate:

### Providers
- **Sectigo** - $50-200/year
- **DigiCert** - $200-500/year
- **GoDaddy** - $60-300/year

### After Purchase
1. Generate CSR on your server
2. Submit CSR to provider
3. Verify domain ownership
4. Download certificate files
5. Install in nginx (similar to Let's Encrypt setup)

---

## 📋 Quick Start (Recommended: Let's Encrypt)

```bash
# 1. Stop containers
docker-compose down

# 2. Get certificate
sudo certbot certonly --standalone \
  -d chapiz.holylabs.net \
  --email your@email.com \
  --agree-tos

# 3. Update docker-compose.yml to mount /etc/letsencrypt

# 4. Update nginx.conf with HTTPS config

# 5. Start containers
docker-compose up -d

# 6. Test
curl https://chapiz.holylabs.net/health
```

---

## ✅ Verification

After setup, test your SSL:

```bash
# Test HTTPS
curl -I https://chapiz.holylabs.net

# Test SSL Labs
# https://www.ssllabs.com/ssltest/analyze.html?d=chapiz.holylabs.net

# Test HTTP to HTTPS redirect
curl -I http://chapiz.holylabs.net
```

---

## 🔧 Troubleshooting

### Certificate not found
```bash
# Check certificate exists
sudo ls -la /etc/letsencrypt/live/chapiz.holylabs.net/

# Check nginx can access it
docker-compose exec nginx ls -la /etc/letsencrypt/live/chapiz.holylabs.net/
```

### nginx won't start
```bash
# Test nginx config
docker-compose exec nginx nginx -t

# Check logs
docker-compose logs nginx
```

### Port 80 needed for renewal
```bash
# Stop nginx temporarily
docker-compose stop nginx

# Renew
sudo certbot renew

# Start nginx
docker-compose start nginx
```

---

## 📝 Complete nginx.conf with SSL

See: [nginx-ssl.conf](nginx-ssl.conf) (I'll create this next)

---

**Recommended**: Use Let's Encrypt (Option 1) - it's free, automated, and trusted by all browsers!
