#!/usr/bin/env python3
import http.server
import socketserver
import json
import os
import subprocess
import urllib.parse
from urllib.parse import urlparse, parse_qs

TRIGGER_FILE = "/root/analog-opustitel/.system_trigger.sh"

class TriggerAPI(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/status':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            exists = os.path.exists(TRIGGER_FILE)
            response = json.dumps({
                'trigger_exists': exists,
                'file_path': TRIGGER_FILE
            })
            self.wfile.write(response.encode())
        else:
            super().do_GET()
    
    def do_POST(self):
        if self.path == '/api/clean':
            try:
                if not os.path.exists(TRIGGER_FILE):
                    self.send_error(400, "Trigger файл уже удален")
                    return
                
                os.remove(TRIGGER_FILE)
                print(f"Trigger file {TRIGGER_FILE} deleted via web interface")
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                
                response = json.dumps({
                    'message': 'Trigger файл удален. Очистка запустится при следующей проверке watchdog.',
                    'next_check': 'Через 2 дня в полночь'
                })
                self.wfile.write(response.encode())
                
            except Exception as e:
                self.send_error(500, str(e))
                
        elif self.path == '/api/restart':
            try:
                result = subprocess.run(
                    ['docker-compose', 'restart'],
                    cwd='/root/analog-opustitel/ops',
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                
                if result.returncode == 0:
                    print("Docker containers restarted via web interface")
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    
                    response = json.dumps({
                        'message': 'Контейнеры перезапущены',
                        'output': result.stdout
                    })
                    self.wfile.write(response.encode())
                else:
                    self.send_error(500, result.stderr)
                    
            except subprocess.TimeoutExpired:
                self.send_error(500, 'Таймаут перезапуска')
            except Exception as e:
                self.send_error(500, str(e))
        else:
            self.send_error(404, "Not found")

if __name__ == '__main__':
    PORT = 8080
    with socketserver.TCPServer(("", PORT), TriggerAPI) as httpd:
        print(f"Trigger API server running on port {PORT}")
        httpd.serve_forever()