import { describe, expect, it } from 'vitest';
import { counterOf, preFightAdvice } from '../game/advice';
import { BOSS_TEMPLATES } from '../game/bossSets';
import { getStage } from '../game/stages';
import { newRun, nextInRun } from '../ui/run';

describe('auto-run stop conditions', () => {
  it('stops a farm when a boss set piece drops, only if asked', () => {
    const piece = BOSS_TEMPLATES[0].id;
    const asked = { ...newRun('farm', null, { setPiece: true }), wins: 1 };
    expect(nextInRun(asked, 50, { gearTemplateId: piece })).toEqual({ stop: 'A boss set piece dropped!' });
    expect(nextInRun(asked, 50, { gearTemplateId: 'not-a-boss-piece' })).toEqual({ next: 50 });
    const notAsked = { ...newRun('farm'), wins: 1 };
    expect(nextInRun(notAsked, 50, { gearTemplateId: piece })).toEqual({ next: 50 });
  });

  it('stops at a coin goal and still honours the win limit', () => {
    const run = { ...newRun('farm', 5, { coinTarget: 10_000 }), wins: 2 };
    expect('stop' in nextInRun(run, 12, { walletCoins: 10_500 })).toBe(true);
    expect(nextInRun(run, 12, { walletCoins: 9_000 })).toEqual({ next: 12 });
    expect(nextInRun({ ...run, wins: 5 }, 12, { walletCoins: 0 })).toEqual({ stop: 'Finished 5 runs.' });
  });
});

describe('pre-fight advice', () => {
  it('names the counter class and whether the team has it', () => {
    const stage = getStage(1);
    const counter = counterOf(stage.dominantRole);
    expect(preFightAdvice([counter], stage)).toContain(`Your ${counter} has the edge`);
    const other = (['Tank', 'Assassin', 'Blaster', 'Support', 'Drainer'] as const).find((r) => r !== counter)!;
    expect(preFightAdvice([other], stage)).toContain(`Bring a ${counter}`);
  });

  it('adds a tip for wall rules', () => {
    expect(preFightAdvice(['Tank'], getStage(180))).toContain('No healing');
  });
});
