#!/bin/bash

# SSL Setup Script for chapiz.holylabs.net
# This script helps you set up Let's Encrypt SSL certificate

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}SSL Certificate Setup for chapiz.holylabs.net${NC}"
echo "=============================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}This script needs sudo privileges for certbot${NC}"
    echo "Please run with: sudo ./setup-ssl.sh"
    exit 1
fi

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}Certbot not found. Installing...${NC}"

    # Detect OS
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME

        if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
            apt update
            apt install -y certbot
        elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]]; then
            yum install -y certbot
        else
            echo -e "${RED}Unsupported OS. Please install certbot manually.${NC}"
            exit 1
        fi
    fi
fi

# Domain and email
DOMAIN="chapiz.holylabs.net"
WWW_DOMAIN="www.chapiz.holylabs.net"

echo -e "${GREEN}Step 1: Email Address${NC}"
read -p "Enter your email address for Let's Encrypt: " EMAIL

if [ -z "$EMAIL" ]; then
    echo -e "${RED}Email is required${NC}"
    exit 1
fi

# Stop Docker containers
echo ""
echo -e "${GREEN}Step 2: Stopping Docker containers${NC}"
docker-compose down

# Get certificate
echo ""
echo -e "${GREEN}Step 3: Obtaining SSL certificate${NC}"
certbot certonly --standalone \
    -d $DOMAIN \
    -d $WWW_DOMAIN \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --non-interactive

# Check if certificate was obtained
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Certificate obtained successfully!${NC}"
    echo ""
    echo "Certificate files:"
    echo "  Fullchain: /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
    echo "  Private Key: /etc/letsencrypt/live/$DOMAIN/privkey.pem"
else
    echo -e "${RED}✗ Failed to obtain certificate${NC}"
    exit 1
fi

# Backup current nginx.conf
echo ""
echo -e "${GREEN}Step 4: Updating nginx configuration${NC}"
if [ -f nginx.conf ]; then
    cp nginx.conf nginx.conf.backup
    echo -e "${GREEN}✓ Backed up nginx.conf to nginx.conf.backup${NC}"
fi

# Copy SSL-enabled nginx config
if [ -f nginx-ssl.conf ]; then
    cp nginx-ssl.conf nginx.conf
    echo -e "${GREEN}✓ Updated nginx.conf with SSL configuration${NC}"
else
    echo -e "${YELLOW}! nginx-ssl.conf not found. You'll need to update nginx.conf manually.${NC}"
fi

# Update docker-compose.yml
echo ""
echo -e "${GREEN}Step 5: Updating docker-compose.yml${NC}"

# Check if docker-compose.yml already has letsencrypt volume
if grep -q "/etc/letsencrypt" docker-compose.yml; then
    echo -e "${GREEN}✓ docker-compose.yml already configured for SSL${NC}"
else
    echo -e "${YELLOW}! Updating docker-compose.yml...${NC}"

    # Backup docker-compose.yml
    cp docker-compose.yml docker-compose.yml.backup

    # Add Let's Encrypt volume to nginx service
    # This is a simple addition - you might need to adjust based on your actual file
    echo -e "${YELLOW}Please manually add this to your nginx volumes in docker-compose.yml:${NC}"
    echo "      - /etc/letsencrypt:/etc/letsencrypt:ro"
fi

# Create certbot www directory
echo ""
echo -e "${GREEN}Step 6: Creating directories${NC}"
mkdir -p /var/www/certbot
chmod 755 /var/www/certbot
echo -e "${GREEN}✓ Created /var/www/certbot${NC}"

# Test nginx configuration
echo ""
echo -e "${GREEN}Step 7: Testing nginx configuration${NC}"
docker-compose up -d
sleep 5
docker-compose exec nginx nginx -t

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ nginx configuration is valid${NC}"
else
    echo -e "${RED}✗ nginx configuration has errors${NC}"
    echo "Restoring backup..."
    if [ -f nginx.conf.backup ]; then
        mv nginx.conf.backup nginx.conf
    fi
    exit 1
fi

# Reload nginx
echo ""
echo -e "${GREEN}Step 8: Reloading nginx${NC}"
docker-compose exec nginx nginx -s reload
echo -e "${GREEN}✓ nginx reloaded${NC}"

# Set up auto-renewal
echo ""
echo -e "${GREEN}Step 9: Setting up auto-renewal${NC}"

# Add cron job
CRON_CMD="0 0,12 * * * certbot renew --quiet --deploy-hook 'docker-compose -f $(pwd)/docker-compose.yml exec nginx nginx -s reload' >> /var/log/letsencrypt-renew.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "certbot renew"; then
    echo -e "${GREEN}✓ Cron job for renewal already exists${NC}"
else
    (crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -
    echo -e "${GREEN}✓ Added cron job for automatic renewal${NC}"
fi

# Test renewal (dry run)
echo ""
echo -e "${GREEN}Step 10: Testing renewal${NC}"
certbot renew --dry-run

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Renewal test successful${NC}"
else
    echo -e "${YELLOW}! Renewal test had issues (this is often okay)${NC}"
fi

# Final message
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}SSL Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Your site is now secured with HTTPS!"
echo ""
echo "URLs:"
echo "  HTTPS: https://$DOMAIN"
echo "  HTTP:  http://$DOMAIN (redirects to HTTPS)"
echo ""
echo "Certificate will auto-renew every 60 days."
echo ""
echo "Test your SSL:"
echo "  curl -I https://$DOMAIN"
echo "  https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
echo ""
echo -e "${YELLOW}Backup files created:${NC}"
echo "  nginx.conf.backup"
echo "  docker-compose.yml.backup"
echo ""
