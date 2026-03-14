import Model from "src/Model";
import Ability from "src/Ability";
import { applyPostRollModifications } from "src/CalcEngineCommon";

export type RngFunction = () => number; // returns [0, 1)

// Simple seeded PRNG (mulberry32)
export function mulberry32(seed: number): RngFunction {
  return () => {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (((t ^ (t >>> 14)) >>> 0)) / 4294967296;
  };
}

function rollD6(rng: RngFunction): number {
  return Math.floor(rng() * 6) + 1;
}

function classifyDie(value: number, critThreshold: number, normThreshold: number): 'crit' | 'norm' | 'fail' {
  if (value >= critThreshold) return 'crit';
  if (value >= normThreshold) return 'norm';
  return 'fail';
}

export function simulateFighterDice(
  model: Model,
  defender: Model | undefined,
  rng: RngFunction = Math.random,
): { crits: number; norms: number } {
  const critThreshold = model.critSkill();
  const normThreshold = model.diceStat;

  // Merge defender's ObscuredTarget into abilities if present
  let abilities = model.abilities;
  if (defender?.has(Ability.ObscuredTarget)) {
    abilities = new Set(abilities);
    abilities.add(Ability.ObscuredTarget);
  }

  // Handle auto-dice
  let numDice = model.numDice;
  const autoCrits = Math.min(model.autoCrits, numDice);
  numDice -= autoCrits;
  const autoNorms = Math.min(model.autoNorms, numDice);
  numDice -= autoNorms;

  // Roll raw d6 values
  const dice: number[] = [];
  for (let i = 0; i < numDice; i++) {
    dice.push(rollD6(rng));
  }

  // Apply rerolls
  applyRerolls(dice, model.reroll, critThreshold, normThreshold, rng);

  // Classify final dice
  let crits = 0;
  let norms = 0;
  let fails = 0;
  for (const die of dice) {
    const result = classifyDie(die, critThreshold, normThreshold);
    if (result === 'crit') crits++;
    else if (result === 'norm') norms++;
    else fails++;
  }

  // Apply post-roll modifications (shared with exact engine)
  return applyPostRollModifications(
    crits, norms, fails,
    autoCrits, autoNorms,
    model.failsToNorms, model.normsToCrits,
    abilities,
  );
}

function applyRerolls(
  dice: number[],
  reroll: Ability,
  critThreshold: number,
  normThreshold: number,
  rng: RngFunction,
): void {
  if (reroll === Ability.None) return;

  const isFail = (v: number) => classifyDie(v, critThreshold, normThreshold) === 'fail';
  const isCrit = (v: number) => classifyDie(v, critThreshold, normThreshold) === 'crit';

  if (reroll === Ability.RerollOnes) {
    for (let i = 0; i < dice.length; i++) {
      if (dice[i] === 1) dice[i] = rollD6(rng);
    }
  }
  else if (reroll === Ability.Relentless) {
    for (let i = 0; i < dice.length; i++) {
      if (isFail(dice[i])) dice[i] = rollD6(rng);
    }
  }
  else if (reroll === Ability.CritFishRelentless) {
    for (let i = 0; i < dice.length; i++) {
      if (!isCrit(dice[i])) dice[i] = rollD6(rng);
    }
  }
  else if (reroll === Ability.Balanced || reroll === Ability.DoubleBalanced) {
    const maxRerolls = reroll === Ability.DoubleBalanced ? 2 : 1;
    let rerolled = 0;
    for (let i = 0; i < dice.length && rerolled < maxRerolls; i++) {
      if (isFail(dice[i])) {
        dice[i] = rollD6(rng);
        rerolled++;
      }
    }
  }
  else if (reroll === Ability.RerollMostCommonFail) {
    rerollMostCommonFail(dice, critThreshold, normThreshold, rng);
  }
  else if (reroll === Ability.RerollOnesPlusBalanced) {
    // Step 1: Reroll all 1s, tracking which dice were rerolled
    const rerolledByOnes = new Set<number>();
    for (let i = 0; i < dice.length; i++) {
      if (dice[i] === 1) {
        dice[i] = rollD6(rng);
        rerolledByOnes.add(i);
      }
    }
    // Step 2: Balanced rerolls one fail that was NOT already rerolled by RerollOnes
    for (let i = 0; i < dice.length; i++) {
      if (!rerolledByOnes.has(i) && isFail(dice[i])) {
        dice[i] = rollD6(rng);
        break;
      }
    }
  }
  else if (reroll === Ability.RerollMostCommonFailPlusBalanced) {
    // Step 1: RerollMostCommonFail, tracking which dice were rerolled
    const rerolledIndices = rerollMostCommonFail(dice, critThreshold, normThreshold, rng);
    // Step 2: Balanced rerolls one fail that was NOT already rerolled
    for (let i = 0; i < dice.length; i++) {
      if (!rerolledIndices.has(i) && isFail(dice[i])) {
        dice[i] = rollD6(rng);
        break;
      }
    }
  }
}

function rerollMostCommonFail(
  dice: number[],
  critThreshold: number,
  normThreshold: number,
  rng: RngFunction,
): Set<number> {
  const isFail = (v: number) => classifyDie(v, critThreshold, normThreshold) === 'fail';
  const rerolledIndices = new Set<number>();

  // Group fail dice by face value
  const failFaceGroups = new Map<number, number[]>(); // face value -> indices
  for (let i = 0; i < dice.length; i++) {
    if (isFail(dice[i])) {
      const face = dice[i];
      if (!failFaceGroups.has(face)) failFaceGroups.set(face, []);
      failFaceGroups.get(face)!.push(i);
    }
  }

  if (failFaceGroups.size === 0) return rerolledIndices;

  // Find the most common fail face (break ties randomly)
  let maxCount = 0;
  const candidates: number[] = [];
  for (const [face, indices] of failFaceGroups) {
    if (indices.length > maxCount) {
      maxCount = indices.length;
      candidates.length = 0;
      candidates.push(face);
    } else if (indices.length === maxCount) {
      candidates.push(face);
    }
  }

  const chosenFace = candidates.length === 1
    ? candidates[0]
    : candidates[Math.floor(rng() * candidates.length)];

  // Reroll all dice showing the chosen face
  for (const idx of failFaceGroups.get(chosenFace)!) {
    dice[idx] = rollD6(rng);
    rerolledIndices.add(idx);
  }

  return rerolledIndices;
}
