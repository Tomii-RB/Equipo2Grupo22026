import copy
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fake_db import FakeDB  # noqa: E402

from app import services as svc  # noqa: E402

NOW = datetime(2026, 3, 20, 12, 0, 0, tzinfo=timezone.utc)  # entre China (completed) y Japón (next)


def _race(i, rid, name, circuit, city, country, ds, de, status, win=None, win_name=None, first=None, race_at=None):
    return dict(id=rid, season=2026, round=i, name=name, official_name=None, circuit_id=circuit,
                date_start=ds, date_end=de, circuit_name=circuit.title(), city=city, country=country,
                status=status, first_session_at=first, race_starts_at=race_at,
                winner_driver_id=win, winner_name=win_name)


def make_store():
    drivers = [
        ("antonelli", "Kimi", "Antonelli", "ANT", "mercedes", "Mercedes", "#27F4D2", 43, 1, 1, 12),
        ("russell", "George", "Russell", "RUS", "mercedes", "Mercedes", "#27F4D2", 43, 1, 1, None),
        ("leclerc", "Charles", "Leclerc", "LEC", "ferrari", "Ferrari", "#E8002D", 27, 3, 0, 16),
        ("hamilton", "Lewis", "Hamilton", "HAM", "ferrari", "Ferrari", "#E8002D", 27, 3, 0, 44),
        ("norris", "Lando", "Norris", "NOR", "mclaren", "McLaren", "#FF8000", 18, 5, 0, 1),
        ("piastri", "Oscar", "Piastri", "PIA", "mclaren", "McLaren", "#FF8000", 18, 5, 0, None),
        ("verstappen", "Max", "Verstappen", "VER", "red-bull", "Red Bull Racing", "#3671C6", 10, 7, 0, 3),
        ("hadjar", "Isack", "Hadjar", "HAD", "red-bull", "Red Bull Racing", "#3671C6", 10, 7, 0, None),
    ]
    return {
        "v_races_status": [
            _race(1, "2026-australia", "GP de Australia", "albert-park", "Melbourne", "Australia", "2026-03-06", "2026-03-08", "completed", "antonelli", "Kimi Antonelli"),
            _race(2, "2026-china", "GP de China", "shanghai", "Shanghai", "China", "2026-03-13", "2026-03-15", "completed", "russell", "George Russell"),
            _race(3, "2026-japon", "GP de Japón", "suzuka", "Suzuka", "Japan", "2026-03-27", "2026-03-29", "next", first="2026-03-27T02:30:00+00:00"),
            _race(4, "2026-miami", "GP de Miami", "miami", "Miami", "United States", "2026-05-01", "2026-05-03", "upcoming"),
            _race(5, "2026-canada", "GP de Canadá", "gilles-villeneuve", "Montreal", "Canada", "2026-05-22", "2026-05-24", "upcoming"),
            _race(6, "2026-monaco", "GP de Mónaco", "monaco", "Monte Carlo", "Monaco", "2026-06-05", "2026-06-07", "upcoming"),
        ],
        "races": [{"id": r, "season": 2026, "round": i + 1, "name": n} for i, (r, n) in enumerate(
            [("2026-australia", "GP de Australia"), ("2026-china", "GP de China"), ("2026-japon", "GP de Japón"),
             ("2026-miami", "GP de Miami"), ("2026-canada", "GP de Canadá"), ("2026-monaco", "GP de Mónaco")])],
        # fuera de orden a propósito: el servicio tiene que ordenarlas por starts_at
        "sessions": [
            {"race_id": "2026-japon", "type": "RACE", "starts_at": "2026-03-29T05:00:00+00:00"},
            {"race_id": "2026-japon", "type": "FP1", "starts_at": "2026-03-27T02:30:00+00:00"},
            {"race_id": "2026-japon", "type": "QUALIFYING", "starts_at": "2026-03-28T06:00:00+00:00"},
            {"race_id": "2026-monaco", "type": "RACE", "starts_at": "2026-06-07T14:00:00+00:00"},
        ],
        "circuits": [
            {"id": "albert-park", "name": "Albert Park Circuit", "short_name": "Albert Park", "country": "Australia", "city": "Melbourne", "length_km": None},
            {"id": "shanghai", "name": "Shanghai International Circuit", "short_name": "Shanghai", "country": "China", "city": "Shanghai"},
            {"id": "suzuka", "name": "Suzuka", "short_name": "Suzuka", "country": "Japan", "city": "Suzuka", "length_km": 5.807, "laps": 53, "race_distance_km": 307.471},
            {"id": "miami", "name": "Miami International Autodrome", "short_name": "Miami", "country": "United States", "city": "Miami"},
            {"id": "gilles-villeneuve", "name": "Circuit Gilles Villeneuve", "short_name": "Montreal", "country": "Canada", "city": "Montreal"},
            {"id": "monaco", "name": "Circuit de Monaco", "short_name": "Monte Carlo", "country": "Monaco", "city": "Monte Carlo", "length_km": 3.337, "laps": 78},
        ],
        "v_drivers_season": [
            dict(season=2026, id=i, number=n, first_name=f, last_name=l, code=c, country_code=None, bio=None,
                 wins=0.0, podiums=0.0, photo_url=None, team_id=t, team_name=tn, team_color_hex=col,
                 championship_position=pos, points=pts)
            for (i, f, l, c, t, tn, col, pts, pos, _w, n) in drivers
        ],
        "v_driver_standings": [
            dict(season=2026, position=pos, driver_id=i, driver_name=f"{f} {l}", team_id=t, team_name=tn,
                 team_color_hex=col, points=float(pts), wins=w, after_round=2, total_rounds=6)
            for (i, f, l, c, t, tn, col, pts, pos, w, n) in drivers
        ],
        "v_constructor_standings": [
            dict(season=2026, position=1, team_id="mercedes", team_name="Mercedes", team_color_hex="#27F4D2", points=86.0, wins=2, after_round=2, total_rounds=6),
            dict(season=2026, position=2, team_id="ferrari", team_name="Ferrari", team_color_hex="#E8002D", points=54.0, wins=0, after_round=2, total_rounds=6),
            dict(season=2026, position=3, team_id="mclaren", team_name="McLaren", team_color_hex="#FF8000", points=36.0, wins=0, after_round=2, total_rounds=6),
            dict(season=2026, position=4, team_id="red-bull", team_name="Red Bull Racing", team_color_hex="#3671C6", points=20.0, wins=0, after_round=2, total_rounds=6),
        ],
        "driver_seasons": [
            {"season": 2026, "driver_id": i, "team_id": t, "drivers": {"first_name": f, "last_name": l}}
            for (i, f, l, c, t, tn, col, pts, pos, w, n) in drivers
        ],
        "teams": [
            {"id": "mercedes", "name": "Mercedes", "full_name": "Mercedes-AMG PETRONAS F1 Team", "headquarters": "Brackley, United Kingdom", "color_hex": "#27F4D2"},
            {"id": "ferrari", "name": "Ferrari", "full_name": "Scuderia Ferrari", "headquarters": "Maranello, Italy", "color_hex": "#E8002D"},
            {"id": "mclaren", "name": "McLaren", "full_name": "McLaren Formula 1 Team", "headquarters": "Woking, United Kingdom", "color_hex": "#FF8000"},
            {"id": "red-bull", "name": "Red Bull Racing", "full_name": "Oracle Red Bull Racing", "headquarters": "Milton Keynes, United Kingdom", "color_hex": "#3671C6"},
        ],
        "results": [
            {"race_id": "2026-australia", "driver_id": "antonelli", "team_id": "mercedes", "position": 1, "grid": 1, "points": 25.0, "status": "finished"},
            {"race_id": "2026-australia", "driver_id": "russell", "team_id": "mercedes", "position": 2, "grid": 2, "points": 18.0, "status": "finished"},
            {"race_id": "2026-china", "driver_id": "antonelli", "team_id": "mercedes", "position": 2, "grid": 1, "points": 18.0, "status": "finished"},
        ],
    }


