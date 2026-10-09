from conftest import add_booking, as_user, d


def ids(res):
    return sorted(i["id"] for i in res.json()["items"])


def test_search_returns_all_with_card_fields(client, data):
    r = client.get("/api/listings")
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 3 and body["has_more"] is False
    card = next(i for i in body["items"] if i["id"] == data["l1"])
    assert card["cover_url"] == "http://img/Goa villa/0"
    assert card["rating"] is None and card["review_count"] == 0


def test_search_pagination(client, data):
    p1 = client.get("/api/listings?page_size=2&page=1").json()
    p2 = client.get("/api/listings?page_size=2&page=2").json()
    assert len(p1["items"]) == 2 and p1["has_more"] is True
    assert len(p2["items"]) == 1 and p2["has_more"] is False
    assert {i["id"] for i in p1["items"]}.isdisjoint({i["id"] for i in p2["items"]})


def test_search_filters(client, data):
    assert ids(client.get("/api/listings?q=goa")) == sorted([data["l1"], data["l2"]])
    assert ids(client.get("/api/listings?min_price=1500&max_price=2500")) == [data["l3"]]
    assert ids(client.get("/api/listings?guests=5")) == [data["l3"]]
    # amenities are AND-ed: only L1 has both
    assert ids(client.get(f"/api/listings?amenity_ids={data['wifi']}&amenity_ids={data['pool']}")) == [data["l1"]]


def test_search_by_dates_hides_booked_listings(client, data, db):
    add_booking(db, data["l1"], data["guest"], start=10, nights=3)  # days 10..13
    assert data["l1"] not in ids(client.get(f"/api/listings?check_in={d(11)}&check_out={d(12)}"))
    # check-out day is free: a stay starting on day 13 doesn't clash
    assert data["l1"] in ids(client.get(f"/api/listings?check_in={d(13)}&check_out={d(15)}"))


def test_search_rejects_bad_dates(client, data):
    assert client.get(f"/api/listings?check_in={d(5)}&check_out={d(5)}").status_code == 422
    assert client.get(f"/api/listings?check_in={d(-2)}&check_out={d(1)}").status_code == 422


def test_listing_detail(client, data):
    r = client.get(f"/api/listings/{data['l1']}")
    assert r.status_code == 200
    body = r.json()
    assert body["is_active"] is True
    assert body["host"]["name"] == "Host One"
    assert [p["position"] for p in body["photos"]] == [0, 1]
    assert {a["name"] for a in body["amenities"]} == {"Wifi", "Pool"}
    assert client.get("/api/listings/9999").status_code == 404


def test_detail_shows_wishlisted_for_logged_in_user(client, data):
    client.post(f"/api/wishlist/{data['l1']}", headers=as_user(data["guest"]))
    assert client.get(f"/api/listings/{data['l1']}", headers=as_user(data["guest"])).json()["wishlisted"] is True
    assert client.get(f"/api/listings/{data['l1']}").json()["wishlisted"] is False


def test_availability_only_future_confirmed(client, data, db):
    add_booking(db, data["l1"], data["guest"], start=5, nights=2)
    add_booking(db, data["l1"], data["guest"], start=20, nights=2, status="cancelled")
    add_booking(db, data["l1"], data["guest"], start=-10, nights=2)  # past
    r = client.get(f"/api/listings/{data['l1']}/availability").json()
    assert r == [{"check_in": d(5), "check_out": d(7)}]


def test_quote_math(client, data):
    q = client.get(f"/api/listings/{data['l1']}/quote?check_in={d(3)}&check_out={d(6)}").json()
    # 3 nights x 1000 + 200 cleaning + 14% service on the nightly subtotal
    assert q == {"nights": 3, "nightly_rate": 1000, "subtotal": 3000,
                 "cleaning_fee": 200, "service_fee": 420, "total": 3620}


def test_amenities_and_users(client, data):
    assert [a["name"] for a in client.get("/api/amenities").json()] == ["Pool", "Wifi"]
    assert len(client.get("/api/users").json()) == 4
