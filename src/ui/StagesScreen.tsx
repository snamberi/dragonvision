import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { REPLAY_COIN_SHARE, STAGES_PER_CHAPTER, TOTAL_STAGES, WALL_STAGES, enemyStrengthForStage, isWallStage } from '../game/balance';
import { type Arena, WEATHER_TEXT, arenaForChapter } from '../game/arenas';
import { power, teamUnits, unitName } from '../game/progression';
import { CHAPTER_NAMES, WALL_SET_REPLAY_CHANCE, dailyBoostLeft, getStage, isUnlocked, stageKind } from '../game/stages';
import { GEAR_EFFECTS, wallSetFor } from '../game/bossSets';
import { CHAPTER_SCENES, markScene, sceneSeen } from '../game/story';
import { TRAITS, WALL_SCENES, wallRule, wallSceneKey } from '../game/encounters';
import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { type Run, newRun } from './run';
import { preFightAdvice } from '../game/advice';
import { getFamily, roleFor } from '../game/roster';
import { Sprite, Stars } from './Sprite';
import { StoryScene } from './StoryScene';
import { type PropKind, PropSprite, isNightSky, propsFor } from './StageArt';
import { WeatherLayer } from './WorldScene';

interface Props {
  save: SaveData;
  update: Updater;
  onPlay: (stage: number, run?: Run) => void;
}

const LAST_CHAPTER = Math.ceil(TOTAL_STAGES / STAGES_PER_CHAPTER);

/** Node positions (percent of the map box), bottom to top, winding left and right. The top quarter is sky. */
function nodePoints(chapter: number): { x: number; y: number }[] {
  return Array.from({ length: STAGES_PER_CHAPTER }, (_, i) => ({
    x: 50 + 30 * Math.sin(i * 1.15 + chapter * 0.7),
    y: 95 - i * 7.6,
  }));
}

type Point = { x: number; y: number };
type Scenery = { x: number; y: number; kind: PropKind | 'lantern'; size: number };

/** Road x at a given height, interpolated between nodes (which run bottom to top). */
function roadXAt(points: Point[], y: number): number {
  const seg = points.findIndex((p, i) => i > 0 && p.y <= y);
  if (seg <= 0) return points[seg === 0 ? 0 : points.length - 1].x;
  const a = points[seg - 1];
  const b = points[seg];
  return a.x + ((b.x - a.x) * (a.y - y)) / (a.y - b.y);
}

