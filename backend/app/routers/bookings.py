from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from .. import models, schemas, services
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(tags=["bookings"])


@router.post("/bookings", response_model=schemas.BookingOut, status_code=201)
def create_booking(
    body: schemas.BookingIn,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    listing = db.get(models.Listing, body.listing_id)
    if not listing or not listing.is_active:
        raise HTTPException(404, "Listing not found")
    if listing.host_id == user.id:
        raise HTTPException(400, "You cannot book your own listing")
    services.validate_dates(body.check_in, body.check_out)
    if body.guests > listing.max_guests:
        raise HTTPException(422, f"This place allows at most {listing.max_guests} guests")
    if not services.is_available(db, listing.id, body.check_in, body.check_out):
        raise HTTPException(409, "Those dates are no longer available")

    q = services.make_quote(listing, body.check_in, body.check_out)
    booking = models.Booking(
        listing_id=listing.id, guest_id=user.id,
        check_in=body.check_in, check_out=body.check_out, guests=body.guests,
        nightly_rate=q.nightly_rate, cleaning_fee=q.cleaning_fee,
        service_fee=q.service_fee, total=q.total, status="confirmed",
    )  # mocked payment: always succeeds
    db.add(booking)
    try:
        db.commit()
    except IntegrityError:  # lost a race to another booking: the overlap trigger fired
        db.rollback()
        raise HTTPException(409, "Those dates are no longer available")
    db.refresh(booking)
    return booking


@router.get("/trips", response_model=list[schemas.TripOut])
def my_trips(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    bookings = db.scalars(
        select(models.Booking)
        .where(models.Booking.guest_id == user.id)
        .order_by(models.Booking.check_in.desc())
    ).all()
    cards = {c.id: c for c in services.to_cards(db, [b.listing for b in bookings], user)}
    reviewed = set(db.scalars(
        select(models.Review.booking_id).where(models.Review.booking_id.in_([b.id for b in bookings]))
    ))
    return [
        schemas.TripOut(
            **schemas.BookingOut.model_validate(b).model_dump(),
            listing=cards[b.listing_id], reviewed=b.id in reviewed,
        )
        for b in bookings
    ]


@router.delete("/bookings/{booking_id}", response_model=schemas.BookingOut)
def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """Soft-cancel: row is kept, dates are freed (overlap check ignores cancelled)."""
    b = db.get(models.Booking, booking_id)
    if not b or b.guest_id != user.id:
        raise HTTPException(404, "Booking not found")
    if b.status == "cancelled":
        raise HTTPException(409, "This booking is already cancelled")
    if b.check_in <= date.today():
        raise HTTPException(409, "Trips that have already started can't be cancelled")
    b.status = "cancelled"
    db.commit()
    db.refresh(b)
    return b
