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
    assert q == {"nights": 3, "nightly_rate": 1000, "subtotal": 3000, "discount": 0,
                 "cleaning_fee": 200, "service_fee": 420, "total": 3620}


def test_quote_applies_special_offer(client, data, db):
    from app import models
    db.get(models.Listing, data["l1"]).discount_pct = 20
    db.commit()
    q = client.get(f"/api/listings/{data['l1']}/quote?check_in={d(3)}&check_out={d(6)}").json()
    # 3000 - 20% = 2400; the 14% service fee is charged on the discounted stay
    assert (q["subtotal"], q["discount"], q["service_fee"], q["total"]) == (3000, 600, 336, 2936)
    card = next(c for c in client.get("/api/listings").json()["items"] if c["id"] == data["l1"])
    assert card["discount_pct"] == 20


def test_amenities_and_users(client, data):
    assert [a["name"] for a in client.get("/api/amenities").json()] == ["Pool", "Wifi"]
    assert len(client.get("/api/users").json()) == 4


def test_login_creates_guest_for_unknown_email_and_reuses_it(client, data):
    first = client.post("/api/login", json={"email": "  Jane.Doe@Example.com "})
    assert first.status_code == 200
    body = first.json()
    assert body["role"] == "guest" and body["name"] == "Jane Doe" and body["email"] == "jane.doe@example.com"
    assert body["avatar_url"] == "" and body["account_complete"] is False  # no photo, sign-up pending
    again = client.post("/api/login", json={"email": "jane.doe@example.com"})
    assert again.json()["id"] == body["id"]


def test_complete_account_sets_name_and_birthday(client, data):
    uid = client.post("/api/login", json={"email": "new@example.com"}).json()["id"]
    h = {"X-User-Id": str(uid)}
    form = {"first_name": " Disha ", "last_name": "Agarwal", "date_of_birth": "2000-05-01", "marketing_opt_out": True}
    r = client.patch("/api/me", json=form, headers=h)
    assert r.status_code == 200
    body = r.json()
    assert body["name"] == "Disha Agarwal" and body["date_of_birth"] == "2000-05-01" and body["account_complete"] is True
    # logging in again keeps the completed account
    assert client.post("/api/login", json={"email": "new@example.com"}).json()["account_complete"] is True


def test_complete_account_requires_adult_and_names(client, data):
    uid = client.post("/api/login", json={"email": "kid@example.com"}).json()["id"]
    h = {"X-User-Id": str(uid)}
    teen = d(-365 * 10)
    assert client.patch("/api/me", json={"first_name": "A", "last_name": "B", "date_of_birth": teen}, headers=h).status_code == 422
    assert client.patch("/api/me", json={"first_name": " ", "last_name": "B", "date_of_birth": "1990-01-01"}, headers=h).status_code == 422
    assert client.patch("/api/me", json={"first_name": "A", "last_name": "B", "date_of_birth": "1990-01-01"}).status_code == 401


def test_login_rejects_bad_email(client, data):
    assert client.post("/api/login", json={"email": "nope"}).status_code == 422


def test_price_filter_uses_the_offer_price(client, data, db):
    from app import models
    l1 = db.get(models.Listing, data["l1"])  # 1000 a night
    l1.discount_pct = 30                       # guests see 700
    db.commit()
    ids = lambda q: {i["id"] for i in client.get(f"/api/listings?{q}").json()["items"]}  # noqa: E731
    assert data["l1"] in ids("max_price=750")
    assert data["l1"] not in ids("min_price=800")


def test_offer_rounding_matches_the_frontend(client, data, db):
    from app import models, services
    # 2350 x 15% = 352.5: always rounds up, like Math.round in the browser (Python's round() would give 352)
    assert services.offer_discount(2350, 15) == 353
    l1 = db.get(models.Listing, data["l1"])
    l1.price_per_night, l1.discount_pct = 2350, 15
    db.commit()
    q = client.get(f"/api/listings/{data['l1']}/quote?check_in={d(3)}&check_out={d(4)}").json()
    assert q["subtotal"] - q["discount"] == 1997


def test_public_profile_shows_listings_and_reviews_but_no_private_fields(client, data, db):
    from app import models
    db.add_all([models.Review(listing_id=data["l1"], guest_id=data["guest"], rating=5, comment="Lovely"),
                models.Review(listing_id=data["l2"], guest_id=data["guest2"], rating=4, comment="Good"),
                models.Review(listing_id=data["l3"], guest_id=data["guest"], rating=1, comment="Other host")])
    db.get(models.Listing, data["l2"]).is_active = False  # archived: hidden, but its review still counts
    db.commit()
    body = client.get(f"/api/users/{data['host']}/profile").json()
    assert body["user"]["name"] == "Host One" and "email" not in body["user"] and "date_of_birth" not in body["user"]
    assert [l["id"] for l in body["listings"]] == [data["l1"]]
    assert body["review_count"] == 2 and body["rating"] == 4.5
    assert {r["listing_title"] for r in body["reviews"]} == {"Goa villa", "Goa flat"}
    assert "email" not in body["reviews"][0]["guest"]
    assert client.get("/api/users/9999/profile").status_code == 404
