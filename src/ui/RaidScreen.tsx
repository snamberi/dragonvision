import { RAID_GEMS_PER_PHASE, RAID_PHASES, RAID_ROUNDS, raidAttemptsLeft, raidBoss, weekKey } from '../game/raid';
import type { SaveData } from '../game/types';
import { BuildingHeader } from './BuildingHeader';
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
  const defeated = totalDamage >= boss.pool;

  return (
    <div className="raid area-polished">
      <BuildingHeader title="Boss Raid" onBack={onBack}>
        <p className="muted">
          A weekly boss with a huge shared HP pool. Each attempt lasts {RAID_ROUNDS} rounds; the damage you deal carries over all week.
        </p>
      </BuildingHeader>

      <section className="panel">
        <div className="section-head">
          <h3>{boss.name}</h3>
          <span className="chip">Week {week}</span>
        </div>
        <Sprite familyId={boss.familyId} star={boss.star} size={96} />
        <p className="muted">Lv {boss.level} · {boss.star}★</p>

        <div className="raid-bar-wrap mt-sm">
          <div className="bar hp raid-hp-bar">
            <i style={{ width: `${PCT_MAX - hpPct}%` }} />
          </div>
          <div className="raid-phase-markers">
            {Array.from({ length: RAID_PHASES - 1 }, (_, idx) => (
              <span key={idx} className="raid-phase-tick" style={{ left: `${((idx + 1) / RAID_PHASES) * PCT_MAX}%` }} />
            ))}
          </div>
        </div>

        <p className="muted mt-sm">
          {totalDamage.toLocaleString()} / {boss.pool.toLocaleString()} damage · {clearedPhases.length} / {RAID_PHASES} phases
        </p>

        <button className="btn primary mt-sm" disabled={attempts <= 0 || defeated} onClick={onFight}>
          {defeated ? 'Defeated this week' : `Raid Boss (${attempts} left today)`}
        </button>
        {attempts <= 0 && !defeated && <p className="muted small-text">No attempts left today. Come back tomorrow.</p>}
      </section>

      <section className="panel">
        <h3>Phase Rewards</h3>
        {Array.from({ length: RAID_PHASES }, (_, idx) => {
          const phase = idx + 1;
          const done = clearedPhases.includes(phase);
          return (
            <div key={phase} className={`raid-phase-row ${done ? 'claimed' : ''}`}>
              <span>Phase {phase}</span>
              <span className="muted">◆ {RAID_GEMS_PER_PHASE} gems</span>
              <span>{done ? '✓' : '—'}</span>
            </div>
          );
        })}
      </section>
    </div>
  );
}
