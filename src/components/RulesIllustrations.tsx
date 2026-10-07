// Brand-style SVG illustrations for the roller-derby explainer on /regels.
// Flat, self-contained line art in the tournament palette (no external assets,
// CSP-safe). Palette matches globals.css: ink #0a0a0a, accent #e30613,
// white #FAFAFA, cream #f7f1e6.

const INK = "#0a0a0a";
const ACCENT = "#e30613";
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
      {/* jammer: star; pivot: a stripe running front-to-back (along travel); blocker: plain */}
      {role === "jammer" && <Star cx={cx} cy={cy} r={r * 0.72} fill={INK} />}
      {role === "pivot" && (
        <rect
          x={cx - r * 0.72}
          y={cy - r * 0.26}
          width={r * 1.44}
          height={r * 0.52}
          rx={r * 0.22}
          fill={INK}
        />
      )}
    </g>
  );
}

/**
 * Roller-derby track seen from above (rounded-rectangle / stadium shape) with two
 * full teams of five lined up for the start of a jam: the jammer line (red) and
 * pivot line (white) across the straight, six blockers and two pivots (stripe) in
 * the pack between the lines, and the two jammers (star) behind the jammer line.
 */
export function TrackDiagram({ className, label }: Props) {
  return (
    <svg
      viewBox="0 0 390 260"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={label}
    >
      {/* track: outer boundary + infield (stadium shape, like a real flat track) */}
      <path
        d="M 129 16 L 261 16 A 114 114 0 0 1 261 244 L 129 244 A 114 114 0 0 1 129 16 Z"
        fill={INK}
      />
      <path
        d="M 153 84 L 237 84 A 46 46 0 0 1 237 176 L 153 176 A 46 46 0 0 1 153 84 Z"
        fill={CREAM}
      />
      {/* dashed centre line */}
      <path
        d="M 141 50 L 249 50 A 80 80 0 0 1 249 210 L 141 210 A 80 80 0 0 1 141 50 Z"
        fill="none"
        stroke={WHITE}
        strokeWidth="1.5"
        strokeDasharray="6 7"
        opacity="0.3"
      />

      {/* start lines across the bottom straight: jammer line (red), pivot line (white) */}
      <line x1="172" y1="176" x2="172" y2="244" stroke={ACCENT} strokeWidth="4" />
      <line x1="224" y1="176" x2="224" y2="244" stroke={WHITE} strokeWidth="4" />

      {/* direction of play (counter-clockwise): arrow on the top straight */}
      <g stroke={ACCENT} strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M 228 42 L 166 42" />
      </g>
      <polygon points="166,36 154,42 166,48" fill={ACCENT} />

      {/* the pack: two pivots (stripe) + six blockers, both teams, between the lines */}
      <PlayerToken cx={180} cy={196} team="A" role="blocker" r={11} />
      <PlayerToken cx={198} cy={190} team="B" role="blocker" r={11} />
      <PlayerToken cx={216} cy={196} team="A" role="pivot" r={11} />
      <PlayerToken cx={188} cy={214} team="A" role="blocker" r={11} />
      <PlayerToken cx={206} cy={212} team="B" role="blocker" r={11} />
      <PlayerToken cx={222} cy={220} team="B" role="pivot" r={11} />
      <PlayerToken cx={196} cy={232} team="A" role="blocker" r={11} />
      <PlayerToken cx={214} cy={234} team="B" role="blocker" r={11} />

      {/* the two jammers (star), one per team, behind the jammer line */}
      <PlayerToken cx={156} cy={200} team="A" role="jammer" r={11} />
      <PlayerToken cx={156} cy={224} team="B" role="jammer" r={11} />
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

      {variant === "jammer" && <Star cx={62} cy={62} r={20} fill={ACCENT} />}

      {variant === "pivot" && (
        // Side view: the stripe runs front (left) to back (right) over the crown.
        <g clipPath={`url(#helmet-clip-${variant})`}>
          <path
            d="M 28 71 A 33 33 0 0 1 92 71"
            fill="none"
            stroke={ACCENT}
            strokeWidth="16"
            strokeLinecap="round"
          />
        </g>
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
      <circle cx="48" cy="84" r="20" fill={ACCENT} stroke={INK} strokeWidth="2" />
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

type TacticVariant = "wall" | "pack" | "isolate";

/**
 * Mini pack diagrams for the cheatsheet. Direction of play is left, so a skater
 * "in front" sits further left. Team A = red, team B = white.
 */
export function TacticDiagram({
  variant,
  className,
  label,
}: Props & { variant: TacticVariant }) {
  return (
    <svg
      viewBox="0 0 160 80"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={label}
    >
      {variant === "wall" && (
        <>
          {/* three white blockers side by side, the red jammer stuck behind them */}
          <PlayerToken cx={62} cy={18} team="B" role="blocker" />
          <PlayerToken cx={62} cy={42} team="B" role="pivot" />
          <PlayerToken cx={62} cy={66} team="B" role="blocker" />
          <PlayerToken cx={116} cy={42} team="A" role="jammer" />
          <line x1="100" y1="42" x2="80" y2="42" stroke={ACCENT} strokeWidth="3" strokeLinecap="round" />
          <line x1="88" y1="34" x2="80" y2="50" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          <line x1="80" y1="34" x2="88" y2="50" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {variant === "pack" && (
        <>
          {/* both teams' blockers bunched together, a jammer looking for a gap */}
          <PlayerToken cx={46} cy={26} team="B" role="blocker" />
          <PlayerToken cx={50} cy={54} team="A" role="pivot" />
          <PlayerToken cx={72} cy={40} team="A" role="blocker" />
          <PlayerToken cx={78} cy={64} team="B" role="pivot" />
          <PlayerToken cx={74} cy={16} team="A" role="blocker" />
          <PlayerToken cx={98} cy={30} team="B" role="blocker" />
          <PlayerToken cx={136} cy={46} team="A" role="jammer" />
          <path
            d="M 122 46 Q 110 46 104 50"
            fill="none"
            stroke={ACCENT}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="4 4"
          />
        </>
      )}
      {variant === "isolate" && (
        <>
          {/* two red blockers push one white blocker away from its pack */}
          <PlayerToken cx={22} cy={40} team="B" role="blocker" />
          <PlayerToken cx={44} cy={30} team="B" role="pivot" />
          <PlayerToken cx={100} cy={28} team="A" role="blocker" />
          <PlayerToken cx={100} cy={54} team="A" role="blocker" />
          <PlayerToken cx={128} cy={41} team="B" role="blocker" />
          <line x1="64" y1="40" x2="82" y2="40" stroke={INK} strokeWidth="2" strokeDasharray="3 4" />
          <path d="M 146 41 L 156 41" stroke={ACCENT} strokeWidth="3" strokeLinecap="round" />
          <polygon points="156,36 160,41 156,46" fill={ACCENT} />
        </>
      )}
    </svg>
  );
}

type CheatIconKind = "clock" | "team" | "star" | "contact" | "penalty";

/** Simple line icons for the cheatsheet's list of key rules. */
export function CheatIcon({
  kind,
  className,
}: {
  kind: CheatIconKind;
  className?: string;
}) {
  const stroke = {
    fill: "none",
    stroke: INK,
    strokeWidth: 2.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {kind === "clock" && (
        <>
          <circle cx="20" cy="22" r="13" {...stroke} />
          <path d="M 20 22 L 20 14 M 20 22 L 26 25 M 16 5 L 24 5 M 20 5 L 20 9" {...stroke} />
        </>
      )}
      {kind === "team" && (
        <>
          {[8, 20, 32].map((x) => (
            <g key={x}>
              <circle cx={x} cy="13" r="4.5" fill={x === 20 ? ACCENT : INK} />
              <path d={`M ${x - 6} 32 Q ${x - 6} 20 ${x} 20 Q ${x + 6} 20 ${x + 6} 32 Z`} fill={x === 20 ? ACCENT : INK} />
            </g>
          ))}
        </>
      )}
      {kind === "star" && <Star cx={20} cy={21} r={15} fill={ACCENT} />}
      {kind === "contact" && (
        <>
          {/* shoulder-to-hip blocking zone: torso with highlighted legal zone */}
          <circle cx="20" cy="7" r="4.5" fill={INK} />
          <rect x="12" y="13" width="16" height="16" rx="3" fill={ACCENT} />
          <path d="M 15 29 L 14 37 M 25 29 L 26 37" {...stroke} />
        </>
      )}
      {kind === "penalty" && (
        <>
          <circle cx="20" cy="20" r="15" {...stroke} />
          <path d="M 20 11 L 20 23" {...stroke} stroke={ACCENT} strokeWidth={3.5} />
          <circle cx="20" cy="29" r="2.2" fill={ACCENT} />
        </>
      )}
    </svg>
  );
}
