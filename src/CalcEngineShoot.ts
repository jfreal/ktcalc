import Model from "src/Model";
import * as Util from 'src/Util';
import FinalDiceProb from 'src/FinalDiceProb';
import * as Common from 'src/CalcEngineCommon';
import ShootOptions from "src/ShootOptions";
import {
  calcDamage,
  calcDefenderFinalDiceStuff,
  calcPostFnpDamages,
} from 'src/CalcEngineShootInternal'

export function calcDmgProbs(
  attacker: Model,
  defender: Model,
  shootOptions: ShootOptions = new ShootOptions(),
): Map<number, number> // damage to prob
{
  const attackerFinalDiceProbs = Common.calcFinalDiceProbsForAttacker(attacker, defender);
  const defenderStuff = calcDefenderFinalDiceStuff(defender, attacker);

  // don't add damage=0 stuff until just before multi-round handling
  let damageToProb = new Map<number, number>();
  // for FNP: track (damage,numHits) pairs to know how many FNP rolls to make
  const damageHitsToProb = new Map<string, number>();
  const usesFnp = defender.usesFnp();

  function addAtkDefScenario(
    atk: FinalDiceProb,
    def: FinalDiceProb,
  ): void {
    const currProb = atk.prob * def.prob;

    const result = calcDamage(
      attacker,
      defender,
      atk.crits,
      atk.norms,
      def.crits,
      def.norms);

    if (result.damage > 0) {
      if (usesFnp) {
        const key = `${result.damage},${result.numHits}`;
        Util.addToMapValue(damageHitsToProb, key, currProb);
      } else {
        Util.addToMapValue(damageToProb, result.damage, currProb);
      }
    }
  }

  for (const atk of attackerFinalDiceProbs) {
    if (atk.crits + atk.norms > 0) {
      if (defenderStuff.pxIsRelevant && atk.crits > 0) {
        for (const def of defenderStuff.finalDiceProbsWithPx) {
          addAtkDefScenario(atk, def);
        }
      }
      else {
        for (const def of defenderStuff.finalDiceProbs) {
          addAtkDefScenario(atk, def);
        }
      }
    }
  }

  if(usesFnp) {
    damageToProb = calcPostFnpDamages(defender.fnp, damageHitsToProb);
  }

  Util.fillInProbForZero(damageToProb);

  if(shootOptions.numRounds > 1) {
    damageToProb = Common.calcMultiRoundDamage(damageToProb, shootOptions.numRounds);
  }

  return damageToProb;
}