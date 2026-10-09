import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# On Railway this points at the mounted volume, e.g. sqlite:////data/airbnb.db
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./airbnb.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


@event.listens_for(engine, "connect")
def _sqlite_pragmas(dbapi_conn, _):
    """SQLite ignores FOREIGN KEY / ON DELETE CASCADE unless this is switched on per connection."""
    cur = dbapi_conn.cursor()
    cur.execute("PRAGMA foreign_keys=ON")
    cur.close()


SessionLocal = sessionmaker(bind=engine, autoflush=False)


class Base(DeclarativeBase):
    pass


# create_all() never alters existing tables, so columns added after a database was created
# (e.g. on an already-deployed instance) are added here. table -> {column: DDL}.
ADDED_COLUMNS = {
    "users": {
        "date_of_birth": "DATE",
        "marketing_opt_out": "BOOLEAN NOT NULL DEFAULT 0",
        "account_complete": "BOOLEAN NOT NULL DEFAULT 1",
    },
    "listings": {
        "discount_pct": "INTEGER NOT NULL DEFAULT 0",
        "room_type": "VARCHAR(10) NOT NULL DEFAULT 'entire'",
        "precise_location": "BOOLEAN NOT NULL DEFAULT 1",
    },
    "bookings": {"discount": "INTEGER NOT NULL DEFAULT 0", "message": "TEXT NOT NULL DEFAULT ''"},
}


def add_missing_columns() -> None:
    with engine.begin() as conn:
        for table, cols in ADDED_COLUMNS.items():
            have = {row[1] for row in conn.exec_driver_sql(f"PRAGMA table_info({table})")}
            if not have:
                continue  # table not created yet; create_all() will include the column
            for name, ddl in cols.items():
                if name not in have:
                    conn.exec_driver_sql(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
