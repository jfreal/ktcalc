# Fighting calculator

Observable end state: after switching to Fight, the `h1` is `Kill Team 2024 Fight Calculator`, the Results panel shows `FighterA` and `FighterB`, and each side shows `DeathChance:` and `AvgRemainingWounds:`. Pressing `+` on Fighter A's Attacks select changes Fighter A's `AvgRemainingWounds` (or `AvgDmg`) text. Fighter B's attacks select stays where it was.

## Sub-features

- Fighter A and Fighter B panels (WS, Attacks, Wounds, damage, weapon-rule checkboxes, Advanced).
- Fight Options panel: `Fighter A Strategy`, `Fighter B Strategy`, `Attacker/FirstActer` (`A` or `B`), and `Rounds`.
- Results panel with per-fighter death chance, average remaining wounds, and average damage.

## How to get to it (user POV)

From any calculator view, press the header button `aria-label` `Kill Team Fight Calculator` (visible label `Fight`). The address becomes `/?view=fight` and keeps any other query keys already present. The Shoot button becomes enabled; the Fight button becomes disabled.

## Driving it with the browser helper

There is no separate fight script. Use the same Chrome session pattern as `drive-shoot.mjs` (doctor first, fresh profile, click real controls) and do this:

1. Click `button[aria-label="Kill Team Fight Calculator"]`.
2. Wait until `h1` text is `Kill Team 2024 Fight Calculator` and the Fight button is `disabled`.
3. Scope to the visible panel whose title span is `Fighter A`. Ignore hidden Shoot selects.
4. Read `select#Attacks` in that panel and the `AvgRemainingWounds:` value in the Results panel under the `FighterA` heading.
5. Click the `+` button that is the next sibling of Fighter A's Attacks select.
6. Fighter A's Attacks value changed, and the `AvgRemainingWounds:` number for FighterA changed. Fighter B's Attacks select is unchanged.

The results block is the panel titled `Results`. `FighterA` and `FighterB` are plain text rows, not headings.

## Gotchas

- Fight Attacks selects share `id="Attacks"` with both shoot situations, which are still in the DOM and hidden. A document-wide query returns the hidden shoot control and the click appears to do nothing.
- `id="Rounds"` also exists on each shoot situation (`ShootOptionControls`) and on Fight Options. Scope to the panel titled `Fight Options` for the fight round count.
- Fight results are Monte Carlo inside the page. Read the text the Results panel actually rendered; do not recompute in the console and call that the check.
- The header Fight button merges `view=fight` into the current query string. A shoot share URL can therefore sit on the fight view. Judge the view by the `h1` and the disabled header button, not only by the presence of `a1=`.
