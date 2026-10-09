/* Line icons for the listing page, drawn in the style of Airbnb's 24px outline set. */
type P = { className?: string };
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const svg = (d: React.ReactNode) => function Icon({ className = "h-6 w-6" }: P) {
  return <svg viewBox="0 0 24 24" className={className} {...base} aria-hidden>{d}</svg>;
};

const ICONS: Record<string, ReturnType<typeof svg>> = {
  Wifi: svg(<><path d="M2 8.5a14.5 14.5 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.2 15.3a5.4 5.4 0 0 1 7.6 0" /><circle cx="12" cy="19" r="1" /></>),
  Kitchen: svg(<><path d="M6 3v18M3.5 3v5a2.5 2.5 0 0 0 5 0V3M17 21V3c-2 1.5-3 4-3 7v3h3" /><circle cx="11.5" cy="17" r="2.5" /></>),
  "Free parking": svg(<><path d="M4 16v-4l2-5h12l2 5v4M3 16h18v3h-3v-1H6v1H3z" /><circle cx="7.5" cy="13.5" r=".8" /><circle cx="16.5" cy="13.5" r=".8" /></>),
  "Air conditioning": svg(<path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 3.5l3 2 3-2M9 20.5l3-2 3 2M4 10.5l2.6-1.5L6 6M18 18l-.6-3 2.6-1.5M4 13.5 6.6 15 6 18M18 6l-.6 3 2.6 1.5" />),
  Washer: svg(<><rect x="4" y="2.5" width="16" height="19" rx="2" /><circle cx="12" cy="13" r="5" /><path d="M7 6h.01M10 6h4" /></>),
  "Hot water": svg(<path d="M12 3s-6 6.5-6 11a6 6 0 0 0 12 0c0-4.5-6-11-6-11ZM9 15a3 3 0 0 0 3 3" />),
  TV: svg(<><rect x="2.5" y="4" width="19" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></>),
  Workspace: svg(<path d="M3 11h18M5 11v9M19 11v9M8 11V7h8v4M12 7V4" />),
  Balcony: svg(<path d="M3 12h18M4 12v8M20 12v8M3 20h18M8 12v8M12 12v8M16 12v8M7 12V4h10v8" />),
  "Power backup": svg(<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />),
  "Pets allowed": svg(<><ellipse cx="12" cy="16" rx="4.5" ry="3.5" /><circle cx="5.5" cy="10" r="1.8" /><circle cx="9.5" cy="6" r="1.8" /><circle cx="14.5" cy="6" r="1.8" /><circle cx="18.5" cy="10" r="1.8" /></>),
  "Breakfast included": svg(<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9ZM17 10h1.5a2.5 2.5 0 0 1 0 5H17M8 3v3M12 3v3" />),
  Pool: svg(<path d="M2 18c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M8 15V5a2 2 0 0 1 4 0M16 15V5a2 2 0 0 0-4 0M8 8h8M8 12h8" />),
};

/** Airbnb's wording for our amenity names. */
export const AMENITY_LABEL: Record<string, string> = {
  "Free parking": "Free parking on premises",
  Workspace: "Dedicated workspace",
  Washer: "Washing machine",
  Balcony: "Patio or balcony",
  "Breakfast included": "Breakfast",
};

const Check = svg(<path d="m5 12 4.5 4.5L19 7" />);
export const AmenityIcon = ({ name, className }: { name: string } & P) => {
  const Icon = ICONS[name] ?? Check;
  return <Icon className={className} />;
};

// Highlights ("Great check-in experience", "Great location", Superhost)
export const KeyIcon = svg(<><circle cx="8" cy="8" r="5" /><path d="m11.5 11.5 9 9M17 17l2-2M14.5 14.5l2-2" /></>);
export const PinIcon = svg(<><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></>);
export const MedalIcon = svg(<><circle cx="12" cy="16" r="5" /><path d="M8 11.5 5 3h5l2 5 2-5h5l-3 8.5" /></>);
export const DeskIcon = ICONS.Workspace;
export const DoorIcon = svg(<><path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17M3 21h18" /><circle cx="15" cy="12" r=".8" /></>);

// Page chrome
export const ShareIcon = svg(<path d="M12 15V3M7.5 7.5 12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />);
export const GridDotsIcon = ({ className = "h-4 w-4" }: P) => (
  <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden>
    {[2.5, 8, 13.5].flatMap((y) => [2.5, 8, 13.5].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" />))}
  </svg>
);
export const FlagIcon = ({ className = "h-4 w-4" }: P) => (
  <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden><path d="M2 1h1.5v14H2zM4 2h9l-2 3.5L13 9H4z" /></svg>
);
export const ChevronDown = svg(<path d="m6 9 6 6 6-6" />);
export const ChevronLeft = svg(<path d="m15 6-6 6 6 6" />);
export const ChevronRight = svg(<path d="m9 6 6 6-6 6" />);

/** The pink price tag next to "Prices include all fees". */
export const PriceTagIcon = ({ className = "h-7 w-7" }: P) => (
  <svg viewBox="0 0 32 32" className={`${className} origin-[30%_20%] animate-[tag-swing_2.4s_ease-in-out_infinite]`} aria-hidden>
    <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h9.4c.7 0 1.3.3 1.8.7l10.6 10.6a2.5 2.5 0 0 1 0 3.6l-9.4 9.4a2.5 2.5 0 0 1-3.6 0L4.7 17.7A2.5 2.5 0 0 1 4 15.9Z" fill="#E31C5F" />
    <path d="M6 8.5A2.5 2.5 0 0 1 8.5 6h7.6c.7 0 1.3.3 1.8.7l8.8 8.8a2.5 2.5 0 0 1 0 3.6l-7.6 7.6a2.5 2.5 0 0 1-3.6 0L6.7 17.9A2.5 2.5 0 0 1 6 16.1Z" fill="#FF5A7E" opacity=".55" />
    <circle cx="11" cy="11" r="2" fill="#fff" />
  </svg>
);

/** Laurel branch used by the "Guest favourite" badge; `flip` mirrors it for the right-hand side. */
export const Laurel = ({ className = "h-12 w-6", flip = false }: P & { flip?: boolean }) => (
  <svg viewBox="0 0 30 60" className={className} style={flip ? { transform: "scaleX(-1)" } : undefined} aria-hidden fill="currentColor">
    <path d="M8 6c4 1 6 5 5 9-4-1-6-5-5-9Zm-5 12c4-1 7 2 8 6-4 1-7-2-8-6Zm0 14c4-1 7 2 8 6-4 1-7-2-8-6Zm4 13c4-2 8 0 9 4-4 2-8 0-9-4Zm10-30c3 2 3 6 1 9-3-2-3-6-1-9Zm1 14c3 2 3 6 1 9-3-2-3-6-1-9Z" />
    <path d="M24 4c-6 8-9 20-5 34 2 6 6 10 9 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
