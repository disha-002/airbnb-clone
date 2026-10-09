from conftest import add_booking, as_user, d

NEW = {
    "title": "Lake house", "description": "Nice", "property_type": "Home", "category": "Lakefront",
    "city": "Udaipur", "country": "India", "price_per_night": 5000, "cleaning_fee": 300,
    "max_guests": 4, "photo_urls": ["http://a/1.jpg", "http://a/2.jpg"], "amenity_ids": [],
}


def test_guest_cannot_use_host_endpoints(client, data):
    h = as_user(data["guest"])
    assert client.get("/api/host/listings", headers=h).status_code == 403
    assert client.post("/api/host/listings", headers=h, json=NEW).status_code == 403
    assert client.get("/api/host/listings").status_code == 401


def test_create_listing(client, data):
    body = {**NEW, "amenity_ids": [data["wifi"]]}
    r = client.post("/api/host/listings", headers=as_user(data["host"]), json=body)
    assert r.status_code == 201
    lid = r.json()["id"]
    detail = client.get(f"/api/listings/{lid}").json()
    assert detail["host"]["id"] == data["host"]
    assert [p["url"] for p in detail["photos"]] == NEW["photo_urls"]
    assert [a["name"] for a in detail["amenities"]] == ["Wifi"]
    assert lid in [i["id"] for i in client.get("/api/listings?q=Udaipur").json()["items"]]


def test_create_listing_validation(client, data):
    h = as_user(data["host"])
    assert client.post("/api/host/listings", headers=h, json={**NEW, "photo_urls": []}).status_code == 422
    assert client.post("/api/host/listings", headers=h, json={**NEW, "price_per_night": 0}).status_code == 422
    assert client.post("/api/host/listings", headers=h, json={**NEW, "title": "ab"}).status_code == 422


def test_update_listing_replaces_photos_and_amenities(client, data):
    h = as_user(data["host"])
    body = {**NEW, "title": "Renamed", "photo_urls": ["http://b/1.jpg"], "amenity_ids": [data["pool"]]}
    assert client.put(f"/api/host/listings/{data['l1']}", headers=h, json=body).status_code == 200
    detail = client.get(f"/api/listings/{data['l1']}").json()
    assert detail["title"] == "Renamed"
    assert [p["url"] for p in detail["photos"]] == ["http://b/1.jpg"]
    assert [a["name"] for a in detail["amenities"]] == ["Pool"]


def test_host_cannot_touch_others_listings(client, data):
    h2 = as_user(data["host2"])
    assert client.put(f"/api/host/listings/{data['l1']}", headers=h2, json=NEW).status_code == 404
    assert client.delete(f"/api/host/listings/{data['l1']}", headers=h2).status_code == 404


def test_my_listings_and_host_bookings(client, data, db):
    add_booking(db, data["l1"], data["guest"], start=5, nights=2)
    add_booking(db, data["l3"], data["guest"], start=5, nights=2)  # host2's
    mine = client.get("/api/host/listings", headers=as_user(data["host"])).json()
    assert {l["id"] for l in mine} == {data["l1"], data["l2"]}
    assert {l["id"]: l["upcoming_bookings"] for l in mine} == {data["l1"]: 1, data["l2"]: 0}
    bookings = client.get("/api/host/bookings", headers=as_user(data["host"])).json()
    assert len(bookings) == 1
    assert bookings[0]["guest"]["name"] == "Guest One" and bookings[0]["listing_title"] == "Goa villa"


def test_delete_blocked_while_upcoming_bookings(client, data, db):
    bid = add_booking(db, data["l1"], data["guest"], start=5, nights=2)
    h = as_user(data["host"])
    r = client.delete(f"/api/host/listings/{data['l1']}", headers=h)
    assert r.status_code == 409 and "1 upcoming reservation" in r.json()["detail"]
    # once the guest cancels, the host can remove it
    client.delete(f"/api/bookings/{bid}", headers=as_user(data["guest"]))
    assert client.delete(f"/api/host/listings/{data['l1']}", headers=h).status_code == 204


def test_delete_archives_instead_of_erasing(client, data, db):
    add_booking(db, data["l1"], data["guest"], start=-10, nights=2)  # past stay, must survive
    client.post(f"/api/wishlist/{data['l1']}", headers=as_user(data["guest2"]))
    h = as_user(data["host"])
    assert client.delete(f"/api/host/listings/{data['l1']}", headers=h).status_code == 204

    # gone from search, host dashboard and wishlists...
    assert data["l1"] not in [i["id"] for i in client.get("/api/listings").json()["items"]]
    assert data["l1"] not in [l["id"] for l in client.get("/api/host/listings", headers=h).json()]
    assert client.get("/api/wishlist", headers=as_user(data["guest2"])).json() == []
    # ...can't be edited, deleted again, booked or wishlisted...
    assert client.put(f"/api/host/listings/{data['l1']}", headers=h, json=NEW).status_code == 404
    assert client.delete(f"/api/host/listings/{data['l1']}", headers=h).status_code == 404
    book = {"listing_id": data["l1"], "check_in": d(3), "check_out": d(5), "guests": 1}
    assert client.post("/api/bookings", headers=as_user(data["guest"]), json=book).status_code == 404
    assert client.post(f"/api/wishlist/{data['l1']}", headers=as_user(data["guest"])).status_code == 404
    # ...but the detail page and the guest's past trip still work
    assert client.get(f"/api/listings/{data['l1']}").json()["is_active"] is False
    trips = client.get("/api/trips", headers=as_user(data["guest"])).json()
    assert trips[0]["listing"]["id"] == data["l1"] and trips[0]["listing"]["is_active"] is False
    assert len(client.get("/api/host/bookings", headers=h).json()) == 1
