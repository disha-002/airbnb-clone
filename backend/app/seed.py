"""Demo data: 8 users (3 hosts), 120 listings across 12 Indian cities, reviews and bookings."""
import random
from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from . import models, photos, services
from .database import Base, SessionLocal, add_missing_columns, engine

avatar = lambda s: f"https://i.pravatar.cc/150?u={s}"  # noqa: E731

USERS = [  # name, email, role
    ("Aarav Mehta", "aarav@demo.com", "host"),
    ("Ananya Iyer", "ananya@demo.com", "host"),
    ("Rohan Kapoor", "rohan@demo.com", "host"),
    ("Isha Verma", "isha@demo.com", "guest"),
    ("Kabir Singh", "kabir@demo.com", "guest"),
    ("Meera Nair", "meera@demo.com", "guest"),
    ("Vikram Rao", "vikram@demo.com", "guest"),
    ("Sana Khan", "sana@demo.com", "guest"),
]
LISTINGS_PER_CITY = 10  # enough to fill a home-page row (7 cards across on a laptop)
HOST_YEARS = [1, 4, 7]
# Roughly 2 in 5 listings run a special offer (% off), like the crossed-out prices on Airbnb.
DISCOUNTS = [0, 0, 0, 0, 0, 0, 10, 15, 20, 25]  # how long each host has been hosting
# Rating mix per host (weights for 5/4/3 stars), so Superhost status comes out different for each.
HOST_RATING_WEIGHTS = [(85, 13, 2), (50, 35, 15), (80, 18, 2)]

AMENITIES = ["Wifi", "Kitchen", "Free parking", "Air conditioning", "Washer", "Hot water", "TV",
             "Workspace", "Balcony", "Power backup", "Pets allowed", "Breakfast included", "Pool"]

# city, state, lat, lng, category shown in the category bar
CITIES = [
    ("Goa", "Goa", 15.50, 73.83, "Beachfront"),
    ("Manali", "Himachal Pradesh", 32.24, 77.19, "Amazing views"),
    ("Shimla", "Himachal Pradesh", 31.10, 77.17, "Cabins"),
    ("Mumbai", "Maharashtra", 19.08, 72.88, "Iconic cities"),
    ("New Delhi", "Delhi", 28.61, 77.21, "Iconic cities"),
    ("Jaipur", "Rajasthan", 26.91, 75.79, "Design"),
    ("Udaipur", "Rajasthan", 24.58, 73.71, "Amazing views"),
    ("Rishikesh", "Uttarakhand", 30.09, 78.27, "Trending"),
    ("Munnar", "Kerala", 10.09, 77.06, "Tropical"),
    ("Bengaluru", "Karnataka", 12.97, 77.59, "Trending"),
    ("Mussoorie", "Uttarakhand", 30.46, 78.07, "Cabins"),
    ("Chandigarh", "Chandigarh", 30.73, 76.78, "Design"),
]
# property type -> (nightly price range in INR, max guests range, bedrooms range)
TYPES = {
    "Room": ((700, 2500), (2, 3), (1, 1)),
    "Flat": ((1500, 4500), (2, 5), (1, 2)),
    "Apartment": ((2000, 6000), (3, 6), (1, 3)),
    "Home": ((3000, 12000), (4, 8), (2, 4)),
    "Villa": ((8000, 30000), (6, 12), (3, 5)),
    "Cabin": ((2500, 9000), (2, 6), (1, 3)),
}
# Which property types make sense for each category (cities pick from these).
TYPES_BY_CATEGORY = {
    "Beachfront": ["Villa", "Villa", "Home", "Apartment"],
    "Tropical": ["Villa", "Home", "Cabin", "Room"],
    "Cabins": ["Cabin", "Cabin", "Home", "Room"],
    "Amazing views": ["Cabin", "Villa", "Home", "Room"],
    "Iconic cities": ["Apartment", "Flat", "Room", "Home"],
    "Trending": ["Apartment", "Flat", "Room", "Cabin"],
    "Design": ["Home", "Apartment", "Villa", "Flat"],
}
ADJS = ["Sunny", "Cozy", "Modern", "Peaceful", "Charming", "Spacious", "Stylish", "Homely"]
FEATS = ["valley views", "a private balcony", "a rooftop terrace", "a garden", "home-cooked breakfast",
         "fast wifi and a workspace", "a warm fireplace", "a lovely courtyard"]
