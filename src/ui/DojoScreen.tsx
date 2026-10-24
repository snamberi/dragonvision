import { ActivityScene } from './ActivityScene';
import { useActionFeedback } from './useActionFeedback';
import { BuildingHeader, districtStyle } from './BuildingHeader';
import { useEffect, useState } from 'react';
import { DOJO_MINUTES_PER_LEVEL, DOJO_SLOTS, levelCap } from '../game/balance';
import { collectTraining, dojoProgress, startTraining, stopTraining } from '../game/dojo';
import { findUnit, isTraining, power, unitName } from '../game/progression';
import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { Portrait, Sprite, Stars } from './Sprite';

const CHALLENGE_GOAL_WINS = 3;
const CHALLENGE_GOAL_TRAIN = 5;
const CHALLENGE_GOAL_STAGES = 2;
const CHALLENGE_MAX_PROGRESS = 100;
const DOJO_POLL_MS = 5_000;

interface WeeklyChallenge {
  id: string;
  label: string;
  goal: number;
  reward: string;
  progress: (save: SaveData) => number;
}

const WEEKLY_CHALLENGES: WeeklyChallenge[] = [
  {
    id: 'win_battles',
    label: 'Win 3 battles',
    goal: CHALLENGE_GOAL_WINS,
    reward: '● 500 coins',
    progress: (s) => Math.min(CHALLENGE_GOAL_WINS, s.weeklyWins ?? 0),
  },
  {
    id: 'train_fighters',
    label: 'Send 5 fighters to the Dojo',
    goal: CHALLENGE_GOAL_TRAIN,
    reward: '◆ 2 gems',
    progress: (s) => Math.min(CHALLENGE_GOAL_TRAIN, s.weeklyTrains ?? 0),
  },
  {
    id: 'clear_stages',
    label: 'Clear 2 new stages',
    goal: CHALLENGE_GOAL_STAGES,
    reward: '🎰 1 Spin Orb',
    progress: (s) => Math.min(CHALLENGE_GOAL_STAGES, s.weeklyStages ?? 0),
  },
];

interface Props {
  save: SaveData;
  update: Updater;
  onBack: () => void;
}

export function DojoScreen({ save, update: commit, onBack }: Props) {
  const {update,feedback}=useActionFeedback(commit);
  const [now, setNow] = useState(Date.now);
  // Tick so progress bars move while the screen is open.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), DOJO_POLL_MS);
    return () => clearInterval(id);
  }, []);

  const idle = save.units
    .filter((u) => !save.team.includes(u.uid) && !isTraining(save, u.uid) && u.level < levelCap(u.star))
    .sort((a, b) => power(b.familyId, b.star, b.level) - power(a.familyId, a.star, a.level));
  const full = save.dojo.length >= DOJO_SLOTS;

  return (
    <div className="dojo area-polished bld bld-training" style={districtStyle("Training Dojo")}>{feedback}
      <BuildingHeader title="Training Dojo" onBack={onBack}>
        <p className="muted">
          Idle fighters train here and gain 1 level every {DOJO_MINUTES_PER_LEVEL} minutes, even while you're away, up to their
          level wall. Trained levels are free and stay through gem resets.
        </p>
      </BuildingHeader>
      <ActivityScene kind="dojo" status={`${save.dojo.length} of ${DOJO_SLOTS} training mats occupied`} active={save.dojo.length > 0}/>

      <div className="dojo-slots">
        {Array.from({ length: DOJO_SLOTS }, (_, i) => save.dojo[i]).map((slot, i) => {
          if (!slot) {
            return (
              <div key={`empty-${i}`} className="panel dojo-slot empty">
                <span className="arena-ghost" aria-hidden="true" />
                <span className="muted">Empty mat</span>
              </div>
            );
          }
          const unit = findUnit(save, slot.uid);
          const p = dojoProgress(save, slot, now);
          return (
            <div key={slot.uid} className="panel dojo-slot">
              <Sprite familyId={unit.familyId} star={unit.star} size={104} pose="punch" animated className="train" />
              <div className="dojo-name">
                {unitName(unit)} <Stars star={unit.star} />
              </div>
              <div className="muted">
                Lv {unit.level}
                {p.ready > 0 && <b className="dojo-ready"> +{p.ready}</b>} / cap {levelCap(unit.star)}
              </div>
              <span className="bar xp">
                <i style={{ width: `${p.partial * CHALLENGE_MAX_PROGRESS}%` }} />
              </span>
              <div className="muted small-text">{p.capped ? 'At the level wall. Evolve to keep training.' : 'Training…'}</div>
              <div className="button-row">
                <button className="btn small primary" disabled={p.ready === 0} onClick={() => update((s) => collectTraining(s, slot.uid, Date.now()), 'Training levels collected')}>
                  Collect
                </button>
                <button className="btn small" onClick={() => update((s) => stopTraining(s, slot.uid, Date.now()), 'Fighter returned from the Dojo')}>
                  Leave Dojo
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <section className="panel">
        <h3>Idle fighters</h3>
        {idle.length === 0 ? (
          <p className="muted">No idle fighters below their level wall. Fighters on your team can't train.</p>
        ) : (
          <div className="idle-list">
            {idle.map((u) => (
              <div key={u.uid} className="idle-row">
                <Portrait familyId={u.familyId} star={u.star} size={36} />
                <span className="idle-name">
                  {unitName(u)} <Stars star={u.star} />
                  <small className="muted">
                    Lv {u.level}/{levelCap(u.star)}
                  </small>
                </span>
                <button className="btn small" disabled={full} onClick={() => update((s) => startTraining(s, u.uid, Date.now()), 'Training started')}>
                  Train
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel weekly-challenges">
        <h3>Weekly Challenges</h3>
        <p className="muted small-text">Resets each week. Earn bonus rewards for training hard.</p>
        {WEEKLY_CHALLENGES.map((ch) => {
          const current = ch.progress(save);
          const done = current >= ch.goal;
          const pct = Math.min(CHALLENGE_MAX_PROGRESS, (current / ch.goal) * CHALLENGE_MAX_PROGRESS);
          return (
            <div key={ch.id} className={`challenge-row ${done ? 'done' : ''}`}>
              <span className="challenge-label">{ch.label}</span>
              <span className="challenge-reward muted small-text">{ch.reward}</span>
              <div className="challenge-bar">
                <div className="challenge-fill" style={{ width: `${pct}%` }} />
              </div>
              <span className="challenge-progress muted small-text">{current}/{ch.goal}{done ? ' ✓' : ''}</span>
            </div>
          );
        })}
      </section>
    </div>
  );
}
