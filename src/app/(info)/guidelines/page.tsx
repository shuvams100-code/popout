import type { Metadata } from "next";
export const metadata: Metadata = { title: "Community guidelines" };

export default function Guidelines() {
  return (
    <>
      <h1>Community guidelines</h1>
      <p className="meta">The four rules everyone accepts on their first join, plus the fine print.</p>

      <h2>1. Public places only</h2>
      <p>Cafés, parks, venues, courts. Never someone&rsquo;s home, hotel room, or car. If a host suggests moving somewhere private, you can leave and report.</p>

      <h2>2. Show up, or say you can&rsquo;t</h2>
      <p>Three hours before a Popout you&rsquo;ll be asked &ldquo;still coming?&rdquo;. Answer honestly. Silent no-shows are the one thing that gets recorded and shown on your profile. Saying &ldquo;can&rsquo;t make it&rdquo; is always fine.</p>

      <h2>3. No pressure, ever</h2>
      <p>Nobody owes anyone a drink, a phone number, a photo, or a second meet. Anyone can leave a Popout or a conversation at any point without explaining. Persisting after a no is harassment.</p>

      <h2>4. See something off? Report it</h2>
      <p>One tap on any person, Popout, or message. Reports go to a human. Blocking hides you from each other everywhere. Hosts can remove anyone from their own Popout.</p>

      <h2>Things that get you removed</h2>
      <ul>
        <li>Harassment, unwanted sexual attention, hate, threats.</li>
        <li>Fake identity, fake age, multiple accounts.</li>
        <li>Using Popout to sell things, recruit, or promote.</li>
        <li>Hosting Popouts you don&rsquo;t intend to attend.</li>
        <li>Sharing someone&rsquo;s messages or details outside the group without consent.</li>
      </ul>

      <h2>What Popout is not</h2>
      <p>Not a dating app. Not a place to browse people. There are no profiles to swipe and no direct messages by design. The plan is the point; people are who you meet doing it.</p>
    </>
  );
}
