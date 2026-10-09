export interface User {
  id: number; name: string; email: string; avatar_url: string;
  role: "guest" | "host"; is_superhost: boolean;
}

export interface ListingCardData {
  id: number; title: string; city: string; country: string;
  property_type: string; category: string; price_per_night: number;
  cover_url: string; photo_urls: string[];
  rating: number | null; review_count: number; is_superhost: boolean;
  lat: number; lng: number; wishlisted: boolean;
}

export interface ListingPage {
  items: ListingCardData[]; page: number; has_more: boolean; total: number;
}

export interface Amenity { id: number; name: string; icon: string }
export interface Photo { id: number; url: string; position: number }
export interface Review { id: number; rating: number; comment: string; created_at: string; guest: User }

export interface ListingDetail extends ListingCardData {
  description: string; cleaning_fee: number; max_guests: number;
  bedrooms: number; beds: number; bathrooms: number;
  host: User; photos: Photo[]; amenities: Amenity[]; reviews: Review[];
}

export interface Quote {
  nights: number; nightly_rate: number; subtotal: number;
  cleaning_fee: number; service_fee: number; total: number;
}

export interface Booking {
  id: number; listing_id: number; check_in: string; check_out: string; guests: number;
  nightly_rate: number; cleaning_fee: number; service_fee: number; total: number;
  status: "confirmed" | "cancelled"; created_at: string;
}
export interface Trip extends Booking { listing: ListingCardData }

export interface HostBooking extends Booking { guest: User; listing_title: string }