def db():
    return FakeDB(make_store())


# ------------------------------------------------------------------ pruebas
def test_races_wrapper_status_winner_and_sessions():
    races = svc.get_races(db(), 2026)
    assert [r["status"] for r in races] == ["completed", "completed", "next", "upcoming", "upcoming", "upcoming"]
    assert races[0]["winner"] == {"driver_id": "antonelli", "name": "Kimi Antonelli"}
    assert races[2]["winner"] is None and races[3]["winner"] is None
    assert races[0]["sessions"] == []  # siempre array
    japon = races[2]["sessions"]
    assert [s["type"] for s in japon] == ["FP1", "QUALIFYING", "RACE"]  # ascendente por starts_at
    assert japon[0]["starts_at"] == "2026-03-27T02:30:00Z"  # ISO con Z, no +00:00
    assert races[0]["date_start"] == "2026-03-06"
    for key in ("round", "name", "official_name", "city", "country", "date_start", "date_end", "status", "winner", "sessions"):
        assert key in races[0]


def test_next_race_seconds_and_starts_at():
    nxt = svc.get_next_race(db(), 2026, NOW)
    assert nxt["id"] == "2026-japon" and nxt["status"] == "next"
    assert nxt["starts_at"] == "2026-03-27T02:30:00Z"
    assert nxt["seconds_until_start"] == int((datetime(2026, 3, 27, 2, 30, tzinfo=timezone.utc) - NOW).total_seconds())
    assert isinstance(nxt["seconds_until_start"], int)


