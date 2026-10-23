import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { REPLAY_COIN_SHARE, STAGES_PER_CHAPTER, TOTAL_STAGES, WALL_STAGES, enemyStrengthForStage, isWallStage } from '../game/balance';
import { WEATHER_TEXT, arenaForChapter } from '../game/arenas';
import { power, teamUnits, unitName } from '../game/progression';
import { CHAPTER_NAMES, WALL_SET_REPLAY_CHANCE, dailyBoostLeft, getStage, isUnlocked, stageKind } from '../game/stages';
import { GEAR_EFFECTS, wallSetFor } from '../game/bossSets';
import { CHAPTER_SCENES, markScene, sceneSeen } from '../game/story';
import { TRAITS, WALL_SCENES, wallRule, wallSceneKey } from '../game/encounters';
import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { type Run, newRun } from './run';
import { Sprite, Stars } from './Sprite';
import { StoryScene } from './StoryScene';

interface Props {
  save: SaveData;
  update: Updater;
  onPlay: (stage: number, run?: Run) => void;
}

const LAST_CHAPTER = Math.ceil(TOTAL_STAGES / STAGES_PER_CHAPTER);

/** Node positions (percent of the map box), bottom to top, winding left and right. */
function nodePoints(chapter: number): { x: number; y: number }[] {
  return Array.from({ length: STAGES_PER_CHAPTER }, (_, i) => ({
    x: 50 + 30 * Math.sin(i * 1.15 + chapter * 0.7),
    y: 91 - i * 9.2,
  }));
}

/** Smooth road through the nodes. */
function roadPath(points: { x: number; y: number }[]): string {
  return points.reduce((d, p, i) => {
    if (i === 0) return `M${p.x} ${p.y + 6}L${p.x} ${p.y}`;
    const prev = points[i - 1];
    const midY = (prev.y + p.y) / 2;
    return `${d}C${prev.x} ${midY} ${p.x} ${midY} ${p.x} ${p.y}`;
  }, '');
}

