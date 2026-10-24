import { useActionFeedback } from './useActionFeedback';
import { BOUNTIES, bountyProgress, bountyReward, claimBounty } from '../game/bounty';
import { claimWantedPoster, refreshWantedPosters, todaysPosters } from '../game/wanted';
import { dayKey } from '../game/time';
import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { BuildingHeader, districtStyle } from './BuildingHeader';
import { orbs } from './format';
import { type MaterialReward, materialText } from '../game/materials';

interface Props {
  save: SaveData;
  update: Updater;
  onBack: () => void;
}

function rewardText(r: { coins?: number; spins?: number; gems?: number } & MaterialReward): string {
  return [r.coins && `● ${r.coins.toLocaleString()}`, r.spins && orbs(r.spins), r.gems && `◆ ${r.gems}`, ...materialText(r)].filter(Boolean).join(' · ');
}

export function BountyScreen({ save, update: commit, onBack }: Props) {
  const {update,feedback}=useActionFeedback(commit);
  return (
    <div className="bounty area-polished bld bld-training" style={districtStyle("Bounty Board")}>{feedback}
      <BuildingHeader title="Bounty Board" onBack={onBack}>
        <p className="muted">Daily bounties reset at midnight, weekly ones on Monday. Progress counts from when each period starts.</p>
      </BuildingHeader>
      {(['daily', 'weekly'] as const).map((period) => {
        const periodLabel: Record<'daily' | 'weekly', string> = { daily: 'Today', weekly: 'This week' };
        return (
        <section key={period} className="panel">
          <h3>{periodLabel[period]}</h3>
          <div className="bounty-list">
            {BOUNTIES.filter((b) => b.period === period).map((b) => {
              const { done, claimed } = bountyProgress(save, b);
              const complete = done >= b.goal;
              return (
                <div key={b.id} className={`bounty-row ${claimed ? 'claimed' : complete ? 'complete' : ''}`}>
                  <div className="bounty-text">
                    <span>{b.label}</span>
                    <span className="bar xp">
                      <i style={{ width: `${(done / b.goal) * 100}%` }} />
                    </span>
                    <span className="muted small-text">
                      {done}/{b.goal} · {rewardText(bountyReward(save, b))}
                    </span>
                  </div>
                  <button className="btn small primary" disabled={!complete || claimed} onClick={() => update((s) => claimBounty(s, b.id), 'Bounty reward collected')}>
                    {claimed ? 'Claimed' : 'Claim'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
        );
      })}

      <section className="panel">
        <div className="section-head">
          <h3>Wanted Posters</h3>
          <span className="muted small-text">Three a day. Win the stage today with the required class on your team, then claim once.</span>
        </div>
        {(() => {
          const day = dayKey();
          const posters = todaysPosters(save, day);
          return posters.map((p) => (
            <div key={p.id} className={`bounty-row ${p.claimed ? 'claimed' : ''}`}>
              <div className="bounty-text">
                <span>Win Stage {p.stage}{p.requiredClass ? ` with a ${p.requiredClass} on your team` : ''}</span>
                <span className="muted small-text">● {p.coins.toLocaleString()} · ◆ {p.gems}{p.done && !p.claimed ? ' · ready!' : ''}</span>
              </div>
              <button className="btn small primary" disabled={p.claimed || !p.done} onClick={() => update((s) => claimWantedPoster(refreshWantedPosters(s, day), p.id), 'Bounty claimed!')}>
                {p.claimed ? 'Claimed' : p.done ? 'Claim' : 'Not yet'}
              </button>
            </div>
          ));
        })()}
      </section>
    </div>
  );
}
