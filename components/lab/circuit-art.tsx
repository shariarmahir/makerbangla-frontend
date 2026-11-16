import { BB_COLS, BB_ROWS, fmt, ledColor, num, pinKey, pinPos, pinsOf, switchClosed, type Circuit, type DcResult, type Part, type PartResult, type Wire } from "@/lib/lab/engine";
import { bands, LED_FILL, RESISTOR_BODY, valueText, worldBox } from "@/lib/lab/models";
import { cn } from "@/lib/utils";

/** Pixels per grid unit (one breadboard hole pitch). */
export const G = 20;

export const WIRE_COLORS: Record<string, string> = {
  blue: "stroke-brand",
  navy: "stroke-tile-navy",
  yellow: "stroke-tile-yellow",
  coral: "stroke-tile-coral",
  ink: "stroke-ink",
};

/** Jumper-wire curve between two points (px): bows sideways so it reads as a lifted wire. */
export function wirePath(ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;
  const bow = Math.min(len * 0.22, 48);
  let nx = -dy / len, ny = dx / len; // unit normal; flip it so the bow points up (or left for vertical runs)
  if (ny > 0 || (ny === 0 && nx > 0)) { nx = -nx; ny = -ny; }
  return `M${ax} ${ay} Q${(ax + bx) / 2 + nx * bow} ${(ay + by) / 2 + ny * bow} ${bx} ${by}`;
}

const label = "fill-ink font-sans text-[9px] font-bold";

