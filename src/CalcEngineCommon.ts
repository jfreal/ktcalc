import { max, range, } from 'lodash';
import { factorial, } from 'mathjs';

import Ability from "src/Ability";
import Model from "src/Model";
import DieProbs from "src/DieProbs";
import FinalDiceProb from 'src/FinalDiceProb';
import { addMapValues, addToMapValue, upTo } from 'src/Util';

export function calcFinalDiceProbsForAttacker(
  attacker: Model,
  defender?: Model,
): FinalDiceProb[]
{
  // Merge defender's ObscuredTarget into abilities if present
  let abilities = attacker.abilities;
  if (defender?.has(Ability.ObscuredTarget)) {
    abilities = new Set(abilities);
    abilities.add(Ability.ObscuredTarget);
  }

  return calcFinalDiceProbs(
    attacker.toAttackerDieProbs(),
    attacker.numDice,
    attacker.reroll,
    attacker.autoCrits,
    attacker.autoNorms,
    attacker.failsToNorms,
    attacker.normsToCrits,
    abilities,
    attacker.normDmg,
    attacker.critDmg + attacker.mwx,
  );
}

export function calcFinalDiceProbs(
  singleDieProbs: DieProbs,
  numDice: number,
  reroll: Ability,
  autoCrits: number = 0,
  autoNorms: number = 0,
  failsToNorms: number = 0,
  normsToCrits: number = 0,
  abilities: Set<Ability> = new Set<Ability>(),
  normDmg: number = 0,
  critDmgPlusMwx: number = 0,
): FinalDiceProb[]
{
  let finalDiceProbs: FinalDiceProb[] = [];

  autoCrits = Math.min(autoCrits, numDice);
  numDice -= autoCrits;
  autoNorms = Math.min(autoNorms, numDice);
  numDice -= autoNorms;

  for (let crits = 0; crits <= numDice; crits++) {
    for (let norms = 0; norms <= numDice - crits; norms++) {
      const fails = numDice - crits - norms;

      const finalDiceProb = calcFinalDiceProb(
        singleDieProbs,
        crits,
        norms,
        fails,
        reroll,
        autoCrits,
        autoNorms,
        failsToNorms,
        normsToCrits,
        abilities,
        normDmg,
        critDmgPlusMwx,
      );

      if (finalDiceProb.prob > 0) {
        finalDiceProbs.push(finalDiceProb);
      }
    }
  }

  return finalDiceProbs;
}

