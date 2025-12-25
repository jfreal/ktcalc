# Kill Team 2024 Weapon Rules

Weapon rules apply whenever a friendly operative uses a weapon that has them. Common weapon rules can be found below, and you may find rare weapon rules in your kill team's rules.

**General Rules:**
- Weapons gain no benefit from having the same weapon rule more than once, unless the weapon rule has an **x**, in which case select which x to use.
- If a friendly operative is using a weapon that has multiple weapon rules that would take effect at the same time, you can choose the order they take effect.

---

## Weapon Rules

### Accurate X
You can retain up to **x** attack dice as normal successes without rolling them.

**Special case:** If a weapon has more than one instance of Accurate x, you can treat it as one instance of **Accurate 2** instead (this takes precedence over x rules above).

---

### Balanced
You can re-roll **one** of your attack dice.

---

### Brutal
Your opponent can **only block with critical successes**.

---

### Ceaseless
You can re-roll any of your attack dice results of **one result** (e.g., results of 2).

---

### Devastating X
Each retained critical success **immediately inflicts x damage** on the operative this weapon is being used against, e.g., Devastating 3.

**Area effect:** If the rule starts with a distance (e.g., 1" Devastating x), inflict x damage on that operative and each other operative visible to and within that distance of it.

**Important:** The success isn't discarded after doing so—it can still be resolved later in the sequence.

---

### Heavy
An operative **cannot use this weapon** in an activation or counteraction in which it moved, and it **cannot move** in an activation or counteraction in which it used this weapon.

**Conditional Heavy:** If the rule is **Heavy (x only)**, where x is a move action, only that move is allowed, e.g., Heavy (Dash only).

**Note:** This weapon rule has no effect on preventing the Guard action.

---

### Lethal X+
Your successes equal to or greater than **x** are **critical successes**, e.g., Lethal 5+.

---

### Piercing X
The defender collects **x less defence dice**, e.g., Piercing 1.

**Conditional Piercing:** If the rule is **Piercing Crits x**, this only comes into effect if you retain any critical successes.

---

### Punishing
If you retain any critical successes, you can retain **one of your fails as a normal success** instead of discarding it.

---

### Relentless
You can re-roll **any** of your attack dice.

---

### Rending
If you retain any critical successes, you can retain **one of your normal successes as a critical success** instead.

---

### Saturate
The defender **cannot retain cover saves**.

---

### Severe
If you **don't retain any critical successes**, you can change **one of your normal successes to a critical success**.

**Important:** The Devastating and Piercing Crits weapon rules still take effect, but **Punishing and Rending don't**.

**Calculator implementation:** Severe is evaluated after Punishing, so Punishing only triggers from natural crits. Rending is explicitly blocked when Severe triggers.

---

### Shock
The first time you strike with a critical success in each sequence, also **discard one of your opponent's unresolved normal successes** (or a critical success if there are none).

---

## Quick Reference Table

| Weapon Rule | Effect Summary |
|-------------|----------------|
| **Accurate X** | Retain up to x dice as normal successes without rolling |
| **Balanced** | Re-roll 1 attack die |
| **Brutal** | Opponent can only block with crits |
| **Ceaseless** | Re-roll all dice of one result value |
| **Devastating X** | Each crit inflicts x damage immediately |
| **Heavy** | Cannot move and shoot with this weapon |
| **Lethal X+** | Successes ≥ x are critical |
| **Piercing X** | Defender gets x less defence dice |
| **Punishing** | If have crit, convert 1 fail to normal |
| **Relentless** | Re-roll any attack dice |
| **Rending** | If have crit, convert 1 normal to crit |
| **Saturate** | Defender cannot use cover saves |
| **Severe** | If no crits, convert 1 normal to crit |
| **Shock** | First crit strike cancels enemy success |

---

## Calculator Implementation Notes

### Reroll Targeting Strategy
All reroll abilities in this calculator **only target fails**, never norms or crits. This is optimal play because:
- Rerolling a fail can only improve (to norm/crit) or stay the same
- Rerolling a norm could get worse (to fail)
- Rerolling a crit could only get worse (to norm/fail)

### Combined Reroll Abilities
The calculator supports combined reroll abilities where multiple effects apply in sequence:

**RerollOnesPlusBalanced (BothOnesAndBalanced):**
- First reroll all 1s
- Then reroll one additional fail that wasn't a 1 (no double reroll)

**RerollMostCommonFailPlusBalanced (CeaselessPlusBalanced):**
- First reroll all dice showing the most common fail result (Ceaseless)
- Then reroll one additional fail that wasn't rerolled by Ceaseless (no double reroll)
- If Ceaseless rerolled all fails, Balanced has nothing to target

### No Double Reroll Rule
A die cannot be rerolled twice in the same action. When combining reroll abilities:
- Track which dice were rerolled by the first ability
- The second ability can only target dice that weren't already rerolled
- `availFails = originalFails - firstRerollCount`

### Expected Ability Ordering (by effectiveness)
For a given scenario, reroll abilities should generally produce results in this order:
- CeaselessPlusBalanced ≥ Ceaseless
- CeaselessPlusBalanced ≥ OnesPlusBalanced
- CeaselessPlusBalanced ≥ Balanced
- Ceaseless ≥ RerollOnes (Ceaseless can reroll more dice)
- Relentless ≥ all other rerolls (rerolls ALL fails)

---

## Recent Improvements (December 2024)

### CeaselessPlusBalanced Implementation
- **Added** new combined reroll ability: `RerollMostCommonFailPlusBalanced`
- **Fixed** dice eligibility tracking: Balanced can only target fails that weren't rerolled by Ceaseless
- **Fixed** optimal targeting: all rerolls only target fails (never norms or crits)
- **File:** `CalcEngineCommon.ts` - `calcFinalDiceProbRerollMostCommonFailPlusBalanced()`

### Severe Rule Fix
- **Fixed** Punishing (FailToNormIfCrit) no longer triggers from Severe-created crits
- **Fixed** Rending no longer triggers from Severe-created crits
- **Added** `severeTriggered` flag to track when Severe creates a crit
- **Preserved** Devastating X and Piercing Crits X still work with Severe
- **File:** `CalcEngineCommon.ts` lines 177-198

### Reroll Targeting Strategy
- **Clarified** all reroll abilities only target fails (optimal play)
- **Rationale:** Rerolling fails can only improve; rerolling norms/crits can get worse
- **Applied to:** Balanced, Ceaseless, Relentless, CeaselessPlusBalanced, OnesPlusBalanced

### No Double Reroll Rule
- **Documented** dice cannot be rerolled twice in same action
- **Implementation:** Track `availFails = originalFails - firstRerollCount`
- **Affects:** CeaselessPlusBalanced, OnesPlusBalanced

---

*Last updated: December 2024*
