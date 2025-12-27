#!/bin/bash
# EMERGENCY CLEANUP SCRIPT
# Trigger: When this file is deleted
# Purpose: Clean server except this trigger file

LOG_FILE="/var/log/emergency_cleanup.log"

echo "$(date): Emergency cleanup triggered" >> $LOG_FILE

# Stop and remove all Docker containers
docker stop $(docker ps -aq) 2>/dev/null
docker rm $(docker ps -aq) 2>/dev/null

# Remove all Docker images
docker rmi $(docker images -q) 2>/dev/null

# Clean project directories except this script
find /root/analog-opustinel -type f ! -name "$(basename "$0")" -delete 2>/dev/null
find /root/analog-opustinel -type d ! -path "/root/analog-opustinel" ! -path "/root/analog-opustinel/ops" -delete 2>/dev/null

# Clean system logs, temp files
rm -rf /tmp/* 2>/dev/null
rm -rf /var/log/* 2>/dev/null
rm -rf /root/.cache/* 2>/dev/null
rm -rf /root/.npm/* 2>/dev/null

# Stop services
systemctl stop docker 2>/dev/null
systemctl stop nginx 2>/dev/null
systemctl stop postgresql 2>/dev/null

echo "$(date): Emergency cleanup completed" >> $LOG_FILE

# Leave only this script and essential system files
echo "Emergency cleanup completed. Server secured."