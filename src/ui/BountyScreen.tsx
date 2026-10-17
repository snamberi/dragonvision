import { BOUNTIES, bountyProgress, claimBounty } from '../game/bounty';
import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { BuildingHeader } from './BuildingHeader';

interface Props {
  save: SaveData;
  update: Updater;
  onBack: () => void;
}

function rewardText(r: { coins?: number; spins?: number; gems?: number }): string {
  return [r.coins && `● ${r.coins.toLocaleString()}`, r.spins && `✦ ${r.spins}`, r.gems && `◆ ${r.gems}`].filter(Boolean).join(' · ');
}

export function BountyScreen({ save, update, onBack }: Props) {
  return (
    <div className="bounty">
      <BuildingHeader title="Bounty Board" onBack={onBack}>
        <p className="muted">Daily bounties reset at midnight, weekly ones on Monday. Progress counts from when each period starts.</p>
      </BuildingHeader>
      {(['daily', 'weekly'] as const).map((period) => (
        <section key={period} className="panel">
          <h3>{period === 'daily' ? 'Today' : 'This week'}</h3>
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
                      {done}/{b.goal} · {rewardText(b.reward)}
                    </span>
                  </div>
                  <button className="btn small primary" disabled={!complete || claimed} onClick={() => update((s) => claimBounty(s, b.id))}>
                    {claimed ? 'Claimed' : 'Claim'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