export function StagesScreen({ save, update, onPlay }: Props) {
  const next = Math.min(TOTAL_STAGES, save.clearedStage + 1);
  const unlockedChapters = Math.ceil(next / STAGES_PER_CHAPTER);
  const [chapter, setChapter] = useState(unlockedChapters);
  const [selected, setSelected] = useState<number | null>(null);
  const [story, setStory] = useState<{ stage: number; run?: Run; wall?: boolean } | null>(null);
  const [farmLimit, setFarmLimit] = useState<string>('10');
  const mapRef = useRef<HTMLDivElement>(null);
  const arena = arenaForChapter(chapter);
  const points = nodePoints(chapter);
  const first = (chapter - 1) * STAGES_PER_CHAPTER + 1;
  const leader = teamUnits(save)[0];

  // Bring the next stage into view when the map opens.
  useEffect(() => {
    mapRef.current?.querySelector('.map-node.current')?.scrollIntoView({ block: 'center' });
  }, [chapter]);

  /** Shows the chapter's opening scene the first time its first stage is played. */
  const play = (stageNumber: number, run?: Run) => {
    const c = Math.ceil(stageNumber / STAGES_PER_CHAPTER);
    const isOpening = stageNumber === (c - 1) * STAGES_PER_CHAPTER + 1 && stageNumber > save.clearedStage;
    const wallIntro = WALL_SCENES[stageNumber] && stageNumber > save.clearedStage && !sceneSeen(save, wallSceneKey(stageNumber));
    if (wallIntro) setStory({ stage: stageNumber, run, wall: true });
    else if (isOpening && !sceneSeen(save, String(c)) && CHAPTER_SCENES[c - 1]) setStory({ stage: stageNumber, run });
    else onPlay(stageNumber, run);
  };

  const style = {
    '--map-top': arena.skyTop,
    '--map-bottom': arena.groundBottom,
    '--map-mid': arena.groundTop,
    '--map-near': arena.near,
    '--map-far': arena.far,
    '--map-accent': arena.accent,
    '--map-floor': arena.floor,
  } as CSSProperties;

  return (
    <div className="stages">
      <div className="chapter-bar">
        <button className="btn small" disabled={chapter <= 1} onClick={() => setChapter(chapter - 1)} aria-label="Previous chapter">
          ◀
        </button>
        <div className="chapter-title">
          <select value={chapter} onChange={(e) => setChapter(Number(e.target.value))} aria-label="Chapter">
            {Array.from({ length: unlockedChapters }, (_, i) => i + 1).map((c) => (
              <option key={c} value={c}>
                Chapter {c} · {CHAPTER_NAMES[c - 1]}
              </option>
            ))}
          </select>
          <small>
            {arena.name} · {WEATHER_TEXT[arena.weather]}
          </small>
        </div>
        <button
          className="btn small"
          disabled={chapter >= unlockedChapters || chapter >= LAST_CHAPTER}
          onClick={() => setChapter(chapter + 1)}
          aria-label="Next chapter"
        >
          ▶
        </button>
      </div>

      <div className={`stage-map arena-${arena.id}`} style={style} ref={mapRef}>
        <MapDecor seed={chapter} />
        <svg className="map-road" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d={roadPath(points)} className="road-base" vectorEffect="non-scaling-stroke" />
          <path d={roadPath(points)} className="road-stripe" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="map-banner">{CHAPTER_NAMES[chapter - 1]}</div>
        {points.map((p, i) => {
          const n = first + i;
          const kind = stageKind(n);
          const cleared = n <= save.clearedStage;
          const unlocked = isUnlocked(save, n);
          const current = n === next && unlocked && !cleared;
          const boss = kind !== 'normal' ? getStage(n).enemies[0] : null;
          return (
            <div key={n} className="map-spot" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
              {boss && (
                <span className={`map-boss ${p.x > 50 ? 'left' : 'right'}`}>
                  <Sprite familyId={boss.familyId} star={boss.star} size={kind === 'boss' ? 88 : 60} />
                </span>
              )}
              {current && leader && (
                <span className="map-leader">
                  <Sprite familyId={leader.familyId} star={leader.star} size={64} flip className="idle" />
                </span>
              )}
              <button
                className={`map-node ${kind} ${cleared ? 'cleared' : ''} ${current ? 'current' : ''} ${unlocked ? '' : 'locked'}`}
                disabled={!unlocked}
                onClick={() => setSelected(n)}
                aria-label={`Stage ${n}${kind === 'boss' ? ', boss' : kind === 'miniBoss' ? ', mini-boss' : ''}${isWallStage(n) ? ', wall' : ''}${cleared ? ', cleared' : ''}`}
              >
                {n}
              </button>
              {isWallStage(n) && !cleared && <span className="map-check">🛡</span>}
              {cleared && <span className="map-check">✓</span>}
            </div>
          );
        })}
        {chapter < LAST_CHAPTER && chapter < unlockedChapters && (
          <button className="map-next" onClick={() => setChapter(chapter + 1)}>
            Next: {CHAPTER_NAMES[chapter]} ▲
          </button>
        )}
      </div>

      {selected !== null && (
        <StageSheet
          save={save}
          stageNumber={selected}
          farmLimit={farmLimit}
          setFarmLimit={setFarmLimit}
          onClose={() => setSelected(null)}
          onPlay={(n, run) => {
            setSelected(null);
            play(n, run);
          }}
        />
      )}

      {story && (
        <StoryScene
          title={
            story.wall
              ? `Gate Battle · Stage ${story.stage} · ${wallRule(story.stage)?.name ?? ''}`
              : `Chapter ${Math.ceil(story.stage / STAGES_PER_CHAPTER)} · ${CHAPTER_NAMES[Math.ceil(story.stage / STAGES_PER_CHAPTER) - 1]}`
          }
          lines={story.wall ? WALL_SCENES[story.stage] : CHAPTER_SCENES[Math.ceil(story.stage / STAGES_PER_CHAPTER) - 1]}
          onDone={() => {
            const key = story.wall ? wallSceneKey(story.stage) : String(Math.ceil(story.stage / STAGES_PER_CHAPTER));
            update((s) => markScene(s, key));
            const { stage, run } = story;
            setStory(null);
            onPlay(stage, run);
          }}
        />
      )}
    </div>
  );
}

/** Seeded pixel trees, rocks and sparkles in the chapter's colors. */
function MapDecor({ seed }: { seed: number }) {
  return (
    <div className="map-decor" aria-hidden="true">
      {Array.from({ length: 26 }, (_, i) => {
        const x = (i * 37 + seed * 13) % 96;
        const y = (i * 53 + seed * 7) % 94;
        const kind = (i + seed) % 3;
        return <i key={i} className={`decor-${kind}`} style={{ left: `${x}%`, top: `${y}%` }} />;
      })}
    </div>
  );
}

interface SheetProps {
  save: SaveData;
  stageNumber: number;
  farmLimit: string;
  setFarmLimit: (v: string) => void;
  onClose: () => void;
  onPlay: (stage: number, run?: Run) => void;
}

