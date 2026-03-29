import Model from 'src/Model';
import * as Util from 'src/Util';
import { range } from 'lodash';
import Ability from 'src/Ability';
import ShootOptions from 'src/ShootOptions';
import { calcDmgProbs } from 'src/CalcEngineShoot';
import {
  calcDamage,
  calcPostFnpDamages,
} from 'src/CalcEngineShootInternal';
import { requiredPrecision } from 'src/CalcEngineCommon.test';

function newTestAttacker(attacks: number = 1, bs: number = 4) : Model {
  return new Model(attacks, bs, 11, 13);
}

function avgDmg(attacker: Model, defender: Model, numRounds: number = 1): number {
  return Util.weightedAverage(calcDmgProbs(attacker, defender, new ShootOptions(numRounds)));
}

describe(calcDamage.name + ', typical dmgs (norm < crit < 2 * norm)', () => {
  // test typical situation of normDmg < critDmg < 2*normDmg
  const dn = 5; // normal damage
  const dc = 7; // critical damage
  const dmw = 100; // mortal wound damage
  const atker = new Model(0, 0, dn, dc, dmw);
  const def = new Model();

  it('0ch 0nh vs 0cs 0ns => 0', () => {
    expect(calcDamage(atker, def, 0, 0, 0, 0).damage).toBe(0);
  });
  it('0ch 2nh vs 0cs 0ns => 2dn', () => {
    expect(calcDamage(atker, def, 0, 2, 0, 0).damage).toBe(2 * dn);
  });
  it('0ch 2nh vs 0cs 1ns => 1dn', () => {
    expect(calcDamage(atker, def, 0, 2, 0, 1).damage).toBe(dn);
  });
  it('0ch 2nh vs 1cs 1ns => 0', () => {
    expect(calcDamage(atker, def, 0, 2, 1, 1).damage).toBe(0);
  });
  it('0ch 2nh vs 3cs 3ns => 0', () => {
    expect(calcDamage(atker, def, 0, 2, 3, 3).damage).toBe(0);
  });
  it('1ch 0nh vs 0cs 1ns => 1dmw + 1dc', () => {
    expect(calcDamage(atker, def, 1, 0, 0, 1).damage).toBe(dmw + dc);
  });
  it('1ch 0nh vs 0cs 2ns => 1dmw', () => {
    expect(calcDamage(atker, def, 1, 0, 0, 2).damage).toBe(dmw);
  });
  it('1ch 1nh vs 0cs 2ns => 1dmw + 1dn', () => {
    expect(calcDamage(atker, def, 1, 1, 0, 2).damage).toBe(dmw + dn);
  });
  it('2ch 2nh vs 0cs 3ns => 2dmw + 1dc + 1dn', () => {
    expect(calcDamage(atker, def, 2, 2, 0, 3).damage).toBe(2 * dmw + dc + dn);
  });
  it('3ch 2nh vs 1cs 3ns => 3dmw + 1dc + 1dn', () => {
    expect(calcDamage(atker, def, 3, 2, 1, 3).damage).toBe(3 * dmw + dc + dn);
  });
});

describe(calcDamage.name + ', bigCrit (2 * norm < crit)', () => {
  // now test with critHits being so big that normSaves should prefer to first cancel critHits
  const dn = 10; // normal damage
  const dc = 100; // critical damage
  const dmw = 1000; // mortal wound damage
  const atker = new Model(0, 0, dn, dc, dmw);
  const def = new Model();

  it('bigCrit, 0ch 0nh vs 0cs 0ns => 0', () => {
    expect(calcDamage(atker, def, 0, 0, 0, 0).damage).toBe(0);
  });
  it('bigCrit, 0ch 2nh vs 0cs 1ns => 1dn', () => {
    expect(calcDamage(atker, def, 0, 2, 0, 1).damage).toBe(dn);
  });
  it('bigCrit, 0ch 2nh vs 1cs 1ns => 0', () => {
    expect(calcDamage(atker, def, 0, 2, 1, 1).damage).toBe(0);
  });
  it('bigCrit, 0ch 2nh vs 3cs 3ns => 0', () => {
    expect(calcDamage(atker, def, 0, 2, 3, 3).damage).toBe(0);
  });
  it('bigtCrit, 1ch 0nh vs 0cs 1ns => 1dmw + 1dc', () => {
    expect(calcDamage(atker, def, 1, 0, 0, 1).damage).toBe(dmw + dc);
  });
  it('bigtCrit, 1ch 0nh vs 0cs 2ns => 1dmw', () => {
    expect(calcDamage(atker, def, 1, 0, 0, 2).damage).toBe(dmw);
  });
  it('bigtCrit, 1ch 2nh vs 0cs 2ns => 1dmw + 2dn', () => {
    expect(calcDamage(atker, def, 1, 2, 0, 2).damage).toBe(dmw + 2 * dn);
  });
  it('bigtCrit, 2ch 2nh vs 0cs 3ns => 2dmw + 1dc + 1dn', () => {
    expect(calcDamage(atker, def, 2, 2, 0, 3).damage).toBe(2 * dmw + dc + dn);
  });
});

