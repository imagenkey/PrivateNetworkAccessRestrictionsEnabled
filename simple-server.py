#!/usr/bin/env python3
"""
シンプルなHTTPサーバー - ローカルネットワークアクセステスト用
Microsoft Edge v138+ ローカルネットワークアクセス制御のテスト用サーバー

使用方法:
    python simple-server.py [ポート番号]
    
例:
    python simple-server.py 8080
    python simple-server.py 3000
"""

import http.server
import socketserver
import sys
import json
from datetime import datetime
import os

class SimpleTestHandler(http.server.SimpleHTTPRequestHandler):
    """シンプルなテスト用HTTPハンドラー"""
    
    def do_GET(self):
        """GET リクエストの処理"""
        
        # ログ出力
        client_ip = self.client_address[0]
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"[{timestamp}] GET {self.path} from {client_ip}")
        
        # CORS ヘッダーを追加
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        # レスポンスデータ
        response_data = {
            'status': 'success',
            'message': 'ローカルネットワークアクセステスト成功',
            'timestamp': timestamp,
            'client_ip': client_ip,
            'server_info': {
                'python_version': sys.version,
                'server': 'simple-test-server'
            },
            'request_info': {
                'path': self.path,
                'method': 'GET',
                'user_agent': self.headers.get('User-Agent', 'Unknown')
            }
        }
        
        # JSON レスポンスを送信
        self.wfile.write(json.dumps(response_data, ensure_ascii=False, indent=2).encode('utf-8'))
    
    def do_OPTIONS(self):
        """OPTIONS リクエストの処理（CORS プリフライト）"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def log_message(self, format, *args):
        """ログメッセージのカスタマイズ"""
        # デフォルトのログを無効化（独自のログを使用）
        pass

def start_server(port=8080):
    """サーバーを起動"""
    
    try:
        # サーバー設定
        handler = SimpleTestHandler
        httpd = socketserver.TCPServer(("", port), handler)
        
        print("=" * 60)
        print("🚀 ローカルネットワークアクセステスト用サーバー起動")
        print("=" * 60)
        print(f"📡 サーバーアドレス:")
        print(f"   • http://127.0.0.1:{port}")
        print(f"   • http://localhost:{port}")
        
        # ローカルIPアドレスも表示
        import socket
        try:
            hostname = socket.gethostname()
            local_ip = socket.gethostbyname(hostname)
            print(f"   • http://{local_ip}:{port}")
        except:
            pass
            
        print(f"📋 ポート: {port}")
        print(f"🕒 開始時刻: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()
        print("📖 使用方法:")
        print("   1. ブラウザで simple-test.html を開く")
        print("   2. URLに上記のアドレスを入力")
        print("   3. 「接続テスト実行」ボタンをクリック")
        print()
        print("⚠️  Microsoft Edge v138+ でダイアログが表示される場合があります")
        print("   edge://flags/#local-network-access-check を確認してください")
        print()
        print("🛑 停止: Ctrl+C")
        print("=" * 60)
        
        # サーバー開始
        httpd.serve_forever()
        
    except KeyboardInterrupt:
        print("\n")
        print("🛑 サーバーを停止しています...")
        httpd.shutdown()
        print("✅ サーバーが正常に停止しました")
        
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ エラー: ポート {port} は既に使用されています")
            print(f"   別のポートを試すか、既存のプロセスを停止してください")
            print(f"   例: python simple-server.py {port + 1}")
        else:
            print(f"❌ サーバー起動エラー: {e}")
        sys.exit(1)
        
    except Exception as e:
        print(f"❌ 予期しないエラー: {e}")
        sys.exit(1)

def main():
    """メイン関数"""
    
    # ポート番号の取得
    port = 8080  # デフォルト
    
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
            if port < 1 or port > 65535:
                raise ValueError("ポート番号は1-65535の範囲で指定してください")
        except ValueError as e:
            print(f"❌ 無効なポート番号: {sys.argv[1]}")
            print(f"   {e}")
            print()
            print("使用方法:")
            print("   python simple-server.py [ポート番号]")
            print("   例: python simple-server.py 8080")
            sys.exit(1)
    
    # サーバー起動
    start_server(port)

if __name__ == "__main__":
    main()
