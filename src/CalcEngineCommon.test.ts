import DieProbs from 'src/DieProbs';
import FinalDiceProb from 'src/FinalDiceProb';
import * as Common from 'src/CalcEngineCommon';
import Ability from 'src/Ability';
import Model from 'src/Model';
import { calcMultiRoundDamage } from 'src/CalcEngineCommon';
import { hitScorerForDefender } from 'src/CalcEngineShootInternal';
import { weightedAverage } from 'src/Util';

export const requiredPrecision = 10;

describe(Common.calcMultiRollProb.name, () => {
  // using >=1 probabilities so we can have prime factors and not worry about rounding errors
  const pc = 7; // crit probability
  const pn = 11; // norm probability
  const pf = 13; // fail probability
  const dp = new DieProbs(pc, pn, pf);
  it('{0c,0n,1f} => pf^1', () => {
    expect(Common.calcMultiRollProb(dp, 0, 0, 1)).toBe(pf);
  });
  it('{0c,3n,0f} => pn^3', () => {
    expect(Common.calcMultiRollProb(dp, 0, 3, 0)).toBe(Math.pow(pn, 3));
  });
  it('{3c,0n,0f} * pn * 3 = {2c,1n,0f} * pc', () => {
    expect(Common.calcMultiRollProb(dp, 3, 0, 0) * pn * 3)
      .toBe(Common.calcMultiRollProb(dp, 2, 1, 0) * pc);
  });
  it('{1c,1n,1f} => pc*pn*pf*(3!)', () => {
    expect(Common.calcMultiRollProb(dp, 1, 1, 1)).toBe(pc * pn * pf * 6);
  });
});

function expectClose(
  actual: FinalDiceProb,
  expectedProb: number,
  expectedCrits?: number,
  expectedNorms?: number,
  ): void {
  if(expectedCrits !== undefined) {
    expect(actual.crits).toEqual(expectedCrits);
  }
  if(expectedNorms !== undefined) {
    expect(actual.norms).toEqual(expectedNorms);
  }
  expect(actual.prob).toBeCloseTo(expectedProb, requiredPrecision)
}

describe(calcMultiRoundDamage.name, () => {
  it('rounds=1 means no change', () => {
    const dmgsSingleRound = new Map<number, number>([
      [0, 0.5],
      [10, 0.375],
      [100, 0.125],
    ]);
    const dmgsMultiRound = calcMultiRoundDamage(dmgsSingleRound, 1);
    expect(dmgsMultiRound).toStrictEqual(dmgsSingleRound);
  });
  it('rounds=2', () => {
    const [d0, d3, d6] = [0,   3,   6];
    const [p0, p3, p6] = [0.5, 0.25, 0.25];
    const dmgsSingleRound = new Map<number, number>([
      [d0, p0],
      [d3, p3],
      [d6, p6],
    ]);
    const numRounds = 2;
    const dmgsMultiRound = calcMultiRoundDamage(dmgsSingleRound, numRounds);

    expect(dmgsMultiRound.get(d0)).toBeCloseTo(p0 * p0, requiredPrecision);
    expect(dmgsMultiRound.get(d3)).toBeCloseTo(p0 * p3 * 2, requiredPrecision);
    expect(dmgsMultiRound.get(d6)).toBeCloseTo(p0 * p6 * 2 + p3 * p3, requiredPrecision);
    expect(dmgsMultiRound.get(d3 + d6)).toBeCloseTo(p3 * p6 * 2, requiredPrecision);
    expect(dmgsMultiRound.get(d6 + d6)).toBeCloseTo(p6 * p6, requiredPrecision);
    expect(dmgsMultiRound.size).toBe(5);

    expect(weightedAverage(dmgsMultiRound))
      .toBeCloseTo(weightedAverage(dmgsSingleRound) * numRounds, requiredPrecision);
  });
  it('rounds=3', () => {
    const [d0, d3, d6] = [0,   3,   6];
    const [p0, p3, p6] = [0.5, 0.25, 0.25];
    const dmgsSingleRound = new Map<number, number>([
      [d0, p0],
      [d3, p3],
      [d6, p6],
    ]);
    const numRounds = 3;
    const dmgsMultiRound = calcMultiRoundDamage(dmgsSingleRound, numRounds);

    expect(dmgsMultiRound.get(d0)).toBeCloseTo(p0 * p0 * p0, requiredPrecision);
    expect(dmgsMultiRound.get(d3)).toBeCloseTo(p0 * p0 * p3 * 3, requiredPrecision);
    expect(dmgsMultiRound.get(d6)).toBeCloseTo(p0 * p3 * p3 * 3 + p0 * p0 * p6 * 3, requiredPrecision);
    expect(dmgsMultiRound.get(d3 + d6)).toBeCloseTo(p0 * p3 * p6 * 6 + p3 * p3 * p3, requiredPrecision);
    expect(dmgsMultiRound.get(d6 + d6)).toBeCloseTo(p0 * p6 * p6 * 3 + p3 * p3 * p6 * 3, requiredPrecision);
    expect(dmgsMultiRound.get(d6 + d6 + d3)).toBeCloseTo(p3 * p6 * p6 * 3, requiredPrecision);
    expect(dmgsMultiRound.get(d6 + d6 + d6)).toBeCloseTo(p6 * p6 * p6, requiredPrecision);
    expect(dmgsMultiRound.size).toBe(7);

    expect(weightedAverage(dmgsMultiRound))
      .toBeCloseTo(weightedAverage(dmgsSingleRound) * numRounds, requiredPrecision);
  });
});

