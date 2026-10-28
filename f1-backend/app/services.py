"""Lógica de los endpoints. Cada función recibe `db` (cliente de Supabase) y devuelve
dicts con el formato exacto del contrato. No importa FastAPI, así se puede probar sola."""
from __future__ import annotations

import re
from datetime import datetime, timezone

try:
    from .utils import iso_utc, num, parse_dt
except ImportError:
    from utils import iso_utc, num, parse_dt


class NotFound(Exception):
    pass


class BadRequest(Exception):
    pass


def _rows(query):
    return query.execute().data or []


# ----------------------------------------------------------------- carreras
def _race(r: dict, sessions: list) -> dict:
    winner = None
    if r.get("status") == "completed" and r.get("winner_driver_id"):
        winner = {"driver_id": r["winner_driver_id"], "name": r.get("winner_name")}
    return {
        "id": r["id"],
        "round": r["round"],
        "name": r["name"],
        "official_name": r.get("official_name"),
        "circuit_id": r.get("circuit_id"),
        "circuit_name": r.get("circuit_name"),
        "city": r.get("city"),
        "country": r.get("country"),
        "date_start": r.get("date_start"),
        "date_end": r.get("date_end"),
        "status": r["status"],
        "winner": winner,
        "sessions": sessions,
    }


def get_races(db, season: int) -> list[dict]:
    rows = _rows(db.table("v_races_status").select("*").eq("season", season).order("round"))
    ids = [r["id"] for r in rows]
    by_race: dict[str, list] = {}
    if ids:
        for s in _rows(db.table("sessions").select("race_id,type,starts_at").in_("race_id", ids).order("starts_at")):
            by_race.setdefault(s["race_id"], []).append({"type": s["type"], "starts_at": iso_utc(s["starts_at"])})
    for lst in by_race.values():
        lst.sort(key=lambda s: s["starts_at"])
    return [_race(r, by_race.get(r["id"], [])) for r in rows]


def pick_next(races: list[dict], now: datetime | None = None) -> dict | None:
    """La carrera en vivo; si no hay, la próxima. Agrega starts_at y seconds_until_start."""
    now = now or datetime.now(timezone.utc)
    race = next((r for r in races if r["status"] == "live"), None) or next(
        (r for r in races if r["status"] == "next"), None
    )
    if race is None:
        return None
    if race["sessions"]:
        start = race["sessions"][0]["starts_at"]
    elif race.get("date_start"):
        start = f'{race["date_start"]}T00:00:00Z'
    else:
        start = None
    seconds = max(0, int((parse_dt(start) - now).total_seconds())) if start else 0
    return {**race, "starts_at": start, "seconds_until_start": seconds}


def get_next_race(db, season: int, now: datetime | None = None) -> dict | None:
    return pick_next(get_races(db, season), now)


# ----------------------------------------------------------------- pilotos
def _driver(r: dict) -> dict:
    return {
        "id": r["id"],
        "number": r.get("number"),
        "first_name": r["first_name"],
        "last_name": r["last_name"],
        "code": r.get("code"),
        "country_code": r.get("country_code"),
        "team_id": r.get("team_id"),
        "team_name": r.get("team_name"),
        "team_color_hex": r.get("team_color_hex"),
        "bio": r.get("bio"),
        "wins": num(r.get("wins")) or 0,
        "podiums": num(r.get("podiums")) or 0,
        "championship_position": r.get("championship_position"),
        "points": num(r.get("points")) or 0,
        "photo_url": r.get("photo_url"),
    }


def get_drivers(db, season: int) -> list[dict]:
    drivers = [_driver(r) for r in _rows(db.table("v_drivers_season").select("*").eq("season", season))]
    drivers.sort(
        key=lambda d: (
            d["championship_position"] is None,
            d["championship_position"] or 0,
            d["number"] is None,
            d["number"] or 0,
            d["last_name"],
        )
    )
    return drivers


def get_driver_detail(db, season: int, driver_id: str) -> dict | None:
    rows = _rows(db.table("v_drivers_season").select("*").eq("season", season).eq("id", driver_id))
    if not rows:
        return None
    races = {r["id"]: r for r in _rows(db.table("races").select("id,round,name").eq("season", season))}
    results = _rows(db.table("results").select("race_id,position,grid,points,status").eq("driver_id", driver_id))
    season_results = [
        {
            "race_id": r["race_id"],
            "round": races[r["race_id"]]["round"],
            "race_name": races[r["race_id"]]["name"],
            "position": r.get("position"),
            "grid": r.get("grid"),
            "points": num(r.get("points")) or 0,
            "status": r.get("status"),
        }
        for r in results
        if r["race_id"] in races
    ]
    season_results.sort(key=lambda r: r["round"])
    return {**_driver(rows[0]), "season_results": season_results}


