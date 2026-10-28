import logging
import secrets
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, FastAPI, Header, HTTPException, Query
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from starlette.exceptions import HTTPException as StarletteHTTPException

from . import config, services as svc
from .db import get_db

try:  # error de Postgres/PostgREST (por ejemplo, una foreign key que no existe)
    from postgrest.exceptions import APIError as DbError
except Exception:  # pragma: no cover
    DbError = ()

log = logging.getLogger("mundo-f1")

app = FastAPI(title="Mundo F1 API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=config.CORS_ORIGIN_REGEX,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


# ---------------------------------------------------------------- errores: siempre { "error": "..." }
@app.exception_handler(StarletteHTTPException)
async def http_error(_, exc: StarletteHTTPException):
    return JSONResponse({"error": str(exc.detail)}, status_code=exc.status_code)


@app.exception_handler(RequestValidationError)
async def validation_error(_, exc: RequestValidationError):
    first = exc.errors()[0] if exc.errors() else {}
    where = ".".join(str(p) for p in first.get("loc", []) if p != "query" and p != "body")
    return JSONResponse({"error": f'Parámetro inválido ({where}): {first.get("msg", "")}'}, status_code=422)


@app.exception_handler(svc.NotFound)
async def not_found(_, exc: svc.NotFound):
    return JSONResponse({"error": str(exc)}, status_code=404)


@app.exception_handler(svc.BadRequest)
async def bad_request(_, exc: svc.BadRequest):
    return JSONResponse({"error": str(exc)}, status_code=400)


@app.exception_handler(Exception)
async def unexpected(_, exc: Exception):
    log.exception("Error no controlado")
    return JSONResponse({"error": "Error interno del servidor"}, status_code=500)


# ---------------------------------------------------------------- helpers
def season_or_default(season: int | None) -> int:
    return season or config.DEFAULT_SEASON


Season = Query(None, ge=1950, le=2100, description="Temporada; si falta, usa DEFAULT_SEASON")


def require_admin(x_api_key: str | None = Header(default=None)):
    if not config.ADMIN_API_KEY:
        raise HTTPException(503, "ADMIN_API_KEY no está configurada en el servidor")
    if not x_api_key or not secrets.compare_digest(x_api_key.encode(), config.ADMIN_API_KEY.encode()):
        raise HTTPException(401, "API key inválida")


class ResultIn(BaseModel):
    driver_id: str
    team_id: str
    position: int | None = Field(default=None, ge=1)
    grid: int | None = Field(default=None, ge=0)
    points: float = Field(default=0, ge=0)
    status: Literal["finished", "DNF", "DSQ"] = "finished"
    fastest_lap: bool = False


class AdminResults(BaseModel):
    race_id: str
    results: list[ResultIn] = Field(min_length=1)


# ---------------------------------------------------------------- rutas
api = APIRouter(prefix="/api")


@api.get("/health")
def health():
    return {"ok": True}


@api.get("/home")
def home(season: int | None = Season, db=Depends(get_db)):
    return svc.get_home(db, season_or_default(season))


@api.get("/drivers")
def drivers(season: int | None = Season, db=Depends(get_db)):
    s = season_or_default(season)
    return {"season": s, "drivers": svc.get_drivers(db, s)}


@api.get("/drivers/{driver_id}")
def driver_detail(driver_id: str, season: int | None = Season, db=Depends(get_db)):
    detail = svc.get_driver_detail(db, season_or_default(season), driver_id)
    if detail is None:
        raise HTTPException(404, f"No existe el piloto '{driver_id}' en esa temporada")
    return detail


@api.get("/teams")
def teams(season: int | None = Season, db=Depends(get_db)):
    s = season_or_default(season)
    return {"season": s, "teams": svc.get_teams(db, s)}


@api.get("/circuits")
def circuits(db=Depends(get_db)):
    return {"circuits": svc.get_circuits(db)}


@api.get("/races")
def races(season: int | None = Season, db=Depends(get_db)):
    s = season_or_default(season)
    return {"season": s, "races": svc.get_races(db, s)}


@api.get("/races/next")
def next_race(season: int | None = Season, db=Depends(get_db)):
    race = svc.get_next_race(db, season_or_default(season))
    if race is None:
        raise HTTPException(404, "No quedan carreras por correr en esta temporada")
    return race


@api.get("/standings/drivers")
def standings_drivers(season: int | None = Season, db=Depends(get_db)):
    return svc.get_driver_standings(db, season_or_default(season))


@api.get("/standings/constructors")
def standings_constructors(season: int | None = Season, db=Depends(get_db)):
    return svc.get_constructor_standings(db, season_or_default(season))


@api.get("/search")
def search(q: str = Query("", max_length=60), season: int | None = Season, db=Depends(get_db)):
    return svc.search(db, season_or_default(season), q)


@api.post("/admin/results")
def admin_results(body: AdminResults, db=Depends(get_db), _: None = Depends(require_admin)):
    try:
        inserted = svc.save_results(db, body.race_id, [r.model_dump() for r in body.results])
    except DbError as e:
        raise HTTPException(400, getattr(e, "message", None) or str(e))
    return {"ok": True, "race_id": body.race_id, "inserted": inserted}


app.include_router(api)
