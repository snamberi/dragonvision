import { describe, expect, it } from 'vitest';
import { recordWin } from '../game/bounty';
import { unitBonus } from '../game/fighterBonus';
import { MASTERY_THRESHOLDS, masteryLevel, masteryProgress } from '../game/mastery';
import { loadPreset, presetTeam, renamePreset, savePreset, teamPresets } from '../game/presets';
import { addUnit, newSave, toggleTeamMember } from '../game/progression';
import type { SaveData } from '../game/types';

const WIN = { firstClear: false, boss: false, flawless: false };

function withUnit(save: SaveData, familyId: string) {
  return addUnit(save, { familyId, star: 1, level: 1, baseLevel: 1, coinsSpent: 0 });
}

describe('fighter mastery', () => {
  it('levels from team wins and adds a stat bonus', () => {
    expect(masteryLevel(0)).toBe(0);
    expect(masteryLevel(MASTERY_THRESHOLDS[0])).toBe(1);
    expect(masteryProgress(MASTERY_THRESHOLDS[0] + 2)).toMatchObject({ level: 1, into: 2 });
    const bench = withUnit(newSave(), 'mei');
    let save = bench.save;
    const before = unitBonus(save, save.units[0]).atk;
    save = Array.from({ length: MASTERY_THRESHOLDS[0] }).reduce<SaveData>((s) => recordWin(s, WIN), save);
    expect(save.units[0].mastery).toBe(MASTERY_THRESHOLDS[0]);
    expect(save.units.find((u) => u.uid === bench.unit.uid)!.mastery ?? 0).toBe(0);
    expect(unitBonus(save, save.units[0]).atk).toBeGreaterThan(before);
  });
});

describe('team presets', () => {
  it('saves, renames and loads formations, skipping fighters that left', () => {
    const r = withUnit(newSave(), 'mei');
    const joined = toggleTeamMember(r.save, r.unit.uid);
    if (!joined.ok) throw new Error(joined.reason);
    let save = renamePreset(savePreset(joined.save, 0), 0, '  Rush squad  ');
    expect(teamPresets(save)[0].name).toBe('Rush squad');
    expect(() => renamePreset(save, 0, '   ')).toThrow();
    save = { ...save, team: ['u1', null, null, null, null] };
    save = loadPreset(save, 0);
    expect(save.team.filter(Boolean)).toHaveLength(2);
    const gone = { ...save, units: save.units.filter((u) => u.uid !== r.unit.uid) };
    expect(presetTeam(gone, 0).skipped).toBe(1);
    expect(() => loadPreset(save, 1)).toThrow();
  });
});
