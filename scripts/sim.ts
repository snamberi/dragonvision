// Balance simulator: `npm run sim`. Plays real battles against wall stages and estimates
// how long the main goals take. Income and playtime figures are a model, printed as such.
import * as B from '../src/game/balance';
import { BOUNTIES, bountyReward } from '../src/game/bounty';
import { type Unit } from '../src/game/types';
import { chooseAction, createBattle, performAction } from '../src/game/battle';
import { emptyBonus } from '../src/game/bonus';
import { SHOP_REFRESH_GEMS } from '../src/game/gear';
import { shardPrice } from '../src/game/market';
import { newSave, upgradeCost } from '../src/game/progression';
import { seededRng } from '../src/game/rng';
import { FAMILIES } from '../src/game/roster';
import { getStage, rewardsFor } from '../src/game/stages';
import { TC_CRYSTAL_COST } from '../src/game/transcendence';
import { MILESTONES } from '../src/game/worldBoss';

const SEEDS = 20;
const TEAM = 5;
const fmt = (n: number) => Math.round(n).toLocaleString();
const playable = FAMILIES.filter((f) => !f.villain);

// ---------- Player profile (assumptions) ----------
/** Stars above the minimum the level wall allows for the enemy level. */
const STAR_HEADROOM = 2;
/** Gear + Gravity + awakening, as a flat ATK/HP/DEF share; grows linearly to this at the final stage. */
const GEAR_AT_END = 1.0;
const PLAY_HOURS_PER_DAY = 1;
const SECONDS_PER_BATTLE = 45;
const EXPEDITION_TRIPS_PER_DAY = 4;
const SHOP_OFFERS = 6;
const SHARD_OFFER_SHARE = 0.2;

function profile(stage: number, tier: number) {
  const level = B.enemyLevelForStage(stage);
  const star = Math.min(B.MAX_STARS, Math.ceil(level / B.LEVELS_PER_STAR) + STAR_HEADROOM);
  return { star, level: Math.min(level, B.levelCap(star)), gear: (GEAR_AT_END * stage) / B.TOTAL_STAGES, tier, sig: tier > 0 ? 3 : 0 };
}

function winRate(stage: number, p: ReturnType<typeof profile>): number {
  let wins = 0;
  for (let seed = 0; seed < SEEDS; seed++) {
    const team: Unit[] = Array.from({ length: TEAM }, (_, i) => ({
      uid: `s${i}`,
      familyId: playable[(i * 5 + seed) % playable.length].id,
      star: p.star,
      level: p.level,
      baseLevel: 1,
      coinsSpent: 0,
      transcendenceTier: p.tier,
      sigTier: p.sig,
    }));
    const rng = seededRng(seed);
    let battle = createBattle(team, getStage(stage), { bonusFor: () => ({ ...emptyBonus(), atk: p.gear, hp: p.gear, def: p.gear }) });
    for (let k = 0; k < 3000 && battle.result === 'ongoing'; k++) battle = performAction(battle, chooseAction(battle, rng), rng).state;
    if (battle.result === 'won') wins++;
  }
  return wins / SEEDS;
}

// ---------- Walls ----------
console.log('== Wall stages (team of 5, stars = wall minimum +2, gear scales to +100% at stage 380) ==');
const walls = Object.keys(B.WALL_STAGES).map(Number);
const tierNeeded: Record<number, number | null> = {};
for (const n of walls) {
  const rows = [0, 5, 10].map((t) => ({ t, rate: winRate(n, profile(n, n > B.LEVEL_CAP_STAGE ? t : 0)) }));
  const usable = n > B.LEVEL_CAP_STAGE ? rows : rows.slice(0, 1);
  tierNeeded[n] = usable.find((r) => r.rate >= 0.5)?.t ?? null;
  const p = profile(n, 0);
  console.log(
    `stage ${String(n).padStart(3)} ×${B.enemyStrengthForStage(n).toFixed(2)} | ${p.star}★ Lv${p.level} +${Math.round(p.gear * 100)}% gear | ` +
      usable.map((r) => `T${r.t}: ${Math.round(r.rate * 100)}%`).join('  '),
  );
}

