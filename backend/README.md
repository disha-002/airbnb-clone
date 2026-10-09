# Airbnb Clone: Backend (FastAPI + SQLite)

## Setup
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python seed.py                      # creates airbnb.db with demo data
uvicorn app.main:app --reload       # http://localhost:8000/docs
```

## Auth (mocked)
Send `X-User-Id: <id>` on requests. `GET /api/users` lists demo users (3 hosts, 2 guests).

## Schema
users 1-N listings 1-N listing_photos
listings N-M amenities (listing_amenities)
listings 1-N bookings N-1 users (guest)
listings 1-N reviews N-1 users
users N-M listings (wishlist)

## API
| Method | Path | Notes |
|---|---|---|
| GET | /api/listings | q, check_in, check_out, guests, min_price, max_price, property_type, category, amenity_ids, page |
| GET | /api/listings/{id} | detail + photos, amenities, host, reviews |
| GET | /api/listings/{id}/availability | booked ranges to disable in date picker |
| GET | /api/listings/{id}/quote | price breakdown |
| POST | /api/listings/{id}/reviews | only after a completed stay |
| POST | /api/bookings | 409 on overlapping dates |
| GET | /api/trips | my bookings |
| DELETE | /api/bookings/{id} | cancel (frees dates) |
| GET/POST/PUT/DELETE | /api/host/listings | host CRUD (owner only) |
| GET | /api/host/bookings | bookings on my listings |
| GET/POST/DELETE | /api/wishlist[/{id}] | favorites |
| POST | /api/uploads | host-only image upload (multipart), returns a URL |

## Design notes
- `check_out` is exclusive, so back-to-back stays are allowed; overlap test is `a.in < b.out AND a.out > b.in`.
- Prices are snapshotted on the booking so later price edits don't change past trips.
- Cancelled bookings are soft-deleted and ignored by the availability check.
