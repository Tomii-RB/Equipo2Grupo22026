import os

from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "")
DEFAULT_SEASON = int(os.getenv("DEFAULT_SEASON", "2026"))

# localhost y 127.0.0.1 en cualquier puerto (Live Server, http.server, etc.)
CORS_ORIGIN_REGEX = r"https?://(localhost|127\.0\.0\.1)(:\d+)?"
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
