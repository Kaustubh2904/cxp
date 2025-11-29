#!/usr/bin/env python3
"""
Frontend Server for Company Exam Portal
Simple HTTP server to serve static frontend files
"""

import http.server
import socketserver
import os
import sys

PORT = 3001
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Add CORS headers for development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

if __name__ == "__main__":
    os.chdir(DIRECTORY)
    
    with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
        print("=" * 60)
        print("🌐 Company Exam Portal - Frontend Server")
        print("=" * 60)
        print(f"📂 Serving directory: {DIRECTORY}")
        print(f"🚀 Frontend URL: http://localhost:{PORT}")
        print(f"🏠 Home Page: http://localhost:{PORT}/index.html")
        print(f"👨‍💼 Admin Login: http://localhost:{PORT}/admin-login.html")
        print(f"🏢 Company Login: http://localhost:{PORT}/company-login.html")
        print("=" * 60)
        print("⚠️  Make sure backend is running on http://localhost:8000")
        print("🛑 Press Ctrl+C to stop the server")
        print("=" * 60)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n👋 Shutting down server...")
            sys.exit(0)
