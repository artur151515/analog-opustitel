#!/bin/bash

# Скрипт для запуска генератора сигналов
# Использование: ./start-generator.sh

echo "🚀 Запуск генератора торговых сигналов..."

# Проверяем что контейнеры запущены
if ! docker-compose ps | grep -q "visionoftrading-backend.*Up"; then
    echo "❌ Backend контейнер не запущен!"
    echo "Запустите сначала: docker-compose up -d"
    exit 1
fi

# Проверяем что база данных доступна
if ! docker-compose exec backend python -c "from app.db import test_connections; test_connections()" 2>/dev/null; then
    echo "❌ База данных недоступна!"
    echo "Подождите несколько секунд и попробуйте снова"
    exit 1
fi

echo "✅ Backend и база данных доступны"

# Запускаем генератор сигналов
echo "🎯 Запуск генератора сигналов..."

docker-compose exec -d backend python -c "
import asyncio
from app.routers.signal_generator import start_signal_generator

async def main():
    print('🚀 Генератор сигналов запущен!')
    await start_signal_generator()

if __name__ == '__main__':
    asyncio.run(main())
"

# Проверяем что генератор запустился
sleep 3

if docker-compose exec backend python -c "
import requests
try:
    response = requests.get('http://localhost:8000/api/signal?symbol=CADJPY&tf=5m', timeout=5)
    if response.status_code == 200:
        print('✅ Генератор работает!')
        exit(0)
    else:
        print('❌ Генератор не отвечает')
        exit(1)
except Exception as e:
    print(f'❌ Ошибка: {e}')
    exit(1)
" 2>/dev/null; then
    echo "🎉 Генератор сигналов успешно запущен!"
    echo "📊 Сигналы будут генерироваться для таймфреймов: 3m, 5m, 7m"
    echo "🔄 Обновление каждые 30 секунд"
else
    echo "❌ Ошибка запуска генератора"
    echo "Проверьте логи: docker-compose logs backend"
    exit 1
fi

echo ""
echo "🔗 Полезные ссылки:"
echo "   Главная страница: http://localhost/"
echo "   API документация: http://localhost:8000/docs"
echo "   Статус сигналов: http://localhost:8000/api/signal?symbol=CADJPY&tf=5m"
echo ""
echo "📝 Для остановки генератора:"
echo "   docker-compose exec backend pkill -f signal_generator"

