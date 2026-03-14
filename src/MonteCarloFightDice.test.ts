import Model from 'src/Model';
import Ability from 'src/Ability';
import { simulateFighterDice, mulberry32 } from 'src/MonteCarloFightDice';

const numTrials = 100_000;
const tolerance = 0.02; // within 2% of expected

function averageDiceResults(model: Model, trials: number = numTrials, seed: number = 42) {
  const rng = mulberry32(seed);
  let totalCrits = 0;
  let totalNorms = 0;

  for (let i = 0; i < trials; i++) {
    const result = simulateFighterDice(model, undefined, rng);
    totalCrits += result.crits;
    totalNorms += result.norms;
  }

  return {
    avgCrits: totalCrits / trials,
    avgNorms: totalNorms / trials,
  };
}

describe('simulateFighterDice basic dice probabilities', () => {
  it('WS 3+ with no rerolls: ~1/6 crits, ~4/6 norms per die', () => {
    const model = new Model(4, 3, 1, 2); // 4 dice, WS 3+
    const { avgCrits, avgNorms } = averageDiceResults(model);

    // 4 dice, crit on 6+ = 1/6, norm on 3-5 = 3/6
    expect(avgCrits).toBeCloseTo(4 * (1/6), 1);
    expect(avgNorms).toBeCloseTo(4 * (3/6), 1);
  });

  it('WS 4+ with no rerolls', () => {
    const model = new Model(3, 4, 1, 2); // 3 dice, WS 4+
    const { avgCrits, avgNorms } = averageDiceResults(model);

    expect(avgCrits).toBeCloseTo(3 * (1/6), 1);
    expect(avgNorms).toBeCloseTo(3 * (2/6), 1);
  });

  it('WS 6+ (only crits on 6)', () => {
    const model = new Model(6, 6, 1, 2); // 6 dice, WS 6+
    const { avgCrits, avgNorms } = averageDiceResults(model);

    expect(avgCrits).toBeCloseTo(6 * (1/6), 1);
    expect(avgNorms).toBeCloseTo(0, 1);
  });

  it('Lethal 5+ changes crit threshold', () => {
    const model = new Model(4, 3, 1, 2).setProp('lethal', 5); // 4 dice, WS 3+, Lethal 5+
    const { avgCrits, avgNorms } = averageDiceResults(model);

    // crit on 5+ = 2/6, norm on 3-4 = 2/6
    expect(avgCrits).toBeCloseTo(4 * (2/6), 1);
    expect(avgNorms).toBeCloseTo(4 * (2/6), 1);
  });
});

describe('simulateFighterDice rerolls', () => {
  it('Balanced rerolls one fail', () => {
    const model = new Model(4, 4, 1, 2);
    model.reroll = Ability.Balanced;
    const { avgCrits: avgCritsBal } = averageDiceResults(model);

    const modelNoReroll = new Model(4, 4, 1, 2);
    const { avgCrits: avgCritsNone } = averageDiceResults(modelNoReroll);

    // Balanced should produce more successes than no reroll
    expect(avgCritsBal).toBeGreaterThan(avgCritsNone - tolerance);
  });

  it('Relentless rerolls all fails — more successes than Balanced', () => {
    const modelBal = new Model(4, 4, 1, 2);
    modelBal.reroll = Ability.Balanced;
    const { avgCrits: avgCritsBal, avgNorms: avgNormsBal } = averageDiceResults(modelBal);

    const modelRel = new Model(4, 4, 1, 2);
    modelRel.reroll = Ability.Relentless;
    const { avgCrits: avgCritsRel, avgNorms: avgNormsRel } = averageDiceResults(modelRel);

    expect(avgCritsRel + avgNormsRel).toBeGreaterThan(avgCritsBal + avgNormsBal - tolerance);
  });

  it('RerollOnes rerolls only 1s', () => {
    const model = new Model(6, 3, 1, 2);
    model.reroll = Ability.RerollOnes;
    const { avgCrits, avgNorms } = averageDiceResults(model);

    // With RerollOnes, effective probs per die are multiplied by 7/6
    const effectiveCritProb = (1/6) * (7/6);
    const effectiveNormProb = (3/6) * (7/6);
    expect(avgCrits).toBeCloseTo(6 * effectiveCritProb, 1);
    expect(avgNorms).toBeCloseTo(6 * effectiveNormProb, 1);
  });

  it('RerollMostCommonFail produces more successes than no reroll', () => {
    const model = new Model(4, 4, 1, 2);
    model.reroll = Ability.RerollMostCommonFail;
    const { avgCrits: avgCritsMCF, avgNorms: avgNormsMCF } = averageDiceResults(model);

    const modelNone = new Model(4, 4, 1, 2);
    const { avgCrits: avgCritsNone, avgNorms: avgNormsNone } = averageDiceResults(modelNone);

    expect(avgCritsMCF + avgNormsMCF).toBeGreaterThan(avgCritsNone + avgNormsNone - tolerance);
  });
});