def test_next_race_is_live_race_and_never_negative():
    d = db()
    for r in d.store["v_races_status"]:
        if r["id"] == "2026-japon":
            r["status"] = "live"
    after = datetime(2026, 3, 27, 5, 0, tzinfo=timezone.utc)
    nxt = svc.get_next_race(d, 2026, after)
    assert nxt["id"] == "2026-japon" and nxt["status"] == "live"
    assert nxt["seconds_until_start"] == 0


def test_next_race_none_when_season_over():
    d = db()
    for r in d.store["v_races_status"]:
        r["status"] = "completed"
    assert svc.get_next_race(d, 2026, NOW) is None


def test_next_race_without_sessions_uses_date_start():
    d = db()
    d.store["sessions"] = []
    nxt = svc.get_next_race(d, 2026, NOW)
    assert nxt["starts_at"] == "2026-03-27T00:00:00Z" and nxt["sessions"] == []


def test_drivers_have_team_color_and_order():
    drivers = svc.get_drivers(db(), 2026)
    assert drivers[0]["team_color_hex"] == "#27F4D2"
    assert all("team_color_hex" in d for d in drivers)
    assert [d["championship_position"] for d in drivers] == [1, 1, 3, 3, 5, 5, 7, 7]
    assert drivers[0]["wins"] == 0 and isinstance(drivers[0]["points"], int)  # 43.0 -> 43


def test_driver_detail():
    det = svc.get_driver_detail(db(), 2026, "antonelli")
    assert [r["round"] for r in det["season_results"]] == [1, 2]
    assert det["season_results"][0]["race_name"] == "GP de Australia"
    assert svc.get_driver_detail(db(), 2026, "nadie") is None


def test_teams():
    teams = svc.get_teams(db(), 2026)
    assert [t["id"] for t in teams] == ["mercedes", "ferrari", "mclaren", "red-bull"]
    assert teams[0]["driver_ids"] == ["antonelli", "russell"]
    assert teams[0]["drivers"] == ["Kimi Antonelli", "George Russell"]
    assert teams[0]["points"] == 86 and teams[0]["championship_position"] == 1


