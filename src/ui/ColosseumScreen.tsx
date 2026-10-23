import { getFamily } from '../game/roster';
import { materialText } from '../game/materials';
import { STREAK_BOSS_EVERY } from '../game/login';
import { bestStar } from '../game/sideModes';
import type { SaveData } from '../game/types';
import { BOSS_ATTEMPTS_PER_DAY, BOSS_ROUNDS, MILESTONES, attemptsLeft, bossProgress, claimMilestone, weeklyBoss } from '../game/worldBoss';
import type { Updater } from './App';
import { BuildingHeader } from './BuildingHeader';
import { Sprite, Stars } from './Sprite';
import { orbs } from './format';

interface Props {
  save: SaveData;
  update: Updater;
  onBack: () => void;
  onFight: () => void;
  onStreak: () => void;
}

function rewardText(r: (typeof MILESTONES)[number]['reward']): string {
  return [
    r.spins && orbs(r.spins),
    r.gems && `◆ ${r.gems}`,
    r.gear && `${r.gear === 'legendary' ? 'Legendary' : 'Epic'} gear`,
    r.shards && `${r.shards} shards`,
    ...materialText(r),
  ]
    .filter(Boolean)
    .join(' · ');
}

export function ColosseumScreen({ save, update, onBack, onFight, onStreak }: Props) {
  const boss = weeklyBoss(save, save.worldBoss.week);
  const family = getFamily(boss.familyId);
  const progress = bossProgress(save);
  const left = attemptsLeft(save);
  const defeated = progress >= 1;
  return (
    <div className="colosseum">
      <BuildingHeader title="Colosseum" onBack={onBack}>
        <p className="muted">
          A giant boss each week with one huge HP pool. Every attempt lasts {BOSS_ROUNDS} rounds and the damage stays. You get{' '}
          {BOSS_ATTEMPTS_PER_DAY} attempts a day. Claim rewards as the pool drops.
        </p>
      </BuildingHeader>
      <section className="panel boss-panel">
        <Sprite familyId={boss.familyId} star={boss.star} size={140} className="idle" />
        <div className="boss-info">
          <div className="eyebrow">This week's boss</div>
          <h2>{family.name}</h2>
          <div className="muted">
            Lv {boss.level} <Stars star={boss.star} /> · {family.title}
          </div>
          <span className="boss-bar">
            <i style={{ width: `${(1 - progress) * 100}%` }} />
          </span>
          <div>
            {Math.round((1 - progress) * 100)}% HP left · {save.worldBoss.damage.toLocaleString()} / {boss.pool.toLocaleString()} damage
          </div>
          <button className="btn primary big" disabled={left === 0 || defeated} onClick={onFight}>
            {defeated ? 'Defeated this week' : left === 0 ? 'Come back tomorrow' : `Fight (${left} left today)`}
          </button>
        </div>
      </section>

      <section className="panel">
        <h3>Streak Boss</h3>
        <p className="muted">
          Log in {STREAK_BOSS_EVERY} days in a row to unlock a bonus boss. Beat it for a guaranteed {bestStar(save)}★ evolution shard.
          Current streak: <b>{save.login.streak ?? 0}</b> day{(save.login.streak ?? 0) === 1 ? '' : 's'}.
        </p>
        <button className="btn primary" disabled={!save.login.bossReady} onClick={onStreak}>
          {save.login.bossReady ? 'Fight the Streak Boss' : `Unlocks at a ${STREAK_BOSS_EVERY}-day streak`}
        </button>
      </section>
      <section className="panel">
        <h3>Rewards</h3>
        <div className="bounty-list">
          {MILESTONES.map((m, i) => {
            const reached = progress >= m.share;
            const claimed = save.worldBoss.claimed.includes(i);
            return (
              <div key={m.label} className={`bounty-row ${claimed ? 'claimed' : reached ? 'complete' : ''}`}>
                <div className="bounty-text">
                  <span>{m.label === 'Defeated' ? 'Defeat the boss' : `Deal ${m.label} of its HP`}</span>
                  <span className="muted small-text">{rewardText(m.reward)}</span>
                </div>
                <button className="btn small primary" disabled={!reached || claimed} onClick={() => update((s) => claimMilestone(s, i))}>
                  {claimed ? 'Claimed' : 'Claim'}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
