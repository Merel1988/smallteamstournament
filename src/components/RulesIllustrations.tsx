// Brand-style SVG illustrations for the roller-derby explainer on /regels.
// Flat, self-contained line art in the tournament palette (no external assets,
// CSP-safe). Palette matches globals.css: ink #0a0a0a, accent #e30613,
// yellow #f4c41f, cream #f7f1e6.

const INK = "#0a0a0a";
const ACCENT = "#e30613";
const YELLOW = "#f4c41f";
const CREAM = "#f7f1e6";
const WHITE = "#FAFAFA";

type Props = {
  className?: string;
  label: string;
};

// Small reusable 5-point star.
function Star({
  cx,
  cy,
  r,
  fill,
}: {
  cx: number;
  cy: number;
  r: number;
  fill: string;
}) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * 0.42;
    // -90° start so a point faces up.
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${cx + radius * Math.cos(a)},${cy + radius * Math.sin(a)}`);
  }
  return <polygon points={pts.join(" ")} fill={fill} />;
}

/** Oval flat track seen from above, with the pack and a jammer breaking out. */
export function TrackDiagram({ className, label }: Props) {
  return (
    <svg
      viewBox="0 0 420 240"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={label}
    >
      {/* track ring */}
      <ellipse cx="210" cy="120" rx="196" ry="106" fill={INK} />
      <ellipse cx="210" cy="120" rx="104" ry="40" fill={CREAM} />
      {/* dashed centre line */}
      <ellipse
        cx="210"
        cy="120"
        rx="150"
        ry="73"
        fill="none"
        stroke={WHITE}
        strokeWidth="1.5"
        strokeDasharray="6 7"
        opacity="0.35"
      />
      {/* direction of play (counter-clockwise): arrow on the top straight */}
      <g stroke={YELLOW} strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M 250 30 L 190 30" />
      </g>
      <polygon points="190,24 178,30 190,36" fill={YELLOW} />

      {/* the pack (bottom straight): two teams mixed together */}
      <g stroke={INK} strokeWidth="2">
        <circle cx="250" cy="192" r="12" fill={WHITE} />
        <circle cx="285" cy="196" r="12" fill={ACCENT} />
        <circle cx="220" cy="196" r="12" fill={ACCENT} />
        <circle cx="188" cy="192" r="12" fill={WHITE} />
      </g>

      {/* jammer breaking out ahead of the pack */}
      <circle cx="138" cy="188" r="15" fill={YELLOW} stroke={INK} strokeWidth="2" />
      <Star cx={138} cy={188} r={9} fill={ACCENT} />
    </svg>
  );
}

type HelmetVariant = "jammer" | "pivot" | "blocker";

/** A single derby helmet showing its position cover (star / stripe / plain). */
export function HelmetCover({
  variant,
  className,
  label,
}: Props & { variant: HelmetVariant }) {
  return (
    <svg
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={label}
    >
      <defs>
        <clipPath id={`helmet-clip-${variant}`}>
          <path d="M 18 82 A 42 42 0 0 1 102 82 L 102 86 Q 102 96 92 96 L 28 96 Q 18 96 18 86 Z" />
        </clipPath>
      </defs>

      {/* helmet dome */}
      <path
        d="M 18 82 A 42 42 0 0 1 102 82 L 102 86 Q 102 96 92 96 L 28 96 Q 18 96 18 86 Z"
        fill={INK}
      />
      {/* ear vent */}
      <circle cx="40" cy="78" r="6" fill={CREAM} opacity="0.55" />

      {variant === "jammer" && <Star cx={62} cy={62} r={20} fill={YELLOW} />}

      {variant === "pivot" && (
        <rect
          x="18"
          y="56"
          width="84"
          height="14"
          fill={YELLOW}
          clipPath={`url(#helmet-clip-${variant})`}
        />
      )}

      {variant === "blocker" && (
        <>
          <circle cx="60" cy="62" r="4" fill={CREAM} opacity="0.5" />
          <circle cx="76" cy="64" r="4" fill={CREAM} opacity="0.5" />
        </>
      )}
    </svg>
  );
}

/** The jammer passing three opponents — each pass scores a point. */
export function ScoringDiagram({ className, label }: Props) {
  return (
    <svg
      viewBox="0 0 420 150"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={label}
    >
      {/* track band */}
      <rect x="8" y="58" width="404" height="52" rx="26" fill={INK} opacity="0.06" />

      {/* pass line with arrowhead */}
      <path
        d="M 78 84 L 372 84"
        stroke={ACCENT}
        strokeWidth="2.5"
        strokeDasharray="7 6"
        fill="none"
      />
      <polygon points="372,77 386,84 372,91" fill={ACCENT} />

      {/* three opponents, each worth +1 when passed */}
      {[160, 250, 340].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="84" r="16" fill={WHITE} stroke={INK} strokeWidth="2" />
          <text
            x={cx}
            y="34"
            textAnchor="middle"
            fontSize="20"
            fontWeight="700"
            fill={ACCENT}
          >
            +1
          </text>
        </g>
      ))}

      {/* jammer */}
      <circle cx="48" cy="84" r="20" fill={YELLOW} stroke={INK} strokeWidth="2" />
      <Star cx={48} cy={84} r={12} fill={ACCENT} />
    </svg>
  );
}

/** A referee whistle with sound lines and a 30-second penalty clock. */
export function PenaltyDiagram({ className, label }: Props) {
  return (
    <svg
      viewBox="0 0 220 168"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={label}
    >
      {/* whistle body + mouthpiece */}
      <circle cx="62" cy="78" r="30" fill={INK} />
      <rect x="88" y="64" width="46" height="22" rx="5" fill={INK} />
      <circle cx="78" cy="62" r="7" fill={CREAM} />

      {/* sound lines */}
      <g stroke={ACCENT} strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M 146 54 q 12 8 0 22" />
        <path d="M 158 44 q 20 14 0 42" />
      </g>

      {/* penalty clock: 30 seconds */}
      <circle cx="150" cy="120" r="26" fill={WHITE} stroke={INK} strokeWidth="2.5" />
      <path
        d="M 150 120 L 150 100"
        stroke={ACCENT}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M 150 120 L 165 127"
        stroke={INK}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <text
        x="150"
        y="162"
        textAnchor="middle"
        fontSize="15"
        fontWeight="700"
        fill={INK}
      >
        0:30
      </text>
    </svg>
  );
}
