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

const DIE_CRIT = 2;
const DIE_NORM = 1;
const DIE_FAIL = 0;

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

  // Roll raw d6 values (inlined rollD6 to avoid function call overhead)
  const dice = new Array<number>(numDice);
  for (let i = 0; i < numDice; i++) {
    dice[i] = (rng() * 6 | 0) + 1;
  }

  // Apply rerolls
  applyRerolls(dice, model.reroll, critThreshold, normThreshold, rng);

  // Classify final dice (inlined to avoid function call overhead)
  let crits = 0;
  let norms = 0;
  let fails = 0;
  for (let i = 0; i < dice.length; i++) {
    const die = dice[i];
    if (die >= critThreshold) crits++;
    else if (die >= normThreshold) norms++;
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

  // Inline comparisons instead of closure allocations
  if (reroll === Ability.RerollOnes) {
    for (let i = 0; i < dice.length; i++) {
      if (dice[i] === 1) dice[i] = (rng() * 6 | 0) + 1;
    }
  }
  else if (reroll === Ability.Relentless) {
    for (let i = 0; i < dice.length; i++) {
      if (dice[i] < normThreshold) dice[i] = (rng() * 6 | 0) + 1;
    }
  }
  else if (reroll === Ability.CritFishRelentless) {
    for (let i = 0; i < dice.length; i++) {
      if (dice[i] < critThreshold) dice[i] = (rng() * 6 | 0) + 1;
    }
  }
  else if (reroll === Ability.Balanced || reroll === Ability.DoubleBalanced) {
    const maxRerolls = reroll === Ability.DoubleBalanced ? 2 : 1;
    let rerolled = 0;
    for (let i = 0; i < dice.length && rerolled < maxRerolls; i++) {
      if (dice[i] < normThreshold) {
        dice[i] = (rng() * 6 | 0) + 1;
        rerolled++;
      }
    }
  }
  else if (reroll === Ability.RerollMostCommonFail) {
    rerollMostCommonFail(dice, critThreshold, normThreshold, rng);
  }
  else if (reroll === Ability.RerollOnesPlusBalanced) {
    // Step 1: Reroll all 1s, tracking which dice were rerolled via bitmask
    let rerolledMask = 0;
    for (let i = 0; i < dice.length; i++) {
      if (dice[i] === 1) {
        dice[i] = (rng() * 6 | 0) + 1;
        rerolledMask |= (1 << i);
      }
    }
    // Step 2: Balanced rerolls one fail that was NOT already rerolled by RerollOnes
    for (let i = 0; i < dice.length; i++) {
      if (!(rerolledMask & (1 << i)) && dice[i] < normThreshold) {
        dice[i] = (rng() * 6 | 0) + 1;
        break;
      }
    }
  }
  else if (reroll === Ability.RerollMostCommonFailPlusBalanced) {
    // Step 1: RerollMostCommonFail, tracking which dice were rerolled
    const rerolledMask = rerollMostCommonFail(dice, critThreshold, normThreshold, rng);
    // Step 2: Balanced rerolls one fail that was NOT already rerolled
    for (let i = 0; i < dice.length; i++) {
      if (!(rerolledMask & (1 << i)) && dice[i] < normThreshold) {
        dice[i] = (rng() * 6 | 0) + 1;
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
): number {
  // Group fail dice by face value using fixed arrays (faces 1-5 max)
  // counts[face] = count, masks[face] = bitmask of indices
  const counts = [0, 0, 0, 0, 0, 0, 0]; // index by face value 0-6
  const masks = [0, 0, 0, 0, 0, 0, 0];
  let hasAnyFail = false;

  for (let i = 0; i < dice.length; i++) {
    if (dice[i] < normThreshold) {
      const face = dice[i];
      counts[face]++;
      masks[face] |= (1 << i);
      hasAnyFail = true;
    }
  }

  if (!hasAnyFail) return 0;

  // Find the most common fail face (break ties randomly)
  let maxCount = 0;
  let numCandidates = 0;
  let chosenFace = 0;
  // candidate faces stored inline
  const candidates = [0, 0, 0, 0, 0, 0];

  for (let face = 1; face <= 6; face++) {
    if (counts[face] > maxCount) {
      maxCount = counts[face];
      numCandidates = 1;
      candidates[0] = face;
    } else if (counts[face] === maxCount && counts[face] > 0) {
      candidates[numCandidates++] = face;
    }
  }

  chosenFace = numCandidates === 1
    ? candidates[0]
    : candidates[Math.floor(rng() * numCandidates)];

  // Reroll all dice showing the chosen face
  let rerolledMask = masks[chosenFace];
  let remaining = rerolledMask;
  while (remaining) {
    const bit = remaining & (-remaining); // lowest set bit
    const idx = 31 - Math.clz32(bit);
    dice[idx] = (rng() * 6 | 0) + 1;
    remaining ^= bit;
  }

  return rerolledMask;
}
