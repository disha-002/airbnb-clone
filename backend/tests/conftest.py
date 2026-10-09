import os
import tempfile
from datetime import date, timedelta

import pytest

# Point the app at a throwaway database before anything imports app.database.
_tmp = tempfile.mkdtemp()
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp}/test.db"

from fastapi.testclient import TestClient  # noqa: E402
from app import models  # noqa: E402
from app.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402

TODAY = date.today()


def d(days: int) -> str:
    """ISO date `days` from today."""
    return (TODAY + timedelta(days=days)).isoformat()


@pytest.fixture
def db():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    s = SessionLocal()
    yield s
    s.close()


@pytest.fixture
def data(db):
    """Two hosts, two guests, two amenities and three listings (L1, L2 by host 1; L3 by host 2)."""
    host = models.User(name="Host One", email="h1@t.com", role="host")
    host2 = models.User(name="Host Two", email="h2@t.com", role="host")
    guest = models.User(name="Guest One", email="g1@t.com", role="guest")
    guest2 = models.User(name="Guest Two", email="g2@t.com", role="guest")
    wifi, pool = models.Amenity(name="Wifi"), models.Amenity(name="Pool")
    db.add_all([host, host2, guest, guest2, wifi, pool])
    db.flush()

    def listing(h, title, city, price, guests, amenities):
        return models.Listing(
            host_id=h.id, title=title, description="desc", property_type="Villa", category="Beachfront",
            city=city, country="India", price_per_night=price, cleaning_fee=200, max_guests=guests,
            amenities=amenities, photos=[models.ListingPhoto(url=f"http://img/{title}/{i}", position=i) for i in range(2)],
        )

    l1 = listing(host, "Goa villa", "Goa", 1000, 4, [wifi, pool])
    l2 = listing(host, "Goa flat", "Goa", 3000, 2, [wifi])
    l3 = listing(host2, "Manali cabin", "Manali", 2000, 6, [])
    db.add_all([l1, l2, l3])
    db.commit()
    return {k: v.id for k, v in dict(host=host, host2=host2, guest=guest, guest2=guest2,
                                       wifi=wifi, pool=pool, l1=l1, l2=l2, l3=l3).items()}


@pytest.fixture
def client():
    return TestClient(app)


def as_user(uid: int) -> dict:
    return {"X-User-Id": str(uid)}


def add_booking(db, listing_id, guest_id, start: int, nights: int, status="confirmed") -> int:
    """Insert directly (bypasses API date rules) so tests can create past stays."""
    b = models.Booking(
        listing_id=listing_id, guest_id=guest_id, check_in=TODAY + timedelta(days=start),
        check_out=TODAY + timedelta(days=start + nights), guests=1,
        nightly_rate=1000, cleaning_fee=0, service_fee=0, total=1000 * nights, status=status,
    )
    db.add(b)
    db.commit()
    return b.id
