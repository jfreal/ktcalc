import Model from "src/Model";
import * as Util from 'src/Util';
import FinalDiceProb from 'src/FinalDiceProb';
import * as Common from 'src/CalcEngineCommon';
import Ability from "src/Ability";
import { MinCritDmgAfterDurable } from "./KtMisc";

class DefenderFinalDiceStuff {
  public finalDiceProbs: FinalDiceProb[];
  public finalDiceProbsWithPx: FinalDiceProb[];
  public pxIsRelevant: boolean;

  public constructor(
    finalDiceProbs: FinalDiceProb[],
    finalDiceProbsWithPx: FinalDiceProb[],
    pxIsRelevant: boolean,
  )
  {
    this.finalDiceProbs = finalDiceProbs;
    this.finalDiceProbsWithPx = finalDiceProbsWithPx;
    this.pxIsRelevant = pxIsRelevant;
  }
}

export function calcDefenderFinalDiceStuff(
  defender: Model,
  attacker: Model,
): DefenderFinalDiceStuff
{
  const defenderSingleDieProbs = defender.toDefenderDieProbs();

  const numDefDiceWithoutPx = Math.max(0, defender.numDice - attacker.apx);

  const defenderFinalDiceProbs = Common.calcFinalDiceProbs(
    defenderSingleDieProbs,
    numDefDiceWithoutPx,
    defender.reroll,
    defender.autoCrits,
    defender.autoNorms,
    defender.failsToNorms,
    defender.normsToCrits,
    defender.abilities,
    );

  let defenderFinalDiceProbsWithPx: FinalDiceProb[] = [];

  // if APx > Px, then ignore Px
  const effectivePx = attacker.apx >= attacker.px ? 0 : attacker.px;
  const pxIsRelevant = effectivePx > 0;

  // for Px triggered and relevant
  if (pxIsRelevant) {
    const numDefDiceWithPx = Math.max(0, defender.numDice - effectivePx);

    defenderFinalDiceProbsWithPx = Common.calcFinalDiceProbs(
      defenderSingleDieProbs,
      numDefDiceWithPx,
      defender.reroll,
      defender.autoCrits,
      defender.autoNorms,
      defender.normsToCrits,
    );
  }

  return new DefenderFinalDiceStuff(
    defenderFinalDiceProbs,
    defenderFinalDiceProbsWithPx,
    pxIsRelevant,
  );
}

export function calcPostFnpDamages(
  fnp: number,
  preFnpDmgs: Map<string,number>, // key = "damage,numHits"
  skipZeroDamage: boolean = true,
): Map<number,number>
{
  const postFnpDmgs = new Map<number,number>();
  const probFnpSuccess = (7 - fnp) / 6; // prob of passing FNP roll (reducing 1 dmg)

  preFnpDmgs.forEach((prob, key) => {
    const [damage, numHits] = key.split(',').map(Number);
    // roll FNP once per surviving hit; each success subtracts 1 damage
    const maxSuccesses = Math.min(numHits, damage - (skipZeroDamage ? 1 : 0));
    for(let successes = 0; successes <= maxSuccesses; successes++) {
      const postFnpDmg = damage - successes;
      if(skipZeroDamage && postFnpDmg <= 0) continue;
      const fnpProb = Util.binomialPmf(numHits, successes, probFnpSuccess);
      Util.addToMapValue(postFnpDmgs, postFnpDmg, prob * fnpProb);
    }
  });

  return postFnpDmgs;
}


export interface DamageResult {
  damage: number;
  numHits: number; // surviving hits after saves (for FNP rolls)
}

export function calcDamage(
  attacker: Model,
  defender: Model,
  critHits: number,
  normHits: number,
  critSaves: number,
  normSaves: number,
): DamageResult {
  let damage = critHits * attacker.mwx;
  const numNormalSavesToCancelCritHit = 2; // for Kill Team rules, not Fire Team rules

  function critSavesCancelCritHits() {
    const numCancels = Math.min(critSaves, critHits);
    critSaves -= numCancels;
    critHits -= numCancels;
  }
  function critSavesCancelNormHits() {
    const numCancels = Math.min(critSaves, normHits);
    critSaves -= numCancels;
    normHits -= numCancels;
  }
  function normSavesCancelNormHits() {
    const numCancels = Math.min(normSaves, normHits);
    normSaves -= numCancels;
    normHits -= numCancels;
  }
  function normSavesCancelCritHits() {
    const numCancels = Math.min((normSaves / numNormalSavesToCancelCritHit) >> 0, critHits);
    normSaves -= numCancels * numNormalSavesToCancelCritHit;
    critHits -= numCancels;
  }

  if (defender.has(Ability.JustAScratch)) {
    if (critHits > 0) {
      critHits--;
    } else if (normHits > 0) {
      normHits--;
    }
  }

  if (defender.has(Ability.JustAScratchNorms)) {
    if (normHits > 0) {
      normHits--;
    }
  }

  if (attacker.critDmg >= attacker.normDmg) {
    critSavesCancelCritHits();
    critSavesCancelNormHits();

    if (attacker.critDmg > 2 * attacker.normDmg) {
      normSavesCancelCritHits();
      normSavesCancelNormHits();
    }
    else {
      // with norm saves, you prefer to cancel norm hits, but you want to avoid
      // cancelling all norm hits and being left over with >=1 crit hit and 1 normal save;
      // in that case, you should have cancelled 1 crit hit before cancelling norm hits;
      if (normSaves > normHits && normSaves >= numNormalSavesToCancelCritHit && critHits > 0) {
        normSaves -= numNormalSavesToCancelCritHit;
        critHits--;
      }

      normSavesCancelNormHits();
      normSavesCancelCritHits();
    }
  }
  else {
    normSavesCancelNormHits();
    critSavesCancelNormHits();
    critSavesCancelCritHits();
    normSavesCancelCritHits();
  }

  damage += critHits * attacker.critDmg + normHits * attacker.normDmg;
  const numHits = critHits + normHits;

  // TODO: make the above decisions take Durable into account
  if(defender.has(Ability.Durable) && attacker.critDmg > MinCritDmgAfterDurable && critHits > 0) {
    damage -= 1;
  }

  return { damage, numHits };
}
