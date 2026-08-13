/**
 * One-time seed data for the Growth module.
 *
 * The owner seed is a transcription of the user's Notion workspace
 * (🌱 Personal Growth + 🎯 ERP Consultant Career Growth Hub) into app-native
 * habits, goals, routines and reference pages. After seeding, the app owns
 * this data — Notion is never read again.
 *
 * IDs are stable slugs, not random, so a re-seed can never duplicate a row.
 */

import { todayKey } from './growthMath'

export const OWNER_SEED_VERSION = 'owner-v1'
export const DEFAULT_SEED_VERSION = 'default-v1'

const D = { daily: 'daily', weekly: 'weekly', custom: 'custom' }

// ── Reference pages (read-only Notion content) ─────────────────────────────

/**
 * Study / reference pages. These are no longer copied into each user's private
 * growth document — a per-user copy can never be updated for anyone. They are
 * seeded once into the shared `content/library/pages` collection (see
 * /api/admin/seed-library) and read live from there by every account.
 */
export const REFERENCE = [
  {
    id: 'ref_morning_creed',
    slug: 'morning-creed',
    audience: 'owner',
    title: 'Read Every Morning',
    icon: '📌',
    group: 'Daily practice',
    markdown: `### 🔄 Speaking
Slow down — you are 30% faster than you think. Pause = confidence. **Point → Reason → Action** always. No filler words. Stress the right syllable.

### 🧘 Presence
Speak less, say more. Stay calm when others panic. Follow up after every meeting. Ask better questions. Use names.

### 🌱 Growth
One fix per day. Record yourself weekly. Read one page daily. Never stop the habit — **5 min beats zero**.`,
  },
  {
    id: 'ref_block_steps',
    slug: 'block-steps',
    audience: 'everyone',
    title: 'Block Steps — Warmup & Self-Correct',
    icon: '🎙️',
    group: 'Daily practice',
    markdown: `## Block 1 — Vocal Warmup (5 min)
1. **Humming (2 min)** — close lips, hum "mmmmmm". Feel the chest vibrate, not the throat. If only the throat vibrates, hum lower.
2. **Lip trill (1 min)** — blow air through closed lips, "brrrrr" motorboat. 30 sec × 2.
3. **Jaw stretch (1 min)** — open mouth as wide as possible, hold 3 sec, close. ×5. Fixes the half-open mouth habit.
4. **Volume scale (1 min)** — say "good morning" 4×: whisper → soft → normal → loud.

## Block 9 — Record & Self-Correct (5 min)
1. **Record (2 min)** — speak 2 min on today's topic. Phone recorder. No editing.
2. **Listen back (2 min)** — mark what you hear:

| Issue | Sounds like | Fix tomorrow |
|---|---|---|
| Rushing | Words blur together | Slow down 20% |
| Filler words | "um", "uh", "basically" | Replace with silence |
| Swallowed endings | "projec-" not "project" | Tap finger on final consonant |
| Flat tone | Everything same pitch | Stress key words harder |
| No pauses | Everything runs together | Pause after every sentence |
| Wrong stress | Syllable feels off | Redo that word 10× |

3. **One fix (1 min)** — pick ONE thing to fix tomorrow. Not three. One compounding fix per day.`,
  },
  {
    id: 'ref_study_materials',
    slug: 'study-materials',
    audience: 'everyone',
    title: 'Study Materials — Daily Drivers',
    icon: '🎓',
    group: 'Daily practice',
    markdown: `*Pick ONE per block — don't collect, practise.*

| Block | Material | How to use |
|---|---|---|
| 🎧 Shadowing | [BBC 6 Minute English](https://www.bbc.co.uk/learningenglish/english/features/6-minute-english) · [Rachel's English](https://www.youtube.com/@rachelsenglish) | 6-min episode = perfect daily size. Shadow 1 paragraph 5×, not the whole thing. |
| 🔤 Pronunciation | [YouGlish](https://youglish.com) · [Cambridge](https://dictionary.cambridge.org) · [ELSA Speak](https://elsaspeak.com) | YouGlish → hear 50 real people say the word. ELSA gives instant feedback on your own voice. |
| ⏸️ Delivery | [Steve Jobs Stanford](https://www.youtube.com/watch?v=UF8uR6Z6KLc) · Simon Sinek TED | Listen for the PAUSES, not the words. Count seconds of silence, then copy the pattern. |
| ⚡ Think Fast | Table Topics lists · Claude as prompt generator | Answer aloud in 60 sec, Point → Reason → Action. Do 2 prompts, not 10. |
| 🧩 Problem Solving | [BrainBashers](https://www.brainbashers.com/today.asp) · [Brilliant](https://brilliant.org) | Day A: one puzzle, reason ALOUD. Day B: one real work problem with 5 Whys. |
| 🤝 Negotiation | [Chris Voss clips](https://www.youtube.com/results?search_query=chris+voss+mirroring+labeling) | Watch 1 clip (5 min). Use the line in a real upcoming conversation. |
| 🧍 Presence | [Charisma on Command](https://www.youtube.com/@Charismaoncommand) · Mirror | One video per week. The real practice is your next meeting — pick ONE behaviour. |

### 🇧🇩 For Bangladeshi English speakers
Extra reps on **/v/ vs /b/** ("very" not "bery"), **/z/ vs /j/** ("zero" not "jero"), **word-final consonants** ("project", not "projec"), and **word stress** (deVELopment, not DEvelopment). Drill these in YouGlish weekly.`,
  },
  {
    id: 'ref_practice_prompts',
    slug: 'practice-prompts',
    audience: 'everyone',
    title: 'Practice Prompts',
    icon: '💬',
    group: 'Daily practice',
    markdown: `## ⚡ Think Fast — 60-second prompts
1. Should Bangladesh SMEs adopt ERP before hiring more staff?
2. Is remote work good for consulting teams?
3. A client wants a feature in half the realistic time. What do you say?
4. Why should a factory digitize its production tracking?
5. Convince me in 1 minute: Odoo vs custom software.
6. Your manager disagrees with your estimate. Respond.
7. What makes a good consultant?

**Answer structure:**
> **Point:** "Yes, SMEs should adopt ERP first."
> **Reason:** "Because adding staff to broken processes multiplies the chaos — ERP fixes the process, then each new hire is more productive."
> **Action:** "So I'd start with one module — inventory — prove value in 60 days, then scale."

## 📝 Friday 2-min speech topics
1. What I learned from the Zess Tyre implementation this month
2. How I would explain ERP to a factory owner who never used a computer
3. My 3-year career plan in 2 minutes
4. The biggest mistake consultants make with clients
5. Why documentation matters more than code

**Self-check after recording:** Did I pause after each sentence? Did I say "um"? Did I finish word endings? Pick ONE fix.

## 🧩 Day B — real work problems
1. Zess curing section has 66 cavities but demand needs 80. Options? *(constraint analysis)*
2. BIBAR users keep entering bills wrong. Root cause? *(5 Whys)*
3. Client wants to skip UAT to launch faster. Risk argument? *(SCQA)*
4. Should Invento build reusable modules or custom per client? *(first principles)*`,
  },
  {
    id: 'ref_fix_behavior',
    slug: 'fix-behavior',
    audience: 'owner',
    title: 'Fix Behavior System — The 5 Behaviors',
    icon: '🎯',
    group: 'Mindset',
    markdown: `> One system. 5 behaviours. 3 daily reminders. **Act before the mind talks you out of it.**

## 1. Spotlight Effect → "People judge me"
**Fix: focus shifting.** Shift attention from self to others. Assume people are thinking about themselves, not you. Nobody watches as closely as you think.

## 2. Shyness → hesitation to enter or speak
**Fix: 5-second rule.** Count down 5-4-3-2-1 and take any action within 5 seconds. Movement kills hesitation.

## 3. Self-Worth → "I'm not enough"
**Fix: evidence building.** Log 1 small win every day. Build a proof file: skills, wins, kind words. Trust the data, not the feeling.

## 4. People Pleasing → can't say no
**Fix: Reason → Denial → Respect.** "I can't because…" · say no clearly, no softening into yes · acknowledge them and hold the line. **No is a full sentence.**

## 5. Decisive Paralysis → overthinking
**Fix: ownership.** Act instantly. Own the outcome, good or bad. A decided 70% beats a perfect 0%.

---

## 3 Daily Reminders
- **☀️ Morning Prime** — Nobody's watching as closely as you think. Name 1 win from yesterday before you start.
- **⚡ Action Trigger** — 5 seconds. Pick. Move. Don't overthink. Ownership beats analysis.
- **🛡️ Boundary Check** — Before yes: pause. Reason → Decline → Respect. Saying no is a full sentence.

## Weekly Focus Rotation
| Week | Focus |
|---|---|
| 1 | Spotlight Effect |
| 2 | Shyness (5-sec rule) |
| 3 | Self-Worth (evidence) |
| 4 | People Pleasing (boundaries) |
| 5 | Decisive Paralysis (ownership) |
| 6+ | Whichever fired most last week |

## The Math
5 behaviours passively logged + 1 actively practised per week = the system rotates every 5 weeks. By week 10 each behaviour has had **2 focused practice cycles** plus 10 weeks of passive evidence. That's how change sticks.`,
  },
  {
    id: 'ref_gym',
    slug: 'gym-split',
    audience: 'owner',
    title: 'Gym & Fitness — Weekly Split',
    icon: '🏋️',
    group: 'Body',
    markdown: `> **Goal:** lose weight and build a consistent training habit.

| Day | Focus | Time |
|---|---|---|
| Sun | Full body / Push | 6:00–6:45 AM |
| Mon | Cardio + core | 6:00–6:45 AM |
| Tue | Full body / Pull | 6:00–6:45 AM |
| Wed | Cardio + core | 6:00–6:45 AM |
| Thu | Full body / Legs | 6:00–6:45 AM |
| Fri | Rest or light walk | Flexible |
| Sat | Rest or light walk | Flexible |

Swap this for whatever split the gym trainer recommends once you join — it exists so day 1 isn't wasted deciding.

### This week
- Visit gyms nearby, compare, and join (Sat)
- First session — light, just learn the equipment
- Use the 6:00–6:45 AM slot Sun–Thu (home workout until you join)`,
  },
  {
    id: 'ref_eating',
    slug: 'healthy-eating',
    audience: 'owner',
    title: 'Healthy Eating Framework',
    icon: '🍽️',
    group: 'Body',
    markdown: `> General guidance for structuring meals — not medical advice. For a significant weight-loss goal, check in with a doctor or nutritionist to set safe targets.

## The Simple Plate Method
- **½ plate** — vegetables (salad, sautéed sabzi, bhorta)
- **¼ plate** — protein (fish, chicken, eggs, dal, paneer)
- **¼ plate** — carbs (rice/roti — smaller portion than usual, not zero)

## Breakfast (quick, before the 8 AM departure)
- Eggs + 1 roti, or oats
- Air fryer options from your recipe list
- Fruit + a handful of nuts when short on time

## Lunch / Dinner principles
- Protein and vegetables first, rice last — portion control happens naturally
- Air fryer / grilled / steamed over deep fried
- One planned "free" meal a week is more sustainable than zero

## Daily basics
- Water through the day (carry a bottle to office)
- Don't skip meals to "save calories" — it backfires later in the day
- Sunday meal prep — batch-cook proteins and veg for the week`,
  },
  {
    id: 'ref_money_psych',
    slug: 'money-psychology',
    audience: 'owner',
    title: 'Money Psychology & Management',
    icon: '💰',
    group: 'Money',
    markdown: `> Different from the 1 Crore plan — that's about *earning* more. This is about how you *think about and handle* money day to day.

## Core principles
- **Pay yourself first** — move a fixed % to savings the moment income arrives, before spending
- **Avoid lifestyle inflation** — when freelance/agency income kicks in, keep spending flat for a while
- **Track behaviour, not just numbers** — notice *why* you spend (stress, status, boredom), not only how much
- **Separate accounts help** — spending / saving / investing, even at small amounts
- **Small consistent saving beats big irregular saving**

## Weekly money habit
- Quick look at what came in and went out this week
- % saved this week
- One spending decision where you noticed a pattern
- One adjustment for next week

## Why it matters for the 1 Crore goal
Earning more only compounds if the handling side doesn't leak it back out. This is the leak-prevention half of that plan.

*Your Livio Reports page already charts the numbers — use it for the first bullet.*`,
  },
  {
    id: 'ref_speaking_30',
    slug: 'speaking-30day',
    audience: 'owner',
    title: '30-Day CEO Speaking Plan',
    icon: '🗣️',
    group: 'Career',
    markdown: `## Daily formula — at least ONE of these
| Priority | Exercise | Time |
|---|---|---|
| 1 | Pronunciation drill (tongue twisters / word stress) | 5 min |
| 2 | Shadowing (global speakers / ERP demos) | 10 min |
| 3 | Structured speaking (Point → Reason → Action) | 5 min |
| 4 | Record yourself and replay | 2 min |

## Week 1 — Mouth control & clarity
Slow down. Open your mouth more. Clear word endings.
Drills: "Red leather, yellow leather" · "Unique New York" · "The tip of the tongue, the teeth, the lips".
Task: describe your job in 3 sentences. Record. Replay.

## Week 2 — Breath control & pausing
Inhale 4 sec → speak while exhaling slowly.
"Today… we completed the project… and tomorrow… we will start testing."
- "The module… is not yet configured… we will finish it… by Thursday."
- "Data migration… is complete… we can now… begin UAT."

## Week 3 — Structured speaking (CEO style)
**Point** (main message first) → **Reason** (why, one sentence) → **Action** (what happens next).
> "The system is delayed *(Point)* because data migration is incomplete *(Reason)*. We will finish validation tomorrow *(Action)*."

## Week 4 — Confidence & vocal strength
Hum 2 min · read loudly 3 min · read softly 2 min · normal pace 3 min.
Integration test: record 2 minutes on "My work, my skills, and how I manage ERP projects."

## Word stress — ERP/consulting terms
| Word | Stress |
|---|---|
| development | de-VEL-op-ment |
| implementation | im-ple-men-TAY-shun |
| communication | com-myoo-ni-KAY-shun |
| organization | or-gan-i-ZAY-shun |
| configuration | con-fig-yoo-RAY-shun |
| requirement | re-QUIRE-ment |
| consultant | con-SUL-tant |
| manufacturing | man-u-FAK-chur-ing |
| integration | in-teh-GRAY-shun |
| documentation | dok-yoo-men-TAY-shun |

## Shadowing sources
Obama speeches (clear pauses, calm delivery) · Simon Sinek TED (simple words, powerful structure) · Odoo demo videos (ERP vocabulary) · McKinsey/Bain partner interviews (CEO-level structure).

**How:** play 10–15 sec → pause → repeat exactly, matching tone, pause and speed. Copy structure and rhythm, not accent.

## Rules
- ❌ Don't try to sound native in 30 days · ❌ don't speak fast to seem confident · ❌ don't copy an accent
- ✅ Clarity + structure + control · ✅ 5 minutes daily beats 1 hour on weekends`,
  },
  {
    id: 'ref_crore',
    slug: 'crore-plan',
    audience: 'owner',
    title: '1 Crore BDT Plan — 2 Years',
    icon: '🎯',
    group: 'Career',
    markdown: `Target **৳1 Crore in 24 months.** Base salary ৳40K/month, RondaShip ৳1L one-time — gap to close ≈ ৳99L. Three income tracks running in parallel.

## Track 1 — Solo freelancing (Month 1+)
Target ৳1–1.5L/month by Month 6. Upwork + LinkedIn outreach, Odoo/ERPNext functional niche, UAE/Canada/Australia. \\$25/hr → \\$40–50/hr after certification. 2 hrs/day.

## Track 2 — Digital agency (Month 3–4+)
Target ৳1–2L/month by Month 9. Odoo/ERPNext implementation, AI projects, web dev. Team executes, you sell. \\$2–5K/project. 1 hr/day.

## Track 3 — Productized service (Month 6+)
Target ৳50K–1L/month passive by Month 18. Fixed-price Odoo customization packages, ERPNext industry templates, a niche module on the Odoo marketplace.

## Milestones
| Period | Focus | Income target |
|---|---|---|
| Month 1–2 | Upwork profile, first gig, cert prep | ৳40–50K |
| Month 3–4 | First foreign client, agency registered | ৳70–90K |
| Month 5–6 | 2 freelance clients, agency first project | ৳1.2–1.5L |
| Month 7–12 | Agency scaling, freelance steady | ৳2–2.5L/mo |
| Month 13–18 | Agency 2–3 projects/mo, productized launching | ৳3–3.5L/mo |
| Month 19–24 | All 3 tracks mature | ৳4–5L/mo |

## 24-month projection
Salary ৳9.6L · RondaShip ৳1L · Freelancing ৳25–30L · Agency ৳35–40L · Productized ৳8–12L → **৳78–92L total.**

> ⚠️ Hitting exactly 1 crore needs one big break — a large agency project (\\$10K+) or a product that scales.

## How the 3 targets connect
Better English → more confident on calls → better client handling → more clients → more revenue → certification adds credibility → higher rates.`,
  },
  {
    id: 'ref_client_handling',
    slug: 'client-handling',
    audience: 'owner',
    title: 'Client Handling — Question Bank',
    icon: '🤝',
    group: 'Career',
    markdown: `Handle discovery calls, proposals and follow-ups confidently by Day 90. **30 min/day.**

## 10 questions to have answers ready for
1. What is your experience with Odoo?
2. How long will implementation take?
3. What is your pricing?
4. Can you show me examples of your work?
5. How do you handle support after go-live?
6. What makes you different from other consultants?
7. Can you work within our budget?
8. What do you need from our side?
9. How do we communicate during the project?
10. What if something goes wrong?

## Phase 1 — Month 1: learn the frameworks
Study SPIN Selling (a YouTube summary is enough). Watch 5 real discovery-call recordings. Write out answers to the 10 questions in English.

## Phase 2 — Month 2: simulate
Role-play discovery calls daily with Claude ("let's do a mock client call"). 2 cold outreach messages per week to UAE/Canada prospects. Draft 1 proposal template.

## Phase 3 — Month 3: real exposure
Apply to 3 Upwork jobs per week. Treat every application as client-handling practice. Debrief after every interaction — what went well, what didn't.`,
  },
]

