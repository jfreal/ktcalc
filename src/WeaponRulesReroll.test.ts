import fs from 'fs';
import path from 'path';

// Fails-only covers Balanced, Ceaseless, Relentless, and the combined rerolls.
// CritFishRelentless on the Shoot dropdowns rerolls non-crits, same as in a fight.
// See rules/WEAPON_RULES.md ("Reroll Targeting Strategy").
describe('WEAPON_RULES reroll targeting', () => {
  const doc = fs.readFileSync(path.join(process.cwd(), 'rules/WEAPON_RULES.md'), 'utf8').replace(/\r\n/g, '\n');
  const match = doc.match(/### Reroll Targeting Strategy\n([\s\S]*?)(?=\n### )/);
  const section = match ? match[1] : '';
  const recapMatch = doc.match(/## Recent Improvements \(December 2025\)\n([\s\S]*?)(?=\n---)/);
  const recap = recapMatch ? recapMatch[1] : '';

  it('finds the Reroll Targeting Strategy section', () => {
    expect(section).not.toBe('');
  });

  it('scopes fails-only to the named rerolls and requires CritFishRelentless on Shoot', () => {
    expect(section).toMatch(/Balanced, Ceaseless, Relentless, and the combined rerolls/);
    expect(section).toMatch(/Those abilities only target fails, never norms or crits/);
    expect(section).toMatch(/CritFishRelentless on the Shoot dropdowns rerolls non-crits the same way it does in a fight/);
    expect(section).toMatch(/Fight calculator Notes/);
    expect(section).toMatch(/\[Fight calculator\]\(\/fight\/\)/);
    expect(section).not.toMatch(/\*\*Fails only\*\* is the shooting default/);
    expect(section).not.toMatch(/Shooting reroll abilities in this calculator only target fails, never norms or crits/);
    expect(section).not.toMatch(/Crit-fishing is a fight choice/);
    expect(section).not.toMatch(/This is optimal play/);
  });

  it('scopes the December 2025 recap the same way', () => {
    expect(recap).not.toBe('');
    expect(recap).toMatch(/Balanced, Ceaseless, Relentless, and the combined rerolls/);
    expect(recap).toMatch(/CritFishRelentless on the Shoot dropdowns rerolls non-crits the same way it does in a fight/);
    expect(recap).not.toMatch(/fails only is the shooting default/);
    expect(recap).not.toMatch(/shooting rerolls only target fails/);
    expect(recap).not.toMatch(/those rerolls only target fails \(never norms or crits\)/);
    expect(recap).not.toMatch(/crit-fishing is the Fight calculator Notes, not this default/);
  });
});
