// Experiences and services are "coming soon" placeholders (the assignment is about stays), so their
// pages run on hardcoded data: Unsplash photos with made-up hosts. Location-based results are out
// of scope, so the "nearby" area is fixed.

export const NEARBY_AREA = "Gurgaon District";

/** One experience or service card. */
export type Offer = {
  id: string;
  title: string;
  price: number;
  per: "guest" | "group";
  rating?: number; // new listings have no rating yet
  badge?: string; // "Popular", "Trending", "Original", "5pm", "Sat · 9am"...
  location?: string; // shown on Airbnb Originals
  photo: string;
};

export const unsplash = (id: string, w = 600, h = 570) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&h=${h}&q=70`;

export type OfferRow = [title: string, price: number, rating: number | undefined, photo: string, badge?: string, per?: Offer["per"], location?: string];

/** Compact row tuples -> Offer objects (keeps the data files readable). */
export const offers = (prefix: string, list: OfferRow[]): Offer[] =>
  list.map(([title, price, rating, photo, badge, per = "guest", location], i) => ({
    id: `${prefix}-${i}`, title, price, per, rating, badge, location, photo: unsplash(`photo-${photo}`),
  }));
