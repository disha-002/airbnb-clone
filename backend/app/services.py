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


def offer_discount(amount: int, pct: int) -> int:
    """Special-offer discount in whole rupees, rounding .5 up (the frontend's Math.round does the same,
    so cards, quotes and checkout always agree)."""
    return (amount * pct + 50) // 100


def offer_price_sql(listing=models.Listing):
    """The nightly price guests actually see (after the special offer), as a SQL expression for filtering."""
    return listing.price_per_night - (listing.price_per_night * listing.discount_pct + 50) / 100


def make_quote(listing: models.Listing, check_in: date, check_out: date) -> schemas.Quote:
    """Nightly subtotal, minus the host's special offer, plus cleaning and a service fee on the discounted stay."""
    nights = (check_out - check_in).days
    subtotal = nights * listing.price_per_night
    discount = offer_discount(subtotal, listing.discount_pct)
    service = round((subtotal - discount) * SERVICE_FEE_RATE)
    return schemas.Quote(
        nights=nights,
        nightly_rate=listing.price_per_night,
        subtotal=subtotal,
        discount=discount,
        cleaning_fee=listing.cleaning_fee,
        service_fee=service,
        total=subtotal - discount + listing.cleaning_fee + service,
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
        property_type=l.property_type, room_type=l.room_type, category=l.category,
        price_per_night=l.price_per_night, discount_pct=l.discount_pct, cover_url=urls[0] if urls else "",
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


# ---------------------------------------------------------------------------------------------
# Messaging: one conversation per (listing, guest), shared by that guest and the listing's host.
# ---------------------------------------------------------------------------------------------

def get_or_create_conversation(db: Session, listing: models.Listing, guest: models.User) -> models.Conversation:
    convo = db.scalar(select(models.Conversation).where(
        models.Conversation.listing_id == listing.id, models.Conversation.guest_id == guest.id))
    if not convo:
        convo = models.Conversation(listing_id=listing.id, guest_id=guest.id, host_id=listing.host_id)
        db.add(convo)
        db.flush()
    return convo


def post_message(db: Session, convo: models.Conversation, sender: models.User, body: str,
                 at=None) -> models.Message:
    """Adds a message and counts it as read by its sender."""
    msg = models.Message(conversation_id=convo.id, sender_id=sender.id, body=body, created_at=at or models.utcnow())
    db.add(msg)
    if sender.id == convo.guest_id:
        convo.guest_last_read_at = msg.created_at
    else:
        convo.host_last_read_at = msg.created_at
    db.flush()
    return msg


def mark_read(convo: models.Conversation, viewer: models.User) -> None:
    now = models.utcnow()
    if viewer.id == convo.guest_id:
        convo.guest_last_read_at = now
    else:
        convo.host_last_read_at = now


def unread_in(db: Session, convo: models.Conversation, viewer: models.User) -> int:
    seen = convo.guest_last_read_at if viewer.id == convo.guest_id else convo.host_last_read_at
    q = select(func.count()).where(models.Message.conversation_id == convo.id, models.Message.sender_id != viewer.id)
    if seen is not None:
        q = q.where(models.Message.created_at > seen)
    return db.scalar(q)


def conversation_out(db: Session, convo: models.Conversation, viewer: models.User, with_messages: bool = False):
    last = convo.messages[-1] if convo.messages else None
    stay = db.scalar(
        select(models.Booking)
        .where(models.Booking.listing_id == convo.listing_id, models.Booking.guest_id == convo.guest_id)
        .order_by(models.Booking.created_at.desc())
    )
    fields = dict(
        id=convo.id,
        listing=schemas.ConversationListing(
            id=convo.listing.id, title=convo.listing.title, city=convo.listing.city,
            cover_url=convo.listing.photos[0].url if convo.listing.photos else "", is_active=convo.listing.is_active),
        other=convo.host if viewer.id == convo.guest_id else convo.guest,
        last_message=last,
        unread=unread_in(db, convo, viewer),
        stay=schemas.ConversationStay(check_in=stay.check_in, check_out=stay.check_out, status=stay.status) if stay else None,
    )
    if with_messages:
        return schemas.ConversationDetail(**fields, messages=convo.messages)
    return schemas.ConversationOut(**fields)


def backfill_booking_messages(db: Session) -> int:
    """Turns each booking's note to the host into the first message of its conversation, for databases
    that have bookings from before messaging existed. Safe to run on every start."""
    made = 0
    for b in db.scalars(select(models.Booking).where(models.Booking.message != "").order_by(models.Booking.created_at)):
        exists = db.scalar(select(models.Conversation.id).where(
            models.Conversation.listing_id == b.listing_id, models.Conversation.guest_id == b.guest_id))
        if exists:
            continue
        convo = get_or_create_conversation(db, b.listing, b.guest)
        post_message(db, convo, b.guest, b.message, at=b.created_at)
        convo.host_last_read_at = None  # the host hasn't read it yet
        made += 1
    db.commit()
    return made
