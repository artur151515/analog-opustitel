# Opustoshitel TV - Trading Signals System

Профессиональная система торговых сигналов с интеграцией TradingView, FastAPI бэкендом и Next.js фронтендом.

## 🚀 Особенности

- **Pine Script v5** индикатор с алертами только на закрытом баре (no-repaint)
- **FastAPI** бэкенд с HMAC проверкой и идемпотентностью
- **Next.js** фронтенд с автообновлением и мобильной адаптацией
- **PostgreSQL** + **Redis** для надежного хранения и кэширования
- **Docker Compose** для простого развертывания
- **Nginx** reverse proxy с rate limiting
- **Comprehensive testing** с покрытием >90%
- **CI/CD** pipeline с GitHub Actions

## 📁 Архитектура

```
opustoshitel-tv/
├── pine/                    # Pine Script индикатор
│   └── opustoshitel_v1.pine
├── backend/                 # FastAPI приложение
│   ├── app/                 # Основное приложение
│   ├── migrations/          # Alembic миграции
│   ├── tests/               # Тесты
│   └── scripts/             # Скрипты
├── web/                     # Next.js фронтенд
│   ├── app/                 # App Router
│   └── components/          # React компоненты
├── nginx/                   # Nginx конфигурация
├── ops/                     # Docker Compose и Makefile
└── .github/workflows/       # CI/CD
```

## ⚡ Быстрый старт

### 1. Клонирование и настройка

```bash
# Клонируйте репозиторий
git clone <repo-url>
cd opustoshitel-tv

# Скопируйте переменные окружения
cp env.example .env
# Отредактируйте .env файл под ваши нужды
```

### 2. Запуск через Docker

```bash
# Перейдите в папку ops
cd ops

# Запуск всего стека
make up

# Применение миграций
make migrate

# Добавление символов
make seed

# Проверка здоровья
make health
```

### 3. Настройка TradingView Alert

1. **Добавьте индикатор**: Скопируйте код из `pine/opustoshitel_v1.pine` в TradingView
2. **Создайте Alert**:
   - **Condition**: `signal` (из индикатора)
   - **Options**: `Once Per Bar Close`
   - **Webhook URL**: `http://your-domain/api/tv-hook`
   - **Message**: Оставьте пустым (JSON генерируется автоматически)

## 🔌 API Endpoints

### POST /api/tv-hook
Принимает сигналы от TradingView.

**Headers:**
- `X-TV-Signature`: HMAC-SHA256 подпись

**Payload:**
```json
{
  "ts": 1640995200000,
  "symbol": "CADJPY",
  "tf": "5m",
  "dir": "UP"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Signal processed successfully",
  "signal_id": 123
}
```

### GET /api/signal
Получить последний сигнал для символа и таймфрейма.

**Query params:**
- `symbol`: Торговый символ (например, CADJPY)
- `tf`: Таймфрейм (например, 5m)

**Response:**
```json
{
  "id": 123,
  "symbol": "CADJPY",
  "tf": "5m",
  "direction": "UP",
  "enter_at": "2024-01-01T12:00:00Z",
  "expire_at": "2024-01-01T12:05:00Z",
  "generated_at": "2024-01-01T11:59:00Z"
}
```

### GET /api/stats
Получить статистику по символу и таймфрейму.

**Query params:**
- `symbol`: Торговый символ
- `tf`: Таймфрейм

**Response:**
```json
{
  "symbol": "CADJPY",
  "tf": "5m",
  "winrate_last_n": 0.65,
  "n": 200,
  "break_even_at": 0.5405,
  "signals_count": 1250,
  "wins": 130,
  "losses": 70,
  "skips": 0
}
```

## ⚙️ Переменные окружения

```bash
# База данных
DATABASE_URL=postgresql://opustoshitel:password@localhost:5432/opustoshitel

# Redis
REDIS_URL=redis://localhost:6379

# Безопасность
TV_WEBHOOK_SECRET=your-super-secret-webhook-key-change-this

# Разрешенные символы
ALLOWED_SYMBOLS=CADJPY,GBPJPY,EURUSD,GBPUSD,USDJPY,EURJPY

# Настройки приложения
DEBUG=false
LOG_LEVEL=INFO
APP_NAME=Opustoshitel TV
APP_VERSION=1.0.0

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:8000

# Производительность
REDIS_CACHE_TTL=300
MAX_SIGNALS_PER_PAGE=100
```

## 🗄️ Структура базы данных

### Таблицы:

**symbols** - Торговые символы
```sql
id (PK) | name (unique) | created_at
```

**signals** - Торговые сигналы
```sql
id (PK) | symbol_id (FK) | tf | ts | direction | enter_at | expire_at | created_at
```

**verdicts** - Результаты сигналов
```sql
id (PK) | signal_id (FK) | result | settled_at
```

**stats_rolling** - Скользящая статистика
```sql
id (PK) | symbol_id (FK) | tf | window | winrate | total_signals | wins | losses | skips
```

