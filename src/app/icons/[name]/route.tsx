import { ImageResponse } from "next/og";

const MASCOT = (mono = false) =>
  `data:image/svg+xml;base64,${Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#D4FF3F"/><stop offset=".55" stop-color="#5CFF7A"/><stop offset="1" stop-color="#12E9A8"/></linearGradient></defs><g fill="${mono ? "#fff" : "url(#g)"}"><rect x="44" y="4" width="12" height="26" rx="6"/><rect x="44" y="4" width="12" height="24" rx="6" transform="rotate(-38 50 50)"/><rect x="44" y="4" width="12" height="24" rx="6" transform="rotate(38 50 50)"/><circle cx="50" cy="63" r="31"/></g>${mono ? "" : '<g fill="#0b0d12"><rect x="37" y="54" width="9" height="16" rx="4.5"/><rect x="54" y="54" width="9" height="16" rx="4.5"/></g>'}</svg>`,
  ).toString("base64")}`;

/** /icons/192, /icons/512, /icons/maskable (safe-zone padded), /icons/badge (mono, for Android status bar) */
export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const size = name === "192" ? 192 : name === "badge" ? 96 : 512;
  const mono = name === "badge";
  const pad = name === "maskable" ? 0.62 : mono ? 0.9 : 0.78;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: mono ? "transparent" : "#060607" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MASCOT(mono)} width={size * pad} height={size * pad} alt="" />
      </div>
    ),
    { width: size, height: size },
  );
}
