import DieProbs from 'src/DieProbs';
import Ability from 'src/Ability';

describe('DieProbs.fromSkills lethal vs hit-skill', () => {
  it('BS=4+, no lethal: 1/6 crit (nat 6), 2/6 norm', () => {
    const p = DieProbs.fromSkills(6, 4, Ability.None);
    expect(p.crit).toBeCloseTo(1 / 6, 9);
    expect(p.norm).toBeCloseTo(2 / 6, 9);
    expect(p.fail).toBeCloseTo(3 / 6, 9);
  });

  it('BS=4+, lethal=5+: 2/6 crit (5,6), 1/6 norm (4)', () => {
    const p = DieProbs.fromSkills(5, 4, Ability.None);
    expect(p.crit).toBeCloseTo(2 / 6, 9);
    expect(p.norm).toBeCloseTo(1 / 6, 9);
    expect(p.fail).toBeCloseTo(3 / 6, 9);
  });

  it('BS=6+, lethal=4+: lethal must NOT promote 4s/5s — only nat 6 crits', () => {
    const p = DieProbs.fromSkills(4, 6, Ability.None);
    expect(p.crit).toBeCloseTo(1 / 6, 9);
    expect(p.norm).toBeCloseTo(0, 9);
    expect(p.fail).toBeCloseTo(5 / 6, 9);
  });

  it('BS=5+, lethal=5+: 2/6 crit, 0 norm', () => {
    const p = DieProbs.fromSkills(5, 5, Ability.None);
    expect(p.crit).toBeCloseTo(2 / 6, 9);
    expect(p.norm).toBeCloseTo(0, 9);
    expect(p.fail).toBeCloseTo(4 / 6, 9);
  });

  it('BS=6+, no lethal: 1/6 crit, 0 norm', () => {
    const p = DieProbs.fromSkills(6, 6, Ability.None);
    expect(p.crit).toBeCloseTo(1 / 6, 9);
    expect(p.norm).toBeCloseTo(0, 9);
    expect(p.fail).toBeCloseTo(5 / 6, 9);
  });
});
