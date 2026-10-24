import { getFamily } from '../game/roster';
import { materialText } from '../game/materials';
import { STREAK_BOSS_EVERY } from '../game/login';
import { bestStar } from '../game/sideModes';
import type { SaveData } from '../game/types';
import { BOSS_ATTEMPTS_PER_DAY, BOSS_ROUNDS, MILESTONES, attemptsLeft, bossProgress, claimMilestone, weeklyBoss } from '../game/worldBoss';
import type { Updater } from './App';
import { colosseumUrl } from '../art/buildings';
import { QMeter, QPanel, QuarterScene } from './QuarterScene';
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
  const streak = save.login.streak ?? 0;
  return (
    <div className="colosseum qscreen">
      <QuarterScene
        quarter="arena"
        title="Colosseum"
        art={colosseumUrl()}
        onBack={onBack}
        line={`A giant boss each week with one shared HP pool. Every attempt lasts ${BOSS_ROUNDS} rounds and the damage stays.`}
        status={{ label: 'Attempts today', value: `${left} / ${BOSS_ATTEMPTS_PER_DAY}` }}
        figure={<Sprite familyId={boss.familyId} star={boss.star} size={84} className="idle" />}
      />

      <QPanel eyebrow="THIS WEEK'S BOSS" title={family.name} aside={<span className="qtag">{defeated ? 'DEFEATED' : `${Math.round((1 - progress) * 100)}% HP`}</span>}>
        <div className="qboss">
          <span className="qboss-portrait">
            <Sprite familyId={boss.familyId} star={boss.star} size={140} className="idle" />
          </span>
          <div className="qboss-info">
            <p>
              Lv {boss.level} <Stars star={boss.star} /> · {family.title}
            </p>
            <span className="qm hp">
              <i style={{ width: `${(1 - progress) * 100}%` }} />
            </span>
            <p>
              <b>{save.worldBoss.damage.toLocaleString()}</b> / {boss.pool.toLocaleString()} damage dealt
            </p>
            <button className="btn primary big" disabled={left === 0 || defeated} onClick={onFight}>
              {defeated ? 'Defeated this week' : left === 0 ? 'Come back tomorrow' : `Fight (${left} left today)`}
            </button>
          </div>
        </div>
      </QPanel>

      <QPanel eyebrow="LOYALTY TRIAL" title="Streak Boss" aside={<span className={`qtag ${save.login.bossReady ? '' : 'dark'}`}>{save.login.bossReady ? 'READY' : `${streak}/${STREAK_BOSS_EVERY} DAYS`}</span>}>
        <p>
          Log in {STREAK_BOSS_EVERY} days in a row to unlock a bonus boss. Beat it for a guaranteed {bestStar(save)}★ evolution shard.
          Current streak: <b>{streak}</b> day{streak === 1 ? '' : 's'}.
        </p>
        <QMeter value={Math.min(1, streak / STREAK_BOSS_EVERY)} label="Login streak" />
        <button className="btn primary" disabled={!save.login.bossReady} onClick={onStreak}>
          {save.login.bossReady ? 'Fight the Streak Boss' : `Unlocks at a ${STREAK_BOSS_EVERY}-day streak`}
        </button>
      </QPanel>

      <QPanel eyebrow="SPOILS OF THE ARENA" title="Rewards">
        <div className="qrows">
          {MILESTONES.map((m, i) => {
            const reached = progress >= m.share;
            const claimed = save.worldBoss.claimed.includes(i);
            return (
              <div key={m.label} className={`qr ${claimed ? 'done' : reached ? 'ready' : ''}`}>
                <div className="qr-main">
                  <span>{m.label === 'Defeated' ? 'Defeat the boss' : `Deal ${m.label} of its HP`}</span>
                  <small>{rewardText(m.reward)}</small>
                </div>
                <div className="qr-side">
                  <button className="btn small primary" disabled={!reached || claimed} onClick={() => update((s) => claimMilestone(s, i))}>
                    {claimed ? 'Claimed' : 'Claim'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </QPanel>
    </div>
  );
}
