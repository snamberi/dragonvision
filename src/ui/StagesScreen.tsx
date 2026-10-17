import { useState } from 'react';
import { REPLAY_COIN_SHARE, STAGES_PER_CHAPTER, TOTAL_STAGES, enemyStrengthForStage } from '../game/balance';
import { power, teamUnits, unitName } from '../game/progression';
import { getStage, isUnlocked, stageKind } from '../game/stages';
import type { SaveData } from '../game/types';
import { Sprite, Stars } from './Sprite';

interface Props {
  save: SaveData;
  onPlay: (stage: number) => void;
}

export function StagesScreen({ save, onPlay }: Props) {
  const next = Math.min(TOTAL_STAGES, save.clearedStage + 1);
  const [selected, setSelected] = useState(next);
  const [chapter, setChapter] = useState(Math.ceil(next / STAGES_PER_CHAPTER));
  const stage = getStage(selected);
  const replay = selected <= save.clearedStage;
  const team = teamUnits(save);
  const teamPower = team.reduce((sum, u) => sum + power(u.familyId, u.star, u.level), 0);
  const enemyPower = Math.round(
    stage.enemies.reduce((sum, e) => sum + power(e.familyId, e.star, e.level), 0) * enemyStrengthForStage(selected),
  );
  const chapters = Math.ceil(Math.min(TOTAL_STAGES, save.clearedStage + 1) / STAGES_PER_CHAPTER);

  return (
    <div className="stages">
      <section className="panel stage-card">
        <div className="stage-head">
          <div>
            <div className="eyebrow">
              Chapter {stage.chapter} · {stage.chapterName}
            </div>
            <h2>
              Stage {stage.number}
              {stage.kind === 'boss' && <span className="tag boss">BOSS</span>}
              {stage.kind === 'miniBoss' && <span className="tag mini">MINI-BOSS</span>}
            </h2>
          </div>
          <div className="power-compare">
            <span>Your team {teamPower.toLocaleString()}</span>
            <span>Enemies {enemyPower.toLocaleString()}</span>
          </div>
        </div>

        <div className="enemy-row">
          {stage.enemies.map((e, i) => (
            <div key={i} className={`enemy-chip rank-${e.rank}`}>
              <Sprite familyId={e.familyId} star={e.star} size={56} flip />
              <div className="chip-name">{unitName(e)}</div>
              <div className="chip-meta">
                Lv {e.level} <Stars star={e.star} />
              </div>
            </div>
          ))}
        </div>

        <div className="reward-line">
          {replay ? (
            <>Replay: {Math.round(stage.coins * REPLAY_COIN_SHARE).toLocaleString()} coins (25%), no spins or gems</>
          ) : (
            <>
              First clear: {stage.coins.toLocaleString()} coins ·{' '}
              {stage.kind === 'boss' ? '10 spins · 15 gems' : stage.kind === 'miniBoss' ? '5 spins · 5 gems' : '1 spin · 1% gem chance'}
            </>
          )}
        </div>
        <button className="btn primary big" onClick={() => onPlay(selected)}>
          {replay ? 'Replay' : 'Fight'} with {team.length} fighter{team.length === 1 ? '' : 's'}
        </button>
      </section>

      <div className="chapter-tabs">
        {Array.from({ length: chapters }, (_, i) => i + 1).map((c) => (
          <button key={c} className={c === chapter ? 'active' : ''} onClick={() => setChapter(c)}>
            Ch {c}
          </button>
        ))}
      </div>

      <div className="stage-grid">
        {Array.from({ length: STAGES_PER_CHAPTER }, (_, i) => (chapter - 1) * STAGES_PER_CHAPTER + i + 1).map((n) => {
          const unlocked = isUnlocked(save, n);
          const kind = stageKind(n);
          return (
            <button
              key={n}
              disabled={!unlocked}
              className={`stage-btn ${kind} ${n === selected ? 'selected' : ''} ${n <= save.clearedStage ? 'cleared' : ''}`}
              onClick={() => setSelected(n)}
            >
              <span>{n}</span>
              <small>{!unlocked ? 'locked' : n <= save.clearedStage ? 'cleared' : kind === 'boss' ? 'boss' : kind === 'miniBoss' ? 'mini' : 'new'}</small>
            </button>
          );
        })}
      </div>
    </div>
  );
}
