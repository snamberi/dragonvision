import { BEAT_LAST_WEEK_REWARD, climbReward, climbWeekKey, lastWeekBest, syncClimbWeek } from '../game/climb';
import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { climbUrl } from '../art/buildings';
import { QMeter, QPanel, QuarterScene } from './QuarterScene';

interface Props {
  save: SaveData;
  update: Updater;
  onBack: () => void;
  onChallenge: (floor: number) => void;
}

const MILESTONE_FLOORS = [10, 20, 30, 50, 100];

export function ClimbScreen({ save, onBack, onChallenge }: Props) {
  const week = climbWeekKey();
  const synced = syncClimbWeek(save, week);
  const best = synced.climbBest ?? 0;
  const nextFloor = best + 1;
  const target = lastWeekBest(synced);
  const history = [...(synced.climbHistory ?? []), { week, best }];
  const top = Math.max(1, ...history.map((h) => h.best));

  return (
    <div className="climb qscreen">
      <QuarterScene
        quarter="arena"
        title="Infinite Climb"
        art={climbUrl()}
        onBack={onBack}
        line="Endless floors of escalating rivals. Every new floor this week pays out and raises your weekly best. Floors reset each Monday."
        status={{ label: 'This week', value: `Best ${best}F` }}
      />

      <QPanel eyebrow="THIS WEEK" title={`Floor ${nextFloor} awaits`} aside={<span className="qtag">BEST {best}F</span>}>
        {target > 0 ? (
          <>
            <p>
              {best > target
                ? `You beat last week's best (${target}F). Bonus collected!`
                : `Beat last week's best (${target}F) for ◆ ${BEAT_LAST_WEEK_REWARD.gems} and ${BEAT_LAST_WEEK_REWARD.spins} Spin Orbs.`}
            </p>
            <QMeter value={Math.min(1, best / (target + 1))} label="Progress toward last week's best" />
          </>
        ) : (
          <p>Set a weekly best: every floor you clear counts.</p>
        )}
        <button className="btn primary big" onClick={() => onChallenge(nextFloor)}>
          {best > 0 ? `Challenge Floor ${nextFloor}` : 'Start Climb'}
        </button>
      </QPanel>

      <QPanel eyebrow="YOUR RECORD" title="Weekly bests">
        <div className="qhist">
          {history.map((h) => (
            <div key={h.week} className={`qhist-row ${h.week === week ? 'now' : ''}`}>
              <span>{h.week === week ? 'This week' : h.week}</span>
              <QMeter value={h.best / top} label={`${h.week}: floor ${h.best}`} />
              <b>{h.best}F</b>
            </div>
          ))}
        </div>
      </QPanel>

      <QPanel eyebrow="WAYPOINTS" title="Milestone rewards">
        <div className="qrows">
          {MILESTONE_FLOORS.map((floor) => {
            const r = climbReward(floor);
            const cleared = best >= floor;
            return (
              <div key={floor} className={`qr ${cleared ? 'done' : 'locked'}`}>
                <div className="qr-main">
                  <span>Floor {floor}</span>
                  <small>● {r.coins.toLocaleString()}{r.gems > 0 && ` · ◆ ${r.gems}`}</small>
                </div>
                <div className="qr-side">
                  <span className={`qtag ${cleared ? 'done' : 'dark'}`}>{cleared ? '✓ CLEARED' : 'LOCKED'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </QPanel>
    </div>
  );
}
