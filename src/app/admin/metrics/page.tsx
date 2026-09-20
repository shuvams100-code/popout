import { notFound } from "next/navigation";
import SiteHeader from "@/components/site-header";
import { createClient, getViewer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type M = { completed_8w: number; attendance_rate: number | null; repeat_rate: number | null; created_by_others_7d: number; repeat_hosts: number; women: number; men: number; founder_share: number | null };

/** The PRD's kill criteria, live. Two reds at week 8 = kill. */
export default async function Metrics() {
  const user = await getViewer();
  if (!user) notFound();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("kill_metrics");
  if (error || !data) notFound();
  const m = data as M;
  const total = m.women + m.men;
  const menShare = total ? Math.round((100 * m.men) / total) : null;

  const rows: { label: string; value: string; target: string; kill: string; red: boolean | null; note: string }[] = [
    { label: "Completed Popouts, last 8 weeks", value: String(m.completed_8w), target: "≥ 8 to evaluate", kill: "—", red: null, note: "North star. Done + at least one attended." },
    { label: "Attended after joining", value: m.attendance_rate === null ? "—" : `${m.attendance_rate}%`, target: "70%", kill: "< 60%", red: m.attendance_rate === null ? null : m.attendance_rate < 60, note: "The wedge. If this fails, nothing else matters." },
    { label: "Second attendance within 30 days", value: m.repeat_rate === null ? "—" : `${m.repeat_rate}%`, target: "40%", kill: "< 30%", red: m.repeat_rate === null ? null : m.repeat_rate < 30, note: "Was it good enough to repeat." },
    { label: "Popouts created by others, last 7 days", value: String(m.created_by_others_7d), target: "3 / week", kill: "< 3", red: m.created_by_others_7d < 3, note: "Product, or a service the founder performs." },
    { label: "Repeat hosts (not founder)", value: String(m.repeat_hosts), target: "5", kill: "< 3", red: m.repeat_hosts < 3, note: "The compounding asset." },
    { label: "Gender ratio of attendees (men)", value: menShare === null ? "—" : `${menShare}:${100 - menShare}`, target: "≤ 65:35", kill: "> 75:25", red: menShare === null ? null : menShare > 75, note: "Leading indicator of collapse." },
    { label: "Founder-hosted share, last 8 weeks", value: m.founder_share === null ? "—" : `${m.founder_share}%`, target: "< 50%", kill: "> 50%", red: m.founder_share === null ? null : m.founder_share > 50, note: "No organic supply." },
  ];
  const reds = rows.filter((r) => r.red === true).length;

  return (
    <main className="min-h-dvh bg-ink">
      <SiteHeader back="/admin" />
      <div className="mx-auto max-w-2xl px-5 pb-16 pt-4">
        <h1 className="font-display text-[30px] text-cream" style={{ fontWeight: 700 }}>Kill criteria</h1>
        <p className="mt-1 text-[13px] text-cream-2">
          Evaluate at week 8 of the pilot on ≥ 8 completed Popouts. <b className="text-cream">Any two red is a kill.</b> Not a pivot. Mock hosts and admins are excluded where it matters.
        </p>
        <p className={`glass mt-4 inline-block rounded-full px-3.5 py-1.5 text-[13px] font-semibold ${reds >= 2 ? "text-tix" : "text-pop"}`}>
          {reds} red right now{m.completed_8w < 8 ? " · not enough completed Popouts to judge yet" : ""}
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {rows.map((r) => (
            <li key={r.label} className={`glass rounded-[20px] p-4 ${r.red ? "border-tix/40" : ""}`}>
              <p className="text-[12px] text-cream-3">{r.label}</p>
              <p className={`font-display mt-1 text-[32px] leading-none ${r.red ? "text-tix" : "text-cream"}`} style={{ fontWeight: 700 }}>{r.value}</p>
              <p className="mt-2 text-[12px] text-cream-2">
                Target <b className="text-cream">{r.target}</b> · Kill <b className="text-cream">{r.kill}</b>
              </p>
              <p className="mt-1 text-[12px] text-cream-3">{r.note}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
