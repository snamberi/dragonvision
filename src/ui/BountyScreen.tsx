import { useActionFeedback } from './useActionFeedback';
import { BOUNTIES, bountyProgress, bountyReward, claimBounty } from '../game/bounty';
import { activePosters, claimWantedPoster, refreshWantedPosters } from '../game/wanted';
import { dayKey } from '../game/time';
import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { BuildingHeader } from './BuildingHeader';
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
    <div className="bounty area-polished">{feedback}
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
          <span className="muted small-text">Bounties that expire daily — meet the stage + class requirement to claim.</span>
        </div>
        {(() => {
          const day = dayKey();
          const refreshed = refreshWantedPosters(save, day);
          const posters = activePosters(refreshed, day);
          if (posters.length === 0) return <p className="muted">No active posters right now — check back tomorrow.</p>;
          return posters.map((p) => (
            <div key={p.id} className={`bounty-row ${p.claimed ? 'claimed' : ''}`}>
              <div className="bounty-text">
                <span>Clear Stage {p.stage}{p.requiredClass ? ` with ${p.requiredClass}s` : ''}</span>
                <span className="muted small-text">● {p.coins.toLocaleString()} · ◆ {p.gems}</span>
              </div>
              <button className="btn small primary" disabled={p.claimed} onClick={() => update((s) => claimWantedPoster(refreshWantedPosters(s, day), p.id), 'Bounty claimed!')}>
                {p.claimed ? 'Claimed' : 'Claim'}
              </button>
            </div>
          ));
        })()}
      </section>
    </div>
  );
}