function PartBody({ p, r }: { p: Part; r?: PartResult }) {
  switch (p.kind) {
    case "resistor": {
      const b = bands(num(p, "r"));
      return (
        <g>
          <line x1={0} y1={0} x2={4 * G} y2={0} className="stroke-subtle" strokeWidth={2} />
          <rect x={0.9 * G} y={-0.34 * G} width={2.2 * G} height={0.68 * G} rx={0.3 * G} style={{ fill: RESISTOR_BODY }} className="stroke-black/25" />
          {b.map((c, i) => <rect key={i} x={(1.2 + i * 0.42 + (i === 3 ? 0.25 : 0)) * G} y={-0.34 * G} width={0.16 * G} height={0.68 * G} style={{ fill: c }} />)}
          {(r?.p ?? 0) > num(p, "watt") && <rect x={0.9 * G} y={-0.34 * G} width={2.2 * G} height={0.68 * G} rx={0.3 * G} className="fill-tile-coral/50 motion-safe:animate-pulse" />}
        </g>
      );
    }
    case "led": {
      const fill = LED_FILL[ledColor(p)];
      const glow = r?.glow ?? 0;
      return (
        <g>
          <line x1={0} y1={0} x2={0} y2={-0.9 * G} className="stroke-subtle" strokeWidth={2} />
          <line x1={G} y1={0} x2={G} y2={-0.75 * G} className="stroke-subtle" strokeWidth={2} />
          {glow > 0 && <circle cx={0.5 * G} cy={-1.45 * G} r={(0.9 + glow * 0.9) * G} style={{ fill, opacity: 0.18 + glow * 0.45, filter: "blur(6px)" }} />}
          <path d={`M${0.05 * G} ${-0.85 * G} V${-1.5 * G} A${0.45 * G} ${0.45 * G} 0 0 1 ${0.95 * G} ${-1.5 * G} V${-0.85 * G} Z`} style={{ fill, opacity: 0.55 + glow * 0.45 }} className="stroke-black/30" />
          <rect x={-0.05 * G} y={-0.92 * G} width={1.1 * G} height={0.14 * G} rx={1} style={{ fill }} className="stroke-black/30" />
          <text x={-0.35 * G} y={-0.2 * G} className={label}>+</text>
        </g>
      );
    }
    case "capacitor":
      return (
        <g>
          <line x1={0} y1={0} x2={0} y2={-0.6 * G} className="stroke-subtle" strokeWidth={2} />
          <line x1={G} y1={0} x2={G} y2={-0.6 * G} className="stroke-subtle" strokeWidth={2} />
          <rect x={-0.15 * G} y={-2.85 * G} width={1.3 * G} height={2.3 * G} rx={0.35 * G} className="fill-tile-navy stroke-black/30" />
          <rect x={0.78 * G} y={-2.85 * G} width={0.32 * G} height={2.3 * G} className="fill-tile-sky/70" />
          <text x={0.18 * G} y={-1.5 * G} className="fill-white font-sans text-[7px] font-bold">{fmt(num(p, "c") * 1e-6, "F", 2).replace(" ", "")}</text>
        </g>
      );
    case "switch": {
      const on = switchClosed(p);
      return (
        <g>
          <line x1={0} y1={0} x2={0} y2={-0.3 * G} className="stroke-subtle" strokeWidth={2} />
          <line x1={2 * G} y1={0} x2={2 * G} y2={-0.3 * G} className="stroke-subtle" strokeWidth={2} />
          <rect x={-0.35 * G} y={-1.35 * G} width={2.7 * G} height={1.1 * G} rx={0.5 * G} className="fill-ink stroke-black/30" />
          <rect x={-0.15 * G} y={-1.15 * G} width={2.3 * G} height={0.7 * G} rx={0.35 * G} className={on ? "fill-tile-yellow" : "fill-white/15"} />
          <circle cx={(on ? 1.75 : 0.25) * G} cy={-0.8 * G} r={0.42 * G} className="fill-white stroke-black/20 transition-[cx] duration-200" />
          <text x={(on ? 0.2 : 1.05) * G} y={-0.62 * G} className={cn("font-sans text-[7px] font-black", on ? "fill-tile-navy" : "fill-white/70")}>{on ? "ON" : "OFF"}</text>
        </g>
      );
    }
    case "pot": {
      const angle = -135 + (num(p, "pos") / 100) * 270;
      return (
        <g>
          {[0, 1, 2].map((i) => <line key={i} x1={i * G} y1={0} x2={i * G} y2={-0.4 * G} className="stroke-subtle" strokeWidth={2} />)}
          <rect x={-0.45 * G} y={-2.55 * G} width={2.9 * G} height={2.2 * G} rx={0.3 * G} className="fill-tile-navy stroke-black/30" />
          <circle cx={G} cy={-1.45 * G} r={0.8 * G} className="fill-tile-sky stroke-white/40" />
          <line x1={G} y1={-1.45 * G} x2={G + Math.sin((angle * Math.PI) / 180) * 0.7 * G} y2={-1.45 * G - Math.cos((angle * Math.PI) / 180) * 0.7 * G} className="stroke-tile-navy" strokeWidth={3} strokeLinecap="round" />
        </g>
      );
    }
    case "battery":
      return (
        <g>
          <rect x={-0.6 * G} y={0.35 * G} width={3.2 * G} height={4.15 * G} rx={0.35 * G} className="fill-tile-navy stroke-black/30" />
          <rect x={-0.6 * G} y={2.2 * G} width={3.2 * G} height={1.2 * G} className="fill-tile-yellow" />
          <text x={G} y={3.08 * G} textAnchor="middle" className="fill-tile-navy font-sans text-[13px] font-black">{fmt(num(p, "v"), "V", 3).replace(" ", "")}</text>
          <rect x={-0.35 * G} y={-0.1 * G} width={0.7 * G} height={0.55 * G} rx={2} className="fill-tile-coral stroke-black/30" />
          <rect x={1.6 * G} y={-0.1 * G} width={0.8 * G} height={0.55 * G} rx={2} className="fill-subtle stroke-black/30" />
          <text x={0} y={1.25 * G} textAnchor="middle" className="fill-white font-sans text-[11px] font-black">+</text>
          <text x={2 * G} y={1.25 * G} textAnchor="middle" className="fill-white font-sans text-[11px] font-black">−</text>
        </g>
      );
    case "supply":
      return (
        <g>
          <rect x={-0.4 * G} y={-3.6 * G} width={4.8 * G} height={3.95 * G} rx={0.35 * G} className="fill-tile-midnight stroke-black/30" />
          <rect x={-0.1 * G} y={-3.3 * G} width={4.2 * G} height={1.6 * G} rx={3} className="fill-tile-sky" />
          <text x={2 * G} y={-2.55 * G} textAnchor="middle" className="fill-tile-navy font-mono text-[10px] font-bold">{num(p, "v").toFixed(2)} V</text>
          <text x={2 * G} y={-1.95 * G} textAnchor="middle" className="fill-tile-navy/70 font-mono text-[8px] font-bold">{r ? `${Math.abs(r.i).toFixed(3)} A` : "-.--- A"}</text>
          <circle cx={G} cy={-0.7 * G} r={0.38 * G} className="fill-ink stroke-white/40" />
          <circle cx={3 * G} cy={-0.7 * G} r={0.38 * G} className="fill-tile-coral stroke-white/40" />
          <line x1={G} y1={-0.35 * G} x2={G} y2={0} className="stroke-subtle" strokeWidth={2} />
          <line x1={3 * G} y1={-0.35 * G} x2={3 * G} y2={0} className="stroke-subtle" strokeWidth={2} />
        </g>
      );
    case "ammeter":
    case "voltmeter": {
      const amp = p.kind === "ammeter";
      return (
        <g>
          <rect x={-0.6 * G} y={-3.5 * G} width={3.2 * G} height={3.3 * G} rx={0.45 * G} className={cn(amp ? "fill-tile-yellow" : "fill-tile-blue", "stroke-black/30")} />
          <rect x={-0.35 * G} y={-3.22 * G} width={2.7 * G} height={1.3 * G} rx={3} className="fill-tile-sky stroke-black/20" />
          <text x={G} y={-2.35 * G} textAnchor="middle" className="fill-tile-navy font-mono text-[10px] font-black">{r?.reading !== undefined ? fmt(r.reading, amp ? "A" : "V", 3) : amp ? "— A" : "— V"}</text>
          <text x={G} y={-1.05 * G} textAnchor="middle" className={cn("font-sans text-[13px] font-black", amp ? "fill-tile-navy" : "fill-white")}>{amp ? "A" : "V"}</text>
          <circle cx={0} cy={-0.5 * G} r={0.26 * G} className="fill-tile-coral stroke-black/30" />
          <circle cx={2 * G} cy={-0.5 * G} r={0.26 * G} className="fill-ink stroke-black/30" />
          <line x1={0} y1={-0.25 * G} x2={0} y2={0} className="stroke-subtle" strokeWidth={2} />
          <line x1={2 * G} y1={-0.25 * G} x2={2 * G} y2={0} className="stroke-subtle" strokeWidth={2} />
        </g>
      );
    }
    case "diode":
      return (
        <g>
          <line x1={0} y1={0} x2={4 * G} y2={0} className="stroke-subtle" strokeWidth={2} />
          <rect x={1.05 * G} y={-0.32 * G} width={1.9 * G} height={0.64 * G} rx={0.22 * G} className="fill-ink stroke-black/40" />
          <rect x={2.5 * G} y={-0.32 * G} width={0.26 * G} height={0.64 * G} className="fill-line" />
          {r?.on && <rect x={1.05 * G} y={-0.32 * G} width={1.9 * G} height={0.64 * G} rx={0.22 * G} className="fill-tile-yellow/25" />}
        </g>
      );
    case "npn":
      return (
        <g>
          {[0, 1, 2].map((i) => <line key={i} x1={i * G} y1={0} x2={i * G} y2={-0.6 * G} className="stroke-subtle" strokeWidth={2} />)}
          <path d={`M${-0.3 * G} ${-0.6 * G} H${2.3 * G} V${-1.25 * G} A${1.3 * G} ${0.95 * G} 0 0 0 ${-0.3 * G} ${-1.25 * G} Z`} className="fill-ink stroke-black/40" />
          <text x={G} y={-1.05 * G} textAnchor="middle" className="fill-white/80 font-mono text-[6.5px] font-bold">BC547</text>
          {(["C", "B", "E"] as const).map((pin, i) => <text key={pin} x={i * G} y={0.75 * G} textAnchor="middle" className="fill-subtle font-sans text-[7px] font-black">{pin}</text>)}
        </g>
      );
    case "button": {
      const on = switchClosed(p);
      return (
        <g>
          <line x1={0} y1={0} x2={0} y2={-0.3 * G} className="stroke-subtle" strokeWidth={2} />
          <line x1={2 * G} y1={0} x2={2 * G} y2={-0.3 * G} className="stroke-subtle" strokeWidth={2} />
          <rect x={-0.35 * G} y={-1.55 * G} width={2.7 * G} height={1.3 * G} rx={0.2 * G} className="fill-ink stroke-black/30" />
          <circle cx={G} cy={-0.9 * G} r={(on ? 0.42 : 0.5) * G} className={cn("stroke-black/30 transition-[r]", on ? "fill-tile-yellow" : "fill-tile-coral")} />
        </g>
      );
    }
    case "ldr":
      return (
        <g>
          <line x1={0} y1={0} x2={0} y2={-0.6 * G} className="stroke-subtle" strokeWidth={2} />
          <line x1={2 * G} y1={0} x2={2 * G} y2={-0.6 * G} className="stroke-subtle" strokeWidth={2} />
          <circle cx={G} cy={-1.15 * G} r={0.72 * G} className="fill-tile-butter stroke-tile-navy/40" />
          <path d={`M${0.5 * G} ${-1.5 * G} h${0.9 * G} v${0.24 * G} h${-0.9 * G} v${0.24 * G} h${0.9 * G} v${0.24 * G} h${-0.9 * G}`} fill="none" className="stroke-tile-coral" strokeWidth={1.4} />
          <circle cx={G} cy={-1.15 * G} r={0.72 * G} className="fill-tile-yellow" style={{ opacity: Math.min(0.55, Math.log10(1 + num(p, "lux")) / 7) }} />
        </g>
      );
    case "fgen":
      return (
        <g>
          <rect x={-0.4 * G} y={-3.6 * G} width={4.8 * G} height={3.95 * G} rx={0.35 * G} className="fill-tile-navy stroke-black/30" />
          <rect x={-0.1 * G} y={-3.3 * G} width={4.2 * G} height={1.6 * G} rx={3} className="fill-tile-sky" />
          <path
            d={p.props.wave === "square" ? `M${0.2 * G} ${-2.1 * G} h${0.6 * G} v${-0.8 * G} h${0.8 * G} v${0.8 * G} h${0.8 * G} v${-0.8 * G} h${0.6 * G}` : p.props.wave === "triangle" ? `M${0.2 * G} ${-2.1 * G} l${0.7 * G} ${-0.8 * G} l${0.8 * G} ${0.8 * G} l${0.8 * G} ${-0.8 * G} l${0.5 * G} ${0.6 * G}` : `M${0.2 * G} ${-2.5 * G} q${0.4 * G} ${-0.9 * G} ${0.8 * G} 0 t${0.8 * G} 0 t${0.8 * G} 0 t${0.8 * G} 0`}
            fill="none"
            className="stroke-tile-navy"
            strokeWidth={1.6}
          />
          <text x={3.95 * G} y={-1.95 * G} textAnchor="end" className="fill-tile-navy font-mono text-[7px] font-bold">{fmt(num(p, "freq"), "Hz", 3)}</text>
          <circle cx={G} cy={-0.7 * G} r={0.38 * G} className="fill-ink stroke-white/40" />
          <circle cx={3 * G} cy={-0.7 * G} r={0.38 * G} className="fill-tile-coral stroke-white/40" />
          <line x1={G} y1={-0.35 * G} x2={G} y2={0} className="stroke-subtle" strokeWidth={2} />
          <line x1={3 * G} y1={-0.35 * G} x2={3 * G} y2={0} className="stroke-subtle" strokeWidth={2} />
        </g>
      );
    case "scope": {
      const ch = r?.pins;
      return (
        <g>
          <rect x={-0.6 * G} y={-4.3 * G} width={5.2 * G} height={4.05 * G} rx={0.4 * G} className="fill-ink stroke-black/30" />
          <rect x={-0.3 * G} y={-4 * G} width={3.4 * G} height={2.6 * G} rx={3} className="fill-tile-midnight" />
          {[1, 2, 3].map((i) => <line key={i} x1={-0.3 * G} x2={3.1 * G} y1={(-4 + i * 0.65) * G} y2={(-4 + i * 0.65) * G} className="stroke-white/10" />)}
          <path d={`M${-0.2 * G} ${-2.4 * G} q${0.4 * G} ${-1.2 * G} ${0.8 * G} 0 t${0.8 * G} 0 t${0.8 * G} 0 t${0.8 * G} 0`} fill="none" className="stroke-tile-yellow" strokeWidth={1.3} />
          <path d={`M${-0.2 * G} ${-2.2 * G} h${0.8 * G} v${-1.1 * G} h${0.8 * G} v${1.1 * G} h${0.8 * G} v${-1.1 * G} h${0.8 * G}`} fill="none" className="stroke-tile-sky" strokeWidth={1.1} />
          <text x={3.45 * G} y={-3.45 * G} className="fill-tile-yellow font-mono text-[6px] font-bold">CH1 {ch ? fmt(ch.CH1, "V", 2) : ""}</text>
          <text x={3.45 * G} y={-2.85 * G} className="fill-tile-sky font-mono text-[6px] font-bold">CH2 {ch ? fmt(ch.CH2, "V", 2) : ""}</text>
          {[["fill-tile-yellow", 0], ["fill-tile-sky", 2], ["fill-subtle", 4]].map(([c, x]) => (
            <g key={x as number}>
              <circle cx={(x as number) * G} cy={-0.75 * G} r={0.32 * G} className={cn(c as string, "stroke-black/30")} />
              <line x1={(x as number) * G} y1={-0.43 * G} x2={(x as number) * G} y2={0} className="stroke-subtle" strokeWidth={2} />
            </g>
          ))}
        </g>
      );
    }
    case "ground":
      return (
        <g className="stroke-ink" strokeWidth={2} strokeLinecap="round">
          <line x1={0} y1={0} x2={0} y2={0.5 * G} />
          <line x1={-0.6 * G} y1={0.5 * G} x2={0.6 * G} y2={0.5 * G} />
          <line x1={-0.38 * G} y1={0.8 * G} x2={0.38 * G} y2={0.8 * G} />
          <line x1={-0.16 * G} y1={1.1 * G} x2={0.16 * G} y2={1.1 * G} />
        </g>
      );
    case "breadboard": {
      const w = (BB_COLS - 1 + 1.8) * G;
      const holes = BB_ROWS.map(([, y]) => Array.from({ length: BB_COLS }, (_, c) => `M${c * G - 2.6} ${y * G - 2.6}h5.2v5.2h-5.2z`).join("")).join("");
      return (
        <g>
          <rect x={-0.9 * G} y={-0.9 * G} width={w} height={17.8 * G} rx={10} className="fill-white stroke-line" strokeWidth={1.5} />
          <rect x={-0.9 * G} y={7.65 * G} width={w} height={0.7 * G} className="fill-soft" />
          {[[-0.55, "stroke-brand"], [1.55, "stroke-tile-coral"], [14.45, "stroke-tile-coral"], [16.55, "stroke-brand"]].map(([y, c]) => (
            <line key={String(y)} x1={-0.4 * G} x2={(BB_COLS - 0.6) * G} y1={(y as number) * G} y2={(y as number) * G} className={c as string} strokeWidth={1.5} />
          ))}
          <path d={holes} className="fill-ink/25" />
          {["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"].map((r, i) => <text key={r} x={-0.62 * G} y={(i < 5 ? 3 + i : 4 + i) * G + 3} className="fill-subtle font-sans text-[7px] font-bold">{r}</text>)}
          {[1, 5, 10, 15, 20, 25, 30].map((c) => <text key={c} x={(c - 1) * G} y={2.35 * G} textAnchor="middle" className="fill-subtle font-sans text-[7px] font-bold">{c}</text>)}
        </g>
      );
    }
    case "arduino":
      return (
        <g>
          <rect x={-G} y={-0.9 * G} width={18.6 * G} height={10.8 * G} rx={10} className="fill-brand stroke-black/25" />
          <rect x={-0.45 * G} y={-0.42 * G} width={7.9 * G} height={0.84 * G} rx={2} className="fill-ink" />
          <rect x={8.55 * G} y={-0.42 * G} width={7.9 * G} height={0.84 * G} rx={2} className="fill-ink" />
          <rect x={1.55 * G} y={8.58 * G} width={7.9 * G} height={0.84 * G} rx={2} className="fill-ink" />
          <rect x={9.55 * G} y={8.58 * G} width={5.9 * G} height={0.84 * G} rx={2} className="fill-ink" />
          <rect x={-1.6 * G} y={1.6 * G} width={3 * G} height={2.4 * G} rx={2} className="fill-subtle" />
          <rect x={-1.4 * G} y={5.6 * G} width={2.6 * G} height={2.2 * G} rx={2} className="fill-ink" />
          <rect x={6 * G} y={4.6 * G} width={8.4 * G} height={1.7 * G} rx={2} className="fill-ink" />
          <text x={10.2 * G} y={5.7 * G} textAnchor="middle" className="fill-white/70 font-mono text-[8px]">ATmega328P</text>
          <text x={4 * G} y={3.4 * G} className="fill-white font-sans text-[18px] font-black italic">UNO</text>
          {pinsOf("arduino").map((pin) => <text key={pin.id} x={pin.x * G} y={pin.y === 0 ? 1.05 * G : 8.25 * G} textAnchor="middle" className="fill-white font-sans text-[5.5px] font-bold">{pin.id.replace(/^GND\d$/, "GND")}</text>)}
        </g>
      );
  }
}

