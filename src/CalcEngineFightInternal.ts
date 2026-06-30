import Model from "src/Model";
import * as Util from 'src/Util';
import FightStrategy from 'src/FightStrategy';
import FighterState from "src/FighterState";
import FightChoice from "src/FightChoice";
import Ability from "src/Ability";
import { simulateFighterDice, RngFunction, mulberry32 } from "src/MonteCarloFightDice";

const DEFAULT_SEED = 0x4B54_4341; // "KTCA" - deterministic default for stable results

// Numeric composite key: wounds values are small (typically < 100),
// so packing into a single number avoids string allocation/parsing.
const WOUND_KEY_MULTIPLIER = 1000;
export const toWoundPairKey = (guy1Wounds: number, guy2Wounds: number): string =>
  String(guy1Wounds * WOUND_KEY_MULTIPLIER + guy2Wounds);
export const fromWoundPairKey = (woundsPairText: string): number[] => {
  const n = Number(woundsPairText);
  return [(n / WOUND_KEY_MULTIPLIER) | 0, n % WOUND_KEY_MULTIPLIER];
};

// Internal numeric key helpers (avoid string conversion in hot loop)
const toNumericKey = (guy1Wounds: number, guy2Wounds: number): number =>
  guy1Wounds * WOUND_KEY_MULTIPLIER + guy2Wounds;

export function consolidateWoundPairProbs(woundPairProbs: Map<string,number>): [Map<number,number>, Map<number,number>] {
  const guy1WoundProbs = new Map<number,number>();
  const guy2WoundProbs = new Map<number,number>();

  for(let [woundPairText, prob] of woundPairProbs) {
    const n = Number(woundPairText);
    const guy1Wounds = (n / WOUND_KEY_MULTIPLIER) | 0;
    const guy2Wounds = n % WOUND_KEY_MULTIPLIER;
    Util.addToMapValue(guy1WoundProbs, guy1Wounds, prob);
    Util.addToMapValue(guy2WoundProbs, guy2Wounds, prob);
  }

  return [guy1WoundProbs, guy2WoundProbs];
}

export function calcRemainingWoundPairProbs(
  guy1: Model,
  guy2: Model,
  guy1Strategy: FightStrategy = FightStrategy.MaxDmgToEnemy,
  guy2Strategy: FightStrategy = FightStrategy.MaxDmgToEnemy,
  numRounds: number = 1,
  numSimulations: number = 15_000,
  rng: RngFunction = mulberry32(DEFAULT_SEED),
): Map<string, number> // remaining wound-pairs (as stringified array) to probs
{
  if (!Number.isInteger(numSimulations) || numSimulations <= 0) {
    throw new RangeError(`numSimulations must be a positive integer, got ${numSimulations}`);
  }

  // Use numeric keys internally to avoid string allocation in hot loop
  const woundPairCounts = new Map<number, number>();

  // Pre-allocate FighterState objects and reuse across simulations
  const guy1State = new FighterState(guy1, 0, 0, guy1Strategy, -1, false, false, rng);
  const guy2State = new FighterState(guy2, 0, 0, guy2Strategy, -1, false, false, rng);

  const guy1OrigWounds = guy1.wounds;
  const guy2OrigWounds = guy2.wounds;

  for (let sim = 0; sim < numSimulations; sim++) {
    let guy1Wounds = guy1OrigWounds;
    let guy2Wounds = guy2OrigWounds;

    // SaintlyRelics two-per-battle cap resets each battle (simulation), not each round/action
    guy1State.relicIgnoresUsed = 0;
    guy2State.relicIgnoresUsed = 0;

    for (let round = 0; round < numRounds; round++) {
      if (guy1Wounds <= 0 || guy2Wounds <= 0) break;

      // Temporarily set wounds to avoid cloning Model objects
      guy1.wounds = guy1Wounds;
      guy2.wounds = guy2Wounds;

      const guy1Dice = simulateFighterDice(guy1, guy2, rng);
      const guy2Dice = simulateFighterDice(guy2, guy1, rng);

      // Reset pre-allocated state objects instead of creating new ones
      guy1State.reset(guy1Dice.crits, guy1Dice.norms, guy1Wounds);
      guy2State.reset(guy2Dice.crits, guy2Dice.norms, guy2Wounds);

      resolveFight(guy1State, guy2State);

      guy1Wounds = guy1State.currentWounds;
      guy2Wounds = guy2State.currentWounds;
    }

    const key = toNumericKey(guy1Wounds, guy2Wounds);
    const prev = woundPairCounts.get(key);
    woundPairCounts.set(key, prev !== undefined ? prev + 1 : 1);
  }

  // Restore original wounds
  guy1.wounds = guy1OrigWounds;
  guy2.wounds = guy2OrigWounds;

  // Convert numeric counts to string-keyed probabilities
  const woundPairProbs = new Map<string, number>();
  for (const [numKey, count] of woundPairCounts) {
    woundPairProbs.set(String(numKey), count / numSimulations);
  }

  return woundPairProbs;
}

