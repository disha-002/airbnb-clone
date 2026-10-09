"""Rules enforced by SQLite itself, independent of the API."""
from datetime import timedelta

import pytest
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError

from app import models
from conftest import TODAY, add_booking


def test_foreign_keys_enabled(db):
    assert db.execute(text("PRAGMA foreign_keys")).scalar() == 1


def test_overlap_trigger(db, data):
    add_booking(db, data["l1"], data["guest"], start=10, nights=3)
    with pytest.raises(IntegrityError, match="booking_overlap"):
        add_booking(db, data["l1"], data["guest2"], start=11, nights=1)
    db.rollback()
    add_booking(db, data["l1"], data["guest2"], start=13, nights=1)  # back-to-back is fine
    add_booking(db, data["l1"], data["guest2"], start=11, nights=1, status="cancelled")  # cancelled rows don't block


@pytest.mark.parametrize("row", [
    lambda d: models.User(name="x", email="x@t.com", role="admin"),
    lambda d: models.Review(listing_id=d["l1"], guest_id=d["guest"], rating=6),
    lambda d: models.Booking(listing_id=d["l1"], guest_id=d["guest"], check_in=TODAY, check_out=TODAY,
                             nightly_rate=1, total=1),
    lambda d: models.Booking(listing_id=d["l1"], guest_id=d["guest"], check_in=TODAY,
                             check_out=TODAY + timedelta(days=1), nightly_rate=1, total=1, status="pending"),
])
def test_check_constraints(db, data, row):
    db.add(row(data))
    with pytest.raises(IntegrityError):
        db.commit()


def test_review_unique_per_booking(db, data):
    bid = add_booking(db, data["l1"], data["guest"], start=-10, nights=2)
    db.add(models.Review(listing_id=data["l1"], guest_id=data["guest"], booking_id=bid, rating=5))
    db.commit()
    db.add(models.Review(listing_id=data["l1"], guest_id=data["guest"], booking_id=bid, rating=4))
    with pytest.raises(IntegrityError):
        db.commit()


def test_cascade_on_hard_delete(db, data):
    """FK cascade now actually works at the SQL level (it was ignored before the PRAGMA)."""
    db.add(models.Wishlist(user_id=data["guest"], listing_id=data["l3"]))
    db.commit()
    db.execute(text("DELETE FROM listings WHERE id = :id"), {"id": data["l3"]})
    db.commit()
    assert db.execute(text("SELECT count(*) FROM wishlist")).scalar() == 0
    assert db.execute(text("SELECT count(*) FROM listing_photos WHERE listing_id = :id"), {"id": data["l3"]}).scalar() == 0


def test_seed_if_empty_runs_once(db):
    from app.seed import seed_if_empty

    assert seed_if_empty() is True
    counts = lambda: [db.execute(text(f"SELECT count(*) FROM {t}")).scalar() for t in ("users", "listings", "bookings")]  # noqa: E731
    first = counts()
    assert first[0] == 8 and first[1] == 120 and first[2] > 0
    assert seed_if_empty() is False  # existing data is never touched
    assert counts() == first


def test_seed_data_is_consistent(db):
    from app.seed import seed

    seed(db)
    # every listing has 5 distinct photos and a cover
    rows = db.execute(text("SELECT listing_id, count(*), count(DISTINCT url) FROM listing_photos GROUP BY 1")).all()
    assert len(rows) == 120 and all(n == 5 and d == 5 for _, n, d in rows)
    # seeded bookings never overlap (the trigger would have raised) and prices add up
    for nightly, nights, discount, cleaning, service, total in db.execute(text(
        "SELECT nightly_rate, julianday(check_out) - julianday(check_in), discount, cleaning_fee, service_fee, total FROM bookings"
    )):
        assert total == nightly * nights - discount + cleaning + service
    # superhost follows the review aggregate rule
    superhosts = db.execute(text("SELECT count(*) FROM users WHERE is_superhost")).scalar()
    assert 1 <= superhosts < 3


def test_missing_columns_are_added_to_an_old_database(tmp_path, monkeypatch):
    """A database created before discounts existed gets the new columns on startup."""
    from sqlalchemy import create_engine
    from app import database

    old = create_engine(f"sqlite:///{tmp_path / 'old.db'}")
    with old.begin() as c:
        c.exec_driver_sql("CREATE TABLE listings (id INTEGER PRIMARY KEY, price_per_night INTEGER)")
        c.exec_driver_sql("CREATE TABLE bookings (id INTEGER PRIMARY KEY, total INTEGER)")
        c.exec_driver_sql("INSERT INTO listings VALUES (1, 1000)")
    monkeypatch.setattr(database, "engine", old)
    database.add_missing_columns()
    database.add_missing_columns()  # idempotent
    with old.connect() as c:
        assert c.exec_driver_sql("SELECT discount_pct FROM listings").scalar() == 0
        assert c.exec_driver_sql("SELECT room_type, precise_location FROM listings").one() == ("entire", 1)
        assert "discount" in {r[1] for r in c.exec_driver_sql("PRAGMA table_info(bookings)")}