describe(calcDamage.name + ', smallCrit (crit < norm)', () => {
  // now test with critHits being so small that normHits are always the first choice to cancel
  const dn = 100; // normal damage
  const dc = 10; // critical damage
  const dmw = 1000; // mortal wound damage
  const atker = new Model(0, 0, dn, dc, dmw);
  const def = new Model();

  it('smallCrit, 0ch 0nh vs 0cs 0ns => 0', () => {
    expect(calcDamage(atker, def, 0, 0, 0, 0).damage).toBe(0);
  });
  it('smallCrit, 0ch 2nh vs 0cs 1ns => 1dn', () => {
    expect(calcDamage(atker, def, 0, 2, 0, 1).damage).toBe(dn);
  });
  it('smallCrit, 0ch 2nh vs 1cs 1ns => 0', () => {
    expect(calcDamage(atker, def, 0, 2, 1, 1).damage).toBe(0);
  });
  it('smallCrit, 0ch 2nh vs 3cs 3ns => 0', () => {
    expect(calcDamage(atker, def, 0, 2, 3, 3).damage).toBe(0);
  });
  it('smallCrit, 1ch 0nh vs 0cs 1ns => 1dmw + 1dc', () => {
    expect(calcDamage(atker, def, 1, 0, 0, 1).damage).toBe(dmw + dc);
  });
  it('smallCrit, 1ch 0nh vs 0cs 2ns => 1dmw', () => {
    expect(calcDamage(atker, def, 1, 0, 0, 2).damage).toBe(dmw);
  });
  it('smallCrit, 1ch 2nh vs 0cs 2ns => 1dmw + 2dn', () => {
    expect(calcDamage(atker, def, 1, 2, 0, 2).damage).toBe(dmw + dc);
  });
  it('smallCrit, 2ch 2nh vs 0cs 3ns => 2dmw + 2dc', () => {
    expect(calcDamage(atker, def, 2, 2, 0, 3).damage).toBe(2 * dmw + 2 * dc);
  });
});

describe(calcDmgProbs.name + ', Durable', () => {
  const dn = 10; // normal damage
  const dc = 100; // critical damage
  const atker = new Model(0, 0, dn, dc);
  const def = new Model().setAbility(Ability.Durable);
  it('Durable, D=10/100', () => {
    expect(calcDamage(atker, def, 2, 2, 0, 0).damage).toBe(2 * dc - 1 + 2 * dn);
  });
  it('Durable, D=10/3', () => {
    const lowDc = 3;
    const lowAtker = new Model(0, 0, dn, lowDc);
    expect(calcDamage(lowAtker, def, 2, 2, 0, 0).damage).toBe(2 * lowDc + 2 * dn);
  });
});

