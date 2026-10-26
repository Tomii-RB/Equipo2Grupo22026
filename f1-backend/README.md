# Mundo F1 · Backend (FastAPI + Supabase)

API REST en JSON que implementa el contrato del documento "Mundo F1 — Reparto backend / frontend".
Lee las vistas de Supabase (`v_races_status`, `v_drivers_season`, `v_driver_standings`, `v_constructor_standings`)
creadas con `mundo_f1_schema.sql` (v2).

## 1. Puesta en marcha

1. Corré `mundo_f1_schema.sql` completo en el SQL Editor de Supabase.
2. Creá el entorno e instalá las dependencias:
   ```bash
   python -m venv .venv
   source .venv/bin/activate        # en Windows: .venv\Scripts\activate
   python -m pip install --upgrade pip
   python -m pip install -r requirements.txt
   ```
   Usá Python 3.10 a 3.12 (`python --version`). Si falla, mirá la sección "Si no instala" más abajo.
3. Copiá `.env.example` como `.env` y completá:
   - `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` (Project Settings > API). La service_role es secreta: nunca va al front ni al repo.
   - `ADMIN_API_KEY`: inventá una clave larga; es la que vas a usar para cargar resultados.
4. Levantá el servidor:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
5. Probalo en el navegador: `http://localhost:8000/api/health`, `http://localhost:8000/api/races` y la documentación automática en `http://localhost:8000/docs`.

## 2. Endpoints

| Método | Ruta | Notas |
|---|---|---|
| GET | `/api/home` | `season`, `next_race`, `driver_standings` (top 5), `constructor_standings` (top 4), `featured_drivers` (4), `featured_teams` (4), `upcoming_races` (6), `featured_circuits` (3) |
| GET | `/api/drivers?season=` | `{ season, drivers }` |
| GET | `/api/drivers/{id}` | piloto + `season_results` |
| GET | `/api/teams?season=` | `{ season, teams }` |
| GET | `/api/circuits` | `{ circuits }` |
| GET | `/api/races?season=` | `{ season, races }` con `status` completed / live / next / upcoming |
| GET | `/api/races/next` | una carrera + `starts_at` y `seconds_until_start`; 404 si no queda ninguna |
| GET | `/api/standings/drivers?season=` | completo, con `after_round` y `total_rounds` |
| GET | `/api/standings/constructors?season=` | idem |
| GET | `/api/search?q=` | `{ results: [{ type, id, label, subtitle, url }] }` |
| POST | `/api/admin/results` | header `X-API-Key`; reemplaza los resultados de una carrera |

Los errores siempre vienen como `{ "error": "mensaje" }`. Las imágenes se sirven desde `/static/images/{drivers,teams,circuits}/`
(guardá en la base rutas como `/static/images/drivers/antonelli.webp`).

## 3. Cargar los resultados de una carrera

```bash
curl -X POST http://localhost:8000/api/admin/results \
  -H "Content-Type: application/json" \
  -H "X-API-Key: TU_ADMIN_API_KEY" \
  -d '{
    "race_id": "2026-japon",
    "results": [
      {"driver_id": "antonelli", "team_id": "mercedes", "position": 1, "grid": 1, "points": 25},
      {"driver_id": "russell",   "team_id": "mercedes", "position": 2, "grid": 2, "points": 18}
    ]
  }'
```

Las clasificaciones, el estado de las carreras y el ganador se recalculan solos. Los `driver_id`, `team_id` y `race_id` tienen que existir en la base (si no, devuelve 400).
Antes de cargar los reales, borrá los resultados de prueba del seed:
`delete from results where race_id in ('2026-australia','2026-china');`

## 4. Mocks para Tom

Con la API conectada a Supabase y el seed cargado:

```bash
python scripts/export_mocks.py
```

Genera `mocks/*.json` con las respuestas reales (`home`, `drivers`, `teams`, `circuits`, `races`, `races-next`, `standings-drivers`, `standings-constructors`).
Pasale esa carpeta a Tom.

## 5. Pruebas

```bash
python tests/test_services.py     # no necesita instalar nada más
# opcional: pip install -r requirements-dev.txt  y después  pytest
```

Prueban la lógica de cada endpoint contra una base falsa en memoria (formato del contrato, estado `live`, `seconds_until_start`, búsqueda y carga de resultados).

## 6. Decisiones del contrato (resueltas)

- La respuesta no tiene wrapper `data`: `season` va en el nivel superior (`{ "season": 2026, "races": [...] }`).
- `status` tiene 4 valores: completed, live, next, upcoming.

## 7. Si no instala

1. Fijate que estés parado en la carpeta `f1-backend` (donde está `requirements.txt`) y con el entorno activado (`(.venv)` al principio de la línea).
2. Revisá la versión: `python --version`. Tiene que ser 3.10 o más; si tenés 3.13 o 3.14, instalá 3.12 y creá el entorno de nuevo (algunas librerías todavía no traen versión precompilada y piden compilar).
3. Actualizá pip y reintentá: `python -m pip install --upgrade pip` y después `python -m pip install -r requirements.txt`.
4. Si el error menciona `Microsoft Visual C++` o `Rust`, es por la versión de Python (paso 2).
