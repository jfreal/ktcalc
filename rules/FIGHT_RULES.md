# Kill Team 2024 Fight (Melee) Resolution

This document describes how the calculator resolves a **fight** (close combat), so the
results can be checked by hand. It covers the alternating strike/parry sequence, the rules
for what a parry can cancel, and the decision logic the engine uses to choose between
striking and parrying. Worked scenarios at the end can be verified step by step.

The behavior described here lives in:
- [`src/CalcEngineFightInternal.ts`](../src/CalcEngineFightInternal.ts) — turn loop and decision logic
- [`src/FighterState.ts`](../src/FighterState.ts) — per-fighter state, strike order, damage
- [`src/FightStrategy.ts`](../src/FightStrategy.ts) — the four strategies

> The fight engine is **Monte Carlo**: each fighter's attack dice are rolled many times and
> the resolution below is run per simulation. The rules in this doc describe a single
> resolution (one set of rolled dice); the calculator's output is the distribution over
> many such resolutions.

---

## Dice

After rolling and retaining, each fighter holds some number of:
- **Crits** — critical successes
- **Norms** — normal successes

Each fighter has a `normDmg` and `critDmg` (default 3 and 4).

---

## Turn structure

Both fighters reveal their retained dice. Then they **alternate**, resolving **one die per
turn**, starting with the first fighter. On its turn a fighter either:

- **Strikes** — spends one success to deal damage to the enemy, or
- **Parries** — spends one success to cancel one (or more) of the enemy's unresolved successes.

The loop continues while either fighter still has successes and both are alive
(`resolveFight`). A fighter with no successes simply passes its turn; the other keeps
resolving its remaining dice.

Some abilities act **before** the alternation begins (e.g. **Duelist** forces one free parry
up front — see `handleDuelist`).

---

## What a parry can cancel

This is the heart of the order-of-operations questions.

| Parry die | Can cancel |
|-----------|-----------|
| **Normal parry** | one enemy **normal** success only |
| **Crit parry**   | one enemy **crit**, or if none, one enemy **normal** |

Key consequence: **a normal success cannot parry a crit.** If your only remaining die is a
crit and the enemy holds only normals, the enemy cannot parry it.

Modifiers:
- **Storm Shield** — each parry cancels **2** successes instead of 1 (`cancelsPerParry()`).
- **Dueller** — a crit parry cancels one enemy crit **and** one enemy normal (or two normals).
- **Brutal** (on the enemy weapon) — the enemy's normal successes **cannot be parried at all**;
  only a crit parry can cancel them, and norm-vs-norm parry is disallowed.

---

## Strike order: crit-first, except to deny a normal parry

When a fighter decides to **strike**, the **default** is to spend a **crit first** if it has
one, otherwise a normal (`FighterState.nextStrike`). Striking crit-first front-loads your
biggest die, which matters when you might not survive to spend every success.

There is one exception, handled by `preferredStrikeChoice`. When you hold **both** a crit and a
norm **and the enemy has no crits**, the enemy can only parry your **normal** (a normal parry
can't touch a crit). Striking the **norm first** forces it through before the enemy can parry
it, while your crit stays unparryable — both land. Striking crit-first instead would leave a
lone normal sitting for the enemy to parry away.

Norm-first is *not* always better, though: against a **striking** enemy in a death-race you may
die before spending your crit, so front-loading it (crit-first) deals more. The engine
therefore **simulates both orders** against the enemy's actual strategy and keeps the one that
better serves the chooser's goal (less enemy health for Strike / Max Dmg, more of your own for
Min Dmg), defaulting to crit-first on a tie.

---

## Decision logic (strike vs parry)

On each turn, `calcDieChoice` decides in this order. The first rule that applies wins:

