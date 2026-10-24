import { describe, expect, it } from 'vitest';
import { newSave, teamUnits } from '../game/progression';
import { claimWantedPoster, recordWantedWin, refreshWantedPosters, todaysPosters } from '../game/wanted';
import type { SaveData } from '../game/types';

const DAY = '2026-10-24';

describe('wanted posters', () => {
  it('can only be claimed after winning the stage, and only once a day', () => {
    let save: SaveData = refreshWantedPosters({ ...newSave(), clearedStage: 13 }, DAY);
    const open = save.wantedPosters!.find((p) => p.requiredClass === null) ?? { ...save.wantedPosters![0], requiredClass: null };
    save = { ...save, wantedPosters: save.wantedPosters!.map((p) => (p.id === open.id ? { ...p, requiredClass: null } : p)) };
    expect(() => claimWantedPoster(save, open.id)).toThrow(/first/);

    save = recordWantedWin(save, open.stage, teamUnits(save), DAY);
    const gems = save.gems;
    save = claimWantedPoster(save, open.id);
    expect(save.gems).toBe(gems + open.gems);

    // The old exploit: the board refilled after a claim and the same poster paid again.
    for (let i = 0; i < 20; i++) {
      save = refreshWantedPosters(recordWantedWin(save, open.stage, teamUnits(save), DAY), DAY);
      expect(() => claimWantedPoster(save, open.id)).toThrow(/Already claimed/);
    }
    expect(todaysPosters(save, DAY)).toHaveLength(3);
  });

  it('needs the required class on the team', () => {
    let save: SaveData = refreshWantedPosters({ ...newSave(), clearedStage: 13 }, DAY);
    const poster = { ...save.wantedPosters![0], requiredClass: 'Support' };
    save = { ...save, wantedPosters: [poster] };
    const noSupport = teamUnits(save).filter(() => false);
    save = recordWantedWin(save, poster.stage, noSupport, DAY);
    expect(save.wantedPosters![0].done).toBe(false);
  });

  it('only posts stages the player has cleared', () => {
    const save = refreshWantedPosters({ ...newSave(), clearedStage: 13 }, DAY);
    for (const p of save.wantedPosters!) expect(p.stage).toBeLessThanOrEqual(13);
  });
});
