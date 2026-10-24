import { TOTAL_STAGES } from '../game/balance';
import { BOSS_TEMPLATES } from '../game/bossSets';
import { stageKind } from '../game/stages';

export type RunMode = 'single' | 'farm' | 'progress';

/** Extra reasons an auto run should stop on its own. */
export interface RunStops {
  /** Stop when a boss-set gear piece drops. */
  setPiece?: boolean;
  /** Stop once the wallet reaches this many coins. */
  coinTarget?: number | null;
}

/** A chain of automatic battles started from the Stages screen. */
export interface Run {
  mode: RunMode;
  /** Farm only: stop after this many wins (null = until stopped). */
  limit: number | null;
  stops: RunStops;
  wins: number;
  coins: number;
  gems: number;
  spins: number;
}

export function newRun(mode: RunMode, limit: number | null = null, stops: RunStops = {}): Run {
  return { mode, limit, stops, wins: 0, coins: 0, gems: 0, spins: 0 };
}

/** What the last win produced, for the stop conditions. */
export interface WinOutcome {
  /** Wallet coins after the win was paid. */
  walletCoins?: number;
  /** Template id of the gear that dropped, if any. */
  gearTemplateId?: string;
}

export function isBossSetPiece(templateId: string | undefined): boolean {
  return templateId !== undefined && BOSS_TEMPLATES.some((t) => t.id === templateId);
}

/**
 * What happens after a win: the next stage to play, or why the run stops.
 * Auto-Progress stops before mini-bosses and bosses so the player plays those.
 */
export function nextInRun(run: Run, stage: number, outcome: WinOutcome = {}): { next: number } | { stop: string } {
  if (run.mode === 'single') return { stop: '' };
  const { setPiece, coinTarget } = run.stops ?? {};
  if (setPiece && isBossSetPiece(outcome.gearTemplateId)) return { stop: 'A boss set piece dropped!' };
  if (coinTarget && (outcome.walletCoins ?? 0) >= coinTarget) {
    return { stop: `Reached your goal of ${coinTarget.toLocaleString()} coins.` };
  }
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
