import asyncio
import aiohttp
import os
from typing import Optional, Dict, Any
from datetime import datetime
from .admin_manager import admin_manager
from .log_settings_manager import log_settings_manager

class TelegramBot:
    def __init__(self):
        self.token = os.getenv("BOT_TOKEN", "7867334363:AAEit5T2DV36lgSB77EWscce9159nfjz6f0")
        self.chat_id = os.getenv("CHAT_ID")
        self.base_url = f"https://api.telegram.org/bot{self.token}"
        self.webhook_url = None
    
    async def send_message(self, text: str, chat_id = None, parse_mode: str = "HTML") -> bool:
        if not self.token:
            return False
        
        target_chat_id = str(chat_id) if chat_id else self.chat_id
        if not target_chat_id:
            return False
        
        url = f"{self.base_url}/sendMessage"
        data = {
            "chat_id": target_chat_id,
            "text": text,
            "parse_mode": parse_mode
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=data) as response:
                    result = response.status == 200
                    print(f"Telegram bot: Message sent. Status: {response.status}, Success: {result}")
                    return result
        except Exception as e:
            print(f"Telegram bot: Error sending message: {e}")
            return False
    
    async def handle_webhook(self, update: Dict[str, Any]) -> bool:
        try:
            if 'message' in update:
                message = update['message']
                user_id = message['from']['id']
                chat_id = message['chat']['id']
                text = message.get('text', '')
                
                await self.handle_command(user_id, chat_id, text)
                
            return True
        except Exception as e:
            print(f"Telegram bot: Error handling webhook: {e}")
            return False
    
    async def handle_command(self, user_id: int, chat_id: int, text: str):
        original_text = text.strip()
        text = original_text.lower()
        
        if text == '/start':
            await self.handle_start(user_id, chat_id)
        elif text.startswith('/password '):
            password = original_text[10:].strip()
            await self.handle_password(user_id, chat_id, password)
        elif text == '/admin':
            await self.handle_admin_check(user_id, chat_id)
        elif text == '/commands':
            await self.handle_commands(user_id, chat_id)
        elif text.startswith('/toggle '):
            await self.handle_toggle(user_id, chat_id, original_text[8:].strip())
        elif text.startswith('/toggle_all '):
            await self.handle_toggle_all(user_id, chat_id, original_text[12:].strip())
        elif text.startswith('/check '):
            await self.handle_check(user_id, chat_id, original_text[7:].strip())
    
    async def handle_start(self, user_id: int, chat_id: int):
        if admin_manager.is_admin(user_id):
            message = """
👑 <b>Добро пожаловать, Администратор!</b>

Вы уже имеете права администратора и будете получать уведомления о посетителях сайта.

Доступные команды:
/admin - Проверить статус администратора
/commands - Показать все команды и настройки логирования
            """
        else:
            admin_ids = admin_manager.load_admins()
            
            if len(admin_ids) == 0:
                if admin_manager.add_admin(user_id):
                    message = """
✅ <b>Вы автоматически добавлены как администратор!</b>

Теперь вы будете получать уведомления о посетителях сайта.

Доступные команды:
/admin - Проверить статус администратора
/commands - Показать все команды и настройки логирования
                    """
                else:
                    admin_manager.start_auth_process(user_id)
                    message = """
🔐 <b>Авторизация администратора</b>

Для получения прав администратора введите пароль:
<code>/password ваш_пароль</code>

После ввода правильного пароля вы будете получать уведомления о посетителях сайта.
                    """
            else:
                message = """
🔐 <b>Авторизация администратора</b>

Для получения прав администратора введите пароль:
<code>/password GLEB</code>

После ввода правильного пароля вы будете получать уведомления о посетителях сайта.
                """
        
        await self.send_message(message.strip(), str(chat_id))
    
    async def handle_password(self, user_id: int, chat_id: int, password: str):
        print(f"DEBUG BOT: Received password from user {user_id}: '{password}'")
        
        if admin_manager.is_admin(user_id):
            await self.send_message("❌ Вы уже являетесь администратором.", str(chat_id))
            return
        
        if admin_manager.check_password(user_id, password):
            message = """
✅ <b>Авторизация успешна!</b>

Теперь вы являетесь администратором и будете получать уведомления о посетителях сайта.

Доступные команды:
/admin - Проверить статус администратора
/help - Показать справку
/commands - Показать все команды и настройки логирования
            """
        else:
            message = f"""
❌ <b>Неверный пароль!</b>

Получен пароль: '{password}'
Попробуйте еще раз или обратитесь к главному администратору.
            """
        
        await self.send_message(message.strip(), str(chat_id))
    
    async def handle_toggle(self, user_id: int, chat_id: int, params: str):
        if not admin_manager.is_admin(user_id):
            await self.send_message("❌ Только администраторы могут управлять настройками.", str(chat_id))
            return
        
        parts = params.split()
        if len(parts) != 2:
            await self.send_message("❌ Используйте формат: /toggle <ТИП> on/off", str(chat_id))
            return
        
        log_type = parts[0].upper()
        action = parts[1].lower()
        
        if action not in ['on', 'off']:
            await self.send_message("❌ Используйте 'on' или 'off'", str(chat_id))
            return
        
        enabled = action == 'on'
        
        if log_settings_manager.set_log_enabled(log_type, enabled, user_id):
            status = "включен" if enabled else "выключен"
            await self.send_message(f"✅ Лог {log_type} {status}", str(chat_id))
        else:
            await self.send_message(f"❌ Ошибка при изменении настроек для {log_type}", str(chat_id))
    
    async def handle_toggle_all(self, user_id: int, chat_id: int, params: str):
        if not admin_manager.is_admin(user_id):
            await self.send_message("❌ Только администраторы могут управлять настройками.", str(chat_id))
            return
        
        action = params.lower()
        
        if action not in ['on', 'off']:
            await self.send_message("❌ Используйте 'on' или 'off'", str(chat_id))
            return
        
        enabled = action == 'on'
        
        if log_settings_manager.toggle_all_logs(enabled, user_id):
            status = "включены" if enabled else "выключены"
            await self.send_message(f"✅ Все логи {status}", str(chat_id))
        else:
            await self.send_message("❌ Ошибка при изменении настроек", str(chat_id))
    
    async def handle_check(self, user_id: int, chat_id: int, log_type: str):
        if not admin_manager.is_admin(user_id):
            await self.send_message("❌ Только администраторы могут проверять настройки.", str(chat_id))
            return
        
        log_type = log_type.upper()
        enabled = log_settings_manager.is_log_enabled(log_type, user_id)
        status = "ВКЛ" if enabled else "ВЫКЛ"
        
        await self.send_message(f"📊 Статус {log_type}: {status}", str(chat_id))
    
    async def handle_help(self, chat_id: int):
        message = """
🤖 <b>Справка бота</b>

Команды:
/start - Начать работу с ботом
/password <пароль> - Ввести пароль администратора
/admin - Проверить статус администратора
/commands - Показать все команды и настройки логирования
/help - Показать эту справку

После успешной авторизации вы будете получать уведомления о:
🔐 Входах пользователей на сайт
👥 Посетителях сайта (IP, устройство, браузер, ОС)
💰 Пополнениях баланса
⚠️ Важных действиях
        """
        
        await self.send_message(message.strip(), str(chat_id))
    
    async def handle_admin_check(self, user_id: int, chat_id: int):
        """Проверяем статус администратора"""
        if admin_manager.is_admin(user_id):
            message = "✅ Вы являетесь администратором."
        else:
            message = "❌ Вы не являетесь администратором. Используйте /password <пароль> для авторизации."
        
        await self.send_message(message, str(chat_id))
    
    async def handle_commands(self, user_id: int, chat_id: int):
        from .log_settings_manager import log_settings_manager
        
        settings = log_settings_manager.get_all_settings()
        
        message = """
🤖 <b>Доступные команды и настройки логирования</b>

📋 <b>Типы логов:</b>
"""
        
        for log_type, config in settings.items():
            status_emoji = "✅ ВКЛ" if config.get('enabled', True) else "❌ ВЫКЛ"
            message += f"\n{status_emoji} {config.get('display_name', log_type)}"
        
        message += f"""

🔧 <b>Управление логами:</b>
/toggle <ТИП> on/off - Включить/выключить конкретный тип лога
/toggle_all on/off - Включить/выключить все логи

💡 <b>Примеры:</b>
/toggle VISITOR off - Выключить логирование посетителей
/toggle_all on - Включить все логи

📊 <b>Текущий статус:</b>
Используйте /check <ТИП> для проверки статуса конкретного типа лога.
        """
        
        await self.send_message(message.strip(), str(chat_id))
    
    async def notify_user_login(self, user_email: str, ip_address: str, user_agent: str = ""):
        if not log_settings_manager.is_log_enabled("USER_LOGIN", 0):
            return
            
        message = f"""
🔐 <b>Вход пользователя</b>
📧 Email: {user_email}
🌐 IP: {ip_address}
🖥️ Время: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        """
        
        await self.send_to_admins(message.strip())
    
    async def notify_visitor(self, ip: str, user_agent: str, device_info: dict, path: str):
        if not log_settings_manager.is_log_enabled("VISITOR", 0):
            return
            
        device_emoji = "📱" if device_info.get('is_mobile') else "💻"
        
        message = f"""
{device_emoji} <b>Новый посетитель на сайте</b>
🌐 IP адрес: {ip}
💻 Устройство: {device_info.get('type', 'Unknown')}
🌍 Браузер: {device_info.get('browser', 'Unknown')}
🖥️ ОС: {device_info.get('os', 'Unknown')}
🔗 Страница: {path}
⏰ Время: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        """
        
        await self.send_to_admins(message.strip())
    
    async def notify_balance_update(self, user_email: str, old_balance: float, new_balance: float, amount: float):
        if not log_settings_manager.is_log_enabled("BALANCE_UPDATE", 0):
            return
            
        message = f"""
💰 <b>Пополнение баланса</b>
📧 Email: {user_email}
💵 Сумма: +${amount:.2f}
💵 Старый баланс: ${old_balance:.2f}
💵 Новый баланс: ${new_balance:.2f}
⏰ Время: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        """
        
        await self.send_to_admins(message.strip())
    
    async def notify_important_action(self, action_type: str, description: str, user_email: str = ""):
        if not log_settings_manager.is_log_enabled("IMPORTANT_ACTION", 0):
            return
            
        message = f"""
⚠️ <b>Важное действие</b>
📋 Тип: {action_type}
📝 Описание: {description}
📧 Email: {user_email}
⏰ Время: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        """
        
        await self.send_to_admins(message.strip())
    
    async def notify_postback_received(self, event_type: str, user_email: str, trader_id: str = "", amount: float = 0.0):
        from .log_settings_manager import log_settings_manager
        
        if not log_settings_manager.is_log_enabled("POSTBACK_RECEIVED", 0):
            return
        
        if event_type in ["REG", "POSTBACK_REG"]:
            message = f"""
🔄 <b>Новая регистрация в Pocket Option</b>

📧 Email: {user_email}
👤 Trader ID: {trader_id or 'Новый пользователь'}
⏰ Время: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            """
        elif event_type in ["FTD", "POSTBACK_FTD"]:
            message = f"""
🎉 <b>Первый депозит (FTD)!</b>

📧 Email: {user_email}
💰 Сумма: ${amount:.2f}
👤 Trader ID: {trader_id}
⏰ Время: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            """
        elif event_type in ["DEP", "POSTBACK_DEP"]:
            message = f"""
💰 <b>Повторный депозит</b>

📧 Email: {user_email}
💰 Сумма: ${amount:.2f}
👤 Trader ID: {trader_id}
⏰ Время: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            """
        elif event_type in ["WDR", "POSTBACK_WDR"]:
            message = f"""
💸 <b>Вывод средств</b>

📧 Email: {user_email}
💰 Сумма: ${amount:.2f}
👤 Trader ID: {trader_id}
⏰ Время: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            """
        elif event_type in ["COMMISSION", "POSTBACK_COMMISSION"]:
            message = f"""
💵 <b>Комиссия получена</b>

📧 Email: {user_email}
💰 Сумма: ${amount:.2f}
👤 Trader ID: {trader_id}
⏰ Время: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            """
        else:
            message = f"""
📡 <b>Постбэк получен</b>

📧 Email: {user_email}
🔧 Тип: {event_type}
💰 Сумма: ${amount:.2f if amount else '0.00'}
👤 Trader ID: {trader_id}
⏰ Время: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            """
        
        await self.send_to_admins(message.strip())
    
    async def send_to_admins(self, message: str):
        """Отправить сообщение всем администраторам"""
        admin_ids = admin_manager.load_admins()
        for admin_id in admin_ids:
            await self.send_message(message, admin_id)

telegram_bot = TelegramBot()
