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
