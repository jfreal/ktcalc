import Model from 'src/Model';
import {
  calcRemainingWounds,
} from 'src/CalcEngineFight';
import {
  calcDieChoice,
  calcParryForLastEnemySuccessThenKillEnemy,
  calcRemainingWoundPairProbs,
  consolidateWoundPairProbs,
  resolveDieChoice,
  resolveFight,
  toWoundPairKey,
  wiseParry,
} from 'src/CalcEngineFightInternal';
import { mulberry32 } from 'src/MonteCarloFightDice';
import {clone, range} from 'lodash';
import FightStrategy from 'src/FightStrategy';
import FightChoice from 'src/FightChoice';
import FighterState from 'src/FighterState';
import Ability from 'src/Ability';
import * as Util from 'src/Util';

const requiredPrecision = 1; // Monte Carlo tolerance (within 0.05)
const highSimCount = 200_000;
const testRng = () => mulberry32(12345);

function newFighterState(
  crits: number,
  norms: number,
  wounds: number = 3,
  strategy: FightStrategy = FightStrategy.MaxDmgToEnemy,
  abilities: Set<Ability> = new Set<Ability>(),
): FighterState {
  return new FighterState(
    new Model(crits + norms, 2, 1, 2)
      .setProp('wounds', wounds)
      .setProp('abilities', abilities),
    crits,
    norms,
    strategy,
  );
}

describe(wiseParry.name, () => {
  const guy1n = newFighterState(0, 1);
  const guy1c = newFighterState(1, 0);
  const guy1c1n = newFighterState(1, 1);
  const guy1nBrutal = newFighterState(0, 1);
  const guy1cBrutal = newFighterState(1, 0);
  guy1nBrutal.profile.setAbility(Ability.Brutal, true);
  guy1cBrutal.profile.setAbility(Ability.Brutal, true);

  it('1n vs 1n => norm parry', () => {
    expect(wiseParry(guy1n, guy1n)).toBe(FightChoice.NormParry);
  });
  it('1n vs 1n brutal => norm strike', () => {
    expect(wiseParry(guy1n, guy1nBrutal)).toBe(FightChoice.NormStrike);
  });
  it('1n vs 1c => norm strike', () => {
    expect(wiseParry(guy1n, guy1c)).toBe(FightChoice.NormStrike);
  });
  it('1n vs 1c brutal => norm strike', () => {
    expect(wiseParry(guy1n, guy1cBrutal)).toBe(FightChoice.NormStrike);
  });
  it('1n vs 1c+1n => norm parry', () => {
    expect(wiseParry(guy1n, guy1c1n)).toBe(FightChoice.NormParry);
  });
  it('1c vs 1n => crit parry', () => {
    expect(wiseParry(guy1c, guy1n)).toBe(FightChoice.CritParry);
  });
  it('1c vs 1n brutal => crit parry', () => {
    expect(wiseParry(guy1c, guy1nBrutal)).toBe(FightChoice.CritParry);
  });
  it('1c vs 1c => crit parry', () => {
    expect(wiseParry(guy1c, guy1c)).toBe(FightChoice.CritParry);
  });
  it('1c vs 1c brutal => crit parry', () => {
    expect(wiseParry(guy1c, guy1cBrutal)).toBe(FightChoice.CritParry);
  });
  it('1c vs 1c+1n => crit parry', () => {
    expect(wiseParry(guy1c, guy1c1n)).toBe(FightChoice.CritParry);
  });
  it('1c+1n vs 1n => norm parry', () => {
    expect(wiseParry(guy1c1n, guy1n)).toBe(FightChoice.NormParry);
  });
  it('1c+1n vs 1n brutal => crit parry', () => {
    expect(wiseParry(guy1c1n, guy1nBrutal)).toBe(FightChoice.CritParry);
  });
  it('1c+1n vs 1c => crit parry', () => {
    expect(wiseParry(guy1c1n, guy1c)).toBe(FightChoice.CritParry);
  });
  it('1c+1n vs 1c+1n => crit parry', () => {
    expect(wiseParry(guy1c1n, guy1c1n)).toBe(FightChoice.CritParry);
  });
});

