# Changelog

## June 2026 - Mystic Scry Buff Attack Ability

- Added **Mystic Scry Buff** as an advanced attacker/fighter option on both the Shoot and Fight calculators.
- Rule: in the Roll Attack Dice step, retain one of your fails as a normal success, OR one of your normal successes as a critical success. Attack only. In-game: the "Mystic Scry" ability.
- Choice rule: for each roll the calculator resolves both options (fail→norm and norm→crit) through the remaining post-roll steps — notably Rending — and keeps whichever produces the most damage. This captures the Rending interactions a fixed rule gets wrong: seeding the first crit so Rending can fire (`{0c,2n}` → `{2c,0n}`), and adding a norm so Rending still has one to promote (`{1c,1n,1f}` → `{2c,1n}`) rather than spending the buff on a crit Rending can't build on. Falls back to whichever single option a roll makes available.
- Wired through the shared `applyPostRollModifications` (so both the exact Shoot engine and the Monte Carlo Fight engine honor it) by passing the attacker's `normDmg` and `critDmg + Devastating` so the choice is damage-driven.
- Limitation: the choice does not weigh defender saves or Piercing (Px), matching the attack-only, damage-first heuristics used elsewhere in the engine.
- Mystic Scry Buff is part of shareable URL state for both attackers and fighters; older share links (without the field) decode as off.
- Listed Mystic Scry Buff in the in-app Notes panels on both the Shoot and Fight calculators.
- Added a `/notes/mystic-scry-buff` explainer page (linked from the footer) walking through the choice math and the Rending interaction — why seeding a crit (when you have none) and feeding Rending a norm (when you already have a crit) are opposite-but-correct picks with the same weapon.
- Added unit tests covering both preferences, the availability fallbacks, and the damage-tie break toward the crit.

## June 2026 - Saintly Relics Defensive Ability

- Added Saintly Relics as an advanced defender/fighter option on both the Shoot and Fight calculators, with two modes: **1D6** (normal) and **2D6** (the operative is INSPIRING).
- Rule: whenever an attack dice would inflict damage, roll the relic dice; if any result is a 6, ignore all of that attack dice's damage. At most one attack dice is ignored per action.
- Caps: at most one attack dice ignored per action and two per battle. The Shoot engine enforces the per-battle cap exactly across multiple Rounds (a capped convolution that tracks ignores spent), instead of letting every round ignore independently.
- Targeting: both engines aim the ignore at the highest-damage hit (crits before norms). Shoot computes this exactly; Fight spends the ignore on a strike only when no larger strike is still pending from that attacker.
- Feel No Pain: composes with relics, and a crit's un-ignorable MWx residual still gets its FNP roll.
- Limitation (in the in-app note and `rules/COMBAT_RULES.md`): mortal (MWx) damage is never ignored, matching Just a Scratch.
- Relics mode is part of shareable URL state for both defenders and fighters; older share links (without the field) decode as "off".
- Added unit tests for the exact per-scenario relic expansion and the shoot distribution, plus a Monte Carlo fight test confirming more relic dice leave the holder with more expected wounds.

## June 2026 - Unified Visual System + Side-by-Side Situations

- Introduced a single container vocabulary: a `Panel` component (dark title bar over a bordered body) now wraps every section across the Shoot and Fight calculators, replacing the previous mix of Bootstrap `.border rounded` boxes, the comparison matrix's local card, and the footer's gradient card.
- Removed the thick colored `border-left` "side-stripe" accents from the comparison matrix cards (kept the 2px internal save-group dividers, which are legitimate table rules).
- Centralized colors in `src/theme.ts`. Muted text tokens now meet WCAG AA contrast; the failing `#999` cells (~2.8:1 on white) were replaced with an AA-compliant tone.
- Retoned the footer "Alternative Tools" block from a cream/gold gradient card to the app's dark panel style.
- Made the layout responsive: Situation 1/2 (and Fighter A/B) sit side by side on desktop (≥992px) and stack on narrower screens; wide tables scroll instead of clipping. Replaced the fixed `fit-content` containers with fluid, capped-width centered containers.
- Added `PRODUCT.md` capturing the product register, users, brand personality, and design principles that guided this pass.

## June 2026 - Feel No Pain Threshold Options on Shooting Defense

- Limited the shooting Defender's Feel No Pain (FNP) threshold options to 4+, 5+, and 6+ (plus off); previously 2+ and 3+ were also selectable.
- Clarified FNP behavior in the in-app note: just before damage is resolved, roll one die per surviving hit; each roll at or above the threshold reduces that hit's damage by 1 (minimum 0). Even MWx damage can be prevented.
- Documented FNP in `rules/COMBAT_RULES.md` under Defender Abilities and in the attack sequence.

## May 2026 - Px-branch Defender Fixes + Lethal/Relentless Explainer