describe(Common.calcFinalDiceProb.name, () => {
  const pc = 1 / 6; // crit probability
  const pn = 3 / 6; // norm probability
  const pf = 2 / 6; // fail probability
  const dieProbs = new DieProbs(pc, pn, pf);

  // only for OnesPlusBalanced
  const pcOnes = pc * 7 / 6;
  const pnOnes = pn * 7 / 6;
  const pfOnes = 1 - pcOnes - pnOnes;
  const dieProbsOnes = new DieProbs(pcOnes, pnOnes, pfOnes);
  const p1 = 1 / 6; // fail that can be rerolled by Ones
  const p2 = pf - 1 / 6; // fail that can not be rerolled by Ones

  const justRending = new Set<Ability>([Ability.Rending]);
  const justPunishing = new Set<Ability>([Ability.Punishing]);
  const justMysticScryBuff = new Set<Ability>([Ability.MysticScryBuff]);
  const rendingAndMysticScryBuff = new Set<Ability>([Ability.Rending, Ability.MysticScryBuff]);

  it('basic', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 1, 0, 0, Ability.None);
    expectClose(actual, pc, 1, 0);
  });
  it('basic balanced 1c', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 1, 0, 0, Ability.Balanced);
    expectClose(actual, pc + pf * pc, 1, 0);
  });
  it('basic balanced 1n', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 0, 1, 0, Ability.Balanced);
    expectClose(actual, pn + pf * pn, 0, 1);
  });
  it('basic balanced 1f', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 0, 0, 1, Ability.Balanced);
    expectClose(actual, pf * pf, 0, 0);
  });
  it('double balanced 1c', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 1, 0, 0, Ability.DoubleBalanced);
    expectClose(actual, pc + pf * pc);
  });
  it('double balanced 1f', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 0, 0, 1, Ability.DoubleBalanced);
    expectClose(actual, pf * pf);
  });
  it('double balanced 2c', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 2, 0, 0, Ability.DoubleBalanced);
    expectClose(actual, pc*pc + 2*pc*pf*pc + pf*pf*pc*pc);
  });
  it('double balanced 2f', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 0, 0, 2, Ability.DoubleBalanced);
    expectClose(actual, pf*pf*pf*pf);
  });
  it('double balanced {1c,1n}', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 1, 1, 0, Ability.DoubleBalanced);
    expectClose(actual, 2*pc*pn + 2*pc*pf*pn + 2*pn*pf*pc + pf*pf*2*pc*pn);
  });
  it('double balanced {3c}', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 3, 0, 0, Ability.DoubleBalanced);
    expectClose(actual, pc*pc*pc + 3*pc*pc*pf*pc + 3*pc*pf*pf*pc*pc);
  });
  it('double balanced {2c,1f}', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 2, 0, 1, Ability.DoubleBalanced);
    expectClose(actual, 3*pc*pc*pf*pf + 3*pc*pf*pf*2*pc*pf + pf*pf*pf*pc*pc);
  });
  it('basic OnesPlusBalanced 1c', () => {
    const actual = Common.calcFinalDiceProb(dieProbsOnes, 1, 0, 0, Ability.RerollOnesPlusBalanced);
    expectClose(actual, pc + pf * pc, 1, 0);
  });
  it('basic OnesPlusBalanced 1n', () => {
    const actual = Common.calcFinalDiceProb(dieProbsOnes, 0, 1, 0, Ability.RerollOnesPlusBalanced);
    expectClose(actual, pn + pf*pn, 0, 1);
  });
  it('basic OnesPlusBalanced 1f', () => {
    const actual = Common.calcFinalDiceProb(dieProbsOnes, 0, 0, 1, Ability.RerollOnesPlusBalanced);
    expectClose(actual, pf*pf, 0, 0);
  });
  it('OnesPlusBalanced 2c', () => {
    const actual = Common.calcFinalDiceProb(dieProbsOnes, 2, 0, 0, Ability.RerollOnesPlusBalanced);
    expectClose(actual, pc*pc + 2*pc*pc*pf + pc*pc*p1*p1 + 2*pc*pc*p1*p2, 2, 0);
  });
  it('OnesPlusBalanced 2f', () => {
    const actual = Common.calcFinalDiceProb(dieProbsOnes, 0, 0, 2, Ability.RerollOnesPlusBalanced);
    expectClose(actual, p1*p1*pf*pf + 2*p1*p1*pf*pf + p2*p2*pf, 0, 0);
  });
  it('rending {0c,1n,1f} => {0c,1n,1f}', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 0, 1, 1, Ability.None, 0, 0, 0, 0, justRending);
    expectClose(actual, pn * pf * 2, 0, 1);
  });
  it('rending {1c,0n,1f} => {1c,0n,1f}', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 1, 0, 1, Ability.None, 0, 0, 0, 0, justRending);
    expectClose(actual, pc * pf * 2, 1, 0);
  });
  it('rending {1c,1n,0f} => {2c,0n,0f}', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 1, 1, 0, Ability.None, 0, 0, 0, 0, justRending);
    expectClose(actual, pc * pn * 2, 2, 0);
  });
  it('rending {3c,3n,3f} => {4c,2n,3f}', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 3, 3, 3, Ability.None, 0, 0, 0, 0, justRending);
    const ways = 9 * 8 * 7 * 6 * 5 * 4 / (3 * 2 * 1) / (3 * 2 * 1); // 9!/(3!3!3!)
    expectClose(actual, ways * Math.pow(pc, 3) * Math.pow(pn, 3) * Math.pow(pf, 3), 4, 2);
  });
  it('starfire {0c,1n,1f} => {0c,1n,1f}', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 0, 1, 1, Ability.None, 0, 0, 0, 0, justPunishing);
    expect(actual).toStrictEqual(new FinalDiceProb(pn * pf * 2, 0, 1));
  });
  it('starfire {1c,0n,1f} => {1c,1n,0f}', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 1, 0, 1, Ability.None, 0, 0, 0, 0, justPunishing);
    expectClose(actual, pc * pf * 2, 1, 1);
  });
  it('starfire {1c,1n,0f} => {1c,1n,0f}', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 1, 1, 0, Ability.None, 0, 0, 0, 0, justPunishing);
    expectClose(actual, pc * pn * 2, 1, 1);
  });
  it('starfire {3c,3n,3f} => {3c,4n,2f}', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 3, 3, 3, Ability.None, 0, 0, 0, 0, justPunishing);
    expect(actual.crits).toBe(3);
    expect(actual.norms).toBe(4);
  });
  it('autoNormHits=1 + 1n => 2n', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 0, 1, 0, Ability.None, 0, 1,);
    expectClose(actual, pn, 0, 2);
  });
  it('rending with accurate: {1c,0n rolled,1n accurate} => {1c,1n} (accurate norm cannot be upgraded)', () => {
    // 1 crit rolled, 0 norms rolled, 1 norm from Accurate - Rending should NOT upgrade the accurate norm
    const actual = Common.calcFinalDiceProb(dieProbs, 1, 0, 0, Ability.None, 0, 1, 0, 0, justRending);
    expectClose(actual, pc, 1, 1);
  });
  it('rending with accurate: {1c,1n rolled,1n accurate} => {2c,1n} (only rolled norm upgraded)', () => {
    // 1 crit rolled, 1 norm rolled, 1 norm from Accurate - Rending upgrades the rolled norm only
    const actual = Common.calcFinalDiceProb(dieProbs, 1, 1, 0, Ability.None, 0, 1, 0, 0, justRending);
    expectClose(actual, pc * pn * 2, 2, 1);
  });

  // MysticScryBuff: retain one fail as a norm OR one norm as a crit (attacker's choice).
  // 11th/12th positional args are normDmg and critDmg+mwx; the choice maximizes damage.
  it('mysticScryBuff norm-favored {0c,1n,1f} => {0c,2n} (3/4 dmg: +norm beats +crit)', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 0, 1, 1, Ability.None, 0, 0, 0, 0, justMysticScryBuff, 3, 4);
    expectClose(actual, pn * pf * 2, 0, 2);
  });
  it('mysticScryBuff crit-favored {0c,1n,1f} => {1c,0n} (3/8 dmg: +crit beats +norm)', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 0, 1, 1, Ability.None, 0, 0, 0, 0, justMysticScryBuff, 3, 8);
    expectClose(actual, pn * pf * 2, 1, 0);
  });
  it('mysticScryBuff damage tie {0c,1n,1f} => {1c,0n} (3/6 dmg: tie breaks to the crit)', () => {
    // fail->norm {0c,2n} and norm->crit {1c,0n} both score 6; the crit wins (mwx bypasses saves, triggers Px).
    const actual = Common.calcFinalDiceProb(dieProbs, 0, 1, 1, Ability.None, 0, 0, 0, 0, justMysticScryBuff, 3, 6);
    expectClose(actual, pn * pf * 2, 1, 0);
  });
  it('mysticScryBuff norm-favored but no fail {1c,1n,0f} => {2c,0n} (only crit upgrade available)', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 1, 1, 0, Ability.None, 0, 0, 0, 0, justMysticScryBuff, 3, 4);
    expectClose(actual, pc * pn * 2, 2, 0);
  });
  it('mysticScryBuff crit-favored but no norm {0c,0n,2f} => {0c,1n} (only fail->norm available)', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 0, 0, 2, Ability.None, 0, 0, 0, 0, justMysticScryBuff, 3, 8);
    expectClose(actual, pf * pf, 0, 1);
  });
  it('mysticScryBuff nothing to upgrade {1c,0n,0f} => {1c,0n}', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 1, 0, 0, Ability.None, 0, 0, 0, 0, justMysticScryBuff, 3, 4);
    expectClose(actual, pc, 1, 0);
  });
  // Rending synergy: even at 3/4 dmg (where +norm beats +crit in isolation), the choice flips when
  // it changes what Rending can do afterward. These two cases are the worked examples on the
  // /notes/mystic-scry-buff explainer page (Case A: seed a crit; Case B: feed Rending a norm).
  it('mysticScryBuff + rending {1c,1n,1f} => {2c,1n} (add a norm so Rending still has one to promote)', () => {
    // fail->norm gives {1c,2n}; Rending promotes one -> {2c,1n}=11. norm->crit gives {2c,0n}=8. Pick fail->norm.
    const actual = Common.calcFinalDiceProb(dieProbs, 1, 1, 1, Ability.None, 0, 0, 0, 0, rendingAndMysticScryBuff, 3, 4);
    expectClose(actual, pc * pn * pf * 6, 2, 1);
  });
  it('mysticScryBuff + rending {0c,2n,0f} => {2c,0n} (seed the first crit so Rending can fire)', () => {
    // norm->crit gives {1c,1n}; Rending then promotes -> {2c,0n}=8. Declining leaves {0c,2n}=6. Pick norm->crit.
    const actual = Common.calcFinalDiceProb(dieProbs, 0, 2, 0, Ability.None, 0, 0, 0, 0, rendingAndMysticScryBuff, 3, 4);
    expectClose(actual, pn * pn, 2, 0);
  });

  // A dice can only be retained once, so "retain a normal success as a critical success instead"
  // rules (the normsToCrits input, Rending) can't touch a norm that was already retained: cover
  // saves / Accurate (never rolled) or a Punishing fail retention. Rules worded as *changing* a
  // success (Severe, Waaagh) still can, and spend a retained norm first so the rollable ones stay
  // available for the retain-style promotions that follow.
  const justSevere = new Set<Ability>([Ability.Severe]);
  const justWaaagh = new Set<Ability>([Ability.NormToCritIfAtLeastTwoNorms]);
  const severeAndWaaagh = new Set<Ability>([Ability.Severe, Ability.NormToCritIfAtLeastTwoNorms]);
  const severeWaaaghAndRending = new Set<Ability>([
    Ability.Severe, Ability.NormToCritIfAtLeastTwoNorms, Ability.Rending,
  ]);
  const punishingAndRending = new Set<Ability>([Ability.Punishing, Ability.Rending]);

  it('normsToCrits with accurate/cover: {0c,0n rolled,1n retained} => {0c,1n} (retained norm cannot be promoted)', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 0, 0, 0, Ability.None, 0, 1, 0, 1);
    expectClose(actual, 1, 0, 1);
  });
  it('normsToCrits with accurate/cover: {0c,1n rolled,1n retained} => {1c,1n} (only the rolled norm promotes)', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 0, 1, 0, Ability.None, 0, 1, 0, 1);
    expectClose(actual, pn, 1, 1);
  });
  it('normsToCrits with 2 promotions and 1 rolled + 1 retained norm => {1c,1n} (promotions cannot stack onto the retained norm)', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 0, 1, 0, Ability.None, 0, 1, 0, 2);
    expectClose(actual, pn, 1, 1);
  });
  it('normsToCrits with punishing {1c,0n,1f} => {1c,1n} (the Punishing norm is already retained)', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 1, 0, 1, Ability.None, 0, 0, 0, 1, justPunishing);
    expectClose(actual, pc * pf * 2, 1, 1);
  });
  it('punishing + rending {1c,0n,1f} => {1c,1n} (Rending cannot re-retain the Punishing norm)', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 1, 0, 1, Ability.None, 0, 0, 0, 0, punishingAndRending);
    expectClose(actual, pc * pf * 2, 1, 1);
  });
  it('severe + normsToCrits: {0c,1n rolled,1n retained} => {2c,0n} (Severe changes the retained norm)', () => {
    // Severe may change any normal success, so it takes the retained one; that leaves the rolled
    // norm for the normsToCrits retention. Taking the rolled norm instead would end at {1c,1n}.
    const actual = Common.calcFinalDiceProb(dieProbs, 0, 1, 0, Ability.None, 0, 1, 0, 1, justSevere);
    expectClose(actual, pn, 2, 0);
  });
  it('waaagh + normsToCrits: {0c,1n rolled,1n retained} => {2c,0n} (Waaagh promotes the retained norm)', () => {
    // Same ordering as Severe: Waaagh promotes rather than retains, so it spends the retained norm
    // and leaves the rolled one for normsToCrits.
    const actual = Common.calcFinalDiceProb(dieProbs, 0, 1, 0, Ability.None, 0, 1, 0, 1, justWaaagh);
    expectClose(actual, pn, 2, 0);
  });
  // Severe can fire only while no crit has been retained. Waaagh promotes a normal into a crit,
  // so running it first spends Severe's only window. With 3+ normals, Severe first still leaves
  // Waaagh two normals and both land. With exactly two, Severe would turn Waaagh off and the
  // orders tie, so Waaagh stays first. A crit already in hand keeps Severe off either way.
  it('waaagh + severe {0c,3n} => {2c,1n} (Severe before Waaagh, both fire)', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 0, 3, 0, Ability.None, 0, 0, 0, 0, severeAndWaaagh);
    expectClose(actual, pn * pn * pn, 2, 1);
  });
  it('waaagh + severe {0c,4n} => {2c,2n} (Severe before Waaagh, both fire)', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 0, 4, 0, Ability.None, 0, 0, 0, 0, severeAndWaaagh);
    expectClose(actual, pn * pn * pn * pn, 2, 2);
  });
  it('waaagh + severe {0c,2n} => {1c,1n} (either order; Waaagh stays first)', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 0, 2, 0, Ability.None, 0, 0, 0, 0, severeAndWaaagh);
    expectClose(actual, pn * pn, 1, 1);
  });
  it('waaagh + severe {1c,2n} => {2c,1n} (a crit already retained keeps Severe off)', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 1, 2, 0, Ability.None, 0, 0, 0, 0, severeAndWaaagh);
    expectClose(actual, pc * pn * pn * 3, 2, 1);
  });
  // Positive controls for the order choice. These already hold on main: Waaagh plus Rending
  // reaches the same counts. They fail if Severe-first forgets to block Rending, or if Severe
  // runs first on exactly two normals and turns both Waaagh and Rending off.
  it('waaagh + severe + rending {0c,3n} => {2c,1n} (Severe blocks Rending; Waaagh still fires)', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 0, 3, 0, Ability.None, 0, 0, 0, 0, severeWaaaghAndRending);
    expectClose(actual, pn * pn * pn, 2, 1);
  });
  it('waaagh + severe + rending {0c,2n} => {2c,0n} (Waaagh first, then Rending; Severe stays off)', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 0, 2, 0, Ability.None, 0, 0, 0, 0, severeWaaaghAndRending);
    expectClose(actual, pn * pn, 2, 0);
  });
  it('mysticScryBuff with only a retained norm {0c,0n,0f,1n retained} => {0c,1n} (nothing it may retain)', () => {
    // crit-favored damage (3/8), but the lone norm is already retained and there is no fail to take.
    const actual = Common.calcFinalDiceProb(dieProbs, 0, 0, 0, Ability.None, 0, 1, 0, 0, justMysticScryBuff, 3, 8);
    expectClose(actual, 1, 0, 1);
  });
  // Punishing is optional ("you CAN retain one of your fails as a normal success"), and taking it
  // is not always right: its norm is retained, so it cannot be promoted afterwards. When another
  // effect wants the same fail and would leave it promotable, declining wins.
  it('punishing declines when it would starve FailsToNorms + Rending {1c,0n,1f} => {2c,0n}', () => {
    // take: {1c,1n retained}, Rending blocked = 4+3 = 7. decline: FailsToNorms makes a promotable
    // norm, Rending promotes it = {2c,0n} = 8. The engine must pick the decline.
    const actual = Common.calcFinalDiceProb(dieProbs, 1, 0, 1, Ability.None, 0, 0, 1, 0, punishingAndRending, 3, 4);
    expectClose(actual, pc * pf * 2, 2, 0);
  });
  it('punishing is still taken when nothing else wants the fail {1c,0n,1f} => {1c,1n}', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 1, 0, 1, Ability.None, 0, 0, 0, 0, justPunishing, 3, 4);
    expectClose(actual, pc * pf * 2, 1, 1);
  });
  it('punishing is still taken on the defence path, where there is no damage to rank by', () => {
    // saves carry no damage numbers, so the fallback ranking (crit save = 2 norm saves) applies
    const actual = Common.calcFinalDiceProb(dieProbs, 1, 0, 1, Ability.None, 0, 0, 0, 0, justPunishing);
    expectClose(actual, pc * pf * 2, 1, 1);
  });

  it('mysticScryBuff + rending {1c,0n,1f} => {1c,1n} (the fail->norm retention is not Rending fodder)', () => {
    // fail->norm gives {1c,1n} where that norm is retained, so Rending cannot promote it: 4+3=7.
    // Declining leaves {1c,0n}=4 with nothing for Rending. Treating the new norm as rollable would
    // have wrongly produced {2c,0n}.
    const actual = Common.calcFinalDiceProb(dieProbs, 1, 0, 1, Ability.None, 0, 0, 0, 0, rendingAndMysticScryBuff, 3, 4);
    expectClose(actual, pc * pf * 2, 1, 1);
  });

  // Raw damage keeps two normals (6 > 4). One cover save and Piercing Crits 1 invert that:
  // the two normals lose one to the cover (3), while the crit turns Piercing on, the cover die
  // goes with the defence dice, and 4 gets through.
  it('mysticScryBuff {0c,1n,1f} => {1c,0n} when one cover save and Piercing Crits 1 beat two normals', () => {
    const atk = new Model(2, 4, 3, 4).setProp('px', 1).setAbility(Ability.MysticScryBuff, true);
    const def = new Model(1, 6).setProp('autoNorms', 1);
    const actual = Common.calcFinalDiceProb(
      dieProbs, 0, 1, 1, Ability.None, 0, 0, 0, 0, justMysticScryBuff, 3, 4,
      hitScorerForDefender(atk, def),
    );
    expectClose(actual, pn * pf * 2, 1, 0);
  });

  it('mysticScryBuff shoot distribution keeps that crit line', () => {
    // 2 dice at 2+, never crit. The 1-norm 1-fail roll is the only one whose raw score
    // (two normals) disagrees with damage after the cover save and Piercing Crits.
    const atk = new Model(2, 2, 3, 4).setProp('lethal', 7).setProp('px', 1)
      .setAbility(Ability.MysticScryBuff, true);
    const def = new Model(1, 6).setProp('autoNorms', 1);
    const probs = Common.calcFinalDiceProbsForAttacker(atk, def, hitScorerForDefender(atk, def));
    expect(probs.find(p => p.crits === 0 && p.norms === 2)).toBeUndefined();
    const critLine = probs.find(p => p.crits === 1 && p.norms === 0);
    expect(critLine).toBeDefined();
    expect(critLine!.prob).toBeCloseTo(2 * (5 / 6) * (1 / 6), requiredPrecision);
  });

  // Take locks a normal: raw 6+2=8 beats decline's two crits at 4. One normal save blocks that
  // normal and cannot block a crit, so declining deals 4 and taking deals 2.
  it('punishing declines {1c,0n,1f} => {2c,0n} when one normal save inverts the raw scores', () => {
    const atk = new Model(2, 6, 6, 2).setProp('failsToNorms', 1)
      .setAbility(Ability.Punishing, true)
      .setAbility(Ability.Rending, true);
    const def = new Model(1).withAlwaysNorm();
    const actual = Common.calcFinalDiceProb(
      dieProbs, 1, 0, 1, Ability.None, 0, 0, 1, 0, punishingAndRending, 6, 2,
      hitScorerForDefender(atk, def),
    );
    expectClose(actual, pc * pf * 2, 2, 0);
  });

  // Severe and Rending are optional ("you can"). Converting is kept when the crit is worth
  // at least as much (the 3/4 cases, and the no-damage defence fallback). It is declined when
  // the normal deals strictly more. Devastating is part of the crit's value. On a shoot,
  // scoreHits can flip the call back once saves or Piercing Crits are in play. Severe still
  // blocks Rending on the line where it fires.
  const severeAndRending = new Set<Ability>([Ability.Severe, Ability.Rending]);

  it('severe {0c,1n} => {0c,1n} when the normal outscores the crit (5/3)', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 0, 1, 0, Ability.None, 0, 0, 0, 0, justSevere, 5, 3);
    expectClose(actual, pn, 0, 1);
  });
  it('severe {0c,2n} => {0c,2n} (two normals stay 10, not 1 crit + 1 normal = 8)', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 0, 2, 0, Ability.None, 0, 0, 0, 0, justSevere, 5, 3);
    expectClose(actual, pn * pn, 0, 2);
  });
  it('severe {0c,1n} => {1c,0n} at 3/4, where the crit is better', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 0, 1, 0, Ability.None, 0, 0, 0, 0, justSevere, 3, 4);
    expectClose(actual, pn, 1, 0);
  });
  it('severe {0c,2n} => {1c,1n} at 3/4, where the crit is better', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 0, 2, 0, Ability.None, 0, 0, 0, 0, justSevere, 3, 4);
    expectClose(actual, pn * pn, 1, 1);
  });
  it('severe is still taken on the defence path, where there is no damage to rank by', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 0, 1, 0, Ability.None, 0, 0, 0, 0, justSevere);
    expectClose(actual, pn, 1, 0);
  });
  it('severe {0c,1n} => {1c,0n} when Devastating makes the crit worth more (5 vs 3+3)', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 0, 1, 0, Ability.None, 0, 0, 0, 0, justSevere, 5, 6);
    expectClose(actual, pn, 1, 0);
  });
  it('rending {1c,1n} => {1c,1n} when the normal outscores the crit (8, not 6)', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 1, 1, 0, Ability.None, 0, 0, 0, 0, justRending, 5, 3);
    expectClose(actual, pc * pn * 2, 1, 1);
  });
  it('rending {1c,1n} => {2c,0n} at 3/4, where the crit is better', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 1, 1, 0, Ability.None, 0, 0, 0, 0, justRending, 3, 4);
    expectClose(actual, pc * pn * 2, 2, 0);
  });
  it('rending {1c,1n} => {2c,0n} when Devastating makes two crits worth more (5 vs 3+3)', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 1, 1, 0, Ability.None, 0, 0, 0, 0, justRending, 5, 6);
    expectClose(actual, pc * pn * 2, 2, 0);
  });
  it('severe + rending {0c,2n} => {1c,1n} at 3/4 (Severe fires and blocks Rending)', () => {
    // Taking Severe leaves {1c,1n}=7 and blocks Rending. Two crits would be 8, but that line
    // is illegal. Declining leaves {0c,2n}=6, and Rending cannot fire without a crit.
    const actual = Common.calcFinalDiceProb(dieProbs, 0, 2, 0, Ability.None, 0, 0, 0, 0, severeAndRending, 3, 4);
    expectClose(actual, pn * pn, 1, 1);
  });
  it('severe + rending {0c,2n} => {0c,2n} at 5/3 (decline Severe; Rending has no crit)', () => {
    const actual = Common.calcFinalDiceProb(dieProbs, 0, 2, 0, Ability.None, 0, 0, 0, 0, severeAndRending, 5, 3);
    expectClose(actual, pn * pn, 0, 2);
  });
  it('waaagh + severe {0c,3n} => {1c,2n} at 5/3 (declining Severe leaves the better Waaagh line)', () => {
    // Take: Severe then Waaagh = {2c,1n}=11, and that line blocks Rending. Decline: Waaagh
    // only = {1c,2n}=13. Severe is optional, so the decline wins.
    const actual = Common.calcFinalDiceProb(dieProbs, 0, 3, 0, Ability.None, 0, 0, 0, 0, severeAndWaaagh, 5, 3);
    expectClose(actual, pn * pn * pn, 1, 2);
  });
  it('severe {0c,1n} => {1c,0n} when one cover save and Piercing Crits 1 beat the raw normal', () => {
    // Raw decline is 5 and the take is 3. The cover blocks that normal (0 through) while the
    // crit turns Piercing on and removes the cover die, so 3 gets through.
    const atk = new Model(1, 2, 5, 3).setProp('px', 1).setAbility(Ability.Severe, true);
    const def = new Model(1, 6).setProp('autoNorms', 1);
    const actual = Common.calcFinalDiceProb(
      dieProbs, 0, 1, 0, Ability.None, 0, 0, 0, 0, justSevere, 5, 3,
      hitScorerForDefender(atk, def),
    );
    expectClose(actual, pn, 1, 0);
  });
  it('rending {1c,1n} => {2c,0n} when one normal save inverts the raw scores', () => {
    // Raw decline is 3+5=8 and two crits are 6. The save blocks the normal (3 through) and
    // cannot block a crit, so both crits land (6). Rending already has a crit, so Piercing
    // Crits is on for both lines; the save is what flips this one.
    const atk = new Model(2, 4, 5, 3).setAbility(Ability.Rending, true);
    const def = new Model(1).withAlwaysNorm();
    const actual = Common.calcFinalDiceProb(
      dieProbs, 1, 1, 0, Ability.None, 0, 0, 0, 0, justRending, 5, 3,
      hitScorerForDefender(atk, def),
    );
    expectClose(actual, pc * pn * 2, 2, 0);
  });
});

