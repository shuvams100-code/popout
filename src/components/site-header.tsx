import Link from "next/link";
import { Wordmark } from "./brand";

export default function SiteHeader({ back = "/" }: { back?: string }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-ink/80 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md">
      <Link href={back} aria-label="Back" className="text-[14px] font-semibold text-cream-2 hover:text-cream">
        ← Map
      </Link>
      <Link href="/" className="wiggle">
        <Wordmark size={22} />
      </Link>
      <span className="w-12" />
    </header>
  );
}
