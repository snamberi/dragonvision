import { FAMILIES, LEGENDARIES, getFamily } from './roster';
import type { SaveData } from './types';

export interface SideQuest {
  familyId: string;
  name: string;
  description: string;
  type: 'battles' | 'evolve' | 'level';
  requirement: number;
  reward: { coins: number; gems: number };
}

const QUEST_SPECS: Array<[string, string, SideQuest['type'], number, number, number]> = [
  ['kairo', 'Wandering Spark', 'battles', 10, 500, 3],
  ['varek', "Prince's Challenge", 'battles', 8, 400, 2],
  ['tobi', "Monk's Trial", 'level', 30, 300, 2],
  ['orrin', "Sage's Wisdom", 'evolve', 1, 600, 3],
  ['sora', 'Twin Comet Run', 'battles', 7, 350, 2],
  ['mei', 'Thunder Disciple', 'level', 25, 250, 2],
  ['vorg', 'Death March', 'battles', 12, 600, 3],
  ['nyx', 'Circuit Override', 'level', 20, 200, 1],
  ['mogra', 'Quake Mastery', 'battles', 6, 300, 2],
  ['jin', 'Crescent Path', 'level', 35, 400, 3],
  ['aya', 'Petal Bloom', 'evolve', 1, 500, 2],
  ['bruno', 'Iron Wall', 'battles', 5, 250, 1],
  ['kenji', "Master's Path", 'level', 40, 500, 3],
  ['lyra', 'Stargazer', 'battles', 9, 450, 3],
  ['zeno', 'Second Life', 'evolve', 1, 600, 3],
  ['grimm', 'Soul Harvest', 'battles', 15, 700, 4],
  ['sylas', 'Absorb All', 'battles', 10, 500, 3],
  ['kael', 'Void Walker', 'level', 50, 600, 4],
  ['kavrek', 'Fusion Mastery', 'battles', 20, 1000, 5],
  ['orzen', 'Eternal Trial', 'level', 60, 800, 5],
  ['grylas', 'Perfect Form', 'evolve', 2, 1200, 6],
  ['ryuga', 'Dragon Ascent', 'level', 80, 1000, 5],
  ['solenne', 'Solar Rites', 'battles', 12, 600, 3],
  ['seraphine', 'Seraph Wings', 'evolve', 1, 700, 4],
  ['aurel', 'Golden Path', 'level', 50, 700, 4],
  ['tharok', 'Ironhide Trial', 'battles', 10, 500, 3],
  ['gorvath', 'Forest Warden', 'level', 40, 500, 3],
  ['nyxara', 'Void Scion', 'battles', 8, 400, 3],
  ['morvain', 'Dark Legacy', 'evolve', 2, 900, 5],
  ['volkan', 'Volcanic Wrath', 'level', 60, 800, 4],
  ['zephyra', 'Storm Caller', 'battles', 10, 500, 3],
];

export const SIDE_QUESTS: SideQuest[] = QUEST_SPECS.map(([familyId, name, type, requirement, coins, gems]) => {
  const desc: Record<SideQuest['type'], string> = {
    battles: `Win ${requirement} battles with ${getFamily(familyId).name} on the team`,
    evolve: `Evolve ${getFamily(familyId).name} ${requirement} time${requirement > 1 ? 's' : ''}`,
    level: `Raise ${getFamily(familyId).name} to level ${requirement}`,
  };
  return { familyId, name, description: desc[type], type, requirement, reward: { coins, gems } };
});

// Fill any roster families missing from the spec list with generic quests
const coveredIds = new Set(QUEST_SPECS.map(([id]) => id));
for (const fam of [...FAMILIES, ...LEGENDARIES]) {
  if (!coveredIds.has(fam.id)) {
    SIDE_QUESTS.push({
      familyId: fam.id,
      name: `${fam.name}'s Trial`,
      description: `Win 5 battles with ${fam.name} on the team`,
      type: 'battles',
      requirement: 5,
      reward: { coins: 300, gems: 2 },
    });
  }
}

export function checkSideQuest(save: SaveData, familyId: string): boolean {
  return !!(save.sideQuests ?? {})[familyId];
}

export function claimSideQuest(save: SaveData, familyId: string): SaveData {
  const quest = SIDE_QUESTS.find((q) => q.familyId === familyId);
  if (!quest) throw new Error('No quest for this fighter');
  if (checkSideQuest(save, familyId)) throw new Error('Already claimed');
  if (sideQuestProgress(save, quest) < quest.requirement) throw new Error('Not done yet');
  return {
    ...save,
    coins: save.coins + quest.reward.coins,
    gems: save.gems + quest.reward.gems,
    sideQuests: { ...(save.sideQuests ?? {}), [familyId]: true },
  };
}

export function sideQuestProgress(save: SaveData, quest: SideQuest): number {
  const unit = save.units.find((u) => u.familyId === quest.familyId);
  if (!unit) return 0;
  if (quest.type === 'level') return Math.min(quest.requirement, unit.level);
  if (quest.type === 'evolve') return Math.min(quest.requirement, Math.max(0, unit.star - 1));
  // 'battles' — use win counter as a proxy (no per-family tracking yet)
  return Math.min(quest.requirement, save.counters.wins);
}