# Sample messages for the demo inboxes: what a guest writes when booking, and how hosts reply.
GUEST_NOTES = [
    "Hi! We're arriving a little after 6pm, is a late check-in okay?",
    "Hello! Travelling with my partner for a short break. Any food places you'd recommend nearby?",
    "Hi, looking forward to the stay. Is there parking on the property?",
    "Hey! It's a family trip with two kids. Is the place child-friendly?",
    "Hi there! Can we drop our bags a few hours early on the check-in day?",
]
HOST_REPLIES = [
    "Hi {name}! Thanks for booking. Late check-in is no problem, just message me when you're about 30 minutes away.",
    "Welcome {name}! There's a lovely café two minutes' walk from the front gate, and I'll send a list of favourites before you arrive.",
    "Hello {name}, yes, there's free parking right outside. See you soon!",
    "Hi {name}, absolutely, the place is great for families. I'll keep a few extra blankets ready.",
    "Hi {name}, early bag drop works from 11am. I'll let the caretaker know.",
]
GUEST_FOLLOWUPS = ["That's perfect, thank you so much!", "Great, thanks! See you then.", "Wonderful, really appreciate it."]

COMMENTS = {
    5: ["Wonderful stay, would happily book again!", "Spotless and exactly as pictured.",
        "Great location and a very responsive host.", "Peaceful place with a lovely view."],
    4: ["Good value for money. Check-in was smooth.", "Comfortable stay, the kitchen could use a few more basics."],
    3: ["Lovely place, a little noisy at night.", "Decent, but the wifi was patchy."],
}