/** One part, positioned and rotated, with its label. */
export function PartArt({ p, r, selected }: { p: Part; r?: PartResult; selected?: boolean }) {
  const [bx, by, bw, bh] = worldBox(p);
  const showLabel = p.kind !== "breadboard" && p.kind !== "ground";
  return (
    <g data-part={p.id}>
      {selected && <rect x={bx * G - 5} y={by * G - 5} width={bw * G + 10} height={bh * G + 10} rx={8} className="fill-brand/5 stroke-brand" strokeWidth={1.5} strokeDasharray="5 4" />}
      <g transform={`translate(${p.x * G} ${p.y * G}) rotate(${p.rot * 90})`}>
        <PartBody p={p} r={r} />
      </g>
      {showLabel && (
        <text x={(bx + bw / 2) * G} y={by * G - 5} textAnchor="middle" className="pointer-events-none fill-ink font-sans text-[9.5px] font-black">
          {p.label}
          {valueText(p) && p.kind !== "switch" && <tspan className="fill-subtle font-bold"> {valueText(p)}</tspan>}
        </text>
      )}
    </g>
  );
}

export function wireEnds(c: Circuit, w: Wire): [number, number, number, number] | null {
  const pa = c.parts.find((p) => p.id === w.a.part), pb = c.parts.find((p) => p.id === w.b.part);
  const ia = pa && pinsOf(pa.kind).find((x) => x.id === w.a.pin), ib = pb && pinsOf(pb.kind).find((x) => x.id === w.b.pin);
  if (!pa || !pb || !ia || !ib) return null;
  const [ax, ay] = pinPos(pa, ia), [bx, by] = pinPos(pb, ib);
  return [ax * G, ay * G, bx * G, by * G];
}