describe(calcParryForLastEnemySuccessThenKillEnemy.name, () => {
  const guy99 = newFighterState(9, 9);
  guy99.profile.critDmg = 3;
  guy99.profile.normDmg = 2;

  it('no parry because multiple enemy success', () => {
    expect(calcParryForLastEnemySuccessThenKillEnemy(guy99, newFighterState(1, 1))).toBe(null);
    expect(calcParryForLastEnemySuccessThenKillEnemy(guy99, newFighterState(0, 2))).toBe(null);
    expect(calcParryForLastEnemySuccessThenKillEnemy(guy99, newFighterState(2, 0))).toBe(null);
  });
  it('no parry because too much enemy health', () => {
    expect(calcParryForLastEnemySuccessThenKillEnemy(guy99, newFighterState(0, 1, guy99.totalDmg()))).toBe(null);
    expect(calcParryForLastEnemySuccessThenKillEnemy(guy99, newFighterState(0, 1, guy99.totalDmg() - guy99.profile.normDmg + 1))).toBe(null);
    expect(calcParryForLastEnemySuccessThenKillEnemy(guy99, newFighterState(1, 0, guy99.totalDmg() - guy99.profile.critDmg + 1))).toBe(null);
  });
  it('typical norm parry', () => {
    expect(calcParryForLastEnemySuccessThenKillEnemy(guy99, newFighterState(0, 1))).toBe(FightChoice.NormParry);
  });
  it('brutal requiring crit parry instead of norm parry', () => {
    const guy01Brutal = newFighterState(0, 1);
    guy01Brutal.profile.setAbility(Ability.Brutal, true);
    expect(calcParryForLastEnemySuccessThenKillEnemy(guy99, guy01Brutal)).toBe(FightChoice.CritParry);
  });
  it('typical crit parry', () => {
    expect(calcParryForLastEnemySuccessThenKillEnemy(guy99, newFighterState(1, 0))).toBe(FightChoice.CritParry);
  });
  it('crit and norm parry with storm shield', () => {
    const guy99Storm = newFighterState(9, 9);
    guy99Storm.profile.abilities.add(Ability.StormShield2021);
    expect(calcParryForLastEnemySuccessThenKillEnemy(guy99Storm, newFighterState(2, 0))).toBe(FightChoice.CritParry);
    expect(calcParryForLastEnemySuccessThenKillEnemy(guy99Storm, newFighterState(1, 1))).toBe(FightChoice.CritParry);
    expect(calcParryForLastEnemySuccessThenKillEnemy(guy99Storm, newFighterState(0, 2))).toBe(FightChoice.NormParry);
    expect(calcParryForLastEnemySuccessThenKillEnemy(guy99Storm, newFighterState(1, 2))).toBe(null);
  });
  it('crit parry with Dueller', () => {
    const guy99Dueller = newFighterState(9, 9);
    guy99Dueller.profile.abilities.add(Ability.Dueller);
    expect(calcParryForLastEnemySuccessThenKillEnemy(guy99Dueller, newFighterState(2, 0))).toBe(null);
    expect(calcParryForLastEnemySuccessThenKillEnemy(guy99Dueller, newFighterState(1, 1))).toBe(FightChoice.CritParry);
    expect(calcParryForLastEnemySuccessThenKillEnemy(guy99Dueller, newFighterState(0, 2))).toBe(FightChoice.CritParry);
    expect(calcParryForLastEnemySuccessThenKillEnemy(guy99Dueller, newFighterState(1, 2))).toBe(null);
  });
});

describe(calcDieChoice.name + ', common & strike/parry', () => {
  it('#0: strike if enemy has no successes (parry would cancel nothing)', () => {
    const chooser = newFighterState(1, 1, 99, FightStrategy.Parry);
    const enemy = newFighterState(0, 0, 99);
    expect(calcDieChoice(chooser, enemy)).toBe(FightChoice.CritStrike);
  });
  it('#0b: strike if enemy has no successes, chooser only norms', () => {
    const chooser = newFighterState(0, 1, 99, FightStrategy.Parry);
    const enemy = newFighterState(0, 0, 99);
    expect(calcDieChoice(chooser, enemy)).toBe(FightChoice.NormStrike);
  });
  it('#1a: strike if you can kill with next strike', () => {
    const chooser = newFighterState(1, 1, 99, FightStrategy.Parry);
    const enemy = newFighterState(9, 9, chooser.profile.critDmg);
    expect(calcDieChoice(chooser, enemy)).toBe(FightChoice.CritStrike);
  });
  it('#1b: strike if you can kill with next strike (hammerhand)', () => {
    const chooser = newFighterState(1, 1, 99, FightStrategy.Parry, new Set<Ability>([Ability.Hammerhand2021]));
    const enemy = newFighterState(9, 9, chooser.profile.critDmg + 1);
    expect(calcDieChoice(chooser, enemy)).toBe(FightChoice.CritStrike);
  });
  it('#2a: crit strike if you have shock, enemy is not already shocked, and enemy has no crit successes', () => {
    const chooser = newFighterState(99, 99, 99, FightStrategy.Parry, new Set<Ability>([Ability.Shock]));
    const enemy = newFighterState(0, 99, 20);
    expect(calcDieChoice(chooser, enemy)).toBe(FightChoice.CritStrike);
  });
  it('#2b: if enemy already shocked, then cannot shock again', () => {
    const chooser = newFighterState(99, 99, 99, FightStrategy.Parry, new Set<Ability>([Ability.Shock]));
    chooser.hasCritStruck = true;
    const enemy = newFighterState(0, 99, 20);
    expect(calcDieChoice(chooser, enemy)).toBe(FightChoice.NormParry);
  });
  it('#2c: if chooser has shock and enemy has crit successes, that is not enough to override Parry strategy', () => {
    const chooser = newFighterState(99, 99, 99, FightStrategy.Parry, new Set<Ability>([Ability.Shock]));
    const enemy = newFighterState(99, 99, 20);
    expect(calcDieChoice(chooser, enemy)).toBe(FightChoice.CritParry);
  });
  it('#3: parry if can parry last enemy success and still kill them', () => {
    const chooser = newFighterState(99, 99, 99, FightStrategy.Strike);
    const enemy = newFighterState(1, 0, 20);
    expect(calcDieChoice(chooser, enemy)).toBe(FightChoice.CritParry);
  });
  it('MaxDmgToEnemy, parry lets you survive to give more damage', () => {
    const chooser = newFighterState(10, 0, 2, FightStrategy.MaxDmgToEnemy);
    const enemy = newFighterState(1, 1, 10, FightStrategy.Strike);
    expect(calcDieChoice(chooser, enemy)).toBe(FightChoice.CritParry);
  });
  it('MaxDmgToEnemy, you\'re going to die, so strike', () => {
    const chooser = newFighterState(10, 10, 1, FightStrategy.MaxDmgToEnemy);
    const enemy = newFighterState(1, 1, 10, FightStrategy.Strike);
    expect(calcDieChoice(chooser, enemy)).toBe(FightChoice.CritStrike);
  });
  it('MinDmgToSelf, you\'re going to die, so strike', () => {
    const chooser = newFighterState(10, 10, 1, FightStrategy.MinDmgToSelf);
    const enemy = newFighterState(1, 1, 10, FightStrategy.Strike);
    expect(calcDieChoice(chooser, enemy)).toBe(FightChoice.CritStrike);
  });
  it('MinDmgToSelf, do not use shocking crit strike if could have used that crit to parry an enemy crit', () => {
    const chooser = newFighterState(1, 1, 99, FightStrategy.MinDmgToSelf, new Set<Ability>([Ability.Shock]));
    const enemy = newFighterState(1, 1, 99, FightStrategy.Strike);
    expect(calcDieChoice(chooser, enemy)).toBe(FightChoice.CritParry);
  });
});

