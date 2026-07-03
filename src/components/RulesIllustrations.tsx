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

type Team = "A" | "B";
type PlayerRole = "jammer" | "pivot" | "blocker";

/** One skater on the track: colour marks the team, the marking marks the position. */
function PlayerToken({
  cx,
  cy,
  team,
  role,
  r = 12,
}: {
  cx: number;
  cy: number;
  team: Team;
  role: PlayerRole;
  r?: number;
}) {
  const fill = team === "A" ? ACCENT : WHITE;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={fill} stroke={INK} strokeWidth="2" />
      {/* jammer: star; pivot: a stripe front-to-back down the middle; blocker: plain */}
      {role === "jammer" && <Star cx={cx} cy={cy} r={r * 0.72} fill={INK} />}
      {role === "pivot" && (
        <rect
          x={cx - r * 0.26}
          y={cy - r * 0.72}
          width={r * 0.52}
          height={r * 1.44}
          rx={r * 0.22}
          fill={INK}
        />
      )}
    </g>
  );
}

/**
 * Round flat track seen from above with two full teams of five on it: two jammers
 * (star) breaking out ahead of the pack of six blockers and two pivots (stripe).
 */
export function TrackDiagram({ className, label }: Props) {
  return (
    <svg
      viewBox="0 0 360 300"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={label}
    >
      {/* track ring (rounded oval) + infield */}
      <ellipse cx="180" cy="150" rx="170" ry="132" fill={INK} />
      <ellipse cx="180" cy="150" rx="88" ry="58" fill={CREAM} />
      {/* dashed centre line */}
      <ellipse
        cx="180"
        cy="150"
        rx="128"
        ry="95"
        fill="none"
        stroke={WHITE}
        strokeWidth="1.5"
        strokeDasharray="6 7"
        opacity="0.35"
      />
      {/* direction of play (counter-clockwise): arrow on the top straight */}
      <g stroke={YELLOW} strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M 214 46 L 150 46" />
      </g>
      <polygon points="150,40 138,46 150,52" fill={YELLOW} />

      {/* the pack: two pivots (stripe) + six blockers, both teams mixed together */}
      <PlayerToken cx={150} cy={232} team="A" role="pivot" />
      <PlayerToken cx={192} cy={228} team="B" role="pivot" />
      <PlayerToken cx={128} cy={250} team="B" role="blocker" />
      <PlayerToken cx={168} cy={252} team="A" role="blocker" />
      <PlayerToken cx={210} cy={250} team="B" role="blocker" />
      <PlayerToken cx={232} cy={244} team="A" role="blocker" />
      <PlayerToken cx={150} cy={270} team="B" role="blocker" />
      <PlayerToken cx={196} cy={272} team="A" role="blocker" />

      {/* the two jammers (star) breaking out ahead of the pack */}
      <PlayerToken cx={95} cy={255} team="A" role="jammer" />
      <PlayerToken cx={74} cy={222} team="B" role="jammer" />
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
        // Stripe runs front-to-back down the centre of the dome, not across the side.
        <rect
          x="53"
          y="38"
          width="14"
          height="60"
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