export function calcFinalDiceProb(
  dieProbs: DieProbs,
  crits: number,
  norms: number,
  fails: number,
  reroll: Ability = Ability.None, // really just care if Balanced or RerollOnesPlusBalanced
  additionalCrits: number = 0,
  additionalNorms: number = 0,
  failsToNorms: number = 0,
  normsToCrits: number = 0,
  abilities: Set<Ability> = new Set<Ability>(),
  normDmg: number = 0,
  critDmgPlusMwx: number = 0,
): FinalDiceProb
{
  let prob = 0

  if (reroll === Ability.Balanced) {
    prob = calcFinalDiceProbBalanced(dieProbs, crits, norms, fails, 1);
  }
  else if (reroll === Ability.DoubleBalanced) {
    prob = calcFinalDiceProbBalanced(dieProbs, crits, norms, fails, 2);
  }
  else if (reroll === Ability.RerollMostCommonFail) {
    prob = calcFinalDiceProbRerollMostCommonFail(dieProbs, crits, norms, fails);
  }
  else if (reroll === Ability.RerollMostCommonFailPlusBalanced) {
    prob = calcFinalDiceProbRerollMostCommonFailPlusBalanced(dieProbs, crits, norms, fails);
  }
  else {
    prob = calcMultiRollProb(dieProbs, crits, norms, fails);
  }

  if (reroll === Ability.RerollOnesPlusBalanced) {
    const probRollBeforeBalanced = prob;
    // probSingleFailCanNotBeRerolled = (BS - 1) / (7*BS - 13)
    // but, to put it in terms of given RerollOnes fail prob: 1/7 + 1/(42*pFail)
    const probSingleFailCanNotBeRerolled = 1 / 7 + 1 / (42 * dieProbs.fail);

    const nonRerollOnesProbCrit = dieProbs.crit * 6 / 7;
    const nonRerollOnesProbNorm = dieProbs.norm * 6 / 7;
    const nonRerollOnesProbFail = 1 - nonRerollOnesProbCrit - nonRerollOnesProbNorm;

    // if no fails, then prob we got that before balanced reroll is already calculated

    // 1st, consider prob of PreBalancedRoll+CannotDoBalancedRoll;
    // if CannotDoBalancedRoll is coming from no fails, then we already calculated that;
    // remaining case is we did have fails and all of them were ones-rerolled;
    // this is probPlainRoll * probSingleFailCanNotBeRerolled^NumFails
    if(fails > 0) {
      const conditionalProbNoneCanBeRerolled = Math.pow(probSingleFailCanNotBeRerolled, fails);
      prob *= conditionalProbNoneCanBeRerolled;

      // 2nd, consider prob of PreBalancedRoll+CanDoBalancedRoll+FailedBalancedRoll
      prob += probRollBeforeBalanced * (1 - conditionalProbNoneCanBeRerolled) * nonRerollOnesProbFail;
    }

    // 3rd, consider prob of PreBalancedRollWithOneLessCrit+CanDoBalancedRoll+CritBalancedRoll
    if(crits > 0) {
      const conditionalProbSomeCanBeRerolled = 1 - Math.pow(probSingleFailCanNotBeRerolled, fails + 1);
      prob += calcMultiRollProb(dieProbs, crits - 1, norms, fails + 1)
        * conditionalProbSomeCanBeRerolled
        * nonRerollOnesProbCrit;
    }

    // 4th, consider prob of PreBalancedRollWithOneLessNorm+CanDoBalancedRoll+NormBalancedRoll
    if(norms > 0) {
      const conditionalProbSomeCanBeRerolled = 1 - Math.pow(probSingleFailCanNotBeRerolled, fails + 1);
      prob += calcMultiRollProb(dieProbs, crits, norms - 1, fails + 1)
        * conditionalProbSomeCanBeRerolled
        * nonRerollOnesProbNorm;
    }
  }

  const modified = applyPostRollModifications(
    crits, norms, fails,
    additionalCrits, additionalNorms,
    failsToNorms, normsToCrits,
    abilities,
    normDmg,
    critDmgPlusMwx,
  );

  return new FinalDiceProb(prob, modified.crits, modified.norms);
}

export function calcMultiRollProb(
  dieProbs: DieProbs,
  numCrits: number,
  numNorms: number,
  numFails: number,
): number
{
  const prob
    = Math.pow(dieProbs.crit, numCrits)
    * Math.pow(dieProbs.norm, numNorms)
    * Math.pow(dieProbs.fail, numFails)
    * factorial(numCrits + numNorms + numFails)
    / factorial(numCrits)
    / factorial(numNorms)
    / factorial(numFails)
    ;
  return prob;
}