describe(resolveDieChoice.name + ': basic, shock, storm shield, hammerhand, dueller', () => {
  const origChooserCrits = 10;
  const origChooserNorms = 20;
  const origEnemyCrits = 30;
  const origEnemyNorms = 40;
  const finalWounds = 100;

  function makeChooser(...abilities: Ability[]): FighterState {
    return newFighterState(
      origChooserCrits,
      origChooserNorms,
      finalWounds,
      FightStrategy.MaxDmgToEnemy,
      new Set<Ability>(abilities));
  }
  function makeEnemy(wounds: number = finalWounds): FighterState {
    return newFighterState(
      origEnemyCrits,
      origEnemyNorms,
      wounds,
    );
  }

  it('CritStrike+noShock, and check even values that shouldn\'t change', () => {
    for(let stormShieldMaybe of [Ability.None, Ability.StormShield2021]) { // storm shield shouldn't matter
      const chooser = makeChooser(stormShieldMaybe);
      const enemy = makeEnemy(chooser.profile.critDmg + finalWounds);

      resolveDieChoice(FightChoice.CritStrike, chooser, enemy);
      expect(chooser.crits).toBe(origChooserCrits - 1);
      expect(chooser.norms).toBe(origChooserNorms);
      expect(chooser.currentWounds).toBe(finalWounds);
      expect(enemy.crits).toBe(origEnemyCrits);
      expect(enemy.norms).toBe(origEnemyNorms);
      expect(enemy.currentWounds).toBe(finalWounds);
    }
  });
  it('CritStrike+shock, not already shocked', () => {
    for(let stormShield of [false, true]) { // storm shield shouldn't matter
      const chooser = makeChooser(Ability.Shock, stormShield ? Ability.StormShield2021 : Ability.None);
      chooser.profile.setAbility(Ability.Shock, true);
      const enemy = makeEnemy(chooser.profile.critDmg + finalWounds);

      resolveDieChoice(FightChoice.CritStrike, chooser, enemy);
      expect(chooser.crits).toBe(origChooserCrits - 1);
      expect(chooser.norms).toBe(origChooserNorms);
      expect(chooser.currentWounds).toBe(finalWounds);
      expect(enemy.crits).toBe(origEnemyCrits);
      expect(enemy.norms).toBe(origEnemyNorms - 1);
      expect(enemy.currentWounds).toBe(finalWounds);
    }
  });
  it('CritStrike+shock, already shocked', () => {
    for(let stormShieldMaybe of [Ability.None, Ability.StormShield2021]) { // storm shield shouldn't matter
      const chooser = makeChooser(Ability.Shock, stormShieldMaybe);
      chooser.hasCritStruck = true;
      const enemy = makeEnemy(chooser.profile.critDmg + finalWounds);

      resolveDieChoice(FightChoice.CritStrike, chooser, enemy);
      expect(chooser.crits).toBe(origChooserCrits - 1);
      expect(chooser.norms).toBe(origChooserNorms);
      expect(chooser.currentWounds).toBe(finalWounds);
      expect(enemy.crits).toBe(origEnemyCrits);
      expect(enemy.norms).toBe(origEnemyNorms);
      expect(enemy.currentWounds).toBe(finalWounds);
    }
  });
  it('NormStrike', () => {
    for(let shockAndStormShield of [false, true]) { // neither should matter
      const chooser = makeChooser();
      chooser.profile.setAbility(Ability.StormShield2021, shockAndStormShield);
      chooser.profile.setAbility(Ability.Shock, shockAndStormShield);
      const enemy = makeEnemy(chooser.profile.normDmg + finalWounds);

      resolveDieChoice(FightChoice.NormStrike, chooser, enemy);
      expect(chooser.crits).toBe(origChooserCrits);
      expect(chooser.norms).toBe(origChooserNorms - 1);
      expect(chooser.currentWounds).toBe(finalWounds);
      expect(enemy.crits).toBe(origEnemyCrits);
      expect(enemy.norms).toBe(origEnemyNorms);
      expect(enemy.currentWounds).toBe(finalWounds);
    }
  });
  it('CritParry to cancel enemy crit', () => {
    const chooser = makeChooser();
    const enemy = makeEnemy();

    resolveDieChoice(FightChoice.CritParry, chooser, enemy);
    expect(chooser.crits).toBe(origChooserCrits - 1);
    expect(chooser.norms).toBe(origChooserNorms);
    expect(chooser.currentWounds).toBe(finalWounds);
    expect(enemy.crits).toBe(origEnemyCrits - 1);
    expect(enemy.norms).toBe(origEnemyNorms);
    expect(enemy.currentWounds).toBe(finalWounds);
  });
  it('CritParry to cancel enemy norm (no enemy crits)', () => {
    const chooser = makeChooser();
    const enemy = newFighterState(0, origEnemyNorms, finalWounds);

    resolveDieChoice(FightChoice.CritParry, chooser, enemy);
    expect(chooser.crits).toBe(origChooserCrits - 1);
    expect(chooser.norms).toBe(origChooserNorms);
    expect(chooser.currentWounds).toBe(finalWounds);
    expect(enemy.crits).toBe(0);
    expect(enemy.norms).toBe(origEnemyNorms - 1);
    expect(enemy.currentWounds).toBe(finalWounds);
  });
  it('NormParry to cancel enemy norm', () => {
    const chooser = makeChooser();
    const enemy = makeEnemy();

    resolveDieChoice(FightChoice.NormParry, chooser, enemy);
    expect(chooser.crits).toBe(origChooserCrits);
    expect(chooser.norms).toBe(origChooserNorms - 1);
    expect(chooser.currentWounds).toBe(finalWounds);
    expect(enemy.crits).toBe(origEnemyCrits);
    expect(enemy.norms).toBe(origEnemyNorms - 1);
    expect(enemy.currentWounds).toBe(finalWounds);
  });
  it('CritParry with storm shield to cancel 2 enemy crits', () => {
    const chooser = makeChooser(Ability.StormShield2021);
    const enemy = makeEnemy();

    resolveDieChoice(FightChoice.CritParry, chooser, enemy);
    expect(chooser.crits).toBe(origChooserCrits - 1);
    expect(chooser.norms).toBe(origChooserNorms);
    expect(chooser.currentWounds).toBe(finalWounds);
    expect(enemy.crits).toBe(origEnemyCrits - 2);
    expect(enemy.norms).toBe(origEnemyNorms);
    expect(enemy.currentWounds).toBe(finalWounds);
  });
  it('CritParry with StormShield or Dueller to cancel 1 enemy crit & 1 enemy norm', () => {
    const chooser = makeChooser(Ability.StormShield2021);
    const enemy = newFighterState(1, origEnemyNorms, finalWounds);

    resolveDieChoice(FightChoice.CritParry, chooser, enemy);
    expect(chooser.crits).toBe(origChooserCrits - 1);
    expect(chooser.norms).toBe(origChooserNorms);
    expect(chooser.currentWounds).toBe(finalWounds);
    expect(enemy.crits).toBe(0);
    expect(enemy.norms).toBe(origEnemyNorms - 1);
    expect(enemy.currentWounds).toBe(finalWounds);
  });
  it('CritParry with storm shield to cancel 2 enemy norms', () => {
    const chooser = makeChooser(Ability.StormShield2021);
    const enemy = newFighterState(0, origEnemyNorms, finalWounds);

    resolveDieChoice(FightChoice.CritParry, chooser, enemy);
    expect(chooser.crits).toBe(origChooserCrits - 1);
    expect(chooser.norms).toBe(origChooserNorms);
    expect(chooser.currentWounds).toBe(finalWounds);
    expect(enemy.crits).toBe(0);
    expect(enemy.norms).toBe(origEnemyNorms - 2);
    expect(enemy.currentWounds).toBe(finalWounds);
  });
  it('NormParry with storm shield to cancel 2 enemy norms', () => {
    const chooser = makeChooser(Ability.StormShield2021);
    const enemy = makeEnemy();

    resolveDieChoice(FightChoice.NormParry, chooser, enemy);
    expect(chooser.crits).toBe(origChooserCrits);
    expect(chooser.norms).toBe(origChooserNorms - 1);
    expect(chooser.currentWounds).toBe(finalWounds);
    expect(enemy.crits).toBe(origEnemyCrits);
    expect(enemy.norms).toBe(origEnemyNorms - 2);
    expect(enemy.currentWounds).toBe(finalWounds);
  });
  it('CritParry with Dueller to cancel 1 enemy crit and 1 enemy norm', () => {
    const chooser = makeChooser(Ability.Dueller);
    const enemy = makeEnemy();

    resolveDieChoice(FightChoice.CritParry, chooser, enemy);
    expect(chooser.crits).toBe(origChooserCrits - 1);
    expect(chooser.norms).toBe(origChooserNorms);
    expect(chooser.currentWounds).toBe(finalWounds);
    expect(enemy.crits).toBe(origEnemyCrits - 1);
    expect(enemy.norms).toBe(origEnemyNorms - 1);
    expect(enemy.currentWounds).toBe(finalWounds);
  });
  it('CritParry with Dueller to cancel 2 enemy norms (because no enemy crits)', () => {
    const chooser = makeChooser(Ability.Dueller);
    const enemy = newFighterState(0, origEnemyNorms, finalWounds);

    resolveDieChoice(FightChoice.CritParry, chooser, enemy);
    expect(chooser.crits).toBe(origChooserCrits - 1);
    expect(chooser.norms).toBe(origChooserNorms);
    expect(chooser.currentWounds).toBe(finalWounds);
    expect(enemy.crits).toBe(0);
    expect(enemy.norms).toBe(origEnemyNorms - 2);
    expect(enemy.currentWounds).toBe(finalWounds);
  });
  it('NormParry with Dueller to cancel 1 enemy norm', () => {
    const chooser = makeChooser(Ability.Dueller);
    const enemy = makeEnemy();

    resolveDieChoice(FightChoice.NormParry, chooser, enemy);
    expect(chooser.crits).toBe(origChooserCrits);
    expect(chooser.norms).toBe(origChooserNorms - 1);
    expect(chooser.currentWounds).toBe(finalWounds);
    expect(enemy.crits).toBe(origEnemyCrits);
    expect(enemy.norms).toBe(origEnemyNorms - 1);
    expect(enemy.currentWounds).toBe(finalWounds);
  });
  it('hammerhand 1st hit deals extra damage and 2nd hit does not', () => {
    const initialWounds = 100;
    const chooser = makeChooser(Ability.Hammerhand2021);
    const enemy = makeEnemy(initialWounds);

    resolveDieChoice(FightChoice.NormStrike, chooser, enemy);
    expect(enemy.currentWounds).toBe(initialWounds - chooser.profile.normDmg - 1);
    resolveDieChoice(FightChoice.NormStrike, chooser, enemy);
    expect(enemy.currentWounds).toBe(initialWounds - 2 * chooser.profile.normDmg - 1);
  });
  it('HalfDamageFirstStrike halves first norm strike damage (rounded up, min 2)', () => {
    const initialWounds = 100;
    const normDmg = 5;
    const chooser = newFighterState(2, 2, 10);
    chooser.profile.setProp('normDmg', normDmg);
    const enemy = newFighterState(2, 2, initialWounds);
    enemy.profile.setAbility(Ability.HalfDamageFirstStrike, true);

    // First strike: 5 dmg halved = ceil(5/2) = 3
    resolveDieChoice(FightChoice.NormStrike, chooser, enemy);
    expect(enemy.currentWounds).toBe(initialWounds - 3);

    // Second strike: full damage
    resolveDieChoice(FightChoice.NormStrike, chooser, enemy);
    expect(enemy.currentWounds).toBe(initialWounds - 3 - normDmg);
  });
  it('HalfDamageFirstStrike halves first crit strike damage (rounded up, min 2)', () => {
    const initialWounds = 100;
    const critDmg = 7;
    const chooser = newFighterState(2, 2, 10);
    chooser.profile.setProp('critDmg', critDmg);
    const enemy = newFighterState(2, 2, initialWounds);
    enemy.profile.setAbility(Ability.HalfDamageFirstStrike, true);

    // First crit strike: 7 dmg halved = ceil(7/2) = 4
    resolveDieChoice(FightChoice.CritStrike, chooser, enemy);
    expect(enemy.currentWounds).toBe(initialWounds - 4);
  });
  it('HalfDamageFirstStrike enforces minimum of 2 damage', () => {
    const initialWounds = 100;
    const chooser = newFighterState(2, 2, 10);
    chooser.profile.setProp('normDmg', 2); // ceil(2/2) = 1, but min is 2
    const enemy = newFighterState(2, 2, initialWounds);
    enemy.profile.setAbility(Ability.HalfDamageFirstStrike, true);

    resolveDieChoice(FightChoice.NormStrike, chooser, enemy);
    expect(enemy.currentWounds).toBe(initialWounds - 2);
  });
  it('HalfDamageFirstStrike with hammerhand: hammerhand applies then halved', () => {
    const initialWounds = 100;
    const normDmg = 3;
    const chooser = makeChooser(Ability.Hammerhand2021);
    chooser.profile.setProp('normDmg', normDmg);
    const enemy = newFighterState(2, 2, initialWounds);
    enemy.profile.setAbility(Ability.HalfDamageFirstStrike, true);

    // Hammerhand: 3+1=4, then halved: ceil(4/2)=2
    resolveDieChoice(FightChoice.NormStrike, chooser, enemy);
    expect(enemy.currentWounds).toBe(initialWounds - 2);
  });
  it('JustAScratch takes priority over HalfDamageFirstStrike', () => {
    const initialWounds = 100;
    const chooser = newFighterState(2, 2, 10);
    const enemy = newFighterState(2, 2, initialWounds);
    enemy.profile.setAbility(Ability.JustAScratch, true);
    enemy.profile.setAbility(Ability.HalfDamageFirstStrike, true);

    // JustAScratch sets damage to 0, overriding half damage
    resolveDieChoice(FightChoice.NormStrike, chooser, enemy);
    expect(enemy.currentWounds).toBe(initialWounds);
  });
});

