import Model from "src/Model";
import * as Util from 'src/Util';
import FightStrategy from 'src/FightStrategy';
import FighterState from "src/FighterState";
import FightChoice from "src/FightChoice";
import Ability from "src/Ability";
import { simulateFighterDice, RngFunction } from "src/MonteCarloFightDice";

export const toWoundPairKey = (guy1Wounds: number, guy2Wounds: number): string => [guy1Wounds, guy2Wounds].toString();
export const fromWoundPairKey = (woundsPairText: string): number[] => woundsPairText.split(',').map(x => parseInt(x));

export function consolidateWoundPairProbs(woundPairProbs: Map<string,number>): [Map<number,number>, Map<number,number>] {
  const guy1WoundProbs = new Map<number,number>();
  const guy2WoundProbs = new Map<number,number>();

  for(let [woundPairText, prob] of woundPairProbs) {
    const [guy1Wounds, guy2Wounds] = fromWoundPairKey(woundPairText);
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
  rng: RngFunction = Math.random,
): Map<string, number> // remaining wound-pairs (as stringified array) to probs
{
  const woundPairCounts = new Map<string, number>();

  for (let sim = 0; sim < numSimulations; sim++) {
    let guy1Wounds = guy1.wounds;
    let guy2Wounds = guy2.wounds;

    for (let round = 0; round < numRounds; round++) {
      if (guy1Wounds <= 0 || guy2Wounds <= 0) break;

      // Temporarily set wounds to avoid cloning Model objects
      const guy1OrigWounds = guy1.wounds;
      const guy2OrigWounds = guy2.wounds;
      guy1.wounds = guy1Wounds;
      guy2.wounds = guy2Wounds;

      const guy1Dice = simulateFighterDice(guy1, undefined, rng);
      const guy2Dice = simulateFighterDice(guy2, undefined, rng);

      const guy1State = new FighterState(
        guy1,
        guy1Dice.crits,
        guy1Dice.norms,
        guy1Strategy,
      );
      const guy2State = new FighterState(
        guy2,
        guy2Dice.crits,
        guy2Dice.norms,
        guy2Strategy,
      );

      resolveFight(guy1State, guy2State);

      guy1Wounds = guy1State.currentWounds;
      guy2Wounds = guy2State.currentWounds;

      // Restore original wounds
      guy1.wounds = guy1OrigWounds;
      guy2.wounds = guy2OrigWounds;
    }

    const key = toWoundPairKey(guy1Wounds, guy2Wounds);
    Util.addToMapValue(woundPairCounts, key, 1);
  }

  // Convert counts to probabilities
  const woundPairProbs = new Map<string, number>();
  for (const [key, count] of woundPairCounts) {
    woundPairProbs.set(key, count / numSimulations);
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

    [currentGuy, nextGuy] = [nextGuy, currentGuy];
  }

  if(guy1State.crits < 0 || guy1State.norms < 0
    || guy2State.crits < 0 || guy1State.norms < 0)
  {
    throw new Error("bug: ended up with negative successes")
  }
}

export function calcDieChoice(chooser: FighterState, enemy: FighterState): FightChoice {
  // note: this function assumes both chooser and enemy have remaining successes

  // ALWAYS strike if you can kill enemy with a single strike;
  // also, if enemy has brutal and you have no crits, then you must strike;
  if(chooser.nextDmg(enemy) >= enemy.currentWounds
    || (enemy.profile.has(Ability.Brutal) && chooser.crits === 0)) {
    return chooser.nextStrike();
  }

  // if can stun enemy (crit strike that also cancels an enemy NORM success),
  // and enemy doesn't have any crit successes, then there is no downside
  // to doing a stunning crit strike now
  if(chooser.profile.has(Ability.Stun2021) && !chooser.hasCritStruck && chooser.crits > 0 && enemy.crits === 0) {
    return FightChoice.CritStrike;
  }

  // if can parry last enemy success and still kill, then that is awesome
  // and we should do that
  const awesomeParry = calcParryForLastEnemySuccessThenKillEnemy(chooser, enemy);
  if(awesomeParry !== null) {
    return awesomeParry;
  }

  if(chooser.strategy === FightStrategy.Strike) {
    return chooser.nextStrike();
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
    const strikeChoice = chooser.nextStrike();
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
  function applyDmgWithFirstStrikeHandling(dmg: number) {
    if(!chooser.hasStruck) {
      if(enemy.profile.abilities.has(Ability.JustAScratch)) {
        dmg = 0;
      } else if(chooser.profile.abilities.has(Ability.Hammerhand2021)) {
        dmg++;
      }
      chooser.hasStruck = true;
    }
    enemy.applyDmg(dmg);
  }

  if(choice === FightChoice.CritStrike) {
    let critDmgAfterPossibleDurable = chooser.nextCritDmgWithDurableAndWithoutHammerhand(enemy);
    applyDmgWithFirstStrikeHandling(critDmgAfterPossibleDurable);
    chooser.crits--;

    if(chooser.profile.has(Ability.Stun2021) && !chooser.hasCritStruck) {
      enemy.norms = Math.max(0, enemy.norms - 1); // stun ability can only cancel an enemy norm success
    }

    if (
      chooser.successes()
      && chooser.profile.has(Ability.MurderousEntrance2021)
      && !chooser.hasCritStruck
    ) {
      if(chooser.crits > 0) {
        enemy.applyDmg(chooser.profile.critDmg);
        chooser.crits--;
      }
      else {
        enemy.applyDmg(chooser.profile.normDmg);
        chooser.norms--;
      }
    }

    chooser.hasCritStruck = true;
  }
  else if(choice === FightChoice.NormStrike) {
    applyDmgWithFirstStrikeHandling(chooser.profile.normDmg);
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
    const critsAfterParry = chooser.crits - (fightChoice === FightChoice.CritParry ? 1 : 0);
    const normsAfterParry = chooser.norms - (fightChoice === FightChoice.NormParry ? 1 : 0);
    const remainingDmg = chooser.possibleDmg(critsAfterParry, normsAfterParry);

    if(remainingDmg >= enemy.profile.wounds) {
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
    !guy1State.profile.abilities.has(Ability.Duelist)
    || guy1State.successes() === 0
    || guy2State.successes() === 0
  ) {
    return;
  }

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