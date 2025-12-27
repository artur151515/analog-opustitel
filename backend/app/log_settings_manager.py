import json
import os
from typing import Dict, Any, List
from datetime import datetime

class LogSettingsManager:
    def __init__(self):
        self.settings_file = "/root/analog-opustitel/backend/app/log_settings.json"
        self.default_settings = {
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
            "POSTBACK_RECEIVED": {"enabled": True, "display_name": "Постбэк получен"},
            "POSTBACK_REG": {"enabled": True, "display_name": "Регистрация (постбэк)"},
            "POSTBACK_FTD": {"enabled": True, "display_name": "Первый депозит (постбэк)"},
            "POSTBACK_DEP": {"enabled": True, "display_name": "Депозит (постбэк)"},
            "POSTBACK_WDR": {"enabled": True, "display_name": "Вывод (постбэк)"},
            "POSTBACK_COMMISSION": {"enabled": True, "display_name": "Комиссия (постбэк)"}
        }
    
    def load_settings(self) -> Dict[str, Any]:
        try:
            if os.path.exists(self.settings_file):
                with open(self.settings_file, "r", encoding="utf-8") as f:
                    settings = json.load(f)
                    for log_type, default_config in self.default_settings.items():
                        if log_type not in settings:
                            settings[log_type] = default_config
                    return settings
            else:
                self.save_settings(self.default_settings)
                return self.default_settings.copy()
        except Exception as e:
            print(f"Error loading log settings: {e}")
            return self.default_settings.copy()
    
    def save_settings(self, settings: Dict[str, Any]) -> bool:
        try:
            with open(self.settings_file, "w", encoding="utf-8") as f:
                json.dump(settings, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"Error saving log settings: {e}")
            return False
    
    def is_log_enabled(self, log_type: str, admin_id: int = 0) -> bool:
        settings = self.load_settings()
        
        if admin_id:
            admin_settings = settings.get(f"admin_{admin_id}", {})
            return admin_settings.get(log_type, settings.get(log_type, {}).get("enabled", True))
        
        return settings.get(log_type, {}).get("enabled", True)
    
    def set_log_enabled(self, log_type: str, enabled: bool, admin_id: int = 0) -> bool:
        settings = self.load_settings()
        
        if admin_id:
            admin_key = f"admin_{admin_id}"
            if admin_key not in settings:
                settings[admin_key] = {}
            
            settings[admin_key][log_type] = {
                "enabled": enabled,
                "display_name": self.default_settings.get(log_type, {}).get("display_name", log_type)
            }
        else:
            settings[log_type] = {
                "enabled": enabled,
                "display_name": self.default_settings.get(log_type, {}).get("display_name", log_type)
            }
        
        return self.save_settings(settings)
    
    def get_all_settings(self) -> Dict[str, Any]:
        return self.load_settings()
    
    def get_log_types(self) -> List[Dict[str, str]]:
        settings = self.load_settings()
        return [
            {
                "type": log_type,
                "display_name": config.get("display_name", log_type),
                "enabled": config.get("enabled", True)
            }
            for log_type, config in self.default_settings.items()
        ]
    
    def toggle_all_logs(self, enabled: bool, admin_id: int = 0) -> bool:
        settings = self.load_settings()
        
        if admin_id:
            admin_key = f"admin_{admin_id}"
            settings[admin_key] = {}
            for log_type in self.default_settings.keys():
                settings[admin_key][log_type] = {
                    "enabled": enabled,
                    "display_name": self.default_settings[log_type]["display_name"]
                }
        else:
            for log_type in self.default_settings.keys():
                settings[log_type]["enabled"] = enabled
        
        return self.save_settings(settings)

log_settings_manager = LogSettingsManager()
