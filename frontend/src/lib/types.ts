export interface User {
  id: number; name: string; email: string; avatar_url: string;
  role: "guest" | "host"; is_superhost: boolean; created_at: string;
  date_of_birth?: string | null;
  /** false until the "Let's create your account" step is done (new email sign-ups only). */
  account_complete?: boolean;
}

export interface ListingCardData {
  id: number; title: string; city: string; country: string;
  property_type: string; room_type: "entire" | "room" | "shared"; category: string; price_per_night: number; discount_pct: number;
  cover_url: string; photo_urls: string[];
  rating: number | null; review_count: number; is_superhost: boolean;
  lat: number; lng: number; wishlisted: boolean; is_active: boolean;
}

export interface ListingPage {
  items: ListingCardData[]; page: number; has_more: boolean; total: number;
}

export interface Amenity { id: number; name: string; icon: string }
export interface Photo { id: number; url: string; position: number }
export interface Review { id: number; rating: number; comment: string; created_at: string; guest: User }

export interface HostListing extends ListingCardData { upcoming_bookings: number }

export interface ListingDetail extends ListingCardData {
  description: string; precise_location: boolean; cleaning_fee: number; max_guests: number;
  bedrooms: number; beds: number; bathrooms: number;
  host: User; photos: Photo[]; amenities: Amenity[]; reviews: Review[];
}

export interface Quote {
  nights: number; nightly_rate: number; subtotal: number; discount: number;
  cleaning_fee: number; service_fee: number; total: number;
}

export interface Booking {
  id: number; listing_id: number; check_in: string; check_out: string; guests: number;
  nightly_rate: number; discount: number; cleaning_fee: number; service_fee: number; total: number;
  status: "confirmed" | "cancelled"; message: string; created_at: string;
}
export interface Trip extends Booking { listing: ListingCardData; reviewed: boolean }

export interface HostBooking extends Booking { guest: User; listing_title: string }

export interface ChatMessage { id: number; sender_id: number; body: string; created_at: string }
export interface Conversation {
  id: number;
  listing: { id: number; title: string; city: string; cover_url: string; is_active: boolean };
  other: User;                       // the person you're talking to
  last_message: ChatMessage | null;
  unread: number;
  stay: { check_in: string; check_out: string; status: "confirmed" | "cancelled" } | null;
}
export interface ConversationDetail extends Conversation { messages: ChatMessage[] }

export type PublicUser = Pick<User, "id" | "name" | "avatar_url" | "role" | "is_superhost" | "created_at">;
export interface ProfileReview {
  id: number; rating: number; comment: string; created_at: string;
  guest: PublicUser; listing_id: number; listing_title: string;
}
export interface PublicProfile {
  user: PublicUser; listings: ListingCardData[]; reviews: ProfileReview[];
  review_count: number; rating: number | null;
}
