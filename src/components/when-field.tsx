"use client";

import { useMemo, useState } from "react";
import Select from "./select";

const TZ = "Asia/Kolkata";
const DAYS = 7;

const key = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const nowIST = () => {
  const s = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};
const fmtTime = (h: number, m: number) => {
  const ampm = h < 12 ? "AM" : "PM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")} ${ampm}`;
};

/** Day chips + time slots. Submits `when` as YYYY-MM-DDTHH:mm (IST) for the server action. */
export default function WhenField({ defaultValue, className }: { defaultValue: string; className: string }) {
  const [day, setDay] = useState(defaultValue.slice(0, 10));
  const [time, setTime] = useState(defaultValue.slice(11, 16));
  // Captured once on mount so render stays pure
  const [start] = useState(() => Date.now());

  const days = useMemo(() => {
    const out: { key: string; label: string; sub: string }[] = [];
    for (let i = 0; i < DAYS; i++) {
      const d = new Date(start + i * 86400000);
      out.push({
        key: key(d),
        label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : new Intl.DateTimeFormat("en-IN", { timeZone: TZ, weekday: "short" }).format(d),
        sub: new Intl.DateTimeFormat("en-IN", { timeZone: TZ, day: "numeric", month: "short" }).format(d),
      });
    }
    return out;
  }, [start]);

  const slots = useMemo(() => {
    const isToday = day === days[0]?.key;
    const min = isToday ? nowIST() + 15 : 0;
    const out: { value: string; label: string }[] = [];
    for (let t = 6 * 60; t < 24 * 60; t += 15) {
      if (t < min) continue;
      const h = Math.floor(t / 60), m = t % 60;
      out.push({ value: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`, label: fmtTime(h, m) });
    }
    return out;
  }, [day, days]);

  const timeValue = slots.some((s) => s.value === time) ? time : (slots[0]?.value ?? "");

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name="when" value={`${day}T${timeValue}`} />
      <div className="flex flex-wrap gap-1.5">
        {days.map((d) => (
          <button
            key={d.key}
            type="button"
            onClick={() => setDay(d.key)}
            className={`glass flex shrink-0 flex-col items-center rounded-[14px] px-3 py-1.5 leading-tight ${day === d.key ? "glass-on" : ""}`}
          >
            <span className={`text-[13px] font-semibold ${day === d.key ? "text-pop" : "text-cream"}`}>{d.label}</span>
            <span className="text-[11px] text-cream-3">{d.sub}</span>
          </button>
        ))}
      </div>
      <Select key={day} name="_time" options={slots} defaultValue={timeValue} onChange={setTime} className={className} placeholder="Pick a time" />
    </div>
  );
}
