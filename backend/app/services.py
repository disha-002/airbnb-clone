from datetime import date
from fastapi import HTTPException
from sqlalchemy import and_, exists, func, select
from sqlalchemy.orm import Session
from . import models, schemas

SERVICE_FEE_RATE = 0.14
# Simplified version of Airbnb's Superhost criteria (theirs also counts stays and cancellations).
SUPERHOST_MIN_REVIEWS = 10
SUPERHOST_MIN_RATING = 4.7


def overlap_clause(check_in: date, check_out: date):
    """Two ranges [a,b) and [c,d) overlap iff a < d and c < b (check-out day is free)."""
    return and_(
        models.Booking.status == "confirmed",
        models.Booking.check_in < check_out,
        models.Booking.check_out > check_in,
    )


def is_available(db: Session, listing_id: int, check_in: date, check_out: date) -> bool:
    q = select(
        exists().where(models.Booking.listing_id == listing_id, overlap_clause(check_in, check_out))
    )
    return not db.scalar(q)


def validate_dates(check_in: date, check_out: date):
    if check_out <= check_in:
        raise HTTPException(422, "Check-out must be after check-in")
    if check_in < date.today():
        raise HTTPException(422, "Check-in cannot be in the past")


def make_quote(listing: models.Listing, check_in: date, check_out: date) -> schemas.Quote:
    nights = (check_out - check_in).days
    subtotal = nights * listing.price_per_night
    service = round(subtotal * SERVICE_FEE_RATE)
    return schemas.Quote(
        nights=nights,
        nightly_rate=listing.price_per_night,
        subtotal=subtotal,
        cleaning_fee=listing.cleaning_fee,
        service_fee=service,
        total=subtotal + listing.cleaning_fee + service,
    )


def rating_stats(db: Session, listing_ids: list[int]) -> dict[int, tuple[float, int]]:
    rows = db.execute(
        select(models.Review.listing_id, func.avg(models.Review.rating), func.count())
        .where(models.Review.listing_id.in_(listing_ids))
        .group_by(models.Review.listing_id)
    ).all()
    return {lid: (round(avg, 2), n) for lid, avg, n in rows}


def card_fields(l: models.Listing, stats, wished: set[int]) -> dict:
    avg, n = stats.get(l.id, (None, 0))
    urls = [p.url for p in l.photos]
    return dict(
        id=l.id, title=l.title, city=l.city, country=l.country,
        property_type=l.property_type, category=l.category,
        price_per_night=l.price_per_night, cover_url=urls[0] if urls else "",
        photo_urls=urls[:5], rating=avg, review_count=n,
        is_superhost=l.host.is_superhost, lat=l.lat, lng=l.lng,
        wishlisted=l.id in wished, is_active=l.is_active,
    )


def to_cards(db: Session, listings, user: models.User | None) -> list[schemas.ListingCard]:
    stats = rating_stats(db, [l.id for l in listings])
    wished = set()
    if user:
        wished = set(db.scalars(select(models.Wishlist.listing_id).where(models.Wishlist.user_id == user.id)))
    return [schemas.ListingCard(**card_fields(l, stats, wished)) for l in listings]


def upcoming_booking_count(db: Session, listing_id: int) -> int:
    return db.scalar(
        select(func.count()).where(
            models.Booking.listing_id == listing_id,
            models.Booking.status == "confirmed",
            models.Booking.check_out > date.today(),
        )
    )


def refresh_superhost(db: Session, host_id: int) -> None:
    """Recompute the cached is_superhost flag from all reviews across the host's listings."""
    avg, n = db.execute(
        select(func.avg(models.Review.rating), func.count())
        .join(models.Listing, models.Review.listing_id == models.Listing.id)
        .where(models.Listing.host_id == host_id)
    ).one()
    host = db.get(models.User, host_id)
    host.is_superhost = n >= SUPERHOST_MIN_REVIEWS and (avg or 0) >= SUPERHOST_MIN_RATING
