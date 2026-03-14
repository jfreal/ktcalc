# Changelog

## March 2026 - KT2024 Fight UI Cleanup

- Renamed Stun2021 to Shock (same effect: first crit strike discards 1 opponent norm; APL decrement removed)
- Removed AutoCrits from fight UI (no longer in KT2024 fight rules; replaced by Severe)
- Converted all boolean ability dropdowns (X/✔) to checkboxes for cleaner UI
- Fixed unused variable lint errors (fromNumericKey, rollD6, classifyDie)

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
