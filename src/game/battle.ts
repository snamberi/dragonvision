import {
  ATTACK_POWER,
  BOSS_ATK_MULTIPLIER,
  BOSS_HP_MULTIPLIER,
  CRIT_CHANCE,
  CRIT_MULTIPLIER,
  GUARD_REDUCTION,
  KI_BLAST_COST,
  KI_BLAST_POWER,
  KI_CHARGE,
  KI_MAX,
  KI_PER_ATTACK,
  KI_START,
  MINI_BOSS_ATK_MULTIPLIER,
  MINI_BOSS_HP_MULTIPLIER,
  SPECIAL_COST,
  enemyStrengthForStage,
} from './balance';
import { statsFor, unitName } from './progression';
import { getFamily } from './roster';
import { type Rng, defaultRng } from './rng';
import type { Stage } from './stages';
import type { Unit } from './types';

export type Side = 'player' | 'enemy';
export type ActionKind = 'attack' | 'kiBlast' | 'special' | 'charge' | 'guard';

export interface Fighter {
  id: string;
  side: Side;
  familyId: string;
  star: number;
  level: number;
  name: string;
  rank: 'minion' | 'miniBoss' | 'boss';
  maxHp: number;
  hp: number;
  atk: number;
  def: number;
  spd: number;
  ki: number;
  guarding: boolean;
}

export interface BattleState {
  fighters: Fighter[];
  turn: Side;
  round: number;
  /** Fighters that already acted during the current side's turn. */
  acted: string[];
  result: 'ongoing' | 'won' | 'lost';
}