export function calcFinalDiceProbBalanced(
  dieProbs: DieProbs,
  finalCrits: number,
  finalNorms: number,
  finalFails: number,
  balancedCount: number,
): number {
  let prob = 0;

  const minRerolls = Math.min(finalFails, balancedCount);
  const maxRerolls = balancedCount;

  // NOTE: variable names like "rerolledCrits" are how many originally-failed dice were rerolled and became crits

  for(const rerolls of upTo(minRerolls, maxRerolls)) {
    for(const rerolledCrits of upTo(Math.min(finalCrits, rerolls))) {
      // you can't have so few new norms that you have more orig fails than final fails
      const minRerolledNorms = Math.max(0, rerolls - rerolledCrits - finalFails);
      // firstly, can't have more new norms than final norms
      // secondly, can't have more new crits and norms than rerolls
      // and the ternary is to prevent (rerolls < balancedFactor && rerolls < origFails)
      const maxRerolledNorms = Math.min(
        finalNorms,
        rerolls - rerolledCrits - (rerolls < balancedCount ? finalFails : 0));
      for(const rerolledNorms of upTo(minRerolledNorms, maxRerolledNorms)) {
        const rerolledFails = rerolls - rerolledCrits - rerolledNorms;
        const origCrits = finalCrits - rerolledCrits;
        const origNorms = finalNorms - rerolledNorms;
        const origFails = finalFails + rerolledNorms + rerolledCrits;

        const preBalancedProb = calcMultiRollProb(
          dieProbs,
          origCrits,
          origNorms,
          origFails);
        const balancedRollsProb = calcMultiRollProb(
          dieProbs,
          rerolledCrits,
          rerolledNorms,
          rerolledFails);
        prob += preBalancedProb * balancedRollsProb;
      }
    }
  }

  return prob;
}

export function calcFinalDiceProbRerollMostCommonFail(
  dieProbs: DieProbs,
  finalCrits: number,
  finalNorms: number,
  finalFails: number,
): number {
  let prob = 0;
  const numFailFaces = Math.round(dieProbs.fail * 6);
  const numDice = finalCrits + finalNorms + finalFails;

  // given finalFails, the lowest-reroll scenario is evenly-split-as-possible fails
  const minRerolls = Math.ceil(finalFails / numFailFaces);
  const maxRerolls = numDice;

  for(const rerolls of upTo(minRerolls, maxRerolls)) {
    for(const rerolledCrits of upTo(Math.min(finalCrits, rerolls))) {
      // you can't have so few new norms that you have more orig fails than final fails
      const minRerolledNorms = Math.max(0, rerolls - rerolledCrits - finalFails);
      // firstly, can't have more new norms than final norms
      // secondly, can't have more new crits and norms than rerolls
      const maxRerolledNorms = Math.min(
        finalNorms,
        rerolls - rerolledCrits);
      for(const rerolledNorms of upTo(minRerolledNorms, maxRerolledNorms)) {
        const rerolledFails = rerolls - rerolledCrits - rerolledNorms;
        const origCrits = finalCrits - rerolledCrits;
        const origNorms = finalNorms - rerolledNorms;
        const origFails = finalFails + rerolledNorms + rerolledCrits;;
        const probOfNumRerolls = getProbOfNumTediousRerolls(numFailFaces, origFails, rerolls);

        const preRerollProb = calcMultiRollProb(
          dieProbs,
          origCrits,
          origNorms,
          origFails);
        const rerollProb = calcMultiRollProb(
          dieProbs,
          rerolledCrits,
          rerolledNorms,
          rerolledFails);
        prob += probOfNumRerolls * preRerollProb * rerollProb;
      }
    }
  }
  return prob;
}

