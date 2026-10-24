// Builds a lively mid-game save for trailer capture: `npx tsx scripts/trailer/seed.ts > save.json`
import { FAMILIES } from '../../src/game/roster';
import { addUnit, newSave } from '../../src/game/progression';
import { addItem, TEMPLATES } from '../../src/game/gear';
import { BOSS_TEMPLATES } from '../../src/game/bossSets';
import { autoEquipTeam } from '../../src/game/gearTools';
import type { SaveData } from '../../src/game/types';

let save: SaveData = { ...newSave(), coins: 2_480_000, gems: 1_260, spins: 85, clearedStage: 63, towerFloor: 12 };
const picks = FAMILIES.filter((f) => !f.villain).slice(0, 18);
picks.forEach((f, i) => {
  const star = 3 + ((i * 5) % 7);
  const level = Math.min(star * 20, 40 + i * 9);
  save = addUnit(save, { familyId: f.id, star, level, baseLevel: 1, coinsSpent: 0 }).save;
});
save.units = save.units.map((u) => (u.uid === 'u1' ? { ...u, star: 8, level: 160 } : u));
const best = [...save.units].sort((a, b) => b.star - a.star || b.level - a.level);
const team: string[] = [];
for (const u of best) {
  if (team.length === 5) break;
  if (!team.some((t) => save.units.find((x) => x.uid === t)!.familyId === u.familyId)) team.push(u.uid);
}
save.team = team;
for (const t of BOSS_TEMPLATES.filter((b) => b.setId === 'foundry' || b.setId === 'demon')) save = addItem(save, t.id, 'epic').save;
TEMPLATES.slice(0, 16).forEach((t, i) => (save = addItem(save, t.id, (['rare', 'epic', 'legendary', 'uncommon'] as const)[i % 4]).save));
save = autoEquipTeam(save, false).save;
process.stdout.write(JSON.stringify(save));
