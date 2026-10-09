type P = { className?: string };
const base = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const SearchIcon = ({ className = "h-4 w-4" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
export const HeartIcon = ({ className = "h-6 w-6", fill = "none" }: P & { fill?: string }) => (
  <svg viewBox="0 0 24 24" className={className} {...base} fill={fill}>
    <path d="M12 20.5s-8-4.9-8-11A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5c0 6.1-8 11-8 11Z" />
  </svg>
);
export const UserIcon = ({ className = "h-6 w-6" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <circle cx="12" cy="12" r="9.5" /><circle cx="12" cy="10" r="3" /><path d="M5.8 18.3c1.5-2.2 3.6-3.3 6.2-3.3s4.7 1.1 6.2 3.3" />
  </svg>
);
export const ArrowRight = ({ className = "h-4 w-4" }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const StarIcon = ({ className = "h-3 w-3" }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="m12 2.5 2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.5l-6 3.4 1.3-6.7-5-4.7 6.8-.8L12 2.5Z" /></svg>
);
export const Logo = ({ className = "h-8 w-8" }: P) => (
  <svg viewBox="0 0 32 32" className={className} {...base} strokeWidth={2.2}>
    <path d="M16 2c-2 0-3.4 1.3-4.5 3.3L4.6 19c-1.5 3-.6 6 1.5 7.4 2.6 1.6 5.6.3 7.8-2 .9-1 1.6-2 2.1-3.1.5 1.1 1.2 2.1 2.1 3.1 2.200 2.300 5.200 3.600 7.800 2 2.100-1.400 3-4.400 1.500-7.400L20.500 5.300C19.400 3.300 18 2 16 2Z" />
    <circle cx="16" cy="17.500" r="3.200" />
  </svg>
);
