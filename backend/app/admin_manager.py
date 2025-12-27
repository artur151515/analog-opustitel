import json
import os
import asyncio
from typing import List, Optional
from datetime import datetime


class AdminManager:
    def __init__(self):
        self.admin_file = "/app/admin.json"
        self.admin_password = "GLEB"
        self.pending_auth = {}
        
    def load_admins(self) -> List[int]:
        try:
            if os.path.exists(self.admin_file):
                with open(self.admin_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return data.get('admin_ids', [])
            return []
        except Exception as e:
            print(f"Error loading admins: {e}")
            return []
    
    def save_admins(self, admin_ids: List[int]):
        try:
            data = {'admin_ids': admin_ids}
            with open(self.admin_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"Error saving admins: {e}")
            return False
    
    def is_admin(self, user_id: int) -> bool:
        return user_id in self.load_admins()
    
    def add_admin(self, user_id: int) -> bool:
        admin_ids = self.load_admins()
        if user_id not in admin_ids:
            admin_ids.append(user_id)
            return self.save_admins(admin_ids)
        return True
    
    def remove_admin(self, user_id: int) -> bool:
        admin_ids = self.load_admins()
        if user_id in admin_ids:
            admin_ids.remove(user_id)
            return self.save_admins(admin_ids)
        return True
    
    def start_auth_process(self, user_id: int) -> bool:
        if self.is_admin(user_id):
            return True
        
        self.pending_auth[user_id] = {
            'started_at': datetime.now(),
            'attempts': 0
        }
        return False
    
    def check_password(self, user_id: int, password: str) -> bool:
        print(f"DEBUG: Checking password for user {user_id}: '{password}' == '{self.admin_password}'")
        if password == self.admin_password:
            if self.add_admin(user_id):
                if user_id in self.pending_auth:
                    del self.pending_auth[user_id]
                print(f"DEBUG: User {user_id} successfully added as admin")
                return True
        print(f"DEBUG: Password check failed for user {user_id}")
        return False
    
    def get_pending_auth(self, user_id: int) -> Optional[dict]:
        return self.pending_auth.get(user_id)
    
    def cleanup_pending(self):
        current_time = datetime.now()
        to_remove = []
        
        for user_id, auth_data in self.pending_auth.items():
            if (current_time - auth_data['started_at']).seconds > 600:
                to_remove.append(user_id)
        
        for user_id in to_remove:
            del self.pending_auth[user_id]


admin_manager = AdminManager()