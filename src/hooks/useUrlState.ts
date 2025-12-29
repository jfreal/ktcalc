import { useCallback } from 'react';
import Model from 'src/Model';
import ShootOptions from 'src/ShootOptions';
import Ability from 'src/Ability';

interface SituationState {
  attacker: Model;
  defender: Model;
  shootOptions: ShootOptions;
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