// ── Owner seed ─────────────────────────────────────────────────────────────

function ownerHabits() {
  return [
    // Daily practice — the Master Hub blocks that deserve streaks
    { id: 'h_warmup', name: 'Vocal warmup', emoji: '🎙️', color: '#8b5cf6', group: 'Speaking', cadence: D.daily, target: 1, unit: '', remindAt: '', order: 1 },
    { id: 'h_pronunciation', name: 'Pronunciation drill', emoji: '🔤', color: '#8b5cf6', group: 'Speaking', cadence: D.daily, target: 1, unit: '', remindAt: '', order: 2 },
    { id: 'h_shadowing', name: 'Shadowing 10 min', emoji: '🎧', color: '#8b5cf6', group: 'Speaking', cadence: D.daily, target: 1, unit: '', remindAt: '', order: 3 },
    { id: 'h_thinkfast', name: 'Think fast — 2 prompts', emoji: '⚡', color: '#f59e0b', group: 'Speaking', cadence: D.daily, target: 1, unit: '', remindAt: '', order: 4 },
    { id: 'h_record', name: 'Record & self-correct', emoji: '📝', color: '#8b5cf6', group: 'Speaking', cadence: D.daily, target: 1, unit: '', remindAt: '', order: 5 },

    // Fix Behavior System — the daily check
    { id: 'h_win', name: 'Logged 1 win', emoji: '🏆', color: '#22c55e', group: 'Mindset', cadence: D.daily, target: 1, unit: '', remindAt: '21:30', order: 6 },
    { id: 'h_5sec', name: 'Used the 5-second rule', emoji: '⏱️', color: '#22c55e', group: 'Mindset', cadence: D.daily, target: 1, unit: '', remindAt: '', order: 7 },
    { id: 'h_boundary', name: 'Held a boundary', emoji: '🛡️', color: '#22c55e', group: 'Mindset', cadence: D.daily, target: 1, unit: '', remindAt: '', order: 8 },
    { id: 'h_decide', name: 'Decided without overthinking', emoji: '🎯', color: '#22c55e', group: 'Mindset', cadence: D.daily, target: 1, unit: '', remindAt: '', order: 9 },

    // Career
    { id: 'h_odoo', name: 'Odoo study 1.5h', emoji: '🏅', color: '#6366f1', group: 'Career', cadence: D.daily, target: 1, unit: '', remindAt: '20:00', order: 10 },
    { id: 'h_client', name: 'Client handling 30 min', emoji: '🤝', color: '#6366f1', group: 'Career', cadence: D.daily, target: 1, unit: '', remindAt: '', order: 11 },
    { id: 'h_upwork', name: 'Upwork applications', emoji: '💼', color: '#6366f1', group: 'Career', cadence: D.custom, daysOfWeek: [0, 2, 4], target: 3, unit: 'jobs', remindAt: '', order: 12 },

    // Body — gym split is Sun–Thu 6:00 AM
    { id: 'h_train', name: 'Train 6:00 AM', emoji: '🏋️', color: '#ef4444', group: 'Body', cadence: D.custom, daysOfWeek: [0, 1, 2, 3, 4], target: 1, unit: '', remindAt: '05:45', order: 13 },
    { id: 'h_water', name: 'Water through the day', emoji: '💧', color: '#06b6d4', group: 'Body', cadence: D.daily, target: 8, unit: 'glasses', remindAt: '', order: 14 },
    { id: 'h_meals', name: 'Ate to the plate method', emoji: '🍽️', color: '#06b6d4', group: 'Body', cadence: D.daily, target: 1, unit: '', remindAt: '', order: 15 },
    { id: 'h_mealprep', name: 'Sunday meal prep', emoji: '🥘', color: '#06b6d4', group: 'Body', cadence: D.custom, daysOfWeek: [0], target: 1, unit: '', remindAt: '10:00', order: 16 },

    // Money + review rituals
    { id: 'h_money_review', name: 'Weekly money review', emoji: '💰', color: '#f59e0b', group: 'Money', cadence: D.custom, daysOfWeek: [6], target: 1, unit: '', remindAt: '11:00', order: 17 },
    { id: 'h_read', name: 'Read one page', emoji: '📖', color: '#8b5cf6', group: 'Mindset', cadence: D.daily, target: 1, unit: '', remindAt: '', order: 18 },
    { id: 'h_plan', name: 'Planned tomorrow', emoji: '🌙', color: '#6366f1', group: 'Mindset', cadence: D.daily, target: 1, unit: '', remindAt: '22:00', order: 19 },
  ].map((h) => ({
    daysOfWeek: [],
    archived: false,
    createdAt: new Date().toISOString(),
    ...h,
  }))
}

