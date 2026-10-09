/*
 * Isometric cut-away house for the wizard's "Step 1/2/3" intro pages. Every piece drops into place one
 * after another (~1s total), like Airbnb's animation. `level` adds furniture: 1 = the shell,
 * 2 = decorated, 3 = ready for guests.
 *
 * World units: x runs to the right-front, y to the left-front, z up. Pieces are listed back to front.
 */
const C = 0.866; // cos 30°
const S = 22; // px per unit
const pt = (x: number, y: number, z: number): [number, number] => [(x - y) * C * S, (x + y) * 0.5 * S - z * S];
const pts = (...ps: [number, number, number][]) => ps.map((p) => pt(...p).map((n) => n.toFixed(1)).join(",")).join(" ");

type Faces = [top: string, left: string, right: string];

/** A solid box: draws the three faces that face the viewer. */
function Box({ x, y, z, w, d, h, c }: { x: number; y: number; z: number; w: number; d: number; h: number; c: Faces }) {
  return (
    <>
      <polygon points={pts([x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h])} fill={c[1]} />
      <polygon points={pts([x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h])} fill={c[2]} />
      <polygon points={pts([x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h])} fill={c[0]} />
    </>
  );
}

/** A flat disc (table top, rug, tub) lying at height z. */
function Disc({ x, y, z, r, fill, stroke }: { x: number; y: number; z: number; r: number; fill: string; stroke?: string }) {
  const ring = Array.from({ length: 24 }, (_, i) => [x + r * Math.cos((i / 24) * 2 * Math.PI), y + r * Math.sin((i / 24) * 2 * Math.PI), z] as [number, number, number]);
  return <polygon points={pts(...ring)} fill={fill} stroke={stroke} strokeWidth={stroke ? 1 : 0} />;
}

/** A rectangle drawn on the back-right wall (y = 0) or the back-left wall (x = 0). */
function OnWall({ wall, a, b, z1, z2, fill, stroke, sw = 1.5 }: { wall: "x" | "y"; a: number; b: number; z1: number; z2: number; fill: string; stroke?: string; sw?: number }) {
  const p = (u: number, z: number): [number, number, number] => (wall === "y" ? [u, 0.01, z] : [0.01, u, z]);
  return <polygon points={pts(p(a, z1), p(b, z1), p(b, z2), p(a, z2))} fill={fill} stroke={stroke} strokeWidth={stroke ? sw : 0} />;
}

function Line({ from, to, color = "#444", w = 1.4 }: { from: [number, number, number]; to: [number, number, number]; color?: string; w?: number }) {
  const [x1, y1] = pt(...from); const [x2, y2] = pt(...to);
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={w} strokeLinecap="round" />;
}

function Plant({ x, y, z, size = 1 }: { x: number; y: number; z: number; size?: number }) {
  const [cx, cy] = pt(x + 0.25, y + 0.25, z + 0.55 + 0.45 * size);
  return (
    <>
      <Box x={x} y={y} z={z} w={0.5} d={0.5} h={0.55} c={["#d9c3a5", "#c07a4e", "#a9653d"]} />
      <circle cx={cx - 5 * size} cy={cy + 2} r={6 * size} fill="#5f8f4e" />
      <circle cx={cx + 5 * size} cy={cy} r={6 * size} fill="#4f7d40" />
      <circle cx={cx} cy={cy - 6 * size} r={6.5 * size} fill="#6fa35a" />
    </>
  );
}

const WOOD: Faces = ["#ecd2ae", "#c9a074", "#b88c5f"];
const WALL: Faces = ["#e8e2db", "#fbf9f6", "#f1ece6"];
const WHITE: Faces = ["#ffffff", "#ece9e4", "#ddd8d1"];
const BLUE: Faces = ["#4f78c4", "#2f57a3", "#264a8d"];
const OAK: Faces = ["#d7ab78", "#b98756", "#a5764a"];
const GREY: Faces = ["#f3f1ee", "#d9d6d1", "#cbc7c1"];

