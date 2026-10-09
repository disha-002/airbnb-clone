# Airbnb Clone Verification Checklist

Last verified: 2026-10-09 · `[x]` = checked by Claude (tests, commands or headless Chrome) · `[ ]` = still yours to do

## Verification summary

| Section | Result |
|---|---|
| 1. Setup | 4 of 4 pass |
| 2. Automated checks | 4 of 4 pass (42 tests; type check clean; production build OK; tests fail when foreign keys are switched off) |
| 3. Guest flows | 17 of 17 pass |
| 4. Host flows | 11 of 11 pass |
| 5. Look and feel | 6 of 8 pass; **1 open issue** (placeholder images, see below); 1 side-by-side look for you |
| 6. Database and API | 5 of 5 pass; the interview questions are for you |
| 7. Before submitting | 1 of 9 done; the rest needs the deployment |

**Open issue.** The listing photos are all real, but two placeholder sections on the home page, *Explore experiences nearby* (8 tiles) and *Destinations for you* (5 tiles), still load random `picsum.photos` images. Both are in `frontend/src/components/Extras.tsx`.

**Heads-up: another session is editing the frontend.** A new Services page and changes to 7 frontend files appeared at 10:24 and are uncommitted (`git status`). These checks ran against the code including those changes. Commit or discard them before deploying.

**After the run**, the local database was reseeded, so the test bookings, reviews and the "Checklist test" listing are gone.

## 1. Setup

Run the backend and frontend in two terminals. Port 3000 is taken by Docker on your Mac, so the frontend uses 3100.

```bash
# Terminal 1
cd backend && source .venv/bin/activate
python seed.py                  # fresh demo data
uvicorn app.main:app --reload   # http://localhost:8000/docs

# Terminal 2
cd frontend
npm run dev -- -p 3100          # http://localhost:3100
```

- [x] `python seed.py` prints "Seeded 48 listings"
- [x] http://localhost:8000/health returns `{"ok": true}`
- [x] http://localhost:3100 loads the home page with house photos. Listing photos are all Unsplash (84 images); see the open issue for the two placeholder sections
- [x] `git log --oneline` shows 6 commits, starting with "Initial Airbnb clone"

## 2. Automated checks

These prove the rules hold without clicking anything.

- [x] `cd backend && .venv/bin/python -m pytest` reports **42 passed**
- [x] `cd frontend && npx tsc --noEmit` prints nothing (no type errors)
- [x] `cd frontend && npx next build` finishes with a route table (stop `npm run dev` first; both write to `.next`)
- [x] Optional, to prove the tests are real: change `foreign_keys=ON` to `OFF` in `backend/app/database.py`, run pytest, see 2 failures, then undo. Result: 2 failed, then 42 passed after undoing

## 3. Guest flows

Log in with **I'm travelling** → `isha@demo.com`. Isha has past stays to review and upcoming trips.

**Home and search**

- [x] Home shows a row per city with "See all" tiles and working left/right arrows. 12 rows. At 1280px wide each row fits on screen, so the arrows have nothing to scroll; at 900px they scroll
- [x] Searching "Goa" shows "4 places in Goa" and the map zooms to Goa with 4 price pins
- [x] Hovering a card turns its map pin dark; clicking a pin opens a small preview card that links to the listing
- [x] Category chips (Beachfront, Cabins…) and the Filters modal (price, type, amenities) narrow the results. 48 → Beachfront 4 → max ₹20,000: 2
- [x] Scrolling `/search` with no filters loads more cards until "You've seen all 48 places"
- [x] Dates that clash with a booking remove that listing from results (47 places shown)

**Listing page**

- [x] Gallery, amenities, host card (Superhost badge for Aarav or Rohan), reviews and a location map all show
- [x] The calendar crosses out booked dates and won't let you pick a range across them
- [x] Picking dates shows nights × rate + cleaning fee + service fee, and the total is correct. 3 × ₹28,800 + ₹0 + ₹12,096 = ₹98,496
- [x] Guests can't go above the listing's maximum (the + button stops at 10 of 10)

**Booking and trips**

- [x] Reserve → Confirm and pay → Trips page shows "Your trip is booked!"
- [x] Back on that listing, your dates are now crossed out
- [x] Log in as `kabir@demo.com` and try the same dates on the checkout page: "Those dates are no longer available"
- [x] Cancelling an upcoming trip moves it to "Cancelled" and frees the dates
- [x] A past stay shows "Leave a review"; after submitting, it shows "★ Reviewed" and the review appears on the listing

**Wishlist**

- [x] The heart on a card saves it (toast appears) and it shows on the Wishlists page
- [x] Logged out, clicking the heart asks you to log in (toast, then redirect to `/login`)

## 4. Host flows

