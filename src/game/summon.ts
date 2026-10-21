import { FOCUS_MULTIPLIER, LUCKY_MULTIPLIER, MAX_STARS, PITY_THRESHOLD, SUMMON_STAR_DECAY, spinPrice } from './balance';
import { addPieces, rollSummonPiece } from './legendary';
import { addUnit, bump, summonLevelRange } from './progression';
import { collectionCap } from './upgrades';
import { FAMILIES, GOLDEN_FAMILIES } from './roster';
import { type Rng, defaultRng, pickWeighted, randInt } from './rng';
import { dayKey, hashString } from './time';
import type { SaveData, Unit } from './types';

/** Highest star the player has unlocked for a family (0 if they own none). */
export function highestOwnedStar(save: SaveData, familyId: string): number {
  return save.units.reduce((max, u) => (u.familyId === familyId ? Math.max(max, u.star) : max), 0);
}

/** One tier above the highest unlocked form; a family you don't own starts at 1★. */
export function summonStarCap(save: SaveData, familyId: string): number {
  return Math.min(MAX_STARS, highestOwnedStar(save, familyId) + 1);
}

/** The Fortune Teller's lucky fighter for a day: same for everyone, changes daily. */
export function luckyFamilyId(day = dayKey()): string {
  return FAMILIES[hashString(day) % FAMILIES.length].id;
}

export function familyWeight(save: SaveData, familyId: string, day = dayKey()): number {
  const focus = save.focusFamilyId === familyId ? FOCUS_MULTIPLIER : 1;
  return focus * (luckyFamilyId(day) === familyId ? LUCKY_MULTIPLIER : 1);
}

export function starWeight(star: number): number {
  return Math.pow(SUMMON_STAR_DECAY, star - 1);
}

/** Probability of each family and star, for the odds panel and tests. */
export function summonOdds(save: SaveData, day = dayKey()): { familyId: string; star: number; chance: number }[] {
  const rows: { familyId: string; star: number; weight: number }[] = [];
  for (const family of FAMILIES) {
    const cap = summonStarCap(save, family.id);
    const starTotal = Array.from({ length: cap }, (_, i) => starWeight(i + 1)).reduce((a, b) => a + b, 0);
    for (let star = 1; star <= cap; star++) {
      rows.push({ familyId: family.id, star, weight: (familyWeight(save, family.id, day) * starWeight(star)) / starTotal });
    }
  }
  const total = rows.reduce((sum, r) => sum + r.weight, 0);
  return rows.map((r) => ({ familyId: r.familyId, star: r.star, chance: r.weight / total }));
}

export interface Pull {
  save: SaveData;
  unit: Unit;
  /** A legendary piece that dropped with this pull (0.5% a pull). */
  piece: string | null;
}

/** Minimum star that counts as a pity-breaking pull. */
const PITY_MIN_STAR = 4;

/** Spends one spin: pick a family (focus raises its weight), then a star up to that family's cap.
 *  If the pity counter has reached PITY_THRESHOLD, the pull is forced to be PITY_MIN_STAR+. */
export function summon(save: SaveData, rng: Rng = defaultRng, day = dayKey()): Pull {
  if (save.spins <= 0) throw new Error('No Spin Orbs left');
  const pity = save.pityPulls ?? 0;
  const pityTriggered = pity >= PITY_THRESHOLD;
  const family = pickWeighted(rng, FAMILIES, (f) => familyWeight(save, f.id, day));
  const cap = summonStarCap(save, family.id);
  let star: number;
  if (pityTriggered && cap < PITY_MIN_STAR) {
    star = cap;
  } else if (pityTriggered) {
    const eligibleStars = Array.from({ length: cap - PITY_MIN_STAR + 1 }, (_, i) => i + PITY_MIN_STAR);
    star = pickWeighted(rng, eligibleStars, starWeight);
  } else {
    star = pickWeighted(rng, Array.from({ length: cap }, (_, i) => i + 1), starWeight);
  }
  return give({ ...save, pityPulls: pity }, family.id, star, rng);
}

