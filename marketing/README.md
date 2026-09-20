# Popout — Marketing

Curated AI skill library + the product marketing context every skill reads first.

## Files

| Path | What it is |
|---|---|
| `product-marketing.md` | **The keystone.** Popout's positioning, ICP, competitors, voice, anti-goals. Every skill below reads this before producing anything. Keep it current — stale context produces generic output. |
| `skills/` | 22 curated skills pulled from three open-source repos (MIT). |

`/.agents/product-marketing.md` at the repo root is a pointer to this file, because that's the
canonical path the marketing skills look for.

## The skills

**Cold start & strategy** — from [wondelai/skills](https://github.com/wondelai/skills)

| Skill | Use it for |
|---|---|
| `cold-start-problem` | **Start here.** Andrew Chen's framework. Atomic networks, solving the hard side, density over totals. Popout's exact problem. Scores your launch plan 0–10. |
| `mom-test` | Customer interviews that don't produce false positives. Use before believing anyone who says "I'd totally use this." |
| `lean-analytics` | Picking the one metric that matters per stage. |
| `obviously-awesome` | Positioning — the market you choose to compete in. |
| `hooked-ux` | Habit loops. Use carefully — Popout wants real-world habit, not app habit. |
| `improve-retention` | Retention diagnosis. Popout's weakest dimension by design. |
| `contagious` | Word of mouth / why things spread. |

**Marketing** — from [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills)

| Skill | Use it for |
|---|---|
| `product-marketing` | Creates/updates `product-marketing.md`. Re-run when positioning changes. |
| `launch` | Launch planning and sequencing. |
| `community-marketing` | The closest fit to Popout's actual channel: neighbourhood-level, offline-adjacent. |
| `marketing-psychology` | Persuasion principles. Relevant to the hosting-reluctance problem. |
| `copywriting` | Reels scripts, landing page, in-app copy. |
| `social` | Instagram/organic social strategy. Popout's primary channel. |
| `video` | Reels and short-form. |
| `referrals` | Share loops. Popout's built-in loop is the shareable Popout link. |
| `marketing-loops` | Recurring automated marketing workflows. |
| `marketing-ideas` | Idea generation when stuck. |

**Positioning & GTM** — from [phuryn/pm-skills](https://github.com/phuryn/pm-skills)

| Skill | Use it for |
|---|---|
| `beachhead-segment` | Choosing the first neighbourhood and the first user type. |
| `ideal-customer-profile` | Sharpening the ICP beyond "new to Bangalore." |
| `north-star-metric` | Defining the one number. Candidate: meetups completed per week per neighbourhood. |
| `positioning-ideas` | Positioning variants to test. |
| `value-prop-statements` | Headline and subhead variants. |

## How to use

1. Read `product-marketing.md` — correct anything wrong. It is the source of truth.
2. Run `cold-start-problem` against the launch plan and let it score you. Expect 5–6.
3. Only then produce assets (Reels scripts, landing page, venue outreach).

Order matters. Assets built before the launch plan is scored are assets you will throw away.

## Discoverability note

These live in `marketing/skills/` as a curated library. For an agent to auto-load them as
skills they generally need to be under `.claude/skills/` (project) or `~/.claude/skills`
(global). Either mirror them there, or point the agent at this folder explicitly.

## Licence

All three source repos are MIT. Skills are unmodified copies; attribution above.
