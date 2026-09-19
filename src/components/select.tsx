"use client";

import { useEffect, useRef, useState } from "react";

type Opt = { value: string; label: string };
type Props = { name: string; options: Opt[]; defaultValue?: string; placeholder?: string; className: string; required?: boolean; onChange?: (v: string) => void };

/** Custom dropdown that matches the glass design; submits via a hidden input like a native select. */
export default function Select({ name, options, defaultValue = "", placeholder = "Select", className, required, onChange }: Props) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={box} className="relative">
      <input type="hidden" name={name} value={value} required={required} />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`${className} flex items-center justify-between gap-2 text-left ${current ? "" : "text-cream-3"}`}
      >
        <span className="truncate">{current?.label ?? placeholder}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-cream-3 transition ${open ? "rotate-180" : ""}`} aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <ul role="listbox" className="callout-fast absolute inset-x-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-[16px] border border-white/15 bg-ink-2 p-1 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]">
          {options.map((o) => (
            <li key={o.value} role="option" aria-selected={o.value === value}>
              <button
                type="button"
                onClick={() => {
                  setValue(o.value);
                  setOpen(false);
                  onChange?.(o.value);
                }}
                className={`flex w-full items-center justify-between rounded-[12px] px-3 py-2.5 text-left text-[14px] transition hover:bg-white/10 ${o.value === value ? "text-pop" : "text-cream"}`}
              >
                {o.label}
                {o.value === value && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m5 12 5 5L20 7" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