export function resolveFight(
  guy1State: FighterState,
  guy2State: FighterState,
): void
{
  let currentGuy = guy1State;
  let nextGuy = guy2State;

  handleDuelist(guy1State, guy2State);
  handleDuelist(guy2State, guy1State);

  while(currentGuy.crits + currentGuy.norms + nextGuy.crits + nextGuy.norms > 0
    && currentGuy.currentWounds > 0 && nextGuy.currentWounds > 0)
  {
    // used to have a `if(oneGuy out of successes){ oneGuy.applyDmg(otherGuy.totalDmg())); }`
    // but it would be painful to make that handle Durable and other abilities

    if(currentGuy.crits + currentGuy.norms > 0) {
      const choice = calcDieChoice(currentGuy, nextGuy);
      resolveDieChoice(choice, currentGuy, nextGuy);
    }

    const tmp = currentGuy;
    currentGuy = nextGuy;
    nextGuy = tmp;
  }

  if(guy1State.crits < 0 || guy1State.norms < 0
    || guy2State.crits < 0 || guy1State.norms < 0)
  {
    throw new Error("bug: ended up with negative successes")
  }
}

export function preferredStrikeChoice(chooser: FighterState, enemy: FighterState): FightChoice {
  // Default: strike crit-first. This front-loads our biggest die, which matters when we might
  // not survive to spend every success — better to land the crit than die holding it.
  const critFirst = chooser.nextStrike();

  // The only time striking norm-first can help is when we hold BOTH crits and norms AND the
  // enemy has NO crits: a normal parry can cancel only a normal (it can't touch a crit), so
  // striking our normal first forces it through before the enemy can parry it, while our crit
  // stays unparryable. Outside this shape, crit-first is always at least as good.
  if(!(chooser.crits > 0 && chooser.norms > 0 && enemy.crits === 0)) {
    return critFirst;
  }

  // Whether norm-first actually wins depends on what the enemy does: a PARRYING enemy makes
  // norm-first better (parry denied), but a STRIKING enemy in a death-race makes crit-first
  // better (we may die before spending the crit). So decide by simulating the rest of the
  // fight both ways against the enemy's ACTUAL strategy and keeping the better order.
  //
  // rng is cleared on the clones so the estimate is deterministic and doesn't consume Monte
  // Carlo draws — same discipline as calcParryForLastEnemySuccessThenKillEnemy. Each branch
  // spends a die before recursing, so total successes strictly decrease and this terminates.
  const simulateFirstStrike = (first: FightChoice): [FighterState, FighterState] => {
    const ch = chooser.clone();
    const en = enemy.clone();
    ch.rng = null;
    en.rng = null;
    resolveDieChoice(first, ch, en);
    resolveFight(en, ch); // enemy acts next
    return [ch, en];
  };

  const [critChooser, critEnemy] = simulateFirstStrike(FightChoice.CritStrike);
  const [normChooser, normEnemy] = simulateFirstStrike(FightChoice.NormStrike);

  let normFirstBetter: boolean;
  if(chooser.strategy === FightStrategy.MinDmgToSelf) {
    normFirstBetter = normChooser.currentWounds > critChooser.currentWounds;
  }
  // Strike / MaxDmgToEnemy: leaving the enemy on fewer wounds is better
  else {
    normFirstBetter = normEnemy.currentWounds < critEnemy.currentWounds;
  }

  // Prefer crit-first on ties so behavior only changes when norm-first is strictly better.
  return normFirstBetter ? FightChoice.NormStrike : critFirst;
}