export function WireArt({ c, w, selected }: { c: Circuit; w: Wire; selected?: boolean }) {
  const e = wireEnds(c, w);
  if (!e) return null;
  const d = wirePath(...e);
  return (
    <g data-wire={w.id}>
      <path d={d} fill="none" className={selected ? "stroke-brand/40" : "stroke-black/25"} strokeWidth={selected ? 9 : 5} strokeLinecap="round" />
      <path d={d} fill="none" className={WIRE_COLORS[w.color ?? "blue"] ?? WIRE_COLORS.blue} strokeWidth={3} strokeLinecap="round" />
      <circle cx={e[0]} cy={e[1]} r={2.6} className="fill-ink" />
      <circle cx={e[2]} cy={e[3]} r={2.6} className="fill-ink" />
    </g>
  );
}

/** Draw order: boards first, then parts, then wires on top (as jumpers sit over the board). */
export const drawOrder = (c: Circuit) => [...c.parts].sort((a, b) => (a.kind === "breadboard" ? 0 : a.kind === "arduino" ? 1 : 2) - (b.kind === "breadboard" ? 0 : b.kind === "arduino" ? 1 : 2));

export function circuitBounds(c: Circuit, pad = 1.5): [number, number, number, number] {
  if (!c.parts.length) return [0, 0, 20 * G, 12 * G];
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of c.parts) {
    const [x, y, w, h] = worldBox(p);
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + w); y1 = Math.max(y1, y + h);
  }
  return [(x0 - pad) * G, (y0 - pad - 0.6) * G, (x1 - x0 + 2 * pad) * G, (y1 - y0 + 2 * pad + 0.6) * G];
}

/** Read-only rendering of a circuit (server or client), with simulation results if given. */
export function CircuitPreview({ c, result, className, title }: { c: Circuit; result?: DcResult; className?: string; title: string }) {
  const [x, y, w, h] = circuitBounds(c);
  return (
    <svg viewBox={`${x} ${y} ${w} ${h}`} role="img" aria-label={title} className={className}>
      {drawOrder(c).map((p) => <PartArt key={p.id} p={p} r={result?.parts[p.id]} />)}
      {c.wires.map((wire) => <WireArt key={wire.id} c={c} w={wire} />)}
    </svg>
  );
}

export { pinKey };
