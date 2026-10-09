from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from .. import models, schemas, services
from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


@router.get("", response_model=list[schemas.ListingCard])
def get_wishlist(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    rows = db.scalars(
        select(models.Listing)
        .join(models.Wishlist)
        .where(models.Wishlist.user_id == user.id, models.Listing.is_active)
        .order_by(models.Wishlist.created_at.desc())
    ).all()
    return services.to_cards(db, rows, user)


@router.post("/{listing_id}", status_code=204)
def add(listing_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    listing = db.get(models.Listing, listing_id)
    if not listing or not listing.is_active:
        raise HTTPException(404, "Listing not found")
    if not db.get(models.Wishlist, (user.id, listing_id)):
        db.add(models.Wishlist(user_id=user.id, listing_id=listing_id))
        db.commit()


@router.delete("/{listing_id}", status_code=204)
def remove(listing_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    row = db.get(models.Wishlist, (user.id, listing_id))
    if row:
        db.delete(row)
        db.commit()
