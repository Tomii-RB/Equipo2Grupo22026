"""Genera mocks/*.json con las respuestas REALES de tu API (leyendo Supabase).
Uso:  python scripts/export_mocks.py
Después pasale la carpeta mocks/ a Tom."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

ENDPOINTS = {
    "home": "/api/home",
    "drivers": "/api/drivers",
    "teams": "/api/teams",
    "circuits": "/api/circuits",
    "races": "/api/races",
    "races-next": "/api/races/next",
    "standings-drivers": "/api/standings/drivers",
    "standings-constructors": "/api/standings/constructors",
}

out_dir = ROOT / "mocks"
out_dir.mkdir(exist_ok=True)
client = TestClient(app)
for name, path in ENDPOINTS.items():
    r = client.get(path)
    if r.status_code != 200:
        print(f"[SALTEADO] {path} -> {r.status_code} {r.text}")
        continue
    (out_dir / f"{name}.json").write_text(json.dumps(r.json(), ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[OK] mocks/{name}.json")
