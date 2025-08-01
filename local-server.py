#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LocalNetworkAccessRestrictionsEnabled テスト用ローカルHTTPサーバー

このスクリプトは、ローカルネットワークアクセステストの対象となる
簡易HTTPサーバーを起動します。
"""

import http.server
import socketserver
import json
import urllib.parse
from datetime import datetime
import threading
import time

class TestHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        """GET要求の処理"""
        
        # アクセスログの記録
        client_ip = self.client_address[0]
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] GET要求: {self.path} from {client_ip}")
        
        # CORS ヘッダーの設定
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        # 応答データの生成
        response_data = {
            "status": "success",
            "message": "LocalNetworkAccessRestrictionsEnabled テストサーバー",
            "timestamp": timestamp,
            "client_ip": client_ip,
            "requested_path": self.path,
            "server_info": {
                "name": "Test HTTP Server",
                "version": "1.0.0",
                "purpose": "Microsoft Edge ポリシーテスト用"
            },
            "test_info": {
                "policy": "LocalNetworkAccessRestrictionsEnabled",
                "description": "ローカルネットワークアクセス制限テスト",
                "expected_behavior": {
                    "policy_enabled": "この要求はブロックされるべき",
                    "policy_disabled": "この要求は成功し、この応答が表示される"
                }
            }
        }
        
        # JSONレスポンスの送信
        json_response = json.dumps(response_data, ensure_ascii=False, indent=2)
        self.wfile.write(json_response.encode('utf-8'))
    
    def do_POST(self):
        """POST要求の処理"""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        client_ip = self.client_address[0]
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] POST要求: {self.path} from {client_ip}")
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        response_data = {
            "status": "success",
            "message": "POST要求を受信しました",
            "timestamp": timestamp,
            "client_ip": client_ip,
            "received_data": post_data.decode('utf-8', errors='ignore')
        }
        
        json_response = json.dumps(response_data, ensure_ascii=False, indent=2)
        self.wfile.write(json_response.encode('utf-8'))
    
    def do_OPTIONS(self):
        """プリフライト要求の処理"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def log_message(self, format, *args):
        """ログメッセージの抑制（独自のログ出力を使用）"""
        pass

def start_server(port=8080):
    """HTTPサーバーの起動"""
    try:
        with socketserver.TCPServer(("", port), TestHTTPRequestHandler) as httpd:
            print(f"\n=== LocalNetworkAccessRestrictionsEnabled テストサーバー ===")
            print(f"サーバーポート: {port}")
            print(f"開始時刻: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"アクセスURL例:")
            print(f"  - http://localhost:{port}")
            print(f"  - http://127.0.0.1:{port}")
            print(f"  - http://192.168.1.1:{port} (ローカルIPに応じて調整)")
            print(f"\nサーバーを停止するには Ctrl+C を押してください。")
            print(f"{'='*60}")
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print(f"\n\nサーバーを停止しています...")
        print(f"停止時刻: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    except OSError as e:
        if e.errno == 10048:  # Windows: Address already in use
            print(f"エラー: ポート {port} は既に使用されています。")
            print(f"別のポートを試すか、既存のサービスを停止してください。")
        else:
            print(f"サーバー起動エラー: {e}")

def start_multiple_servers():
    """複数ポートでのサーバー起動"""
    ports = [8080, 8000, 3000, 5000]
    threads = []
    
    print("複数ポートでテストサーバーを起動しています...")
    
    for port in ports:
        def create_server_thread(p):
            return threading.Thread(
                target=start_server, 
                args=(p,), 
                daemon=True, 
                name=f"TestServer-{p}"
            )
        
        thread = create_server_thread(port)
        threads.append(thread)
        
        try:
            thread.start()
            print(f"✅ ポート {port} でサーバー起動")
            time.sleep(0.1)  # 起動間隔
        except Exception as e:
            print(f"❌ ポート {port} でサーバー起動失敗: {e}")
    
    print(f"\n{len([t for t in threads if t.is_alive()])} 個のサーバーが起動中")
    print("メインサーバーを停止するには Ctrl+C を押してください。")
    
    try:
        # メインスレッドを維持
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n全サーバーを停止しています...")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "--multiple":
            start_multiple_servers()
        else:
            try:
                port = int(sys.argv[1])
                start_server(port)
            except ValueError:
                print("使用方法: python local-server.py [ポート番号] または python local-server.py --multiple")
                sys.exit(1)
    else:
        start_server()
