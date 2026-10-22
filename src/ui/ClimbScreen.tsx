import { climbReward, climbWeekKey, recordClimbFloor } from '../game/climb';
import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { BuildingHeader } from './BuildingHeader';
import { useActionFeedback } from './useActionFeedback';

interface Props {
  save: SaveData;
  update: Updater;
  onBack: () => void;
  onChallenge: (floor: number) => void;
}

const MILESTONE_FLOORS = [10, 20, 30, 50, 100];

export function ClimbScreen({ save, update: commit, onBack, onChallenge }: Props) {
  const { update, feedback } = useActionFeedback(commit);
  const week = climbWeekKey();
  const isCurrentWeek = save.climbWeek === week;
  const best = isCurrentWeek ? (save.climbBest ?? 0) : 0;
  const nextFloor = best + 1;

  return (
    <div className="tower">
      {feedback}
      <BuildingHeader title="Infinite Climb" onBack={onBack}>
        <p className="muted">
          Endless floors of escalating rivals. Each floor you clear improves your weekly best. Enemies grow stronger every floor — how high can
          you go?
        </p>
      </BuildingHeader>

      <section className="panel">
        <h3>This week</h3>
        <p>Best floor: <strong>{best}</strong> {best > 0 && `(Week ${week})`}</p>
        <button className="btn primary" onClick={() => onChallenge(nextFloor)}>
          {best > 0 ? `Continue from Floor ${nextFloor}` : 'Start Climb'}
        </button>
        <button
          className="btn small"
          style={{ marginLeft: 8 }}
          disabled={best <= 0}
          onClick={() => update((s) => recordClimbFloor(s, best), `Floor ${best} recorded`)}
        >
          Record progress
        </button>
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