1. **Enemy has no successes** → **strike** (a parry would cancel nothing).
2. **Lethal strike** → **strike** if this strike's damage would kill the enemy outright.
   Also forced to strike if the enemy weapon is **Brutal** and you have no crits (your
   normals can't parry it, so they may as well strike).
3. **Shock strike** → if you have **Shock**, haven't crit-struck yet, have a crit, and the
   enemy has **no crits**, you must **strike** now (Shock cancels an enemy normal as a side
   effect). The die order follows the strategy rule below: for a mixed crit+norm hand under
   Strike / Max Dmg / Min Dmg, `preferredStrikeChoice` may still strike norm-first; otherwise
   the shocking crit lands immediately.
4. **Awesome parry** → if you can parry the enemy's **last** success and still kill the enemy
   with what remains, **parry** (`calcParryForLastEnemySuccessThenKillEnemy`).
5. **By strategy**:
   - **Strike** → always strike; the die order is chosen by `preferredStrikeChoice` (see below).
   - **Parry** → `wiseParry`: crit-parry an enemy crit if possible; else norm-parry an enemy
     normal; else crit-parry an enemy normal; else (only norms left vs enemy crits/Brutal) strike.
   - **Max Dmg To Enemy** / **Min Dmg To Self** → simulate **strike-all** vs **parry-all** from
     this point (clone both fighters, resolve to the end each way) and pick whichever leaves the
     enemy lower (Max Dmg) or yourself higher (Min Dmg).

Whenever a rule above resolves to **strike** under the **Strike**, **Max Dmg**, or **Min Dmg**
strategies, the actual die is chosen by `preferredStrikeChoice` (crit-first by default,
norm-first to deny a normal parry or to feed an enemy's first-strike negation — see
[Strike order](#strike-order-crit-first-except-to-deny-a-normal-parry)). The one exception is the
**lethal-strike** rule (#2), which always strikes crit-first to land the killing blow.

---

## Worked scenarios

Defaults unless noted: `normDmg = 3`, `critDmg = 4`, no special abilities, plenty of wounds on
both sides (so no lethal-strike shortcut), `cancelsPerParry = 1`.

### Scenario A — normal parry cannot touch a crit

- **Attacker** `{1 crit, 1 norm}`, strategy **Max Dmg To Enemy**, goes first.
- **Defender** `{2 norms, 0 crits}`, strategy **Parry**.

The engine strikes **norm-first** here (the defender holds no crits, so it can only parry a
normal):

1. Attacker norm-strikes → **3 dmg** to defender. Attacker holds `{1 crit}`.
2. Defender cannot parry a crit with a normal, so it strikes → 3 dmg to attacker. Defender holds `{1 norm}`.
3. Attacker crit-strikes → **4 dmg** to defender.
4. Defender strikes its last norm → 3 dmg to attacker.

**Attacker deals 7.**

Had the attacker struck **crit-first** instead (the wrong line here):

1. Attacker crit-strikes → 4 dmg to defender. Attacker holds `{1 norm}`.
2. Defender norm-parries the attacker's remaining norm → attacker holds `{}`.
3. Attacker passes; defender strikes its remaining norm.

**Attacker would deal only 4.** The difference (7 vs 4) is the parry-denial line: striking your
normals first forces them through *before* the enemy can parry them, and the enemy's normals can
never parry your crit.

### Scenario B — striking first to deny a parry, then still landing the crit

Same as Scenario A but stated as a principle: when the **enemy holds only normals**, every
normal you strike is one fewer normal the enemy can parry, and your crits are unparryable.
Resolving your normals before your crit therefore maximizes damage pushed through a
parrying defender.

### Scenario C — when order does **not** matter

- **Attacker** `{1 crit, 1 norm}` vs **Defender** `{2 norms}`, but defender strategy is **Max Dmg To Enemy**.

In *this* scenario the Max-Dmg defender gains nothing by parrying — it survives either way and
a parry deals no damage to the attacker — so it just strikes both norms. Both attacker dice land
regardless of order, so crit-first vs norm-first give the **same** total. Order only matters
when the defender *would* parry away one of the attacker's normals.

(Note: **Max Dmg To Enemy** does not parry *never* — it parries when that raises its own total
damage, e.g. to survive and land more strikes; see the `calcDieChoice` decision logic. It just
has no reason to here.)

---

## Edge case: norm-first to deny a normal parry (modeled)

This was previously a gap — the engine always struck crit-first — and is now handled by
`preferredStrikeChoice`. When:

- the attacker holds a **mix of crits and norms**, and
- the defender is **parrying with normals only** (no crits to parry your crit),

striking norm-first pushes more damage than crit-first (Scenario A). The engine detects this
shape and chooses the order by **simulating both lines** against the enemy's actual strategy, so
it picks norm-first only when it genuinely deals more — and stays crit-first in a death-race,
where front-loading the bigger die wins (Scenario C-adjacent: the enemy is *striking*, not
parrying). Because the decision runs through the real resolution path, first-strike effects
(Hammerhand's +1, Just a Scratch, Durable, Murderous Entrance) are accounted for automatically.

Regression coverage lives in `CalcEngineFight.test.ts` under
*"calcDieChoice, norm-first to deny a normal parry"*.

---

*Last updated: June 2026*
