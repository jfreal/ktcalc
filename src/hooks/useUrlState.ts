import { useCallback } from 'react';
import Model from 'src/Model';
import ShootOptions from 'src/ShootOptions';
import FightOptions from 'src/FightOptions';
import FightStrategy from 'src/FightStrategy';
import Ability, { mutuallyExclusiveFightAbilities } from 'src/Ability';

interface SituationState {
  attacker: Model;
  defender: Model;
  shootOptions: ShootOptions;
}

interface FightState {
  fighterA: Model;
  fighterB: Model;
  fightOptions: FightOptions;
}

// Encode attacker to URL param string
function encodeAttacker(atk: Model): string {
  const abilities: string[] = [];
  if (atk.has(Ability.Rending)) abilities.push('rend');
  if (atk.has(Ability.Severe)) abilities.push('sev');
  if (atk.has(Ability.Punishing)) abilities.push('pun');

  return [
    atk.numDice,
    atk.diceStat,
    atk.normDmg,
    atk.critDmg,
    atk.mwx,
    atk.apx,
    atk.px,
    atk.reroll,
    atk.lethal,
    atk.autoNorms,
    abilities.join('')
  ].join(':');
}

// Encode defender to URL param string
function encodeDefender(def: Model): string {
  const abilities: string[] = [];
  if (def.has(Ability.Indomitus)) abilities.push('ind');
  
  return [
    def.diceStat,
    def.wounds,
    def.autoNorms,
    abilities.join('')
  ].join(':');
}

// Decode attacker from URL param string
function decodeAttacker(param: string): Model {
  const parts = param.split(':');
  if (parts.length < 11) return new Model();

  const atk = new Model();
  atk.numDice = parseInt(parts[0]) || 4;
  atk.diceStat = parseInt(parts[1]) || 3;
  atk.normDmg = parseInt(parts[2]) || 3;
  atk.critDmg = parseInt(parts[3]) || 4;
  atk.mwx = parseInt(parts[4]) || 0;
  atk.apx = parseInt(parts[5]) || 0;
  atk.px = parseInt(parts[6]) || 0;
  atk.reroll = (parts[7] as Ability) || Ability.None;
  atk.lethal = parseInt(parts[8]) || 0;
  atk.autoNorms = parseInt(parts[9]) || 0;
  
  const abilities = parts[10] || '';
  if (abilities.includes('rend')) atk.abilities.add(Ability.Rending);
  if (abilities.includes('sev')) atk.abilities.add(Ability.Severe);
  if (abilities.includes('pun')) atk.abilities.add(Ability.Punishing);
  
  return atk;
}

// Decode defender from URL param string
function decodeDefender(param: string): Model {
  const parts = param.split(':');
  if (parts.length < 3) return Model.basicDefender();
  
  const def = Model.basicDefender();
  def.diceStat = parseInt(parts[0]) || 3;
  def.wounds = parseInt(parts[1]) || 12;
  def.autoNorms = parseInt(parts[2]) || 0;
  
  const abilities = parts[3] || '';
  if (abilities.includes('ind')) def.abilities.add(Ability.Indomitus);
  
  return def;
}

// Encode fighter to URL param string (fight page)
function encodeFighter(f: Model): string {
  const abilities: string[] = [];
  if (f.has(Ability.Rending)) abilities.push('rend');
  if (f.has(Ability.Severe)) abilities.push('sev');
  if (f.has(Ability.Brutal)) abilities.push('bru');
  if (f.has(Ability.Punishing)) abilities.push('pun');
  if (f.has(Ability.Stun2021)) abilities.push('stun');
  if (f.has(Ability.PuritySeal)) abilities.push('purity');
  if (f.has(Ability.Duelist)) abilities.push('duelist');
  if (f.has(Ability.JustAScratch)) abilities.push('jas');
  if (f.has(Ability.Durable)) abilities.push('dur');

  // Niche ability (mutually exclusive fight abilities)
  const nicheAbility = mutuallyExclusiveFightAbilities.find(a => a !== Ability.None && f.abilities.has(a));

  return [
    f.wounds,
    f.numDice,
    f.diceStat,
    f.normDmg,
    f.critDmg,
    f.reroll,
    f.lethal,
    f.autoNorms,
    f.autoCrits,
    f.normsToCrits,
    f.failsToNorms,
    nicheAbility || '',
    abilities.join('')
  ].join(':');
}

