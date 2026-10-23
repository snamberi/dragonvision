import { BEAT_LAST_WEEK_REWARD, climbReward, climbWeekKey, lastWeekBest, syncClimbWeek } from '../game/climb';
import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { BuildingHeader } from './BuildingHeader';

interface Props {
  save: SaveData;
  update: Updater;
  onBack: () => void;
  onChallenge: (floor: number) => void;
}

const MILESTONE_FLOORS = [10, 20, 30, 50, 100];
const PCT_MAX = 100;

export function ClimbScreen({ save, onBack, onChallenge }: Props) {
  const week = climbWeekKey();
  const synced = syncClimbWeek(save, week);
  const best = synced.climbBest ?? 0;
  const nextFloor = best + 1;
  const target = lastWeekBest(synced);
  const history = [...(synced.climbHistory ?? []), { week, best }];
  const top = Math.max(1, ...history.map((h) => h.best));

  return (
    <div className="tower">
      <BuildingHeader title="Infinite Climb" onBack={onBack}>
        <p className="muted">
          Endless floors of escalating rivals. Each new floor you clear this week pays out and raises your weekly best. Floors reset every Monday.
        </p>
      </BuildingHeader>

      <section className="panel">
        <h3>This week</h3>
        <p>Best floor: <strong>{best}</strong></p>
        {target > 0 && (
          <p className="muted small-text">
            {best > target
              ? `You beat last week's best (${target}F). Bonus collected!`
              : `Beat last week's best (${target}F) for ◆ ${BEAT_LAST_WEEK_REWARD.gems} and ${BEAT_LAST_WEEK_REWARD.spins} Spin Orbs.`}
          </p>
        )}
        <button className="btn primary" onClick={() => onChallenge(nextFloor)}>
          {best > 0 ? `Challenge Floor ${nextFloor}` : 'Start Climb'}
        </button>
      </section>

      <section className="panel">
        <h3>Weekly bests</h3>
        <div className="bounty-list">
          {history.map((h) => (
            <div key={h.week} className="bounty-row">
              <div className="bounty-text">
                <span>{h.week === week ? 'This week' : h.week}</span>
                <span className="bar"><i style={{ width: `${(h.best / top) * PCT_MAX}%` }} /></span>
              </div>
              <span className="muted">{h.best}F</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>Milestone rewards</h3>
        <div className="bounty-list">
          {MILESTONE_FLOORS.map((floor) => {
            const r = climbReward(floor);
            const cleared = best >= floor;
            return (
              <div key={floor} className={`bounty-row ${cleared ? 'claimed' : ''}`}>
                <div className="bounty-text">
                  <span>Floor {floor}</span>
                  <span className="muted small-text">● {r.coins.toLocaleString()}{r.gems > 0 && ` · ◆ ${r.gems}`}</span>
                </div>
                <span className="muted">{cleared ? '✓ Cleared' : 'Locked'}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