/** Seeded props off the road and clear of boss sprites, plus a lantern beside every other stage. */
function sceneryFor(chapter: number, points: Point[], kinds: PropKind[]): Scenery[] {
  const bossIdx = [STAGES_PER_CHAPTER / 2 - 1, STAGES_PER_CHAPTER - 1];
  const clear = (x: number, y: number) =>
    Math.abs(x - roadXAt(points, y)) > 17 &&
    !bossIdx.some((i) => Math.abs(points[i].y - y) < 8 && Math.abs(points[i].x - x) < 28);
  const props = Array.from({ length: 70 }, (_, k) => ({
    x: ((k * 37 + chapter * 23) % 92) + 4,
    y: 33 + ((k * 53 + chapter * 11) % 66),
    kind: kinds[k % kinds.length],
    size: 64 + ((k * 13) % 44),
  }))
    .filter((s) => clear(s.x, s.y))
    .reduce<Scenery[]>((kept, s) => (kept.length < 14 && !kept.some((o) => Math.abs(o.x - s.x) < 10 && Math.abs(o.y - s.y) < 6) ? [...kept, s] : kept), []);
  const lanterns = points
    .map((p, i) => ({ p, i }))
    .filter(({ i }) => i % 2 === 0 && i !== STAGES_PER_CHAPTER - 1)
    .map(({ p }) => ({ x: Math.min(95, Math.max(5, p.x + (p.x > 50 ? 13 : -13))), y: p.y + 1.5, kind: 'lantern' as const, size: 46 }));
  // Draw back to front so lower props overlap the ones behind them.
  return [...props, ...lanterns].sort((a, b) => a.y - b.y);
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
  const points = useMemo(() => nodePoints(chapter), [chapter]);
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

  const night = isNightSky(arena);
  const scenery = useMemo(() => sceneryFor(chapter, points, propsFor(arena)), [chapter, points, arena]);
  const clearedHere = Math.max(0, Math.min(STAGES_PER_CHAPTER, save.clearedStage - (first - 1)));
  const nextHere = next >= first && next < first + STAGES_PER_CHAPTER && isUnlocked(save, next) && next > save.clearedStage;
  const card = nextHere
    ? { label: 'Your next stage', title: `Stage ${next}`, go: () => setSelected(next) }
    : chapter < LAST_CHAPTER && chapter < unlockedChapters
      ? { label: 'Next chapter', title: CHAPTER_NAMES[chapter], go: () => setChapter(chapter + 1) }
      : null;

  const style = {
    '--sm-sky-top': arena.skyTop,
    '--sm-sky-bottom': arena.skyBottom,
    '--sm-ground-top': arena.groundTop,
    '--sm-ground-bottom': arena.groundBottom,
    '--sm-far': arena.far,
    '--sm-near': arena.near,
    '--sm-floor': arena.floor,
    '--sm-floor-edge': arena.floorEdge,
    '--sm-accent': arena.accent,
  } as CSSProperties;

  return (
    <div className="stages sm">
      <div className="chapter-bar sm-chapter-bar">
        <button className="btn small" disabled={chapter <= 1} onClick={() => setChapter(chapter - 1)} aria-label="Previous chapter">
          ◀
        </button>
        <div className="chapter-title">
          <select value={chapter} onChange={(e) => setChapter(Number(e.target.value))} aria-label="Chapter">
            {Array.from({ length: unlockedChapters }, (_, i) => i + 1).map((c) => (
              <option key={c} value={c}>
                Ch {c} · {CHAPTER_NAMES[c - 1]}
              </option>
            ))}
          </select>
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

      <div className={`stage-map sm-map arena-${arena.id} ${night ? 'is-night' : ''}`} style={style} ref={mapRef}>
        <MapSky arena={arena} night={night} />
        <MapGround night={night} />
        <WeatherLayer weather={arena.weather} />
        <svg className="map-road sm-road" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {['edge', 'base', 'top', 'joints', 'shine'].map((layer) => (
            <path key={layer} d={roadPath(points)} className={`sm-road-${layer}`} vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
        {scenery.map((s, i) => (
          <PropSprite key={i} kind={s.kind} arena={arena} left={s.x} top={s.y} width={s.size} className={s.kind === 'lantern' ? 'sm-lantern' : ''} />
        ))}

        <div className="vc-welcome sm-welcome">
          <div>
            <span className="vc-eyebrow">
              Chapter {chapter} of {LAST_CHAPTER} · {arena.name}
            </span>
            <h2>{CHAPTER_NAMES[chapter - 1]}</h2>
            <p>
              {WEATHER_TEXT[arena.weather]} · {clearedHere}/{STAGES_PER_CHAPTER} cleared
            </p>
          </div>
          {card && (
            <button className="vc-next sm-next" onClick={card.go}>
              <span>
                <small>{card.label}</small>
                <strong>{card.title}</strong>
              </span>
              <b aria-hidden="true">→</b>
            </button>
          )}
        </div>

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
              {isWallStage(n) && !cleared && <span className="map-check wall">🛡</span>}
              {cleared && <span className="map-check">✓</span>}
            </div>
          );
        })}
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

/** The sky band: Home's gradient, pixel sun (or moon and stars), drifting clouds and two mountain ridges. */
function MapSky({ arena, night }: { arena: Arena; night: boolean }) {
  return (
    <div className="sm-sky" aria-hidden="true">
      <svg viewBox="0 0 1200 300" preserveAspectRatio="none" shapeRendering="crispEdges">
        <defs>
          <linearGradient id={`sm-sky-${arena.id}`} x2="0" y2="1">
            <stop stopColor={arena.skyTop} />
            <stop offset="1" stopColor={arena.skyBottom} />
          </linearGradient>
        </defs>
        <path d="M0 0H1200V300H0Z" fill={`url(#sm-sky-${arena.id})`} />
        <path d="M0 196L140 120L250 172L420 96L560 190L700 112L860 176L1010 104L1120 160L1200 128V300H0Z" fill={arena.far} />
        <path d="M384 116L420 96L452 128L420 118L404 132ZM672 128L700 112L730 140L702 130Z" fill="#ffffff" opacity=".35" />
        <path d="M0 236L210 186L380 228L600 180L830 222L1000 190L1200 214V300H0Z" fill={arena.near} />
        <path d="M0 270Q300 248 600 274T1200 262V300H0Z" fill={arena.groundTop} />
      </svg>
      <i className={`sm-sun ${night ? 'moon' : ''}`} />
      {night && Array.from({ length: 14 }, (_, i) => <b key={i} className="sm-star" style={{ left: `${(i * 41 + 7) % 96}%`, top: `${(i * 23) % 52 + 4}%` }} />)}
      <svg className="sm-cloud" viewBox="0 0 200 30" style={{ left: '8%', top: '30%' }}>
        <path d="M0 20H30V10H70V0H125V10H160V20H195V30H0Z" fill="#dec5bc" opacity=".4" />
      </svg>
      <svg className="sm-cloud slow" viewBox="0 0 200 30" style={{ left: '52%', top: '14%' }}>
        <path d="M0 20H30V10H70V0H125V10H160V20H195V30H0Z" fill="#dec5bc" opacity=".3" />
      </svg>
    </div>
  );
}

/** Grass tufts and tiny flowers in real pixels, so they never stretch with the map. */
function MapGround({ night }: { night: boolean }) {
  return (
    <svg className="sm-ground" width="100%" height="100%" aria-hidden="true" shapeRendering="crispEdges">
      <defs>
        <pattern id="sm-tuft" width="37" height="31" patternUnits="userSpaceOnUse">
          <path d="M6 10v4h3v-7M27 25v-3h3v4" stroke="#ffffff" strokeWidth="2" opacity=".14" />
        </pattern>
        <pattern id="sm-flower" width="97" height="83" patternUnits="userSpaceOnUse">
          <path d="M20 30v9m-3 -5h6" stroke="#73a279" strokeWidth="2" opacity={night ? 0 : 0.8} />
          <path d="M18 28h5v4h-5Z" fill={night ? '#e9e4ff' : '#f2d49d'} opacity=".8" />
          <path d="M71 66v9m-3 -5h6" stroke="#73a279" strokeWidth="2" opacity={night ? 0 : 0.8} />
          <path d="M69 64h5v4h-5Z" fill={night ? '#b794ff' : '#d89caa'} opacity=".75" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#sm-tuft)" />
      <rect width="100%" height="100%" fill="url(#sm-flower)" />
    </svg>
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
  const [stopOnSet, setStopOnSet] = useState(true);
  const [coinGoal, setCoinGoal] = useState('');
  const farmStops = {
    setPiece: Boolean(wallSetFor(stageNumber)) && stopOnSet,
    coinTarget: Number(coinGoal) > save.coins ? Number(coinGoal) : null,
  };
  const advice = team.length > 0 ? preFightAdvice(team.map((u) => roleFor(getFamily(u.familyId))), stage) : '';
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <section className="panel stage-card modal stage-sheet sm-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="stage-head sm-sheet-head">
          <div>
            <span className="vc-eyebrow">
              Chapter {stage.chapter} · {stage.chapterName}
            </span>
            <h2>
              Stage {stage.number}
              {stage.kind === 'boss' && <span className="tag boss">BOSS</span>}
              {stage.kind === 'miniBoss' && <span className="tag mini">MINI-BOSS</span>}
              {isWallStage(stage.number) && <span className="tag boss">WALL</span>}
            </h2>
          </div>
          <div className="power-compare">
            <span>Your team {teamPower.toLocaleString()}</span>
            <span>Enemies {enemyPower.toLocaleString()}</span>
          </div>
        </div>

        <ul className="sm-facts">
          {isWallStage(stage.number) && (
            <li className="warn">
              <b>Gate</b>
              <span>
                Enemies are {Math.round(((WALL_STAGES[stage.number] ?? 1) - 1) * 100)}% stronger than usual. Evolve, gear up or train before you try.
              </span>
            </li>
          )}
          {stage.weather && stage.weather !== 'clear' && (
            <li>
              <b>Weather</b>
              <span>{WEATHER_TEXT[stage.weather]}</span>
            </li>
          )}
          <li>
            <b>Class</b>
            <span>
              Dominant class: <strong>{stage.dominantRole}</strong> — bring a counter
            </span>
          </li>
          {stage.trait && (
            <li>
              <b>Trait</b>
              <span>
                <strong>{TRAITS[stage.trait].name}</strong> — {TRAITS[stage.trait].text}
              </span>
            </li>
          )}
          {wallRule(stage.number) && (
            <li className="warn">
              <b>Rule</b>
              <span>
                <strong>{wallRule(stage.number)!.name}</strong> — {wallRule(stage.number)!.text}
              </span>
            </li>
          )}
          {wallSetFor(stage.number) && (
            <li>
              <b>Drops</b>
              <span>
                <strong style={{ color: wallSetFor(stage.number)!.color }}>{wallSetFor(stage.number)!.name}</strong> set piece — guaranteed on the first clear,{' '}
                {Math.round(WALL_SET_REPLAY_CHANCE * 100)}% on replays. 4 pieces: {GEAR_EFFECTS[wallSetFor(stage.number)!.effect].text}.
              </span>
            </li>
          )}
          {advice && (
            <li className="tip stage-advice">
              <b>Tip</b>
              <span>{advice}</span>
            </li>
          )}
        </ul>

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
          <button className="btn primary big" disabled={team.length === 0} onClick={() => onPlay(stageNumber)}>
            {team.length === 0 ? 'Add a fighter to your team first' : `${replay ? 'Replay' : 'Fight'} with ${team.length} fighter${team.length === 1 ? '' : 's'}`}
          </button>
          <button className="btn ghost" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="auto-runs">
          {replay ? (
            <div className="auto-run">
              <button className="btn" onClick={() => onPlay(stageNumber, newRun('farm', farmLimit === 'all' ? null : Number(farmLimit), farmStops))}>
                Auto-Farm
              </button>
              <select value={farmLimit} onChange={(e) => setFarmLimit(e.target.value)} aria-label="Auto-Farm runs">
                <option value="5">5 runs</option>
                <option value="10">10 runs</option>
                <option value="25">25 runs</option>
                <option value="50">50 runs</option>
                <option value="all">Until I stop</option>
              </select>
              <span className="muted small-text">Replays this stage for {Math.round(REPLAY_COIN_SHARE * 100)}% coins. Stops on a defeat.</span>
              <div className="farm-stops small-text">
                {wallSetFor(stageNumber) && (
                  <label>
                    <input type="checkbox" checked={stopOnSet} onChange={(e) => setStopOnSet(e.target.checked)} /> Stop when a set piece drops
                  </label>
                )}
                <label>
                  Stop at{' '}
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    inputMode="numeric"
                    placeholder="coins"
                    value={coinGoal}
                    onChange={(e) => setCoinGoal(e.target.value)}
                    aria-label="Stop when coins reach"
                  />{' '}
                  coins
                </label>
              </div>
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
