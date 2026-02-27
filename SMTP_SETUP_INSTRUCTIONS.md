# Настройка SMTP для отправки писем

## Проблема
Сайт не отправляет письма из-за неправильной настройки SMTP сервера. Gmail блокирует письма от неизвестных SMTP серверов.

## Решение

### Вариант 1: Gmail SMTP (Рекомендуется)

1. **Создайте Gmail аккаунт** (или используйте существующий):
   - Перейдите на https://gmail.com
   - Создайте новый аккаунт специально для отправки писем

2. **Включите двухфакторную аутентификацию**:
   - Настройки → Безопасность → Двухэтапная проверка → Включить

3. **Создайте App Password**:
   - Настройки → Безопасность → Пароли приложений
   - Выберите приложение: "Почта"
   - Выберите устройство: "Другое"
   - Введите название: "Vision of Trading"
   - Скопируйте сгенерированный пароль (16 символов)

4. **Обновите настройки в docker-compose.yml**:
   ```yaml
   - SMTP_SERVER=smtp.gmail.com
   - SMTP_PORT=587
   - SMTP_USERNAME=your_gmail@gmail.com
   - SMTP_PASSWORD=abcd-efgh-ijkl-mnop  # Ваш app password
   ```

### Вариант 2: Yandex.Mail SMTP

1. **Создайте Yandex.Mail аккаунт**:
   - Перейдите на https://mail.yandex.com
   - Создайте новый аккаунт

2. **Настройте SMTP**:
   ```yaml
   - SMTP_SERVER=smtp.yandex.com
   - SMTP_PORT=587
   - SMTP_USERNAME=your_login@yandex.com
   - SMTP_PASSWORD=your_password
   ```

### Вариант 3: Mail.ru SMTP

1. **Создайте Mail.ru аккаунт**:
   - Перейдите на https://mail.ru
   - Создайте новый аккаунт

2. **Настройте SMTP**:
   ```yaml
   - SMTP_SERVER=smtp.mail.ru
   - SMTP_PORT=587
   - SMTP_USERNAME=your_login@mail.ru
   - SMTP_PASSWORD=your_password
   ```

## Применение изменений

После настройки SMTP:

```bash
cd /root/analog-opustitel/ops
docker-compose restart backend
```

## Тестирование

Проверьте отправку писем:

```bash
curl -X POST https://visionoftrading.com/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## Важные замечания

- **App Password**: Для Gmail обязательно используйте app password, а не обычный пароль
- **SPF записи**: Убедитесь, что ваш домен имеет правильные SPF записи для отправки писем
- **DKIM**: Рассмотрите настройку DKIM для лучшей доставляемости
- **Тестирование**: Всегда тестируйте отправку писем перед запуском в продакшн

## Troubleshooting

Если письма все еще не отправляются:

1. Проверьте логи: `docker-compose logs backend`
2. Проверьте правильность логина/пароля
3. Убедитесь, что порт 587 не заблокирован
4. Проверьте, что Gmail/Yandex не блокирует аккаунт


