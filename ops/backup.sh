#!/bin/bash

# Backup Script для базы данных и конфигураций
# Запускать ежедневно в 3:00 через cron

BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)

echo "=== BACKUP STARTED $(date) ==="

# Создаём директорию для бэкапов
mkdir -p $BACKUP_DIR

# 1. Бэкап базы данных
echo "🗄️ Бэкап базы данных..."
cd /root/analog-opustitel/ops
docker-compose exec -T postgres pg_dump -U opustoshitel opustoshitel > $BACKUP_DIR/db_backup_$DATE.sql

# 2. Бэкап конфигураций
echo "⚙️ Бэкап конфигураций..."
tar -czf $BACKUP_DIR/config_backup_$DATE.tar.gz \
  /root/analog-opustitel/ops/docker-compose.yml \
  /root/analog-opustitel/nginx/nginx.conf \
  /root/analog-opustitel/SMTP_SETUP.md

# 3. Очистка старых бэкапов (старше 7 дней)
echo "🧹 Очистка старых бэкапов..."
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "✅ Бэкап завершён: $BACKUP_DIR"
echo "=== BACKUP COMPLETED $(date) ==="