export function calcDieChoice(chooser: FighterState, enemy: FighterState): FightChoice {
  // note: this function assumes chooser has remaining successes

  // if enemy has no successes, parry would cancel nothing — must strike
  if(enemy.crits + enemy.norms === 0) {
    return chooser.nextStrike();
  }

  // ALWAYS strike if you can kill enemy with a single strike;
  // also, if enemy has brutal and you have no crits, then you must strike;
  if(chooser.nextDmg(enemy) >= enemy.currentWounds
    || (enemy.profile.has(Ability.Brutal) && chooser.crits === 0)) {
    return chooser.nextStrike();
  }

  // if can shock enemy (crit strike that also cancels an enemy NORM success),
  // and enemy doesn't have any crit successes, then a shocking crit strike is usually right.
  // BUT when we also hold a norm and are trying to maximize damage, striking the norm first can
  // be better: the enemy's normal parry can't touch our crit, so leading with the norm pushes it
  // past the parry while the crit (and its shock) still lands on a later turn. Defer to
  // preferredStrikeChoice in that mixed-dice case; otherwise take the crit strike now.
  if(chooser.profile.has(Ability.Shock) && !chooser.hasCritStruck && chooser.crits > 0 && enemy.crits === 0) {
    if(chooser.norms > 0
      && (chooser.strategy === FightStrategy.Strike
        || chooser.strategy === FightStrategy.MaxDmgToEnemy
        || chooser.strategy === FightStrategy.MinDmgToSelf)) {
      return preferredStrikeChoice(chooser, enemy);
    }
    return FightChoice.CritStrike;
  }

  // if can parry last enemy success and still kill, then that is awesome
  // and we should do that
  const awesomeParry = calcParryForLastEnemySuccessThenKillEnemy(chooser, enemy);
  if(awesomeParry !== null) {
    return awesomeParry;
  }

  if(chooser.strategy === FightStrategy.Strike) {
    return preferredStrikeChoice(chooser, enemy);
  }
  else if(chooser.strategy === FightStrategy.Parry) {
    return wiseParry(chooser, enemy);
  }
  else if(chooser.strategy === FightStrategy.MaxDmgToEnemy
    || chooser.strategy === FightStrategy.MinDmgToSelf)
  {
    // calc dmgs if all strike or all parry; take better option
    const enemyWeStruck = enemy.withStrategy(FightStrategy.Strike);
    const enemyWeParried = enemyWeStruck.clone();

    const chooserWhoStruck = chooser.clone();
    const chooserWhoParried = chooser.clone();
    const strikeChoice = preferredStrikeChoice(chooser, enemy);
    const parryChoice = wiseParry(chooser, enemy);

    resolveDieChoice(strikeChoice, chooserWhoStruck, enemyWeStruck);
    resolveDieChoice(parryChoice, chooserWhoParried, enemyWeParried);

    resolveFight(enemyWeStruck, chooserWhoStruck);
    resolveFight(enemyWeParried, chooserWhoParried);

    let wantStrike = true;

    if(chooser.strategy === FightStrategy.MaxDmgToEnemy) {
      wantStrike = enemyWeStruck.currentWounds <= enemyWeParried.currentWounds;
    }
    // else MinDmgToSelf
    else {
      wantStrike = chooserWhoStruck.currentWounds >= chooserWhoParried.currentWounds;
    }

    if(wantStrike) {
      return strikeChoice;
    }
    else {
      return parryChoice;
    }
  }

  throw new Error('unsupported FightStrategy: ' + chooser.strategy);
}

