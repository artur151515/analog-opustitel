#!/usr/bin/env python3
import asyncio
import aiohttp
import json
import os
from datetime import datetime

BOT_TOKEN = "7867334363:AAEit5T2DV36lgSB77EWscce9159nfjz6f0"
BASE_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"
ADMIN_PASSWORD = "GLEB"
ADMIN_FILE = "/app/admin.json"

async def send_message(chat_id, text):
    """Отправляем сообщение"""
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
    """Получаем обновления"""
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
    """Загружаем админов"""
    try:
        if os.path.exists(ADMIN_FILE):
            with open(ADMIN_FILE, 'r') as f:
                data = json.load(f)
                return data.get('admin_ids', [])
        return []
    except:
        return []

def save_admins(admin_ids):
    """Сохраняем админов"""
    try:
        data = {"admin_ids": admin_ids}
        with open(ADMIN_FILE, 'w') as f:
            json.dump(data, f, indent=2)
        return True
    except:
        return False

def is_admin(user_id):
    """Проверяем, админ ли"""
    return user_id in load_admins()

async def handle_message(message):
    """Обрабатываем сообщение"""
    chat_id = message["chat"]["id"]
    user_id = message["from"]["id"]
    text = message.get("text", "").strip().lower()
    
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Message from {user_id}: {text}")
    
    if text == "/start":
        if is_admin(user_id):
            await send_message(chat_id, """
👑 <b>Добро пожаловать, Администратор!</b>

Вы уже имеете права администратора и будете получать уведомления о посетителях сайта.

Доступные команды:
/admin - Проверить статус
/help - Показать справку
            """)
        else:
            await send_message(chat_id, """
🔐 <b>Авторизация администратора</b>

Для получения прав администратора введите пароль:

<code>/password GLEB</code>

После ввода правильного пароля вы будете получать уведомления о посетителях сайта.
            """)
    
    elif text.startswith("/password "):
        password = text[10:].strip()
        
        if password == ADMIN_PASSWORD:
            admin_ids = load_admins()
            if user_id not in admin_ids:
                admin_ids.append(user_id)
                if save_admins(admin_ids):
                    await send_message(chat_id, """
✅ <b>Авторизация успешна!</b>

Теперь вы являетесь администратором и будете получать уведомления о всех посетителях сайта.

Доступные команды:
/admin - Проверить статус
/help - Справка
                    """)
                else:
                    await send_message(chat_id, "❌ Ошибка сохранения. Попробуйте еще раз.")
            else:
                await send_message(chat_id, "❌ Вы уже являетесь администратором.")
        else:
            await send_message(chat_id, "❌ Неверный пароль. Попробуйте еще раз.")
    
    elif text == "/admin":
        if is_admin(user_id):
            await send_message(chat_id, "✅ Вы являетесь администратором.")
        else:
            await send_message(chat_id, "❌ Вы не являетесь администратором. Используйте /password GLEB для авторизации.")
    
    elif text == "/help":
        await send_message(chat_id, """
🤖 <b>Справка бота</b>

Команды:
/start - Начать работу с ботом
/password <пароль> - Ввести пароль администратора
/admin - Проверить статус администратора
/help - Показать эту справку

После успешной авторизации вы будете получать уведомления о:
🔐 Входах пользователей на сайт
👥 Посетителях сайта (IP, устройство, браузер)
💰 Пополнениях баланса
⚠️ Важных действиях
        """)

async def main():
    """Основная функция бота"""
    print("🤖 Starting Telegram Bot...")
    print(f"📁 Admin file: {ADMIN_FILE}")
    print(f"🔑 Admin password: {ADMIN_PASSWORD}")
    
    # Проверяем админов при запуске
    admin_ids = load_admins()
    print(f"👑 Current admins: {len(admin_ids)} users")
    
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
            print(f"❌ Error: {e}")
            await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(main())