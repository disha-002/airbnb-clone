from app import services
from conftest import add_booking, as_user, d


def book(client, uid, listing_id, ci, co, guests=1):
    return client.post("/api/bookings", headers=as_user(uid),
                       json={"listing_id": listing_id, "check_in": ci, "check_out": co, "guests": guests,
                             "message": "Hi! Looking forward to the stay."})


def test_booking_happy_path_snapshots_price(client, data):
    r = book(client, data["guest"], data["l1"], d(3), d(6), guests=2)
    assert r.status_code == 201
    b = r.json()
    assert (b["nightly_rate"], b["cleaning_fee"], b["service_fee"], b["total"]) == (1000, 200, 420, 3620)
    assert b["status"] == "confirmed"
    # the booked range now blocks the calendar
    assert client.get(f"/api/listings/{data['l1']}/availability").json() == [{"check_in": d(3), "check_out": d(6)}]


def test_booking_requires_known_user(client, data):
    body = {"listing_id": data["l1"], "check_in": d(3), "check_out": d(5), "guests": 1, "message": "Hi!"}
    assert client.post("/api/bookings", json=body).status_code == 401
    assert client.post("/api/bookings", json=body, headers=as_user(999)).status_code == 401


def test_booking_validation(client, data):
    g, l1 = data["guest"], data["l1"]
    assert book(client, g, 9999, d(3), d(5)).status_code == 404
    assert book(client, data["host"], l1, d(3), d(5)).status_code == 400  # own listing
    assert book(client, g, l1, d(5), d(5)).status_code == 422  # zero nights
    assert book(client, g, l1, d(-1), d(2)).status_code == 422  # past
    assert book(client, g, l1, d(3), d(5), guests=5).status_code == 422  # max 4
    assert book(client, g, l1, d(3), d(5), guests=0).status_code == 422


def test_overlap_rejected_back_to_back_allowed(client, data):
    assert book(client, data["guest"], data["l1"], d(10), d(13)).status_code == 201
    for ci, co in [(d(11), d(12)), (d(9), d(11)), (d(12), d(15)), (d(9), d(14))]:
        assert book(client, data["guest2"], data["l1"], ci, co).status_code == 409
    assert book(client, data["guest2"], data["l1"], d(13), d(15)).status_code == 201  # starts on check-out day
    assert book(client, data["guest2"], data["l1"], d(8), d(10)).status_code == 201  # ends on check-in day
    assert book(client, data["guest2"], data["l2"], d(10), d(13)).status_code == 201  # other listing


def test_race_is_caught_by_db_trigger(client, data, monkeypatch):
    """Simulate two requests both passing the availability check: the trigger must still stop the 2nd."""
    assert book(client, data["guest"], data["l1"], d(10), d(13)).status_code == 201
    monkeypatch.setattr(services, "is_available", lambda *a: True)
    r = book(client, data["guest2"], data["l1"], d(11), d(12))
    assert r.status_code == 409 and "no longer available" in r.json()["detail"]


def test_trips_lists_my_bookings_only(client, data):
    book(client, data["guest"], data["l1"], d(3), d(5))
    book(client, data["guest2"], data["l2"], d(3), d(5))
    trips = client.get("/api/trips", headers=as_user(data["guest"])).json()
    assert len(trips) == 1
    assert trips[0]["listing"]["id"] == data["l1"] and trips[0]["reviewed"] is False


def test_cancel_frees_dates(client, data):
    bid = book(client, data["guest"], data["l1"], d(10), d(13)).json()["id"]
    r = client.delete(f"/api/bookings/{bid}", headers=as_user(data["guest"]))
    assert r.status_code == 200 and r.json()["status"] == "cancelled"
    assert book(client, data["guest2"], data["l1"], d(10), d(13)).status_code == 201
    # cancelled trip is still in history
    assert client.get("/api/trips", headers=as_user(data["guest"])).json()[0]["status"] == "cancelled"


def test_cancel_rules(client, data, db):
    bid = book(client, data["guest"], data["l1"], d(10), d(13)).json()["id"]
    assert client.delete(f"/api/bookings/{bid}", headers=as_user(data["guest2"])).status_code == 404  # not yours
    assert client.delete(f"/api/bookings/{bid}", headers=as_user(data["guest"])).status_code == 200
    assert client.delete(f"/api/bookings/{bid}", headers=as_user(data["guest"])).status_code == 409  # twice
    started = add_booking(db, data["l2"], data["guest"], start=-1, nights=3)
    assert client.delete(f"/api/bookings/{started}", headers=as_user(data["guest"])).status_code == 409


def test_booking_needs_a_message_for_the_host(client, data):
    body = {"listing_id": data["l1"], "check_in": d(3), "check_out": d(5), "guests": 1}
    h = as_user(data["guest"])
    assert client.post("/api/bookings", headers=h, json=body).status_code == 422
    assert client.post("/api/bookings", headers=h, json={**body, "message": "   "}).status_code == 422
    r = client.post("/api/bookings", headers=h, json={**body, "message": "  Arriving around 6pm.  "})
    assert r.status_code == 201 and r.json()["message"] == "Arriving around 6pm."
    host_view = client.get("/api/host/bookings", headers=as_user(data["host"])).json()
    assert host_view[0]["message"] == "Arriving around 6pm."
