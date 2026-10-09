from datetime import date
from typing import Optional
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
    page_size: int = Query(12, ge=1, le=48),
    db: Session = Depends(get_db),
    user: models.User | None = Depends(get_optional_user),
):
    L = models.Listing
    stmt = select(L).where(L.max_guests >= guests)
    if q:
        like = f"%{q.strip()}%"
        stmt = stmt.where(or_(L.city.ilike(like), L.country.ilike(like), L.title.ilike(like)))
    if min_price is not None:
        stmt = stmt.where(L.price_per_night >= min_price)
    if max_price is not None:
        stmt = stmt.where(L.price_per_night <= max_price)
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
        description=l.description, cleaning_fee=l.cleaning_fee, max_guests=l.max_guests,
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
    """Bonus: only guests with a completed stay may review."""
    completed = db.scalar(
        select(models.Booking.id).where(
            models.Booking.listing_id == listing_id,
            models.Booking.guest_id == user.id,
            models.Booking.status == "confirmed",
            models.Booking.check_out <= date.today(),
        ).limit(1)
    )
    if not completed:
        raise HTTPException(403, "You can review only after a completed stay")
    r = models.Review(listing_id=listing_id, guest_id=user.id, **body.model_dump())
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


@router.get("/amenities", response_model=list[schemas.AmenityOut])
def list_amenities(db: Session = Depends(get_db)):
    return db.scalars(select(models.Amenity).order_by(models.Amenity.name)).all()


@router.get("/users", response_model=list[schemas.UserOut])
def list_users(db: Session = Depends(get_db)):
    """Used by the mock 'switch user' menu."""
    return db.scalars(select(models.User)).all()
