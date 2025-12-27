import time
import asyncio
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from app.activity_logger import log_visitor
from datetime import datetime
import re


class VisitorLoggingMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.visitor_cache = {}
        self.cache_timeout = 300

    async def dispatch(self, request: Request, call_next):
        client_ip = self.get_client_ip(request)
        user_agent = request.headers.get("user-agent", "")
        
        # Skip logging for health checks and monitoring
        if request.url.path in ['/health', '/api/health'] or 'health-check' in user_agent.lower():
            response = await call_next(request)
            return response
        
        print(f"MIDDLEWARE DEBUG: Processing {request.method} {request.url.path} from {client_ip}")
        
        device_info = self.parse_device_info(user_agent)
        
        visitor_key = f"{client_ip}:{hash(user_agent) % 10000}"
        current_time = time.time()
        
        if visitor_key not in self.visitor_cache or \
           current_time - self.visitor_cache[visitor_key]['last_seen'] > self.cache_timeout:
            
            print(f"MIDDLEWARE DEBUG: New visitor detected - {visitor_key}")
            await log_visitor(client_ip, user_agent, device_info, request.url.path)
            
            self.visitor_cache[visitor_key] = {
                'last_seen': current_time,
                'count': self.visitor_cache.get(visitor_key, {}).get('count', 0) + 1
            }
        else:
            print(f"MIDDLEWARE DEBUG: Visitor cached - {visitor_key}")
        
        response = await call_next(request)
        return response
    
    def get_client_ip(self, request: Request) -> str:
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"
    
    def parse_device_info(self, user_agent: str) -> dict:
        device_info = {
            'type': 'Unknown',
            'browser': 'Unknown',
            'os': 'Unknown',
            'is_mobile': False
        }
        
        user_agent_lower = user_agent.lower()
        
        if any(mobile in user_agent_lower for mobile in ['mobile', 'android', 'iphone', 'ipad', 'ipod']):
            device_info['is_mobile'] = True
            device_info['type'] = 'Mobile'
            if 'tablet' in user_agent_lower or 'ipad' in user_agent_lower:
                device_info['type'] = 'Tablet'
        elif any(desktop in user_agent_lower for desktop in ['windows', 'macintosh', 'linux', 'ubuntu']):
            device_info['type'] = 'Desktop'
        
        browsers = {
            'chrome': 'Chrome',
            'firefox': 'Firefox',
            'safari': 'Safari',
            'edge': 'Edge',
            'opera': 'Opera',
            'yandex': 'Yandex Browser'
        }
        
        for browser_key, browser_name in browsers.items():
            if browser_key in user_agent_lower:
                device_info['browser'] = browser_name
                break
        
        os_patterns = {
            'windows': 'Windows',
            'mac os': 'macOS',
            'macintosh': 'macOS',
            'linux': 'Linux',
            'ubuntu': 'Ubuntu',
            'android': 'Android',
            'ios': 'iOS',
            'iphone': 'iOS',
            'ipad': 'iOS'
        }
        
        for os_key, os_name in os_patterns.items():
            if os_key in user_agent_lower:
                device_info['os'] = os_name
                break
        
        return device_info