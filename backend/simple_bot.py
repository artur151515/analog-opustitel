#!/usr/bin/env python3
import asyncio
import aiohttp
import os
import json
from datetime import datetime

BOT_TOKEN = "7867334363:AAEit5T2DV36lgSB77EWscce9159nfjz6f0"
BASE_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"
ADMIN_FILE = "/root/analog-opustitel/backend/admin.json"
LOG_SETTINGS_FILE = "/root/analog-opustitel/backend/log_settings.json"

async def send_message(chat_id, text):
    url = f"{BASE_URL}/sendMessage"
    data = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML"
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=data) as response:
            result = await response.json()
            return result.get("ok", False)

async def get_updates(offset=0):
    url = f"{BASE_URL}/getUpdates"
    params = {
        "offset": offset,
        "timeout": 30
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url, params=params) as response:
            result = await response.json()
            return result.get("result", [])

def load_admins():
    try:
        if os.path.exists(ADMIN_FILE):
            with open(ADMIN_FILE, 'r') as f:
                data = json.load(f)
                return data.get('admin_ids', [])
        return []
    except:
        return []

def is_admin(user_id):
    return user_id in load_admins()

def load_log_settings():
    try:
        if os.path.exists(LOG_SETTINGS_FILE):
            with open(LOG_SETTINGS_FILE, 'r') as f:
                return json.load(f)
        else:
            default_settings = {
                "USER_LOGIN": {"enabled": True, "display_name": "Вход пользователя"},
                "USER_LOGOUT": {"enabled": True, "display_name": "Выход пользователя"},
                "USER_REGISTER": {"enabled": True, "display_name": "Регистрация"},
                "EMAIL_VERIFIED": {"enabled": True, "display_name": "Подтверждение email"},
                "PASSWORD_CHANGED": {"enabled": True, "display_name": "Смена пароля"},
                "POCKET_OPTION_VERIFIED": {"enabled": True, "display_name": "Подтверждение Pocket Option"},
                "SIGNAL_GENERATED": {"enabled": True, "display_name": "Генерация сигнала"},
                "SIGNAL_VIEWED": {"enabled": True, "display_name": "Просмотр сигнала"},
                "VISITOR": {"enabled": True, "display_name": "Посетитель сайта"},
                "BALANCE_UPDATE": {"enabled": True, "display_name": "Пополнение баланса"},
                "IMPORTANT_ACTION": {"enabled": True, "display_name": "Важное действие"},
                "POSTBACK_RECEIVED": {"enabled": True, "display_name": "Постбэк от Pocket Option"}
            }
            save_log_settings(default_settings)
            return default_settings
    except:
        return {}

def save_log_settings(settings):
    try:
        with open(LOG_SETTINGS_FILE, 'w') as f:
            json.dump(settings, f, indent=2)
        return True
    except:
        return False

