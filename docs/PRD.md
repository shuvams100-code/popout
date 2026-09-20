# Popout — Product Requirements (living doc)

**Find something to do. Find someone to do it with.**
Updated 2026-09-21 · supersedes `Popout-PRD.pdf` (2026-09-17) where they differ. The PDF holds the research and competitive analysis; this file holds the current product.

---

## Summary

Popout is a map-first mobile web app for Bangalore. Two kinds of pins: **Events** (things already happening at venues, seeded by us) and **Popouts** (small plans by ordinary people — "coffee at Third Wave, 8 PM, 2 of 4 joined"). A **Crew** is a Popout attached to an Event.

The bet is not discovery — three competitors already ship the map. The bet is **the plan actually happens**: a named host, a "still coming?" gate, and attendance as the only reputation.

| | |
|---|---|
| Positioning to test | *Small plans that actually happen.* |
| Primary object | The activity, not the person |
| Launch | One Bangalore cohort, ~300 reachable people |
| Status | **V1 built. Pre-pilot.** No real users yet. |
| Live | https://popout-alpha.vercel.app |

## Decisions taken since the PDF

| Question in PDF | Decision | Why |
|---|---|---|
| Minimum Popout size (2 vs 3) | **2**, as a constant (`MIN_PEOPLE`) | "A person can't hang out alone." Safety-floor concern noted; mitigated by public venues + verification badge. |
| Confirmation gate channel | **In-app card + Web Push.** No phone numbers, no SMS. | Push is free and works on Android + iPhone-on-Home-Screen. |
| Identity | **Selfie verification, admin-approved, private bucket.** No ID documents. | A face proves a human; storing Aadhaar/PAN photos is a liability under the Aadhaar Act / DPDP. DigiLocker via a provider is the phase-2 upgrade. |
| Verification gating | **Never gates use.** Badge + host opt-in "verified only". | Newcomers must get value in the first 24h before approval. |
| Native app | Still no. **PWA**: manifest, icons, Add-to-Home-Screen nudge on iPhone. | Unlocks push on iOS without an app store. |
| List view | Removed as a separate toggle. Search panel's "Happening soon" covers the location-denied case. | Simpler header on mobile. |
| Map at launch | Kept, with principle 5 enforced: nearest-pin fallback, never empty. | |
| Outside Bangalore | **Geofenced** (45 km): map still shows the place, then a "Not in X yet — want us there?" card. Every yes is logged by city. | Turns wrong-city traffic into an expansion signal instead of an empty map. |
| Consent | Explicit tick on `/welcome` before Google, versioned on the profile. | DPDP wants an affirmative act; "by continuing" isn't one. |

## Principles (unchanged)

1. Activity first, never person-to-person. No swiping, no browsing people, no DMs.
2. We don't own the friendship — WhatsApp does.
3. Small and soon: 2–6 people, next 24h.
4. A plan that doesn't happen is worse than no plan.
5. Never show an empty map.
6. Lightest identity: Google, name, age, avatar. Selfie is optional.
7. Every Popout is a public page; sign-in happens at join.
8. Nothing that needs a recommendation engine.

## What's built (V1)

### Core loop
- **Map** — MapLibre, dark, geolocated, mascot pins (green = Popout, amber = Event). Tap → leader line → glass card → Join. Location search + "happening soon" panel. Nearest-pin fallback when an area is empty.
- **Create** — six fields in one screen: what, where (venue search or use-my-location), when (day chips + time), max people, who can join (male / female / anyone, optional age range), description. Optional **verified-only**. Publishes in <60s, returns a share link. Crews prefilled from an event page.
- **Join / leave / +1** — atomic in Postgres (`join_popout`): open, not started, age/gender filter, verified-only, blocks, capacity under a row lock. **Join +1** takes two seats. Host can't leave.
- **Share** — native share sheet or WhatsApp deep link; per-Popout OG card (host avatar, title, when/where, seats). Members get **"Tell someone"** — a where-I'll-be message for a friend.

### Reliability (the wedge)
- **Gate** — 3h before start, members see *Still coming? → I'm in / Can't make it*, host sees confirmed vs waiting. Push nudge fires at the 3h mark.
- **Silence = drop** — 30 min before start, unanswered seats free up (pg_cron, every 5 min).
- **Attendance** — after start, host marks Came / No-show per person, then closes it. Popouts auto-close 6h after start.
- **Reputation** — "4 attended · 0 no-shows · 2 hosted" on profiles and host cards; **Reliable** badge at 3+ attended, 0 no-shows. No stars, no reviews.

