#!/bin/bash
set -e

DOMAIN="proffithunter.com"
APP_DIR="/opt/profithunter"
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== ProfitHunter Deploy ===${NC}"

# 1. System packages
echo -e "${GREEN}[1/7] Installing system packages...${NC}"
apt-get update -qq
apt-get install -y -qq docker.io docker-compose nginx certbot python3-certbot-nginx git curl > /dev/null 2>&1
systemctl enable docker
systemctl start docker
echo "Done."

# 2. Clone or update repo
echo -e "${GREEN}[2/7] Setting up project...${NC}"
if [ -d "$APP_DIR/.git" ]; then
    cd "$APP_DIR"
    git pull
else
    echo "Project directory: $APP_DIR"
    echo "Make sure you've copied the project to $APP_DIR"
    if [ ! -d "$APP_DIR" ]; then
        echo -e "${RED}ERROR: $APP_DIR not found. Copy project there first.${NC}"
        exit 1
    fi
fi
cd "$APP_DIR"
echo "Done."

# 3. Create .env
echo -e "${GREEN}[3/7] Creating .env...${NC}"
if [ ! -f "$APP_DIR/ops/.env" ]; then
    SECRET=$(openssl rand -hex 32)
    DB_PASS=$(openssl rand -hex 16)
    cat > "$APP_DIR/ops/.env" << EOF
SECRET_KEY=$SECRET
DB_PASSWORD=$DB_PASS
BOT_TOKEN=
CHAT_ID=
SMTP_SERVER=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
POCKET_OPTION_PARTNER_ID=
POCKET_OPTION_API_TOKEN=bTq2J8XiVdYJsWddHCEm
EOF
    echo "Created ops/.env with generated secrets"
else
    echo "ops/.env already exists, skipping"
fi

# 4. Nginx config (preserve existing configs like pocket-option.su)
echo -e "${GREEN}[4/7] Setting up Nginx...${NC}"
cp "$APP_DIR/nginx/proffithunter.conf" /etc/nginx/sites-available/proffithunter.conf

if [ ! -L /etc/nginx/sites-enabled/proffithunter.conf ]; then
    ln -sf /etc/nginx/sites-available/proffithunter.conf /etc/nginx/sites-enabled/proffithunter.conf
fi
echo "Done."

# 5. SSL certificate
echo -e "${GREEN}[5/7] Getting SSL certificate...${NC}"
mkdir -p /var/www/certbot
if [ ! -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    # Temporarily serve HTTP for certbot
    cat > /tmp/certbot-temp.conf << 'TMPCONF'
server {
    listen 80;
    server_name proffithunter.com www.proffithunter.com;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 200 'ok'; }
}
TMPCONF
    cp /tmp/certbot-temp.conf /etc/nginx/sites-available/proffithunter.conf
    ln -sf /etc/nginx/sites-available/proffithunter.conf /etc/nginx/sites-enabled/proffithunter.conf
    nginx -t && systemctl reload nginx

    certbot certonly --webroot -w /var/www/certbot \
        -d "$DOMAIN" -d "www.$DOMAIN" \
        --non-interactive --agree-tos --email "admin@$DOMAIN" || {
        echo -e "${RED}SSL failed. Make sure DNS A record points to this server.${NC}"
        echo "You can run certbot manually later."
    }

    # Restore real config
    cp "$APP_DIR/nginx/proffithunter.conf" /etc/nginx/sites-available/proffithunter.conf
fi
nginx -t && systemctl reload nginx
echo "Done."

# 6. Build and start Docker
echo -e "${GREEN}[6/7] Building and starting containers...${NC}"
cd "$APP_DIR/ops"
docker-compose down 2>/dev/null || true
docker-compose build --no-cache
docker-compose up -d
echo "Done."

# 7. Wait and verify
echo -e "${GREEN}[7/7] Verifying...${NC}"
sleep 10

# Check containers
echo ""
docker-compose ps
echo ""

# Check health
if curl -s http://127.0.0.1:8000/health | grep -q "healthy"; then
    echo -e "${GREEN}Backend: OK${NC}"
else
    echo -e "${RED}Backend: NOT READY (may need more time)${NC}"
fi

if curl -s http://127.0.0.1:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}Frontend: OK${NC}"
else
    echo -e "${RED}Frontend: NOT READY (building, wait 1-2 min)${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ProfitHunter deployed!${NC}"
echo -e "${GREEN}  https://$DOMAIN${NC}"
echo -e "${GREEN}  Admin: https://$DOMAIN/admin${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Useful commands:"
echo "  cd $APP_DIR/ops && docker-compose logs -f     # View logs"
echo "  cd $APP_DIR/ops && docker-compose restart     # Restart"
echo "  cd $APP_DIR/ops && docker-compose down        # Stop"