// CeaselessPlusBalanced: Apply Ceaseless first, then Balanced on one unrerolled die
// Key constraint: Balanced can only target dice that Ceaseless didn't reroll (no double reroll)
// Balanced uses OPTIMAL targeting: prefer fails, then norms, never crits
export function calcFinalDiceProbRerollMostCommonFailPlusBalanced(
  dieProbs: DieProbs,
  finalCrits: number,
  finalNorms: number,
  finalFails: number,
): number {
  let totalProb = 0;
  const numFailFaces = Math.round(dieProbs.fail * 6);
  const numDice = finalCrits + finalNorms + finalFails;

  // Enumerate all possible "beforeBalanced" states (differ from final by at most 1 Balanced reroll)
  // beforeBalanced is the state after Ceaseless, before Balanced
  for(let bCrits = Math.max(0, finalCrits - 1); bCrits <= Math.min(numDice, finalCrits + 1); bCrits++) {
    for(let bNorms = Math.max(0, finalNorms - 1); bNorms <= Math.min(numDice - bCrits, finalNorms + 1); bNorms++) {
      const bFails = numDice - bCrits - bNorms;
      if(bFails < 0) continue;

      // Determine what Balanced did to get from beforeBalanced to final
      const critDiff = finalCrits - bCrits;
      const normDiff = finalNorms - bNorms;
      const failDiff = finalFails - bFails;

      // Balanced rerolls exactly 1 die, changing at most 1 result
      // Valid transitions: no change (0,0,0), or one type goes down by 1 and another goes up by 1
      if(Math.abs(critDiff) + Math.abs(normDiff) + Math.abs(failDiff) > 2) continue;

      // Determine which die type Balanced targeted and what it became
      // Balanced ONLY targets fails (never norms or crits)
      let targetType: 'fail' | 'none';
      let balancedOutcomeProb: number;

      if(critDiff === 0 && normDiff === 0 && failDiff === 0) {
        targetType = 'none'; // No change (either no fails to reroll, or fail stayed fail)
        balancedOutcomeProb = 1;
      } else if(critDiff === 1 && normDiff === 0 && failDiff === -1) {
        targetType = 'fail'; balancedOutcomeProb = dieProbs.crit; // fail→crit
      } else if(critDiff === 0 && normDiff === 1 && failDiff === -1) {
        targetType = 'fail'; balancedOutcomeProb = dieProbs.norm; // fail→norm
      } else {
        continue; // Invalid - Balanced only targets fails
      }

      // Enumerate Ceaseless reroll scenarios that produce the beforeBalanced state
      const minRerolls = Math.ceil(bFails / Math.max(1, numFailFaces));
      const maxRerolls = numDice;

      for(const rerolls of upTo(minRerolls, maxRerolls)) {
        for(const rerolledCrits of upTo(Math.min(bCrits, rerolls))) {
          const minRerolledNorms = Math.max(0, rerolls - rerolledCrits - bFails);
          const maxRerolledNorms = Math.min(bNorms, rerolls - rerolledCrits);

          for(const rerolledNorms of upTo(minRerolledNorms, maxRerolledNorms)) {
            const rerolledFails = rerolls - rerolledCrits - rerolledNorms;
            const origCrits = bCrits - rerolledCrits;
            const origNorms = bNorms - rerolledNorms;
            const origFails = bFails + rerolledCrits + rerolledNorms;

            // Fails available for Balanced: original fails not rerolled by Ceaseless
            const availFails = origFails - rerolls;
            if(availFails < 0) continue;

            const probOfNumRerolls = getProbOfNumTediousRerolls(numFailFaces, origFails, rerolls);
            const preRerollProb = calcMultiRollProb(dieProbs, origCrits, origNorms, origFails);
            const rerollProb = calcMultiRollProb(dieProbs, rerolledCrits, rerolledNorms, rerolledFails);
            const ceaselessProb = probOfNumRerolls * preRerollProb * rerollProb;

            if(targetType === 'none') {
              // No change case: either no fails to reroll, or rerolled fail stayed fail
              if(availFails > 0) {
                // Had fails to reroll, but rolled fail again
                totalProb += ceaselessProb * dieProbs.fail;
              } else {
                // No fails available - Balanced can't reroll anything useful
                totalProb += ceaselessProb;
              }
            } else if(targetType === 'fail') {
              // Balanced targeted a fail and improved it
              if(availFails <= 0) continue; // No fails available to target
              totalProb += ceaselessProb * balancedOutcomeProb;
            }
          }
        }
      }
    }
  }

  return totalProb;
}

// indices in order: number of fail types (from BS), number of original fails, number of rerolls
// final value is probability of that many rerolls given the other info
const TediousRerollCountProbs = new Map<number, Map<number, Array<number>>>();

