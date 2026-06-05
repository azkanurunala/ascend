# Ascend — App Store Listing Draft

> Copy-paste ready. Character limits noted per field. Edit freely before submitting.

---

## App Name  (max 30 chars)
**Ascend: Orbit Climb**  *(19 chars)*

> Plain "Ascend" (6 chars) may already be taken on the App Store. Alternatives:
> - `Ascend: Orbit Climb` (19)
> - `Ascend — Slingshot Sky` (22)

## Subtitle  (max 30 chars)
**Orbit, slingshot, climb the sky.**  *(33 → trim)* → **Orbit & slingshot the sky**  *(25 chars)*

---

## Promotional Text  (max 170 chars — editable anytime without review)
One orb. A sky full of gravity wells. Hold to orbit, release to slingshot, and chain your way from the meadow to orbit. No wifi, no clutter — just pure flow.

---

## Description  (max 4000 chars)
Ascend is a one-touch arcade climber built around a single, distinctive mechanic: orbital slingshots. Hold to latch your glowing orb into orbit around a gravity well, then release at just the right moment to fling it upward toward the next. Chain well to well and climb. Misjudge a release and the orb falls away — that's the run. How high can you climb?

A MECHANIC THAT'S ALL ITS OWN
This isn't tap-to-flap. You don't fight gravity beat by beat — you ride it. Latch on, build your arc, and let go on the perfect tangent. Reading angles, momentum, and timing is the whole game, and it rewards real touch.

RISE THROUGH EIGHT WORLDS
Start in the Meadow and break through the Open Sky, High Sky, Stratosphere, Mesosphere, the shimmering Aurora, The Edge — and finally Orbit. Every altitude shifts the colors of the sky around you, so the higher you go, the more the world transforms.

ONE TOUCH. INFINITE SKILL.
No buttons. No tutorials. No filler. Anyone can play in seconds, but mastering the rhythm of orbit-and-release takes real precision. Each run is fast, flowing, and endlessly replayable.

PLAY ANYWHERE, ANYTIME
Fully offline — no internet, no account, no interruptions. Perfect for commutes, queues, or a quick reset between tasks. Your progress is saved right on your device.

MAKE THE ORB YOURS
Unlock a collection of luminous orb skins — Drift, Ember, Neon, Amethyst, Rosegold, and the rare animated Aurora — each with its own glow and trail.

CHASE THE LEADERBOARD
Track your best height, total runs, and time in the air. Climb the ranks and beat your personal ceiling, run after run.

BUILT FOR FEEL
Smooth glassmorphic visuals, satisfying haptics, and a calm-yet-intense pace. Toggle sound, haptics, reduced motion, and quality to play exactly how you like.

Orbit. Slingshot. Climb. How high can you Ascend?

---

## Keywords  (max 100 chars, comma-separated, no spaces after commas)
`orbit,slingshot,arcade,offline,climb,endless,gravity,orb,space,high score,minimal,casual,skill,flow`
*(98 chars)*

> Note: removed "flappy"/"dodge" — those framed the old loop and contributed to the
> 4.3(a) spam flag. The listing now centers the orbital-slingshot mechanic.

---

## What's New (release notes — v1.0.0)
First launch! Master the orbital slingshot: hold to orbit a gravity well, release to fling your orb toward the next, and climb from the meadow all the way to orbit. Unlock orb skins, chase your high score, and play fully offline.

---

## App Store Connect — supporting metadata

- **Primary category:** Games → Arcade
- **Secondary category:** Games → Casual
- **Age rating:** 4+ (no objectionable content)
- **Price:** Free
- **Support URL:** (required) e.g. a simple GitHub Pages / Notion / landing page
- **Marketing URL:** (optional)
- **Privacy Policy URL:** (required) — even if you collect nothing, you must host a short policy

### App Privacy answers (review before submitting)
**No ads, no tracking.** v1.0 ships RevenueCat IAP (Ascend Pro) + optional Game Center.
Full guidance in **`MONETIZATION_SETUP.md` §C**. Summary:
- **Purchases** — purchase history (the Ascend Pro IAP), App Functionality. Not tracking.
- **Game Center** (if leaderboard kept) — player ID / display name, App Functionality.
- **No** advertising data, **no** Device-ID-for-ads, **no** ATT prompt.
- The app does **not** contain ads (age-rating questionnaire).
- **Privacy Policy URL is required** — host `docs/privacy.html` (GitHub Pages) and use that URL.
- Create the **`lifetime`** IAP + sign the Paid Apps Agreement, and **add it to the
  version** so it's reviewed alongside the build.

### Screenshots (required — capture from the simulator with Cmd+S)
Minimum one set at iPhone 6.7" (1290×2796). Suggested shots:
1. Home screen (orb + "Orbit the wells. Slingshot to the stars.")
2. Mid-climb gameplay — orb orbiting a glowing gravity well, tether visible
3. High-altitude / Aurora or Orbit band (dramatic dark sky)
4. Cosmetics / orb skins screen
5. Leaderboard / ranks
