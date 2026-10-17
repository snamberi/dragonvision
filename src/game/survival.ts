import { MAX_LEVEL, MAX_STARS, stageCoinReward } from './balance';
import { type BattleState, createBattle } from './battle';
import type { BattleOptions } from './battle';
import { FAMILIES } from './roster';
import { seededRng } from './rng';
import type { EnemySpec, Stage } from './stages';
import type { SaveData, Unit } from './types';

/** Survival waves start a little below your team and climb 4 levels a wave. */
export function survivalWave(team: (Unit | null)[], wave: number): Stage {
  const units = team.filter((u): u is Unit => u !== null);
  const avg = units.reduce((sum, u) => sum + u.level, 0) / Math.max(1, units.length);
  const level = Math.min(MAX_LEVEL, Math.round(avg * 0.7 + wave * 4));
  const star = Math.min(MAX_STARS, Math.max(1, Math.ceil(level / 22)));
  const rng = seededRng(wave * 104729);
  const count = Math.min(5, 2 + Math.floor(wave / 3));
  const enemies: EnemySpec[] = Array.from({ length: count }, (_, i) => ({
    familyId: FAMILIES[Math.floor(rng() * FAMILIES.length)].id,
    star,
    level,
    rank: wave % 5 === 0 && i === 0 ? 'miniBoss' : 'minion',
  }));
  return {
    number: 12,
    chapter: 0,
    chapterName: 'Survival Gate',
    kind: wave % 5 === 0 ? 'miniBoss' : 'normal',
    enemies,
    coins: 0,
    label: `Survival · Wave ${wave}`,
    weather: 'clear',
  };
}

/**
 * The next wave keeps your fighters exactly as they finished the last one:
 * same HP, Ki and special bars. No healing between waves.
 */
export function nextWave(previous: BattleState, team: (Unit | null)[], wave: number, options: BattleOptions): BattleState {
  const fresh = createBattle(team, survivalWave(team, wave), options);
  const carried = new Map(previous.fighters.filter((f) => f.side === 'player').map((f) => [f.id, f]));
  const fighters = fresh.fighters
    .map((f) => {
      const old = carried.get(f.id);
      return old ? { ...old, guarding: false, stunned: false, rallyTurns: 0 } : f;
    })
    // Fallen fighters stay fallen.
    .filter((f) => f.side === 'enemy' || carried.has(f.id));
  return { ...fresh, fighters };
}

export function survivalCoins(wavesCleared: number): number {
  let total = 0;
  for (let w = 1; w <= wavesCleared; w++) total += Math.round(stageCoinReward(Math.min(380, w * 8)) * 0.4);
  return total;
}

/** Pays out a run: coins per wave cleared and a spin every 5 waves; keeps the best wave. */
export function finishSurvival(save: SaveData, wavesCleared: number): SaveData {
  return {
    ...save,
    coins: save.coins + survivalCoins(wavesCleared),
    spins: save.spins + Math.floor(wavesCleared / 5),
    survivalBest: Math.max(save.survivalBest, wavesCleared),
  };
}
