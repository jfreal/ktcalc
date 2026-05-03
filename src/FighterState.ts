import Model from "src/Model";
import FightStrategy from 'src/FightStrategy';
import FightChoice from "src/FightChoice";
import Ability from "./Ability";
import { MinCritDmgAfterDurable } from "./KtMisc";
import { RngFunction } from "src/MonteCarloFightDice";

export default class FighterState {
  public profile: Model;
  public crits: number;
  public norms: number;
  public strategy: FightStrategy;
  public currentWounds: number;
  public hasStruck: boolean;
  public hasCritStruck: boolean;
  public hasNormStruck: boolean;
  public rng: RngFunction | null;

  public constructor(
    profile: Model,
    crits: number,
    norms: number,
    strategy: FightStrategy,
    currentWounds: number = -1,
    hasStruck: boolean = false,
    hasCritStruck: boolean = false,
    rng: RngFunction | null = null,
    hasNormStruck: boolean = false,
  ) {
    this.profile = profile;
    this.crits = crits;
    this.norms = norms;
    this.strategy = strategy;
    this.currentWounds = currentWounds === -1 ? this.profile.wounds : currentWounds;
    this.hasStruck = hasStruck;
    this.hasCritStruck = hasCritStruck;
    this.hasNormStruck = hasNormStruck;
    this.rng = rng;
  }

  public successes() {
    return this.crits + this.norms;
  }

  public applyDmg(dmg: number) {
    if (this.profile.usesFnp() && this.rng) {
      dmg = this.rollFnp(dmg);
    }
    this.currentWounds = Math.max(0, this.currentWounds - dmg);
  }

  private rollFnp(dmg: number): number {
    // FNP rolls once per strike; on success, reduce that strike's damage by 1
    if (dmg <= 0) return dmg;
    const fnpThreshold = this.profile.fnp;
    const roll = Math.floor(this.rng!() * 6) + 1; // roll 1-6
    return roll >= fnpThreshold ? dmg - 1 : dmg;
  }

  public applyDmgFromStrike(dmg: number, atker: Model, isCrit: boolean) {
    if (isCrit) {
      this.hasCritStruck = true;
    }
  }

  public isFullHealth() {
    return this.currentWounds === this.profile.wounds;
  }

  public hammerhandDmg(
    crits: number | undefined = undefined,
    norms: number | undefined = undefined,
  ) {
    crits = crits || this.crits;
    norms = norms || this.norms;
    return this.profile.abilities.has(Ability.Hammerhand2021)
      && !this.hasStruck
      && (crits > 0 || norms > 0)
      ? 1 : 0;
  }

  public possibleDmg(crits: number, norms: number): number {
    return this.hammerhandDmg(crits, norms) + this.profile.possibleDmg(crits, norms);
  }

  public totalDmg(): number {
    return this.possibleDmg(this.crits, this.norms);
  }

  public nextCritDmgWithDurableAndWithoutHammerhand(enemy: FighterState): number {
    let critDmg = this.profile.critDmg;

    if(enemy.profile.abilities.has(Ability.Durable)
      && !this.hasCritStruck
      && this.profile.critDmg > MinCritDmgAfterDurable
    ) {
      critDmg--;
    }

    return critDmg;
  }

  public nextDmg(enemy: FighterState): number {
    let dmg = 0;

    if (this.crits > 0) {
      dmg += this.nextCritDmgWithDurableAndWithoutHammerhand(enemy);

      if (this.profile.has(Ability.MurderousEntrance2021) && !this.hasCritStruck) {
        dmg += this.profile.critDmg;
      }
    }
    else if (this.norms > 0) {
      dmg += this.profile.normDmg;
    }

    dmg += this.hammerhandDmg();
    return dmg;
  }

  public nextStrike(): FightChoice {
    return this.crits > 0 ? FightChoice.CritStrike : FightChoice.NormStrike;
  }

  public reset(crits: number, norms: number, currentWounds: number): void {
    this.crits = crits;
    this.norms = norms;
    this.currentWounds = currentWounds;
    this.hasStruck = false;
    this.hasCritStruck = false;
    this.hasNormStruck = false;
  }

  public clone(): FighterState {
    return new FighterState(
      this.profile,
      this.crits,
      this.norms,
      this.strategy,
      this.currentWounds,
      this.hasStruck,
      this.hasCritStruck,
      this.rng,
      this.hasNormStruck,
    );
  }

  public withStrategy(strategy: FightStrategy): FighterState {
    const copy = this.clone();
    copy.strategy = strategy;
    return copy;
  }
}
