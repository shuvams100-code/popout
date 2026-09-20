import type { Metadata } from "next";
export const metadata: Metadata = { title: "Safety" };

const LINES: [string, string, string][] = [
  ["112", "Emergency (police, ambulance, fire)", "tel:112"],
  ["1091", "Women's helpline", "tel:1091"],
  ["100", "Police", "tel:100"],
  ["181", "Women in distress (Karnataka)", "tel:181"],
  ["14416", "Tele-MANAS mental health support, 24×7", "tel:14416"],
];

export default function Safety() {
  return (
    <>
      <h1>Safety</h1>
      <p>Meeting strangers is the whole point of Popout, so here&rsquo;s how it&rsquo;s built and what to do if something goes wrong.</p>

      <h2>If you need help now</h2>
      <ul className="!list-none !pl-0">
        {LINES.map(([n, what, href]) => (
          <li key={n} className="!mt-2">
            <a href={href} className="glass flex items-center gap-3 rounded-[14px] px-4 py-3 !no-underline">
              <span className="font-display text-[20px] text-tix" style={{ fontWeight: 700 }}>
                {n}
              </span>
              <span className="text-[14px] text-cream">{what}</span>
            </a>
          </li>
        ))}
      </ul>

      <h2>Before you go</h2>
      <ul>
        <li>Look at the host: attendance record, verified badge, who else is going.</li>
        <li>Use <b>Tell someone</b> on the Popout page to send a friend where you&rsquo;ll be and with whom.</li>
        <li>Join with a friend using <b>+1</b> if you&rsquo;d rather not arrive alone.</li>
        <li>Prefer <b>women-only</b> or <b>verified-only</b> Popouts if that&rsquo;s more comfortable — the Women toggle on the map shows them.</li>
      </ul>

      <h2>While you&rsquo;re there</h2>
      <ul>
        <li>Stay in the public place that was posted. Moving somewhere private is a red flag.</li>
        <li>You can leave at any point. You don&rsquo;t need a reason.</li>
        <li>Thirty minutes in, we&rsquo;ll check in with an &ldquo;All good?&rdquo; nudge. Tap it if you want the helplines and report options in one place.</li>
      </ul>

      <h2>Afterwards</h2>
      <ul>
        <li>Report anyone who made you uncomfortable. It takes one tap and a human reads it.</li>
        <li>Block them; you&rsquo;ll never see each other on Popout again.</li>
        <li>If something serious happened, contact the police first, then us — we&rsquo;ll cooperate fully.</li>
      </ul>

      <h2>What we do on our side</h2>
      <ul>
        <li>No direct messages, only group chats tied to a plan.</li>
        <li>Public places rule, minimum group of two, named accountable host.</li>
        <li>Optional selfie verification checked by a person.</li>
        <li>Attendance history instead of ratings, so reputation can&rsquo;t be gamed with reviews.</li>
        <li>Every report is read and acted on within a day during the pilot.</li>
      </ul>
    </>
  );
}
