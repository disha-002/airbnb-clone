from datetime import date, datetime
from typing import Literal, Optional
from typing import Annotated
from pydantic import BaseModel, ConfigDict, Field, StringConstraints


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class UserOut(ORM):
    id: int
    name: str
    email: str
    avatar_url: str
    role: str
    is_superhost: bool
    created_at: datetime  # "hosting since"
    date_of_birth: Optional[date] = None
    account_complete: bool = True


class AccountIn(BaseModel):
    """The "Let's create your account" form."""
    first_name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50)]
    last_name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50)]
    date_of_birth: date
    marketing_opt_out: bool = False


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
    room_type: str = "entire"
    category: str
    price_per_night: int
    discount_pct: int = 0
    cover_url: str
    photo_urls: list[str]
    rating: Optional[float]
    review_count: int
    is_superhost: bool
    lat: float
    lng: float
    wishlisted: bool = False
    is_active: bool = True


class PublicUser(ORM):
    """What anyone may see about another user: no email or birthday."""
    id: int
    name: str
    avatar_url: str
    role: str
    is_superhost: bool
    created_at: datetime


class ProfileReview(BaseModel):
    id: int
    rating: int
    comment: str
    created_at: datetime
    guest: PublicUser
    listing_id: int
    listing_title: str


class PublicProfile(BaseModel):
    """GET /users/{id}/profile: the page you reach by clicking a host's photo."""
    user: PublicUser
    listings: list["ListingCard"]
    reviews: list[ProfileReview]  # newest first, reviews guests left on this host's listings
    review_count: int
    rating: Optional[float]


class ListingPage(BaseModel):
    items: list[ListingCard]
    page: int
    has_more: bool
    total: int


class HostListingOut(ListingCard):
    upcoming_bookings: int


class ListingDetail(ListingCard):
    description: str
    precise_location: bool
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
    room_type: Literal["entire", "room", "shared"] = "entire"
    category: str
    city: str
    country: str
    lat: float = 0
    lng: float = 0
    precise_location: bool = True
    price_per_night: int = Field(gt=0)
    cleaning_fee: int = Field(ge=0, default=0)
    discount_pct: int = Field(ge=0, le=90, default=0)  # special offer, % off the nightly price
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
    subtotal: int  # before the special offer
    discount: int = 0
    cleaning_fee: int
    service_fee: int
    total: int


class BookingIn(BaseModel):
    listing_id: int
    check_in: date
    check_out: date
    guests: int = Field(ge=1)
    # Airbnb won't let you pay without messaging the host first.
    message: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=1000)]


class BookingOut(ORM):
    id: int
    listing_id: int
    check_in: date
    check_out: date
    guests: int
    nightly_rate: int
    discount: int = 0
    cleaning_fee: int
    service_fee: int
    total: int
    status: str
    message: str = ""
    created_at: datetime


class TripOut(BookingOut):
    listing: ListingCard
    reviewed: bool


class HostBookingOut(BookingOut):
    guest: UserOut
    listing_title: str


class MessageIn(BaseModel):
    body: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)]


class ConversationStart(MessageIn):
    listing_id: int


class MessageOut(ORM):
    id: int
    sender_id: int
    body: str
    created_at: datetime


class ConversationListing(ORM):
    id: int
    title: str
    city: str
    cover_url: str
    is_active: bool


class ConversationStay(BaseModel):
    """The guest's latest booking on this listing, shown under the thread header."""
    check_in: date
    check_out: date
    status: str


class ConversationOut(BaseModel):
    id: int
    listing: ConversationListing
    other: UserOut  # the person you're talking to
    last_message: Optional[MessageOut] = None
    unread: int = 0
    stay: Optional[ConversationStay] = None


class ConversationDetail(ConversationOut):
    messages: list[MessageOut]
