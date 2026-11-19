#!/usr/bin/env python3
"""
DemandIQ Smart Restock - Integrated Server & REST API
Serves both the 3D visual landing page and the full PRD REST API.
Runs out-of-the-box with standard Python 3.11/3.12 without external dependencies!
"""

import http.server
import socketserver
import os
import sys
import json
from urllib.parse import urlparse, parse_qs

# Add project root to sys.path
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
if PROJECT_DIR not in sys.path:
    sys.path.insert(0, PROJECT_DIR)

from demandiq.db import init_db
from demandiq.routes.api import handle_api_request

PORT = 3000

class DemandIQRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PROJECT_DIR, **kwargs)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path.startswith("/api/") or path == "/health":
            query_params = parse_qs(parsed.query)
            status, res, *mime = handle_api_request("GET", path, query_params, None, self.headers)
            content_type = mime[0] if mime else "application/json; charset=utf-8"
            self.send_response(status)
            self.send_header("Content-Type", content_type)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            if isinstance(res, (dict, list)):
                self.wfile.write(json.dumps(res, ensure_ascii=False).encode("utf-8"))
            else:
                self.wfile.write(res.encode("utf-8"))
            return

        super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path.startswith("/api/"):
            content_length = int(self.headers.get("Content-Length", 0))
            body_bytes = self.rfile.read(content_length) if content_length > 0 else b""
            query_params = parse_qs(parsed.query)

            status, res, *mime = handle_api_request("POST", path, query_params, body_bytes, self.headers)
            content_type = mime[0] if mime else "application/json; charset=utf-8"
            self.send_response(status)
            self.send_header("Content-Type", content_type)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            if isinstance(res, (dict, list)):
                self.wfile.write(json.dumps(res, ensure_ascii=False).encode("utf-8"))
            else:
                self.wfile.write(res.encode("utf-8"))
            return

        self.send_error(404, "Not Found")

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, must-revalidate')
        super().end_headers()

def main():
    print("Initializing DemandIQ SQLite database schema...")
    init_db()
    print("Database schema successfully verified.")

    os.chdir(PROJECT_DIR)
    chosen_port = PORT
    for attempt_port in (PORT, 3001, 8080, 8000):
        try:
            httpd = socketserver.TCPServer(("", attempt_port), DemandIQRequestHandler)
            chosen_port = attempt_port
            break
        except OSError:
            continue

    print("=" * 64)
    print(f" DemandIQ Smart Restock Server Running!")
    print(f" Landing Page & 3D Visual:  http://localhost:{chosen_port}/")
    print(f" API Health Check:         http://localhost:{chosen_port}/health")
    print(f" API Sample Generator:     POST http://localhost:{chosen_port}/api/datasets/sample")
    print(f" Working Directory:        {PROJECT_DIR}")
    print("=" * 64)
    print("Press Ctrl+C to terminate server.")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.shutdown()

if __name__ == "__main__":
    main()