async def handle_message(message):
    chat_id = message["chat"]["id"]
    user_id = message["from"]["id"]
    original_text = message.get("text", "").strip()
    text = original_text.lower()
    
    print(f"Received message from {user_id}: {text}")
    
    if text == "/start":
        if is_admin(user_id):
            await send_message(chat_id, """
👑 <b>Добро пожаловать, Администратор!</b>

Вы уже имеете права администратора и будете получать уведомления о посетителях сайта.

Доступные команды:
/admin - Проверить статус
/commands - Настройки логирования
            """)
        else:
            await send_message(chat_id, """
🔐 <b>Панель администратора</b>

Для получения прав администратора введите пароль:

<code>/password GLEB</code>

После ввода правильного пароля вы будете получать уведомления о посетителях сайта.
            """)
    
    elif text.startswith("/password "):
        password = original_text[10:].strip()
        
        if password == "GLEB":

            try:
                admin_file = "/root/analog-opustitel/backend/admin.json"
                if os.path.exists(admin_file):
                    with open(admin_file, 'r') as f:
                        data = json.load(f)
                else:
                    data = {"admin_ids": []}
                
                if user_id not in data["admin_ids"]:
                    data["admin_ids"].append(user_id)
                    with open(admin_file, 'w') as f:
                        json.dump(data, f, indent=2)
                    
                    await send_message(chat_id, """
✅ <b>Авторизация успешна!</b>

Теперь вы являетесь администратором и будете получать уведомления о всех посетителях сайта.

Доступные команды:
/start - Начать работу
/commands - Настройки логирования
                    """)
                else:
                    await send_message(chat_id, "❌ Вы уже являетесь администратором.")
            except Exception as e:
                await send_message(chat_id, f"❌ Ошибка: {e}")
        else:
            await send_message(chat_id, "❌ Неверный пароль. Попробуйте еще раз.")
    
    elif text == "/admin":
        if is_admin(user_id):
            await send_message(chat_id, "✅ Вы являетесь администратором.")
        else:
            await send_message(chat_id, "❌ Вы не являетесь администратором. Используйте /password GLEB для авторизации.")
    
    elif text == "/commands":
        settings = load_log_settings()
        
        message = "🤖 <b>Настройки логирования</b>\n\n📋 <b>Типы логов:</b>\n"
        
        for log_type, config in settings.items():
            status_emoji = "✅ ВКЛ" if config.get('enabled', True) else "❌ ВЫКЛ"
            message += f"{status_emoji} {log_type} - {config.get('display_name', log_type)}\n"
        
        message += """
🔧 <b>Управление через бота:</b>
/toggle VISITOR on/off - Включить/выключить лог посетителей
/toggle_all on/off - Включить/выключить все логи
        """
        
        await send_message(chat_id, message.strip())
    
    elif text.startswith("/toggle "):
        if not is_admin(user_id):
            await send_message(chat_id, "❌ Только администраторы могут управлять настройками.")
            return
        
        parts = original_text.split()
        if len(parts) != 3:
            await send_message(chat_id, "❌ Используйте: /toggle <ТИП> on/off")
            return
        
        log_type = parts[1].upper()
        action = parts[2].lower()
        
        if action not in ['on', 'off']:
            await send_message(chat_id, "❌ Используйте 'on' или 'off'")
            return
        
        settings = load_log_settings()
        if log_type in settings:
            enabled = action == 'on'
            settings[log_type]['enabled'] = enabled
            save_log_settings(settings)
            status = "включен" if enabled else "выключен"
            await send_message(chat_id, f"✅ Лог {log_type} {status}")
        else:
            await send_message(chat_id, f"❌ Неизвестный тип лога: {log_type}")
    
    elif text.startswith("/toggle_all "):
        if not is_admin(user_id):
            await send_message(chat_id, "❌ Только администраторы могут управлять настройками.")
            return
        
        parts = original_text.split()
        if len(parts) != 2:
            await send_message(chat_id, "❌ Используйте: /toggle_all on/off")
            return
        
        action = parts[1].lower()
        
        if action not in ['on', 'off']:
            await send_message(chat_id, "❌ Используйте 'on' или 'off'")
            return
        
        settings = load_log_settings()
        enabled = action == 'on'
        
        for log_type in settings.keys():
            settings[log_type]['enabled'] = enabled
        
        save_log_settings(settings)
        status = "включены" if enabled else "выключены"
        await send_message(chat_id, f"✅ Все логи {status}")
    
    elif text.startswith("/notify_postback"):
        if not is_admin(user_id):
            await send_message(chat_id, "❌ Только администраторы могут отправлять уведомления.")
            return
        
        parts = original_text.split()
        if len(parts) < 3:
            await send_message(chat_id, "❌ Используйте: /notify_postback <event_type> <email> [сумма]")
            return
        
        event_type = parts[1].upper()
        email = parts[2]
        amount = parts[3] if len(parts) > 3 else None
        
        if not load_log_settings().get("POSTBACK_RECEIVED", {}).get("enabled", True):
            return
        
        if event_type == "REG":
            message = f"""
🔄 <b>Новая регистрация в Pocket Option</b>

📧 Email: {email}
👤 Trader ID: Новый пользователь
⏰ Время: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            """
        elif event_type == "FTD":
            message = f"""
🎉 <b>Первый депозит (FTD)!</b>

📧 Email: {email}
💰 Сумма: ${amount}
👤 Тип: Первый депозит
⏰ Время: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            """
        elif event_type == "DEP":
            message = f"""
💰 <b>Повторный депозит</b>

📧 Email: {email}
💰 Сумма: ${amount}
👤 Тип: Повторное пополнение
⏰ Время: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            """
        elif event_type == "WDR":
            message = f"""
💸 <b>Вывод средств</b>

📧 Email: {email}
💰 Сумма: ${amount}
👤 Тип: Запрос на вывод
⏰ Время: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            """
        elif event_type == "COMMISSION":
            message = f"""
💵 <b>Комиссия получена</b>

📧 Email: {email}
💰 Сумма: ${amount}
👤 Тип: Партнерская комиссия
⏰ Время: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            """
        else:
            message = f"""
📡 <b>Постбэк получен</b>

📧 Email: {email}
🔧 Тип: {event_type}
💰 Сумма: ${amount if amount else '0'}
⏰ Время: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            """
        
        await send_message(chat_id, message.strip())

async def main():
    print("Starting Telegram bot...")
    offset = 0
    
    while True:
        try:
            updates = await get_updates(offset)
            
            if updates:
                offset = updates[-1]["update_id"] + 1
                
                for update in updates:
                    if "message" in update:
                        await handle_message(update["message"])
            
            await asyncio.sleep(1)
            
        except Exception as e:
            print(f"Error: {e}")
            await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(main())