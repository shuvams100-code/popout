import Link from "next/link";
import { Wordmark } from "./brand";

export default function SiteHeader({ back = "/" }: { back?: string }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-gradient-to-b from-ink via-ink/85 to-ink/0 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <Link href={back} aria-label="Back" className="glass flex h-9 items-center rounded-full px-3.5 text-[13px] font-semibold text-cream">
        ← Map
      </Link>
      <Link href="/" className="wiggle flex items-center">
        <Wordmark size={19} />
      </Link>
      <span className="w-12" />
    </header>
  );
}