def test_circuits_numbers():
    c = {c["id"]: c for c in svc.get_circuits(db())}
    assert c["monaco"]["length_km"] == 3.337 and c["monaco"]["laps"] == 78
    assert c["miami"]["length_km"] is None and "race_distance_km" in c["miami"]


def test_standings_have_color_and_round_meta():
    for fn in (svc.get_driver_standings, svc.get_constructor_standings):
        s = fn(db(), 2026)
        assert s["season"] == 2026 and s["after_round"] == 2 and s["total_rounds"] == 6
        assert all("team_color_hex" in row for row in s["standings"])
    assert svc.get_driver_standings(db(), 2026)["standings"][0]["points"] == 43
    assert [r["position"] for r in svc.get_constructor_standings(db(), 2026)["standings"]] == [1, 2, 3, 4]


def test_standings_empty_season():
    s = svc.get_driver_standings(db(), 2030)
    assert s == {"season": 2030, "after_round": 0, "total_rounds": 0, "standings": []}


def test_home_rules():
    h = svc.get_home(db(), 2026, NOW)
    assert h["next_race"]["id"] == "2026-japon"
    assert len(h["driver_standings"]["standings"]) == 5
    assert len(h["constructor_standings"]["standings"]) == 4
    assert len(h["featured_drivers"]) == 4 and len(h["featured_teams"]) == 4
    assert [r["id"] for r in h["upcoming_races"]] == ["2026-japon", "2026-miami", "2026-canada", "2026-monaco"]
    assert [c["id"] for c in h["featured_circuits"]] == ["suzuka", "miami", "gilles-villeneuve"]


def test_search():
    r = svc.search(db(), 2026, "lec")["results"]
    assert r[0] == {"type": "driver", "id": "leclerc", "label": "Charles Leclerc", "subtitle": "Ferrari",
                    "url": "/pages/drivers.html#leclerc"}
    full = svc.search(db(), 2026, "max verstappen")["results"]
    assert full[0]["id"] == "verstappen"
    types = {x["type"] for x in svc.search(db(), 2026, "monaco")["results"]}
    assert types == {"circuit", "race"}
    team = svc.search(db(), 2026, "ferrari")["results"]
    assert any(x["type"] == "team" and x["subtitle"] == "Maranello, Italy" for x in team)
    assert svc.search(db(), 2026, "a")["results"] == []
    assert svc.search(db(), 2026, "(),*%")["results"] == []  # caracteres que romperían el filtro


def test_save_results_replaces_and_validates():
    d = db()
    new = [
        {"driver_id": "russell", "team_id": "mercedes", "position": 1, "grid": 2, "points": 25, "status": "finished", "fastest_lap": False},
        {"driver_id": "leclerc", "team_id": "ferrari", "position": 2, "grid": 3, "points": 18, "status": "finished", "fastest_lap": False},
    ]
    assert svc.save_results(d, "2026-australia", new) == 2
    rows = [r for r in d.store["results"] if r["race_id"] == "2026-australia"]
    assert {r["driver_id"] for r in rows} == {"russell", "leclerc"}  # antonelli se borró
    assert len([r for r in d.store["results"] if r["race_id"] == "2026-china"]) == 1  # otra carrera intacta
    for bad, exc in (
        (("2026-nope", new), svc.NotFound),
        (("2026-china", new + [new[0]]), svc.BadRequest),
        (("2026-china", [new[0], {**new[1], "position": 1}]), svc.BadRequest),
    ):
        try:
            svc.save_results(d, *bad)
            raise AssertionError("tenía que fallar")
        except exc:
            pass


if __name__ == "__main__":
    tests = [(n, f) for n, f in sorted(globals().items()) if n.startswith("test_")]
    for n, f in tests:
        f()
        print("OK ", n)
    print(f"\n{len(tests)} pruebas pasaron")
