import { NEARBY_AREA, offers, unsplash, type Offer } from "./offers";

/** Square tiles in the "Explore experiences nearby" row on the All tab. */
export const EXPERIENCE_CATEGORIES = [
  { label: "Cultural tours", photo: unsplash("photo-1477587458883-47145ed94245", 400, 400) },
  { label: "Landmarks", photo: unsplash("photo-1506462945848-ac8ea6f609cc", 400, 400) },
  { label: "Food tours", photo: unsplash("photo-1714892208649-7fb5fce74231", 400, 400) },
  { label: "Art workshops", photo: unsplash("photo-1595351298020-038700609878", 400, 400) },
  { label: "Cooking", photo: unsplash("photo-1683105555403-4c4cae4e2298", 400, 400) },
  { label: "Shopping & fashion", photo: unsplash("photo-1685883518161-63ccb05aef83", 400, 400) },
  { label: "Museums", photo: unsplash("photo-1544213456-bc37cb97df74", 400, 400) },
];

export type ExperienceRow = { key: string; title: string; subtitle?: string; items: Offer[] };

// The Experiences tab, top to bottom. `POPULAR_FROM` marks where the big
// "Popular with travellers from your area" heading goes.
export const EXPERIENCE_ROWS: ExperienceRow[] = [
  {
    key: "today",
    title: `Happening today in ${NEARBY_AREA}`,
    items: offers("today", [
      ["Old Delhi street food and spice market walk", 3000, 5.0, "1714892208649-7fb5fce74231", "5pm"],
      ["Old Delhi's food, temples and spice lanes", 2999, 5.0, "1760262492874-80283261b99c", "12:30pm"],
      ["Hidden gems of Old Delhi by tuk-tuk", 1900, 5.0, "1760780311645-7a1ef2920deb", "11am"],
      ["Hand-block printing workshop in Delhi", 6000, 5.0, "1781389004999-d1a7e41639c5", "1pm"],
      ["Explore Delhi's street food", 2500, 5.0, "1705760710870-4c2f1e3fed87", "4:30pm"],
      ["Cook and explore Indian food in a local home", 2850, 4.98, "1683633815082-783838d0dfe0", "4pm"],
      ["Chandni Chowk snack trail", 1500, 4.95, "1788620195664-bef14ea327a9", "6pm"],
      ["Pottery on the wheel for beginners", 2200, 4.9, "1609881583302-61548332039c", "3pm"],
    ]),
  },
  {
    key: "weekend",
    title: "Experiences this weekend",
    items: offers("weekend", [
      ["Same-day Taj Mahal and Agra Fort tour from Delhi", 4500, 4.91, "1526711657229-e7e080ed7aa1", "Sat · 2:30am"],
      ["Old Delhi food, temples and rickshaw ride", 4999, 5.0, "1760782065835-a6a5e06509c3", "Sat · 9am"],
      ["Old Delhi with her: food, faith and culture", 2699, 5.0, "1760262491785-4c4adcf649e8", "Sat · 9:30am"],
      ["Old and New Delhi monuments with a guide", 3600, 4.99, "1578909516849-bced8d0ef3e0", "Sat · 8:30am"],
      ["Taj Mahal and Agra Fort with a local guide", 3700, 5.0, "1506462945848-ac8ea6f609cc", "Sat · 3am"],
      ["Uncover Old and New Delhi with a local", 1200, 5.0, "1760782062954-245cf7cba69b", "Sun · 10:15am"],
      ["Sunrise at the Taj with a photographer", 5200, 4.97, "1592635196078-9fdc757f27f4", "Sun · 4am"],
      ["Weekend cooking class: North Indian thali", 3200, 4.93, "1752658512555-18156655f30e", "Sun · 11am"],
    ]),
  },
  {
    key: "originals",
    title: "Airbnb Originals",
    subtitle: "Hosted by the world’s most interesting people",
    items: offers("originals", [
      ["Make a royal thali with a palace chef", 7400, 5.0, "1585937421612-70a008356fbe", "Original", "guest", "Jaipur, India"],
      ["Throw pottery with a third-generation potter", 6514, 5.0, "1493106641515-6b5631de4bb9", "Original", "guest", "Khurja, India"],
      ["Raft the Ganga with a river guide", 5800, 4.98, "1603867106100-0d2039fc8757", "Original", "guest", "Rishikesh, India"],
      ["Sculpt marble with a temple carver", 6900, 5.0, "1578163678052-eef169544f75", "Original", "guest", "Agra, India"],
      ["Spice-market tour with a street food legend", 3063, 5.0, "1627110508727-964411efb355", "Original", "guest", "Delhi, India"],
      ["Paint the Pink City with a miniature artist", 8133, 4.99, "1524230507669-5ff97982bb5e", "Original", "guest", "Jaipur, India"],
      ["Sail at sunset with a Goan fisherman", 4200, 4.96, "1507525428034-b723cf961d3e", "Original", "guest", "Goa, India"],
    ]),
  },
  {
    key: "all",
    title: `All experiences in ${NEARBY_AREA}`,
    items: offers("all", [
      ["Old Delhi night food and heritage walk", 3999, 5.0, "1767183522861-8cff79184817", "Trending"],
      ["Same-day Taj Mahal tour from Delhi by car", 5500, 4.93, "1599476160130-3af44b69ec6e", "Trending"],
      ["Tuk-tuk Delhi experience", 5500, 4.93, "1760780311645-7a1ef2920deb", "Trending"],
      ["Dive into Delhi's local life", 2400, 4.98, "1662101875545-0b0cb8b7795b", "Trending"],
      ["Old and New Delhi: 8-hour private tour", 3200, 4.91, "1523981729822-80f25e681301", "Trending"],
      ["Old and New Delhi tour", 3000, 4.98, "1696887484490-715e7eb0e682"],
      ["Clay and coffee: a pottery morning", 2100, 4.95, "1607556671927-78a6605e290b"],
      ["Market-to-table Indian cooking", 2600, 4.97, "1683633417102-7578aa187aee"],
    ]),
  },
  {
    key: "dehradun",
    title: "Experiences in Dehradun",
    items: offers("dehradun", [
      ["Suspension bridges and river ghats walk", 1500, 4.95, "1720819029162-8500607ae232"],
      ["Morning yoga by the river", 1200, 5.0, "1767656328571-e3fb1208eb72"],
      ["White-water rafting on the Ganga", 2500, 4.9, "1603867106100-0d2039fc8757"],
      ["Himalayan foothills sunrise hike", 1800, 4.97, "1712510817140-917938f92e5b"],
      ["Evening aarti and old town stroll", 900, 4.92, "1718383537411-6f9e727ae0bb"],
      ["Riverside cafés and bridges by bike", 1400, undefined, "1757863816269-435a72e76673"],
      ["Boat ride at golden hour", 1100, 4.88, "1718383538535-49ff3dd8c550"],
    ]),
  },
  {
    key: "jaipur",
    title: "Experiences in Jaipur",
    items: offers("jaipur", [
      ["Hidden gems of the Pink City and block printing", 3995, 4.97, "1599661046289-e31897846e41"],
      ["Jaipur by custom tuk-tuk", 2000, 4.9, "1769122620093-82fb8a5351b0"],
      ["Explore Jaipur like never before", 4207, 4.96, "1524230507669-5ff97982bb5e"],
      ["Private shopping tour: bazaars and artisans", 899, 5.0, "1557690756-62754e561982"],
      ["Old city street food walk", 3000, 4.97, "1602643163983-ed0babc39797"],
      ["Create traditional hand-block printed fabric", 2600, 4.99, "1758810357499-88163cd47fc0"],
      ["Sunrise at Hawa Mahal with a photographer", 3500, 4.95, "1706961121783-4ae6c933983a"],
    ]),
  },
  {
    key: "new-delhi",
    title: "Experiences in New Delhi",
    items: offers("new-delhi", [
      ["Old Delhi's food, temples, markets and culture", 80, 5.0, "1760262492874-80283261b99c", "Trending"],
      ["Taj Mahal tour from Delhi with lunch", 4000, 4.86, "1526711657229-e7e080ed7aa1"],
      ["The contrasting charms of Old and New Delhi", 3600, 4.98, "1616368309964-3a686de13b4d", "Trending"],
      ["Temples, rickshaws, spice market and food", 2700, 5.0, "1760782065835-a6a5e06509c3"],
      ["Lodhi art district street art walk with chai", 3000, 4.96, "1710397093377-7f7a600fd1d7", "Trending"],
      ["Old Delhi culture, heritage, food and rickshaw", 500, 5.0, "1644365473569-aec5bfc99db1"],
      ["Museum highlights with an art historian", 1800, 4.9, "1575223970966-76ae61ee7838"],
    ]),
  },
  {
    key: "south-goa",
    title: "Experiences in South Goa",
    items: offers("south-goa", [
      ["Dolphin spotting boat trip", 1800, 4.9, "1512343879784-a960bf40e7f2"],
      ["Beach hut hopping in Palolem", 1200, 4.85, "1614082242765-7c98ca0f3df3"],
      ["Sunset kayaking through the backwaters", 2200, 4.97, "1605015239078-95f963a8b35c"],
      ["Goan seafood cooking class", 2800, 5.0, "1725483990188-41d4fb0d1e5a"],
      ["Palm-fringed coastal cycle ride", 1500, 4.93, "1581892197913-fd2e407e698a"],
      ["Swim and snorkel at a hidden cove", 2600, undefined, "1496566084516-c5b96fcbd5c8"],
      ["Golden-hour beach photo walk", 2000, 4.96, "1787597950984-6a31341fd7cd"],
    ]),
  },
];

export const POPULAR_FROM = "dehradun";