export function resolveDieChoice(
  choice: FightChoice,
  chooser: FighterState,
  enemy: FighterState,
): void {
  function applyDmgWithFirstStrikeHandling(dmg: number, isNorm: boolean) {
    if(!chooser.hasStruck) {
      if(enemy.profile.abilities.has(Ability.JustAScratch)) {
        dmg = 0;
      } else {
        if(chooser.profile.abilities.has(Ability.Hammerhand2021)) {
          dmg++;
        }
        if(enemy.profile.abilities.has(Ability.HalfDamageFirstStrike)) {
          dmg = Math.max(2, Math.ceil(dmg / 2));
        }
      }
      chooser.hasStruck = true;
    }
    // JaS (Normals): ignore the first normal strike's damage; cannot ignore crits.
    // Guarded on dmg > 0 so a strike already zeroed by JaS (Crits) doesn't spend it.
    if(isNorm && dmg > 0 && !enemy.normScratchUsed
      && enemy.profile.abilities.has(Ability.JustAScratchNorms)) {
      dmg = 0;
      enemy.normScratchUsed = true;
    }
    // SaintlyRelics targets the highest-damage strike: spend the single ignore now only if no
    // larger strike is still pending from this attacker (otherwise save it). chooser.crits/norms
    // still include the current strike here, so discount it when measuring what remains.
    const pendingCrits = chooser.crits - (isNorm ? 0 : 1);
    let pendingNorms = chooser.norms - (isNorm ? 1 : 0);
    // an unspent JaS (Normals) will scratch one pending normal to 0, so it isn't real pending damage
    if(pendingNorms > 0 && !enemy.normScratchUsed
      && enemy.profile.abilities.has(Ability.JustAScratchNorms)) {
      pendingNorms--;
    }
    let maxPendingDmg = 0;
    if(pendingCrits > 0) {
      maxPendingDmg = Math.max(maxPendingDmg, chooser.profile.critDmg);
    }
    if(pendingNorms > 0) {
      maxPendingDmg = Math.max(maxPendingDmg, chooser.profile.normDmg);
    }
    enemy.applyDmg(dmg, dmg >= maxPendingDmg);
  }

  if(choice === FightChoice.CritStrike) {
    let critDmgAfterPossibleDurable = chooser.nextCritDmgWithDurableAndWithoutHammerhand(enemy);
    applyDmgWithFirstStrikeHandling(critDmgAfterPossibleDurable, false);
    chooser.crits--;

    if(chooser.profile.has(Ability.Shock) && !chooser.hasCritStruck) {
      enemy.norms = Math.max(0, enemy.norms - 1); // shock ability cancels an enemy norm success
    }

    if (
      chooser.successes()
      && chooser.profile.has(Ability.MurderousEntrance2021)
      && !chooser.hasCritStruck
    ) {
      if(chooser.crits > 0) {
        applyDmgWithFirstStrikeHandling(chooser.profile.critDmg, false);
        chooser.crits--;
      }
      else {
        applyDmgWithFirstStrikeHandling(chooser.profile.normDmg, true);
        chooser.norms--;
      }
    }

    chooser.hasCritStruck = true;
  }
  else if(choice === FightChoice.NormStrike) {
    applyDmgWithFirstStrikeHandling(chooser.profile.normDmg, true);
    chooser.norms--;
  }
  else if(choice === FightChoice.CritParry) {
    // Dueller: critical parry can cancel additional normal success
    if(chooser.profile.abilities.has(Ability.Dueller)) {
      let numCritsCancelled = 0;

      if(enemy.crits > 0) {
        enemy.crits--;
        numCritsCancelled++;
      }

      enemy.norms = Math.max(0, enemy.norms - 2 + numCritsCancelled);
    }
    else {
      for(let numCancelled = 0; numCancelled < chooser.profile.cancelsPerParry(); numCancelled++) {
        if(enemy.crits > 0) {
          enemy.crits--;
        }
        else if(enemy.norms > 0) {
          enemy.norms--;
        }
      }
    }
    chooser.crits--;
  }
  else if(choice === FightChoice.NormParry) {
    if(enemy.profile.has(Ability.Brutal)) {
      throw new Error("not allowed to do FightChoice.NormParry when enemy has brutal")
    }
    enemy.norms = Math.max(0, enemy.norms - chooser.profile.cancelsPerParry());
    chooser.norms--;
  }
  else {
    throw new Error("invalid DieChoice");
  }
}

