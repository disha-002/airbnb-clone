export const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Price for `nights` after the listing's special offer (same rounding as the backend quote). */
export const offerPrice = (l: { price_per_night: number; discount_pct: number }, nights = 1) => {
  const full = l.price_per_night * nights;
  return full - Math.round((full * l.discount_pct) / 100);
};

const ENTIRE: Record<string, string> = {
  Room: "Room", Flat: "Entire rental unit", Apartment: "Entire rental unit", "Flat/apartment": "Entire rental unit",
  Home: "Entire home", House: "Entire home", Villa: "Entire villa", Cabin: "Entire cabin",
};

/** Airbnb's "what you get" wording: "Entire home", "Room", "Shared room", "Entire tree house"... */
export function placeLabel(propertyType: string, roomType = "entire"): string {
  if (roomType === "room") return "Room";
  if (roomType === "shared") return "Shared room";
  return ENTIRE[propertyType] ?? `Entire ${propertyType.toLowerCase()}`;
}