export default function IsoHouse({ level = 1, className = "" }: { level?: 1 | 2 | 3; className?: string }) {
  const pieces: React.ReactNode[] = [
    // floor slab and the two back walls
    <Box key="floor" x={0} y={0} z={-0.4} w={12} d={10} h={0.4} c={WOOD} />,
    <Box key="wallR" x={0} y={-0.3} z={0} w={12} d={0.3} h={7} c={WALL} />,
    <Box key="wallL" x={-0.3} y={-0.3} z={0} w={0.3} d={10.3} h={7} c={["#e8e2db", "#f3eee8", "#f6f2ed"]} />,
    // tall loft window with glazing bars
    <g key="window">
      <OnWall wall="y" a={1} b={5.2} z1={3.7} z2={6.8} fill="#dfe9f2" stroke="#3b3b3b" sw={2} />
      {[2.05, 3.1, 4.15].map((u) => <Line key={u} from={[u, 0.02, 3.7]} to={[u, 0.02, 6.8]} color="#3b3b3b" w={1.8} />)}
      <Line from={[1, 0.02, 5.25]} to={[5.2, 0.02, 5.25]} color="#3b3b3b" w={1.8} />
    </g>,
    // small windows downstairs on the left wall
    <g key="windowsL">
      <OnWall wall="x" a={6} b={7.1} z1={1.3} z2={2.9} fill="#e3ecf4" stroke="#bfb8ae" />
      <OnWall wall="x" a={7.8} b={8.9} z1={1.3} z2={2.9} fill="#e3ecf4" stroke="#bfb8ae" />
    </g>,
    // loft slab with glass balustrade
    <g key="loft">
      <Box x={0} y={0} z={3.4} w={7.2} d={4.4} h={0.3} c={["#e5c69e", "#f4f1ec", "#ebe6df"]} />
      <polygon points={pts([0, 4.4, 3.7], [7.2, 4.4, 3.7], [7.2, 4.4, 4.6], [0, 4.4, 4.6])} fill="#cfe3f0" opacity={0.55} stroke="#9fb7c8" />
    </g>,
    // partition between the bedroom (left) and the living room (right)
    <Box key="partition" x={5} y={4.4} z={0} w={0.25} d={5.6} h={3.4} c={WALL} />,
    // bed on the loft + dresser
    <g key="loftBed">
      <Box x={1.8} y={1.4} z={3.7} w={2.6} d={2.6} h={0.03} c={["#2f6b4f", "#285c44", "#24523d"]} />
      <Box x={0.6} y={0.6} z={3.7} w={2.3} d={3} h={0.55} c={OAK} />
      <Box x={0.7} y={0.7} z={4.25} w={2.1} d={2.8} h={0.3} c={WHITE} />
      <Box x={0.8} y={0.8} z={4.55} w={1.9} d={0.6} h={0.25} c={["#fafafa", "#e6e3df", "#d7d2cb"]} />
    </g>,
    <Box key="dresser" x={5.4} y={0.2} z={3.7} w={1.5} d={0.7} h={1.3} c={OAK} />,
    // stairs climbing to the loft's side, highest step against the loft
    <g key="stairs">
      {Array.from({ length: 8 }, (_, k) => (
        <Box key={k} x={7.2 + k * 0.5} y={3} z={0} w={0.5} d={1.4} h={(3.4 * (8 - k)) / 8} c={["#f2ebe2", "#e2d8cc", "#d6cabd"]} />
      ))}
      <Line from={[7.2, 4.35, 4.3]} to={[11.2, 4.35, 1.3]} color="#8d8d8d" w={1.6} />
    </g>,
    // bedroom: desk and bed
    <g key="desk">
      <Box x={0.25} y={5} z={1.15} w={1} d={2.2} h={0.12} c={OAK} />
      <Line from={[1.15, 5.1, 0]} to={[1.15, 5.1, 1.15]} /><Line from={[1.15, 7.1, 0]} to={[1.15, 7.1, 1.15]} />
      <Box x={1.5} y={5.8} z={0} w={0.6} d={0.6} h={0.75} c={["#3d3d3d", "#2b2b2b", "#222"]} />
    </g>,
    <g key="bed">
      <Box x={0.4} y={7.4} z={0} w={3.2} d={2.3} h={0.45} c={OAK} />
      <Box x={0.5} y={7.5} z={0.45} w={3} d={2.1} h={0.3} c={WHITE} />
      <Box x={0.55} y={7.6} z={0.75} w={0.6} d={1.9} h={0.2} c={["#fdfdfd", "#e6e3df", "#d9d4ce"]} />
    </g>,
    // living room: round dining table, sofa, coffee table, rug
    <g key="dining">
      <Line from={[10.3, 6.6, 0]} to={[10.3, 6.6, 1.3]} color="#7c7c7c" w={3} />
      <Disc x={10.3} y={6.6} z={1.3} r={1.1} fill="#f1efec" stroke="#d2cec8" />
      <Box x={9.6} y={5} z={0} w={0.5} d={0.5} h={0.9} c={OAK} /><Box x={11.3} y={6.4} z={0} w={0.5} d={0.5} h={0.9} c={OAK} />
    </g>,
    <Box key="rug" x={5.6} y={5.2} z={0} w={3.4} d={2.6} h={0.03} c={["#efe8dd", "#ddd3c4", "#d4c8b8"]} />,
    <g key="coffee">
      <Line from={[7.3, 6.5, 0]} to={[7.3, 6.5, 0.55]} color="#7a5a3a" w={2} />
      <Disc x={7.3} y={6.5} z={0.55} r={0.8} fill="#b98756" />
    </g>,
    <g key="sofa">
      <Box x={5.8} y={8.3} z={0} w={3.2} d={1.1} h={0.75} c={BLUE} />
      <Box x={5.8} y={9.1} z={0.75} w={3.2} d={0.35} h={0.6} c={BLUE} />
    </g>,
    <Box key="bench" x={2.5} y={4.6} z={0} w={2} d={0.6} h={0.55} c={OAK} />,
  ];

  if (level >= 2) pieces.push(
    // kitchen under the loft, fridge, fireplace, art, plants, lamp
    <g key="kitchen">
      <Box x={7.4} y={0.05} z={0} w={2.6} d={0.9} h={1.1} c={["#e7ddd2", "#b05a3c", "#9a4c31"]} />
      <Box x={7.4} y={0.05} z={2.1} w={2.6} d={0.6} h={0.8} c={["#e7ddd2", "#b05a3c", "#9a4c31"]} />
      <Box x={10.1} y={0.05} z={0} w={1} d={0.9} h={2.6} c={["#dfe3e6", "#b9c0c6", "#a6adb3"]} />
    </g>,
    <g key="fire">
      <OnWall wall="y" a={10.4} b={11.8} z1={1.2} z2={1.8} fill="#2b2b2b" />
      <OnWall wall="y" a={10.6} b={11.6} z1={1.3} z2={1.7} fill="#f2913b" />
    </g>,
    <OnWall key="art" wall="x" a={0.8} b={2.6} z1={5} z2={6.4} fill="#f2b58e" stroke="#e6d7c8" />,
    <OnWall key="art2" wall="x" a={6.5} b={8.5} z1={4.6} z2={6.2} fill="#f5c84c" stroke="#e6d7c8" />,
    <Plant key="p1" x={0.3} y={3.2} z={3.7} size={1.2} />,
    <Plant key="p2" x={4.4} y={4.6} z={0} />,
    <Plant key="p3" x={9.4} y={8.9} z={0} />,
    <g key="lamp">
      <Line from={[11.4, 9.2, 0]} to={[11.4, 9.2, 2.2]} color="#555" />
      <circle cx={pt(11.4, 9.2, 2.35)[0]} cy={pt(11.4, 9.2, 2.35)[1]} r={7} fill="#fff4cc" />
    </g>,
  );

  if (level >= 3) pieces.push(
    // finishing touches: hot tub by the loft window, cushions, bunting, a cat
    <g key="tub">
      <Box x={5.4} y={1.9} z={3.7} w={1.6} d={1.6} h={0.7} c={["#c89566", "#a77446", "#93653b"]} />
      <Disc x={6.2} y={2.7} z={4.41} r={0.62} fill="#8fd3e8" />
    </g>,
    <g key="cushions">
      <Box x={6.2} y={9.05} z={0.75} w={0.6} d={0.2} h={0.5} c={["#f7d26a", "#e9b93e", "#d9a92f"]} />
      <Box x={8.1} y={9.05} z={0.75} w={0.6} d={0.2} h={0.5} c={["#f29b8e", "#e07a6c", "#d06b5d"]} />
    </g>,
    <g key="bunting">
      {Array.from({ length: 7 }, (_, i) => {
        const [x, y] = pt(5.6 + i * 0.85, 0.02, 6.6 - Math.sin((i / 6) * Math.PI) * 0.4);
        return <polygon key={i} points={`${x - 5},${y} ${x + 5},${y + 2.5} ${x},${y + 11}`} fill={["#ff385c", "#f5c84c", "#4f78c4", "#5f8f4e"][i % 4]} />;
      })}
    </g>,
    <g key="cat">
      <Box x={7.9} y={7.1} z={0.03} w={0.7} d={0.4} h={0.35} c={["#5b5b5b", "#3f3f3f", "#353535"]} />
      <Box x={8.45} y={7.15} z={0.3} w={0.3} d={0.3} h={0.3} c={["#5b5b5b", "#3f3f3f", "#353535"]} />
    </g>,
    <Box key="box" x={3.1} y={4.65} z={0.55} w={0.8} d={0.5} h={0.35} c={GREY} />,
  );

  const step = 1000 / pieces.length; // the whole house lands in about a second
  return (
    <svg viewBox="-225 -175 480 440" className={`iso-house ${className}`} role="img" aria-label="Illustration of a home">
      <ellipse cx={30} cy={250} rx={210} ry={22} fill="#000" opacity={0.05} />
      {pieces.map((p, i) => <g key={i} style={{ animationDelay: `${Math.round(i * step)}ms` }}>{p}</g>)}
    </svg>
  );
}