describe(calcPostFnpDamages.name, () => {
  it('5 damage from 1 hit, fnp 5+: can only reduce to 4', () => {
    const fnp = 5;
    const ps = 2 / 6; // probability of FNP success (roll >= 5)
    const pf = 4 / 6; // probability of FNP failure
    // key = "damage,numHits"
    const preFnpDmgs = new Map<string,number>([ ['5,1', 1] ]);
    const postFnpDmgs = calcPostFnpDamages(fnp, preFnpDmgs);

    // 1 hit => 1 FNP roll => either pass (dmg=4) or fail (dmg=5)
    expect(postFnpDmgs.get(4)).toBeCloseTo(ps, requiredPrecision);
    expect(postFnpDmgs.get(5)).toBeCloseTo(pf, requiredPrecision);
    expect(postFnpDmgs.size).toBe(2);
  });
  it('6 damage from 2 hits, fnp 5+: can reduce by up to 2', () => {
    const fnp = 5;
    const ps = 2 / 6; // probability of FNP success
    const pf = 4 / 6; // probability of FNP failure
    const preFnpDmgs = new Map<string,number>([ ['6,2', 1] ]);
    const postFnpDmgs = calcPostFnpDamages(fnp, preFnpDmgs);

    // 2 hits => 2 FNP rolls => binomial(2, ps)
    // 0 successes => dmg=6, 1 success => dmg=5, 2 successes => dmg=4
    expect(postFnpDmgs.get(4)).toBeCloseTo(ps * ps, requiredPrecision);
    expect(postFnpDmgs.get(5)).toBeCloseTo(2 * ps * pf, requiredPrecision);
    expect(postFnpDmgs.get(6)).toBeCloseTo(pf * pf, requiredPrecision);
    expect(postFnpDmgs.size).toBe(3);
  });
  it('2 damage from 2 hits, fnp 5+: minimum damage is 1 (skipZeroDamage)', () => {
    const fnp = 5;
    const ps = 2 / 6;
    const pf = 4 / 6;
    const preFnpDmgs = new Map<string,number>([ ['2,2', 1] ]);
    const postFnpDmgs = calcPostFnpDamages(fnp, preFnpDmgs);

    // 2 hits, 2 damage => 0 successes(dmg=2), 1 success(dmg=1), 2 successes(dmg=0, dropped)
    expect(postFnpDmgs.get(1)).toBeCloseTo(2 * ps * pf, requiredPrecision);
    expect(postFnpDmgs.get(2)).toBeCloseTo(pf * pf, requiredPrecision);
    expect(postFnpDmgs.size).toBe(2);
  });
  it('mixed scenarios with different hit counts', () => {
    const fnp = 5;
    const ps = 2 / 6;
    const pf = 4 / 6;
    const p1 = 0.4; // prob of 3 damage from 1 hit
    const p2 = 0.6; // prob of 5 damage from 2 hits
    const preFnpDmgs = new Map<string,number>([
      ['3,1', p1],
      ['5,2', p2],
    ]);
    const postFnpDmgs = calcPostFnpDamages(fnp, preFnpDmgs);

    // scenario 1: 3 dmg, 1 hit => pass(dmg=2) or fail(dmg=3)
    // scenario 2: 5 dmg, 2 hits => 0 pass(dmg=5), 1 pass(dmg=4), 2 pass(dmg=3)
    expect(postFnpDmgs.get(2)).toBeCloseTo(p1 * ps, requiredPrecision);
    expect(postFnpDmgs.get(3)).toBeCloseTo(p1 * pf + p2 * ps * ps, requiredPrecision);
    expect(postFnpDmgs.get(4)).toBeCloseTo(p2 * 2 * ps * pf, requiredPrecision);
    expect(postFnpDmgs.get(5)).toBeCloseTo(p2 * pf * pf, requiredPrecision);
    expect(postFnpDmgs.size).toBe(4);
  });
});

