import { useState } from 'react';
import { ACHIEVEMENTS, achievementState, allForms, claimAchievement, setTitle, unlockedTitles } from '../game/achievements';
import { FAMILIES, FUSIONS } from '../game/roster';
import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { BuildingHeader } from './BuildingHeader';
import { Sprite } from './Sprite';

interface Props {
  save: SaveData;
  update: Updater;
  onBack: () => void;
}

export function HallScreen({ save, update, onBack }: Props) {
  const [tab, setTab] = useState<'achievements' | 'collection'>('achievements');
  const titles = unlockedTitles(save);
  const seen = new Set(save.seenForms);
  return (
    <div className="hall">
      <BuildingHeader title="Hall of Legends" onBack={onBack}>
        <p className="muted">Achievements pay gems and spins, and many unlock a title shown on your Home screen. The collection log keeps every form you have ever owned.</p>
      </BuildingHeader>
      <div className="button-row">
        <button className={`btn small ${tab === 'achievements' ? 'primary' : ''}`} onClick={() => setTab('achievements')}>
          Achievements
        </button>
        <button className={`btn small ${tab === 'collection' ? 'primary' : ''}`} onClick={() => setTab('collection')}>
          Collection {seen.size}/{allForms().length}
        </button>
      </div>

      {tab === 'achievements' ? (
        <>
          <section className="panel">
            <h3>Title</h3>
            {titles.length === 0 ? (
              <p className="muted">Claim achievements to unlock titles.</p>
            ) : (
              <div className="button-row">
                <button className={`btn small ${save.title === null ? 'primary' : ''}`} onClick={() => update((s) => setTitle(s, null))}>
                  None
                </button>
                {titles.map((t) => (
                  <button key={t} className={`btn small ${save.title === t ? 'primary' : ''}`} onClick={() => update((s) => setTitle(s, t))}>
                    {t}
                  </button>
                ))}
              </div>
            )}
          </section>
          <section className="panel">
            <div className="bounty-list">
              {ACHIEVEMENTS.map((a) => {
                const st = achievementState(save, a);
                return (
                  <div key={a.id} className={`bounty-row ${st.claimed ? 'claimed' : st.complete ? 'complete' : ''}`}>
                    <div className="bounty-text">
                      <span>
                        <b>{a.name}</b> · {a.text}
                      </span>
                      <span className="bar xp">
                        <i style={{ width: `${(st.done / a.goal) * 100}%` }} />
                      </span>
                      <span className="muted small-text">
                        {st.done}/{a.goal} ·{' '}
                        {[a.reward.gems && `◆ ${a.reward.gems}`, a.reward.spins && `✦ ${a.reward.spins}`, a.title && `title “${a.title}”`]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </div>
                    <button className="btn small primary" disabled={!st.complete || st.claimed} onClick={() => update((s) => claimAchievement(s, a.id))}>
                      {st.claimed ? 'Claimed' : 'Claim'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        [...FAMILIES, ...FUSIONS].map((f) => (
          <section key={f.id} className="panel collection-row">
            <h3>
              {f.name} <span className="muted">· {f.title}</span>
            </h3>
            <div className="collection-forms">
              {f.forms.map((form, i) => {
                const has = seen.has(`${f.id}:${i}`);
                return (
                  <div key={form.name} className={`collection-form ${has ? '' : 'unseen'}`} title={has ? form.name : '???'}>
                    <Sprite familyId={f.id} star={i + 1} size={56} />
                    <small>{has ? form.name : '???'}</small>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