// ---------- Story totals and weekly materials ----------
const fresh = newSave();
const story = { coins: 0, gems: 0, spins: 0, essence: 0, crystals: 0 };
for (let n = 1; n <= B.TOTAL_STAGES; n++) {
  const r = rewardsFor({ ...fresh, clearedStage: n - 1 }, n, () => 0.99);
  story.coins += r.coins; story.gems += r.gems; story.spins += r.spins;
  story.essence += r.essence ?? 0; story.crystals += r.crystals ?? 0;
}
const endgame = { ...fresh, clearedStage: B.TOTAL_STAGES };
const weekly = { essence: 0, crystals: 0, gems: 0 };
for (const b of BOUNTIES) {
  const r = bountyReward(endgame, b);
  const times = b.period === 'daily' ? 7 : 1;
  weekly.essence += (r.essence ?? 0) * times; weekly.crystals += (r.crystals ?? 0) * times; weekly.gems += (r.gems ?? 0) * times;
}
for (const m of MILESTONES) {
  weekly.essence += m.reward.essence ?? 0; weekly.crystals += m.reward.crystals ?? 0; weekly.gems += m.reward.gems ?? 0;
}
const login = 3 + 5; // gem days on the 7-day login track
weekly.gems += login;
console.log('\n== Materials ==');
console.log(`story first clears: ${fmt(story.coins)} coins, ${story.gems} gems, ${story.spins} spins, ${story.essence} essence, ${story.crystals} crystals`);
console.log(`weekly (endgame, bounties + World Boss + login): ${weekly.essence} essence, ${weekly.crystals} crystals, ~${weekly.gems} gems`);

// ---------- Day estimates (model) ----------
const C = B.stageCoinReward(B.LEVEL_CAP_STAGE);
const battlesPerDay = (PLAY_HOURS_PER_DAY * 3600) / SECONDS_PER_BATTLE;
const coinsPerDay =
  battlesPerDay * B.REPLAY_COIN_SHARE * C +
  B.DAILY_BOOST_WINS * (B.DAILY_BOOST_MULT - 1) * B.REPLAY_COIN_SHARE * C +
  EXPEDITION_TRIPS_PER_DAY * C * 8 * 0.5 * 2.1 * B.LONG_EXPEDITION_COIN_MULT;
const gemsPerDay = weekly.gems / 7;
const restocksPerDay = 1 + gemsPerDay / SHOP_REFRESH_GEMS + B.MARKET_TICKETS_PER_DAY;

function starWork(fighters: number, topStar: number) {
  let restocks = 0; let coins = 0;
  for (let k = 1; k < topStar; k++) {
    const shards = fighters * B.DUPLICATES_TO_EVOLVE;
    restocks += shards / ((SHOP_OFFERS * SHARD_OFFER_SHARE) / k);
    coins += shards * shardPrice(C, k);
  }
  return { restocks, coins };
}
const levelCoins = upgradeCost(1, B.MAX_LEVEL - 1);
const tcTotal = (t: number) => TC_CRYSTAL_COST.slice(0, t).reduce((a, b) => a + b, 0);
const gravityAll = 5 * Array.from({ length: B.GRAVITY_MAX_LEVEL }, (_, i) => B.gravityCost(i)).reduce((a, b) => a + b, 0);

function days(fighters: number, topStar: number, tier: number, sig: boolean, extraCoins = 0) {
  const s = starWork(fighters, topStar);
  const coinDays = (s.coins + fighters * levelCoins + extraCoins) / coinsPerDay;
  const starDays = s.restocks / restocksPerDay;
  const crystalDays = (Math.max(0, fighters * tcTotal(tier) - story.crystals) / weekly.crystals) * 7;
  const essenceDays = sig ? (Math.max(0, fighters * 19 - story.essence) / weekly.essence) * 7 : 0;
  const parts = { coins: coinDays, stars: starDays, crystals: crystalDays, essence: essenceDays };
  const [gate, total] = Object.entries(parts).sort((a, b) => b[1] - a[1])[0];
  return `${fmt(total)} days (gate: ${gate}; coins ${fmt(coinDays)}, stars ${fmt(starDays)}, crystals ${fmt(crystalDays)}, essence ${fmt(essenceDays)})`;
}

const finalTier = tierNeeded[B.TOTAL_STAGES] ?? 10;
console.log('\n== Time estimates (model: 1h/day, 45s battles, 4 eight-hour trips/day, all dailies; C = stage 180 coins) ==');
console.log(`coins/day ≈ ${fmt(coinsPerDay)} (${(coinsPerDay / C).toFixed(1)}C), shop restocks/day ≈ ${restocksPerDay.toFixed(1)}`);
console.log(`(a) story clear (5 × 20★ Lv400, T${finalTier} for stage 380): ${days(TEAM, 20, finalTier, finalTier > 0)}`);
console.log(`(b) max 5-team (21★ Lv400, sig T3, T10):               ${days(TEAM, 21, 10, true)}`);
console.log(`(c) everything (${playable.length} fighters + Gravity):            ${days(playable.length, 21, 10, true, gravityAll)}`);