Log out, then log in with **I'm hosting** → `aarav@demo.com`.

**Login by role**

- [x] On the "I'm travelling" tab, typing `aarav@demo.com` shows "That's a host account"
- [x] Each tab lists only its own demo accounts (5 guests / 3 hosts); hosts land on the hosting dashboard after login
- [x] Logged in as a guest, "Become a host" opens the "What would you like to host?" popup; `/host` says hosting is for host accounts

**Create and edit**

- [x] Create listing with photo URLs and an uploaded image (JPEG/PNG/WebP, under 5 MB); it appears in search for its city
- [x] Edit the title, price and amenities; the listing page shows the changes
- [x] Change the price of a seeded listing that has a booking: that booking's total on the Bookings tab stays the same (₹5,600/night kept while the listing went to ₹6,599)

**Remove, the Airbnb rule**

- [x] A listing with upcoming reservations shows "N upcoming reservations", a grey Remove button, and the toast "can't be removed yet"
- [x] A listing with no upcoming reservations asks to confirm, then disappears from the dashboard and search
- [x] Opening the removed listing's URL shows "This place is no longer available" and no Reserve button
- [x] A guest's past trip to it still shows, marked "No longer listed"

**Dashboard**

- [x] Listings, Bookings and Earnings tiles show numbers (16 listings, 7 bookings, ₹1,35,050); the Bookings tab lists guests, dates and payout

## 5. Look and feel

Compare side by side with airbnb.com; the UI is a large part of the grade.

- [x] Every listing cover matches its type: villas with pools, cabins in woods, rooms showing a bedroom (checked on screenshots)
- [ ] **Open:** replace the random `picsum.photos` images in *Explore experiences nearby* and *Destinations for you* (`Extras.tsx`)
- [x] Menu (☰) → Theme → Dark: the whole app, including the map, turns dark; reload keeps it dark; Auto follows your Mac's setting
- [x] At phone width (390px): bottom nav shows, the search page has a "Show map" button, and the map isn't hidden behind the nav
- [x] Toasts appear for save, book, cancel, remove and login
- [x] "Experiences" and Google/Apple sign-in show "coming soon" instead of breaking. "Services" now opens a real Services page (added by the other session)
- [x] The browser tab shows the pink Airbnb logo (favicon)
- [ ] Your own side-by-side look against airbnb.com

## 6. Database and API

The schema is graded on its own, so be ready to explain each rule below. Run these from `backend/`.

- [x] `sqlite3 airbnb.db ".tables"` lists 8 tables: users, listings, listing_photos, amenities, listing_amenities, bookings, reviews, wishlist
- [x] `sqlite3 airbnb.db ".schema bookings"` shows the CHECK constraints and the `trg_bookings_no_overlap` trigger
- [x] `sqlite3 airbnb.db "insert into users(name,email,role,avatar_url,is_superhost,created_at) values('x','x@x','admin','',0,'2026-01-01');"` fails with `CHECK constraint failed: ck_user_role`
- [x] http://localhost:8000/docs lists every endpoint in the README's API table (18 routes, all match); try `GET /api/listings?q=Goa` there
- [x] Calling `GET /api/host/listings` without an `X-User-Id` header returns 401; with a guest's id (4) returns 403

**Can you explain these in the interview?**

- [ ] Why check-out is exclusive, and the overlap condition `a.check_in < b.check_out AND a.check_out > b.check_in`
- [ ] Why both an API check and a database trigger guard against double-booking
- [ ] Why prices are copied onto each booking
- [ ] Why cancelling and removing are soft (`status`, `is_active`) instead of deleting rows
- [ ] Why `PRAGMA foreign_keys=ON` is needed in SQLite
- [ ] How Superhost is computed (at least 10 reviews, average 4.7 or higher) and why it's cached on the user

## 7. Before submitting

Free hosting: Render (backend) + Vercel (frontend) + a GitHub Actions keep-awake ping.

- [ ] GitHub repo is **public** and contains `frontend/` and `backend/`
- [x] No secrets or local files in the repo: `.env.local`, `airbnb.db`, `airbnb.db.bak`, `.venv`, `node_modules` are all ignored (`git ls-files` shows none)
- [ ] Render backend: `/health` returns ok and `/api/listings` returns 48 listings on first boot
- [ ] Keep-awake workflow runs green in the Actions tab, and a booking is still there 20 minutes later
- [ ] Vercel frontend loads with photos and data (no "Couldn't reach the server" message)
- [ ] A full booking works on the live site, and its dates block on refresh
- [ ] `CORS_ORIGINS` on Render is set to the Vercel URL
- [ ] Both live links are in the README, replacing "added after deployment"
- [ ] Open the live site in a private window and on your phone