export interface Hit {
  targetId: string;
  amount: number;
  crit: boolean;
  heal: boolean;
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

export function createBattle(team: Unit[], stage: Stage): BattleState {
  const strength = enemyStrengthForStage(stage.number);
  const players: Fighter[] = team.map((u) => {
    const s = statsFor(u.familyId, u.star, u.level);
    return {
      id: `p-${u.uid}`,
      side: 'player',
      familyId: u.familyId,
      star: u.star,
      level: u.level,
      name: unitName(u),
      rank: 'minion',
      maxHp: s.hp,
      hp: s.hp,
      atk: s.atk,
      def: s.def,
      spd: s.spd,
      ki: KI_START,
      guarding: false,
    };
  });
  const enemies: Fighter[] = stage.enemies.map((e, i) => {
    const s = statsFor(e.familyId, e.star, e.level);
    const hpMul = e.rank === 'boss' ? BOSS_HP_MULTIPLIER : e.rank === 'miniBoss' ? MINI_BOSS_HP_MULTIPLIER : 1;
    const atkMul = e.rank === 'boss' ? BOSS_ATK_MULTIPLIER : e.rank === 'miniBoss' ? MINI_BOSS_ATK_MULTIPLIER : 1;
    const hp = Math.round(s.hp * hpMul * strength);
    return {
      id: `e-${i}`,
      side: 'enemy',
      familyId: e.familyId,
      star: e.star,
      level: e.level,
      name: unitName(e),
      rank: e.rank,
      maxHp: hp,
      hp,
      atk: Math.round(s.atk * atkMul * strength),
      def: Math.round(s.def * strength),
      spd: s.spd,
      ki: KI_START,
      guarding: false,
    };
  });
  return { fighters: [...players, ...enemies], turn: 'player', round: 1, acted: [], result: 'ongoing' };
}

export function living(state: BattleState, side: Side): Fighter[] {
  return state.fighters.filter((f) => f.side === side && f.hp > 0);
}

function opposite(side: Side): Side {
  return side === 'player' ? 'enemy' : 'player';
}

/** Fastest living fighter on the active side that has not acted yet. */
export function nextActor(state: BattleState): Fighter | null {
  if (state.result !== 'ongoing') return null;
  const ready = living(state, state.turn)
    .filter((f) => !state.acted.includes(f.id))
    .sort((a, b) => b.spd - a.spd);
  return ready[0] ?? null;
}

export function canUse(fighter: Fighter, kind: ActionKind): boolean {
  if (kind === 'kiBlast') return fighter.ki >= KI_BLAST_COST;
  if (kind === 'special') return fighter.ki >= SPECIAL_COST;
  return true;
}

export function needsTarget(fighter: Fighter, kind: ActionKind): boolean {
  if (kind === 'attack' || kind === 'kiBlast') return true;
  if (kind === 'special') {
    const k = getFamily(fighter.familyId).special.kind;
    return k === 'beam' || k === 'drain';
  }
  return false;
}

function damage(attacker: Fighter, defender: Fighter, mult: number, rng: Rng): { amount: number; crit: boolean } {
  // atk / (atk + def) keeps fights the same length at every level when both sides are even.
  const base = attacker.atk * (attacker.atk / (attacker.atk + defender.def)) * 0.9 * mult;
  const crit = rng() < CRIT_CHANCE;
  const variance = 0.9 + rng() * 0.2;
  let amount = base * variance * (crit ? CRIT_MULTIPLIER : 1);
  if (defender.guarding) amount *= GUARD_REDUCTION;
  return { amount: Math.max(1, Math.round(amount)), crit };
}

function withFighters(state: BattleState, update: (f: Fighter) => Fighter): BattleState {
  return { ...state, fighters: state.fighters.map(update) };
}

function resolveTarget(state: BattleState, actor: Fighter, targetId?: string): Fighter {
  const foes = living(state, opposite(actor.side));
  return foes.find((f) => f.id === targetId) ?? foes[0];
}

/** Applies one fighter's action and advances the turn when the whole side has acted. */
export function performAction(state: BattleState, action: Action, rng: Rng = defaultRng): { state: BattleState; event: ActionEvent } {
  const actor = nextActor(state);
  if (!actor) throw new Error('No fighter can act');
  if (!canUse(actor, action.kind)) throw new Error('Not enough ki');

  const hits: Hit[] = [];
  let kiChange = 0;
  let guard = false;
  let label = '';
  const damageMap = new Map<string, number>();
  const healMap = new Map<string, number>();

  const strike = (target: Fighter, mult: number) => {
    const { amount, crit } = damage(actor, target, mult, rng);
    const dealt = Math.min(target.hp - (damageMap.get(target.id) ?? 0), amount);
    damageMap.set(target.id, (damageMap.get(target.id) ?? 0) + dealt);
    hits.push({ targetId: target.id, amount, crit, heal: false, ko: false });
    return dealt;
  };

  switch (action.kind) {
    case 'attack':
      label = 'Attack';
      strike(resolveTarget(state, actor, action.targetId), ATTACK_POWER);
      kiChange = KI_PER_ATTACK;
      break;
    case 'kiBlast':
      label = 'Ki Blast';
      strike(resolveTarget(state, actor, action.targetId), KI_BLAST_POWER);
      kiChange = -KI_BLAST_COST;
      break;
    case 'charge':
      label = 'Charge Ki';
      kiChange = KI_CHARGE;
      break;
    case 'guard':
      label = 'Guard';
      guard = true;
      kiChange = KI_PER_ATTACK;
      break;
    case 'special': {
      const special = getFamily(actor.familyId).special;
      label = special.name;
      kiChange = -SPECIAL_COST;
      if (special.kind === 'beam') {
        strike(resolveTarget(state, actor, action.targetId), special.power);
      } else if (special.kind === 'wave') {
        for (const foe of living(state, opposite(actor.side))) strike(foe, special.power);
      } else if (special.kind === 'drain') {
        const dealt = strike(resolveTarget(state, actor, action.targetId), special.power);
        const heal = Math.round(dealt * 0.5);
        healMap.set(actor.id, heal);
        hits.push({ targetId: actor.id, amount: heal, crit: false, heal: true, ko: false });
      } else {
        for (const ally of living(state, actor.side)) {
          const heal = Math.round(ally.maxHp * special.power);
          healMap.set(ally.id, heal);
          hits.push({ targetId: ally.id, amount: heal, crit: false, heal: true, ko: false });
        }
      }
      break;
    }
  }

  let next = withFighters(state, (f) => {
    let hp = f.hp - (damageMap.get(f.id) ?? 0);
    if (hp > 0) hp = Math.min(f.maxHp, hp + (healMap.get(f.id) ?? 0));
    const changed: Fighter = { ...f, hp: Math.max(0, hp) };
    if (f.id === actor.id) {
      changed.ki = Math.max(0, Math.min(KI_MAX, f.ki + kiChange));
      changed.guarding = guard;
    }
    return changed;
  });
  for (const hit of hits) {
    if (!hit.heal) hit.ko = (next.fighters.find((f) => f.id === hit.targetId)?.hp ?? 0) <= 0;
  }

  next = { ...next, acted: [...next.acted, actor.id] };
  if (living(next, 'enemy').length === 0) next = { ...next, result: 'won' };
  else if (living(next, 'player').length === 0) next = { ...next, result: 'lost' };
  else if (!nextActor(next)) next = startTurn(next, opposite(next.turn));

  return { state: next, event: { actorId: actor.id, kind: action.kind, label, hits } };
}

function startTurn(state: BattleState, side: Side): BattleState {
  // Guard lasts until that fighter's side moves again.
  const fighters = state.fighters.map((f) => (f.side === side ? { ...f, guarding: false } : f));
  return { ...state, fighters, turn: side, acted: [], round: side === 'player' ? state.round + 1 : state.round };
}

/** Simple AI used for enemies and for the player's Auto button. */
export function chooseAction(state: BattleState, rng: Rng = defaultRng): Action {
  const actor = nextActor(state);
  if (!actor) throw new Error('No fighter can act');
  const foes = living(state, opposite(actor.side));
  const allies = living(state, actor.side);
  const weakest = [...foes].sort((a, b) => a.hp - b.hp)[0];
  const special = getFamily(actor.familyId).special;

  if (canUse(actor, 'special')) {
    if (special.kind === 'heal') {
      const hurt = allies.filter((a) => a.hp / a.maxHp < 0.6).length;
      if (hurt >= Math.min(2, allies.length)) return { kind: 'special' };
    } else if (special.kind !== 'wave' || foes.length >= 2) {
      return { kind: 'special', targetId: weakest.id };
    }
  }
  if (canUse(actor, 'kiBlast') && rng() < 0.5) return { kind: 'kiBlast', targetId: weakest.id };
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