function ownerRoutines() {
  return [
    {
      id: 'r_daily_practice',
      name: 'Daily Practice',
      // Master Hub weekly focus — key is day of week (0 = Sunday)
      weeklyFocus: {
        0: 'Psychology + reading',
        1: 'Pronunciation + new words',
        2: 'Shadowing + delivery',
        3: 'Think Fast + Topic Sprint',
        4: 'Pause drills',
        5: 'Full 2-min recorded speech',
        6: 'Negotiation',
      },
      modes: [
        { id: 'full', label: 'Full', minutes: 80, hint: 'Normal day' },
        { id: 'short', label: 'Short', minutes: 45, hint: 'Busy day' },
        { id: 'min', label: 'Minimum', minutes: 20, hint: 'Never skip — 5 min beats zero' },
      ],
      blocks: [
        { id: 'b1', title: '🎙️ Vocal Warmup', minutes: 5, modes: ['full', 'short', 'min'], habitId: 'h_warmup' },
        { id: 'b2', title: '👅 Tongue Twisters', minutes: 10, modes: ['full', 'short'] },
        { id: 'b3', title: '🔤 Pronunciation + Spelling', minutes: 10, modes: ['full', 'short'], habitId: 'h_pronunciation' },
        { id: 'b4', title: '🎧 Shadowing', minutes: 10, modes: ['full'], habitId: 'h_shadowing' },
        { id: 'b5', title: '⏸️ Pause + Delivery', minutes: 10, modes: ['full'] },
        { id: 'b6', title: '⚡ Think Fast + Decisions', minutes: 10, modes: ['full', 'short', 'min'], habitId: 'h_thinkfast' },
        { id: 'b7', title: '🧍 Personality + Body Language', minutes: 10, modes: ['full', 'short'] },
        { id: 'b8', title: '🧩 Problem Solving', minutes: 10, modes: ['full'] },
        { id: 'b9', title: '📝 Record + Self-Correct', minutes: 5, modes: ['full', 'short', 'min'], habitId: 'h_record' },
      ],
    },
  ]
}

