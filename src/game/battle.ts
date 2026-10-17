import {
  ATTACK_POWER,
  BACK_ROW_WAVE_REDUCTION,
  BLASTER_WAVE_BONUS,
  BOSS_ATK_MULTIPLIER,
  BOSS_HP_MULTIPLIER,
  CLASS_ADVANTAGE,
  CLASS_DISADVANTAGE,
  CRIT_CHANCE,
  CRIT_MULTIPLIER,
  DRAINER_DRAIN_SHARE,
  DRAIN_SHARE,
  GUARD_REDUCTION,
  KI_BLAST_COST,
  KI_BLAST_POWER,
  KI_CHARGE,
  KI_MAX,
  KI_PER_ATTACK,
  KI_START,
  MAX_SHIELD_SHARE,
  MINI_BOSS_ATK_MULTIPLIER,
  MINI_BOSS_HP_MULTIPLIER,
  RALLY_TURNS,
  ASSASSIN_SINGLE_BONUS,
  SUPPORT_HEAL_BONUS,
  TANK_DAMAGE_TAKEN,
  enemyStrengthForStage,
} from './balance';
import { isBackRow, statsFor, unitName } from './progression';
import { type Combo, type Role, classEdge, combosWith, getFamily, roleFor } from './roster';
import { type Rng, defaultRng } from './rng';
import type { Stage } from './stages';
import { type Bonus, emptyBonus } from './bonus';
import type { Special, Unit } from './types';

export type Side = 'player' | 'enemy';
export type ActionKind = 'attack' | 'kiBlast' | 'special' | 'charge' | 'guard' | 'combo';
export type Row = 'front' | 'back';

export interface Fighter {
  id: string;
  side: Side;
  familyId: string;
  star: number;
  level: number;
  name: string;
  rank: 'minion' | 'miniBoss' | 'boss';
  role: Role;
  /** Formation pad (0-4); odd pads are the back row. */
  slot: number;
  row: Row;
  maxHp: number;
  hp: number;
  atk: number;
  def: number;
  spd: number;
  ki: number;
  guarding: boolean;
  /** Moves made toward the special; it is ready at `special.charge`. */
  charge: number;
  /** Once-per-battle specials (revive) cannot be used again. */
  specialSpent: boolean;
  /** Damage absorbed before HP. */
  shield: number;
  /** Skips this fighter's next turn. */
  stunned: boolean;
  /** Own turns left with the rally attack bonus. */
  rallyTurns: number;
  rallyBonus: number;
  /** Gear, Gravity and awakening bonuses (empty for enemies). */
  bonus: Bonus;
  secondWindUsed: boolean;
  /** Has landed a hit this battle (for first-strike bonuses). */
  struck: boolean;
}

export interface BattleState {
  fighters: Fighter[];
  turn: Side;
  round: number;
  /** Fighters that already acted (or were stunned) during the current side's turn. */
  acted: string[];
  result: 'ongoing' | 'won' | 'lost';
}

export type HitKind = 'damage' | 'heal' | 'revive' | 'shield' | 'stun' | 'rally' | 'resist';

export interface Hit {
  targetId: string;
  kind: HitKind;
  amount: number;
  crit: boolean;
  /** Damage soaked by a shield. */
  absorbed: number;
  ko: boolean;
}

export interface ActionEvent {
  actorId: string;
  kind: ActionKind;
  label: string;
  hits: Hit[];
}

export interface Action {
  kind: ActionKind;
  targetId?: string;
}

function placement(familyId: string, slot: number) {
  return { role: roleFor(getFamily(familyId)), slot, row: (isBackRow(slot) ? 'back' : 'front') as Row };
}

const FRESH = {
  ki: KI_START,
  guarding: false,
  charge: 0,
  specialSpent: false,
  shield: 0,
  stunned: false,
  rallyTurns: 0,
  rallyBonus: 0,
  secondWindUsed: false,
  struck: false,
};

export interface BattleOptions {
  /** Gear, Gravity and awakening bonuses for each of the player's fighters. */
  bonusFor?: (unit: Unit) => Bonus;
}

