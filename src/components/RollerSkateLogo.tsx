type Props = {
  className?: string;
  title?: string;
};

export default function RollerSkateLogo({
  className,
  title = "Roadkill Rollers",
}: Props) {
  const line = "var(--derby-bg, #f7f1e6)";
  const red = "var(--derby-accent, #e30613)";
  const redDark = "var(--derby-accent-dark, #8b0000)";
  const hub = "var(--derby-yellow, #f4c41f)";

  return (
    <svg
      viewBox="0 0 64 48"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>

      <path
        d="M10 28 Q10 10 22 10 L40 10 Q50 10 54 20 L56 26 Q57 30 53 32 L10 32 Z"
        fill={red}
        stroke={line}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      <path
        d="M24 14 L36 14 M24 18 L36 18 M24 22 L36 22"
        stroke={line}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.85"
      />

      <circle cx="42" cy="13" r="1.8" fill={line} />

      <rect x="8" y="32" width="48" height="4" rx="1" fill={line} />

      <path
        d="M4 34 L10 34 L10 40 Q10 42 8 42 L6 42 Q4 42 4 40 Z"
        fill={redDark}
        stroke={line}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {[16, 28, 40, 50].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="40" r="5" fill={line} />
          <circle cx={cx} cy="40" r="1.8" fill={hub} />
        </g>
      ))}
    </svg>
  );
}
