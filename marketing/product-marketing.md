# Product Marketing Context — Popout

**Document version:** v1
**Last updated:** 2026-09-19
**Status:** Pre-launch. No users, no revenue, no validated behaviour.

> **How to read this file.** Every marketing skill reads this before doing anything, so
> accuracy matters more than optimism. Lines marked **[ASSUMPTION]** are untested beliefs,
> not facts. Do not write copy that treats an assumption as proven. When a skill needs
> evidence and finds only an assumption here, it should say so rather than invent proof.

---

## Product Overview

**One-liner:**
Popout is a live local map of things to do and small spontaneous plans happening nearby in
the next few hours — so you can find something to do, and someone to do it with.

**What it does:**
Opens straight to a map of your neighbourhood showing two layers: real things happening
nearby (comedy, live music, badminton, workshops, cafe offers) and user-created "Popouts" —
tiny casual plans, usually 2–6 people, usually within the next few hours. You tap one, join,
land in a small group chat, and go meet them. The product's job ends when you leave the house.

**Product category:**
Local spontaneity / real-world social discovery. Nearest mental shelf customers search from:
"things to do near me tonight" and "how to meet people in Bangalore."

**Product type:**
Consumer marketplace with network effects. Two-sided: activity supply (venues, organisers,
and hosts) and demand (people who want to go out). Web app (Next.js 16 + Supabase + MapLibre).