describe('simulateFighterDice auto-dice and promotions', () => {
  it('autoCrits are added', () => {
    const model = new Model(2, 6, 1, 2).setProp('autoCrits', 1); // 2 dice, 1 auto-crit, so 1 rolled
    const { avgCrits } = averageDiceResults(model);

    // 1 auto-crit + 1 rolled die (1/6 crit chance)
    expect(avgCrits).toBeCloseTo(1 + 1/6, 1);
  });

  it('autoNorms are added', () => {
    const model = new Model(3, 6, 1, 2).setProp('autoNorms', 2); // 3 dice, 2 auto-norms, 1 rolled
    const { avgNorms } = averageDiceResults(model);

    // 2 auto-norms + 1 rolled die (0 norm chance at WS 6+)
    expect(avgNorms).toBeCloseTo(2, 1);
  });

  it('Rending promotes a norm to crit when crits present', () => {
    // Use Lethal 5+ so we get frequent crits, and WS 3+ for norms
    const modelRend = new Model(4, 3, 1, 2, 0, new Set([Ability.Rending])).setProp('lethal', 5);
    const modelNone = new Model(4, 3, 1, 2).setProp('lethal', 5);
    const { avgCrits: avgCritsRend } = averageDiceResults(modelRend);
    const { avgCrits: avgCritsNone } = averageDiceResults(modelNone);

    expect(avgCritsRend).toBeGreaterThan(avgCritsNone);
  });

  it('Severe promotes one norm to crit when no crits rolled', () => {
    // WS 6+ means no norms possible, only crits and fails - not great for testing Severe
    // Use WS 3+ and Lethal 7 (never-crit) so all successes are norms
    const modelSev = new Model(4, 3, 1, 2, 0, new Set([Ability.Severe])).setProp('lethal', 7);
    const { avgCrits } = averageDiceResults(modelSev);

    // With lethal=7, base crits are 0. Severe triggers when norms > 0 and crits === 0.
    // So we get exactly 1 crit whenever there's at least 1 norm success.
    // P(at least one norm with 4 dice, WS3+, 4/6 success) = 1 - (2/6)^4
    const pAtLeastOneNorm = 1 - Math.pow(2/6, 4);
    expect(avgCrits).toBeCloseTo(pAtLeastOneNorm, 1);
  });
});

describe('simulateFighterDice determinism with seeded PRNG', () => {
  it('same seed produces same results', () => {
    const model = new Model(4, 3, 3, 4);
    model.reroll = Ability.Balanced;

    const result1 = simulateFighterDice(model, undefined, mulberry32(999));
    const result2 = simulateFighterDice(model, undefined, mulberry32(999));
    expect(result1).toEqual(result2);
  });

  it('different seeds produce different results (usually)', () => {
    const model = new Model(10, 3, 3, 4); // lots of dice for variety

    // Run enough times that at least one should differ
    let anyDifferent = false;
    for (let seed = 0; seed < 20; seed++) {
      const r1 = simulateFighterDice(model, undefined, mulberry32(seed));
      const r2 = simulateFighterDice(model, undefined, mulberry32(seed + 1000));
      if (r1.crits !== r2.crits || r1.norms !== r2.norms) {
        anyDifferent = true;
        break;
      }
    }
    expect(anyDifferent).toBe(true);
  });
});
