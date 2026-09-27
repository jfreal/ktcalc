import Ability from "src/Ability";

export default class DieProbs {
  public crit: number;
  public norm: number;
  public fail: number;

  public constructor(
    crit: number,
    norm: number,
    fail: number = -1,
  ) {
    this.crit = crit;
    this.norm = norm;
    this.fail = fail === -1 ? 1 - crit - norm : fail;
  }

  public static fromSkills(critSkill: number, normSkill: number, reroll: Ability) {
    // lethal must not promote a die that would have failed: clamp critSkill >= normSkill
    // (e.g. BS=6+, lethal=5+ → a 5 still fails; only a 6 crits)
    const effCritSkill = Math.max(critSkill, normSkill);
    // BEFORE taking RerollOnes and relentless into account
    let critHitProb = (7 - effCritSkill) / 6;
    let normHitProb = Math.max(0, (effCritSkill - normSkill) / 6);
    let failHitProb = 1 - critHitProb - normHitProb;

    // now to take RerollOnes and relentless into account...
    // (balanced can not be taken into account at this layer and is handled later)
    if (reroll === Ability.RerollOnes
      || reroll === Ability.Relentless
      || reroll === Ability.RerollOnesPlusBalanced
    ) {
      // The 7/6 factor assumes a rolled 1 is a failure. On a 1+ stat nothing can
      // fail (fail is 0, or a float residue of 0), so that factor pushes crit+norm
      // above 1. Relentless only rerolls fails, so it is already a no-op here.
      // RerollOnes still rerolls the face: a normal 1 can come up a crit.
      const oneIsAlreadyASuccess = reroll !== Ability.Relentless
        && normSkill <= 1
        && Math.abs(failHitProb) <= 1e-9;
      if (oneIsAlreadyASuccess) {
        if (effCritSkill > 1) {
          const pOne = 1 / 6;
          critHitProb += pOne * critHitProb;
          normHitProb = (normHitProb - pOne) + pOne * normHitProb;
        }
        const kept = critHitProb + normHitProb;
        critHitProb /= kept;
        normHitProb /= kept;
        failHitProb = 0;
      }
      else {
        const rerollMultiplier = reroll === Ability.Relentless
          ? 1 + failHitProb
          : 7 / 6;
        critHitProb *= rerollMultiplier;
        normHitProb *= rerollMultiplier;
        failHitProb = 1 - critHitProb - normHitProb;
      }
    }
    else if (reroll === Ability.CritFishRelentless) {
      const noncritProb = 1 - critHitProb;
      failHitProb *= noncritProb;
      normHitProb *= noncritProb;
      critHitProb *= 2 - critHitProb;
    }

    return new DieProbs(critHitProb, normHitProb, failHitProb);
  }

  public toCritNormFail(): number[] {
    return [this.crit, this.norm, this.fail];
  }

}
