import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacy policy" };

export default function Privacy() {
  return (
    <>
      <h1>Privacy policy</h1>
      <p className="meta">Version 2026-09-20 · written to the Digital Personal Data Protection Act, 2023</p>
      <div className="callout">Draft for the pilot. Have a lawyer review before public launch, and fill in the entity name, address and grievance officer.</div>

      <h2>What we collect, and why</h2>
      <ul>
        <li><b>Google account: name and email.</b> To sign you in and to show your first name to people in your Popouts.</li>
        <li><b>Age, gender, area, one-line bio.</b> Age and gender are used only to apply the filters a host sets (for example women-only). Shown on your profile.</li>
        <li><b>Location.</b> Your device&rsquo;s location is used in your browser to centre the map and sort by distance. We do not store it. The place you choose for a Popout you host is public.</li>
        <li><b>Popouts, joins, attendance, messages.</b> To run the service. Attendance (came / no-show) is visible on your profile as counts. Messages are visible only to members of that Popout.</li>
        <li><b>Optional selfie.</b> Stored in a private bucket, seen only by our verification team, never shown to other users. Deleted when you ask, or if rejected.</li>
        <li><b>Reports and blocks.</b> To keep people safe. Reports are seen by our team only.</li>
        <li><b>Push notification subscription.</b> If you turn notifications on, a device token so we can send them. Turn them off in your browser at any time.</li>
      </ul>

      <h2>What we don&rsquo;t do</h2>
      <p>No advertising, no selling or sharing your data with anyone for their own purposes, no tracking across other sites, no photos of you unless you choose to verify. We do not collect government IDs.</p>

      <h2>Who processes it</h2>
      <p>Supabase (database, storage, sign-in) in Mumbai, India. Vercel (hosting) in Mumbai. Google (sign-in). OpenFreeMap and Photon/komoot (map tiles and place search — your search text and approximate location are sent to them). Each acts on our instructions under their own privacy terms.</p>

      <h2>How long</h2>
      <p>For as long as you have an account. Chat messages and Popout history stay while the account exists. When you delete your account, everything is deleted within 30 days except what we must keep by law.</p>

      <h2>Your rights</h2>
      <p>You can see and correct your profile in the app. You can withdraw consent, ask what we hold about you, ask for correction or deletion, or nominate someone to act for you — email us (see <a href="/contact">Contact</a>). We respond within 30 days. If you are not satisfied you can complain to the Data Protection Board of India.</p>

      <h2>Children</h2>
      <p>Popout is for adults. We do not knowingly collect data from anyone under 18. If you think we have, tell us and we will delete it.</p>

      <h2>Cookies</h2>
      <p>Only the ones that keep you signed in. No analytics or advertising cookies.</p>

      <h2>Changes</h2>
      <p>If this policy changes materially we will ask you to accept the new version on your next sign-in.</p>

      <p className="meta">Data fiduciary: Popout · [Legal entity name] · [Address] · Grievance officer: see <a href="/contact">Contact</a></p>
    </>
  );
}
