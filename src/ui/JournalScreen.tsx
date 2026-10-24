import { completeJournalEntry, journalFamilies, overallCompletion } from '../game/journal';
import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { BuildingHeader, districtStyle } from './BuildingHeader';
import { Portrait, Stars } from './Sprite';
import { useActionFeedback } from './useActionFeedback';

interface Props {
  save: SaveData;
  update: Updater;
  onBack: () => void;
}

export function JournalScreen({ save, update: commit, onBack }: Props) {
  const { update, feedback } = useActionFeedback(commit);
  const completion = overallCompletion(save);
  const entries = journalFamilies(save);

  return (
    <div className="tower bld bld-training journal-screen" style={districtStyle("Collector's Journal")}>
      {feedback}
      <BuildingHeader title="Collector's Journal" onBack={onBack}>
        <p className="muted">
          Collect all forms of a fighter family to complete their entry and earn gems. Completion:{' '}
          <strong>
            {completion.families}/{completion.total}
          </strong>{' '}
          families ({completion.pct}%).
        </p>
      </BuildingHeader>

      <div className="floor-list">
        {entries.map(({ family, owned, total, complete }) => {
          const claimed = !!(save.journalComplete ?? {})[family.id];
          const canClaim = complete && !claimed;
          return (
            <section key={family.id} className={`panel floor ${complete ? 'cleared' : ''}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Portrait familyId={family.id} star={Math.max(1, owned)} size={40} />
                <div style={{ flex: 1 }}>
                  <b>{family.name}</b>
                  <div className="muted small-text">{family.title}</div>
                  <div className="muted small-text">
                    Forms: {owned}/{total} <Stars star={owned} />
                  </div>
                </div>
                {claimed ? (
                  <span className="muted small-text">✓ Claimed</span>
                ) : canClaim ? (
                  <button className="btn small primary" onClick={() => update((s) => completeJournalEntry(s, family.id), `${family.name} journal complete! +5 gems`)}>
                    Claim ◆ 5
                  </button>
                ) : (
                  <span className="muted small-text">{total - owned} more</span>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
