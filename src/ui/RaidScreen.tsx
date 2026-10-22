import { attemptRaid, canRaid, RAID_HP_PER_PHASE, RAID_PHASES, raidBossName, weekKey } from '../game/raid';
import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { BuildingHeader } from './BuildingHeader';
import { useActionFeedback } from './useActionFeedback';

interface Props {
  save: SaveData;
  update: Updater;
  onBack: () => void;
}

const RAID_DEMO_DAMAGE = 10_000;
const PHASE_BAR_SEGMENTS = RAID_PHASES;
const PCT_MAX = 100;

export function RaidScreen({ save, update: commit, onBack }: Props) {
  const { update, feedback } = useActionFeedback(commit);
  const week = weekKey(new Date());
  const bossName = raidBossName(week);
  const state = save.raid?.week === week ? save.raid : null;
  const totalDamage = state?.totalDamage ?? 0;
  const clearedPhases = state?.clearedPhases ?? [];
  const currentPhase = state?.phase ?? 0;
  const totalBossHp = RAID_HP_PER_PHASE * RAID_PHASES;
  const hpPct = Math.min(PCT_MAX, Math.round((totalDamage / totalBossHp) * PCT_MAX));
  const canAttack = canRaid(save);

  return (
    <div className="raid area-polished">{feedback}
      <BuildingHeader title="Boss Raid" onBack={onBack}>
        <p className="muted">Team up against a weekly boss. Each new phase cleared earns gems.</p>
      </BuildingHeader>

      <section className="panel">
        <div className="section-head">
          <h3>{bossName}</h3>
          <span className="chip">Week {week}</span>
        </div>

        <div className="raid-bar-wrap mt-sm">
          <div className="bar hp raid-hp-bar">
            <i style={{ width: `${PCT_MAX - hpPct}%` }} />
          </div>
          <div className="raid-phase-markers">
            {Array.from({ length: PHASE_BAR_SEGMENTS - 1 }, (_, idx) => (
              <span
                key={idx}
                className="raid-phase-tick"
                style={{ left: `${((idx + 1) / PHASE_BAR_SEGMENTS) * PCT_MAX}%` }}
              />
            ))}
          </div>
        </div>

        <p className="muted mt-sm">Phase {currentPhase} / {RAID_PHASES} cleared &mdash; {totalDamage.toLocaleString()} total damage</p>
        <p className="muted">Phases cleared this week: {clearedPhases.join(', ') || 'none'}</p>

        <button
          className="btn primary mt-sm"
          disabled={!canAttack}
          onClick={() => update((s) => attemptRaid(s, RAID_DEMO_DAMAGE), `Raid hit! ${RAID_DEMO_DAMAGE.toLocaleString()} damage dealt.`)}
        >
          Raid Boss
        </button>
        {!canAttack && <p className="muted small-text">No attempts left today. Come back tomorrow.</p>}
      </section>

      <section className="panel">
        <h3>Phase Rewards</h3>
        {Array.from({ length: RAID_PHASES }, (_, idx) => {
          const phase = idx + 1;
          const done = clearedPhases.includes(phase);
          return (
            <div key={phase} className={`raid-phase-row ${done ? 'claimed' : ''}`}>
              <span>Phase {phase}</span>
              <span className="muted">◆ 5 gems</span>
              <span>{done ? '✓' : '—'}</span>
            </div>
          );
        })}
      </section>
    </div>
  );
}
