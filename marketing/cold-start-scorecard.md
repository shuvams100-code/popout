# Popout — Cold Start Scorecard

**Framework:** Andrew Chen, *The Cold Start Problem* (via `skills/cold-start-problem`)
**Assessed:** 2026-09-19 · Pre-launch
**Score: 5 / 10**

> **5–6:** Network effects acknowledged, but the launch targets a broad market and both sides
> are treated equally.

Sitting at the top of that band. The instincts are right — one neighbourhood, no fake scarcity,
no premature monetisation, hosts named as the bottleneck. What's missing is that none of it has
been made concrete enough to execute or measure.

---

## Diagnostic

| # | Question | Verdict |
|---|---|---|
| 1 | Can you name your first atomic network (who, where, how many)? | ⚠️ Partial — still a market |
| 2 | Is the magic moment defined and instrumented? | ❌ No |
| 3 | Do you know who your hard side is and why they stay? | ⚠️ Identified, not mapped |
| 4 | Does the product deliver value to its very first user? | ❌ No |
| 5 | Is there a written playbook for tipping the next network? | ❌ No |
| 6 | Are you measuring liquidity (fill rate, time-to-match)? | ❌ No |
| 7 | Do you know which ceiling will hit first? | ❌ No |
| 8 | Is anything defending the hard side from rivals? | — N/A pre-launch |

---

## The four findings that matter

### 1. "A neighbourhood" is still a market, not an atomic network

Indiranagar has ~100,000 people. The framework's examples are *three people in one Slack team*,
*one Harvard campus*, *one eBay collectibles category*. The unit is the smallest group at which
the product works and keeps working on its own.

For Popout that is roughly **30–50 people within ~1km of a single anchor, active in the
6–10 PM window** — one cafe cluster, one apartment-complex cluster, one co-working floor, one
gym. Saturate that, then tip the next anchor. A neighbourhood is network #4, not network #1.

This also changes the arithmetic in the context doc for the better: 30–50 concentrated people
is a recruitable number. 1,500–3,000 across Indiranagar is a fundraising-sized problem.

**Correction:** stop planning a neighbourhood launch. Plan an *anchor* launch.

### 2. There is no magic moment, and nothing measures one

The framework is blunt: without an instrumented magic moment you cannot tell a live network
from a dead one.

Popout's magic moment is not signup, not join, not the group chat. It is:

> **A user joins or creates a Popout, and ≥2 people physically show up, within 24 hours of
> their first session.**

Right now the codebase cannot observe this at all. There is no "did this happen?" event — so
the single number that decides whether Popout works is currently unmeasurable. That is a higher
priority than any feature on the roadmap.

**Minimum build:** a post-Popout "did it happen?" prompt to every participant, plus a
`happened` state on the Popout record. One afternoon of work. Nothing else is knowable without it.

### 3. Zero single-player value — the hardest failure on the list

*"Does the product deliver value to its very first user?"* — No. Open Popout alone on an empty
map and it does nothing. Pure chicken-and-egg with no wedge.

The framework's prescription is *come for the tool, stay for the network*. Popout has two
candidate tools, and neither is currently treated as the wedge:

**Tool A — the events layer.** A genuinely good, honestly curated "what's on near me tonight"
map has full value with zero other users on the platform. Scraped and hand-curated listings for
one anchor area is a week of work and is useful on day one. This reframes events from *seeding
material* to **the actual product wedge**. The social layer sits on top of it.

**Tool B — plan-making for people you already know.** Create a plan, share the link to your
existing WhatsApp group, everyone RSVPs. Useful with zero strangers involved, and it produces
hosts without anyone exposing that they have nobody to go with.

Recommended: ship both, with B defaulting **private** and a one-tap "open the empty spots to
people nearby." The network layer becomes opt-in on top of something already useful.

*Risk, stated plainly:* Tool B drifts toward Partiful. The defence is the time horizon and
the one-tap opening — if it becomes a scheduling tool for next Saturday, the wedge is lost.

### 4. The hard side is mis-specified

Hosts are correctly named, but their motivation is unmapped. The framework says money, status,
or utility.

- **Money** — not applicable.
- **Status** — *negative* here. Hosting on Popout signals "I have no one to go with." This is
  the inverse of YouTube or Instagram, where creating raises status. Do not build status
  mechanics; they will backfire.
- **Utility** — the only working lever.

Which produces the sharpest correction in this document:

> **Your first hard side is not lonely individuals. It is existing small groups with a missing
> person.**

Badminton pairs needing a fourth. Football 5-a-sides short two. Board game groups, run clubs,
trek groups, jam sessions. They already have the plan, the venue, the time, and a recurring
hole to fill. Their motivation is pure utility, there is no status cost, and they are
findable *today* in WhatsApp and Telegram groups without building anything.

They also generate recurring supply — a weekly badminton group is a Popout every week, forever,
which is worth more to map density than fifty one-off coffees.

**Action:** find 10 such groups around one anchor. That is the launch.

---

## Anti-patterns currently present

| Pattern | Where it shows up |
|---|---|
| **Launching to a market, not a network** | "One Bangalore neighbourhood" is still 100k people |
| **Counting signups instead of density** | No liquidity metric exists yet |
| **Big-bang instinct** | The Instagram voting campaign spreads awareness across 4 neighbourhoods, then disappoints 3 of them. It also outsources the most important strategic decision to people who mostly don't live there. Use it as an acquisition asset for the *already-chosen* anchor, not as the decision mechanism. |
| **Treating both sides equally** | Product is built for joiners; nothing is built for hosts |

**Correctly avoided:** faking scarcity or activity. Explicitly ruled out, and it is the
anti-pattern that kills trust permanently. Hold that line.

---

## What 10/10 requires

1. **Name the anchor.** One specific 1km radius with a named centre, chosen on density of
   existing activity — not by public vote. Written down.
2. **Define and instrument the magic moment.** Ship the `happened` state and the post-event
   prompt before anything else.
3. **Build for the hard side.** Recruit 10 existing groups-with-a-gap around the anchor.
   Recurring-plan support, one-tap repeat, "need 2 more" as a first-class object.
4. **Add single-player value.** Curated real listings for the anchor area, live on day one.
5. **Instrument liquidity, per network:** live Popouts at 7 PM · fill rate (% reaching
   `MIN_PEOPLE`) · time-to-fill · **happen rate** · host rate.
6. **Set the expansion gate.** A written bar — e.g. *8 weeks of ≥3 Popouts happening per
   week with ≥50% happen rate* — before anchor #2 opens. No exceptions.
7. **Write the tipping playbook** after anchor #1 works, not before.
8. **Model the ceiling.** Likely first: new-arrival churn (12–18 month user lifetime), then
   trust/quality decay.

Items 1–5 are pre-launch. Items 6–8 can wait, but 6 must be written *before* launch, because
nobody sets an expansion gate honestly once the growth pressure is on.

---

## The one-line version

Popout's plan is directionally right and an order of magnitude too big. Shrink the first
network from a neighbourhood to a single anchor, make the events layer the single-player
wedge, recruit existing groups that are short a player rather than individuals who are short
a friend, and ship the ability to know whether a Popout actually happened — because right now
that number, the only one that matters, cannot be observed.
