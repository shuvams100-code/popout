import SiteHeader from "@/components/site-header";

export default function NewPopout() {
  return (
    <main className="min-h-dvh bg-ink">
      <SiteHeader />
      <div className="mx-auto max-w-md px-5 pt-6">
        <h1 className="font-display text-[34px] text-cream" style={{ fontWeight: 700 }}>Start a Popout</h1>
        <p className="mt-2 text-[14px] text-cream-2">Six fields, under a minute. Lands in M3.</p>
      </div>
    </main>
  );
}
