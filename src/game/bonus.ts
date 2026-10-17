/**
 * Everything that can strengthen one of the player's fighters in battle: Gravity Chamber,
 * gear and awakening all add into one of these.
 */
export interface Bonus {
  /** +0.1 = 10% more attack. */
  atk: number;
  hp: number;
  def: number;
  /** Flat speed. */
  spd: number;
  /** Added crit chance (0.05 = +5%). */
  crit: number;
  /** Extra Ki at the start of battle. */
  ki: number;
  /** Special bar steps already filled at the start. */
  charge: number;
  /** Starting shield as a share of max HP. */
  shield: number;
  /** More healing done. */
  heal: number;
  /** More damage against the class this fighter beats. */
  edge: number;
  /** More damage from specials. */
  specialPower: number;
  /** Special needs this many fewer moves (never below 1). */
  chargeDiscount: number;
  /** More attack while under 30% HP. */
  lastStand: number;
  /** Once per battle, stand back up with this share of max HP (0 = no). */
  secondWind: number;
  /** More damage on this fighter's first hit of the battle. */
  firstStrike: number;
  /** Added share of damage healed by drain specials. */
  drain: number;
}

export function emptyBonus(): Bonus {
  return {
    atk: 0, hp: 0, def: 0, spd: 0, crit: 0, ki: 0, charge: 0, shield: 0, heal: 0, edge: 0,
    specialPower: 0, chargeDiscount: 0, lastStand: 0, secondWind: 0, firstStrike: 0, drain: 0,
  };
}

export function addBonus(a: Bonus, b: Partial<Bonus>): Bonus {
  const out = { ...a };
  for (const [key, value] of Object.entries(b) as [keyof Bonus, number][]) {
    // Second wind does not stack: the strongest one applies.
    out[key] = key === 'secondWind' ? Math.max(out[key], value) : out[key] + value;
  }
  return out;
}

/** Short player-facing text for a bonus, e.g. "+12% ATK · +3 Ki". */
export function describeBonus(b: Partial<Bonus>): string {
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  const parts: string[] = [];
  if (b.atk) parts.push(`+${pct(b.atk)} ATK`);
  if (b.hp) parts.push(`+${pct(b.hp)} HP`);
  if (b.def) parts.push(`+${pct(b.def)} DEF`);
  if (b.spd) parts.push(`+${b.spd} SPD`);
  if (b.crit) parts.push(`+${pct(b.crit)} crit`);
  if (b.ki) parts.push(`+${b.ki} starting Ki`);
  if (b.charge) parts.push(`special starts ${b.charge} step${b.charge === 1 ? '' : 's'} charged`);
  if (b.shield) parts.push(`starts with a ${pct(b.shield)} shield`);
  if (b.heal) parts.push(`+${pct(b.heal)} healing`);
  if (b.edge) parts.push(`+${pct(b.edge)} vs the class it beats`);
  if (b.specialPower) parts.push(`+${pct(b.specialPower)} special damage`);
  if (b.chargeDiscount) parts.push(`special needs ${b.chargeDiscount} fewer move${b.chargeDiscount === 1 ? '' : 's'}`);
  if (b.lastStand) parts.push(`+${pct(b.lastStand)} ATK under 30% HP`);
  if (b.secondWind) parts.push(`once per battle, gets back up at ${pct(b.secondWind)} HP`);
  if (b.firstStrike) parts.push(`+${pct(b.firstStrike)} on the first hit`);
  if (b.drain) parts.push(`drains heal ${pct(b.drain)} more`);
  return parts.join(' · ');
}
