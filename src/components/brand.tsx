import { avatarSvg } from "@/lib/avatar";

/** Mascot: lime→mint blob with three rays and two eyes. Pure SVG so it scales from 16px pins to hero. */
export function Mascot({
  size = 40,
  className = "",
  rays = true,
  glow = true,
  live = false,
  tone = "pop",
}: {
  size?: number;
  className?: string;
  rays?: boolean;
  glow?: boolean;
  /** Idle animation: head tilt + occasional blink */
  live?: boolean;
  /** pop = lime→mint (Popouts). tix = amber→coral (Events). */
  tone?: "pop" | "tix";
}) {
  const id = `m${tone}${size}`;
  const stops = tone === "tix" ? ["#FFCF4A", "#FFB03B", "#FF6B4A"] : ["#D4FF3F", "#5CFF7A", "#12E9A8"];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={`${live ? "mascot-live" : ""} ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={stops[0]} />
          <stop offset="0.55" stopColor={stops[1]} />
          <stop offset="1" stopColor={stops[2]} />
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
      <g fill="#0b0d12" className="eyes">
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
      className={`font-display inline-flex items-center text-cream ${className}`}
      style={{ fontSize: size, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1, height: size * 1.15, transform: "translateY(-2%)" }}
      aria-label="Popout"
    >
      pop
      <Mascot size={size * 1.15} className="-mx-[0.02em]" glow={false} />
      ut
    </span>
  );
}

/** Deterministic mascot avatar from any seed (user id). Same person → same face, everywhere. */
export function Avatar({ seed, size = 40, className = "" }: { seed: string; size?: number; className?: string }) {
  return <span className={`inline-flex leading-none ${className}`} style={{ width: size, height: size }} aria-hidden="true" dangerouslySetInnerHTML={{ __html: avatarSvg(seed, size) }} />;
}
