export default class Note {
  public name: string;
  public description?: string;

  public constructor(name: string, description?: string) {
    this.name = name;
    this.description = description;
  }
}

export const Reroll = new Note(
  `Reroll`,
  `Balanced rerolls 1 die.  Relentless rerolls fails.`
    + `  Ceasless rerolls most common fail result (ex: reroll 2s); it's called "ceaseless" in KT2024.`
    + `  CritFishRelentless rerolls non-crits.`
    + `  DoubleBalanced rerolls 2 dice.`
    + `  Ones rerolls 1s ("ceaseless" in KT2021).`
    + `  BothOnesAndBalanced rerolls 1s and then rerolls 1 die that hasn't already been rerolled.`
    ,
);
export const NoCover = new Note(
  `NoCover`,
  `Defender can not use cover saves. Intercession Squad's Accurate chapter tactic triggers this only if a crit hit is retained.`,
);
export const ObscuredTarget = new Note(
  `ObscuredTarget`,
  `Attacker crits are retained as norms.  No crit-triggered abilities can trigger.  Discard an attacker success.`,
);
export const AutoNorms = new Note(
  `Accurate`,
  `How many attack dice can be automatically retained as a normal success. Much like cover saves but for attack dice.`,
);
export const AutoCrits = new Note(
  `AutoCrits`,
  `How many attack dice can be automatically retained as a crit success. Much like cover saves but for attack dice.`,
);
export const FailsToNorms = new Note(
  `FailsToNorms`,
  `How many fails can be modified to normal successes.`,
);
export const NormsToCrits = new Note(
  `NormsToCrits`,
  `How many normal successes can be modified to critical successes.`,
);
export const CloseAssault2021 = new Note(
  `CloseAssault2021`,
  `If you have two or more sucesses, promote a fail to a normal success.  Imperial Navy Breachers strategic ploy.`,
);
export const Waaagh2021 = new Note(
  `Waaagh2021`,
  `If you have two or more normal sucesses, promote a norm to a crit.  Kommandos strategic ploy.`,
);
export const Rending = new Note(
  `Rending`,
  `If you have >=1 crit, you can modify a norm to a crit.`,
);
export const Severe = new Note(
  `Severe`,
  `If you have no crits, you can modify a norm to a crit. Devastating and Piercing Crits still work, but Punishing and Rending don't.`,
);
export const Punishing = new Note(
  `Punishing`,
  `Modify a failed hit into a normal hit if you had at least one critical hit; Necron equipment Starfire Core, Kommando strategic ploy "Dakka! Dakka! Dakka!", Hive Fleet equipment Toxin Sacs, Corsair Voidscarred strategic ploy Outcasts.`,
);
export const CoverNormSaves = new Note(
  `Cover Saves`,
  `How many saves can be automatically retained as a normal success.`,
);
export const CoverCritSaves = new Note(
  `CoverCritSaves`,
  `How many saves can be automatically retained as a critical success. High enough APx/Px can limit these auto-saves.`,
);
export const JustAScratch2021 = new Note(
  `JaS (Crits)`,
  `Just a Scratch (JaS): Ignore damage from one attack die, preferring crits.`,
);
export const JustAScratchNorms = new Note(
  `JaS (Normals)`,
  `Just a Scratch (JaS): Ignore damage from one normal hit only (cannot ignore crits).`,
);
export const PuritySeal = new Note(
  `PuritySeal`,
  `If at least 2 dice fail, discard one fail and change another fail to a normal success; attack only. ` +
  `Note: KT2024 rule strictly requires two unmodified 1s; this calculator triggers on any 2 failed dice, ` +
  `so the benefit is slightly overstated on rolls where fails include non-1 values (e.g. 2s on a 3+ stat).`,
);
export const UpgradeBuff = new Note(
  `Upgrade Buff`,
  `In the Roll Attack Dice step, retain one of your fails as a normal success, OR one of your normal successes ` +
  `as a critical success. For each roll the calculator picks whichever option yields more damage, after also ` +
  `resolving Rending — so it correctly seeds a crit for Rending, or adds a norm for Rending to promote, rather ` +
  `than always favoring one. Attack only. Note: defender saves and Piercing (Px) are not weighed in the choice. ` +
  `In-game examples: Hernkyn Yaegir "No Kin Left Behind" and the "Mystic Scry" ploy.`,
);
export const Indomitus = new Note(
  `Indomitus`,
  `If at least 2 dice fail, discard one fail and change another fail to a normal success; defense only. ` +
  `Angels of Death Firefight ploy. ` +
  `Note: KT2024 rule strictly requires two unmodified 1s; this calculator triggers on any 2 failed dice, ` +
  `so the benefit is slightly overstated on rolls where fails include non-1 values (e.g. 2s on a 3+ save).`,
);
export const HardyX = new Note(
  `HardyX`,
  `HardyX is like Lethal (changes what values give you a critical success), but for defense. Name comes from Intercession Squad chapter tactic Hardy.`,
);
export const Durable2021 = new Note(
  `Durable2021`,
  `Durable: in the Resolve Successful Hits step of a combat or shooting attack, one critical hit inflicts one less damage on this operative (to a minimum of 3).`,
);
export const FeelNoPain = new Note(
  `FeelNoPain`,
  `FNP is the category of abilities where just before damage is actually resolved, you roll a die for each successful hit (strike). On a roll at or above the threshold, that hit's damage is reduced by 1. Even MWx damage can be prevented via FNP.`,
);
export const SaintlyRelics = new Note(
  `Saintly Relics`,
  `Whenever an attack dice would inflict damage, roll one D6 ("1D6"), or two D6 if the operative is INSPIRING ("2D6"); ` +
  `if any result is a 6, ignore all of that attack dice's damage. At most one attack dice is ignored per action and ` +
  `two per battle; a failed roll doesn't use up either cap. Both calculators target the highest-damage hit (crits before ` +
  `norms): Shoot does this exactly, and over multiple Rounds the two-per-battle cap is enforced across the battle; Fight ` +
  `spends the ignore on a strike only when no larger strike is still pending. ` +
  `Note: mortal (MWx) damage is never ignored, matching Just a Scratch.`,
);
export const AvgDamageUnbounded = new Note(
  `AvgDamageUnbounded`,
  `The average of damage without regard to defender's wounds.`,
);
export const Brutal = new Note(
  `Brutal`,
  `Opponent can not do norm parries.`,
);
export const Shock = new Note(
  `Shock`,
  `First crit strike also cancels one enemy unresolved norm.`,
);
export const NicheAbility = new Note(
  `NicheAbility`,
  `Dueller2021 is Intercession Squad chapter tactic; each crit parry discards additional 1 norm success of opponent.`
    + `  Hammerhand2021 is Grey Knights psychic power; first strike deals +1 dmg.`
    + `  StormShield2021 is a Custodes ability; each parry discards two successes of opponent instead of 1.`
    + `  MurderousEntrance2021 is a Void Troupe tactical ploy to strike again after a crit strike.`
);
export const Duelist = new Note(
  `Duelist/PreParry`,
  `Do one parry before usual dice resolution.`,
);
export const HalfDamageFirstStrike = new Note(
  `Half Dmg 1st Strike`,
  `First strike damage is halved (rounded up) to a minimum of 2.`,
);
export const Dummy = new Note(
  ``,
  ``,
);