export function calcParryForLastEnemySuccessThenKillEnemy(
  chooser: FighterState,
  enemy: FighterState,
): FightChoice | null
{
  // note: this function assumes chooser and enemy have successes

  // reminder: enemy having brutal means chooser can only parry with crits
  if(enemy.profile.has(Ability.Brutal)) {
    if(chooser.crits === 0) {
      return null;
    }
  }

  const enemySuccesses = enemy.crits + enemy.norms;

  // if chooser can parry enemy's remaining success (or successes due to storm shield)
  // AND kill enemy afterwards, then chooser should parry
  let fightChoice: FightChoice | null = null;

  // special case for Dueller
  if(chooser.profile.abilities.has(Ability.Dueller)
    && chooser.crits > 0
    && enemy.crits <= 1
    && enemySuccesses <= 2
  ) {
    fightChoice = FightChoice.CritParry;
  }
  // handle StormShield and normal
  else if(enemy.crits + enemy.norms <= chooser.profile.cancelsPerParry()) {

    if(enemy.crits > 0) {
      if(chooser.crits > 0) {
        fightChoice = FightChoice.CritParry;
      }
      // else chooser has no crits and can not parry the enemy crit
    }
    // else enemy.norms > 0
    else {
      if(chooser.norms > 0 && !enemy.profile.has(Ability.Brutal)) {
        fightChoice = FightChoice.NormParry;
      }
      else {
        fightChoice = FightChoice.CritParry;
      }
    }
  }

  if(fightChoice !== null) {
    // Estimate the chooser's remaining damage by cloning the fighters, applying
    // the parry, then striking out the rest through the real resolution path.
    // This keeps resolveDieChoice the single source of truth for first-strike
    // handling (JaS Crits, JaS Normals, Hammerhand, Durable, etc.) instead of
    // re-deriving it here. rng is cleared on the clones so the estimate stays
    // deterministic and doesn't consume Monte Carlo draws (matching the old
    // possibleDmg-based estimate, which also ignored Feel No Pain).
    const chooserClone = chooser.clone();
    const enemyClone = enemy.clone();
    chooserClone.rng = null;
    enemyClone.rng = null;

    resolveDieChoice(fightChoice, chooserClone, enemyClone);

    // After parrying the enemy's last success the enemy is out of successes,
    // so the chooser simply strikes until the enemy dies or its successes run out.
    while(chooserClone.successes() > 0 && enemyClone.currentWounds > 0) {
      resolveDieChoice(chooserClone.nextStrike(), chooserClone, enemyClone);
    }

    if(enemyClone.currentWounds <= 0) {
      return fightChoice;
    }
  }

  return null;
}

export function wiseParry(chooser: FighterState, enemy: FighterState): FightChoice {
  // function is only called when both chooser and enemy have successes

  // use our crits to parry enemy crits; otherwise save our crits
  // for possible strikes once all enemy successes are gone
  if (enemy.crits > 0 && chooser.crits > 0) {
    return FightChoice.CritParry;
  }
  // do a norm parry, but only if there is an enemy norm success to cancel
  else if (chooser.norms > 0 && enemy.norms > 0 && !enemy.profile.has(Ability.Brutal)) {
    return FightChoice.NormParry;
  }
  // this is a CritParry of an enemy norm success
  else if (chooser.crits > 0) {
    return FightChoice.CritParry;
  }
  // remaining scenario is chooser has only norm successes and {enemy has only crit successes or brutal}
  return FightChoice.NormStrike;
}

export function handleDuelist(
  guy1State: FighterState,
  guy2State: FighterState,
): void
{
  if (
    guy1State.hasDuelistParried
    || !guy1State.profile.abilities.has(Ability.Duelist)
    || guy1State.successes() === 0
    || guy2State.successes() === 0
  ) {
    return;
  }

  // Duelist's free parry happens once per fight. Mark it spent now so re-entrant resolveFight
  // calls (e.g. the lookahead simulations in calcDieChoice / preferredStrikeChoice, which clone
  // mid-fight state) don't grant it a second time and corrupt the estimate.
  guy1State.hasDuelistParried = true;

  if(guy2State.profile.has(Ability.Brutal)) {
    if(guy1State.crits) {
      resolveDieChoice(FightChoice.CritParry, guy1State, guy2State);
    }
    return;
  }

  let parryChoice: FightChoice;

  if (guy1State.crits && guy2State.crits) {
    parryChoice = FightChoice.CritParry;
  }
  else if (guy1State.norms === 0) {
    parryChoice = FightChoice.CritParry;
  }
  else {
    parryChoice = FightChoice.NormParry;
  }

  resolveDieChoice(parryChoice, guy1State, guy2State);
}