function ownerGoals() {
  const start = todayKey()
  return [
    {
      id: 'g_crore',
      title: '৳1 Crore BDT',
      why: 'Three income tracks in parallel — freelancing, agency, productized service.',
      kind: 'numeric',
      target: 10000000,
      unit: '৳',
      current: 0,
      // Reads live from the finance ledger instead of manual entry
      financeLink: 'lifetimeIncome',
      startDate: start,
      dueDate: '2028-08-08',
      status: 'active',
      category: 'Career',
      referenceSlug: 'crore-plan',
      milestones: [
        { id: 'm_c1', title: 'Month 1–2 · ৳40–50K/mo — Upwork profile, first gig', due: '', done: false },
        { id: 'm_c2', title: 'Month 3–4 · ৳70–90K/mo — first foreign client, agency registered', due: '', done: false },
        { id: 'm_c3', title: 'Month 5–6 · ৳1.2–1.5L/mo — 2 freelance clients, agency first project', due: '', done: false },
        { id: 'm_c4', title: 'Month 7–12 · ৳2–2.5L/mo — agency scaling', due: '', done: false },
        { id: 'm_c5', title: 'Month 13–18 · ৳3–3.5L/mo — productized launching', due: '', done: false },
        { id: 'm_c6', title: 'Month 19–24 · ৳4–5L/mo — all 3 tracks mature', due: '', done: false },
      ],
      linkedHabitIds: [],
    },
    {
      id: 'g_freelance',
      title: 'Track 1 — Solo freelancing',
      why: '৳1–1.5L/month by Month 6. Odoo/ERPNext niche, UAE/Canada/Australia. 2 hrs/day.',
      kind: 'milestone',
      parentGoalId: 'g_crore',
      startDate: start,
      status: 'active',
      category: 'Career',
      milestones: [
        { id: 'm_f1', title: 'Create Upwork profile', due: '', done: false },
        { id: 'm_f2', title: 'First small job ($100–200) for reviews — by Month 2', due: '', done: false },
        { id: 'm_f3', title: 'First real client ($500–800) — by Month 4', due: '', done: false },
        { id: 'm_f4', title: 'Raise rate to $40–50/hr after certification', due: '', done: false },
      ],
      linkedHabitIds: ['h_upwork'],
    },
    {
      id: 'g_agency',
      title: 'Track 2 — Digital agency',
      why: '৳1–2L/month by Month 9. Team executes, you sell. $2–5K/project.',
      kind: 'milestone',
      parentGoalId: 'g_crore',
      startDate: start,
      status: 'active',
      category: 'Career',
      milestones: [
        { id: 'm_a1', title: 'Register agency — by Month 3', due: '', done: false },
        { id: 'm_a2', title: 'Build one-page portfolio site', due: '', done: false },
        { id: 'm_a3', title: 'First project — by Month 5', due: '', done: false },
      ],
      linkedHabitIds: [],
    },
    {
      id: 'g_product',
      title: 'Track 3 — Productized service',
      why: '৳50K–1L/month passive by Month 18.',
      kind: 'milestone',
      parentGoalId: 'g_crore',
      startDate: start,
      status: 'active',
      category: 'Career',
      milestones: [
        { id: 'm_p1', title: 'Fixed-price Odoo customization packages', due: '', done: false },
        { id: 'm_p2', title: 'ERPNext setup templates for a specific industry', due: '', done: false },
        { id: 'm_p3', title: 'Publish a niche module on the Odoo marketplace', due: '', done: false },
      ],
      linkedHabitIds: [],
    },
    {
      id: 'g_odoo_cert',
      title: 'Odoo 17 Functional Certification',
      why: 'Certification raises the hourly rate 30–40% immediately — ৳10–15L extra over 12 months.',
      kind: 'milestone',
      startDate: start,
      status: 'active',
      category: 'Career',
      referenceSlug: 'crore-plan',
      milestones: [
        { id: 'm_o1', title: 'Day 14 — complete Odoo eLearning tracks', due: '', done: false },
        { id: 'm_o2', title: 'Day 42 — 3 modules studied deeply with notes', due: '', done: false },
        { id: 'm_o3', title: 'Day 70 — full demo company flow working in sandbox', due: '', done: false },
        { id: 'm_o4', title: 'Day 84 — first mock exam done', due: '', done: false },
        { id: 'm_o5', title: 'Day 100 — exam booked', due: '', done: false },
        { id: 'm_o6', title: 'Day 120 — certification passed', due: '', done: false },
      ],
      linkedHabitIds: ['h_odoo'],
    },
    {
      id: 'g_speaking',
      title: 'CEO-level English speaking',
      why: 'Clear international English, structured delivery, confidence on client calls.',
      kind: 'milestone',
      startDate: start,
      status: 'active',
      category: 'Growth',
      referenceSlug: 'speaking-30day',
      milestones: [
        { id: 'm_s1', title: 'Week 1 — noticeably slower, clearer speech', due: '', done: false },
        { id: 'm_s2', title: 'Week 2 — deliberate pauses in conversation', due: '', done: false },
        { id: 'm_s3', title: 'Week 3 — structured updates without rambling', due: '', done: false },
        { id: 'm_s4', title: 'Week 4 — confident 2-min professional delivery', due: '', done: false },
        { id: 'm_s5', title: 'Day 30+ — consistent professional speaking habit', due: '', done: false },
      ],
      linkedHabitIds: ['h_warmup', 'h_pronunciation', 'h_shadowing', 'h_record'],
    },
    {
      id: 'g_client',
      title: 'Confident client handling',
      why: 'Discovery calls, proposals and follow-ups handled confidently by Day 90.',
      kind: 'milestone',
      startDate: start,
      status: 'active',
      category: 'Career',
      referenceSlug: 'client-handling',
      milestones: [
        { id: 'm_ch1', title: 'Day 30 — SPIN understood, 10 Q&A answers written', due: '', done: false },
        { id: 'm_ch2', title: 'Day 60 — first Upwork proposal sent, mock call completed', due: '', done: false },
        { id: 'm_ch3', title: 'Day 90 — first paid project closed', due: '', done: false },
      ],
      linkedHabitIds: ['h_client'],
    },
    {
      id: 'g_fitness',
      title: 'Lose weight & train consistently',
      why: 'Consistency first — the split matters less than showing up at 6:00 AM.',
      kind: 'milestone',
      startDate: start,
      status: 'active',
      category: 'Body',
      referenceSlug: 'gym-split',
      milestones: [
        { id: 'm_g1', title: 'Visit gyms nearby, compare, and join', due: '', done: false },
        { id: 'm_g2', title: 'First session — light, learn the equipment', due: '', done: false },
        { id: 'm_g3', title: '4 weeks of Sun–Thu training done', due: '', done: false },
      ],
      linkedHabitIds: ['h_train', 'h_meals'],
    },
  ].map((g) => ({ milestones: [], linkedHabitIds: [], current: 0, ...g }))
}

