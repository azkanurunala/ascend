# PRD: Ascend

> ⚠️ **HISTORICAL PRD (2026-05-31).** This describes the ORIGINAL tap-to-flap / dodge-pillars
> concept, which was rejected on App Store guideline **4.3(a) (spam — too similar to Flappy
> Bird)**. The shipping game pivoted to an **orbit-slingshot** mechanic (hold to orbit + charge a
> gravity well, release to slingshot toward the next, chain to climb; fall off-screen = game
> over). Treat the "Core Mechanic / obstacles / dodge" sections below as superseded — see
> `README.md` and `CLAUDE.md` for the current design. Sky bands, skins, offline-first structure
> and monetization still apply.

**Product Name:** Ascend  
**Subtitle:** Orbit the wells. Slingshot to the stars. How high can you climb?  
**Version:** 1.0 MVP  
**Target Release:** Week 4 (hypercasual, simple scope)  
**Platform:** iOS 15+, offline-first  
**Monetization:** Free + optional cosmetics ($0.99-$2.99 skins), optional ads for 1 revive/day  

---

## 1. North Star Statement

Players tap repeatedly to ascend against gravity while dodging obstacles that get progressively faster and tighter—offline, zero setup, "one more try" compulsion built-in.

---

## 2. Problem Statement

- **Player Pain:** Most mobile games require tutorials, accounts, or constant internet. Hypercasual gamers want instant gratification: open → play → close in <5 min. Daydreaming-compatible means they don't need to focus.
- **Market Gap:** Flappy Bird (2013) proved tap-to-survive dominates. 2048, Crossy Road, Piano Tiles succeeded. But no current game owns the **"tap-to-rise against gravity with tightening obstacles"** mechanic at hypercasual scale.
- **WTP Signal:** Hypercasual monetization works via cosmetics ($0.99-$2.99 skins) + leaderboards (free). [Medium confidence: hypercasual market proven but commoditized; differentiation via elegant aesthetics matters]

---

## 3. Core Mechanic

### 3.1 — The Moneyshot (30 Seconds)

**Screen: Ascending**
```
        ▲ 1,247
        
    ◯ (player ball)
    
[━━━━] (obstacle)
[  ━] (narrower obstacle)
```

**Action:** Tap screen → player ball rises 1 unit → gravity pulls down 0.5 units per frame → net upward motion.

**Collision:** Ball hits obstacle → game over → "Revive?" popup.

---

### 3.2 — Difficulty Progression

**Timeline:**
- **Seconds 0-5:** Obstacle spacing wide (6 units), speed slow (1 frame per rise)
- **Seconds 5-15:** Spacing shrinks (5 → 3 units), speed increases (0.8 frame per rise)
- **Seconds 15-30:** Spacing minimal (2 units), speed frantic (0.5 frame per rise)
- **30+ seconds:** Chaos (spacing 1-2 units, randomized patterns, speed maxed)

**Formula:** `obstacle_spacing = max(1, 6 - score/500)` and `speed = min(4, 1 + score/1000)`

---

### 3.3 — Progression Loop

1. **Tap** → rise
2. **Dodge** → obstacle passes
3. **Score increases** → difficulty ramps
4. **30-60 seconds** → inevitable failure
5. **"Revive?" popup** → optional ad or $0.99 cosmetic unlock
6. **Retry** → score resets, difficulty resets

---

## 4. User Journey

### Day 1 Player (New): Casual Experimenter

**Minute 0-1:**
- Install app (sees 2 screenshots: ascend mechanic, leaderboard)
- Open → sees game screen with faint "Tap to Play" text
- Taps once → ball rises, gravity pulls, obstacles visible
- "Oh, I need to keep tapping"

**Minute 1-5:**
- Plays 3 games (20 sec, 12 sec, 35 sec)
- Second game feels good (dodged 2 obstacles)
- Third game: goes higher → collision → sees "Revive? [Watch Ad] [Retry]"
- Taps Retry (not Revive)

**End of Day 1:** Uninstalls (tried, liked, moved on)

---

### Day 7 Player (Returning Enthusiast): Daydreamer

**Morning (work breaks):**
- Opens app, sees leaderboard updated
- Friend "Alex" is rank #2 (8,492 points)
- Player is rank #47 (3,200 points)
- Plays 1 game (45 sec, high score: 4,100)
- Sees "New Personal Best!" animation
- Closes app, back to work

**Evening (commute):**
- Opens app while waiting for bus
- Plays 5 games (passive tapping, daydreaming)
- Hovers near rank #20 (need 5,800 points)
- Sees cosmetic skin ad: "Blue Trail + Glow Ball - $0.99"
- Doesn't buy yet, but interested

