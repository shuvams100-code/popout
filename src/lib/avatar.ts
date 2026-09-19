const PALETTES: [string, string, string][] = [
  ["#D4FF3F", "#5CFF7A", "#12E9A8"], // brand
  ["#FFCF4A", "#FFB03B", "#FF6B4A"], // amber
  ["#FF7AD9", "#FF4FB0", "#C43BFF"], // pink → violet
  ["#7CE0FF", "#3FA9FF", "#3F5BFF"], // sky → blue
  ["#B58CFF", "#8A5CFF", "#5B3FFF"], // violet
  ["#5CFFE1", "#20D9C9", "#12A8E9"], // teal → cyan
  ["#FF8A5C", "#FF5C5C", "#E93F6B"], // coral → red
  ["#FFF35C", "#D4FF3F", "#8CFF5C"], // yellow → lime
  ["#FFB3C7", "#FF7AA6", "#FF4F8B"], // rose
  ["#C7FFB3", "#7AFFB0", "#3FE9C4"], // mint
  ["#FFD6A5", "#FFB28A", "#FF8A80"], // peach
  ["#9CE7FF", "#8AB4FF", "#B18AFF"], // ice → lavender
];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Deterministic mascot avatar as an SVG string. Same seed → same face, in React and in OG images. */
export function avatarSvg(seed: string, size = 40): string {
  const h = hash(seed);
  const [a, b, c] = PALETTES[h % PALETTES.length];
  const eyes = (h >>> 4) % 4; // 0 oval, 1 round, 2 happy, 3 wink
  const rays = (h >>> 8) % 3; // 0 three, 1 one, 2 five
  const id = `av${h.toString(36)}`;
  const ink = "#0b0d12";

  const rayShapes = [
    rays !== 1 ? `<rect x="44" y="4" width="12" height="24" rx="6" transform="rotate(-38 50 50)"/><rect x="44" y="4" width="12" height="24" rx="6" transform="rotate(38 50 50)"/>` : "",
    `<rect x="44" y="4" width="12" height="26" rx="6"/>`,
    rays === 2 ? `<rect x="44" y="10" width="10" height="18" rx="5" transform="rotate(-70 50 50)"/><rect x="44" y="10" width="10" height="18" rx="5" transform="rotate(70 50 50)"/>` : "",
  ].join("");

  const eyeShapes = [
    `<rect x="37" y="54" width="9" height="16" rx="4.5" fill="${ink}"/><rect x="54" y="54" width="9" height="16" rx="4.5" fill="${ink}"/>`,
    `<circle cx="41" cy="62" r="5.5" fill="${ink}"/><circle cx="59" cy="62" r="5.5" fill="${ink}"/>`,
    `<g fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round"><path d="M35 64q6-8 12 0"/><path d="M53 64q6-8 12 0"/></g>`,
    `<rect x="37" y="54" width="9" height="16" rx="4.5" fill="${ink}"/><path d="M53 63q6-6 12 0" fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round"/>`,
  ][eyes];

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">` +
    `<defs><linearGradient id="${id}-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".55" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>` +
    `<radialGradient id="${id}-h" cx=".32" cy=".28" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>` +
    `<g fill="url(#${id}-g)">${rayShapes}<circle cx="50" cy="63" r="31"/></g>` +
    `<circle cx="50" cy="63" r="31" fill="url(#${id}-h)"/>` +
    eyeShapes +
    `</svg>`
  );
}

export const avatarDataUri = (seed: string, size = 40) => `data:image/svg+xml;base64,${Buffer.from(avatarSvg(seed, size)).toString("base64")}`;
