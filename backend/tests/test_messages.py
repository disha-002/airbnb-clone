from datetime import date, timedelta

from conftest import as_user, d


def start(client, uid, listing_id, body="Hello! Is the place available?"):
    return client.post("/api/conversations", headers=as_user(uid), json={"listing_id": listing_id, "body": body})


def test_guest_starts_a_conversation_and_host_replies(client, data):
    r = start(client, data["guest"], data["l1"])
    assert r.status_code == 201
    cid = r.json()["id"]
    assert [m["body"] for m in r.json()["messages"]] == ["Hello! Is the place available?"]
    assert r.json()["other"]["id"] == data["host"]

    # the host sees one unread message, opens it (which marks it read), then replies
    host = as_user(data["host"])
    inbox = client.get("/api/conversations", headers=host).json()
    assert [(c["id"], c["unread"], c["other"]["id"]) for c in inbox] == [(cid, 1, data["guest"])]
    assert client.get("/api/conversations/unread", headers=host).json() == {"count": 1}
    thread = client.get(f"/api/conversations/{cid}", headers=host).json()
    assert thread["unread"] == 0 and len(thread["messages"]) == 1
    assert client.get("/api/conversations/unread", headers=host).json() == {"count": 0}

    sent = client.post(f"/api/conversations/{cid}/messages", headers=host, json={"body": "  Yes, it is!  "})
    assert sent.status_code == 201 and sent.json()["body"] == "Yes, it is!"
    # now the guest has the unread one, and the host's own reply never counts as unread for the host
    assert client.get("/api/conversations/unread", headers=as_user(data["guest"])).json() == {"count": 1}
    assert client.get("/api/conversations/unread", headers=host).json() == {"count": 0}


def test_one_conversation_per_listing_and_guest(client, data):
    first = start(client, data["guest"], data["l1"]).json()["id"]
    second = start(client, data["guest"], data["l1"], "Another question").json()
    assert second["id"] == first and len(second["messages"]) == 2
    # a different listing, or a different guest, is a different thread
    assert start(client, data["guest"], data["l3"]).json()["id"] != first
    assert start(client, data["guest2"], data["l1"]).json()["id"] != first


def test_only_participants_can_read_or_write(client, data):
    cid = start(client, data["guest"], data["l1"]).json()["id"]
    for who in (data["guest2"], data["host2"]):
        h = as_user(who)
        assert client.get(f"/api/conversations/{cid}", headers=h).status_code == 404
        assert client.post(f"/api/conversations/{cid}/messages", headers=h, json={"body": "hi"}).status_code == 404
        assert client.get("/api/conversations", headers=h).json() == []
    assert client.get(f"/api/conversations/{cid}").status_code == 401


def test_message_validation(client, data):
    h = as_user(data["host"])
    assert start(client, data["host"], data["l1"]).status_code == 400  # can't message your own listing
    assert start(client, data["guest"], 9999).status_code == 404
    assert start(client, data["guest"], data["l1"], "   ").status_code == 422
    cid = start(client, data["guest"], data["l1"]).json()["id"]
    assert client.post(f"/api/conversations/{cid}/messages", headers=h, json={"body": ""}).status_code == 422
    assert client.post(f"/api/conversations/{cid}/messages", headers=h, json={"body": "x" * 2001}).status_code == 422


def test_booking_note_becomes_the_first_message(client, data):
    body = {"listing_id": data["l1"], "check_in": d(3), "check_out": d(5), "guests": 1, "message": "Arriving at 6pm."}
    assert client.post("/api/bookings", headers=as_user(data["guest"]), json=body).status_code == 201
    inbox = client.get("/api/conversations", headers=as_user(data["host"])).json()
    assert len(inbox) == 1 and inbox[0]["last_message"]["body"] == "Arriving at 6pm."
    assert inbox[0]["stay"]["check_in"] == d(3) and inbox[0]["stay"]["status"] == "confirmed"
    # a second booking by the same guest on the same listing reuses the thread
    client.post("/api/bookings", headers=as_user(data["guest"]), json={**body, "check_in": d(10), "check_out": d(12), "message": "Back again!"})
    thread = client.get(f"/api/conversations/{inbox[0]['id']}", headers=as_user(data["host"])).json()
    assert [m["body"] for m in thread["messages"]] == ["Arriving at 6pm.", "Back again!"]


def test_backfill_turns_old_booking_notes_into_conversations(client, data, db):
    from app import models, services
    db.add(models.Booking(listing_id=data["l1"], guest_id=data["guest"], check_in=date.today(), check_out=date.today() + timedelta(days=1),
                          guests=1, nightly_rate=1, total=1, message="From before messaging existed"))
    db.commit()
    assert services.backfill_booking_messages(db) == 1
    assert services.backfill_booking_messages(db) == 0  # idempotent
    inbox = client.get("/api/conversations", headers=as_user(data["host"])).json()
    assert inbox[0]["last_message"]["body"] == "From before messaging existed" and inbox[0]["unread"] == 1


def test_cascade_when_listing_removed_from_database(db, data):
    from sqlalchemy import text
    from app import models, services
    guest = db.get(models.User, data["guest"])
    convo = services.get_or_create_conversation(db, db.get(models.Listing, data["l1"]), guest)
    services.post_message(db, convo, guest, "hi")
    db.commit()
    db.execute(text("DELETE FROM conversations WHERE id = :i"), {"i": convo.id})
    db.commit()
    assert db.execute(text("SELECT count(*) FROM messages")).scalar() == 0