describe(calcDmgProbs.name + ', few dice, no abilities', () => {
  const bs = 4;
  const pc = 1/6; // crit probability
  const pn = 1/3; // norm probability
  const pf = 1/2; // fail probability
  const dc = 13;
  const dn = 11;
  const atk1 = new Model(1, bs, dn, dc);
  const atk2 = new Model(2, bs, dn, dc);
  const def0 = new Model(0, bs);
  const def1 = new Model(1, bs);

  it('test coherency', () => {
    expect(pc + pn + pf).toBeCloseTo(1, requiredPrecision);
  });
  it('1 atkDie vs 0 defDie', () => {
    const damageToProb = calcDmgProbs(atk1, def0);
    expect(damageToProb.size).toBe(3);
    expect(damageToProb.get(0)).toBe(pf);
    expect(damageToProb.get(dn)).toBe(pn);
    expect(damageToProb.get(dc)).toBe(pc);
  });
  it('2 atkDie vs 0 defDie', () => {
    const damageToProb = calcDmgProbs(atk2, def0);
    expect(damageToProb.size).toBe(6);
    expect(damageToProb.get(0)).toBeCloseTo(pf * pf, requiredPrecision);
    expect(damageToProb.get(dn)).toBeCloseTo(pn * pf * 2, requiredPrecision);
    expect(damageToProb.get(2 * dn)).toBeCloseTo(pn * pn, requiredPrecision);
    expect(damageToProb.get(dc)).toBeCloseTo(pc * pf * 2, requiredPrecision);
    expect(damageToProb.get(dc + dn)).toBeCloseTo(pc * pn * 2, requiredPrecision);
    expect(damageToProb.get(2 * dc)).toBeCloseTo(pc * pc, requiredPrecision);
  });
  it('1 atkDie vs 1 defDie', () => {
    const damageToProb = calcDmgProbs(atk1, def1);
    const probCritDelivered = pc * (1 - pc); // atk crit and def non-crit
    const probNormDelivered = pn * pf; // atk crit and def non-crit
    const probNothingDeliveredCalculatedDirectly = pf + pc * pc + pn * (1 - pf);
    const probNothingDeliveredCalculatedAsRemainder = 1 - probCritDelivered - probNormDelivered;

    // make sure test didn't mess up this calc
    expect(probNothingDeliveredCalculatedDirectly)
      .toBeCloseTo(probNothingDeliveredCalculatedAsRemainder, requiredPrecision);

    expect(damageToProb.size).toBe(3);
    expect(damageToProb.get(dc)).toBeCloseTo(pc * (1 - pc), requiredPrecision);
    expect(damageToProb.get(dn)).toBeCloseTo(pn * pf, requiredPrecision); // atk norm vs def fail
    expect(damageToProb.get(0)).toBeCloseTo(probNothingDeliveredCalculatedDirectly, requiredPrecision); // atk fail or atk cancelled
  });
  it('2 atkDie vs 1 defDie', () => {
    const damageToProb = calcDmgProbs(atk2, def1);

    const probNothingDelivered
      = pc * pf * 2 * pc // 1c vs 1c
      + pn * pf * 2 * (1 - pf) // 1n vs 1 not-fail
      + pf * pf // nothing vs anything
      ;
    const prob1NormDelivered
      = pc * pn * 2 * pc // 1c+1n vs 1c
      + pn * pn * (1 - pf) // 2n vs 1 not-fail
      + pn * pf * 2 * pf // 1n vs 1f
      ;
    const prob1CritDelivered
      = pc * pc * pc // 2c vs 1c
      + pc * pn * 2 * pn // 1c+1n vs 1n
      + pc * pf * 2 * (1 - pc) // 1c vs 1 not-crit
      ;
    const prob1Crit1NormDelivered = pc * pn * 2 * pf;
    const prob2NormDelivered = pn * pn * pf;
    const prob2CritDelivered = pc * pc * (1 - pc);

    // make sure test didn't mess up this calc
    expect(
      probNothingDelivered
      + prob1NormDelivered
      + prob1CritDelivered
      + prob1Crit1NormDelivered
      + prob2NormDelivered
      + prob2CritDelivered
      ).toBeCloseTo(1, requiredPrecision);

    expect(damageToProb.size).toBe(6);
    expect(damageToProb.get(0)).toBeCloseTo(probNothingDelivered, requiredPrecision);
    expect(damageToProb.get(dn)).toBeCloseTo(prob1NormDelivered, requiredPrecision);
    expect(damageToProb.get(dc)).toBeCloseTo(prob1CritDelivered, requiredPrecision);
    expect(damageToProb.get(dc + dn)).toBeCloseTo(prob1Crit1NormDelivered, requiredPrecision);
    expect(damageToProb.get(2 * dn)).toBeCloseTo(prob2NormDelivered, requiredPrecision);
    expect(damageToProb.get(2 * dc)).toBeCloseTo(prob2CritDelivered, requiredPrecision);
  });
});

