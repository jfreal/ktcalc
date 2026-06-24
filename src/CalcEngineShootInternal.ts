import Model from "src/Model";
import * as Util from 'src/Util';
import FinalDiceProb from 'src/FinalDiceProb';
import * as Common from 'src/CalcEngineCommon';
import Ability from "src/Ability";
import { MinCritDmgAfterDurable } from "./KtMisc";
import { relicIgnoreProb } from "src/SaintlyRelics";

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

  // ObscuredTarget is a defender-side flag that modifies the attacker's dice
  // (calcFinalDiceProbsForAttacker merges it into the attacker's ability set).
  // It must not be applied to the defender's own save dice, where the shared
  // applyPostRollModifications would discard save successes.
  const defenderAbilitiesForSaves = new Set(defender.abilities);
  defenderAbilitiesForSaves.delete(Ability.ObscuredTarget);

  const defenderFinalDiceProbs = Common.calcFinalDiceProbs(
    defenderSingleDieProbs,
    numDefDiceWithoutPx,
    defender.reroll,
    defender.autoCrits,
    defender.autoNorms,
    defender.failsToNorms,
    defender.normsToCrits,
    defenderAbilitiesForSaves,
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
      defender.failsToNorms,
      defender.normsToCrits,
      defenderAbilitiesForSaves,
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
    // roll FNP once per surviving hit; each success subtracts 1 damage; clamp at 0
    for(let successes = 0; successes <= numHits; successes++) {
      const postFnpDmg = Math.max(0, damage - successes);
      if(skipZeroDamage && postFnpDmg <= 0) continue;
      const fnpProb = Util.binomialPmf(numHits, successes, probFnpSuccess);
      Util.addToMapValue(postFnpDmgs, postFnpDmg, prob * fnpProb);
    }
  });

  return postFnpDmgs;
}


export interface DamageResult {
  damage: number;
  numHits: number; // damage-causing hits / FNP-relevant hit instances; includes cancelled crits when MWx contributed damage
  survivingCritHits: number; // crit hits left after saves (each dealing critDmg); SaintlyRelics targets these
  survivingNormHits: number; // norm hits left after saves (each dealing normDmg); SaintlyRelics targets these
}

// One post-SaintlyRelics damage possibility for a single attack/defense scenario.
export interface DamageOutcome {
  damage: number;
  numHits: number;
  prob: number; // conditional probability within the scenario (sums to 1 across outcomes)
  ignored: boolean; // whether this outcome spent the relic to ignore an attack dice
}

export function calcDamage(
  attacker: Model,
  defender: Model,
  critHits: number,
  normHits: number,
  critSaves: number,
  normSaves: number,
): DamageResult {
  const originalCritHits = critHits;
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
  // surviving hits get FNP rolls; cancelled crits still count if MWx contributed dmg
  const mwxCancelledCrits = attacker.mwx > 0 ? (originalCritHits - critHits) : 0;
  const numHits = critHits + normHits + mwxCancelledCrits;

  // TODO: make the above decisions take Durable into account
  if(defender.has(Ability.Durable) && attacker.critDmg > MinCritDmgAfterDurable && critHits > 0) {
    damage -= 1;
  }

  return { damage, numHits, survivingCritHits: critHits, survivingNormHits: normHits };
}

// SaintlyRelics: whenever an attack dice would inflict damage, the defender may roll to ignore
// that dice's damage entirely (1 D6 normal, 2 D6 inspiring; ignore on any 6), at most one dice
// per action. Optimal play targets the highest-damage surviving hit (crits before norms) and,
// because a failed roll doesn't consume the once-per-action cap, keeps trying on the next
// damaging dice until one is ignored. This expands a scenario's single damage value into a small
// distribution over "ignored the biggest hit", "ignored the next-biggest", ..., and "ignored
// nothing". MWx (mortal) damage is not ignored here, matching Just a Scratch.
export function calcRelicsOutcomes(
  result: DamageResult,
  attacker: Model,
  mode: number,
): DamageOutcome[] {
  // ignoreProb is 0 for off/unknown modes; the general loop below then produces no ignore
  // outcomes and returns the single unchanged outcome, so no separate off-branch is needed.
  const ignoreProb = relicIgnoreProb(mode);
  const missProb = 1 - ignoreProb; // one attempt failing to ignore

  // Damaging-dice groups, biggest per-die damage first (the order a player would target them).
  // A crit also carries MWx (mortal) damage, which relics does NOT ignore; when present, the
  // ignored crit still deals that residual damage, so it must keep its Feel No Pain roll.
  const groups: { count: number; dieDmg: number; keepsFnpRoll: boolean }[] = [];
  if (result.survivingCritHits > 0 && attacker.critDmg > 0) {
    groups.push({ count: result.survivingCritHits, dieDmg: attacker.critDmg, keepsFnpRoll: attacker.mwx > 0 });
  }
  if (result.survivingNormHits > 0 && attacker.normDmg > 0) {
    groups.push({ count: result.survivingNormHits, dieDmg: attacker.normDmg, keepsFnpRoll: false });
  }
  groups.sort((a, b) => b.dieDmg - a.dieDmg);

  const outcomes: DamageOutcome[] = [];
  let reachProb = 1; // probability no earlier (bigger) group already used up the once-per-action ignore
  for (const group of groups) {
    const stayProb = Math.pow(missProb, group.count); // every roll in this group fails to ignore
    // ignore lands in this group iff every bigger group missed and at least one of this group's rolls hits
    const ignoreInGroupProb = reachProb * (1 - stayProb);
    if (ignoreInGroupProb > 0) {
      outcomes.push({
        damage: Math.max(0, result.damage - group.dieDmg),
        // drop this hit's FNP roll only if its whole damage is gone; a crit's residual MWx keeps it
        numHits: group.keepsFnpRoll ? result.numHits : Math.max(0, result.numHits - 1),
        prob: ignoreInGroupProb,
        ignored: true,
      });
    }
    reachProb *= stayProb;
  }
  if (reachProb > 0) {
    outcomes.push({ damage: result.damage, numHits: result.numHits, prob: reachProb, ignored: false });
  }
  return outcomes;
}
