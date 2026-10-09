/* Outline icons for the become-a-host wizard, in the style of Airbnb's 24px line set. */
type P = { className?: string };
const base = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
const icon = (d: React.ReactNode) => function Icon({ className = "h-10 w-10" }: P) {
  return <svg viewBox="0 0 24 24" className={className} {...base} aria-hidden>{d}</svg>;
};
const wheel = (x: number) => <circle cx={x} cy="19" r="1.8" />;

const HOUSE = icon(<path d="M3 11.5 12 3.5l9 8M5.5 9.5V21h13V9.5M10 21v-6h4v6" />);

const STRUCTURE_ICONS: Record<string, ReturnType<typeof icon>> = {
  House: HOUSE,
  "Flat/apartment": icon(<path d="M4 21V3h10v18M14 8h6v13M2.5 21h19M7 7h1M10.5 7h1M7 11h1M10.5 11h1M7 15h1M10.5 15h1M16.5 12h1M16.5 16h1" />),
  Barn: icon(<path d="M4 21V9.5L12 4l8 5.5V21zM7.5 21v-8h9v8M7.5 13l9 8M16.5 13l-9 8M10.5 7.5h3v2.5h-3z" />),
  "Bed & breakfast": icon(<path d="M5 10h11v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM16 11.5h1.5a2.5 2.5 0 0 1 0 5H16M8.5 3 7.5 7M11.5 3l-1 4M14.5 3l-1 4" />),
  Boat: icon(<path d="M2.5 17h19l-2.5 4H5zM12 3v14M12 4.5l6.5 10H12M10.5 7 6 14.5h4.5" />),
  Cabin: icon(<path d="M2 11.5 12 3.5l10 8M5 9.5V21h14V9.5M5 13.5h14M5 17h14M10 21v-4h4v4" />),
  "Campervan/motorhome": icon(<><path d="M3.8 19H2V7a2 2 0 0 1 2-2h12l5 6v8h-2.2M8.8 19h6.4M16 5v6h5M5 8h7v4H5z" />{wheel(6.3)}{wheel(17)}</>),
  "Casa particular": icon(<path d="M3 21V4h18v17M3 9h18M5.5 21v-5a2 2 0 0 1 4 0v5M14.5 21v-5a2 2 0 0 1 4 0v5M6 6.5h0M10 6.5h0M14 6.5h0M18 6.5h0" />),
  Castle: icon(<path d="M5 21V10h14v11M5 10V6.5h2.5v2h2.5v-2h4v2h2.5v-2H19V10M10 21v-4a2 2 0 0 1 4 0v4M12 6.5V2.5h3.5l-1 1 1 1H12" />),
  Cave: icon(<path d="M2.5 20 6.5 9 12 4l6.5 4.5L21.5 20zM8.5 20v-3a3.5 3.5 0 0 1 7 0v3" />),
  Container: icon(<path d="M2 5.5h20V19H2zM6 8.5v7.5M10 8.5v7.5M14 8.5v7.5M18 8.5v7.5" />),
  "Cycladic home": icon(<path d="M5 21V8h14v13M8.5 8a3.5 3.5 0 0 1 7 0M10 21v-5a2 2 0 0 1 4 0v5M7.5 12h2M14.5 12h2" />),
  Dammuso: icon(<path d="M3 21V11h18v10M3 11c1-4 4-6 9-6s8 2 9 6M7.5 21v-5h3.5v5M14 14h3.5v3H14z" />),
  Dome: icon(<path d="M2.5 20a9.5 9.5 0 0 1 19 0zM12 10.5V20M8 15h8M9.5 20v-3h5v3" />),
  "Earth home": icon(<path d="M2.5 20c2-6 5.5-9 9.5-9s7.5 3 9.5 9zM10 20v-3a2 2 0 0 1 4 0v3M6.5 9.5C7 7.5 8.5 7 10 8M15 8c1-2 2.5-2.5 4-1" />),
  Farm: icon(<path d="M2.5 21V11.5L8 7l5.5 4.5V21zM13.5 21H21V9a2.5 2.5 0 0 0-5 0v2M6 21v-5h4v5M2 21h20" />),
  "Guest house": icon(<path d="M3 21V10.5l7-6 7 6V21M17 13.5h4V21M7 21v-5h6v5M1.5 21h21" />),
  Hotel: icon(<path d="M4.5 21V3h15v18M2.5 21h19M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2M10.5 21v-3h3v3" />),
  Houseboat: icon(<path d="M1.5 17h21L20 21H4zM5 17v-6.5L12 6l7 4.5V17M10 17v-3.5h4V17" />),
  Minsu: icon(<path d="M2 10.5 12 4l10 6.5M4 9.5V21h16V9.5M9 21v-6h6v6M2 10.5c4 1 16 1 20 0" />),
  Riad: icon(<path d="M3 21V5h18v16M3 10h18M12 13.5v.01M7 21v-4.5a2 2 0 0 1 4 0V21M13 21v-4.5a2 2 0 0 1 4 0V21" />),
  Ryokan: icon(<path d="M1 9.5 12 3.5l11 6M3 9.5V21h18V9.5M3 13.5h18M8 21v-4.5h8V21M12 16.5V21" />),
  "Shepherd’s hut": icon(<><path d="M4 17V9.5C4 7 7.5 5 12 5s8 2 8 4.5V17zM8.5 17v-5.5h3V17M14.5 11.5h2.5v2.5h-2.5z" />{wheel(6.5)}{wheel(17.5)}</>),
  Tent: icon(<path d="M2 20 12 4l10 16zM12 4v16M8.5 20 12 14l3.5 6" />),
  "Tiny home": icon(<path d="M6 21V11.5l6-5 6 5V21zM10 21v-4h4v4M3.5 21h17M14.5 13h1.5v1.5h-1.5z" />),
  Tower: icon(<path d="M8 21V7.5h8V21M6.5 7.5 12 3l5.5 4.5M11 11h2v3h-2zM10 21v-3h4v3" />),
  "Tree house": icon(<><circle cx="12" cy="7.5" r="5" /><path d="M12 21V12.5M8 21h8M7.5 14.5h9v3h-9zM10.5 14.5v3" /></>),
  Trullo: icon(<path d="M5 21v-7.5h14V21M5 13.5l3.5-7.5h2L12 3l1.5 3h2l3.5 7.5M10 21v-4h4v4" />),
  Windmill: icon(<path d="m9 21 1-10h4l1 10zM12 8 6.5 2.5M12 8l5.5-5.5M12 8l-5.5 5.5M12 8l5.5 5.5M11 21v-3h2v3" />),
  Yurt: icon(<path d="M3 13.5 12 6l9 7.5V21H3zM3 13.5h18M10 21v-4.5h4V21M12 6V4" />),
};

export const StructureIcon = ({ name, className }: { name: string } & P) => {
  const Icon = STRUCTURE_ICONS[name] ?? HOUSE;
  return <Icon className={className} />;
};

export const RoomTypeIcon = ({ type, className }: { type: string } & P) => {
  const Icon = type === "room" ? DOOR : type === "shared" ? SHARED : HOUSE;
  return <Icon className={className} />;
};
const DOOR = icon(<path d="M6 21V3h12v18M4 21h16M14.5 12h.01" />);
const SHARED = icon(<><path d="M3 11.5 12 3.5l9 8M5 9.5V21h14V9.5" /><circle cx="9.3" cy="13" r="1.6" /><circle cx="14.7" cy="13" r="1.6" /><path d="M6.5 19a2.8 2.8 0 0 1 5.6 0M11.9 19a2.8 2.8 0 0 1 5.6 0" /></>);

export const PinIcon = icon(<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />);
export const HomePinGlyph = ({ className = "h-5 w-5" }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden><path d="M12 3.2 2.8 11h2.7v9.3h5V15h3v5.3h5V11h2.7z" /></svg>
);