// Decode fighter from URL param string (fight page)
function decodeFighter(param: string): Model {
  const parts = param.split(':');
  if (parts.length < 12) return new Model();

  const f = new Model();
  f.wounds = parseInt(parts[0]) || 12;
  f.numDice = parseInt(parts[1]) || 4;
  f.diceStat = parseInt(parts[2]) || 3;
  f.normDmg = parseInt(parts[3]) || 3;
  f.critDmg = parseInt(parts[4]) || 4;
  f.reroll = (parts[5] as Ability) || Ability.None;
  f.lethal = parseInt(parts[6]) || 0;
  f.autoNorms = parseInt(parts[7]) || 0;
  f.autoCrits = parseInt(parts[8]) || 0;
  f.normsToCrits = parseInt(parts[9]) || 0;
  f.failsToNorms = parseInt(parts[10]) || 0;

  // Niche ability
  const nicheStr = parts[11] || '';
  if (nicheStr) {
    const nicheAbility = mutuallyExclusiveFightAbilities.find(a => a === nicheStr);
    if (nicheAbility) f.abilities.add(nicheAbility);
  }

  // Boolean abilities
  const abilities = parts[12] || '';
  if (abilities.includes('rend')) f.abilities.add(Ability.Rending);
  if (abilities.includes('sev')) f.abilities.add(Ability.Severe);
  if (abilities.includes('bru')) f.abilities.add(Ability.Brutal);
  if (abilities.includes('pun')) f.abilities.add(Ability.Punishing);
  if (abilities.includes('stun')) f.abilities.add(Ability.Stun2021);
  if (abilities.includes('purity')) f.abilities.add(Ability.PuritySeal);
  if (abilities.includes('duelist')) f.abilities.add(Ability.Duelist);
  if (abilities.includes('jas')) f.abilities.add(Ability.JustAScratch);
  if (abilities.includes('dur')) f.abilities.add(Ability.Durable);

  return f;
}

// Encode fight options to URL param string
function encodeFightOptions(opts: FightOptions): string {
  return [
    opts.strategyFighterA,
    opts.strategyFighterB,
    opts.firstFighter,
    opts.numRounds,
  ].join(':');
}

// Decode fight options from URL param string
function decodeFightOptions(param: string): FightOptions {
  const parts = param.split(':');
  const opts = new FightOptions();
  if (parts.length < 4) return opts;

  const stratA = parts[0] as FightStrategy;
  if (Object.values(FightStrategy).includes(stratA)) opts.strategyFighterA = stratA;
  const stratB = parts[1] as FightStrategy;
  if (Object.values(FightStrategy).includes(stratB)) opts.strategyFighterB = stratB;
  if (parts[2] === 'A' || parts[2] === 'B') opts.firstFighter = parts[2];
  opts.numRounds = parseInt(parts[3]) || 1;

  return opts;
}

export function getFightStateFromUrl(): FightState | null {
  const params = new URLSearchParams(window.location.search);
  const fa = params.get('fa');
  const fb = params.get('fb');
  if (!fa && !fb) return null;

  const fo = params.get('fo');
  return {
    fighterA: fa ? decodeFighter(fa) : new Model(),
    fighterB: fb ? decodeFighter(fb) : new Model(),
    fightOptions: fo ? decodeFightOptions(fo) : new FightOptions(),
  };
}

export function getStateFromUrl(): { s1?: SituationState; s2?: SituationState } {
  const params = new URLSearchParams(window.location.search);
  const result: { s1?: SituationState; s2?: SituationState } = {};
  
  const a1 = params.get('a1');
  const d1 = params.get('d1');
  if (a1 || d1) {
    result.s1 = {
      attacker: a1 ? decodeAttacker(a1) : new Model(),
      defender: d1 ? decodeDefender(d1) : Model.basicDefender(),
      shootOptions: new ShootOptions(),
    };
  }
  
  const a2 = params.get('a2');
  const d2 = params.get('d2');
  if (a2 || d2) {
    result.s2 = {
      attacker: a2 ? decodeAttacker(a2) : new Model(),
      defender: d2 ? decodeDefender(d2) : Model.basicDefender(),
      shootOptions: new ShootOptions(),
    };
  }
  
  return result;
}

export function useUrlState(
  attacker1: Model,
  defender1: Model,
  attacker2: Model,
  defender2: Model,
) {
  const getShareUrl = useCallback(() => {
    const a1 = encodeAttacker(attacker1);
    const d1 = encodeDefender(defender1);
    const a2 = encodeAttacker(attacker2);
    const d2 = encodeDefender(defender2);
    return `${window.location.origin}${window.location.pathname}?a1=${a1}&d1=${d1}&a2=${a2}&d2=${d2}`;
  }, [attacker1, defender1, attacker2, defender2]);

  const addParamsToUrl = useCallback(() => {
    const a1 = encodeAttacker(attacker1);
    const d1 = encodeDefender(defender1);
    const a2 = encodeAttacker(attacker2);
    const d2 = encodeDefender(defender2);
    const newUrl = `${window.location.pathname}?a1=${a1}&d1=${d1}&a2=${a2}&d2=${d2}`;
    window.history.replaceState({}, '', newUrl);
  }, [attacker1, defender1, attacker2, defender2]);

  return { getShareUrl, addParamsToUrl };
}

export function useFightUrlState(
  fighterA: Model,
  fighterB: Model,
  fightOptions: FightOptions,
) {
  const getShareUrl = useCallback(() => {
    const fa = encodeFighter(fighterA);
    const fb = encodeFighter(fighterB);
    const fo = encodeFightOptions(fightOptions);
    return `${window.location.origin}${window.location.pathname}?view=fight&fa=${fa}&fb=${fb}&fo=${fo}`;
  }, [fighterA, fighterB, fightOptions]);

  const addParamsToUrl = useCallback(() => {
    const fa = encodeFighter(fighterA);
    const fb = encodeFighter(fighterB);
    const fo = encodeFightOptions(fightOptions);
    const newUrl = `${window.location.pathname}?view=fight&fa=${fa}&fb=${fb}&fo=${fo}`;
    window.history.replaceState({}, '', newUrl);
  }, [fighterA, fighterB, fightOptions]);

  return { getShareUrl, addParamsToUrl };
}