/** `team` is the five formation pads in order, with null for empty ones. */
export function createBattle(team: (Unit | null)[], stage: Stage, options: BattleOptions = {}): BattleState {
  const strength = enemyStrengthForStage(stage.number);
  const rule = stage.rule;
  // "max3" keeps only the first three fighters by pad.
  let allowed = rule === 'max3' ? 3 : Infinity;
  const players: Fighter[] = team.flatMap((u, slot) => {
    if (!u || allowed <= 0) return [];
    allowed--;
    const base = statsFor(u.familyId, u.star, u.level);
    const b = options.bonusFor?.(u) ?? emptyBonus();
    const s = {
      hp: Math.round(base.hp * (1 + b.hp)),
      atk: Math.round(base.atk * (1 + b.atk)),
      def: Math.round(base.def * (1 + b.def)),
      spd: base.spd + b.spd,
    };
    const need = Math.max(1, getFamily(u.familyId).special.charge - b.chargeDiscount);
    const fighter: Fighter = {
      id: `p-${u.uid}`,
      side: 'player',
      familyId: u.familyId,
      star: u.star,
      level: u.level,
      name: unitName(u),
      rank: 'minion',
      ...placement(u.familyId, slot),
      maxHp: s.hp,
      hp: s.hp,
      atk: s.atk,
      def: s.def,
      spd: s.spd,
      ...FRESH,
      ki: Math.min(KI_MAX, KI_START + b.ki),
      charge: Math.min(need, b.charge),
      shield: Math.round(s.hp * b.shield),
      bonus: b,
    };
    return [fighter];
  });
  if (players.length === 0) throw new Error('Your team has no fighters');
  const enemies: Fighter[] = stage.enemies.map((e, i) => {
    const s = statsFor(e.familyId, e.star, e.level);
    const hpMul = e.rank === 'boss' ? BOSS_HP_MULTIPLIER : e.rank === 'miniBoss' ? MINI_BOSS_HP_MULTIPLIER : 1;
    const atkMul = e.rank === 'boss' ? BOSS_ATK_MULTIPLIER : e.rank === 'miniBoss' ? MINI_BOSS_ATK_MULTIPLIER : 1;
    const hp = Math.round(s.hp * hpMul * strength * (rule === 'tough' ? 1.5 : 1));
    const special = getFamily(e.familyId).special;
    return {
      id: `e-${i}`,
      side: 'enemy',
      familyId: e.familyId,
      star: e.star,
      level: e.level,
      name: unitName(e),
      rank: e.rank,
      ...placement(e.familyId, i),
      maxHp: hp,
      hp,
      atk: Math.round(s.atk * atkMul * strength),
      def: Math.round(s.def * strength),
      spd: s.spd,
      ...FRESH,
      bonus: emptyBonus(),
      charge: rule === 'fullSpecials' ? special.charge : 0,
      shield: rule === 'enemyShields' ? Math.round(hp * 0.3) : 0,
    };
  });
  return { fighters: [...players, ...enemies], turn: 'player', round: 1, acted: [], result: 'ongoing' };
}

export function living(state: BattleState, side: Side): Fighter[] {
  return state.fighters.filter((f) => f.side === side && f.hp > 0);
}

function fallen(state: BattleState, side: Side): Fighter[] {
  return state.fighters.filter((f) => f.side === side && f.hp <= 0);
}

function opposite(side: Side): Side {
  return side === 'player' ? 'enemy' : 'player';
}

export function specialOf(fighter: Fighter): Special {
  return getFamily(fighter.familyId).special;
}

/** Fastest living fighter on the active side that has not acted yet. */
export function nextActor(state: BattleState): Fighter | null {
  if (state.result !== 'ongoing') return null;
  const ready = living(state, state.turn)
    .filter((f) => !state.acted.includes(f.id))
    .sort((a, b) => b.spd - a.spd);
  return ready[0] ?? null;
}

/** Moves needed to fill this fighter's special bar. */
export function specialNeed(fighter: Fighter): number {
  return Math.max(1, specialOf(fighter).charge - fighter.bonus.chargeDiscount);
}

export function specialReady(fighter: Fighter): boolean {
  return !fighter.specialSpent && fighter.charge >= specialNeed(fighter);
}

/** A combo this fighter can fire now: a partner on its side is standing and both bars are full. */
export function comboFor(state: BattleState, fighter: Fighter): { combo: Combo; partner: Fighter } | null {
  if (fighter.hp <= 0 || !specialReady(fighter)) return null;
  for (const combo of combosWith(fighter.familyId)) {
    const other = combo.parts[0] === fighter.familyId ? combo.parts[1] : combo.parts[0];
    const partner = living(state, fighter.side).find((f) => f.familyId === other && f.id !== fighter.id && specialReady(f));
    if (partner) return { combo, partner };
  }
  return null;
}

