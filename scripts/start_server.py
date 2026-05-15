#!/usr/bin/env python3
"""Small static file server for the site."""

from __future__ import annotations

import argparse
import functools
import threading
import webbrowser
from http.server import SimpleHTTPRequestHandler
from pathlib import Path
from socketserver import ThreadingTCPServer


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Start a local static file server.")
    parser.add_argument("--root", default=".", help="Root directory to serve.")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind to.")
    parser.add_argument(
        "--host",
        default="127.0.0.1",
        help="Host to bind to. Defaults to localhost.",
    )
    parser.add_argument(
        "--open-path",
        default="/",
        help="Path to open in the browser after the server starts.",
    )
    parser.add_argument(
        "--no-open",
        action="store_true",
        help="Do not open a browser window automatically.",
    )
    return parser.parse_args()


def normalize_open_path(path: str) -> str:
    if not path.startswith("/"):
        return f"/{path}"
    return path


def main() -> int:
    args = parse_args()
    root = Path(args.root).resolve()

    if not root.exists():
        raise SystemExit(f"Root directory does not exist: {root}")

    handler = functools.partial(SimpleHTTPRequestHandler, directory=str(root))
    url = f"http://{args.host}:{args.port}{normalize_open_path(args.open_path)}"

    class Server(ThreadingTCPServer):
        allow_reuse_address = True

    with Server((args.host, args.port), handler) as httpd:
        print(f"Serving {root}")
        print(f"Open: {url}")

        if not args.no_open:
            threading.Timer(0.5, webbrowser.open, args=[url]).start()

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopping server...")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
