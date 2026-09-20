import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { whenLong } from "@/lib/format";
import { avatarDataUri } from "@/lib/avatar";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Popout";

// Satori needs TTF/OTF. Google serves TTF to old user agents; fall back to system sans if it fails.
async function fredoka(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch("https://fonts.googleapis.com/css2?family=Fredoka:wght@700", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1; rv:6.0) Gecko/20110814 Firefox/6.0" },
    }).then((r) => r.text());
    const url = css.match(/src: url\((https:[^)]+\.(?:ttf|woff))\)/)?.[1];
    return url ? await fetch(url).then((r) => r.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

const MASCOT = (grad: [string, string, string]) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${grad[0]}"/><stop offset=".55" stop-color="${grad[1]}"/><stop offset="1" stop-color="${grad[2]}"/></linearGradient></defs><g fill="url(#g)"><rect x="44" y="4" width="12" height="26" rx="6"/><rect x="44" y="4" width="12" height="24" rx="6" transform="rotate(-38 50 50)"/><rect x="44" y="4" width="12" height="24" rx="6" transform="rotate(38 50 50)"/><circle cx="50" cy="63" r="31"/></g><g fill="#0b0d12"><rect x="37" y="54" width="9" height="16" rx="4.5"/><rect x="54" y="54" width="9" height="16" rx="4.5"/></g></svg>`,
  )}`;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: p }, font] = await Promise.all([
    supabase
      .from("popouts")
      .select("title,venue,starts_at,max_people,event_id,host:profiles!host_id(id,name,age),members:popout_members(status,plus_one)")
      .eq("id", id)
      .maybeSingle(),
    fredoka(),
  ]);

  const host = (p?.host as unknown as { id: string; name: string; age: number | null } | null) ?? { id: "x", name: "Someone", age: null };
  const filled = ((p?.members as { status: string; plus_one: boolean }[] | undefined) ?? []).filter((m) => m.status !== "dropped" && m.status !== "removed").reduce((a, m) => a + (m.plus_one ? 2 : 1), 0);
  const max = p?.max_people ?? 4;
  const crew = !!p?.event_id;
  const accent = crew ? "#FFB03B" : "#5CFF7A";
  const glow = crew ? "255,176,59" : "92,255,122";
  const first = host.name.split(" ")[0];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #060607 0%, #101214 100%)",
          color: "#FAFAF7",
          fontFamily: font ? "Fredoka" : "sans-serif",
          padding: 64,
          position: "relative",
        }}
      >
        {/* glow */}
        <div style={{ position: "absolute", right: -160, top: -160, width: 640, height: 640, borderRadius: 999, background: `radial-gradient(circle, rgba(${glow},0.22) 0%, rgba(${glow},0) 68%)` }} />

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <div style={{ display: "flex", width: 132, height: 132, borderRadius: 999, background: "rgba(255,255,255,0.08)", border: "2px solid rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarDataUri(host.id, 100)} width={100} height={100} alt="" />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 30, color: "rgba(250,250,247,0.6)" }}>{`${first}${host.age ? `, ${host.age}` : ""} is ${crew ? "going" : "doing"}`}</div>
              <div style={{ fontSize: 26, color: accent, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{crew ? "Crew" : "Popout"}</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ fontSize: p && p.title.length > 40 ? 58 : 72, fontWeight: 700, lineHeight: 1.05, maxWidth: 1000 }}>{p?.title ?? "Popout"}</div>
            <div style={{ fontSize: 32, color: "rgba(250,250,247,0.75)" }}>
              {p ? `${whenLong(p.starts_at)} · ${p.venue}` : "Find something to do. Find someone to do it with."}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ display: "flex", gap: 8 }}>
                {Array.from({ length: max }).map((_, i) => (
                  <div key={i} style={{ width: 18, height: 18, borderRadius: 999, background: i < filled ? accent : "transparent", border: `2px solid ${i < filled ? accent : "rgba(250,250,247,0.35)"}` }} />
                ))}
              </div>
              <div style={{ fontSize: 30, color: "rgba(250,250,247,0.75)" }}>{filled >= max ? "Full" : `${filled} of ${max} joined · ${max - filled} left`}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>
              <span>pop</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={MASCOT(["#D4FF3F", "#5CFF7A", "#12E9A8"])} width={52} height={52} alt="" style={{ margin: "0 -2px" }} />
              <span>ut</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, ...(font ? { fonts: [{ name: "Fredoka", data: font, weight: 700, style: "normal" }] } : {}) },
  );
}