describe(calcDmgProbs.name + ', MWx', () => {
  // we tested mwx for calcDamage; quick test to make sure calcDamageProbabilities respects mwx too
  it('basic', () => {
    const dmw = 1000; // mw damage
    const pc = 1 / 6;
    const pn = 5 / 6;
    const atk = newTestAttacker(1, 1).setProp('mwx', dmw);
    const def = new Model(3, 1); // 3 defense dice, always saves on 1+

    const dmgs = calcDmgProbs(atk, def);
    expect(dmgs.get(0)).toBeCloseTo(pn, requiredPrecision); // norm hit, any save
    expect(dmgs.get(dmw)).toBeCloseTo(pc * pc, requiredPrecision); // crit hit, crit save
    expect(dmgs.get(dmw + atk.critDmg)).toBeCloseTo(pn * pc, requiredPrecision); // crit hit, norm save
    expect(dmgs.size).toBe(3);
  });
});

describe(calcDmgProbs.name + ', APx', () => {
  it('APx vs fewer defense dice', () => {
    const atkApx0 = new Model().setProp('apx', 0);
    const atkApx1 = new Model().setProp('apx', 1);
    const atkApx2 = new Model().setProp('apx', 2);
    const def0 = new Model().setProp('numDice', 0);
    const def1 = new Model().setProp('numDice', 1);
    const def2 = new Model().setProp('numDice', 2);
    const def3 = new Model().setProp('numDice', 3);

    // scenarios with 0 defense dice (0-0, 1-1,);
    const dmgs0Minus0DefDice = calcDmgProbs(atkApx0, def0);
    const dmgs1Minus1DefDice = calcDmgProbs(atkApx1, def1);
    expect(dmgs0Minus0DefDice).toStrictEqual(dmgs1Minus1DefDice);

    // scenarios with 1 defense dice (1-0, 2-1, 3-2,);
    const dmgs1Minus0DefDice = calcDmgProbs(atkApx0, def1);
    const dmgs2Minus1DefDice = calcDmgProbs(atkApx1, def2);
    const dmgs3Minus2DefDice = calcDmgProbs(atkApx2, def3);
    expect(dmgs1Minus0DefDice).toStrictEqual(dmgs2Minus1DefDice);
    expect(dmgs1Minus0DefDice).toStrictEqual(dmgs3Minus2DefDice);

    // scenarios with 2 defense dice (2-0, 3-1,);
    const dmgs2Minus0DefDice = calcDmgProbs(atkApx0, def2);
    const dmgs3Minus1DefDice = calcDmgProbs(atkApx1, def3);
    expect(dmgs2Minus0DefDice).toStrictEqual(dmgs3Minus1DefDice);

    expect(Util.weightedAverage(dmgs2Minus0DefDice))
      .toBeLessThan(Util.weightedAverage(dmgs2Minus1DefDice));
    expect(Util.weightedAverage(dmgs1Minus0DefDice))
      .toBeLessThan(Util.weightedAverage(dmgs0Minus0DefDice));

    // apx > def should give same results as apx = def
    const dmgs1Minus2DefDice = calcDmgProbs(atkApx2, def1);
    expect(dmgs1Minus1DefDice).toStrictEqual(dmgs1Minus2DefDice);
  });
});

describe(calcDmgProbs.name + ', px and lethal', () => {
  it('px gets rid of def dice on crit', () => {
    const atk = newTestAttacker(1, 1).setProp('px', 4).setProp('lethal', 5);
    const pc = (7 - atk.critSkill()) / 6;
    const def = new Model(4, 1);

    const dmgs = calcDmgProbs(atk, def);
    expect(dmgs.get(0)).toBeCloseTo(1 - pc, requiredPrecision);
    expect(dmgs.get(atk.critDmg)).toBeCloseTo(pc, requiredPrecision);
  });

  it('0 < apx < px, apx used when no crit', () => {
    const atk = newTestAttacker(1, 1).setProp('apx', 1).setProp('px', 2).setProp('lethal', 5);
    const def = new Model(2, 1);
    const [pc, pn, ] = atk.toAttackerDieProbs().toCritNormFail();

    const dmgs = calcDmgProbs(atk, def);
    expect(dmgs.get(0)).toBeCloseTo(pn, requiredPrecision);
    expect(dmgs.get(atk.critDmg)).toBeCloseTo(pc, requiredPrecision);
    expect(dmgs.size).toBe(2);
  });
});

