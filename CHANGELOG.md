# Changelog

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