## 🧪 Тестирование

```bash
# Запуск всех тестов
make test

# Тесты идемпотентности
pytest backend/tests/test_idempotency.py

# Тесты no-repaint
pytest backend/tests/test_no_repaint_hist.py

# Тесты с покрытием
pytest backend/tests/ --cov=app --cov-report=html
```

### Примеры тестов

**Тест идемпотентности:**
```python
def test_duplicate_signal_not_created():
    # Первый запрос создает сигнал
    response1 = client.post("/api/tv-hook", json=payload, headers=headers)
    assert response1.status_code == 200
    
    # Второй запрос возвращает дубликат
    response2 = client.post("/api/tv-hook", json=payload, headers=headers)
    assert response2.json()["status"] == "duplicate"
```

**Тест no-repaint:**
```python
def test_historical_signals_remain_unchanged():
    # Создаем исторический сигнал
    create_signal(timestamp="2024-01-01T10:00:00Z")
    
    # Добавляем новый сигнал
    create_signal(timestamp="2024-01-01T12:00:00Z")
    
    # Проверяем, что исторический сигнал не изменился
    assert historical_signal.ts == original_timestamp
```

## 📊 Производительность

### Целевые метрики:
- **POST /api/tv-hook**: < 100ms
- **GET /api/signal**: < 250ms (с Redis кэшем)
- **Frontend LCP**: < 2s
- **Uptime**: > 99.9%

### Оптимизации:
- Redis кэширование для часто запрашиваемых данных
- Индексы базы данных для быстрых запросов
- Nginx rate limiting для защиты от DDoS
- Gzip сжатие для статических ресурсов

## 🔒 Безопасность

### Аутентификация:
- **HMAC-SHA256** проверка подписей от TradingView
- **Rate limiting** для публичных API (10 req/s для API, 5 req/s для webhooks)
- **Валидация временных меток** (±10 минут)
- **CORS** настройки для безопасного взаимодействия

### Идемпотентность:
- **Уникальные ключи** по `symbol|tf|ts`
- **Redis кэш** для предотвращения дубликатов
- **Database constraints** для целостности данных

### Мониторинг:
- **Health checks** каждые 30 секунд
- **Структурированные логи** без PII данных
- **Метрики производительности**

## ⚠️ Compliance

**ВАЖНЫЕ ПРЕДУПРЕЖДЕНИЯ:**
- 🚫 Контент предназначен для лиц **старше 18 лет**
- ⚖️ **Не является финансовой рекомендацией**
- 💰 Торговля на финансовых рынках сопряжена с **высокими рисками**
- 🌍 Проверьте **законодательство вашей юрисдикции**
- 📊 **Прошлые результаты не гарантируют будущие**

## 📈 Мониторинг

### Health Checks
```bash
# API статус
curl http://localhost/api/health

# Общий статус
curl http://localhost/health
```

### Логирование
```bash
# Просмотр логов
make logs

# Логи конкретного сервиса
make logs-backend
make logs-web
make logs-nginx
```

### Метрики
```bash
# Использование ресурсов
make stats

# Статус контейнеров
make ps
```

## 🛠️ Разработка

### Локальная разработка

```bash
# Бэкенд
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Фронтенд
cd web
npm install
npm run dev
```

### Структура кода

**Backend (FastAPI):**
- `app/main.py` - Основное приложение
- `app/routers/` - API роутеры
- `app/models.py` - SQLAlchemy модели
- `app/schema.py` - Pydantic схемы
- `app/security.py` - Безопасность и валидация
- `app/signals.py` - Бизнес-логика сигналов
- `app/stats.py` - Статистика и аналитика

**Frontend (Next.js):**
- `app/page.tsx` - Главная страница
- `app/signals/page.tsx` - Страница сигналов
- `app/components/` - React компоненты
- `app/globals.css` - Глобальные стили

### Полезные команды

```bash
# Полная настройка
make setup

# Очистка
make clean

# Бэкап базы данных
make backup-db

# Тестирование API
make test-api
make test-webhook
```

## 🚀 Развертывание

### Production

```bash
# Production конфигурация
make prod-up

# SSL сертификаты (настройте в nginx/nginx.conf)
# ssl_certificate /path/to/cert.pem
# ssl_certificate_key /path/to/key.pem
```

### Docker Hub / Registry

```bash
# Сборка и публикация образов
docker build -t opustoshitel/backend ./backend
docker build -t opustoshitel/frontend ./web
```

## 🤝 Вклад в проект

1. Fork репозиторий
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📝 Лицензия

MIT License - см. файл [LICENSE](LICENSE) для деталей.

## 📞 Поддержка

- 📧 Email: support@opustoshitel.com
- 📱 Telegram: @opustoshitel_support
- 🐛 Issues: [GitHub Issues](https://github.com/opustoshitel/tv/issues)

---

**⚡ Opustoshitel TV - Professional Trading Signals System**
