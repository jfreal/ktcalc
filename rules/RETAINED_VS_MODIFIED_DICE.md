# Retained vs Modified Dice

Some Kill Team rules turn a normal success into a critical success. Some do not work on every
normal success you are holding. Which ones depend on a single line of wording, and it is easy to
miss at the table.

This page explains the rule, sorts every effect the calculator supports into the two camps, and
shows exactly what the engine does with each.

---

## The rule

**A dice can only be retained once.**

When you retain a dice, you are declaring what it is — "this is a normal success" — and putting it
down. That declaration is spent. A later rule that asks you to **retain that dice again**, as
something better, has nothing left to work with. The dice is already locked in.

A rule that instead asks you to **change** a success you are already holding is doing something
different, and it works fine on a dice that has been retained.

So the wording is the whole rule:

| Wording | Example | Can it act on an already-retained dice? |
|---|---|---|
| "**retain** one of your normal successes as a critical success **instead**" | Rending | **No** |
| "**change** one of your normal successes to a critical success" | Severe | **Yes** |

The clearest case is a **cover save**. You retain it as a normal success without ever rolling that
dice. It is retained, immediately and permanently. A rule offering to retain a normal save as a
critical save instead cannot touch it — there is no un-retained dice there to retain.

---

## Which effects lock a dice

These produce a normal success that has **already been retained**. Nothing worded as a retention
can promote them afterwards.

| Effect | Wording | Where |
|---|---|---|
| **Cover saves** | Retained as a normal success without rolling | Defence |
| **Accurate X** | "Retain up to x attack dice as normal successes without rolling them" | Attack |
| **Punishing** | "You can **retain** one of your fails as a normal success instead of discarding it" | Attack |

Cover and Accurate are obvious — the dice was never rolled. Punishing is the one people miss: it
rescues a fail by *retaining* it, so that dice has now been retained once and is closed to further
retention.

---

## Which effects can act on a locked dice

These **change or promote** a success rather than retaining one, so an already-retained dice is a
legal target.

| Effect | Wording | Where |
|---|---|---|
| **Severe** | "**Change** one of your normal successes to a critical success" | Attack |
| **Waaagh!** (KT2021 Kommandos ploy) | "**Promote** a norm to a crit" | Attack |
| **FailsToNorms** (calculator input) | "Modified to normal successes" | Both |

---

## Which effects are blocked by a locked dice

These are the retention-worded promotions. In the calculator they draw **only** from normal
successes that came off the dice.

| Effect | Where |
|---|---|
| **Rending** | Attack |
| **NormsToCrits** (calculator input) | Both — this is the one that hits cover saves on defence |
| **Mystic Scry**, norm→crit half | Attack |

---

## How the calculator models it

The engine keeps a count of how many of your normal successes are already retained, alongside the
normal successes themselves. Every retention-worded promotion is offered only
`norms − retainedNorms` as legal targets. Everything lives in one shared step
(`applyPostRollModifications`), so the exact Shoot calculator and the Monte Carlo Fight calculator
behave identically here.

One refinement worth knowing about: when a **change**-worded effect (Severe, Waaagh) consumes a
normal success, the engine deliberately spends a **retained** one first. This is never worse for
you and is sometimes better, because it leaves your rolled dice available for any retention-worded
promotion that comes afterwards. It is not extra generosity — it is what a player who understood
the interaction would do.

---

## Worked examples

**Cover save vs NormsToCrits.** You are in cover (1 automatic normal save) and have a rule letting
you retain a normal save as a critical save. One critical hit is coming in.

- The cover save is retained. It cannot be promoted.
- You are holding 1 normal save. A single normal save cannot cancel a critical hit (that takes two).
- **Result: the hit goes through.**

**Rolled save vs NormsToCrits.** Same rule, but the normal save came off a die you actually rolled.

- The save is promotable. It becomes a critical save.
- A critical save cancels a critical hit.
- **Result: the hit is cancelled.**

**Both at once.** One cover save, one rolled normal save, one promotion available. The promotion
goes to the rolled save — it is the only legal target. You end up holding 1 critical save and 1
normal save.

**Punishing then Rending.** You retain 1 critical hit and 1 fail.

- Punishing retains the fail as a normal hit. That dice has now been retained.
- Rending asks to retain a normal hit as a critical instead — but the only normal hit you have is
  the Punishing one, already retained.
- **Result: 1 critical + 1 normal.** Not 2 criticals.

**Severe ordering.** You have 1 rolled normal success and 1 Accurate normal success, plus Severe
and one NormsToCrits promotion, and no criticals.

- Severe changes the **Accurate** success to a critical (change-worded, so it may).
- That leaves the rolled success free for the NormsToCrits retention.
- **Result: 2 criticals.** Had Severe taken the rolled success instead, the Accurate one would be
  unpromotable and you would end at 1 critical + 1 normal.

---

## Known modelling limitations

**Punishing is always taken.** In the rules Punishing is optional ("you *can* retain"), but the
calculator applies it whenever it triggers. That is normally free, since a rescued fail is pure
upside — but it is not free when another effect wants the same fail and would have produced a
*promotable* norm from it. With 1 critical hit and 1 fail, Rending, and FailsToNorms 1:

- **Punishing off:** FailsToNorms converts the fail to a promotable norm, Rending promotes it →
  **2 criticals** (8 damage at 3/4).
- **Punishing on:** Punishing takes the fail first and produces a locked norm, leaving FailsToNorms
  nothing and Rending no legal target → **1 critical + 1 normal** (7 damage).

So in that narrow combination, switching Punishing on lowers the reported damage, where a player
would simply decline it. Mystic Scry already models this kind of decision by scoring a "decline"
option; Punishing does not yet.

**FailsToNorms is treated as a change, not a retention.** The generic input is worded as a
modification, so the norms it produces stay promotable. If your rule is worded "retain one of your
fails as a normal success", the resulting dice should be locked instead. **Punishing** is the
locked-and-modelled version, but note it is conditional: it only triggers when you have at least
one critical success, and it is switched off entirely by an Obscured target. An *unconditional*
retention-worded fail rescue therefore has no exact representation right now — FailsToNorms will
slightly overstate it on rolls where the resulting norm goes on to be promoted.

---

## Quick reference

| Calculator input / ability | Produces a locked dice? | Blocked by a locked dice? |
|---|---|---|
| Cover Saves | Yes | — |
| Accurate (AutoNorms) | Yes | — |
| AutoCrits | n/a (already critical) | — |
| Punishing | Yes | — |
| FailsToNorms | No | — |
| NormsToCrits | — | Yes |
| Rending | — | Yes |
| Mystic Scry (norm→crit half) | — | Yes |
| Mystic Scry (fail→norm half) | Yes | — |
| Severe | — | No |
| Waaagh! (KT2021) | — | No |
