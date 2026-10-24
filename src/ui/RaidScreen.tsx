import { RAID_GEMS_PER_PHASE, RAID_PHASES, RAID_ROUNDS, raidAttemptsLeft, raidBoss, raidSet, weekKey } from '../game/raid';
import { SetBonusText } from './GearCard';
import type { SaveData } from '../game/types';
import { raidUrl } from '../art/buildings';
import { QPanel, QuarterScene } from './QuarterScene';
import { Sprite } from './Sprite';

interface Props {
  save: SaveData;
  onBack: () => void;
  onFight: () => void;
}

const PCT_MAX = 100;

export function RaidScreen({ save, onBack, onFight }: Props) {
  const week = weekKey(new Date());
  const boss = raidBoss(save, week);
  const state = save.raid?.week === week ? save.raid : null;
  const totalDamage = state?.totalDamage ?? 0;
  const clearedPhases = state?.clearedPhases ?? [];
  const hpPct = Math.min(PCT_MAX, Math.round((totalDamage / boss.pool) * PCT_MAX));
  const attempts = raidAttemptsLeft(save, week);
  const set = raidSet(week);
  const defeated = totalDamage >= boss.pool;

  return (
    <div className="raid qscreen">
      <QuarterScene
        quarter="harbor"
        title="Boss Raid"
        art={raidUrl()}
        onBack={onBack}
        line={`A weekly titan with a huge shared HP pool. Each attempt lasts ${RAID_ROUNDS} rounds; your damage carries over all week.`}
        status={{ label: 'Attempts today', value: `${attempts} left` }}
        figure={<Sprite familyId={boss.familyId} star={boss.star} size={84} className="idle" />}
      />

      <QPanel eyebrow={`WEEK ${week}`} title={boss.name} aside={<span className="qtag">{defeated ? 'DEFEATED' : `${clearedPhases.length}/${RAID_PHASES} PHASES`}</span>}>
        <div className="qboss">
          <span className="qboss-portrait">
            <Sprite familyId={boss.familyId} star={boss.star} size={130} className="idle" />
          </span>
          <div className="qboss-info">
            <p>Lv {boss.level} · {boss.star}★</p>
            <span className="qm hp ticks" role="meter" aria-label="Raid boss HP" aria-valuemin={0} aria-valuemax={PCT_MAX} aria-valuenow={PCT_MAX - hpPct}>
              <i style={{ width: `${PCT_MAX - hpPct}%` }} />
            </span>
            <p>
              <b>{totalDamage.toLocaleString()}</b> / {boss.pool.toLocaleString()} damage · {clearedPhases.length} / {RAID_PHASES} phases
            </p>
            <button className="btn primary big" disabled={attempts <= 0 || defeated} onClick={onFight}>
              {defeated ? 'Defeated this week' : `Raid Boss (${attempts} left today)`}
            </button>
            {attempts <= 0 && !defeated && <p>No attempts left today. Come back tomorrow.</p>}
          </div>
        </div>
      </QPanel>

      <QPanel eyebrow="WAR SPOILS" title="Phase rewards">
        {set && (
          <p>
            This week's set: <SetBonusText setId={set.id} />
          </p>
        )}
        <div className="qrows">
          {Array.from({ length: RAID_PHASES }, (_, idx) => {
            const phase = idx + 1;
            const done = clearedPhases.includes(phase);
            return (
              <div key={phase} className={`qr ${done ? 'done' : ''}`}>
                <div className="qr-main">
                  <span>Phase {phase}</span>
                  <small>◆ {RAID_GEMS_PER_PHASE} gems{set ? ` + ${set.name} piece` : ''}</small>
                </div>
                <div className="qr-side">
                  <span className={`qtag ${done ? 'done' : 'dark'}`}>{done ? '✓ CLEARED' : 'AHEAD'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </QPanel>
    </div>
  );
}
