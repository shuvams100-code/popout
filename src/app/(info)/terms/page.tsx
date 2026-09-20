import type { Metadata } from "next";
export const metadata: Metadata = { title: "Terms of use" };

export default function Terms() {
  return (
    <>
      <h1>Terms of use</h1>
      <p className="meta">Version 2026-09-20 · Popout, Bangalore, India</p>
      <div className="callout">Draft for the pilot. Have a lawyer review before public launch, and fill in the legal entity name and registered address at the bottom.</div>

      <h2>1. What Popout is</h2>
      <p>Popout is a website that shows small, short-notice plans (&ldquo;Popouts&rdquo;) and events near you, and lets you join or host them. Popout is a noticeboard and a group chat. We are not a party to any meeting, we do not run the events, and we do not vet venues.</p>

      <h2>2. Who can use it</h2>
      <p>You must be 18 or older, sign in with your own Google account, and give a real first name and age. One person, one account. We may remove accounts that break these terms without notice.</p>

      <h2>3. Meeting people</h2>
      <p>You meet other users at your own risk. Popout does not run background checks. The &ldquo;face verified&rdquo; badge means a member of our team looked at one selfie and believed it showed a real person; it is not an identity check and not a safety guarantee. Follow the <a href="/guidelines">Community Guidelines</a>: public places, no pressure, report anything that feels wrong.</p>

      <h2>4. Hosting</h2>
      <p>If you host a Popout you are saying you will be at the place and time you posted. Cancel in the app if you can&rsquo;t. No-shows are recorded on your profile as attendance history. You can remove anyone from your Popout without explanation.</p>

      <h2>5. Your content</h2>
      <p>You own what you post. You give Popout a licence to display it inside the service and in link previews. Don&rsquo;t post anything illegal, harassing, sexual, hateful, or that belongs to someone else. We may remove content and accounts that break this.</p>

      <h2>6. Events and third parties</h2>
      <p>Event listings link to organisers&rsquo; own booking pages. Tickets, refunds and what happens at the venue are between you and the organiser. Map data is from OpenStreetMap contributors via OpenFreeMap.</p>

      <h2>7. No fees</h2>
      <p>Popout is free during the pilot. If that changes we will tell you in advance, and safety features (reporting, blocking, verification) will stay free.</p>

      <h2>8. Ending your account</h2>
      <p>You can stop using Popout at any time. To delete your account and data, email us (see <a href="/contact">Contact</a>); we delete within 30 days. We may suspend or delete accounts for breaking these terms.</p>

      <h2>9. Liability</h2>
      <p>Popout is provided &ldquo;as is&rdquo;. To the extent Indian law allows, we are not liable for anything that happens at or around a meeting arranged through Popout, for content posted by users, or for the service being unavailable. Nothing here limits liability that cannot be limited by law.</p>

      <h2>10. Changes</h2>
      <p>If we change these terms materially we will ask you to accept the new version on your next sign-in.</p>

      <h2>11. Law and disputes</h2>
      <p>These terms are governed by the laws of India. Courts in Bengaluru, Karnataka have jurisdiction. Our grievance officer under the IT Rules 2021 is listed on the <a href="/contact">Contact</a> page.</p>

      <p className="meta">Popout · [Legal entity name] · [Registered address, Bengaluru]</p>
    </>
  );
}