describe(calcDmgProbs.name + ', balanced', () => {
  it('balanced with 1 atk die', () => {
    const atk = newTestAttacker(1).setProp('reroll', Ability.Balanced);
    const [pc, pn, pf] = atk.toAttackerDieProbs().toCritNormFail();
    const def = new Model(0);

    const dmgs = calcDmgProbs(atk, def);
    expect(dmgs.get(0)).toBeCloseTo(pf * pf, requiredPrecision);
    expect(dmgs.get(atk.normDmg)).toBeCloseTo(pn + pf * pn, requiredPrecision);
    expect(dmgs.get(atk.critDmg)).toBeCloseTo(pc + pf * pc, requiredPrecision);
    expect(dmgs.size).toBe(3);
  });
});

describe(calcDmgProbs.name + ', RerollOnes', () => {
  it('RerollOnes with 1 atk die', () => {
    const atk = newTestAttacker(1).setProp('reroll', Ability.RerollOnes);
    const pc = 1 / 6;
    const pn = 2 / 6;
    const pf = 3 / 6;
    const p1 = 1 / 6; // probability of rolling exactly a 1
    const def = new Model(0);

    const dmgs = calcDmgProbs(atk, def);
    expect(dmgs.get(0)).toBeCloseTo((pf - p1) + p1 * pf, requiredPrecision);
    expect(dmgs.get(atk.normDmg)).toBeCloseTo(pn + p1 * pn, requiredPrecision);
    expect(dmgs.get(atk.critDmg)).toBeCloseTo(pc + p1 * pc, requiredPrecision);
    expect(dmgs.size).toBe(3);
  });
  it('RerollOnes damage', () => {
    const atk = newTestAttacker(3);
    const atkRerollOnes = atk.withProp('reroll', Ability.RerollOnes);
    const def = new Model(0);

    const dmg = avgDmg(atk, def);
    const dmgRerollOnes = avgDmg(atkRerollOnes, def);
    expect(dmgRerollOnes).toBeCloseTo(dmg * 7 / 6, requiredPrecision);
  });
});

describe(calcDmgProbs.name + ', relentless', () => {
  it('relentless with 1 atk die', () => {
    const atk = newTestAttacker(1).setProp('reroll', Ability.Relentless);
    const pc = 1 / 6;
    const pn = 2 / 6;
    const pf = 3 / 6;
    const def = new Model(0);

    const dmgs = calcDmgProbs(atk, def);
    expect(dmgs.get(0)).toBeCloseTo(pf * pf, requiredPrecision);
    expect(dmgs.get(atk.normDmg)).toBeCloseTo(pn + pf * pn, requiredPrecision);
    expect(dmgs.get(atk.critDmg)).toBeCloseTo(pc + pf * pc, requiredPrecision);
    expect(dmgs.size).toBe(3);
  });
  it('relentless damage', () => {
    const atk = newTestAttacker(3, 4);
    const atkRelentless = atk.withProp('reroll', Ability.Relentless);
    const def = new Model(0);

    const dmg = avgDmg(atk, def);
    const dmgRelentless = avgDmg(atkRelentless, def);
    expect(dmgRelentless).toBeCloseTo(dmg * 1.5, requiredPrecision);
  });
});