// Purity Seal discards one unmodified 1 and changes another into a normal success.
// A 1 that was re-rolled does not count. Face 1 is a fail for every 2+ through 6+ stat.
describe('Purity Seal unmodified 1s', () => {
  function outcomeMass(model: Model): Map<string, number> {
    const rows = Common.calcFinalDiceProbs(
      model.toAttackerDieProbs(),
      model.numDice,
      model.reroll,
      0, 0, 0, 0,
      model.abilities,
      model.normDmg,
      model.critDmg,
    );
    const mass = new Map<string, number>();
    let total = 0;
    for (const row of rows) {
      const key = `${row.crits},${row.norms}`;
      mass.set(key, (mass.get(key) ?? 0) + row.prob);
      total += row.prob;
    }
    expect(total).toBeCloseTo(1, 9);
    return mass;
  }

  function expectMass(model: Model, key: string, prob: number): void {
    expect(outcomeMass(model).get(key) ?? 0).toBeCloseTo(prob, requiredPrecision);
  }

  it('two dice at 4+ convert only the (1,1) pair', () => {
    // crit 1/6, norm 2/6, fail 3/6. Both fails that are not both 1s stay failures: 8/36.
    const model = new Model(2, 4, 3, 4).setAbility(Ability.PuritySeal);
    expectMass(model, '0,0', 8 / 36);
    expectMass(model, '0,1', 13 / 36); // 12/36 natural one-norm plus the converted (1,1)
    expectMass(model, '0,2', 4 / 36);
    expectMass(model, '1,0', 6 / 36);
    expectMass(model, '1,1', 4 / 36);
    expectMass(model, '2,0', 1 / 36);
  });

  it('a 2+ profile converts every pair of fails, matching the old any-fail result', () => {
    // The only fail face is 1, so two fails are two unmodified 1s.
    const model = new Model(2, 2, 3, 4).setAbility(Ability.PuritySeal);
    expectMass(model, '0,0', 0);
    expectMass(model, '0,1', 9 / 36); // 8/36 one-norm plus the converted (1,1)
    expectMass(model, '0,2', 16 / 36);
    expectMass(model, '1,0', 2 / 36);
    expectMass(model, '1,1', 8 / 36);
    expectMass(model, '2,0', 1 / 36);
  });

  it('Balanced does not treat a rerolled 1 as an unmodified 1', () => {
    // 2 dice and Balanced always rerolls one fail, so two un-rerolled 1s are impossible.
    // The seal must match Balanced with the seal off, including the (1,1) reroll that
    // lands on 1 again.
    const off = outcomeMass(new Model(2, 4, 3, 4).setProp('reroll', Ability.Balanced));
    const on = outcomeMass(new Model(2, 4, 3, 4).setProp('reroll', Ability.Balanced).setAbility(Ability.PuritySeal));
    expect(on.size).toBe(off.size);
    for (const [key, prob] of off) {
      expect(on.get(key) ?? 0).toBeCloseTo(prob, requiredPrecision);
    }
  });

  it('rerolling 1s does not leave an unmodified 1', () => {
    // Every 1 is replaced, including a reroll that lands on 1, so the seal never fires.
    const off = outcomeMass(new Model(3, 4, 3, 4).setProp('reroll', Ability.RerollOnes));
    const on = outcomeMass(new Model(3, 4, 3, 4).setProp('reroll', Ability.RerollOnes).setAbility(Ability.PuritySeal));
    for (const [key, prob] of off) {
      expect(on.get(key) ?? 0).toBeCloseTo(prob, requiredPrecision);
    }
  });

  it('Ceaseless does not treat a rerolled 1 as an unmodified 1', () => {
    // 2 dice: two 1s are the whole fail pile, so Ceaseless rerolls both of them.
    const off = outcomeMass(new Model(2, 4, 3, 4).setProp('reroll', Ability.RerollMostCommonFail));
    const on = outcomeMass(new Model(2, 4, 3, 4).setProp('reroll', Ability.RerollMostCommonFail).setAbility(Ability.PuritySeal));
    for (const [key, prob] of off) {
      expect(on.get(key) ?? 0).toBeCloseTo(prob, requiredPrecision);
    }
  });

  it('matches a face-by-face roll for Balanced, Ceaseless, and Ceaseless plus Balanced', () => {
    // Independent of the engine: roll every face, reroll the way the weapon rule does, and
    // count 1s that were not rerolled. 4 dice at 4+ is enough for Ceaseless to keep two 1s
    // and for the following Balanced reroll to spend one of them.
    const stat = 4;
    const numDice = 4;
    const isFail = (face: number) => face < stat;
    const profiles: [string, Ability][] = [
      ['balanced', Ability.Balanced],
      ['ceaseless', Ability.RerollMostCommonFail],
      ['ceaselessBalanced', Ability.RerollMostCommonFailPlusBalanced],
    ];

    function oracle(kind: string): Map<string, number> {
      const mass = new Map<string, number>();
      const add = (crits: number, norms: number, prob: number) => {
        const key = `${crits},${norms}`;
        mass.set(key, (mass.get(key) ?? 0) + prob);
      };
      const dice = new Array<number>(numDice);
      const consider = (faces: number[], keptOnes: number, prob: number) => {
        let crits = 0;
        let norms = 0;
        let fails = 0;
        for (const face of faces) {
          if (face >= 6) crits++;
          else if (face >= stat) norms++;
          else fails++;
        }
        if (keptOnes >= 2 && fails >= 2) norms++;
        add(crits, norms, prob);
      };
      const rerollIndexes = (
        faces: number[],
        indexes: number[],
        keptOnes: number,
        prob: number,
        after: (next: number[], ones: number, p: number) => void,
      ) => {
        const next = faces.slice();
        const step = (n: number) => {
          if (n === indexes.length) {
            after(next, keptOnes, prob);
            return;
          }
          for (let face = 1; face <= 6; face++) {
            next[indexes[n]] = face;
            step(n + 1);
          }
        };
        step(0);
      };
      const balancedAfter = (faces: number[], already: Set<number>, keptOnes: number, prob: number) => {
        let target = -1;
        for (let i = 0; i < faces.length; i++) {
          if (!already.has(i) && isFail(faces[i])) {
            target = i;
            break;
          }
        }
        if (target < 0) {
          consider(faces, keptOnes, prob);
          return;
        }
        const spent = faces[target] === 1 ? 1 : 0;
        rerollIndexes(faces, [target], keptOnes - spent, prob / 6, consider);
      };
      const visit = (i: number) => {
        if (i === numDice) {
          const base = Math.pow(1 / 6, numDice);
          if (kind === 'balanced') {
            const targets: number[] = [];
            for (let d = 0; d < numDice && targets.length < 1; d++) {
              if (isFail(dice[d])) targets.push(d);
            }
            const spent = targets.reduce((sum, idx) => sum + (dice[idx] === 1 ? 1 : 0), 0);
            const ones = dice.filter(face => face === 1).length - spent;
            if (targets.length === 0) consider(dice, ones, base);
            else rerollIndexes(dice, targets, ones, base / 6, consider);
            return;
          }
          const counts = [0, 0, 0, 0, 0, 0, 0];
          for (const face of dice) if (isFail(face)) counts[face]++;
          let mode = 0;
          for (let face = 1; face <= 6; face++) if (counts[face] > mode) mode = counts[face];
          const modes: number[] = [];
          for (let face = 1; face <= 6; face++) if (mode > 0 && counts[face] === mode) modes.push(face);
          if (modes.length === 0) {
            if (kind === 'ceaselessBalanced') balancedAfter(dice.slice(), new Set(), 0, base);
            else consider(dice, 0, base);
            return;
          }
          for (const chosen of modes) {
            const indexes: number[] = [];
            for (let d = 0; d < numDice; d++) if (dice[d] === chosen) indexes.push(d);
            const keptOnes = chosen === 1 ? 0 : counts[1];
            const share = base / modes.length;
            const afterCeaseless = kind === 'ceaselessBalanced'
              ? (next: number[], ones: number, p: number) => balancedAfter(next, new Set(indexes), ones, p)
              : consider;
            rerollIndexes(dice, indexes, keptOnes, share / Math.pow(6, indexes.length), afterCeaseless);
          }
        }
        else {
          for (let face = 1; face <= 6; face++) {
            dice[i] = face;
            visit(i + 1);
          }
        }
      };
      visit(0);
      return mass;
    }

    for (const [kind, reroll] of profiles) {
      const model = new Model(numDice, stat, 3, 4).setProp('reroll', reroll).setAbility(Ability.PuritySeal);
      const actual = outcomeMass(model);
      const expected = oracle(kind);
      const keys = new Set<string>([...actual.keys(), ...expected.keys()]);
      for (const key of keys) {
        expect(actual.get(key) ?? 0).toBeCloseTo(expected.get(key) ?? 0, 8);
      }
    }
  });

  it('Ceaseless plus Balanced converts when two 1s survive both rerolls', () => {
    // Four dice cannot: keeping two 1s means Ceaseless left that pair, and Balanced
    // then spends one of them. Five dice can keep two 1s and a different fail, as in
    // (3,1,1,2,2) when Ceaseless rerolls the 2s and Balanced rerolls the 3.
    const plain = new Model(5, 4, 3, 4).setProp('reroll', Ability.RerollMostCommonFailPlusBalanced);
    const sealed = new Model(5, 4, 3, 4)
      .setProp('reroll', Ability.RerollMostCommonFailPlusBalanced)
      .setAbility(Ability.PuritySeal);
    const expectedNorms = (model: Model) => {
      let total = 0;
      for (const [key, prob] of outcomeMass(model)) {
        total += prob * Number(key.split(',')[1]);
      }
      return total;
    };
    expect(expectedNorms(sealed)).toBeGreaterThan(expectedNorms(plain));
  });
});

/*
describe('q', () => {
  it('x', () => {
    expect(0).toBe(0);
  });
});

*/