export function getProbOfNumTediousRerolls(
  numFailTypes: number,
  numOrigFails: number,
  numRerolls: number,
): number {
  let probsForNumFailType = TediousRerollCountProbs.get(numFailTypes);

  if(probsForNumFailType === undefined) {
    probsForNumFailType = new Map<number, Array<number>>();
    TediousRerollCountProbs.set(numFailTypes, probsForNumFailType);
  }

  let rerollCountProbs = probsForNumFailType.get(numOrigFails);

  if(rerollCountProbs !== undefined) {
    return rerollCountProbs[numRerolls];
  }

  rerollCountProbs = new Array<number>(numOrigFails + 1).fill(0);
  probsForNumFailType.set(numOrigFails, rerollCountProbs);

  const failTypeCounts = new Array<number>(numFailTypes).fill(0);
  failTypeCounts[0] = numOrigFails;

  // the overall probability is the following multiplicative factors...
  // probability of rolling each fail type in a particular order
  //   numFailTypes^-numOrigFails
  // number of permutations of how orig fails were rolled
  //   fact(numOrigFails) / fact(numFailType1) / fact(numFailType2) / ...
  // number of permutations of counts of fail types
  //   fact(numFailTypes) / fact(how many fail types had 0 dice) / fact(how many fail types had 1 dice) / ...

  const commonProbFactor
    = Math.pow(numFailTypes, -numOrigFails) // chance of rolling each fail type in a particular order
    * factorial(numOrigFails) // from permutations of how orig fails were rolled
    * factorial(numFailTypes); // from permutations of counts of fail types

  do {
    let divisor = 1;
    for(const failTypeCount of failTypeCounts) {
      divisor *= factorial(failTypeCount);
    }

    const failTypeCountHistogram = calcHistogramArray(failTypeCounts);
    for(const numFailTypesWithCertainNumDice of failTypeCountHistogram) {
      divisor *= factorial(numFailTypesWithCertainNumDice);
    }

    const numRerollsAchieved = failTypeCounts[0]; // descending order, so first is biggest
    rerollCountProbs[numRerollsAchieved] += commonProbFactor / divisor;
  } while(changeToNextDescendingSequenceWithSameSum(failTypeCounts));

  //const scaledProbs = rerollCountProbs.map(prob => prob * Math.pow(numFailTypes, numOrigFails - 1));
  //console.debug(`TediousRerollCountProbs: bins=${numFailTypes} total=${numOrigFails}, scaledProbs=${scaledProbs}`);
  return rerollCountProbs[numRerolls];
}

export function calcHistogramArray(vals: number[]): number[] {
  const histogram = new Array<number>(max(vals)! + 1).fill(0);
  for(const val of vals) {
    histogram[val]++;
  }
  return histogram;
}

// examples with length 3 and sum 9 ...
// [9, 0, 0] -> [8, 1, 0]
// [8, 1, 0] -> [7, 2, 0]
// [5, 4, 0] -> [7, 1, 1]
// [7, 1, 1] -> [6, 2, 1]
// [4, 3, 2] -> [3, 3, 3]
// returns true if there was a next sequence, false if not
export function changeToNextDescendingSequenceWithSameSum(vals: number[]): boolean {
  // optimization of common case
  if(vals[1] + 1 < vals[0]) {
    vals[0]--;
    vals[1]++;
    return true;
  }
  // `i` is index we are hoping to increment
  for(let i = 2; i < vals.length; i++) {
    // can we increment at i?
    if(vals[i] < vals[i - 1] && vals[i] + 1 < vals[0]) {
      const commonVal = ++vals[i]; // then increment at i
      // and "lopside" everything before i; so vals[0] is big and vals[1..i-1] == vals[i]
      let val0Increment = -1;
      for(let j = 1; j < i; j++) {
        val0Increment += vals[j] - commonVal;
        vals[j] = commonVal;
      }
      vals[0] += val0Increment;
      return true;
    }
  }
  return false;
}

