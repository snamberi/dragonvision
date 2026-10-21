import { ActivityScene } from './ActivityScene';
import { useActionFeedback } from './useActionFeedback';
import { useState } from 'react';
import { ACHIEVEMENTS, achievementState, allForms, claimAchievement, setTitle, unlockedTitles } from '../game/achievements';
import { FAMILIES, GOLDEN_FAMILIES, FUSIONS, LEGENDARIES } from '../game/roster';
import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { BuildingHeader } from './BuildingHeader';
import { Sprite } from './Sprite';
import { orbs } from './format';

interface Props {
  save: SaveData;
  update: Updater;
  onBack: () => void;
}

export function HallScreen({ save, update: commit, onBack }: Props) {
  const {update,feedback}=useActionFeedback(commit);
  const [showAll,setShowAll]=useState(false);
  const [tab, setTab] = useState<'achievements' | 'collection'>('achievements');
  const titles = unlockedTitles(save);
  const seen = new Set(save.seenForms);
  return (
    <div className="hall area-polished">{feedback}
      <BuildingHeader title="Hall of Legends" onBack={onBack}>
        <p className="muted">Achievements pay gems and Spin Orbs, and many unlock a title shown on your Home screen. The collection log keeps every form you have ever owned.</p>
      </BuildingHeader>
      <ActivityScene kind="hall" status={`${save.achievements.length} achievements claimed · ${seen.size} forms discovered`} active={false}/>
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
                        {[a.reward.gems && `◆ ${a.reward.gems}`, a.reward.spins && orbs(a.reward.spins), a.title && `title “${a.title}”`]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </div>
                    <button className="btn small primary" disabled={!st.complete || st.claimed} onClick={() => update((s) => claimAchievement(s, a.id), 'Achievement reward collected')}>
                      {st.claimed ? 'Claimed' : 'Claim'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <>{(showAll?[...FAMILIES, ...GOLDEN_FAMILIES, ...FUSIONS, ...LEGENDARIES]:[...FAMILIES, ...GOLDEN_FAMILIES, ...FUSIONS, ...LEGENDARIES].slice(0,10)).map((f) => (
          <section key={f.id} className="panel collection-row">
            <h3>
              {f.name} <span className="muted">· {f.title}</span>
            </h3>
            <div className="collection-forms">
              {f.forms.map((form, i) => {
                const has = seen.has(`${f.id}:${i}`);
                return (
                  <div key={form.name} className={`collection-form ${has ? '' : 'unseen'}`} title={has ? form.name : '???'}>
                    <Sprite familyId={f.id} star={i + (f.firstStar ?? 1)} size={56} />
                    <small>{has ? form.name : '???'}</small>
                  </div>
                );
              })}
            </div>
          </section>
        ))}<button className="btn small" aria-expanded={showAll} onClick={()=>setShowAll(!showAll)}>{showAll?'Show fewer':'Show all characters'}</button></>
      )}
    </div>
  );
}