/** Details for one stage, opened from the map. */
function StageSheet({ save, stageNumber, farmLimit, setFarmLimit, onClose, onPlay }: SheetProps) {
  const stage = getStage(stageNumber);
  const replay = stageNumber <= save.clearedStage;
  const team = teamUnits(save);
  const teamPower = team.reduce((sum, u) => sum + power(u.familyId, u.star, u.level), 0);
  const enemyPower = Math.round(
    stage.enemies.reduce((sum, e) => sum + power(e.familyId, e.star, e.level), 0) * enemyStrengthForStage(stageNumber),
  );
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <section className="panel stage-card modal stage-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="stage-head">
          <div>
            <div className="eyebrow">
              Chapter {stage.chapter} · {stage.chapterName}
            </div>
            <h2>
              Stage {stage.number}
              {stage.kind === 'boss' && <span className="tag boss">BOSS</span>}
              {stage.kind === 'miniBoss' && <span className="tag mini">MINI-BOSS</span>}
              {isWallStage(stage.number) && <span className="tag boss">WALL</span>}
            </h2>
            {isWallStage(stage.number) && (
              <div className="muted small-text">
                Gate battle: enemies are {Math.round(((WALL_STAGES[stage.number] ?? 1) - 1) * 100)}% stronger than usual. Evolve, gear up or train before you try.
              </div>
            )}
            {stage.weather && stage.weather !== 'clear' && <div className="muted small-text">{WEATHER_TEXT[stage.weather]}</div>}
            <div className="muted small-text">Dominant class: <strong>{stage.dominantRole}</strong> — bring a counter</div>
            {stage.trait && (
              <div className="muted small-text">
                Enemy trait: <strong>{TRAITS[stage.trait].name}</strong> — {TRAITS[stage.trait].text}
              </div>
            )}
            {wallRule(stage.number) && (
              <div className="small-text">
                Arena rule: <strong>{wallRule(stage.number)!.name}</strong> — {wallRule(stage.number)!.text}
              </div>
            )}
            {wallSetFor(stage.number) && (
              <div className="small-text">
                Drops: <strong style={{ color: wallSetFor(stage.number)!.color }}>{wallSetFor(stage.number)!.name}</strong> set piece — guaranteed on the
                first clear, {Math.round(WALL_SET_REPLAY_CHANCE * 100)}% on replays. 4 pieces: {GEAR_EFFECTS[wallSetFor(stage.number)!.effect].text}.
              </div>
            )}
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
            <>Replay: {Math.round(stage.coins * REPLAY_COIN_SHARE).toLocaleString()} coins ({Math.round(REPLAY_COIN_SHARE * 100)}%){stage.kind === 'boss' ? ' · 5% legendary piece' : ', no Spin Orbs or gems'}</>
          ) : (
            <>
              First clear: {stage.coins.toLocaleString()} coins ·{' '}
              {stage.kind === 'boss'
                ? '10 Spin Orbs · 15 gems · Rare+ gear · 5% legendary piece'
                : stage.kind === 'miniBoss'
                  ? '5 Spin Orbs · 5 gems · Uncommon+ gear'
                  : '1 Spin Orb · 4% gem chance'}
            </>
          )}
        </div>
        {dailyBoostLeft(save) > 0 && (
          <div className="muted small-text">Daily boost: your next {dailyBoostLeft(save)} story win{dailyBoostLeft(save) === 1 ? '' : 's'} today pay ×2 coins.</div>
        )}
        <div className="button-row">
          <button className="btn primary big" onClick={() => onPlay(stageNumber)}>
            {replay ? 'Replay' : 'Fight'} with {team.length} fighter{team.length === 1 ? '' : 's'}
          </button>
          <button className="btn ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="auto-runs">
          {replay ? (
            <div className="auto-run">
              <button className="btn" onClick={() => onPlay(stageNumber, newRun('farm', farmLimit === 'all' ? null : Number(farmLimit)))}>
                Auto-Farm
              </button>
              <select value={farmLimit} onChange={(e) => setFarmLimit(e.target.value)} aria-label="Auto-Farm runs">
                <option value="5">5 runs</option>
                <option value="10">10 runs</option>
                <option value="25">25 runs</option>
                <option value="50">50 runs</option>
                <option value="all">Until I stop</option>
              </select>
              <span className="muted small-text">Replays this stage for 7.5% coins. Stops on a defeat.</span>
            </div>
          ) : stage.kind === 'normal' ? (
            <div className="auto-run">
              <button className="btn" onClick={() => onPlay(stageNumber, newRun('progress'))}>
                Auto-Progress
              </button>
              <span className="muted small-text">Keeps clearing new stages. Stops before mini-bosses, bosses, or on a defeat.</span>
            </div>
          ) : (
            <span className="muted small-text">Bosses can't be auto-progressed. Beat this one yourself.</span>
          )}
        </div>
      </section>
    </div>
  );
}