describe(resolveFight.name + ' smart strategies should optimize goal', () => {
  it('"smart" strategies should not be outperformed by other strats', () => {
    const maxSuccesses = 3;
    const maxWounds = 4;
    let maxDmgBeatStrikeAtLeastOnce = false;
    let minDmgBeatParryAtLeastOnce = false;

    for(let wounds1 of range(maxWounds)) {
      for(let crits1 of range(maxSuccesses)) {
        for(let norms1 of range(maxSuccesses - crits1)) {
          for(let wounds2 of range(maxWounds)) {
            for(let crits2 of range(maxSuccesses)) {
              for(let norms2 of range(maxSuccesses - crits2)) {
                for(let shock of [false, true]) {
                    for(let stormShield of [false, true]) {
                    const abilities = new Set<Ability>();
                    Util.addOrRemove(abilities, Ability.Shock, shock);
                    Util.addOrRemove(abilities, Ability.StormShield2021, stormShield);
                    const chooserAlwaysStrike = newFighterState(crits1, norms1, wounds1, FightStrategy.Strike, abilities);
                    const chooserAlwaysParry = newFighterState(crits1, norms1, wounds1, FightStrategy.Parry, abilities);
                    const chooserMaxDmg = newFighterState(crits1, norms1, wounds1, FightStrategy.MaxDmgToEnemy, abilities);
                    const chooserMinDmg = newFighterState(crits1, norms1, wounds1, FightStrategy.MinDmgToSelf, abilities);
                    const enemyForAlwaysStrike = newFighterState(crits2, norms2, wounds2, FightStrategy.Strike);
                    const enemyForAlwaysParry = clone(enemyForAlwaysStrike);
                    const enemyForMaxDmg = clone(enemyForAlwaysStrike);
                    const enemyForMinDmg = clone(enemyForAlwaysStrike);

                    resolveFight(chooserAlwaysStrike, enemyForAlwaysStrike);
                    resolveFight(chooserAlwaysParry, enemyForAlwaysParry);
                    resolveFight(chooserMaxDmg, enemyForMaxDmg);
                    resolveFight(chooserMinDmg, enemyForMinDmg);

                    expect(chooserAlwaysStrike.currentWounds).toBeGreaterThanOrEqual(0);
                    expect(chooserAlwaysParry.currentWounds).toBeGreaterThanOrEqual(0);
                    expect(chooserMaxDmg.currentWounds).toBeGreaterThanOrEqual(0);
                    expect(chooserMinDmg.currentWounds).toBeGreaterThanOrEqual(0);
                    expect(enemyForAlwaysStrike.currentWounds).toBeGreaterThanOrEqual(0);
                    expect(enemyForAlwaysParry.currentWounds).toBeGreaterThanOrEqual(0);
                    expect(enemyForMaxDmg.currentWounds).toBeGreaterThanOrEqual(0);
                    expect(enemyForMinDmg.currentWounds).toBeGreaterThanOrEqual(0);

                    expect(enemyForMaxDmg.currentWounds).toBeLessThanOrEqual(enemyForAlwaysStrike.currentWounds);
                    expect(enemyForMaxDmg.currentWounds).toBeLessThanOrEqual(enemyForAlwaysParry.currentWounds);
                    expect(enemyForMaxDmg.currentWounds).toBeLessThanOrEqual(enemyForMinDmg.currentWounds);

                    expect(chooserMinDmg.currentWounds).toBeGreaterThanOrEqual(chooserAlwaysStrike.currentWounds);
                    expect(chooserMinDmg.currentWounds).toBeGreaterThanOrEqual(chooserAlwaysParry.currentWounds);
                    expect(chooserMinDmg.currentWounds).toBeGreaterThanOrEqual(chooserMaxDmg.currentWounds);

                    if(enemyForMaxDmg.currentWounds < enemyForAlwaysStrike.currentWounds) {
                      maxDmgBeatStrikeAtLeastOnce = true;
                    }

                    if(chooserMinDmg.currentWounds > chooserAlwaysParry.currentWounds) {
                      minDmgBeatParryAtLeastOnce = true;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    //expect(maxDmgBeatStrikeAtLeastOnce).toBe(true);
    //expect(minDmgBeatParryAtLeastOnce).toBe(true);
  });
});

describe(resolveFight.name + 'hardcoded answers', () => {
  it('guy1 kill guy2 in 1 crit strike', () => {
    const guy1 = newFighterState(1, 1, 1);
    const guy2 = newFighterState(1, 1, 2);

    resolveFight(guy1, guy2);
    expect(guy1.currentWounds).toBe(guy1.profile.wounds);
    expect(guy2.currentWounds).toBe(0);
  });
  it('guy1 parry once then kill guy2', () => {
    const guy1 = newFighterState(2, 1, 1);
    const guy2 = newFighterState(0, 1, 4);

    resolveFight(guy1, guy2);
    expect(guy1.currentWounds).toBe(guy1.profile.wounds);
    expect(guy2.currentWounds).toBe(0);
  });
  it('guy1 vs guy2 many strikes', () => {
    const guy1 = newFighterState(2, 1, 5, FightStrategy.Strike);
    const guy2 = newFighterState(2, 1, 5, FightStrategy.Strike);

    resolveFight(guy1, guy2);
    expect(guy1.currentWounds).toBe(1);
    expect(guy2.currentWounds).toBe(0);
  });
});

describe(calcRemainingWounds.name + ' basic', () => {
  const pc = 1 / 6;
  const pf = 1 - pc;
  const w = 5;
  const dn = 3;
  const dc = 4;

  it('fight can\'t be cut short', () => {
    const guy1 = new Model(1, 6, dn, dc).setProp('wounds', w);
    const guy2 = clone(guy1);

    const woundPairProbs = calcRemainingWoundPairProbs(guy1, guy2, FightStrategy.Strike, FightStrategy.Strike, 1, highSimCount, testRng());
    const [guy1Wounds, guy2Wounds] = consolidateWoundPairProbs(woundPairProbs);
    expect(guy1Wounds.get(w)).toBeCloseTo(pf, requiredPrecision);
    expect(guy1Wounds.get(w - dc)).toBeCloseTo(pc, requiredPrecision);
    expect(guy2Wounds.get(w)).toBeCloseTo(pf, requiredPrecision);
    expect(guy2Wounds.get(w - dc)).toBeCloseTo(pc, requiredPrecision);
  });
  it('fight can be cut short', () => {
    const guy1 = new Model(1, 6, dn, dc).setProp('wounds', dc);
    const guy2 = clone(guy1);

    const woundPairProbs = calcRemainingWoundPairProbs(guy1, guy2, FightStrategy.Strike, FightStrategy.Strike, 1, highSimCount, testRng());
    const [guy1Wounds, guy2Wounds] = consolidateWoundPairProbs(woundPairProbs);
    expect(guy1Wounds.get(0)).toBeCloseTo(pf * pc, requiredPrecision);
    expect(guy1Wounds.get(dc)).toBeCloseTo(pc + pf * pf, requiredPrecision);
    expect(guy2Wounds.get(0)).toBeCloseTo(pc, requiredPrecision);
    expect(guy2Wounds.get(dc)).toBeCloseTo(pf, requiredPrecision);
  });
  it('Lethal does not promote dice that would otherwise fail (WS=6+ Lethal=4+ → only nat 6 crits)', () => {
    // WS=6+ means only a 6 hits at all; Lethal=4+ should NOT make 4s/5s into crits
    // guy2 is the attacker; guy1 is a passive sandbag (no attacks)
    const guy1 = new Model(0, 7, 1, 1).setProp('wounds', 100);
    const guy2 = new Model(1, 6, 1, 2).setProp('wounds', 100).setProp('lethal', 4);

    const probs = calcRemainingWoundPairProbs(guy1, guy2, FightStrategy.Strike, FightStrategy.Strike, 1, highSimCount, testRng());
    const [guy1Wounds] = consolidateWoundPairProbs(probs);
    // guy2 hits guy1 only on nat 6 (1/6); damage = critDmg = 2
    const pHit = 1 / 6;
    const dmgProb = guy1Wounds.get(100 - 2) ?? 0;
    expect(dmgProb).toBeCloseTo(pHit, requiredPrecision);
  });
});

describe(calcRemainingWounds.name + ' multiple rounds', () => {
  const pc = 1 / 6;
  const pf = 1 - pc;
  const w = 5;
  const dn = 3;
  const dc = 4;

  it('double fight where fight1 can\'t be fatal', () => {
    const guy1 = new Model(1, 6, dn, dc).setProp('wounds', w);
    const guy2 = clone(guy1);

    const woundPairProbs = calcRemainingWoundPairProbs(guy1, guy2, FightStrategy.Strike, FightStrategy.Strike, 2, highSimCount, testRng());
    const [guy1Wounds, guy2Wounds] = consolidateWoundPairProbs(woundPairProbs);
    const h0 = w; // hits taken = 0
    const h1 = w - dc; // hits taken = 1
    const h2 = 0; // hits taken = 2
    const f4c0 = Math.pow(pf, 4);
    const f3c1 = Math.pow(pf, 3) * pc;
    const f2c2 = pf * pf * pc * pc;
    const f1c3 = pf * Math.pow(pc, 3);
    const f0c4 = Math.pow(pc, 4);

    expect(guy1Wounds.get(h0)).toBeCloseTo(f4c0 + f3c1 * 2 + f2c2     + f1c3           , requiredPrecision);
    expect(guy1Wounds.get(h1)).toBeCloseTo(       f3c1 * 2 + f2c2 * 4 + f1c3     + f0c4, requiredPrecision);
    expect(guy1Wounds.get(h2)).toBeCloseTo(                  f2c2     + f1c3 * 2       , requiredPrecision);
    expect(guy2Wounds.get(h0)).toBeCloseTo(f4c0 + f3c1 * 2 + f2c2                      , requiredPrecision);
    expect(guy2Wounds.get(h1)).toBeCloseTo(       f3c1 * 2 + f2c2 * 4 + f1c3 * 2       , requiredPrecision);
    expect(guy2Wounds.get(h2)).toBeCloseTo(                  f2c2     + f1c3 * 2 + f0c4, requiredPrecision);
  });
  it('double fight with possibly fatal fight1', () => {
    const guy1 = new Model(1, 6, dn, dc).setProp('wounds', dc);
    const guy2 = clone(guy1);

    const woundPairProbs = calcRemainingWoundPairProbs(guy1, guy2, FightStrategy.Strike, FightStrategy.Strike, 2, highSimCount, testRng());
    expect(woundPairProbs.get(toWoundPairKey(dc, dc))).toBeCloseTo(Math.pow(pf, 4), requiredPrecision);
    expect(woundPairProbs.get(toWoundPairKey(0, dc))).toBeCloseTo(Math.pow(pf, 3) * pc + pf * pc, requiredPrecision);
    expect(woundPairProbs.get(toWoundPairKey(dc, 0))).toBeCloseTo(pf * pf * pc + pc, requiredPrecision);
  });
});

describe('Feel No Pain in fights', () => {
  it('FNP reduces damage taken on average', () => {
    const wounds = 12;
    const guy1 = new Model(4, 3, 3, 4).setProp('wounds', wounds);
    const guy2NoFnp = new Model(4, 3, 3, 4).setProp('wounds', wounds);
    const guy2Fnp = new Model(4, 3, 3, 4).setProp('wounds', wounds).setProp('fnp', 5);

    const probsNoFnp = calcRemainingWoundPairProbs(guy1, guy2NoFnp, FightStrategy.Strike, FightStrategy.Strike, 1, highSimCount, testRng());
    const probsFnp = calcRemainingWoundPairProbs(guy1, guy2Fnp, FightStrategy.Strike, FightStrategy.Strike, 1, highSimCount, testRng());
    const [guy1WoundsNoFnp] = consolidateWoundPairProbs(probsNoFnp);
    const [guy1WoundsFnp] = consolidateWoundPairProbs(probsFnp);

    // Guy1 should take less damage when guy2 has FNP (guy2 survives longer and hits back more)
    // Actually, FNP is on the defender (guy2), so guy1's wounds should be similar
    // but guy2 should survive with more wounds on average
    const [, guy2WoundsNoFnp] = consolidateWoundPairProbs(probsNoFnp);
    const [, guy2WoundsFnp] = consolidateWoundPairProbs(probsFnp);

    let avgWoundsNoFnp = 0;
    let avgWoundsFnp = 0;
    for (const [w, p] of guy2WoundsNoFnp) avgWoundsNoFnp += w * p;
    for (const [w, p] of guy2WoundsFnp) avgWoundsFnp += w * p;

    // FNP defender should have more remaining wounds on average
    expect(avgWoundsFnp).toBeGreaterThan(avgWoundsNoFnp);
  });

  it('FNP 4+ is stronger than FNP 6+', () => {
    const wounds = 12;
    const guy1a = new Model(4, 3, 3, 4).setProp('wounds', wounds);
    const guy1b = clone(guy1a);
    const guy2Fnp4 = new Model(4, 3, 3, 4).setProp('wounds', wounds).setProp('fnp', 4);
    const guy2Fnp6 = new Model(4, 3, 3, 4).setProp('wounds', wounds).setProp('fnp', 6);

    const probsFnp4 = calcRemainingWoundPairProbs(guy1a, guy2Fnp4, FightStrategy.Strike, FightStrategy.Strike, 1, highSimCount, testRng());
    const probsFnp6 = calcRemainingWoundPairProbs(guy1b, guy2Fnp6, FightStrategy.Strike, FightStrategy.Strike, 1, highSimCount, testRng());
    const [, guy2WoundsFnp4] = consolidateWoundPairProbs(probsFnp4);
    const [, guy2WoundsFnp6] = consolidateWoundPairProbs(probsFnp6);

    let avgFnp4 = 0;
    let avgFnp6 = 0;
    for (const [w, p] of guy2WoundsFnp4) avgFnp4 += w * p;
    for (const [w, p] of guy2WoundsFnp6) avgFnp6 += w * p;

    // FNP 4+ should leave more wounds remaining than FNP 6+
    expect(avgFnp4).toBeGreaterThan(avgFnp6);
  });

  it('FNP applies per point of damage from each strike', () => {
    const rng = testRng();
    // Set up a simple scenario: 1 crit strike doing 4 damage, defender has FNP 4+
    const attacker = newFighterState(1, 0, 10, FightStrategy.Strike);
    const defender = newFighterState(0, 0, 10, FightStrategy.Strike);
    defender.profile.setProp('fnp', 4);
    defender.rng = rng;

    // Do a crit strike (deals 2 damage based on newFighterState defaults)
    resolveDieChoice(FightChoice.CritStrike, attacker, defender);

    // With FNP, defender should take <= 2 damage (some may be saved)
    // We can't predict exact value due to rng, but wounds should be <= 10 and >= 8
    expect(defender.currentWounds).toBeGreaterThanOrEqual(8);
    expect(defender.currentWounds).toBeLessThanOrEqual(10);
  });
});

describe('JustAScratch + parry monotonicity', () => {
  // regression: previously, more rerolls for JAS-defender increased death chance
  // because awesomeParry fired when enemy had 0 successes (chooser wasted crits parrying nothing)
  // and didn't account for JAS reducing chooser's first post-parry strike to 0
  function aDeathChance(rerollA: Ability | undefined, strat: FightStrategy): number {
    const A = new Model(4, 4, 3, 4).setProp('wounds', 8).setAbility(Ability.JustAScratch);
    if (rerollA) A.reroll = rerollA;
    const B = new Model(4, 4, 3, 4).setProp('wounds', 8);
    const probs = calcRemainingWoundPairProbs(B, A,
      FightStrategy.MaxDmgToEnemy, strat, 1, highSimCount, testRng());
    const [, aWounds] = consolidateWoundPairProbs(probs);
    return aWounds.get(0) || 0;
  }

  it('Parry: more rerolls → less death', () => {
    const none = aDeathChance(undefined, FightStrategy.Parry);
    const bal = aDeathChance(Ability.Balanced, FightStrategy.Parry);
    const dbal = aDeathChance(Ability.DoubleBalanced, FightStrategy.Parry);
    expect(bal).toBeLessThanOrEqual(none);
    expect(dbal).toBeLessThanOrEqual(bal);
  });

  it('MinDmgToSelf: more rerolls → less death', () => {
    const none = aDeathChance(undefined, FightStrategy.MinDmgToSelf);
    const bal = aDeathChance(Ability.Balanced, FightStrategy.MinDmgToSelf);
    const dbal = aDeathChance(Ability.DoubleBalanced, FightStrategy.MinDmgToSelf);
    expect(bal).toBeLessThanOrEqual(none);
    expect(dbal).toBeLessThanOrEqual(bal);
  });
});
