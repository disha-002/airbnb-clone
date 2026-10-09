from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session
from .. import models, schemas, services
from ..database import get_db
from ..deps import require_host

router = APIRouter(prefix="/host", tags=["host"])


def _owned(db: Session, listing_id: int, host: models.User) -> models.Listing:
    l = db.get(models.Listing, listing_id)
    if not l or l.host_id != host.id or not l.is_active:
        raise HTTPException(404, "Listing not found")
    return l


def _apply(db: Session, l: models.Listing, body: schemas.ListingIn):
    data = body.model_dump(exclude={"photo_urls", "amenity_ids"})
    for k, v in data.items():
        setattr(l, k, v)
    l.photos = [models.ListingPhoto(url=u, position=i) for i, u in enumerate(body.photo_urls)]
    l.amenities = list(db.scalars(select(models.Amenity).where(models.Amenity.id.in_(body.amenity_ids))))


@router.get("/listings", response_model=list[schemas.HostListingOut])
def my_listings(db: Session = Depends(get_db), host: models.User = Depends(require_host)):
    rows = db.scalars(
        select(models.Listing)
        .where(models.Listing.host_id == host.id, models.Listing.is_active)
        .order_by(models.Listing.created_at.desc())
    ).all()
    return [
        schemas.HostListingOut(**c.model_dump(), upcoming_bookings=services.upcoming_booking_count(db, c.id))
        for c in services.to_cards(db, rows, host)
    ]


@router.post("/listings", response_model=schemas.ListingCard, status_code=201)
def create_listing(
    body: schemas.ListingIn, db: Session = Depends(get_db), host: models.User = Depends(require_host)
):
    l = models.Listing(host_id=host.id)
    _apply(db, l, body)
    db.add(l)
    db.commit()
    db.refresh(l)
    return services.to_cards(db, [l], host)[0]


@router.put("/listings/{listing_id}", response_model=schemas.ListingCard)
def update_listing(
    listing_id: int, body: schemas.ListingIn,
    db: Session = Depends(get_db), host: models.User = Depends(require_host),
):
    l = _owned(db, listing_id, host)
    _apply(db, l, body)
    db.commit()
    db.refresh(l)
    return services.to_cards(db, [l], host)[0]


@router.delete("/listings/{listing_id}", status_code=204)
def delete_listing(
    listing_id: int, db: Session = Depends(get_db), host: models.User = Depends(require_host)
):
    """Mirrors Airbnb: a listing with upcoming reservations can't be removed until they're cancelled.
    Otherwise it's archived (soft-deleted) so past trips and reviews keep their listing."""
    l = _owned(db, listing_id, host)
    upcoming = services.upcoming_booking_count(db, l.id)
    if upcoming:
        raise HTTPException(
            409, f"This listing has {upcoming} upcoming reservation{'s' if upcoming > 1 else ''}. "
                 "They must be completed or cancelled before you can remove it.",
        )
    l.is_active = False
    db.execute(delete(models.Wishlist).where(models.Wishlist.listing_id == l.id))
    db.commit()


@router.get("/bookings", response_model=list[schemas.HostBookingOut])
def host_bookings(db: Session = Depends(get_db), host: models.User = Depends(require_host)):
    rows = db.scalars(
        select(models.Booking)
        .join(models.Listing)
        .where(models.Listing.host_id == host.id)
        .order_by(models.Booking.check_in.desc())
    ).all()
    return [
        schemas.HostBookingOut(
            **schemas.BookingOut.model_validate(b).model_dump(),
            guest=b.guest, listing_title=b.listing.title,
        )
        for b in rows
    ]