- Fixed: when attacker Piercing Crits (Px) is greater than Piercing (APx) and the attacker rolls at least one crit, the defender's reduced-dice save roll was silently dropping `defender.abilities` (including Indomitus), dropping `defender.normsToCrits`, and mis-routing `defender.normsToCrits` into the `failsToNorms` positional slot of the dice-prob calculation. All defender parameters now propagate correctly into the Px branch.
- Fixed: `ObscuredTarget` (a defender-side flag that modifies the *attacker's* dice) was leaking into the defender's own save-dice calculation, where the shared post-roll modification function would discard save successes. ObscuredTarget is now stripped from the ability set used for defender saves in both Px and non-Px branches.
- Clarified the Indomitus and PuritySeal tooltips/comments: the strict KT2024 rule requires two unmodified 1s, but the calculator triggers on any 2 failed dice. The benefit is slightly overstated on rolls where fails include non-1 values (e.g. 2s on a 3+ stat).
- Added a `/notes/lethal-relentless` page (linked from the footer) walking through why kill chance can rise as BS gets worse with Lethal + Relentless. Covers the per-die crit-probability math, the kill-tail vs average-damage distinction, the Indomitus amplification (with caveats for setups with more defender dice or cover saves), and the BS 6+ crit-clamp edge case.
- Added `public/_redirects` so direct visits and refreshes of `/notes/lethal-relentless` (and any future client-side route) resolve to `index.html` instead of 404 on Netlify.
- Added regression tests for the Px-branch defender save path: one for `failsToNorms` propagation, one for ObscuredTarget no-bleed.

## March 2026 - KT2024 Fight UI Cleanup

- Renamed Stun2021 to Shock (same effect: first crit strike discards 1 opponent norm; APL decrement removed)
- Removed AutoCrits from fight UI (no longer in KT2024 fight rules; replaced by Severe)
- Converted all boolean ability dropdowns (X/✔) to checkboxes for cleaner UI
- Fixed unused variable lint errors (fromNumericKey, rollD6, classifyDie)
- Feel No Pain now rolls once per surviving hit (reduces that hit's damage by 1) instead of once per damage point. Damage distributions for FNP defenders will shift accordingly.

## March 2026 - Fight Defensive Abilities

- Added Feel No Pain (FNP) to fight calculator: for each point of damage from a strike, roll a die; on a result >= the FNP threshold, that damage is prevented. Options: 4+, 5+, 6+
- Added Half Damage First Strike: first strike damage against the defender is halved (rounded up) to a minimum of 2. JustAScratch takes priority; Hammerhand bonus applies before halving

## February 2026 - Defender Abilities Update

- Moved Obscured checkbox to Defender section (was in Attacker advanced params)
- Moved Just a Scratch (JaS) checkboxes to Defender section (was in advanced params)
- Added JaS (Normals): cancels one normal hit only (cannot ignore crits)
- Renamed to JaS (Crits) and JaS (Normals) with updated tooltips
- Obscured now correctly reads from defender model in calculations
- Removed Durable2021 from defender advanced params
- Adjusted Defender panel width to 150px

## January 2026 - Rending + Accurate Fix

- Fixed: Rending cannot upgrade normals retained from Accurate (only rolled normals can be upgraded)

## December 2025 - UI Improvements

- Limited Accurate to max of 3 (matching game rules)
- Limited Cover Saves (normal and crit) to max of 3 (matching defense dice count)
- Kill chance tables now truncate when all scenarios reach 0%, showing summary row for remaining wounds
- Added GitHub link footer with open source contribution message

## December 2025 - CeaselessPlusBalanced & Severe Rule Fixes

- Added CeaselessPlusBalanced: combined reroll that applies Ceaseless first, then Balanced on an unrerolled fail
- Fixed: Balanced can only target fails that weren't rerolled by Ceaseless (no double reroll rule)
- Fixed: All rerolls only target fails (optimal play - rerolling norms/crits can make results worse)
- Fixed: Severe rule now correctly blocks Punishing and Rending (Devastating and Piercing Crits still work)
- Moved Punishing from Advanced controls to main checkbox for easier access
- Removed EliteModerate2021 and EliteExtreme2021 (Kasrkin Elite points no longer relevant)
- Added Scenario Comparison Matrix: compare S1 vs S2 average damage and kill chances across all saves and wounds
- Added URL sharing: share calculator configurations via URL parameters
- Added S1&S2 Combo results table
- Fixed injury calculation (damage > half wounds)

## December 2025 - Kill Team 2024 Edition Updates

- Defense dice fixed at 3 for all operatives
- Removed invulnerable saves (not in KT2024)
- Added Ceaseless reroll ability (reroll all dice of one result)
- Updated Punishing rule implementation

## November 2025 - Initial KT2024 Support

- Updated calculator for Kill Team 2024 rules
- Added new weapon rules: Severe, Punishing, Shock
- Updated combat resolution sequence
