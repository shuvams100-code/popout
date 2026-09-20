import { Avatar } from "./brand";
import { confirmAttendance, finishPopout, leavePopout, markAttendance } from "@/app/p/[id]/actions";

type Member = { id: string; name: string; status: string };
type Props = { popoutId: string; startsAt: string; status: string; members: Member[]; hostId: string; me: string | null; isHost: boolean; now: number };

const GATE_MS = 3 * 3600000;

/**
 * The wedge. Three hours before: "still coming?" for members, a confirmed/pending roll for the host.
 * After start: host marks who showed up. Silence is auto-dropped 30 min before by gate_sweep().
 */
export default function Gate({ popoutId, startsAt, status, members, hostId, me, isHost, now }: Props) {
  const start = new Date(startsAt).getTime();
  const inWindow = now >= start - GATE_MS && now < start;
  const started = now >= start;
  const mine = members.find((m) => m.id === me);
  const others = members.filter((m) => m.id !== hostId);
  const confirmed = others.filter((m) => m.status === "confirmed" || m.status === "attended").length;
  const pending = others.filter((m) => m.status === "joined");
  const mins = Math.max(0, Math.round((start - now) / 60000));

  if (status === "done") {
    const showed = others.filter((m) => m.status === "attended").length;
    return (
      <div className="glass reveal mt-6 rounded-[20px] p-4 text-[14px] text-cream-2">
        <p className="font-display text-[18px] text-cream" style={{ fontWeight: 600 }}>
          This one happened.
        </p>
        <p className="mt-1">
          {showed + 1} showed up{others.length ? ` · ${others.length - showed} didn&apos;t` : ""}.
        </p>
      </div>
    );
  }

  // Member, in the window, not yet confirmed
  if (!isHost && mine && mine.status === "joined" && inWindow) {
    return (
      <div className="glass reveal mt-6 rounded-[20px] border-pop/40 p-4" style={{ animationDelay: "120ms" }}>
        <p className="font-display text-[20px] text-cream" style={{ fontWeight: 700 }}>
          Still coming?
        </p>
        <p className="mt-1 text-[13px] text-cream-2">
          Starts in {mins < 60 ? `${mins} min` : `${Math.round(mins / 60)}h`}. {confirmed + 1} confirmed so far. If you don&apos;t answer, your seat frees up 30 min before.
        </p>
        <div className="mt-3 flex gap-2">
          <form action={confirmAttendance.bind(null, popoutId)} className="flex-1">
            <button className="btn-pop h-11 w-full text-[15px]">I&apos;m in</button>
          </form>
          <form action={leavePopout.bind(null, popoutId)} className="flex-1">
            <button className="glass h-11 w-full rounded-full text-[14px] font-semibold text-cream">Can&apos;t make it</button>
          </form>
        </div>
      </div>
    );
  }

  if (!isHost && mine && mine.status === "confirmed" && !started) {
    return (
      <div className="glass reveal mt-6 flex items-center gap-3 rounded-[20px] p-4 text-[14px] text-cream" style={{ animationDelay: "120ms" }}>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-pop-soft text-pop">✓</span>
        You&apos;re confirmed. {confirmed + 1} people are on for this.
      </div>
    );
  }

  // Host, in the window: the roll
  if (isHost && inWindow) {
    return (
      <div className="glass reveal mt-6 rounded-[20px] p-4" style={{ animationDelay: "120ms" }}>
        <p className="font-display text-[18px] text-cream" style={{ fontWeight: 600 }}>
          {confirmed} confirmed{pending.length ? ` · ${pending.length} haven&apos;t answered` : ""}
        </p>
        <p className="mt-1 text-[13px] text-cream-2">You&apos;re the host — you go regardless. Unanswered seats free up 30 min before.</p>
        {pending.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {pending.map((m) => (
              <li key={m.id} className="flex items-center gap-2 rounded-full border border-dashed border-line py-1 pl-1 pr-3 text-[13px] text-cream-3">
                <Avatar seed={m.id} size={22} /> {m.name.split(" ")[0]} · waiting
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  // Host, after start: who showed up
  if (isHost && started) {
    return (
      <div className="glass reveal mt-6 rounded-[20px] p-4" style={{ animationDelay: "120ms" }}>
        <p className="font-display text-[18px] text-cream" style={{ fontWeight: 600 }}>
          Who showed up?
        </p>
        <p className="mt-1 text-[13px] text-cream-2">This is the only reputation on Popout. Be honest.</p>
        <ul className="mt-3 flex flex-col gap-2">
          {others.map((m) => (
            <li key={m.id} className="flex items-center gap-3">
              <Avatar seed={m.id} size={28} />
              <span className="flex-1 text-[14px] text-cream">{m.name.split(" ")[0]}</span>
              <form action={markAttendance.bind(null, popoutId, m.id, true)}>
                <button className={`h-9 rounded-full px-3.5 text-[13px] font-semibold ${m.status === "attended" ? "btn-pop" : "glass text-cream"}`}>Came</button>
              </form>
              <form action={markAttendance.bind(null, popoutId, m.id, false)}>
                <button className={`h-9 rounded-full px-3.5 text-[13px] font-semibold ${m.status === "no_show" ? "glass-on glass text-tix" : "glass text-cream-2"}`}>No-show</button>
              </form>
            </li>
          ))}
          {others.length === 0 && <li className="text-[13px] text-cream-3">Nobody else joined this one.</li>}
        </ul>
        <form action={finishPopout.bind(null, popoutId)} className="mt-4">
          <button className="glass h-11 w-full rounded-full text-[14px] font-semibold text-cream">Done · close this Popout</button>
        </form>
      </div>
    );
  }

  return null;
}
