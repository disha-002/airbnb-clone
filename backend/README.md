# Airbnb Clone: Backend (FastAPI + SQLite)

See the [root README](../README.md) for the architecture, database schema, API overview and assumptions.

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
python seed.py                      # reset the database with demo data (also done automatically if empty)
uvicorn app.main:app --reload       # http://localhost:8000/docs
pytest                              # 42 tests on a throwaway database
```

| Env var | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `sqlite:///./airbnb.db` | SQLite file location |
| `UPLOAD_DIR` | `uploads` | Where uploaded images are stored |
| `CORS_ORIGINS` | `*` | Comma-separated allowed frontend origins |

Layout: `routers/` (HTTP) → `services.py` (business rules) → `models.py` (tables), with `schemas.py` for request and response models, `deps.py` for mock auth, `seed.py` for demo data and `photos.py` for the curated photo set.