export function canUse(state: BattleState, fighter: Fighter, kind: ActionKind): boolean {
  if (kind === 'kiBlast') return fighter.ki >= KI_BLAST_COST;
  if (kind === 'combo') return comboFor(state, fighter) !== null;
  if (kind === 'special') {
    if (!specialReady(fighter)) return false;
    if (specialOf(fighter).kind === 'revive') return fallen(state, fighter.side).length > 0;
  }
  return true;
}

/**
 * Who a single-target attack may hit: the front row shields the back row while
 * anyone in it stands, and a front-row Tank draws every single-target attack.
 */
export function legalTargets(state: BattleState, side: Side): Fighter[] {
  const foes = living(state, opposite(side));
  const front = foes.filter((f) => f.row === 'front');
  if (front.length === 0) return foes;
  const tanks = front.filter((f) => f.role === 'Tank');
  return tanks.length > 0 ? tanks : front;
}

/** Fighters the action can be aimed at, or null when the action needs no target. */
export function targetsFor(state: BattleState, fighter: Fighter, kind: ActionKind): Fighter[] | null {
  if (kind === 'attack' || kind === 'kiBlast') return legalTargets(state, fighter.side);
  if (kind === 'combo') {
    const c = comboFor(state, fighter)?.combo;
    return c && (c.kind === 'beam' || c.kind === 'drain') ? legalTargets(state, fighter.side) : null;
  }
  if (kind !== 'special') return null;
  const special = specialOf(fighter).kind;
  if (special === 'beam' || special === 'drain' || special === 'stun') return legalTargets(state, fighter.side);
  if (special === 'revive') return fallen(state, fighter.side);
  return null;
}

function damage(
  attacker: Fighter,
  defender: Fighter,
  mult: number,
  wave: boolean,
  special: boolean,
  rng: Rng,
): { amount: number; crit: boolean } {
  const b = attacker.bonus;
  let atk = attacker.atk * (attacker.rallyTurns > 0 ? 1 + attacker.rallyBonus : 1);
  if (b.lastStand && attacker.hp / attacker.maxHp < 0.3) atk *= 1 + b.lastStand;
  // atk / (atk + def) keeps fights the same length at every level when both sides are even.
  let base = atk * (atk / (atk + defender.def)) * 0.9 * mult;
  if (attacker.role === 'Assassin' && !wave) base *= ASSASSIN_SINGLE_BONUS;
  if (attacker.role === 'Blaster' && wave) base *= BLASTER_WAVE_BONUS;
  if (defender.role === 'Tank') base *= TANK_DAMAGE_TAKEN;
  const edge = classEdge(attacker.role, defender.role);
  if (edge === 'strong') base *= CLASS_ADVANTAGE + b.edge;
  else if (edge === 'weak') base *= CLASS_DISADVANTAGE;
  if (special) base *= 1 + b.specialPower;
  if (!attacker.struck) base *= 1 + b.firstStrike;
  if (wave && defender.row === 'back') base *= BACK_ROW_WAVE_REDUCTION;
  const crit = rng() < CRIT_CHANCE + b.crit;
  const variance = 0.9 + rng() * 0.2;
  let amount = base * variance * (crit ? CRIT_MULTIPLIER : 1);
  if (defender.guarding) amount *= GUARD_REDUCTION;
  return { amount: Math.max(1, Math.round(amount)), crit };
}

