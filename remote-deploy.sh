#!/bin/bash
set -e

# ============================================
# ProfitHunter — Remote Deploy Script
# Запусти с мака: bash remote-deploy.sh
# ============================================

SERVER="root@166.88.239.78"
APP_DIR="/opt/profithunter"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== ProfitHunter Remote Deploy ===${NC}"
echo "Сервер: $SERVER"
echo "Проект: $PROJECT_DIR"
echo ""

# 1. Копируем проект на сервер
echo -e "${GREEN}[1/3] Копирую файлы на сервер...${NC}"
ssh $SERVER "mkdir -p $APP_DIR"

rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.next' \
    --exclude '__pycache__' \
    --exclude '.git' \
    --exclude '*.pyc' \
    --exclude '.env' \
    --exclude 'venv' \
    --exclude '.venv' \
    "$PROJECT_DIR/" "$SERVER:$APP_DIR/"

echo -e "${GREEN}Файлы скопированы.${NC}"

# 2. Запускаем deploy.sh на сервере
echo -e "${GREEN}[2/3] Запускаю деплой на сервере...${NC}"
ssh $SERVER "chmod +x $APP_DIR/deploy.sh && bash $APP_DIR/deploy.sh"

# 3. Показываем статус
echo ""
echo -e "${GREEN}[3/3] Проверяю статус...${NC}"
ssh $SERVER "cd $APP_DIR/ops && docker-compose ps"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Готово!${NC}"
echo -e "${GREEN}  https://proffithunter.com${NC}"
echo -e "${GREEN}  Admin: https://proffithunter.com/admin${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Полезные команды:"
echo "  ssh $SERVER 'cd $APP_DIR/ops && docker-compose logs -f'        # Логи"
echo "  ssh $SERVER 'cd $APP_DIR/ops && docker-compose restart'        # Рестарт"
echo "  ssh $SERVER 'nano $APP_DIR/ops/.env'                           # Настройки"
