import type { Metadata } from "next";
import { Mascot } from "@/components/brand";
export const metadata: Metadata = { title: "About" };

export default function About() {
  return (
    <>
      <Mascot size={72} live />
      <h1 className="!mt-4">About Popout</h1>
      <p>Moving to a new city is fine. The evenings are the problem.</p>
      <p>All the advice is the same: go out, join things, talk to people. It fails at the same step every time — you can&rsquo;t tell who wants company, and even if you ask, there&rsquo;s no shared reason to keep talking.</p>
      <p>Popout gives you that reason. Someone nearby posts a small plan — coffee, a walk, a show they don&rsquo;t want to go to alone — and says how many people they&rsquo;d like. You tap join. You show up. That&rsquo;s it.</p>
      <p>We&rsquo;re not trying to be where your friendships live; WhatsApp does that better. We&rsquo;re trying to be the thing that gets a stranger to a café table with you in the first place, reliably enough that you&rsquo;d do it again.</p>

      <h2>What we care about</h2>
      <ul>
        <li><b>The plan actually happens.</b> Named hosts, a &ldquo;still coming?&rdquo; check, attendance as the only reputation.</li>
        <li><b>Small and soon.</b> Two to six people, in the next day or so.</li>
        <li><b>Activity first.</b> No swiping, no browsing people, no DMs.</li>
      </ul>

      <h2>Where we are</h2>
      <p>Bangalore, one neighbourhood at a time. Built by a small team who moved here and know exactly what it&rsquo;s like.</p>
    </>
  );
}
