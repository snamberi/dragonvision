import { awakeningTree } from './awakening';
import { equippedItems } from './gear';
import { FAMILIES, FUSIONS, LEGENDARIES, formForStar, getFamily } from './roster';
import type { SaveData } from './types';

export interface Achievement {
  id: string;
  name: string;
  text: string;
  goal: number;
  progress: (save: SaveData) => number;
  reward: { gems?: number; spins?: number };
  /** Title unlocked by claiming it. */
  title?: string;
}

const owned = (save: SaveData) => new Set(save.units.map((u) => u.familyId));
const maxStar = (save: SaveData) => Math.max(0, ...save.units.map((u) => u.star));

/** Every form in the game, as "familyId:formIndex". */
export function allForms(): string[] {
  return [...FAMILIES, ...FUSIONS, ...LEGENDARIES].flatMap((f) => f.forms.map((_, i) => `${f.id}:${i}`));
}

export function formKey(familyId: string, star: number): string {
  const family = getFamily(familyId);
  return `${familyId}:${family.forms.indexOf(formForStar(family, star))}`;
}

/** Adds every currently owned form to the collection log. */
export function recordForms(save: SaveData): SaveData {
  const seen = new Set(save.seenForms);
  let changed = false;
  for (const u of save.units) {
    const key = formKey(u.familyId, u.star);
    if (!seen.has(key)) {
      seen.add(key);
      changed = true;
    }
  }
  return changed ? { ...save, seenForms: [...seen] } : save;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'stage-1', name: 'First Steps', text: 'Clear stage 1', goal: 1, progress: (s) => s.clearedStage, reward: { spins: 2 }, title: 'Rookie' },
  { id: 'stage-50', name: 'Wanderer', text: 'Clear stage 50', goal: 50, progress: (s) => s.clearedStage, reward: { gems: 10 }, title: 'Wanderer' },
  { id: 'stage-190', name: 'Halfway There', text: 'Clear stage 190', goal: 190, progress: (s) => s.clearedStage, reward: { gems: 25 }, title: 'Veteran' },
  { id: 'stage-380', name: 'Gatebreaker', text: 'Clear the Vision Gate (stage 380)', goal: 380, progress: (s) => s.clearedStage, reward: { gems: 100 }, title: 'Gatebreaker' },
  { id: 'chars-10', name: 'Growing Roster', text: 'Own 10 different characters', goal: 10, progress: (s) => owned(s).size, reward: { spins: 10 } },
  { id: 'chars-all', name: 'Full Roster', text: 'Own all 18 characters', goal: 18, progress: (s) => FAMILIES.filter((f) => owned(s).has(f.id)).length, reward: { gems: 30 }, title: 'Collector' },
  { id: 'forms-30', name: 'Form Hunter', text: 'Unlock 30 forms in the collection', goal: 30, progress: (s) => s.seenForms.length, reward: { gems: 15 } },
  { id: 'forms-all', name: 'Archivist', text: 'Unlock every form', goal: allForms().length, progress: (s) => s.seenForms.length, reward: { gems: 60 }, title: 'Archivist' },
  { id: 'star-10', name: 'Ascended', text: 'Raise a fighter to 10★', goal: 10, progress: maxStar, reward: { gems: 15 }, title: 'Ascended' },
  { id: 'star-21', name: 'Ultimate', text: 'Raise a fighter to 21★', goal: 21, progress: maxStar, reward: { gems: 80 }, title: 'Ultimate' },
  { id: 'legend', name: 'Legend Forged', text: 'Forge a legendary fighter from 10 pieces', goal: 1, progress: (s) => s.units.filter((u) => LEGENDARIES.some((f) => f.id === u.familyId)).length, reward: { gems: 30 }, title: 'Legendary' },
  { id: 'fusion', name: 'Two Become One', text: 'Create a fusion character', goal: 1, progress: (s) => s.units.filter((u) => FUSIONS.some((f) => f.id === u.familyId)).length, reward: { gems: 20 }, title: 'Fused' },
  { id: 'geared', name: 'Fully Geared', text: 'Equip all 4 gear slots on one fighter', goal: 4, progress: (s) => Math.max(0, ...s.units.map((u) => equippedItems(s, u).length)), reward: { spins: 5 } },
  { id: 'legendary', name: 'Treasure Hunter', text: 'Own a Legendary item', goal: 1, progress: (s) => s.items.filter((i) => i.rarity === 'legendary').length, reward: { gems: 10 }, title: 'Treasure Hunter' },
  { id: 'tower-15', name: 'Tower Climber', text: 'Clear Rival Tower floor 15', goal: 15, progress: (s) => s.towerFloor, reward: { gems: 15 } },
  { id: 'tower-30', name: 'Tower Master', text: 'Clear Rival Tower floor 30', goal: 30, progress: (s) => s.towerFloor, reward: { gems: 40 }, title: 'Tower Master' },
  { id: 'survival-20', name: 'Survivor', text: 'Reach wave 20 in Survival', goal: 20, progress: (s) => s.survivalBest, reward: { gems: 20 }, title: 'Survivor' },
  { id: 'bosses-25', name: 'Boss Hunter', text: 'Beat 25 bosses or mini-bosses', goal: 25, progress: (s) => s.counters.bossWins, reward: { gems: 20 }, title: 'Boss Hunter' },
  {
    id: 'awaken-3',
    name: 'Awakened',
    text: 'Unlock a capstone awakening node',
    goal: 1,
    progress: (s) => (s.units.some((u) => (u.awakened ?? []).some((id) => awakeningTree(u.familyId).find((n) => n.id === id)?.tier === 3)) ? 1 : 0),
    reward: { gems: 25 },
    title: 'Awakened',
  },
  { id: 'summons-500', name: 'Summoner', text: 'Summon 500 fighters', goal: 500, progress: (s) => s.counters.summons, reward: { gems: 30 }, title: 'Summoner' },
];

export function achievementState(save: SaveData, a: Achievement): { done: number; complete: boolean; claimed: boolean } {
  const done = Math.min(a.goal, a.progress(save));
  return { done, complete: done >= a.goal, claimed: save.achievements.includes(a.id) };
}

export function claimAchievement(save: SaveData, id: string): SaveData {
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  if (!a) throw new Error('Unknown achievement');
  const st = achievementState(save, a);
  if (st.claimed) throw new Error('Already claimed');
  if (!st.complete) throw new Error('Not finished yet');
  return {
    ...save,
    gems: save.gems + (a.reward.gems ?? 0),
    spins: save.spins + (a.reward.spins ?? 0),
    achievements: [...save.achievements, id],
  };
}

export function unlockedTitles(save: SaveData): string[] {
  return ACHIEVEMENTS.filter((a) => a.title && save.achievements.includes(a.id)).map((a) => a.title!);
}

export function setTitle(save: SaveData, title: string | null): SaveData {
  if (title && !unlockedTitles(save).includes(title)) throw new Error('Title not unlocked');
  return { ...save, title };
}