def seed(db: Session, rnd: random.Random | None = None) -> None:
    rnd = rnd or random.Random(11)
    users = [models.User(name=n, email=e, role=r, avatar_url=avatar(e.split("@")[0])) for n, e, r in USERS]
    for host, years in zip(users, HOST_YEARS):
        host.created_at = models.utcnow() - timedelta(days=365 * years + 30)
    db.add_all(users)
    hosts, guests = users[:3], users[3:]
    amenities = [models.Amenity(name=n) for n in AMENITIES]
    db.add_all(amenities)
    db.flush()
    pool = next(a for a in amenities if a.name == "Pool")

    listings = []
    per_type: dict[str, int] = {}
    for city, state, lat, lng, cat in CITIES:
        mix = TYPES_BY_CATEGORY[cat]
        for k in range(LISTINGS_PER_CITY):
            ptype = mix[k % len(mix)]
            (plo, phi), (glo, ghi), (blo, bhi) = TYPES[ptype]
            bedrooms = rnd.randint(blo, bhi)
            per_type[ptype] = per_type.get(ptype, -1) + 1
            chosen = rnd.sample([a for a in amenities if a is not pool], rnd.randint(5, 10))
            if ptype == "Villa":
                chosen.append(pool)
            listings.append(models.Listing(
                host=hosts[len(listings) % 3],
                title=f"{rnd.choice(ADJS)} {ptype.lower()} with {rnd.choice(FEATS)}",
                description=(
                    f"A comfortable {ptype.lower()} in {city}, {state}. Close to local markets, cafés and the "
                    "main sights, with everything you need for a relaxed stay: fast wifi, hot water, power "
                    "backup and a helpful host who is happy to share local tips.\n\n"
                    "Check-in is flexible and self check-in is available."
                ),
                property_type=ptype, category=cat, city=city, country="India",
                lat=lat + rnd.uniform(-.04, .04), lng=lng + rnd.uniform(-.04, .04),
                price_per_night=round(rnd.randint(plo, phi) / 50) * 50,
                cleaning_fee=rnd.choice([0, 200, 300, 500]),
                discount_pct=rnd.choice(DISCOUNTS),
                max_guests=rnd.randint(glo, ghi), bedrooms=bedrooms, beds=bedrooms + rnd.randint(0, 1),
                bathrooms=max(1, bedrooms - rnd.randint(0, 1)),
                amenities=chosen,
                photos=[models.ListingPhoto(url=u, position=i) for i, u in enumerate(photos.gallery(ptype, rnd, per_type[ptype]))],
            ))
    db.add_all(listings)
    db.flush()

    for l in listings:
        weights = HOST_RATING_WEIGHTS[hosts.index(l.host)]
        for g in rnd.sample(guests, rnd.randint(3, 5)):
            rating = rnd.choices([5, 4, 3], weights=weights)[0]
            db.add(models.Review(listing_id=l.id, guest_id=g.id, rating=rating, comment=rnd.choice(COMMENTS[rating]),
                                 created_at=models.utcnow() - timedelta(days=rnd.randint(10, 400))))

    today = date.today()

    def add_booking(l, guest, start, nights, note=""):
        q = services.make_quote(l, start, start + timedelta(days=nights))
        db.add(models.Booking(listing_id=l.id, guest_id=guest.id, check_in=start, check_out=start + timedelta(days=nights),
                              guests=min(2, l.max_guests), nightly_rate=q.nightly_rate, discount=q.discount,
                              message=note, cleaning_fee=q.cleaning_fee,
                              service_fee=q.service_fee, total=q.total))

    for k, l in enumerate(listings[:14]):  # upcoming stays: these dates are blocked on the listing
        add_booking(l, guests[k % 2], today + timedelta(days=7 + k * 3), 2 + k % 3, note=GUEST_NOTES[k % len(GUEST_NOTES)])
    for k, l in enumerate(listings[14:20]):  # past stays, so a guest can leave a review
        add_booking(l, guests[0], today - timedelta(days=20 + k * 5), 3)

    # Demo inboxes: each upcoming booking's note starts a conversation; hosts have answered most of them.
    db.flush()
    for k, l in enumerate(listings[:14]):
        guest = guests[k % 2]
        sent = models.utcnow() - timedelta(days=3, hours=k)
        convo = services.get_or_create_conversation(db, l, guest)
        services.post_message(db, convo, guest, GUEST_NOTES[k % len(GUEST_NOTES)], at=sent)
        if k % 5 != 4:  # leave a few unanswered so hosts have something unread
            services.post_message(db, convo, l.host, HOST_REPLIES[k % len(HOST_REPLIES)].format(name=guest.name.split()[0]),
                                  at=sent + timedelta(hours=2))
            if k % 3 == 0:
                services.post_message(db, convo, guest, GUEST_FOLLOWUPS[k % len(GUEST_FOLLOWUPS)], at=sent + timedelta(hours=3))
                convo.host_last_read_at = sent + timedelta(hours=2)  # that follow-up is unread by the host
                convo.guest_last_read_at = sent + timedelta(hours=3)
            else:
                convo.guest_last_read_at = sent  # the host's reply is unread by the guest
                convo.host_last_read_at = sent + timedelta(hours=2)
        else:
            convo.guest_last_read_at = sent

    db.flush()
    for h in hosts:
        services.refresh_superhost(db, h.id)
    db.commit()


def reset_and_seed() -> int:
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed(db)
        return db.scalar(select(func.count()).select_from(models.Listing))


def seed_if_empty() -> bool:
    """Used on server start so a fresh deployment is immediately usable."""
    Base.metadata.create_all(engine)
    add_missing_columns()
    with SessionLocal() as db:
        services.backfill_booking_messages(db)  # older databases: booking notes become conversations
        if db.scalar(select(func.count()).select_from(models.User)):
            return False
        seed(db)
        return True