function ownerTracks() {
  return [
    { id: 't_odoo', name: 'Odoo functional (14 weeks)', status: 'in-progress', percent: 0, notes: '' },
    { id: 't_erpnext', name: 'ERPNext functional', status: 'not-started', percent: 0, notes: '' },
    { id: 't_pm', name: 'Project management', status: 'not-started', percent: 0, notes: '' },
    { id: 't_docs', name: 'Documentation skills', status: 'not-started', percent: 0, notes: '' },
    { id: 't_soft', name: 'Soft skills / books', status: 'not-started', percent: 0, notes: '' },
    { id: 't_cert', name: 'Certifications', status: 'not-started', percent: 0, notes: '' },
  ]
}

function ownerLibrary() {
  return [
    { id: 'lib_1', title: 'How to Win Friends and Influence People', author: 'Dale Carnegie', topic: 'Communication', url: 'https://archive.org/search?query=how+to+win+friends', status: 'todo' },
    { id: 'lib_2', title: 'Never Split the Difference', author: 'Chris Voss', topic: 'Negotiation', url: 'https://www.youtube.com/results?search_query=never+split+the+difference+summary', status: 'todo' },
    { id: 'lib_3', title: 'Influence', author: 'Robert Cialdini', topic: 'Psychology', url: 'https://archive.org/search?query=influence+cialdini', status: 'todo' },
    { id: 'lib_4', title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', topic: 'Decision making', url: 'https://archive.org/search?query=thinking+fast+and+slow', status: 'todo' },
    { id: 'lib_5', title: 'The Like Switch', author: 'Jack Schafer', topic: 'Rapport', url: 'https://www.youtube.com/results?search_query=the+like+switch+summary', status: 'todo' },
    { id: 'lib_6', title: 'Decisive', author: 'Chip Heath', topic: 'Decisions', url: 'https://www.youtube.com/results?search_query=decisive+chip+heath+summary', status: 'todo' },
    { id: 'lib_7', title: 'The McKinsey Way', author: 'Ethan Rasiel', topic: 'Problem solving', url: 'https://archive.org/search?query=mckinsey+way', status: 'todo' },
    { id: 'lib_8', title: 'Presence', author: 'Amy Cuddy', topic: 'Body language', url: 'https://www.youtube.com/results?search_query=presence+amy+cuddy+summary', status: 'todo' },
    { id: 'lib_9', title: 'Talk Like TED', author: 'Carmine Gallo', topic: 'Public speaking', url: 'https://www.youtube.com/results?search_query=talk+like+ted+summary', status: 'todo' },
    { id: 'lib_10', title: 'Getting to Yes', author: 'Fisher & Ury', topic: 'Negotiation', url: 'https://archive.org/search?query=getting+to+yes+fisher', status: 'todo' },
    { id: 'lib_11', title: 'The Psychology of Money', author: 'Morgan Housel', topic: 'Money behaviour', url: 'https://archive.org/search?query=psychology+of+money', status: 'todo' },
    { id: 'lib_12', title: 'I Will Teach You To Be Rich', author: 'Ramit Sethi', topic: 'Conscious spending', url: 'https://www.youtube.com/@ramit', status: 'todo' },
  ]
}

export const BEHAVIORS = [
  { id: 'spotlight', label: 'Spotlight Effect', fix: 'Focus shifting' },
  { id: 'shyness', label: 'Shyness', fix: '5-second rule' },
  { id: 'self-worth', label: 'Self-Worth', fix: 'Evidence building' },
  { id: 'people-pleasing', label: 'People Pleasing', fix: 'Reason → Denial → Respect' },
  { id: 'paralysis', label: 'Decisive Paralysis', fix: 'Ownership' },
]

export function buildOwnerSeed() {
  return {
    seededWith: OWNER_SEED_VERSION,
    habits: ownerHabits(),
    goals: ownerGoals(),
    routines: ownerRoutines(),
    tracks: ownerTracks(),
    library: ownerLibrary(),
    // No `reference` here: study pages live in the shared content library now.
    weakAreas: [],
    // The user's current Next Day Plan answers, so the ritual starts pre-filled
    planDefaults: {
      top3: ['Morning practice', 'Work on project', 'Learn English'],
      focusBehavior: '5-sec rule — take action',
      firstAction: 'Meditation',
      energyWindow: '8–10pm',
      sayNoTo: 'Rush',
    },
  }
}

// ── Default seed (everyone else) ────────────────────────────────────────────

export function buildDefaultSeed() {
  return {
    seededWith: DEFAULT_SEED_VERSION,
    habits: [
      { id: 'h_water', name: 'Drink water', emoji: '💧', color: '#06b6d4', group: 'Health', cadence: D.daily, target: 8, unit: 'glasses', order: 1 },
      { id: 'h_move', name: 'Move 30 minutes', emoji: '🏃', color: '#ef4444', group: 'Health', cadence: D.daily, target: 1, unit: '', order: 2 },
      { id: 'h_read', name: 'Read 20 minutes', emoji: '📖', color: '#8b5cf6', group: 'Mind', cadence: D.daily, target: 1, unit: '', order: 3 },
      { id: 'h_sleep', name: 'Sleep before midnight', emoji: '😴', color: '#6366f1', group: 'Health', cadence: D.daily, target: 1, unit: '', order: 4 },
      { id: 'h_plan', name: 'Plan tomorrow', emoji: '🌙', color: '#6366f1', group: 'Mind', cadence: D.daily, target: 1, unit: '', remindAt: '22:00', order: 5 },
    ].map((h) => ({ daysOfWeek: [], archived: false, remindAt: '', createdAt: new Date().toISOString(), ...h })),
    goals: [
      {
        id: 'g_savings',
        title: 'Build an emergency fund',
        why: 'Three months of expenses set aside.',
        kind: 'numeric',
        target: 100000,
        current: 0,
        unit: '',
        financeLink: 'lifetimeNet',
        startDate: todayKey(),
        dueDate: '',
        status: 'active',
        category: 'Money',
        milestones: [],
        linkedHabitIds: [],
      },
      {
        id: 'g_habit30',
        title: 'Keep a 30-day streak',
        why: 'Consistency compounds — one habit, thirty days.',
        kind: 'milestone',
        startDate: todayKey(),
        status: 'active',
        category: 'Growth',
        milestones: [
          { id: 'm_h1', title: 'Week 1 done', due: '', done: false },
          { id: 'm_h2', title: 'Week 2 done', due: '', done: false },
          { id: 'm_h3', title: 'Week 3 done', due: '', done: false },
          { id: 'm_h4', title: '30 days done', due: '', done: false },
        ],
        linkedHabitIds: [],
      },
    ],
    routines: [
      {
        id: 'r_morning',
        name: 'Morning routine',
        weeklyFocus: null,
        modes: [
          { id: 'full', label: 'Full', minutes: 30, hint: 'Normal day' },
          { id: 'min', label: 'Minimum', minutes: 10, hint: 'Busy day' },
        ],
        blocks: [
          { id: 'b1', title: 'Water + stretch', minutes: 5, modes: ['full', 'min'] },
          { id: 'b2', title: 'Move', minutes: 15, modes: ['full'] },
          { id: 'b3', title: 'Read', minutes: 10, modes: ['full', 'min'] },
        ],
      },
    ],
    tracks: [],
    library: [],
    weakAreas: [],
    planDefaults: { top3: ['', '', ''], focusBehavior: '', firstAction: '', energyWindow: '', sayNoTo: '' },
  }
}