function give(save: SaveData, familyId: string, star: number, rng: Rng): Pull {
  const [min, max] = summonLevelRange(star);
  const level = randInt(rng, min, max);
  const cap = collectionCap(save);
  const atCap = save.units.length >= cap;
  const spent = { ...save, spins: save.spins - 1 };
  const pityReset = star >= PITY_MIN_STAR;
  const nextPity = pityReset ? 0 : (spent.pityPulls ?? 0) + 1;
  if (atCap) {
    const after = bump({ ...spent, pityPulls: nextPity }, 'summons');
    const piece = rollSummonPiece(rng);
    return { save: piece ? addPieces(after, piece) : after, unit: { uid: '', familyId, star, level, baseLevel: level, coinsSpent: 0 }, piece };
  }
  const result = addUnit({ ...spent, pityPulls: nextPity }, { familyId, star, level, baseLevel: level, coinsSpent: 0 });
  const piece = rollSummonPiece(rng);
  const after = bump(result.save, 'summons');
  return { save: piece ? addPieces(after, piece) : after, unit: result.unit, piece };
}

const TEN_PULL_COUNT = 10;

/** Ten summons for ten spins. Each pull is independent; pity carries across the batch. */
export function summonTen(save: SaveData, rng: Rng = defaultRng, day = dayKey()): { save: SaveData; units: Unit[]; pieces: string[] } {
  if (save.spins < TEN_PULL_COUNT) throw new Error('A 10× summon needs 10 Spin Orbs');
  return Array.from({ length: TEN_PULL_COUNT }).reduce<{ save: SaveData; units: Unit[]; pieces: string[] }>(
    (acc) => {
      const r = summon(acc.save, rng, day);
      return { save: r.save, units: [...acc.units, r.unit], pieces: r.piece ? [...acc.pieces, r.piece] : acc.pieces };
    },
    { save, units: [], pieces: [] },
  );
}

/** Buys summon spins with coins at the Summoning Shrine. */
export function buySpins(save: SaveData, count: number): SaveData {
  const cost = spinPrice(save.clearedStage) * count;
  if (count <= 0) throw new Error('Pick how many Spin Orbs to buy');
  if (cost > save.coins) throw new Error('Not enough coins');
  return { ...save, coins: save.coins - cost, spins: save.spins + count };
}

/** Golden currency never substitutes for normal orbs or spends gems implicitly. */
export const GOLDEN_ORB_PRICE = 60;
export function buyGoldenOrbs(save: SaveData, count: number): SaveData {
  if (!Number.isSafeInteger(count) || count < 1 || !Number.isSafeInteger(count * GOLDEN_ORB_PRICE)) throw new Error('Pick a whole number of Golden Orbs');
  const cost = count * GOLDEN_ORB_PRICE;
  if (save.gems < cost) throw new Error('Not enough gems');
  return {...save,gems:save.gems-cost,goldenOrbs:(save.goldenOrbs??0)+count};
}
export function goldenSummonOdds(save: SaveData) {
  return GOLDEN_FAMILIES.flatMap(f=>{
    const cap=summonStarCap(save,f.id);
    const total=Array.from({length:cap},(_,i)=>starWeight(i+1)).reduce((a,b)=>a+b,0);
    return Array.from({length:cap},(_,i)=>({familyId:f.id,star:i+1,chance:starWeight(i+1)/total/GOLDEN_FAMILIES.length}));
  });
}
export function summonGolden(save: SaveData, count: 1|10 = 1, rng: Rng = defaultRng): {save:SaveData;units:Unit[];pieces:string[]} {
  if (count !== 1 && count !== 10) throw new Error('Choose one or ten summons');
  if ((save.goldenOrbs??0)<count) throw new Error('Not enough Golden Orbs');
  let current={...save,goldenOrbs:(save.goldenOrbs??0)-count};
  const units:Unit[]=[];
  for(let i=0;i<count;i++){
    const family=pickWeighted(rng,GOLDEN_FAMILIES,()=>1);
    const cap=summonStarCap(current,family.id);
    const star=pickWeighted(rng,Array.from({length:cap},(_,n)=>n+1),starWeight);
    const [min,max]=summonLevelRange(star),level=randInt(rng,min,max);
    const result=addUnit(current,{familyId:family.id,star,level,baseLevel:level,coinsSpent:0});
    current={...bump(result.save,'summons'),goldenOrbs:current.goldenOrbs};units.push(result.unit);
  }
  return {save:current,units,pieces:[]};
}