# ----------------------------------------------------------------- equipos
def get_teams(db, season: int) -> list[dict]:
    seasons = _rows(
        db.table("driver_seasons").select("team_id,driver_id,drivers(first_name,last_name)").eq("season", season)
    )
    by_team: dict[str, list[tuple[str, str]]] = {}
    for r in seasons:
        d = r.get("drivers") or {}
        full = f'{d.get("first_name", "")} {d.get("last_name", "")}'.strip()
        by_team.setdefault(r["team_id"], []).append((r["driver_id"], full))
    if not by_team:
        return []
    teams = _rows(db.table("teams").select("*").in_("id", list(by_team)))
    standings = {r["team_id"]: r for r in _rows(db.table("v_constructor_standings").select("*").eq("season", season))}
    out = []
    for t in teams:
        s = standings.get(t["id"])
        members = by_team[t["id"]]
        out.append(
            {
                "id": t["id"],
                "name": t["name"],
                "full_name": t.get("full_name"),
                "headquarters": t.get("headquarters"),
                "team_principal": t.get("team_principal"),
                "description": t.get("description"),
                "color_hex": t.get("color_hex"),
                "logo_url": t.get("logo_url"),
                "driver_ids": [m[0] for m in members],
                "drivers": [m[1] for m in members],
                "championship_position": s["position"] if s else None,
                "points": num(s["points"]) if s else 0,
            }
        )
    out.sort(key=lambda t: (t["championship_position"] is None, t["championship_position"] or 0, t["name"]))
    return out


# ----------------------------------------------------------------- circuitos
def get_circuits(db) -> list[dict]:
    return [
        {
            "id": c["id"],
            "name": c["name"],
            "short_name": c.get("short_name"),
            "country": c.get("country"),
            "city": c.get("city"),
            "length_km": num(c.get("length_km")),
            "laps": c.get("laps"),
            "race_distance_km": num(c.get("race_distance_km")),
            "lap_record": c.get("lap_record"),
            "description": c.get("description"),
            "image_url": c.get("image_url"),
        }
        for c in _rows(db.table("circuits").select("*").order("name"))
    ]


# ----------------------------------------------------------------- clasificaciones
def _season_meta(db, season: int, rows: list[dict]) -> tuple[int, int]:
    if rows:
        return rows[0].get("after_round") or 0, rows[0].get("total_rounds") or 0
    return 0, len(_rows(db.table("races").select("id").eq("season", season)))


def get_driver_standings(db, season: int) -> dict:
    rows = _rows(db.table("v_driver_standings").select("*").eq("season", season).order("position"))
    after_round, total_rounds = _season_meta(db, season, rows)
    return {
        "season": season,
        "after_round": after_round,
        "total_rounds": total_rounds,
        "standings": [
            {
                "position": r["position"],
                "driver_id": r["driver_id"],
                "driver_name": r["driver_name"],
                "team_id": r.get("team_id"),
                "team_name": r.get("team_name"),
                "team_color_hex": r.get("team_color_hex"),
                "points": num(r["points"]),
                "wins": r.get("wins") or 0,
            }
            for r in rows
        ],
    }


def get_constructor_standings(db, season: int) -> dict:
    rows = _rows(db.table("v_constructor_standings").select("*").eq("season", season).order("position"))
    after_round, total_rounds = _season_meta(db, season, rows)
    return {
        "season": season,
        "after_round": after_round,
        "total_rounds": total_rounds,
        "standings": [
            {
                "position": r["position"],
                "team_id": r["team_id"],
                "team_name": r["team_name"],
                "team_color_hex": r.get("team_color_hex"),
                "points": num(r["points"]),
                "wins": r.get("wins") or 0,
            }
            for r in rows
        ],
    }


# ----------------------------------------------------------------- home
def get_home(db, season: int, now: datetime | None = None) -> dict:
    races = get_races(db, season)
    drivers = get_drivers(db, season)
    teams = get_teams(db, season)
    circuits = {c["id"]: c for c in get_circuits(db)}
    d_stand = get_driver_standings(db, season)
    c_stand = get_constructor_standings(db, season)

    by_driver = {d["id"]: d for d in drivers}
    by_team = {t["id"]: t for t in teams}
    featured_drivers = [by_driver[s["driver_id"]] for s in d_stand["standings"][:4] if s["driver_id"] in by_driver]
    featured_teams = [by_team[s["team_id"]] for s in c_stand["standings"][:4] if s["team_id"] in by_team]

    upcoming = [r for r in races if r["status"] in ("live", "next", "upcoming")]
    featured_circuits: list[dict] = []
    for r in upcoming[:3]:
        c = circuits.get(r["circuit_id"])
        if c and c not in featured_circuits:
            featured_circuits.append(c)

    return {
        "season": season,
        "next_race": pick_next(races, now),
        "driver_standings": {**d_stand, "standings": d_stand["standings"][:5]},
        "constructor_standings": {**c_stand, "standings": c_stand["standings"][:4]},
        # sin resultados cargados todavía: se muestran los primeros 4
        "featured_drivers": featured_drivers or drivers[:4],
        "featured_teams": featured_teams or teams[:4],
        "upcoming_races": upcoming[:6],
        "featured_circuits": featured_circuits,
    }


