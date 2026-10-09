"""Run once: python seed.py  (recreates airbnb.db with demo data: 12 Indian cities x 4 listings)."""
import random
from datetime import date, timedelta
from app.database import Base, engine, SessionLocal
from app import models

random.seed(11)
Base.metadata.drop_all(engine)
Base.metadata.create_all(engine)
db = SessionLocal()

img = lambda seed, n=0: f"https://picsum.photos/seed/{seed}-{n}/1200/800"  # placeholder photos
avatar = lambda s: f"https://i.pravatar.cc/150?u={s}"

users = [
    models.User(name="Aarav Mehta", email="aarav@demo.com", role="host", is_superhost=True, avatar_url=avatar("aarav")),
    models.User(name="Ananya Iyer", email="ananya@demo.com", role="host", is_superhost=False, avatar_url=avatar("ananya")),
    models.User(name="Rohan Kapoor", email="rohan@demo.com", role="host", is_superhost=True, avatar_url=avatar("rohan")),
    models.User(name="Isha Verma", email="isha@demo.com", role="guest", avatar_url=avatar("isha")),
    models.User(name="Kabir Singh", email="kabir@demo.com", role="guest", avatar_url=avatar("kabir")),
    models.User(name="Meera Nair", email="meera@demo.com", role="guest", avatar_url=avatar("meera")),
    models.User(name="Vikram Rao", email="vikram@demo.com", role="guest", avatar_url=avatar("vikram")),
    models.User(name="Sana Khan", email="sana@demo.com", role="guest", avatar_url=avatar("sana")),
]
db.add_all(users)
hosts, guests = users[:3], users[3:]

amen_names = ["Wifi", "Kitchen", "Free parking", "Air conditioning", "Washer", "Hot water", "TV",
              "Workspace", "Balcony", "Power backup", "Pets allowed", "Breakfast included"]
amenities = [models.Amenity(name=n) for n in amen_names]
db.add_all(amenities)
db.flush()

# city, state, lat, lng, category shown in the category bar
cities = [
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
types = {
    "Room": ((700, 2500), (2, 3), (1, 1)),
    "Flat": ((1500, 4500), (2, 5), (1, 2)),
    "Apartment": ((2000, 6000), (3, 6), (1, 3)),
    "Home": ((3000, 12000), (4, 8), (2, 4)),
    "Villa": ((8000, 30000), (6, 12), (3, 5)),
    "Cabin": ((2500, 9000), (2, 6), (1, 3)),
}
adjs = ["Sunny", "Cozy", "Modern", "Peaceful", "Charming", "Spacious", "Stylish", "Homely"]
feats = ["valley views", "a private balcony", "a rooftop terrace", "a garden", "home-cooked breakfast",
         "fast wifi and a workspace", "a warm fireplace", "a lovely courtyard"]

listings = []
n = 0
for city, state, lat, lng, cat in cities:
    for k in range(4):
        ptype = random.choice(list(types))
        (plo, phi), (glo, ghi), (blo, bhi) = types[ptype]
        beds = random.randint(blo, bhi)
        listings.append(models.Listing(
            host=hosts[n % 3],
            title=f"{random.choice(adjs)} {ptype.lower()} with {random.choice(feats)}",
            description=(f"A comfortable {ptype.lower()} in {city}, {state}. Close to local markets, cafés and the main sights, "
                         "with everything you need for a relaxed stay: fast wifi, hot water, power backup and a "
                         "helpful host who is happy to share local tips.\n\nCheck-in is flexible and self check-in is available."),
            property_type=ptype, category=cat, city=city, country="India",
            lat=lat + random.uniform(-.04, .04), lng=lng + random.uniform(-.04, .04),
            price_per_night=round(random.randint(plo, phi) / 50) * 50,
            cleaning_fee=random.choice([0, 200, 300, 500]),
            max_guests=random.randint(glo, ghi), bedrooms=beds, beds=beds + random.randint(0, 1),
            bathrooms=max(1, beds - random.randint(0, 1)),
            amenities=random.sample(amenities, random.randint(5, 10)),
            photos=[models.ListingPhoto(url=img(f"in{n}", i), position=i) for i in range(5)],
        ))
        n += 1
db.add_all(listings)
db.flush()

comments = ["Wonderful stay, would happily book again!", "Spotless and exactly as pictured.",
            "Great location and a very responsive host.", "Peaceful place with a lovely view.",
            "Good value for money. Check-in was smooth.", "Lovely place, a little noisy at night."]
today = date.today()
for l in listings:
    for g in random.sample(guests, 4):
        db.add(models.Review(listing_id=l.id, guest_id=g.id,
                             rating=random.choices([5, 4, 3], weights=[70, 25, 5])[0],
                             comment=random.choice(comments)))

def add_booking(l, guest, start, nights):
    rate, clean = l.price_per_night, l.cleaning_fee
    sub = rate * nights
    svc = round(sub * 0.14)
    db.add(models.Booking(listing_id=l.id, guest_id=guest.id, check_in=start,
                          check_out=start + timedelta(days=nights), guests=2,
                          nightly_rate=rate, cleaning_fee=clean, service_fee=svc,
                          total=sub + clean + svc))

for k, l in enumerate(listings[:14]):  # upcoming stays: these dates are blocked on the listing
    add_booking(l, guests[k % 2], today + timedelta(days=7 + k * 3), 2 + k % 3)
for k, l in enumerate(listings[14:20]):  # past stays, so a guest can leave a review
    add_booking(l, guests[0], today - timedelta(days=20 + k * 5), 3)

db.commit()
print("Seeded:", len(listings), "listings in", len(cities), "cities")