/** Applies one fighter's action and advances the turn when the whole side has acted. */
export function performAction(state: BattleState, action: Action, rng: Rng = defaultRng): { state: BattleState; event: ActionEvent } {
  const actor = nextActor(state);
  if (!actor) throw new Error('No fighter can act');
  if (!canUse(state, actor, action.kind)) throw new Error('That move is not ready');

  // Work on copies so the previous state stays untouched.
  const fighters = new Map(state.fighters.map((f) => [f.id, { ...f }]));
  const self = fighters.get(actor.id)!;
  const hits: Hit[] = [];
  const pick = (candidates: Fighter[]) => fighters.get((candidates.find((f) => f.id === action.targetId) ?? candidates[0]).id)!;

  const strike = (target: Fighter, mult: number, wave = false) => {
    const { amount, crit } = damage(self, target, mult, wave, action.kind === 'special' || action.kind === 'combo', rng);
    self.struck = true;
    const absorbed = Math.min(target.shield, amount);
    target.shield -= absorbed;
    const dealt = Math.min(target.hp, amount - absorbed);
    target.hp -= dealt;
    hits.push({ targetId: target.id, kind: 'damage', amount, crit, absorbed, ko: target.hp <= 0 });
    // Second wind: stand back up once per battle.
    if (target.hp <= 0 && target.bonus.secondWind > 0 && !target.secondWindUsed) {
      target.secondWindUsed = true;
      target.hp = Math.max(1, Math.round(target.maxHp * target.bonus.secondWind));
      hits[hits.length - 1].ko = false;
      hits.push({ targetId: target.id, kind: 'revive', amount: target.hp, crit: false, absorbed: 0, ko: false });
    }
    return dealt;
  };
  const restore = (target: Fighter, amount: number, kind: HitKind) => {
    target.hp = Math.min(target.maxHp, target.hp + amount);
    hits.push({ targetId: target.id, kind, amount, crit: false, absorbed: 0, ko: false });
  };
  const allies = () => [...fighters.values()].filter((f) => f.side === actor.side && f.hp > 0);

  let label = '';
  self.guarding = false;
  switch (action.kind) {
    case 'attack':
      label = 'Attack';
      strike(pick(legalTargets(state, actor.side)), ATTACK_POWER);
      self.ki += KI_PER_ATTACK;
      break;
    case 'kiBlast':
      label = 'Ki Blast';
      strike(pick(legalTargets(state, actor.side)), KI_BLAST_POWER);
      self.ki -= KI_BLAST_COST;
      break;
    case 'charge':
      label = 'Charge Ki';
      self.ki += KI_CHARGE;
      break;
    case 'guard':
      label = 'Guard';
      self.guarding = true;
      self.ki += KI_PER_ATTACK;
      break;
    case 'combo': {
      const { combo, partner } = comboFor(state, actor)!;
      label = combo.name;
      if (combo.kind === 'beam') strike(pick(legalTargets(state, actor.side)), combo.power);
      else if (combo.kind === 'wave') {
        for (const foe of living(state, opposite(actor.side))) strike(fighters.get(foe.id)!, combo.power, true);
      } else if (combo.kind === 'drain') {
        const dealt = strike(pick(legalTargets(state, actor.side)), combo.power);
        restore(self, Math.round(dealt * (DRAIN_SHARE + self.bonus.drain)), 'heal');
      } else {
        for (const ally of allies()) restore(ally, Math.round(ally.maxHp * combo.power * (1 + self.bonus.heal)), 'heal');
      }
      // Both partners spend their bars; the partner still gets its own turn.
      self.charge = 0;
      fighters.get(partner.id)!.charge = 0;
      break;
    }
    case 'special': {
      const special = specialOf(actor);
      label = special.name;
      const healBonus = (actor.role === 'Support' ? SUPPORT_HEAL_BONUS : 1) * (1 + self.bonus.heal);
      switch (special.kind) {
        case 'beam':
          strike(pick(legalTargets(state, actor.side)), special.power);
          break;
        case 'wave':
          for (const foe of living(state, opposite(actor.side))) strike(fighters.get(foe.id)!, special.power, true);
          break;
        case 'drain': {
          const dealt = strike(pick(legalTargets(state, actor.side)), special.power);
          const share = (actor.role === 'Drainer' ? DRAINER_DRAIN_SHARE : DRAIN_SHARE) + self.bonus.drain;
          restore(self, Math.round(dealt * share), 'heal');
          break;
        }
        case 'heal':
          for (const ally of allies()) restore(ally, Math.round(ally.maxHp * special.power * healBonus), 'heal');
          break;
        case 'revive': {
          const target = pick(fallen(state, actor.side));
          restore(target, Math.round(target.maxHp * special.power), 'revive');
          // A revived fighter waits for the next turn to act.
          if (!state.acted.includes(target.id)) state = { ...state, acted: [...state.acted, target.id] };
          self.specialSpent = true;
          break;
        }
        case 'shield':
          for (const ally of allies()) {
            const add = Math.round(ally.maxHp * special.power);
            ally.shield = Math.min(Math.round(ally.maxHp * MAX_SHIELD_SHARE), ally.shield + add);
            hits.push({ targetId: ally.id, kind: 'shield', amount: add, crit: false, absorbed: 0, ko: false });
          }
          break;
        case 'stun': {
          const target = pick(legalTargets(state, actor.side));
          strike(target, special.power);
          if (target.hp > 0) {
            // Bosses shrug off stuns.
            const resists = target.rank !== 'minion';
            if (!resists) target.stunned = true;
            hits.push({ targetId: target.id, kind: resists ? 'resist' : 'stun', amount: 0, crit: false, absorbed: 0, ko: false });
          }
          break;
        }
        case 'rally':
          for (const ally of allies()) {
            ally.rallyTurns = RALLY_TURNS;
            ally.rallyBonus = special.power;
            hits.push({ targetId: ally.id, kind: 'rally', amount: Math.round(special.power * 100), crit: false, absorbed: 0, ko: false });
          }
          break;
      }
      self.charge = 0;
      break;
    }
  }
  if (action.kind !== 'special' && action.kind !== 'combo') self.charge = Math.min(specialNeed(self), self.charge + 1);
  self.ki = Math.max(0, Math.min(KI_MAX, self.ki));

  let next: BattleState = {
    ...state,
    fighters: state.fighters.map((f) => fighters.get(f.id)!),
    acted: [...state.acted, actor.id],
  };
  if (living(next, 'enemy').length === 0) next = { ...next, result: 'won' };
  else if (living(next, 'player').length === 0) next = { ...next, result: 'lost' };
  else next = advance(next);

  return { state: next, event: { actorId: actor.id, kind: action.kind, label, hits } };
}

