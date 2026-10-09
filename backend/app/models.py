from datetime import date, datetime, timezone
from sqlalchemy import (
    DDL, CheckConstraint, Column, ForeignKey, Index, Table, String, Integer, Float, Boolean, Date,
    DateTime, Text, event,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base

def utcnow() -> datetime:
    """Naive UTC timestamp (SQLite has no time zones); replaces the deprecated datetime.utcnow."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


# many-to-many: listings <-> amenities
listing_amenities = Table(
    "listing_amenities",
    Base.metadata,
    Column("listing_id", ForeignKey("listings.id", ondelete="CASCADE"), primary_key=True),
    Column("amenity_id", ForeignKey("amenities.id", ondelete="CASCADE"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(150), unique=True)
    avatar_url: Mapped[str] = mapped_column(String(300), default="")
    role: Mapped[str] = mapped_column(String(10), default="guest")  # guest | host
    # Cached aggregate, recomputed by services.refresh_superhost whenever a review lands.
    is_superhost: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    listings = relationship("Listing", back_populates="host")

    __table_args__ = (CheckConstraint("role IN ('guest', 'host')", name="ck_user_role"),)


class Listing(Base):
    __tablename__ = "listings"
    id: Mapped[int] = mapped_column(primary_key=True)
    host_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    property_type: Mapped[str] = mapped_column(String(50), index=True)  # House, Apartment, Cabin...
    category: Mapped[str] = mapped_column(String(50), index=True)  # Beachfront, Cabins, Trending...
    city: Mapped[str] = mapped_column(String(100), index=True)
    country: Mapped[str] = mapped_column(String(100))
    lat: Mapped[float] = mapped_column(Float, default=0)
    lng: Mapped[float] = mapped_column(Float, default=0)
    price_per_night: Mapped[int] = mapped_column(Integer)
    cleaning_fee: Mapped[int] = mapped_column(Integer, default=0)
    max_guests: Mapped[int] = mapped_column(Integer, default=2)
    bedrooms: Mapped[int] = mapped_column(Integer, default=1)
    beds: Mapped[int] = mapped_column(Integer, default=1)
    bathrooms: Mapped[int] = mapped_column(Integer, default=1)
    # False = archived by the host: hidden from search, but past trips and reviews keep pointing at it.
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    host = relationship("User", back_populates="listings")
    photos = relationship(
        "ListingPhoto", cascade="all, delete-orphan", order_by="ListingPhoto.position"
    )
    amenities = relationship("Amenity", secondary=listing_amenities)
    reviews = relationship("Review", cascade="all, delete-orphan", order_by="Review.created_at.desc()")
    bookings = relationship("Booking", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("price_per_night > 0", name="ck_listing_price"),
        CheckConstraint("max_guests >= 1", name="ck_listing_guests"),
    )


class ListingPhoto(Base):
    __tablename__ = "listing_photos"
    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"), index=True)
    url: Mapped[str] = mapped_column(String(500))
    position: Mapped[int] = mapped_column(Integer, default=0)


class Amenity(Base):
    __tablename__ = "amenities"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True)
    icon: Mapped[str] = mapped_column(String(40), default="")


class Booking(Base):
    __tablename__ = "bookings"
    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"))
    guest_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    check_in: Mapped[date] = mapped_column(Date)
    check_out: Mapped[date] = mapped_column(Date)  # exclusive: guest leaves this morning
    guests: Mapped[int] = mapped_column(Integer, default=1)
    nightly_rate: Mapped[int] = mapped_column(Integer)  # snapshot at booking time
    cleaning_fee: Mapped[int] = mapped_column(Integer, default=0)
    service_fee: Mapped[int] = mapped_column(Integer, default=0)
    total: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(15), default="confirmed")  # confirmed | cancelled
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    listing = relationship("Listing", back_populates="bookings")
    guest = relationship("User")

    __table_args__ = (
        Index("ix_booking_listing_dates", "listing_id", "check_in", "check_out"),
        CheckConstraint("check_out > check_in", name="ck_booking_dates"),
        CheckConstraint("status IN ('confirmed', 'cancelled')", name="ck_booking_status"),
    )


# Last line of defence against double-booking: SQLite runs writes one at a time, so this
# check-and-insert is atomic even if two requests pass the API's availability check together.
event.listen(Booking.__table__, "after_create", DDL("""
CREATE TRIGGER IF NOT EXISTS trg_bookings_no_overlap
BEFORE INSERT ON bookings
WHEN NEW.status = 'confirmed' AND EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.listing_id = NEW.listing_id AND b.status = 'confirmed'
      AND b.check_in < NEW.check_out AND b.check_out > NEW.check_in
)
BEGIN
    SELECT RAISE(ABORT, 'booking_overlap');
END
"""))


class Review(Base):
    __tablename__ = "reviews"
    id: Mapped[int] = mapped_column(primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"), index=True)
    guest_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    # One review per completed stay. Nullable so seeded reviews need no booking behind them.
    booking_id: Mapped[int | None] = mapped_column(
        ForeignKey("bookings.id", ondelete="SET NULL"), unique=True, nullable=True
    )
    rating: Mapped[int] = mapped_column(Integer)  # 1-5
    comment: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    guest = relationship("User")

    __table_args__ = (CheckConstraint("rating BETWEEN 1 AND 5", name="ck_review_rating"),)


class Wishlist(Base):
    __tablename__ = "wishlist"
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    listing_id: Mapped[int] = mapped_column(ForeignKey("listings.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
