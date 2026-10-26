from datetime import datetime, timezone


def parse_dt(value):
    """Acepta str ISO (con Z o +00:00) o datetime y devuelve un datetime con zona horaria UTC."""
    if value is None:
        return None
    if isinstance(value, str):
        value = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def iso_utc(value):
    """'2026-06-07T14:00:00+00:00' -> '2026-06-07T14:00:00Z' (formato del contrato)."""
    dt = parse_dt(value)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ") if dt else None


def num(value):
    """Los numeric de Postgres pueden llegar como 25.0; el contrato quiere 25."""
    if value is None:
        return None
    value = float(value)
    return int(value) if value.is_integer() else value
