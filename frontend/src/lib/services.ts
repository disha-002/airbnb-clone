import { offers, type Offer } from "./offers";

export type ServiceCategory = { key: string; label: string; icon: string };

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  { key: "photography", label: "Photography", icon: "/icons/services/photography.png" },
  { key: "chefs", label: "Chefs", icon: "/icons/services/chefs.png" },
  { key: "training", label: "Training", icon: "/icons/services/training.png" },
  { key: "makeup", label: "Make-up", icon: "/icons/services/makeup.png" },
  { key: "hair", label: "Hair", icon: "/icons/services/hair.png" },
];

// Airbnb's services page shows a carousel for these categories (Chefs only appears as a tile).
export const SERVICE_ROWS: { category: ServiceCategory; services: Offer[] }[] = [
  {
    category: SERVICE_CATEGORIES[0],
    services: offers("photography", [
      ["New Delhi photo session by a female photographer", 8500, 5.0, "1540076156429-35ffe82b7870", "Popular"],
      ["Candid travel portraits by Aarav", 8000, 5.0, "1539464443546-5e3512c46694"],
      ["Cinematic photo stories by Kabir", 5000, 5.0, "1496156555893-ce6408188e2c", undefined, "group"],
      ["Heritage and travel photos by Imran", 7000, undefined, "1726766406089-0308c800b6b2"],
      ["Corporate portraits by Vikram", 4000, undefined, "1612991237712-49b879f27a48"],
      ["Candid outdoor portraits by Meera", 6175, undefined, "1622503958522-9f847e7e18de"],
      ["Professional photo shoot in Delhi", 7200, 4.9, "1600038937815-57cbbba6ba7d"],
      ["Golden-hour couple shoot by Rohan", 6500, 4.95, "1576299657860-bd5eb28ceca7", "Popular", "group"],
      ["Street style portraits by Nisha", 5500, 4.88, "1542301456267-bf7db60bb9cd"],
    ]),
  },
  {
    category: SERVICE_CATEGORIES[2],
    services: offers("training", [
      ["Strength training sessions by Arjun", 2500, 5.0, "1571019614242-c5c5dee9f50b", "Popular"],
      ["HIIT workouts with Sana", 1800, 4.96, "1534258936925-c58bed479fcb"],
      ["Personal fitness coaching by Dev", 3000, 5.0, "1758875570137-8691b7c55033"],
      ["Weightlifting basics with Kunal", 2200, undefined, "1517838277536-f5f99be501cd"],
      ["Functional training by Priya", 2000, 4.9, "1758875569256-f37c438cac65", undefined, "group"],
      ["Core and mobility sessions by Ritu", 1500, undefined, "1776710669732-177e69dd582d"],
      ["Group bootcamp with Aman", 1200, 4.85, "1554284126-aa88f22d8b74", "Popular"],
      ["Partner workouts by Ishaan", 2800, 5.0, "1648542036561-e1d66a5ae2b1", undefined, "group"],
      ["Boxing fitness with Tara", 2400, undefined, "1519311965067-36d3e5f33d39"],
    ]),
  },
  {
    category: SERVICE_CATEGORIES[3],
    services: offers("makeup", [
      ["Bridal and party make-up by Ananya", 9000, 5.0, "1758613653858-a6edc4b690b4", "Popular"],
      ["Glam eye looks by Zoya", 4500, 4.97, "1762917903698-b55bf231c817"],
      ["Natural everyday make-up by Kavya", 3000, undefined, "1709477542149-f4e0e21d590b"],
      ["Editorial make-up by Riya", 6000, 5.0, "1758739010986-cbcd556b34ec"],
      ["Bold lip and evening looks by Simran", 3500, 4.9, "1594465919760-441fe5908ab0"],
      ["Lash and brow styling by Neha", 2500, undefined, "1772236617396-2f8460293c07"],
      ["Photo-ready make-up by Aditi", 5000, 4.92, "1709477542170-f11ee7d471a0", "Popular"],
      ["Grooming for men by Farhan", 2800, undefined, "1758613655900-61957c2aca5d"],
      ["Make-up lesson with Pooja", 4000, 5.0, "1596704017254-9b121068fb31", undefined, "group"],
    ]),
  },
  {
    category: SERVICE_CATEGORIES[4],
    services: offers("hair", [
      ["Haircut and styling by Tanvi", 2500, 5.0, "1634449571010-02389ed0f9b0", "Popular"],
      ["Blow-dry and waves by Isha", 2000, 4.95, "1580618672591-eb180b1a973f"],
      ["Classic barber cuts by Salman", 1200, 4.9, "1761931403671-d020a14928d9"],
      ["Curls and updos by Mahi", 3500, undefined, "1560869713-7d0a29430803"],
      ["Beard trim and shave by Yusuf", 900, 5.0, "1599351431202-1e0f0137899a"],
      ["Men's styling by Karan", 1500, undefined, "1605497788044-5a32c7078486"],
      ["Curly hair care by Leela", 2800, 4.88, "1787616291784-0de8970e3ad4", "Popular"],
      ["Colour and gloss by Shreya", 4500, undefined, "1595475884562-073c30d45670"],
      ["Event hair styling by Nidhi", 3000, 5.0, "1522337360788-8b13dee7a37e", undefined, "group"],
    ]),
  },
];