/** Passes the turn while the active side has nobody left to act (stuns can empty a whole side). */
function advance(state: BattleState): BattleState {
  let current = state;
  for (let i = 0; i < 4 && !nextActor(current); i++) current = startTurn(current, opposite(current.turn));
  return current;
}

function startTurn(state: BattleState, side: Side): BattleState {
  const skipped: string[] = [];
  const fighters = state.fighters.map((f) => {
    if (f.side !== side) return f;
    // Guard lasts until that fighter's side moves again; rally counts down on its own turns.
    const changed = { ...f, guarding: false, rallyTurns: Math.max(0, f.rallyTurns - 1) };
    if (f.stunned && f.hp > 0) {
      skipped.push(f.id);
      changed.stunned = false;
    }
    return changed;
  });
  return { ...state, fighters, turn: side, acted: skipped, round: side === 'player' ? state.round + 1 : state.round };
}

/** Simple AI used for enemies and for the player's Auto button. */
export function chooseAction(state: BattleState, rng: Rng = defaultRng): Action {
  const actor = nextActor(state);
  if (!actor) throw new Error('No fighter can act');
  const foes = living(state, opposite(actor.side));
  const allies = living(state, actor.side);
  const legal = legalTargets(state, actor.side);
  const weakest = [...legal].sort((a, b) => a.hp - b.hp)[0];
  const strongest = [...legal].sort((a, b) => b.atk - a.atk)[0];

  if (canUse(state, actor, 'combo')) {
    const c = comboFor(state, actor)!.combo;
    if (c.kind !== 'heal' || allies.some((a) => a.hp / a.maxHp < 0.6)) return { kind: 'combo', targetId: weakest.id };
  }
  if (canUse(state, actor, 'special')) {
    const kind = specialOf(actor).kind;
    if (kind === 'heal') {
      const hurt = allies.filter((a) => a.hp / a.maxHp < 0.6).length;
      if (hurt >= Math.min(2, allies.length)) return { kind: 'special' };
    } else if (kind === 'revive') {
      const best = [...fallen(state, actor.side)].sort((a, b) => b.maxHp - a.maxHp)[0];
      return { kind: 'special', targetId: best.id };
    } else if (kind === 'wave') {
      if (foes.length >= 2) return { kind: 'special' };
    } else if (kind === 'stun') {
      return { kind: 'special', targetId: strongest.id };
    } else {
      return { kind: 'special', targetId: weakest.id };
    }
  }
  if (canUse(state, actor, 'kiBlast') && rng() < 0.5) return { kind: 'kiBlast', targetId: weakest.id };
  if (actor.ki < KI_BLAST_COST && rng() < 0.2) return { kind: 'charge' };
  if (actor.hp / actor.maxHp < 0.25 && rng() < 0.25) return { kind: 'guard' };
  return { kind: 'attack', targetId: weakest.id };
}

/** Plays a whole battle with AI on both sides (tests and balance checks). */
export function autoResolve(state: BattleState, rng: Rng = defaultRng, maxActions = 2000): BattleState {
  let current = state;
  for (let i = 0; i < maxActions && current.result === 'ongoing'; i++) {
    current = performAction(current, chooseAction(current, rng), rng).state;
  }
  return current;
}
