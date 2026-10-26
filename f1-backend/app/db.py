from functools import lru_cache

from . import config


@lru_cache
def get_db():
    """Cliente de Supabase. Usa la service_role key: solo corre en el servidor."""
    from supabase import create_client

    if not config.SUPABASE_URL or not config.SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el .env")
    return create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)
