import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  asLink?: boolean;
  className?: string;
}

export function Logo({ size = 32, asLink = true, className }: LogoProps) {
  const content = (
    <LogoSvg
      size={size}
      className={cn(
        "select-none shrink-0",
        asLink &&
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm",
        className,
      )}
    />
  );

  if (!asLink) return content;

  return (
    <Link href="/" aria-label={`${siteConfig.name} — go to homepage`}>
      {content}
    </Link>
  );
}

interface LogoSvgProps {
  size: number;
  className?: string;
}

// ─── Coordinate system ────────────────────────────────────────────────────────
//
//  viewBox: height=52, width=290
//
//  Inter Bold 40px metrics (approximate):
//    cap-height  ≈ 30px
//    strokeWidth ≈ 7px  (matches the visual stem width of bold glyphs)
//
//  The "O" pill at REST:
//    x=16, y=11, width=32, height=30, rx=15
//    → right edge at x=48
//
//  During EXPAND (leftward animation):
//    x shrinks to 3, width grows to 45
//    → left edge moves from 16 → 3 (13px of leftward travel)
//    → right edge stays fixed at 48 (16+32 = 48, also 3+45 = 48)
//
//  This means the RIGHT edge is the fixed anchor — expansion happens LEFT.
//
//  Text starts at x = 48 + 5 = 53

const VBW = 290;
const VBH = 52;

// ── Pill at rest (the "O" in normal state)
const PILL_X_REST   = 16;   // resting x — right edge = 16+32 = 48
const PILL_W_REST   = 32;   // resting width
const PILL_H        = 30;   // height = cap-height
const PILL_Y        = (VBH - PILL_H) / 2;  // 11 — vertically centred
const PILL_RX_REST  = 15;   // fully rounded pill
const PILL_RIGHT    = PILL_X_REST + PILL_W_REST; // 48 — this never changes

// ── Circle state (morphed)
const CIRCLE_W      = PILL_H;               // 30 — width = height = circle
const CIRCLE_X      = PILL_RIGHT - CIRCLE_W; // 48-30 = 18 — right edge stays fixed
const CIRCLE_RX     = CIRCLE_W / 2;         // 15

// ── Expand state (pill grows leftward)
const EXPAND_W      = 45;                   // wider pill
const EXPAND_X      = PILL_RIGHT - EXPAND_W; // 48-45 = 3 — left edge moves left
const EXPAND_RX     = PILL_RX_REST;         // stays fully rounded

const TEXT_X = PILL_RIGHT + 5; // 53 — text starts after the right edge of the O

// ─── Animation sequence ───────────────────────────────────────────────────────
//
//  0s ──── DELAY ──── morph to CIRCLE ──── HOLD ──── morph to EXPAND ────
//  ──── HOLD2 ──── morph back to REST ──── repeat
//
//  Keyframes:  REST → REST → CIRCLE → CIRCLE → EXPAND → EXPAND → REST → REST
//  (first and last REST duplicated so the pause at beginning/end is clean)

const DELAY  = 3.5;
const MORPH  = 0.55;
const HOLD   = 0.9;
const HOLD2  = 0.9;
const RETURN = 0.55;
const CYCLE  = DELAY + MORPH + HOLD + MORPH + HOLD2 + RETURN;

const tAt = (s: number) => s / CYCLE;
const T = {
  t0: 0,
  t1: tAt(DELAY),
  t2: tAt(DELAY + MORPH),
  t3: tAt(DELAY + MORPH + HOLD),
  t4: tAt(DELAY + MORPH + HOLD + MORPH),
  t5: tAt(DELAY + MORPH + HOLD + MORPH + HOLD2),
  t6: tAt(DELAY + MORPH + HOLD + MORPH + HOLD2 + RETURN),
  t7: 1,
};

const keyTimes = Object.values(T).join(";");
const keySplines = [
  "0 0 1 1",       // REST → REST         (instant, no easing)
  "0.42 0 0.58 1", // REST → CIRCLE       (ease in-out)
  "0 0 1 1",       // CIRCLE → CIRCLE     (instant)
  "0.42 0 0.58 1", // CIRCLE → EXPAND     (ease in-out)
  "0 0 1 1",       // EXPAND → EXPAND     (instant)
  "0.42 0 0.58 1", // EXPAND → REST       (ease in-out)
  "0 0 1 1",       // REST → loop         (instant)
].join(";");

const animProps = {
  calcMode: "spline" as const,
  dur: `${CYCLE}s`,
  repeatCount: "indefinite",
  keyTimes,
  keySplines,
};

// Value sequences: REST → REST → CIRCLE → CIRCLE → EXPAND → EXPAND → REST → REST
const mkValues = (rest: number, circle: number, expand: number) =>
  [rest, rest, circle, circle, expand, expand, rest, rest].join(";");

function LogoSvg({ size, className: svgClassName }: LogoSvgProps) {
  const renderH = size;
  const renderW = Math.round((VBW / VBH) * renderH);

  return (
    <svg
      width={renderW}
      height={renderH}
      viewBox={`0 0 ${VBW} ${VBH}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={siteConfig.name}
      role="img"
      className={svgClassName}
    >
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .oh-pill * { animation-play-state: paused; }
        }
      `}</style>

      {/* ── Animated "O" — right edge fixed, expands/collapses leftward ── */}
      <rect
        className="oh-pill"
        x={PILL_X_REST}
        y={PILL_Y}
        width={PILL_W_REST}
        height={PILL_H}
        rx={PILL_RX_REST}
        stroke="#0f172a"
        strokeWidth="7"
        fill="none"
      >
        {/* x: REST=16 → CIRCLE=18 → EXPAND=3 → REST=16 */}
        <animate
          attributeName="x"
          values={mkValues(PILL_X_REST, CIRCLE_X, EXPAND_X)}
          {...animProps}
        />
        {/* width: REST=32 → CIRCLE=30 → EXPAND=45 → REST=32 */}
        <animate
          attributeName="width"
          values={mkValues(PILL_W_REST, CIRCLE_W, EXPAND_W)}
          {...animProps}
        />
        {/* rx: REST=15 → CIRCLE=15 → EXPAND=15 (always fully rounded) */}
        <animate
          attributeName="rx"
          values={mkValues(PILL_RX_REST, CIRCLE_RX, EXPAND_RX)}
          {...animProps}
        />
      </rect>

      {/* ── "rder" dark + "Hub" blue ──────────────────────────────────── */}
      <text
        x={TEXT_X}
        y="26"
        dominantBaseline="central"
        fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
        fontSize="40"
        fontWeight="700"
        letterSpacing="0.5"
      >
        <tspan fill="#0f172a">rder</tspan>
        <tspan fill="#3b82f6">Hub</tspan>
      </text>
    </svg>
  );
}
