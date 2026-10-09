// Decorative "city poster" collage behind the full-page login (illustrations are CSS gradients + type).
const TILES = [
  { city: "Toronto", a: "#7f8fd8", b: "#f3a37c", tall: false }, { city: "Paris", a: "#9fb3dd", b: "#e9d7c3", tall: true },
  { city: "Medellín", a: "#6aa84f", b: "#f2c94c", tall: false }, { city: "Miami", a: "#7fc8e8", b: "#f2a1c9", tall: true },
  { city: "Montréal", a: "#c9b79c", b: "#6f9ac9", tall: false }, { city: "Edinburgh", a: "#e8b4a0", b: "#8fb0d9", tall: false },
  { city: "Budapest", a: "#e9c46a", b: "#7fb3d5", tall: true }, { city: "México", a: "#e76f51", b: "#f4a261", tall: false },
  { city: "San Diego", a: "#8fd3c8", b: "#f6d58e", tall: true }, { city: "Lisbon", a: "#f4a6a0", b: "#9fd0e6", tall: false },
  { city: "Sydney", a: "#74b9e7", b: "#f7c59f", tall: false }, { city: "Tokyo", a: "#c7a4e0", b: "#f2d0d9", tall: true },
];

export default function AuthBackdrop() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <div className="absolute -inset-4 grid grid-cols-3 content-start gap-5 md:grid-cols-5">
        {TILES.map((t) => (
          <div key={t.city}
            className={`relative overflow-hidden rounded-3xl shadow-md ${t.tall ? "aspect-[3/4]" : "aspect-[4/3]"}`}
            style={{ background: `linear-gradient(160deg, ${t.a}, ${t.b})` }}>
            <span className="absolute inset-x-3 top-3 text-[clamp(20px,3.2vw,44px)] font-black uppercase leading-none tracking-tight text-[#1c2748]/85">{t.city}</span>
            <span className="absolute bottom-0 h-1/3 w-full bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-surface/30 backdrop-blur-[1px]" />
    </div>
  );
}
