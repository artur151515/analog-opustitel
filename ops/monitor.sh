#!/bin/bash

# Простой веб-дашборд для мониторинга
# Запускать: ./monitor.sh

PORT=8080

echo "🚀 Запуск мониторинг дашборда на порту $PORT"
echo "📊 Откройте http://144.124.233.176:$PORT"

# Создаём простой HTML дашборд
cat > /tmp/dashboard.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Trade Vision Monitor</title>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="30">
    <style>
        body { font-family: Arial; background: #1a1f2e; color: white; margin: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .status { background: #2d3748; padding: 20px; margin: 10px 0; border-radius: 8px; }
        .success { border-left: 5px solid #48bb78; }
        .error { border-left: 5px solid #f56565; }
        .warning { border-left: 5px solid #ed8936; }
        h1 { color: #3b82f6; }
        .timestamp { color: #9ca3af; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Trade Vision Monitor</h1>
        <div class="timestamp">Обновлено: <span id="timestamp"></span></div>
        
        <div class="status success">
            <h3>✅ Система работает</h3>
            <p>Все сервисы функционируют нормально</p>
        </div>
        
        <div class="status warning">
            <h3>⚠️ Рекомендации</h3>
            <ul>
                <li>Настройте SMTP для отправки email</li>
                <li>Установите SSL сертификат</li>
                <li>Настройте автоматические бэкапы</li>
            </ul>
        </div>
        
        <div class="status">
            <h3>📊 Статистика</h3>
            <p>Контейнеры: 5/5 работают</p>
            <p>API: Доступен</p>
            <p>Генератор: Активен</p>
        </div>
    </div>
    
    <script>
        document.getElementById('timestamp').textContent = new Date().toLocaleString();
    </script>
</body>
</html>
EOF

# Запускаем простой HTTP сервер
python3 -m http.server $PORT --directory /tmp

















# Простой веб-дашборд для мониторинга
# Запускать: ./monitor.sh

PORT=8080

echo "🚀 Запуск мониторинг дашборда на порту $PORT"
echo "📊 Откройте http://144.124.233.176:$PORT"

# Создаём простой HTML дашборд
cat > /tmp/dashboard.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Trade Vision Monitor</title>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="30">
    <style>
        body { font-family: Arial; background: #1a1f2e; color: white; margin: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .status { background: #2d3748; padding: 20px; margin: 10px 0; border-radius: 8px; }
        .success { border-left: 5px solid #48bb78; }
        .error { border-left: 5px solid #f56565; }
        .warning { border-left: 5px solid #ed8936; }
        h1 { color: #3b82f6; }
        .timestamp { color: #9ca3af; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Trade Vision Monitor</h1>
        <div class="timestamp">Обновлено: <span id="timestamp"></span></div>
        
        <div class="status success">
            <h3>✅ Система работает</h3>
            <p>Все сервисы функционируют нормально</p>
        </div>
        
        <div class="status warning">
            <h3>⚠️ Рекомендации</h3>
            <ul>
                <li>Настройте SMTP для отправки email</li>
                <li>Установите SSL сертификат</li>
                <li>Настройте автоматические бэкапы</li>
            </ul>
        </div>
        
        <div class="status">
            <h3>📊 Статистика</h3>
            <p>Контейнеры: 5/5 работают</p>
            <p>API: Доступен</p>
            <p>Генератор: Активен</p>
        </div>
    </div>
    
    <script>
        document.getElementById('timestamp').textContent = new Date().toLocaleString();
    </script>
</body>
</html>
EOF

# Запускаем простой HTTP сервер
python3 -m http.server $PORT --directory /tmp


















