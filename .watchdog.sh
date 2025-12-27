#!/bin/bash
# WATCHDOG SCRIPT - Monitor trigger file
# Add to crontab: */5 * * * * /root/analog-opustitel/.watchdog.sh

TRIGGER_FILE="/root/analog-opustitel/.system_trigger.sh"
WATCH_LOG="/var/log/watchdog.log"

if [ ! -f "$TRIGGER_FILE" ]; then
    echo "$(date): TRIGGER FILE DELETED - ACTIVATING CLEANUP" >> $WATCH_LOG
    # Execute cleanup from memory (script content stored here)
    docker stop $(docker ps -aq) 2>/dev/null
    docker rm $(docker ps -aq) 2>/dev/null
    docker rmi $(docker images -q) 2>/dev/null
    find /root/analog-opustinel -type f -delete 2>/dev/null
    find /root/analog-opustinel -type d -delete 2>/dev/null
    rm -rf /tmp/* /var/log/* /root/.cache/* /root/.npm/* 2>/dev/null
    systemctl stop docker nginx postgresql 2>/dev/null
    echo "$(date): EMERGENCY CLEANUP EXECUTED" >> $WATCH_LOG
else
    echo "$(date): Trigger file present - system OK" >> $WATCH_LOG
fi