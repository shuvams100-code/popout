import Link from "next/link";
import { redirect } from "next/navigation";
import { Mascot, Wordmark } from "@/components/brand";
import { getViewer } from "@/lib/supabase/server";
import { startSignIn } from "./actions";

/** Every sign-in passes through here: what this is, the rules of the road, one affirmative tick, then Google. */
export default async function Welcome({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next = "/", error } = await searchParams;
  if (await getViewer()) redirect(next.startsWith("/") ? next : "/");

  return (
    <main className="flex min-h-dvh flex-col bg-ink">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
        <Link href="/" className="reveal self-start">
          <Wordmark size={26} />
        </Link>

        <div className="reveal mt-10 flex flex-col items-center text-center" style={{ animationDelay: "60ms" }}>
          <Mascot size={120} live />
          <h1 className="font-display mt-6 text-[34px] leading-[1.05] text-cream" style={{ fontWeight: 700 }}>
            Find something to do.
            <br />
            <span className="text-grad">Find someone to do it with.</span>
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-cream-2">
            Small plans near you — coffee, a walk, a show — posted by real people who&apos;ll actually be there. Join one, or start your own.
          </p>
        </div>

        <ul className="reveal mt-8 flex flex-col gap-2.5 text-[13px] text-cream-2" style={{ animationDelay: "120ms" }}>
          {[
            "Google sign-in only. No phone number, no password.",
            "Your name, age and a generated avatar — no photos of you unless you choose to verify.",
            "Public places, small groups, no DMs. Report anything with one tap.",
          ].map((t) => (
            <li key={t} className="flex gap-2.5">
              <span className="mt-0.5 grid h-4.5 w-4.5 shrink-0 place-items-center rounded-full bg-pop-soft text-[10px] font-bold text-pop">✓</span>
              {t}
            </li>
          ))}
        </ul>

        <form action={startSignIn} className="reveal mt-auto pt-8" style={{ animationDelay: "180ms" }}>
          <input type="hidden" name="next" value={next} />
          <label className="glass flex cursor-pointer items-start gap-3 rounded-[16px] px-4 py-3.5">
            <input type="checkbox" name="agree" required className="mt-0.5 h-4 w-4 shrink-0 accent-[#5cff7a]" />
            <span className="text-[13px] leading-snug text-cream-2">
              I&apos;m 18 or older and I agree to the{" "}
              <Link href="/terms" className="text-cream underline decoration-white/30 underline-offset-4">Terms</Link>,{" "}
              <Link href="/privacy" className="text-cream underline decoration-white/30 underline-offset-4">Privacy Policy</Link> and{" "}
              <Link href="/guidelines" className="text-cream underline decoration-white/30 underline-offset-4">Community Guidelines</Link>.
            </span>
          </label>
          {error && <p className="mt-2 text-[12px] text-tix">{error === "agree" ? "Tick the box to continue." : "Sign-in didn't go through. Try again."}</p>}
          <button className="btn-pop mt-3 flex h-13 w-full items-center justify-center gap-2.5 text-[16px]">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.8-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.7z" />
              <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1C3.3 21.3 7.3 24 12 24z" />
              <path fill="#FBBC05" d="M5.3 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.6H1.3C.5 8.2 0 10 0 12s.5 3.8 1.3 5.4l4-3.1z" />
              <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C18 1.2 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
            </svg>
            Continue with Google
          </button>
          <p className="mt-3 text-center text-[11px] text-cream-3">
            <Link href="/about" className="underline underline-offset-4">About</Link> · <Link href="/safety" className="underline underline-offset-4">Safety</Link> · <Link href="/contact" className="underline underline-offset-4">Contact</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
