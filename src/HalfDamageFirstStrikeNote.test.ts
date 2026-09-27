import { HalfDamageFirstStrike } from 'src/Notes';

// The Fight checkbox title is this note (FighterControls sets title={note.description}).
// The engine leaves a strike of 0 or 1 unchanged and keeps a 2 at 2
// (dmg <= 2 ? dmg : ceil(dmg / 2)). The old hover said the result is raised
// to a minimum of 2, which is what a 1-damage strike does not do.
describe('HalfDamageFirstStrike hover title', () => {
  const title = HalfDamageFirstStrike.description ?? '';

  it('says the strike is halved and rounded up, never below 2 and never above itself', () => {
    expect(title).toMatch(/halved and rounded up/i);
    expect(title).toMatch(/never below 2/);
    expect(title).toMatch(/never above the strike/);
    expect(title).toMatch(/a 2 stays 2/);
    expect(title).toMatch(/a 0 or 1 is unchanged/);
  });

  it('does not say the result is raised to a minimum of 2', () => {
    expect(title).not.toMatch(/minimum of 2/);
  });
});