### Safety floor
- Group chat per Popout, members only (RLS-enforced), realtime. No DMs.
- Report (Popout / person / message, with reasons), Block (hides both ways: map, pages, joins), host removal (kicked members can't rejoin).
- Public venues only (copy, not enforced).
- **Selfie verification** — in-browser resize → private bucket → `/admin` queue → ✓ badge everywhere.

### Women's safety
- **Women** toggle on the map: only women-only and women-hosted Popouts.
- **Who's going** before joining: "2 women · 1 man", on every card.
- **Host reliability** on cards before joining: "Hosted 12 · 0 no-shows" / "New host".
- Women-only Popouts, verified-only Popouts, +1 joins, "Tell someone".

### Geofence & expansion signal
- Service area = 45 km around Bangalore centre (`SERVICE_AREA` in `types.ts`).
- GPS or search outside it: map goes there, then a card — *Not in Mumbai yet. Popout is Bangalore-only right now.* → **Yes, launch here** (one tap signed in; email if not).
- Map search ranks like Google: exact state/city/town match first, India before abroad, then local venues. Venue search in the create form stays local.
- `launch_requests` table; **/admin/metrics → "Asked for elsewhere"** ranks cities by requests.

### Notifications
- **Web Push** (VAPID, no vendor): new message, someone joined your Popout, selfie approved, still-coming at 3h, all-good check-in at +30 min, cancellation, selfie-to-review (admins). Postgres triggers → `pg_net` → `/api/push`.
- Android Chrome: full. iPhone: after Add to Home Screen (nudge shown in Safari).
- **My Popouts** (☰): upcoming / happened, last message, unread badges; ☰ dot when anything's unread.

### Onboarding & legal
- **`/welcome`** in front of every sign-in: what Popout is, three honest bullets, a required tick ("18+, agree to Terms, Privacy, Guidelines"), then Google. Acceptance versioned on the profile so a terms change re-prompts.
- Pages in ☰: About · Safety (tappable helplines 112 / 1091 / 100 / 181 / 14416) · Community guidelines · Terms · Privacy (DPDP-shaped) · Contact (grievance officer block per IT Rules 2021). Placeholders for legal entity, address, officer name.

### Identity & profile
- Google sign-in only. Profile: name, age, gender, area, one-line bio. **Generated mascot avatar** per user (144 variants), no photos.
- Header avatar: green ✓ verified, amber "!" not yet, grey "!" pending review.

### Ops
- Supabase (Mumbai): Postgres + RLS, Auth, Realtime, Storage, pg_cron, pg_net. Vercel (Mumbai). Zero fixed cost.
- Admin: `admins` table by email; `/admin` (selfie queue), `/admin/events`, `/admin/metrics`. Admins: shuvams100@gmail.com, ideationpods@gmail.com.
- Mock data: 12 fake hosts (`@mock.popout.local`), ~130 pins across 16 neighbourhoods. One `delete` to clear.

## What's left

### Before the pilot (blocking)
- [ ] **Real-world test** with two accounts on two phones: create → share → join → chat → push → gate → attendance. Nothing has been through the whole loop by two humans yet.
- [ ] **Clear mock data** and seed ~20 real Bangalore events for launch week.
- [ ] **Pick the cohort** (co-living operator vs employer) — PDF says this can't slip past M3, and it has.
- [ ] **Seed 20 hosts at ~even gender split** before opening (PDF §13). This is a launch-sequencing decision, not code.
- [ ] Custom domain (optional, but `popout-alpha.vercel.app` in a WhatsApp share looks temporary).
- [ ] Fill legal placeholders (entity, address, grievance officer) and have a lawyer read Terms/Privacy once.

### Small product gaps — all closed 2026-09-20
- [x] Events admin at `/admin/events` (add / remove; venue search + time picker).
- [x] Host **Edit** (same six-field form) and **Cancel** (members get a push).
- [x] **Ground rules** sheet on a person's first-ever join (public places · show up or say so · no pressure · report anything). Stored once on the profile.
- [x] **Post-meet check-in** 30 min after start: push "All good?" → card with All good / Call 112 / Women's helpline 1091, and a pointer to report/block.
- [x] Selfie submitted → **push to admins** (instead of email; no third-party key needed).
- [x] **Kill criteria dashboard** at `/admin/metrics`: all seven PDF signals live, red/green against thresholds, founder and mock accounts excluded.

### Deliberately not building yet
DMs · ratings/reviews · ID documents · payments · organizer dashboard · ranking · multi-city · native app. See PDF §8 for the unlock conditions; none have been met.

## Metrics & kill criteria (unchanged from PDF)

North star: **completed Popouts per week** (3+ confirmed and attended). Evaluate at week 8 on ≥8 completed Popouts. Any two red = kill.

| Signal | Kill threshold |
|---|---|
| Attended after joining | < 60% |
| Second attendance within 30 days | < 30% |
| Popouts created by others | < 3 / week |
| Repeat hosts other than founder | < 3 |
| Gender ratio | worse than 75:25 and not improving |
| Founder-hosted share at week 8 | > 50% |

All of these are answerable from `popout_members.status`, `popouts.host_id`, and `profiles.gender` today.

## Repo map

```
src/app/            pages: / (map) · /welcome · /new · /p/[id] · /p/[id]/edit · /e/[id] · /mine · /profile · /admin · /admin/events · /admin/metrics
                    (info)/: about · safety · guidelines · terms · privacy · contact · api/push · launch (actions)
src/components/     explore (map shell) · map-canvas · pin-callout · search-panel · popout-social (going + chat + safety)
                    gate · thread · push-prompt · selfie-verify · join-buttons (rules) · popout-form · venue-field · when-field · select · brand
src/lib/            supabase clients (local JWT verify) · pins (feed) · geocode (Photon) · avatar · format
supabase/migrations 0001 init · 0002-3 removal/blocks · 0004 gate · 0005-6 verification · 0007 +1 · 0008 push · 0009 mine · 0010 cancel/rules/check-in/metrics · 0011 terms · 0012 launch requests
public/sw.js        service worker
```
