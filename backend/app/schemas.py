from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class UserOut(ORM):
    id: int
    name: str
    email: str
    avatar_url: str
    role: str
    is_superhost: bool


class AmenityOut(ORM):
    id: int
    name: str
    icon: str


class PhotoOut(ORM):
    id: int
    url: str
    position: int


class ReviewOut(ORM):
    id: int
    rating: int
    comment: str
    created_at: datetime
    guest: UserOut


class ReviewIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str = ""


class ListingCard(BaseModel):
    id: int
    title: str
    city: str
    country: str
    property_type: str
    category: str
    price_per_night: int
    cover_url: str
    photo_urls: list[str]
    rating: Optional[float]
    review_count: int
    is_superhost: bool
    lat: float
    lng: float
    wishlisted: bool = False
    is_active: bool = True


class ListingPage(BaseModel):
    items: list[ListingCard]
    page: int
    has_more: bool
    total: int


class HostListingOut(ListingCard):
    upcoming_bookings: int


class ListingDetail(ListingCard):
    description: str
    cleaning_fee: int
    max_guests: int
    bedrooms: int
    beds: int
    bathrooms: int
    host: UserOut
    photos: list[PhotoOut]
    amenities: list[AmenityOut]
    reviews: list[ReviewOut]


class ListingIn(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str
    property_type: str
    category: str
    city: str
    country: str
    lat: float = 0
    lng: float = 0
    price_per_night: int = Field(gt=0)
    cleaning_fee: int = Field(ge=0, default=0)
    max_guests: int = Field(ge=1, default=2)
    bedrooms: int = Field(ge=0, default=1)
    beds: int = Field(ge=1, default=1)
    bathrooms: int = Field(ge=0, default=1)
    photo_urls: list[str] = Field(min_length=1)
    amenity_ids: list[int] = []


class BookedRange(BaseModel):
    check_in: date
    check_out: date


class Quote(BaseModel):
    nights: int
    nightly_rate: int
    subtotal: int
    cleaning_fee: int
    service_fee: int
    total: int


class BookingIn(BaseModel):
    listing_id: int
    check_in: date
    check_out: date
    guests: int = Field(ge=1)


class BookingOut(ORM):
    id: int
    listing_id: int
    check_in: date
    check_out: date
    guests: int
    nightly_rate: int
    cleaning_fee: int
    service_fee: int
    total: int
    status: str
    created_at: datetime


class TripOut(BookingOut):
    listing: ListingCard
    reviewed: bool


class HostBookingOut(BookingOut):
    guest: UserOut
    listing_title: str
