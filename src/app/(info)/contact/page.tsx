import type { Metadata } from "next";
export const metadata: Metadata = { title: "Contact" };

export default function Contact() {
  return (
    <>
      <h1>Contact</h1>
      <p>Fastest is email. During the pilot a human reads everything within a day.</p>

      <h2>General &amp; support</h2>
      <p>
        <a href="mailto:hello@popout.in">hello@popout.in</a>
      </p>

      <h2>Safety reports</h2>
      <p>Use the report button in the app — it reaches us with the right context. For anything urgent that already happened, contact the police first (112), then email <a href="mailto:safety@popout.in">safety@popout.in</a>.</p>

      <h2>Privacy requests</h2>
      <p>Access, correction, deletion, or withdrawing consent: <a href="mailto:privacy@popout.in">privacy@popout.in</a>. We respond within 30 days.</p>

      <h2>Grievance officer</h2>
      <p>As required under the Information Technology (Intermediary Guidelines) Rules, 2021 and the DPDP Act, 2023:</p>
      <p>
        [Name]
        <br />
        Grievance Officer, Popout
        <br />
        [Registered address, Bengaluru, Karnataka]
        <br />
        <a href="mailto:grievance@popout.in">grievance@popout.in</a>
      </p>
      <div className="callout">Fill in the name and address before launch. These addresses assume you own popout.in — swap for whatever domain you register.</div>
    </>
  );
}
