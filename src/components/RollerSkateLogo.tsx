type Props = {
  className?: string;
  title?: string;
};

export default function RollerSkateLogo({
  className,
  title = "Roadkill Rollers",
}: Props) {
  return (
    <svg
      viewBox="0 0 680 370"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <desc>
        Een stoere rolschaats in zwart, wit en rood met bloempatroon in de
        wielen, een rode rem aan de voorkant, bliksemflits en rode spatten in
        retro derby stijl.
      </desc>

      <defs>
        <g id="petal-r">
          <path
            d="M 0,-4 C 5,-6 7,-11 4,-15 C 0,-17 -2,-14 -2,-10 C -2,-7 -1,-5 0,-4 Z"
            fill="#1A1A1A"
          />
        </g>
        <g id="rs-wheel">
          <circle r="33" fill="#1A1A1A" stroke="#FAFAFA" strokeWidth="2.5" />
          <circle r="29" fill="none" stroke="#FAFAFA" strokeWidth="1" />
          <circle r="22" fill="#FAFAFA" stroke="#1A1A1A" strokeWidth="1.2" />
          <use href="#petal-r" />
          <use href="#petal-r" transform="rotate(72)" />
          <use href="#petal-r" transform="rotate(144)" />
          <use href="#petal-r" transform="rotate(216)" />
          <use href="#petal-r" transform="rotate(288)" />
          <circle r="3" fill="#1A1A1A" />
        </g>
      </defs>

      {/* rode spatten linksboven / rechtsboven / rechtsonder */}
      <circle cx="115" cy="95" r="4.5" fill="#ED1C24" />
      <circle cx="138" cy="125" r="2.5" fill="#ED1C24" />
      <circle cx="88" cy="140" r="3" fill="#ED1C24" />
      <circle cx="580" cy="75" r="5" fill="#ED1C24" />
      <circle cx="600" cy="105" r="3" fill="#ED1C24" />
      <circle cx="620" cy="160" r="3.5" fill="#ED1C24" />
      <circle cx="565" cy="335" r="4" fill="#ED1C24" />
      <circle cx="595" cy="320" r="2.5" fill="#ED1C24" />
      <ellipse
        cx="620"
        cy="295"
        rx="3"
        ry="5"
        fill="#ED1C24"
        transform="rotate(20 620 295)"
      />
      <circle cx="78" cy="200" r="2.5" fill="#ED1C24" />

      {/* bliksemflits */}
      <polygon
        points="100,175 125,175 95,225 115,225 60,290 85,240 70,240"
        fill="#ED1C24"
        stroke="#1A1A1A"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* schaduw */}
      <ellipse cx="345" cy="338" rx="170" ry="6" fill="#000000" opacity="0.12" />

      {/* enkelband */}
      <rect
        x="195"
        y="78"
        width="115"
        height="18"
        rx="9"
        fill="#1A1A1A"
        stroke="#FAFAFA"
        strokeWidth="2"
      />

      {/* laars */}
      <path
        d="M 200 96 L 305 96 L 305 170 L 460 170 Q 482 172, 490 192 L 495 218 L 200 218 Z"
        fill="#1A1A1A"
        stroke="#FAFAFA"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      <line x1="305" y1="170" x2="305" y2="218" stroke="#FAFAFA" strokeWidth="1.5" />
      <line
        x1="210"
        y1="208"
        x2="488"
        y2="208"
        stroke="#FAFAFA"
        strokeWidth="1"
        strokeDasharray="4 3"
      />

      {/* vetergaatjes */}
      <circle cx="320" cy="182" r="2.8" fill="#FAFAFA" />
      <circle cx="355" cy="180" r="2.8" fill="#FAFAFA" />
      <circle cx="390" cy="180" r="2.8" fill="#FAFAFA" />
      <circle cx="425" cy="182" r="2.8" fill="#FAFAFA" />
      <circle cx="320" cy="208" r="2.8" fill="#FAFAFA" />
      <circle cx="355" cy="210" r="2.8" fill="#FAFAFA" />
      <circle cx="390" cy="210" r="2.8" fill="#FAFAFA" />
      <circle cx="425" cy="208" r="2.8" fill="#FAFAFA" />

      {/* veters */}
      <path
        d="M 320 182 L 355 210 M 320 208 L 355 180 M 355 180 L 390 210 M 355 210 L 390 180 M 390 180 L 425 208 M 390 210 L 425 182"
        stroke="#FAFAFA"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* onderplaat */}
      <rect
        x="188"
        y="218"
        width="320"
        height="20"
        rx="4"
        fill="#1A1A1A"
        stroke="#FAFAFA"
        strokeWidth="2.5"
      />

      {/* trucks */}
      <path
        d="M 222 238 L 268 238 L 258 254 L 232 254 Z"
        fill="#1A1A1A"
        stroke="#FAFAFA"
        strokeWidth="1.5"
      />
      <path
        d="M 422 238 L 468 238 L 458 254 L 432 254 Z"
        fill="#1A1A1A"
        stroke="#FAFAFA"
        strokeWidth="1.5"
      />

      {/* wielen */}
      <use href="#rs-wheel" transform="translate(245 285)" />
      <use href="#rs-wheel" transform="translate(445 285)" />

      {/* rem (toe stop) */}
      <circle
        cx="510"
        cy="258"
        r="19"
        fill="#ED1C24"
        stroke="#1A1A1A"
        strokeWidth="2.5"
      />
      <ellipse cx="505" cy="252" rx="6" ry="3" fill="#FAFAFA" opacity="0.45" />

      {/* rode spatten onderaan */}
      <path d="M 285 332 Q 281 342 285 348 Q 289 342 285 332 Z" fill="#ED1C24" />
      <path d="M 380 336 Q 376 346 380 352 Q 384 346 380 336 Z" fill="#ED1C24" />
      <circle cx="335" cy="345" r="2.5" fill="#ED1C24" />
      <circle cx="425" cy="348" r="2" fill="#ED1C24" />
    </svg>
  );
}