describe(calcDmgProbs.name + ', rending & starfire', () => {
  it('rending, 2 atk dice, probability 2 crits', () => {
    const atk = newTestAttacker(2).setAbility(Ability.Rending, true);
    const [pc, pn, ] = atk.toAttackerDieProbs().toCritNormFail();
    const def = new Model(0);

    const dmgs = calcDmgProbs(atk, def);
    expect(dmgs.get(2 * atk.critDmg)).toBeCloseTo(pc * pc + 2 * pc * pn, requiredPrecision);
  });
  it('starfire, 2 atk dice, probability 1 crit + 1 norm', () => {
    const atk = newTestAttacker(2).setAbility(Ability.Punishing, true);
    const [pc, pn, pf] = atk.toAttackerDieProbs().toCritNormFail();
    const def = new Model(0);

    const dmgs = calcDmgProbs(atk, def);
    expect(dmgs.get(atk.critDmg + atk.normDmg))
      .toBeCloseTo(2 * pc * pf + 2 * pc * pn, requiredPrecision);
  });
});

describe(calcDmgProbs.name + ', defender fnp', () => {
  it('fnp rolls once per hit, not per damage point', () => {
    // 1 attack die, BS 3+ => crit on 6 (1/6), norm on 3-5 (1/2), fail on 1-2 (1/3)
    // normDmg=1, critDmg=2, no defender saves
    const fnp = 5;
    const ps = 2 / 6; // FNP success probability
    const pf = 4 / 6; // FNP failure probability
    const pCrit = 1 / 6;
    const pNorm = 1 / 2;
    const atk = new Model(1, 3, 1, 2);
    const def = new Model(0).setProp('fnp', fnp);

    const dmgs = calcDmgProbs(atk, def);
    // crit (dmg=2, 1 hit): fnp pass => dmg=1, fnp fail => dmg=2
    // norm (dmg=1, 1 hit): fnp pass => dmg=0 (dropped), fnp fail => dmg=1
    expect(dmgs.get(1)).toBeCloseTo(pCrit * ps + pNorm * pf, requiredPrecision);
    expect(dmgs.get(2)).toBeCloseTo(pCrit * pf, requiredPrecision);
    expect(dmgs.size).toBe(3); // includes dmg=0
  });
});

