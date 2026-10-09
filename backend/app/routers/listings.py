import re
from datetime import date
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload
from .. import models, schemas, services
from ..database import get_db
from ..deps import get_current_user, get_optional_user

router = APIRouter(tags=["listings"])


@router.get("/listings", response_model=schemas.ListingPage)
def search_listings(
    q: Optional[str] = None,  # location text: city / country / title
    check_in: Optional[date] = None,
    check_out: Optional[date] = None,
    guests: int = 1,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    property_type: Optional[str] = None,
    category: Optional[str] = None,
    amenity_ids: list[int] = Query(default=[]),
    bedrooms: Optional[int] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=120),
    db: Session = Depends(get_db),
    user: models.User | None = Depends(get_optional_user),
):
    L = models.Listing
    stmt = select(L).where(L.is_active, L.max_guests >= guests)
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(or_(L.city.ilike(like), L.country.ilike(like), L.title.ilike(like)))
    # Price filters use the price guests see, i.e. after any special offer.
    if min_price is not None:
        stmt = stmt.where(services.offer_price_sql(L) >= min_price)
    if max_price is not None:
        stmt = stmt.where(services.offer_price_sql(L) <= max_price)
    if property_type:
        stmt = stmt.where(L.property_type == property_type)
    if category:
        stmt = stmt.where(L.category == category)
    if bedrooms:
        stmt = stmt.where(L.bedrooms >= bedrooms)
    for aid in amenity_ids:  # must have ALL selected amenities
        stmt = stmt.where(L.amenities.any(models.Amenity.id == aid))
    if check_in and check_out:
        services.validate_dates(check_in, check_out)
        stmt = stmt.where(
            ~L.bookings.any(services.overlap_clause(check_in, check_out))
        )

    total = db.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = db.scalars(
        stmt.options(selectinload(L.photos), selectinload(L.host))
        .order_by(L.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return schemas.ListingPage(
        items=services.to_cards(db, rows, user),
        page=page,
        has_more=page * page_size < total,
        total=total,
    )


@router.get("/listings/{listing_id}", response_model=schemas.ListingDetail)
def get_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    user: models.User | None = Depends(get_optional_user),
):
    l = db.get(models.Listing, listing_id)
    if not l:
        raise HTTPException(404, "Listing not found")
    card = services.to_cards(db, [l], user)[0].model_dump()
    return schemas.ListingDetail(
        **card,
        description=l.description, precise_location=l.precise_location, cleaning_fee=l.cleaning_fee, max_guests=l.max_guests,
        bedrooms=l.bedrooms, beds=l.beds, bathrooms=l.bathrooms,
        host=l.host, photos=l.photos, amenities=l.amenities, reviews=l.reviews,
    )


@router.get("/listings/{listing_id}/availability", response_model=list[schemas.BookedRange])
def booked_ranges(listing_id: int, db: Session = Depends(get_db)):
    """Dates the frontend date-picker must disable."""
    rows = db.scalars(
        select(models.Booking).where(
            models.Booking.listing_id == listing_id,
            models.Booking.status == "confirmed",
            models.Booking.check_out > date.today(),
        )
    ).all()
    return [schemas.BookedRange(check_in=b.check_in, check_out=b.check_out) for b in rows]


@router.get("/listings/{listing_id}/quote", response_model=schemas.Quote)
def quote(listing_id: int, check_in: date, check_out: date, db: Session = Depends(get_db)):
    l = db.get(models.Listing, listing_id)
    if not l:
        raise HTTPException(404, "Listing not found")
    services.validate_dates(check_in, check_out)
    return services.make_quote(l, check_in, check_out)


@router.post("/listings/{listing_id}/reviews", response_model=schemas.ReviewOut, status_code=201)
def add_review(
    listing_id: int,
    body: schemas.ReviewIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """Bonus: one review per completed stay, attached to the oldest stay not yet reviewed."""
    stay = db.scalar(
        select(models.Booking)
        .where(
            models.Booking.listing_id == listing_id,
            models.Booking.guest_id == user.id,
            models.Booking.status == "confirmed",
            models.Booking.check_out <= date.today(),
            ~select(models.Review.id).where(models.Review.booking_id == models.Booking.id).exists(),
        )
        .order_by(models.Booking.check_out)
        .limit(1)
    )
    if not stay:
        raise HTTPException(403, "You can review a place once per completed stay")
    r = models.Review(listing_id=listing_id, guest_id=user.id, booking_id=stay.id, **body.model_dump())
    db.add(r)
    db.flush()
    services.refresh_superhost(db, stay.listing.host_id)
    db.commit()
    db.refresh(r)
    return r


@router.get("/amenities", response_model=list[schemas.AmenityOut])
def list_amenities(db: Session = Depends(get_db)):
    return db.scalars(select(models.Amenity).order_by(models.Amenity.name)).all()


class LoginIn(BaseModel):
    email: str


@router.post("/login", response_model=schemas.UserOut)
def login(body: LoginIn, db: Session = Depends(get_db)):
    """Mock auth: any email logs in. Unknown emails get a new guest account on the spot."""
    email = body.email.strip().lower()
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email) or len(email) > 150:
        raise HTTPException(422, "Enter a valid email address.")
    user = db.scalar(select(models.User).where(func.lower(models.User.email) == email))
    if not user:
        local = email.split("@")[0]
        name = re.sub(r"[._\-+\d]+", " ", local).strip().title() or "Guest"
        # No photo until the user adds one (the UI shows their initial), and the
        # "Let's create your account" step is still to come.
        user = models.User(name=name, email=email, role="guest", avatar_url="", account_complete=False)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@router.patch("/me", response_model=schemas.UserOut)
def complete_account(body: schemas.AccountIn, db: Session = Depends(get_db),
                     user: models.User = Depends(get_current_user)):
    """Finish sign-up: legal name, date of birth and the marketing opt-out."""
    today = date.today()
    dob = body.date_of_birth
    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    if dob > today or age > 120:
        raise HTTPException(422, "Enter a valid date of birth.")
    if age < 18:
        raise HTTPException(422, "You must be 18 or older to use Airbnb.")
    user.name = f"{body.first_name} {body.last_name}"
    user.date_of_birth = dob
    user.marketing_opt_out = body.marketing_opt_out
    user.account_complete = True
    db.commit()
    db.refresh(user)
    return user


@router.get("/users/{user_id}/profile", response_model=schemas.PublicProfile)
def public_profile(user_id: int, db: Session = Depends(get_db),
                   viewer: models.User | None = Depends(get_optional_user)):
    """A host's (or guest's) public profile: active listings plus the reviews those listings got."""
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    listings = db.scalars(
        select(models.Listing).where(models.Listing.host_id == user.id, models.Listing.is_active)
        .options(selectinload(models.Listing.photos), selectinload(models.Listing.host))
        .order_by(models.Listing.id)
    ).all()
    reviewed = (select(models.Review, models.Listing.title).join(models.Listing)
                .where(models.Listing.host_id == user.id))
    count, avg = db.execute(
        select(func.count(), func.avg(models.Review.rating)).select_from(models.Review).join(models.Listing)
        .where(models.Listing.host_id == user.id)
    ).one()
    rows = db.execute(reviewed.options(selectinload(models.Review.guest))
                      .order_by(models.Review.created_at.desc(), models.Review.id.desc()).limit(12)).all()
    reviews = [schemas.ProfileReview(id=r.id, rating=r.rating, comment=r.comment, created_at=r.created_at,
                                     guest=r.guest, listing_id=r.listing_id, listing_title=title) for r, title in rows]
    return schemas.PublicProfile(user=user, listings=services.to_cards(db, listings, viewer), reviews=reviews,
                                 review_count=count, rating=round(avg, 2) if avg is not None else None)


@router.get("/users", response_model=list[schemas.UserOut])
def list_users(db: Session = Depends(get_db)):
    """Used by the mock 'switch user' menu."""
    return db.scalars(select(models.User)).all()