export function calcMultiRoundDamage(
  dmgsSingleRound: Map<number,number>,
  numRounds: number,
): Map<number, number>
{
  let dmgsCumulative = new Map<number,number>(dmgsSingleRound);

  // eslint-disable-next-line
  for(let _ of range(numRounds - 1)) {
    dmgsCumulative = combineDmgProbs(dmgsCumulative, dmgsSingleRound);
  }

  return dmgsCumulative;
}

// Multi-round damage when SaintlyRelics is active: the relic may ignore one attack dice per
// round (per action) but only two across the whole battle. That battle cap couples the rounds,
// so a plain convolution (which would let every round ignore) overstates mitigation. We convolve
// while tracking how many ignores have been spent, switching a round to the relic-unavailable
// distribution once the cap is reached.
//   on0: one round, relic available, NO ignore spent (full damage)
//   on1: one round, relic available, ONE ignore spent (reduced damage)
//   off: one round, relic unavailable because the battle cap is already spent
export function calcCappedMultiRoundDamage(
  on0: Map<number,number>,
  on1: Map<number,number>,
  off: Map<number,number>,
  numRounds: number,
  maxIgnores: number,
): Map<number, number>
{
  // state[j] = cumulative-damage distribution given j ignores already spent (j up to maxIgnores)
  let state: Map<number,number>[] = [];
  for(let j = 0; j <= maxIgnores; j++) {
    state.push(new Map<number,number>());
  }
  state[0].set(0, 1);

  for(let round = 0; round < numRounds; round++) {
    const next: Map<number,number>[] = [];
    for(let j = 0; j <= maxIgnores; j++) {
      next.push(new Map<number,number>());
    }

    for(let j = 0; j <= maxIgnores; j++) {
      const cur = state[j];
      if(cur.size === 0) {
        continue;
      }

      if(j < maxIgnores) {
        // relic still available this round: spend 0 ignores (on0) or 1 ignore (on1)
        for(const [dmg, prob] of cur) {
          for(const [d0, p0] of on0) {
            addToMapValue(next[j], dmg + d0, prob * p0);
          }
          for(const [d1, p1] of on1) {
            addToMapValue(next[j + 1], dmg + d1, prob * p1);
          }
        }
      }
      else {
        // battle cap already spent: this round cannot ignore anything
        for(const [dmg, prob] of cur) {
          for(const [dOff, pOff] of off) {
            addToMapValue(next[j], dmg + dOff, prob * pOff);
          }
        }
      }
    }
    state = next;
  }

  const combined = new Map<number,number>();
  for(const dmgMap of state) {
    addMapValues(combined, dmgMap);
  }
  return combined;
}

export function combineDmgProbs(
  dmgToProb1: Map<number,number>,
  dmgToProb2: Map<number,number>,
): Map<number, number>
{
  const dmgToProbCombined = new Map<number,number>();

  for(let [dmg1, prob1] of dmgToProb1) {
    for(let [dmg2, prob2] of dmgToProb2) {
      addToMapValue(dmgToProbCombined, dmg1 + dmg2, prob1 * prob2);
    }
  }

  return dmgToProbCombined;
}

