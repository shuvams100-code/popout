/** Mascot: lime→mint blob with three rays and two eyes. Pure SVG so it scales from 16px pins to hero. */
export function Mascot({ size = 40, className = "", rays = true, glow = true }: { size?: number; className?: string; rays?: boolean; glow?: boolean }) {
  const id = "m" + size;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#D4FF3F" />
          <stop offset="0.55" stopColor="#5CFF7A" />
          <stop offset="1" stopColor="#12E9A8" />
        </linearGradient>
        <radialGradient id={`${id}-h`} cx="0.32" cy="0.28" r="0.5">
          <stop offset="0" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        {glow && (
          <filter id={`${id}-f`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>
      <g filter={glow ? `url(#${id}-f)` : undefined}>
        {rays && (
          <g fill={`url(#${id}-g)`}>
            <rect x="44" y="4" width="12" height="26" rx="6" />
            <rect x="44" y="4" width="12" height="24" rx="6" transform="rotate(-38 50 50)" />
            <rect x="44" y="4" width="12" height="24" rx="6" transform="rotate(38 50 50)" />
          </g>
        )}
        <circle cx="50" cy="63" r="31" fill={`url(#${id}-g)`} />
        <circle cx="50" cy="63" r="31" fill={`url(#${id}-h)`} />
      </g>
      <g fill="#0b0d12">
        <rect x="37" y="54" width="9" height="16" rx="4.5" />
        <rect x="54" y="54" width="9" height="16" rx="4.5" />
      </g>
    </svg>
  );
}

/** Wordmark: "pop" + mascot as the second o + "ut". */
export function Wordmark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      className={`font-display inline-flex items-end leading-none text-cream ${className}`}
      style={{ fontSize: size, fontWeight: 700, letterSpacing: "-0.02em" }}
      aria-label="Popout"
    >
      pop
      <Mascot size={size * 1.15} className="-mx-[0.02em] -mb-[0.12em]" glow={false} />
      ut
    </span>
  );
}
