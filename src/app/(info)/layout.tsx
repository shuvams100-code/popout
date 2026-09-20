import SiteHeader from "@/components/site-header";

/** Plain reading layout for terms, privacy, guidelines, safety, about, contact. */
export default function InfoLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-ink">
      <SiteHeader />
      <article className="prose-popout mx-auto max-w-lg px-6 pb-20 pt-4">{children}</article>
    </main>
  );
}
