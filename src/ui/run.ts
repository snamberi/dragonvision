import { TOTAL_STAGES } from '../game/balance';
import { stageKind } from '../game/stages';

export type RunMode = 'single' | 'farm' | 'progress';

/** A chain of automatic battles started from the Stages screen. */
export interface Run {
  mode: RunMode;
  /** Farm only: stop after this many wins (null = until stopped). */
  limit: number | null;
  wins: number;
  coins: number;
  gems: number;
  spins: number;
}

export function newRun(mode: RunMode, limit: number | null = null): Run {
  return { mode, limit, wins: 0, coins: 0, gems: 0, spins: 0 };
}

/**
 * What happens after a win: the next stage to play, or why the run stops.
 * Auto-Progress stops before mini-bosses and bosses so the player plays those.
 */
export function nextInRun(run: Run, stage: number): { next: number } | { stop: string } {
  if (run.mode === 'single') return { stop: '' };
  if (run.mode === 'farm') {
    if (run.limit !== null && run.wins >= run.limit) return { stop: `Finished ${run.wins} runs.` };
    return { next: stage };
  }
  const next = stage + 1;
  if (next > TOTAL_STAGES) return { stop: 'You cleared every stage!' };
  const kind = stageKind(next);
  if (kind === 'boss') return { stop: `Stage ${next} is a chapter boss. Take this one on yourself.` };
  if (kind === 'miniBoss') return { stop: `Stage ${next} is a mini-boss. Take this one on yourself.` };
  return { next };
}
