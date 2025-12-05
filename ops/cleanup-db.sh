#!/bin/bash

# Script to clean all user data from the database
# Usage: ./cleanup-db.sh

echo "🧹 Starting database cleanup..."

# Change to ops directory
cd "$(dirname "$0")"

echo "📊 Current data counts:"
docker-compose exec -T postgres psql -U visionoftrading -d opustoshitel -c "
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION SELECT 'postback_logs', COUNT(*) FROM postback_logs
UNION SELECT 'signals', COUNT(*) FROM signals
UNION SELECT 'verdicts', COUNT(*) FROM verdicts;
"

echo "🗑️  Deleting all user data..."
docker-compose exec -T postgres psql -U visionoftrading -d opustoshitel -c "
DELETE FROM signals;
DELETE FROM postback_logs;
DELETE FROM users;
"

echo "🔄 Clearing Redis cache..."
docker-compose exec -T redis redis-cli FLUSHALL

echo "🔄 Restarting backend..."
docker-compose restart backend

echo "✨ Database cleanup completed!"
echo "📊 Verification:"
docker-compose exec -T postgres psql -U visionoftrading -d opustoshitel -c "
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION SELECT 'postback_logs', COUNT(*) FROM postback_logs
UNION SELECT 'signals', COUNT(*) FROM signals
UNION SELECT 'verdicts', COUNT(*) FROM verdicts;
"


