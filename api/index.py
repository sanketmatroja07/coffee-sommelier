import sys
from pathlib import Path
from urllib.parse import parse_qsl, urlencode


PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = PROJECT_ROOT / "backend"

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.main import app as backend_app


class VercelApiRouter:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            adapted_scope = dict(scope)
            query_items = parse_qsl(adapted_scope.get("query_string", b"").decode(), keep_blank_values=True)
            route = None
            forwarded_query = []
            for key, value in query_items:
                if key == "route" and route is None:
                    route = value
                else:
                    forwarded_query.append((key, value))

            if route:
                adapted_scope["path"] = route
                adapted_scope["query_string"] = urlencode(forwarded_query, doseq=True).encode()

            path = adapted_scope.get("path", "")
            if path.startswith("/api/") and not path.startswith("/api/v1"):
                trimmed = path[4:]
                adapted_scope["path"] = trimmed or "/"

            scope = adapted_scope

        await self.app(scope, receive, send)


app = VercelApiRouter(backend_app)