**Business model:**
None yet, deliberately. Free for users, free listings for businesses ("we list your event and
send you customers, no commission"). Possible later: promoted placement, offers, analytics.
Monetisation is explicitly not a near-term priority — density is.

---

## Target Audience

**Target customers (demand side):**
Primary ICP — **people who recently moved to Bangalore**, roughly 22–32, working, living
within ~2km of the launch neighbourhood, with disposable income and empty evenings.
Secondary — people who already have friends but chronically don't know what to do.

**Target customers (supply side):**
Cafes, activity venues, comedy and live-music organisers, sports and run groups, workshop
hosts inside the single launch neighbourhood.

**Decision-makers:** None. Consumer product, zero-friction individual decision.

**Primary use case:**
It's 7:13 PM on a weekday, you don't want to sit at home, and you have neither a plan nor
anyone to execute one with.

**Jobs to be done:**
- "Help me not spend another evening alone in my flat."
- "Give me something to do in the next two hours without a group chat negotiation."
- "Let me meet people without it being weird, a dating app, or a commitment."

**Use cases:**
- Just moved to the city, no local network, weeknight evenings are dead
- Free tonight, wants company for a specific thing (badminton needs a fourth)
- Wants to attend an event but not alone
- Group of friends who want to go out but can't decide where

---

## Personas

| Persona | Cares about | Challenge | Value we promise |
|---|---|---|---|
| **New arrival** (core) | Not being lonely; low-stakes ways to meet people | Knows nobody within 10km; making friends as an adult is slow | Something to do tonight, with people, within walking distance |
| **The joiner** (majority) | Low effort, low risk, no exposure | Will happily join but will never post a plan | One tap to join something already happening |
| **The host** (hard side) | Filling their plan; not looking desperate | Creating a Popout implicitly says "I have no one to go with" | A reason to post that reads as enthusiasm, not loneliness |
| **Venue / organiser** (supply) | Footfall, no commission, no new software | Discovery is stuck on Instagram; poor weeknight turnout | Free listing, direct customers, zero integration work |

**The hard side is hosts.** Without hosts the map is empty and joiners churn in one session.
Every piece of marketing must be evaluated on whether it produces hosts, not signups.

---

## Problems & Pain Points

**Core problem:**
Two problems that look like one. (1) "I want to go out but don't know what to do." (2) "I know
what I want to do but have nobody to do it with." Both end the same way: you stay home.

**Why alternatives fall short:**
- **Instagram / WhatsApp groups** — discovery is a scroll, not a map; nothing is filtered to
  *near me, soon*, and asking "anyone free tonight?" in a group has a social cost
- **BookMyShow / District / Insider** — ticketing for things you plan days ahead; assumes you
  already have someone to go with
- **Meetup / communities** — scheduled weeks out, large groups, joining-a-community framing
- **Dating apps** — wrong intent, profile-first, and the activity is an afterthought
- **Just asking friends** — the group chat takes 40 minutes and usually ends in nothing

**What it costs them:**
Evenings. Weeks of them. For a new arrival, a slow slide into "I don't really know anyone here"
that compounds over months and is a genuine driver of people leaving cities.

**Emotional tension:**
Boredom is the surface emotion. Underneath it is loneliness the user will not name, plus the
specific fear of looking like the person who has nobody to hang out with. Marketing should
speak to the boredom and never to the loneliness.

---

## Competitive Landscape

**Direct:** SceneHai, Huddl, Crewda, BeThere, Nearlly, Somo Club, Spur Space, PlsTouchGrass,
Orchy, Offline by Happy Hour, WorldFlows, Mint — small casual group hangouts with strangers.
Most fall short not on product but on **density**: their maps are empty outside one small
pocket, so the first session is the last session.
**[ACTION] Run postmortems on 3 of these before writing any launch copy.**

**Secondary:** Partiful (planning with people you already know), Meetup (scheduled communities),
District / BookMyShow / Insider (event discovery, no social layer).

**Indirect:** Doing nothing. The real competitor is the sofa, and it is undefeated. Also
WhatsApp — where every plan that *does* happen currently gets made.

**How they fall short for our user:** all of them answer "what's on this month," none answer
"what can I do in the next two hours, within a kilometre, with someone."

---

## Differentiation

**Key differentiators:**
- **Time horizon: hours, not weeks.** Popouts expire. Nothing on the map is for "sometime."
- **Proximity-first.** Distance and start time outrank profiles, followers and ratings.
- **Activity-first, not profile-first.** You join a thing, not a person. The activity removes
  the awkwardness because everyone already has a reason to be there.
- **Map as the interface.** You *see* your neighbourhood is alive rather than scrolling to find out.
- **Optimises for leaving the app.** Success is a 45-second session that ends with the user
  putting on shoes.

**Why that's better:**
Spontaneity is the only thing here nobody else owns. Everyone else is a calendar.

**Honest caveat — [ASSUMPTION]:**
"Map + activities + strangers + chat" is not enough differentiation on its own and the
positioning is copyable in a weekend. The only durable moat is local density. Marketing's job
is to create density in one place fast, not to win an argument about features.

---

## Objections

| Objection | Response |
|---|---|
| "Is it safe to meet strangers?" | Public venues, visible participants, Google-authenticated profiles, report and block, small groups. Never over-claim safety — do not promise verification that doesn't exist. |
| "There's nothing happening near me." | Real risk, not a messaging problem. Only launch a neighbourhood once the map is genuinely full. Never fake listings or counts. |
| "Isn't this a dating app?" | No. Activity-first, group-based, no swiping, no matching. Say this early and plainly — it is the most common misread. |
| "I'd join but I'd never post one." | Expected and correct. Give them event-attached joining and raised-hand demand signals so they never have to host. |
| "Won't people just not show up?" | Honest answer: some won't. Confirm window before start, auto-cancel below minimum, host reputation later. |

**Anti-persona:**
People looking to date. People who want an online community to scroll. Anyone wanting to plan
next month. Users outside the launch neighbourhood — acquiring them actively *hurts* the
product by diluting density. Do not run untargeted city-wide or national campaigns.

---

## Switching Dynamics

**Push:** Another dead evening. The group chat where nobody decided anything. Being new in a
city and realising three months have passed.
**Pull:** Seeing, on a map, that four things are happening within a kilometre in the next two hours.
**Habit:** Defaulting to Instagram, YouTube and the sofa. Asking the same three friends.
**Anxiety:** "Will anyone actually show up?" "Will it be awkward?" "Am I the loser who posted this?"

Anxiety is the binding constraint, and the third one is the strongest. Reduce it with social
proof (who else is going), small group sizes, public venues, and framings that make hosting
read as enthusiasm rather than need.

---

## Customer Language

**How they describe the problem (to be replaced with verbatim quotes after customer interviews — these are [ASSUMPTION] placeholders):**
- "I moved here six months ago and I still don't really know anyone."
- "I'm free but I don't know what to do."
- "Everyone I know is busy / lives 14km away."
- "I'll just stay in."

**Words to use:**
tonight · right now · nearby · in the next hour · free tonight · pop out · join · start one ·
2 spots left · 600m away · plans · something to do

**Words to avoid:**
network · community · members · connect · meaningful connections · curated experiences ·
like-minded individuals · events near you · discover · platform · onboarding · lonely ·
making friends (as a headline promise — it names the thing users won't admit to)

**Glossary:**
- **Popout** — a user-created spontaneous plan, small and expiring. Always capitalised as a noun.
- **Pop out** (verb) — to actually go out. The brand pun; use it, don't overuse it.
- **Pin** — anything on the map. Mascot pins = Popouts, hollow white pins = venue events.
- **Neighbourhood** — the unit of launch. Never "city."
- **Atomic network** — the smallest set of people in one neighbourhood at which the map feels alive.

---

## Brand Voice

**Tone:** Casual, direct, a little cheeky. Talks like a friend texting you at 7pm, not like a brand.
**Style:** Short sentences. Second person. Present tense. Specific numbers over adjectives
("600m away, 8 PM, 2 spots left" beats "exciting local experiences").
**Personality:** Spontaneous · friendly · a bit playful · unpretentious · modern. Not childish,
not corporate, not wellness-y.

**Visual identity:** Dark/near-black backgrounds, off-white type, neon lime-green accent.
Wordmark is "pop" + mascot as the "o" + "ut". Mascot is a small glossy neon lime-green
character — round, two dark oval eyes, three small celebratory rays above. Map is dark with
neon green highlights; dark bottom sheets; green gradient CTA.
**Primary CTA:** "Start one." Secondary: "Join."

**Headline that works:** "Free tonight? Pop out."
**Headline that fails:** "Discover events and meet people nearby." If a line could be pasted
onto any of the twelve competitors above, it is wrong.

---

## Proof Points

**None yet. Do not invent any.**

No users, no testimonials, no attendance numbers, no waitlist counts. Until real numbers exist,
marketing runs on the honest pre-launch angle ("we're launching neighbourhood by neighbourhood —
vote for yours") rather than fabricated traction. Fake vote counts, fake scarcity, fake
"1,200 people in your area" are explicitly off-limits and would destroy the trust this product
depends on more than most.

**First proof points to earn, in order:**
1. % of Popouts that actually happened (the only metric that matters)
2. Live Popouts visible at 7 PM inside the launch radius
3. Repeat evenings per active user per month
4. Host rate — % of users who ever create

---

## Goals

**Primary business goal:**
Reach one dense, self-sustaining atomic network in a single Bangalore neighbourhood.
Everything else is premature.

**Target for launch readiness [ASSUMPTION — arithmetic, not observed]:**
~4 live Popouts visible at 7 PM inside a 2km radius requires roughly 150 actively *creating*
users, which at a 5–10% host rate implies **1,500–3,000 registered users inside that radius**
(~2–3% penetration of an Indiranagar-sized neighbourhood). Validate the host rate early —
it moves this number by 10x in either direction.

**Key conversion action:**
Not signup. **A Popout that actually happens.** Second: a Popout created. Signups are a vanity
metric here and should not be a campaign goal.

**North-star metric (candidate):**
Real-world meetups completed per week per neighbourhood.

**Anti-goals:** time in app, feed engagement, follower counts, total registered users across
Bangalore, DAU as a headline number.

---

## The Product Test

Before recommending any feature, campaign or asset, ask:

> Does this make it easier for someone to go from sitting at home → doing something in the
> real world within the next few hours?

If no, question whether Popout needs it. Also check: does it make hosting easier or safer to
do? Does it concentrate users in one neighbourhood or scatter them? If it scatters them,
it is negative value regardless of how many signups it produces.