**End of Day 7:** Plays daily, rank climbing, considers cosmetic purchase

---

### Month 3 Player (Invested): Competitive Grinder

**Daily ritual (15-30 min):**
- Opens app immediately upon waking
- Checks leaderboard (is now rank #3, 12,847 points)
- Plays 10-15 games targeting specific obstacles patterns
- Has purchased 2 cosmetic skins ($0.99 each): "Gold Ball" + "Purple Glow"
- Watches optional ad for 1 revive (daily limit)
- Plays 1-2 more games with revive

**Weekly:**
- Competes for top 10 (leaderboard resets Sunday)
- Screenshot high scores, shares on Instagram
- Refers friend (no incentive, just wants more competition)

**Monetization realized:** Direct cosmetics = $2 (month 3). Ads = $0.50/month (rough). Total ARPU = $2.50/month.

---

## 5. User Flow Swimlane Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ACTOR: New Player (First Time)                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  App             │  Player           │  System                              │
│ ─────────────────┼───────────────────┼───────────────────────────────────  │
│                  │                   │                                      │
│ [Launch Screen]  │                   │                                      │
│     ↓            │                   │                                      │
│ "Tap to Play"    │ [Sees text]       │                                      │
│                  │      ↓            │                                      │
│                  │  [Taps screen]    │                                      │
│                  │      ──────────────→ [Ball rises 1 unit]                 │
│                  │                   │ [Gravity pulls: -0.5]                │
│                  │                   │ [Obstacle at height 5]               │
│                  │                   │                                      │
│                  │ [Keeps tapping]   │                                      │
│                  │      ──────────────→ [Rise continues]                    │
│                  │                   │ [Obstacle passes]                    │
│                  │                   │ [Score: +10]                         │
│                  │                   │                                      │
│  [8 sec mark]    │                   │                                      │
│  Obstacle        │                   │                                      │
│  speed ↑         │                   │                                      │
│                  │ [Taps faster]     │                                      │
│                  │      ──────────────→ [Collision detected!]               │
│                  │                   │                                      │
│ [Game Over]      │                   │                                      │
│ Score: 2,150     │ [Sees score]      │                                      │
│                  │      ↓            │                                      │
│ [Revive? Ad/Pay] │ [Taps Retry]      │ [Reset board, score=0]              │
│                  │      ──────────────→ [Game restarts]                     │
│                  │                   │                                      │
│ [Game Over x3]   │ [Quits app]       │ [Game suspended]                    │
│                  │                   │                                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ ACTOR: Returning Player (Daydreamer, Day 7+)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  App             │  Player           │  System                              │
│ ─────────────────┼───────────────────┼───────────────────────────────────  │
│                  │                   │                                      │
│ [Home Screen]    │                   │                                      │
│ Leaderboard Tab  │ [Opens app]       │ [Load leaderboard from local cache]  │
│ Visible          │                   │ [Rank #47, Points: 3,200]            │
│                  │                   │                                      │
│ Rank #47         │ [Sees friend      │                                      │
│ Points: 3,200    │  is rank #2]      │                                      │
│                  │      ↓            │                                      │
│ Friend: #2       │ [Motivated,       │                                      │
│ 8,492 pts        │  taps Play]       │                                      │
│                  │      ──────────────→ [Start new game]                    │
│                  │                   │ [Difficulty: 1.2x (based on history)]│
│                  │                   │                                      │
│ [Game running]   │ [Plays 45 sec]    │                                      │
│ Obstacles speed  │ [Dodges 8 obs.]   │ [Score increases per dodge]         │
│ increasing       │      ──────────────→ [Collects +200 pts per dodge]       │
│                  │ [Final collision] │                                      │
│                  │                   │ [Game Over: 4,100 pts]               │
│                  │                   │                                      │
│ [New Personal    │ [Celebration]     │ [Compares to last best: 3,900]      │
│  Best! 4,100]    │                   │ [Updates local record]               │
│                  │ [Sees achievement]│ [Displays "+200 points from yesterday"]
│                  │      ↓            │                                      │
│ [Cosmetic Ad]    │ [Sees $0.99       │                                      │
│ "Blue Trail"     │  cosmetic offer]  │                                      │
│                  │  [Doesn't buy,    │ [Ad dismissed]                       │
│                  │   but considers]  │                                      │
│                  │      ↓            │                                      │
│                  │ [Taps Retry x4]   │ [4 more quick games]                │
│                  │                   │ [Play session: 12 minutes]           │
│                  │      ↓            │                                      │
│                  │ [Closes app]      │ [Session data saved locally]         │
│                  │                   │ [Leaderboard synced (next open)]    │
│                  │                   │                                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ ACTOR: Competitive Player (Month 3+)                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  App             │  Player           │  System                              │
│ ─────────────────┼───────────────────┼───────────────────────────────────  │
│                  │                   │                                      │
│ [Home]           │ [Opens immediately]                                      │
│ Rank: #3         │ (morning ritual)   │ [Load: rank #3, 12,847 pts]         │
│ Personal Best:   │                   │ [Leaderboard: top 10 visible]        │
│ 12,847           │      ↓            │                                      │
│                  │ [Checks rank]     │                                      │
│ Cosmetics owned: │                   │                                      │
│ Gold Ball        │ [Sees friend #1   │                                      │
│ Purple Glow      │  gained 500 pts]  │                                      │
│                  │      ↓            │                                      │
│ [Play x12]       │ [Competitive,     │                                      │
│                  │  plays intensely] │ [Each game: increased difficulty]    │
│                  │      ──────────────→ [Difficulty scaled to history]      │
│                  │                   │                                      │
│ [Revive Used]    │ [Uses 1 revive]   │ [Watched ad, +1 life]               │
│ Ads Watched:1/1  │ (optional)        │ [Daily revive limit reached]         │
│                  │      ──────────────→ [Revive system resets tomorrow 8am] │
│                  │                   │                                      │
│ Score trending:  │ [Plays final game]│ [High score: 13,247]                │
│ ↑ 400pts today   │      ↓            │                                      │
│                  │ [Exceeds goal,    │ [New Personal Best]                 │
│                  │  closes app]      │ [Local storage updated]              │
│                  │                   │                                      │
│                  │ [Considers]       │                                      │
│                  │ [Cosmetics popup] │ [Shows unlocked/purchasable skins]  │
│                  │ [Buys: "Neon"]    │ [Purchase: $0.99 → cosmetic unlocked]
│                  │      ──────────────→ [Ball now has neon glow]            │
│                  │                   │ [Change persists across games]       │
│                  │      ↓            │                                      │
│                  │ [Screenshot score]│                                      │
│                  │ [Shares Instagram]│ [External action]                    │
│                  │                   │                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Information Architecture

**Screen 1: Game Board**
- Ball (center, falls due to gravity)
- Obstacles (horizontal bars, random gaps, moving down at increasing speed)
- Score display (top left, large)
- Height/progress bar (right side, optional)

**Screen 2: Game Over**
- Final score (large, center)
- Personal best comparison ("Previous best: X")
- Buttons: [Retry] [Revive? Ad] [Home]
- Optional achievement badge if score milestone hit

**Screen 3: Home/Leaderboard**
- Tabs: [Play] [Leaderboard] [Cosmetics] [Settings]
- **Play tab:** Start game button, personal stats (best, games played, playtime)
- **Leaderboard tab:** Top 50 players, your rank, friend positions, weekly reset notice
- **Cosmetics tab:** Ball skins/trails (locked/unlocked), prices, preview on ball
- **Settings:** Sound on/off, graphics quality, delete save data

---

## 7. Feature Set (MVP)

### Core
- [x] One-tap gravity mechanic (rise on tap, fall constantly)
- [x] Obstacle generation (procedural, spacing decreases over time)
- [x] Collision detection
- [x] Score tracking (points per obstacle dodged)
- [x] Difficulty scaling (speed + spacing tighten over time)
- [x] Game over + restart
- [x] Leaderboard (local, top 50)
- [x] Personal best tracking

### Monetization
- [x] Cosmetic skins (3-5 ball designs at launch: gold, purple, neon, etc.)
- [x] Cosmetic trails (glow effects)
- [x] Optional ads for 1 revive per day (no paywall, purely optional)
- [x] No energy system (infinite plays)

### Offline
- [x] All game logic local
- [x] Leaderboard cached locally (synced next app open if online, but works offline)
- [x] Zero login required
- [x] No permissions requested

---

## 8. Monetization

**Free Tier (100% of players):**
- Unlimited plays
- Basic ball (white)
- Score tracking + leaderboard

**Cosmetics ($0.99 each):**
- Ball color skins (gold, neon, purple, glitch, hologram)
- Trail effects (glow, rainbow, smoke)
- 5-10 cosmetics at launch
- No gameplay advantage (purely visual)

**Optional Ads:**
- 1 free revive per day (no cost, no ad requirement)
- Optional: watch 15-sec ad for 1 bonus revive (daily limit: 2 total revives/day)
- No forced ads; game playable without ads

**Pricing Rationale:**
- Hypercasual monetization proven: cosmetics $0.99-$2.99, ads optional. [Medium confidence: commoditized market, differentiation via aesthetics]
- No energy/paywall = higher DAU + retention
- Optional ads = non-intrusive, respects player agency

---

## 9. Technical Stack

### Frontend
- Unity (C#) or React Native (for speed)
- Physics: simple gravity + collision (no complex engine)
- Graphics: minimal (circles, rectangles, retro aesthetic)

### Backend (Minimal)
- No backend for MVP
- Leaderboard: local JSON file (if online eventually, Firebase Realtime DB)
- Cosmetics: hardcoded in app

### Offline
- 100% local storage (no API calls)
- All game state saved to device

---

## 10. Success Metrics

### Activation
- 60%+ play first game on Day 1
- 40%+ return on Day 2

### Engagement
- 40%+ DAU (hypercasual baseline)
- Avg session: 8-12 minutes (multiple short games)
- 7-day retention: 30%+ (hypercasual typical: 15-25%)
- 30-day retention: 5-10%

### Monetization
- Cosmetic conversion: 2-5% (hypercasual cosmetics are premium)
- ARPU: $0.10-$0.25/month
- Ad impression rate: 20-40% (voluntary revives, low friction)

---

## 11. Go-to-Market

**Soft Launch (Week 3):**
- TestFlight: 50 hypercasual gamers
- Feedback: difficulty curve, cosmetic appeal

**Public Launch (Week 4):**
- App Store submission
- ProductHunt: "One-tap gravity game. How high can you go?"
- Twitter: gameplay GIF, high score screenshots
- TikTok: hypercasual gaming community

**Growth (Month 2+):**
- Leaderboard competition (friend challenges)
- Cosmetic seasonal updates (limited-time skins)
- Optional cross-promotion with similar hypercasual apps

---

## 12. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| **Market:** Hypercasual oversaturated (Flappy Bird clone perception) | Differentiation: elegant difficulty curve + aesthetic. Call out "graceful progression, not cheap difficulty spike." |
| **Retention:** 5% 30-day retention is low | Leaderboard competition drives retention. Seasonal cosmetics create return reasons. |
| **Monetization:** Low ARPU typical | Offset with volume (target 100K DAU × $0.15 ARPU = $15K/month). No paywalls = high volume. |
| **Tech:** Physics bugs (collision misalignment) | Use proven physics lib (not custom). Test on 100+ devices. |

---

## 13. Competitive Landscape

| Game | Year | Mechanic | WTP | Gap vs. Ascend |
|------|------|----------|-----|----------------|
| Flappy Bird | 2013 | Tap to flap, dodge pipes | Free (ads) | Static obstacles, no scaling |
| 2048 | 2014 | Swipe to merge tiles | Free (ads) | Puzzle, not action |
| Crossy Road | 2015 | Auto-run + swipe to dodge | Free + cosmetics | 3D, complexity |
| Piano Tiles | 2013 | Tap falling tiles | Free (ads) | Pattern-based, not freeform |
| **Ascend** | **2026** | **Tap to rise against gravity** | **Free + cosmetics** | **Elegant difficulty curve, daydream-compatible, offline-premium aesthetic** |

---

## 14. Success Story (Month 3)

**User:** Jordan, college student

**Week 1:** 
- Downloads after seeing ProductHunt post
- Plays 3 games (8 sec, 12 sec, 20 sec)
- Personal best: 1,800 points
- Uninstalls (tried, fine, moved on)

**Day 14 (friend plays, shows high score):**
- Reinstalls
- Sees friend is rank #15 (6,200 points)
- Jordan plays daily, competing informally

**Week 4 (Month 1):**
- Jordan rank #42 (4,100 points)
- Considers cosmetics, doesn't buy yet
- Plays 10 min/day during study breaks

**Week 8 (Month 2):**
- Rank #18 (8,900 points)
- Buys "Gold Ball" cosmetic ($0.99)
- Watches ad for extra revive 3x/week

**Week 12 (Month 3):**
- Rank #3 (12,847 points)
- Owns 3 cosmetics ($2.97 spent)
- Plays 25 min/day (habit, daydreaming ritual)
- Refers to 2 friends
- Spends on cosmetics regularly (seasonal drops)

---

## 15. Definitions

**Gravity Mechanic:** Ball naturally falls each frame. Tap = temporary upward velocity impulse.

**Obstacle Spacing:** Gap between top/bottom walls. Decreases over time, forcing precise tapping.

**Difficulty Scaling:** Both speed and spacing change over score thresholds. Non-linear progression (exponential at 1K+ points).

**Revive System:** 1 free revive/day (no cost, no ad). Optional: watch ad for bonus revive (capped at 2 total/day).

**Cosmetics:** Visual skins (ball colors, trails). Zero gameplay impact. Purely for identity/achievement flex.

---

**Document Version:** 1.0  
**Status:** Ready for Development
