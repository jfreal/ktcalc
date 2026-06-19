# Product

## Register

product

## Users

Kill Team 2024 players. Two main contexts:

- **List-building / planning** at a desk — comparing weapon profiles against a range of
  defensive profiles, often building a mental (or literal) matrix of "what kills what".
- **Mid-game reference** — quickly checking the odds of a shoot or fight action before
  committing to it.

Job to be done: get fast, trustworthy probability math for shooting and fighting attacks
(including weapon abilities and defender profiles) without doing it by hand. The original
motivating case was Vespid weapon math and a matrix to compare situations across different
defensive profiles.

## Product Purpose

ktcalc analyzes shooting and fighting attacks in Kill Team 2024 and reports the probability
of outcomes. It exists because the dice math (hits, crits, saves, FNP, weapon abilities,
parry/retaliation interactions) is tedious and error-prone by hand, and existing tools
didn't cover the edge cases or comparison views this audience needs. Success = a player
trusts the numbers, finds the relevant knobs fast, and can compare scenarios side by side.
The author keeps it current through the edition and adds features as requested.

## Brand Personality

Precise and utilitarian. Three words: **exact, fast, dense**. The interface earns trust
through accuracy and legibility, not decoration — it should read like a sharp, well-built
spreadsheet for a numbers-literate hobbyist, not a consumer app. Tabletop subject matter is
present but understated; the math is the star. Voice is plain and direct (labels, hovertext,
notes), never cute.

## Anti-references

- **Generic SaaS dashboard.** No gradient cards, no hero-metric tiles, no rounded-everything
  startup look. This is a calculator, not a product landing page.
- Avoid anything that buries the numbers under chrome, marketing affordances, or visual
  filler. Density and clarity beat polish-for-its-own-sake.

## Design Principles

- **Numbers first.** The probabilities and comparisons are the product; everything else is
  there to make them faster to reach and easier to trust.
- **Density without clutter.** A power user wants a lot on screen at once. Earn that with
  alignment, rhythm, and legible type — not by hiding things behind clicks.
- **Trust through legibility.** If a value is hard to read or a control is ambiguous, the
  whole tool's credibility drops. Contrast and labeling are correctness features here.
- **Respect the knobs.** Weapon abilities and defender options are the real complexity; the
  UI should make the relevant ones obvious and the irrelevant ones quiet.
- **Stay current, stay shareable.** Scenarios are meant to be tweaked and shared (URL state);
  the design should keep state visible and reproducible.

## Accessibility & Inclusion

Best-effort. Aim for WCAG AA contrast on body text and controls and reasonable keyboard
support; fix issues as they're found rather than over-constraining the design. Don't ship
text that's hard to read on its background — legibility is core to this tool, not an add-on.
