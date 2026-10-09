from app import models
from conftest import add_booking, as_user


def review(client, uid, listing_id, rating=5):
    return client.post(f"/api/listings/{listing_id}/reviews", headers=as_user(uid),
                       json={"rating": rating, "comment": "Great"})


def test_review_needs_completed_stay(client, data, db):
    assert review(client, data["guest"], data["l1"]).status_code == 403  # never stayed
    add_booking(db, data["l1"], data["guest"], start=5, nights=2)  # upcoming only
    assert review(client, data["guest"], data["l1"]).status_code == 403
    add_booking(db, data["l1"], data["guest"], start=-10, nights=2, status="cancelled")
    assert review(client, data["guest"], data["l1"]).status_code == 403


def test_one_review_per_stay(client, data, db):
    first = add_booking(db, data["l1"], data["guest"], start=-30, nights=2)
    second = add_booking(db, data["l1"], data["guest"], start=-10, nights=2)
    assert review(client, data["guest"], data["l1"]).status_code == 201
    assert review(client, data["guest"], data["l1"]).status_code == 201  # second stay
    assert review(client, data["guest"], data["l1"]).status_code == 403  # no stays left
    trips = {t["id"]: t["reviewed"] for t in client.get("/api/trips", headers=as_user(data["guest"])).json()}
    assert trips == {first: True, second: True}
    detail = client.get(f"/api/listings/{data['l1']}").json()
    assert detail["review_count"] == 2 and detail["rating"] == 5


def test_review_rating_range(client, data, db):
    add_booking(db, data["l1"], data["guest"], start=-10, nights=2)
    assert review(client, data["guest"], data["l1"], rating=6).status_code == 422
    assert review(client, data["guest"], data["l1"], rating=0).status_code == 422


def test_superhost_is_computed_from_reviews(client, data, db):
    def is_superhost():
        db.expire_all()
        return db.get(models.User, data["host"]).is_superhost

    for i in range(9):
        add_booking(db, data["l1"], data["guest"], start=-100 + i * 5, nights=2)
        review(client, data["guest"], data["l1"], rating=5)
    assert not is_superhost()  # 9 reviews: below the minimum of 10
    add_booking(db, data["l2"], data["guest"], start=-5, nights=2)  # reviews count across all their listings
    review(client, data["guest"], data["l2"], rating=5)
    assert is_superhost()
    assert client.get(f"/api/listings/{data['l1']}").json()["is_superhost"] is True
    for i in range(3):  # average drops to (50 + 3) / 13 = 4.08
        add_booking(db, data["l1"], data["guest2"], start=-200 + i * 5, nights=2)
        review(client, data["guest2"], data["l1"], rating=1)
    assert not is_superhost()


def test_wishlist(client, data):
    h = as_user(data["guest"])
    assert client.post(f"/api/wishlist/{data['l1']}", headers=h).status_code == 204
    assert client.post(f"/api/wishlist/{data['l1']}", headers=h).status_code == 204  # idempotent
    client.post(f"/api/wishlist/{data['l3']}", headers=h)
    saved = client.get("/api/wishlist", headers=h).json()
    assert {l["id"] for l in saved} == {data["l1"], data["l3"]} and all(l["wishlisted"] for l in saved)
    assert client.delete(f"/api/wishlist/{data['l1']}", headers=h).status_code == 204
    assert [l["id"] for l in client.get("/api/wishlist", headers=h).json()] == [data["l3"]]
    assert client.post("/api/wishlist/9999", headers=h).status_code == 404
    assert client.get("/api/wishlist").status_code == 401


def test_upload(client, data):
    png = ("a.png", b"\x89PNG\r\n\x1a\n" + b"0" * 10, "image/png")
    assert client.post("/api/uploads", files={"file": png}).status_code == 401  # must be logged in
    assert client.post("/api/uploads", headers=as_user(data["guest"]), files={"file": png}).status_code == 200  # guests creating a first listing
    bad = ("a.txt", b"hello", "text/plain")
    assert client.post("/api/uploads", headers=as_user(data["host"]), files={"file": bad}).status_code == 415
    big = ("a.png", b"0" * (5 * 1024 * 1024 + 1), "image/png")
    assert client.post("/api/uploads", headers=as_user(data["host"]), files={"file": big}).status_code == 413
    r = client.post("/api/uploads", headers=as_user(data["host"]), files={"file": png})
    assert r.status_code == 200 and r.json()["url"].endswith(".png")
    assert client.get(r.json()["url"].replace("http://testserver", "")).status_code == 200