# ----------------------------------------------------------------- búsqueda
def _tokens(q: str) -> list[str]:
    # se quitan los caracteres que rompen la sintaxis de filtros de PostgREST (, ( ) * % etc.)
    clean = re.sub(r"[^\w\s\-]", " ", q or "")
    return [t.lower() for t in clean.split()][:4]


def _or(columns: list[str], tokens: list[str]) -> str:
    return ",".join(f"{c}.ilike.*{t}*" for c in columns for t in tokens)


def _match(tokens: list[str], *values) -> bool:
    hay = " ".join(str(v) for v in values if v).lower()
    return all(t in hay for t in tokens)


def search(db, season: int, q: str, per_type: int = 5) -> dict:
    tokens = _tokens(q)
    if not tokens or sum(len(t) for t in tokens) < 2:
        return {"results": []}
    out: list[dict] = []

    rows = _rows(
        db.table("v_drivers_season")
        .select("id,first_name,last_name,code,team_name")
        .eq("season", season)
        .or_(_or(["first_name", "last_name", "code"], tokens))
    )
    for r in rows:
        if _match(tokens, r["first_name"], r["last_name"], r.get("code")):
            out.append(
                {
                    "type": "driver",
                    "id": r["id"],
                    "label": f'{r["first_name"]} {r["last_name"]}',
                    "subtitle": r.get("team_name"),
                    "url": f'/pages/drivers.html#{r["id"]}',
                }
            )
    n_drivers = len(out)
    out = out[:per_type]

    teams = _rows(db.table("teams").select("id,name,full_name,headquarters").or_(_or(["name", "full_name"], tokens)))
    teams = [t for t in teams if _match(tokens, t["name"], t.get("full_name"))][:per_type]
    out += [
        {
            "type": "team",
            "id": t["id"],
            "label": t["name"],
            "subtitle": t.get("headquarters"),
            "url": f'/pages/teams.html#{t["id"]}',
        }
        for t in teams
    ]

    circuits = _rows(
        db.table("circuits").select("id,name,short_name,city,country").or_(_or(["name", "short_name", "city", "country"], tokens))
    )
    circuits = [c for c in circuits if _match(tokens, c["name"], c.get("short_name"), c.get("city"), c.get("country"))]
    out += [
        {
            "type": "circuit",
            "id": c["id"],
            "label": c["name"],
            "subtitle": ", ".join(x for x in (c.get("city"), c.get("country")) if x) or None,
            "url": f'/pages/circuits.html#{c["id"]}',
        }
        for c in circuits[:per_type]
    ]

    races = _rows(
        db.table("v_races_status")
        .select("id,name,official_name,city,country,date_start,date_end")
        .eq("season", season)
        .or_(_or(["name", "official_name", "country", "city"], tokens))
    )
    races = [r for r in races if _match(tokens, r["name"], r.get("official_name"), r.get("country"), r.get("city"))]
    out += [
        {
            "type": "race",
            "id": r["id"],
            "label": r["name"],
            "subtitle": " · ".join(
                x for x in (r.get("country"), f'{r.get("date_start")} – {r.get("date_end")}' if r.get("date_start") else None) if x
            )
            or None,
            "url": f'/pages/calendar.html#{r["id"]}',
        }
        for r in races[:per_type]
    ]
    return {"results": out}


# ----------------------------------------------------------------- admin
def save_results(db, race_id: str, results: list[dict]) -> int:
    """Carga (o reemplaza) los resultados de una carrera. Primero hace upsert y después borra
    los pilotos que ya no están, así nunca queda la carrera sin resultados si algo falla."""
    if not _rows(db.table("races").select("id").eq("id", race_id)):
        raise NotFound(f"No existe la carrera '{race_id}'")
    ids = [r["driver_id"] for r in results]
    if len(set(ids)) != len(ids):
        raise BadRequest("Hay pilotos repetidos en results")
    positions = [r["position"] for r in results if r.get("position") is not None]
    if len(set(positions)) != len(positions):
        raise BadRequest("Hay posiciones repetidas en results")
    rows = [{**r, "race_id": race_id} for r in results]
    db.table("results").upsert(rows, on_conflict="race_id,driver_id").execute()
    db.table("results").delete().eq("race_id", race_id).not_.in_("driver_id", ids).execute()
    return len(rows)