export function applyPostRollModifications(
  crits: number,
  norms: number,
  fails: number,
  additionalCrits: number,
  additionalNorms: number,
  failsToNorms: number,
  normsToCrits: number,
  abilities: Set<Ability>,
  normDmg: number = 0,
  critDmgPlusMwx: number = 0,
): { crits: number; norms: number } {
  crits += additionalCrits;
  const accurateNorms = additionalNorms;
  norms += additionalNorms;

  if (abilities.has(Ability.Punishing) && !abilities.has(Ability.ObscuredTarget)) {
    if (crits > 0 && fails > 0) {
      norms++;
      fails--;
    }
  }

  if (abilities.has(Ability.PuritySeal) || abilities.has(Ability.Indomitus)) {
    if (fails >= 2) {
      norms++;
      fails -= 2;
    }
  }

  if (abilities.has(Ability.FailToNormIfAtLeastTwoSuccesses)) {
    if (crits + norms >= 2 && fails > 0) {
      norms++;
      fails--;
    }
  }

  if (abilities.has(Ability.NormToCritIfAtLeastTwoNorms)) {
    if (norms >= 2) {
      crits++;
      norms--;
    }
  }

  const actualFailToNormPromotions = Math.min(failsToNorms, fails);
  norms += actualFailToNormPromotions;
  fails -= actualFailToNormPromotions;

  // Track if Severe triggered - Punishing and Rending don't work with Severe
  let severeTriggered = false;
  if (abilities.has(Ability.Severe)) {
    if (norms > 0 && crits === 0) {
      crits++;
      norms--;
      severeTriggered = true;
    }
  }

  const actualNormToCritPromotions = Math.min(normsToCrits, norms);
  crits += actualNormToCritPromotions;
  norms -= actualNormToCritPromotions;

  // MysticScryBuff: retain one fail as a norm, OR one norm as a crit (attacker's choice). The choice is
  // damage-dependent and interacts with Rending (a fresh crit can seed a Rending upgrade; conversely
  // an added norm gives Rending more to promote), so rather than a fixed rule we resolve each option
  // through the remaining steps (Rending, then Obscured) and keep whichever yields the most damage.
  // Saves/Px are not modeled here, matching the attack-only, damage-first heuristics used elsewhere.
  if (abilities.has(Ability.MysticScryBuff)) {
    const dmgOf = (c: number, n: number) => c * critDmgPlusMwx + n * normDmg;
    // Candidates in preference order; the strict-greater pick below keeps the first on ties. Order the
    // crit upgrade ahead of the fail upgrade so a damage tie resolves to the crit, which is strictly
    // better against any real defender (its Devastating/mwx portion bypasses saves, it triggers Piercing,
    // and it eats fewer Feel No Pain rolls). A beneficial upgrade still beats declining.
    const candidates: Array<{ crits: number; norms: number }> = [];
    if (norms > 0) candidates.push({ crits: crits + 1, norms: norms - 1 }); // retain a norm as a crit
    if (fails > 0) candidates.push({ crits, norms: norms + 1 });   // retain a fail as a norm
    candidates.push({ crits, norms });                             // decline (the buff is optional)

    let best: { crits: number; norms: number } | null = null;
    let bestDmg = -Infinity;
    for (const cand of candidates) {
      const finished = finishRendingAndObscured(cand.crits, cand.norms, accurateNorms, severeTriggered, abilities);
      const dmg = dmgOf(finished.crits, finished.norms);
      if (dmg > bestDmg) {
        bestDmg = dmg;
        best = finished;
      }
    }
    return best!;
  }

  return finishRendingAndObscured(crits, norms, accurateNorms, severeTriggered, abilities);
}

// The damage-affecting tail shared by every roll: Rending promotes a rolled norm to a crit when a
// crit is present (but not after Severe, and never an Accurate-retained norm), then ObscuredTarget
// (if the defender has it) collapses crits into norms and discards one success.
function finishRendingAndObscured(
  crits: number,
  norms: number,
  accurateNorms: number,
  severeTriggered: boolean,
  abilities: Set<Ability>,
): { crits: number; norms: number } {
  // Rending doesn't work if Severe triggered (per KT2024 rules)
  // Rending also cannot upgrade normals retained from Accurate (only rolled normals)
  if (abilities.has(Ability.Rending) && !severeTriggered) {
    const rollableNorms = Math.max(0, norms - accurateNorms);
    if (crits > 0 && rollableNorms > 0) {
      crits++;
      norms--;
    }
  }

  if (abilities.has(Ability.ObscuredTarget)) {
    norms = Math.max(0, norms + crits - 1);
    crits = 0;
  }

  return { crits, norms };
}