describe(calcDmgProbs.name + ', defender cover saves', () => {
  it('cover, 1 always-norm-hit vs 1 cover norm save (always cancel)', () => {
    const atk = newTestAttacker(1).withAlwaysNorm();
    const def = new Model(1, 6).setProp('autoNorms', 1);

    const dmgs = calcDmgProbs(atk, def);
    expect(dmgs.get(0)).toBeCloseTo(1, requiredPrecision);
    expect(dmgs.size).toBe(1);
  });
  it('cover, 1 always-crit-hit vs 1 cover norm save (never cancel)', () => {
    const atk = newTestAttacker(1).withAlwaysCrit();
    const def = new Model(1, 6).setProp('autoNorms', 1);

    const dmgs = calcDmgProbs(atk, def);
    expect(dmgs.get(atk.critDmg)).toBeCloseTo(1, requiredPrecision);
    expect(dmgs.size).toBe(1);
  });
  it('cover, 1 always-crit-hit vs 2 cover norm save (cancel)', () => {
    const atk = newTestAttacker(1).withAlwaysCrit();
    const def = new Model(2, 6).setProp('autoNorms', 2);

    const dmgs = calcDmgProbs(atk, def);
    expect(dmgs.get(0)).toBeCloseTo(1, requiredPrecision);
    expect(dmgs.size).toBe(1);
  });
  it('cover, 3 always-norm-hit vs 2 cover norm save (cancel 2 norm hits)', () => {
    const atk = newTestAttacker(3).withAlwaysNorm();
    const def = new Model(2, 6).setProp('autoNorms', 2);

    const dmgs = calcDmgProbs(atk, def);
    expect(dmgs.get(atk.normDmg)).toBeCloseTo(1, requiredPrecision);
    expect(dmgs.size).toBe(1);
  });
  it('cover, 2 always-norm-hit vs 1 cover norm save and 1 def roll (sometimes cancelled)', () => {
    const atk = newTestAttacker(2).withAlwaysNorm();
    const def = new Model(2, 3).setProp('autoNorms', 1);
    const [pc, pn, pf] = def.toDefenderDieProbs().toCritNormFail();

    const dmgs = calcDmgProbs(atk, def);
    expect(dmgs.get(0)).toBeCloseTo(pc + pn, requiredPrecision);
    expect(dmgs.get(atk.normDmg)).toBeCloseTo(pf, requiredPrecision);
    expect(dmgs.size).toBe(2);
  });
  it('cover, 1 always-norm-hit vs 1 cover crit save (always cancel)', () => {
    const atk = newTestAttacker(1).withAlwaysNorm();
    const def = new Model(1, 6).setProp('autoCrits', 1);

    const dmgs = calcDmgProbs(atk, def);
    expect(dmgs.get(0)).toBeCloseTo(1, requiredPrecision);
    expect(dmgs.size).toBe(1);
  });
  it('cover, 1 always-crit-hit vs 1 cover crit save (always cancel)', () => {
    const atk = newTestAttacker(1).withAlwaysCrit();
    const def = new Model(1, 6).setProp('autoCrits', 1);

    const dmgs = calcDmgProbs(atk, def);
    expect(dmgs.get(0)).toBeCloseTo(1, requiredPrecision);
    expect(dmgs.size).toBe(1);
  });
  it('cover, 2 always-norm-hit vs 1 cover crit save (always cancel 1 norm hit)', () => {
    const atk = newTestAttacker(2).withAlwaysNorm();
    const def = new Model(1, 6).setProp('autoCrits', 1);

    const dmgs = calcDmgProbs(atk, def);
    expect(dmgs.get(atk.normDmg)).toBeCloseTo(1, requiredPrecision);
    expect(dmgs.size).toBe(1);
  });
  it('enough apx means not even a cover success', () => {
    const atk = newTestAttacker(1).withAlwaysNorm().setProp('apx', 3);
    const def = new Model(3);

    const dmgs = calcDmgProbs(atk, def);
    expect(dmgs.get(atk.normDmg)).toBeCloseTo(1, requiredPrecision);
    expect(dmgs.size).toBe(1);
  });
  it('save promotions, 1 always-crit-hit vs 1 cover norm save + 1 promotion (always cancel)', () => {
    const atk = newTestAttacker(1).withAlwaysCrit();
    const def = new Model(1, 6).setProp('autoNorms', 1).setProp('normsToCrits', 1);

    const dmgs = calcDmgProbs(atk, def);
    expect(dmgs.get(0)).toBeCloseTo(1, requiredPrecision);
    expect(dmgs.size).toBe(1);
  });
  it('save promotions, 2 always-crit-hit vs 1 cover norm save + 2 promotions (always cancel 1 of the 2)', () => {
    const atk = newTestAttacker(2).withAlwaysCrit();
    const def = new Model(1, 6).setProp('autoNorms', 1).setProp('normsToCrits', 1);

    const dmgs = calcDmgProbs(atk, def);
    expect(dmgs.get(atk.critDmg)).toBeCloseTo(1, requiredPrecision);
  });
});

describe(calcDmgProbs.name + ', defender chitin', () => {
  it('chitin, 1 atk die & 1 def die', () => {
    const atk = newTestAttacker(1, 4);
    const def = Model.basicDefender(1, 4).setProp('reroll', Ability.Balanced);
    const [pc, pn, pf] = atk.toAttackerDieProbs().toCritNormFail();

    const dmgs = calcDmgProbs(atk, def);
    expect(dmgs.get(atk.critDmg)).toBeCloseTo(pc * (pf * (1 - pc) + pn), requiredPrecision);
    expect(dmgs.get(atk.normDmg)).toBeCloseTo(pn * pf * pf, requiredPrecision);
    expect(dmgs.get(0)).toEqual(expect.any(Number)); // prob is just remainder
    expect(dmgs.size).toBe(3);
  });
});

describe(calcDmgProbs.name + ', multiple rounds', () => {
  it('damage should scale linearly', () => {
    const atk = newTestAttacker(3);
    const def = Model.basicDefender();
    const dmgHist = [];

    for(const numRounds of range(1, 6)) {
      dmgHist.push(avgDmg(atk, def, numRounds));
      expect(dmgHist[dmgHist.length - 1]).toBeCloseTo(dmgHist[0] * numRounds, requiredPrecision);
    }
  });
});

/*
describe('q', () => {
  it('x', () => {
    expect(0).toBe(0);
  });
});
*/
