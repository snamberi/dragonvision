import { WeatherLayer, WorldScene } from './WorldScene';
import { WEATHER_TEXT, arenaForStage } from '../game/arenas';
import { AttackEffect } from './AttackEffect';
import { PixelIcon } from './PixelIcon';
import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { KI_BLAST_COST, KI_MAX } from '../game/balance';
import {
  type Action,
  type ActionEvent,
  type ActionKind,
  type BattleState,
  type Fighter,
  type Hit,
  canUse,
  chooseAction,
  comboFor,
  createBattle,
  living,
  nextActor,
  performAction,
  specialOf,
  specialNeed,
  specialReady,
  targetsFor,
} from '../game/battle';
import { recordWin } from '../game/bounty';
import { unitBonus } from '../game/fighterBonus';
import { teamSlots } from '../game/progression';
import { ARENAS } from '../game/arenas';
import { finishSurvival, nextWave, survivalCoins, survivalWave } from '../game/survival';
import { bossStage, recordBossAttempt } from '../game/worldBoss';
import { classEdge, getFamily } from '../game/roster';
import { applyTowerWin, towerRewards, towerStage } from '../game/tower';
import { FINAL_STAGE, type Rewards, applyRewards, getStage, rewardsFor } from '../game/stages';
import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { type Run, nextInRun } from './run';
import { Portrait, Sprite, Stars } from './Sprite';
import { GearCard } from './GearCard';
import { sfx } from '../audio/sound';
import { describeSpecial } from './specialText';
import { orbs } from './format';
import { ItemIcon } from './ItemIcon';
import { PIECES_TO_FORGE } from '../game/legendary';

interface Props {
  save: SaveData;
  stageNumber: number;
  /** Set for a Rival Tower floor instead of a story stage. */
  towerFloor?: number;
  /** World boss attempt or an Endless Survival run instead of a story stage. */
  mode?: 'boss' | 'survival';
  run: Run;
  update: Updater;
  onExit: () => void;
  /** Starts the next battle of an auto run. */
  onContinue: (stage: number, run: Run) => void;
}

const STEP_MS = 650;
const SPEEDS = [1, 2, 4] as const;
const SPEED_KEY = 'dragonvision.speed';

function loadSpeed(): number {
  try {
    const v = Number(localStorage.getItem(SPEED_KEY));
    return SPEEDS.includes(v as 1) ? v : 1;
  } catch {
    return 1;
  }
}

/** Floating text over a fighter for one hit. */
function hitText(h: Hit): string {
  switch (h.kind) {
    case 'damage':
      return h.absorbed > 0 && h.absorbed === h.amount ? `SHIELD -${h.absorbed}` : `-${(h.amount - h.absorbed).toLocaleString()}`;
    case 'heal':
      return `+${h.amount.toLocaleString()}`;
    case 'revive':
      return 'REVIVED';
    case 'shield':
      return `SHIELD +${h.amount.toLocaleString()}`;
    case 'stun':
      return 'STUNNED';
    case 'resist':
      return 'RESIST';
    case 'rally':
      return `ATK +${h.amount}%`;
  }
}

/**
 * Where a fighter stands on the field, as percentages of the field box.
 * Enemies stand on the left facing right, the team on the right facing left;
 * the front row stands nearer the middle.
 */
function fieldPosition(f: Fighter): CSSProperties {
  const front = f.row === 'front';
  const x = f.side === 'enemy' ? (front ? 31 : 12) : front ? 69 : 88;
  const y = [42, 56, 70, 84, 98][f.slot] ?? 70;
  return { left: `${x}%`, top: `${y}%`, zIndex: Math.round(y) };
}

export function BattleScreen({ save, stageNumber, towerFloor, mode, run, update, onExit, onContinue }: Props) {
  // The team and stage are fixed when the battle starts.
  const [squad] = useState(() => teamSlots(save));
  const [wave, setWave] = useState(1);
  const [stage] = useState(() =>
    mode === 'boss'
      ? bossStage(save)
      : mode === 'survival'
        ? survivalWave(squad, 1)
        : towerFloor
          ? towerStage(towerFloor)
          : getStage(stageNumber),
  );
  const [bossStart] = useState(() => (mode === 'boss' ? stage.enemies[0].hpPool!.left : 0));
  const [bossDamage, setBossDamage] = useState<number | null>(null);
  const [survivalDone, setSurvivalDone] = useState<number | null>(null);
  const arena = useMemo(
    () => (mode === 'boss' ? ARENAS.demon : mode === 'survival' ? ARENAS.void : arenaForStage(towerFloor ? 10 + towerFloor * 12 : stageNumber)),
    [mode, stageNumber, towerFloor],
  );
  const [battle, setBattle] = useState<BattleState>(() =>
    createBattle(squad, stage, { bonusFor: (u) => unitBonus(save, u) }),
  );
  const [event, setEvent] = useState<{ id: number; data: ActionEvent } | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<ActionKind | null>(null);
  const [auto, setAuto] = useState(run.mode !== 'single');
  const [speed, setSpeed] = useState(() => (run.mode === 'single' ? loadSpeed() : Math.max(2, loadSpeed())));
  const [log, setLog] = useState<string[]>([]);
  const [rewards, setRewards] = useState<Rewards | null>(null);
  const [runAfter, setRunAfter] = useState<{ run: Run; next?: number; stop?: string } | null>(null);
  const eventId = useRef(0);
  // Blocks a second action from a fast double tap before React re-renders.
  const acting = useRef(false);
  const rewarded = useRef(false);
  const step = STEP_MS / speed;

  const actor = nextActor(battle);
  const playerControls = battle.result === 'ongoing' && battle.turn === 'player' && !auto && !busy;
  const nameOf = (id: string) => battle.fighters.find((f) => f.id === id)?.name ?? '?';

  const act = (action: Action) => {
    if (acting.current) return;
    let result: ReturnType<typeof performAction>;
    try {
      result = performAction(battle, action);
    } catch (error) {
      console.error('Battle action failed', error);
      return;
    }
    acting.current = true;
    const { state, event: ev } = result;
    eventId.current += 1;
    setEvent({ id: eventId.current, data: ev });
    setBattle(state);
    setPending(null);
    setBusy(true);
    const parts = ev.hits.map((h) => `${nameOf(h.targetId)} ${hitText(h)}${h.crit ? '!' : ''}`);
    setLog((l) => [[nameOf(ev.actorId), ev.label, ...parts].join(' · '), ...l].slice(0, 30));
    if (ev.kind === 'special' || ev.kind === 'combo') sfx(ev.hits.every((h) => h.kind !== 'damage') ? 'heal' : 'special');
    else if (ev.hits.some((h) => h.crit)) sfx('crit');
    else if (ev.hits.some((h) => h.kind === 'damage')) sfx('hit');
    setTimeout(() => {
      acting.current = false;
      setBusy(false);
    }, step);
  };

  // Enemy turns and Auto mode play themselves one action at a time.
  useEffect(() => {
    if (busy || battle.result !== 'ongoing') return;
    if (battle.turn === 'enemy' || auto) {
      const id = setTimeout(() => act(chooseAction(battle)), 250 / speed);
      return () => clearTimeout(id);
    }
  });

  // Pay out once when the battle ends, and decide whether an auto run continues.
  useEffect(() => {
    if (battle.result === 'ongoing' || rewarded.current) return;
    // Survival waves roll on in their own effect below.
    if (mode === 'survival' && battle.result === 'won') return;
    rewarded.current = true;
    sfx(battle.result === 'won' ? 'win' : 'lose');
    if (mode === 'boss') {
      const left = battle.fighters.find((f) => f.side === 'enemy')?.hp ?? 0;
      const dealt = Math.max(0, bossStart - left);
      update((s) => recordBossAttempt(s, dealt));
      setBossDamage(dealt);
      return;
    }
    if (mode === 'survival') {
      update((s) => finishSurvival(s, wave - 1));
      setSurvivalDone(wave - 1);
      return;
    }
    if (battle.result === 'lost') {
      if (run.mode !== 'single') setRunAfter({ run, stop: 'Your team was defeated.' });
      return;
    }
    const boss = stage.kind !== 'normal';
    const flawless = battle.fighters.every((f) => f.side !== 'player' || f.hp > 0);
    if (towerFloor) {
      const firstClear = towerFloor === save.towerFloor + 1;
      const r = towerRewards(towerFloor);
      update((s) => recordWin(applyTowerWin(s, towerFloor), { firstClear: false, boss, flawless }));
      setRewards(firstClear ? { firstClear, coins: r.coins, gems: r.gems, spins: r.spins } : { firstClear, coins: 0, gems: 0, spins: 0 });
      return;
    }
    const earned = rewardsFor(save, stageNumber);
    update((s) => recordWin(applyRewards(s, stageNumber, earned), { firstClear: earned.firstClear, boss, flawless }));
    setRewards(earned);
    if (run.mode === 'single') return;
    const total: Run = {
      ...run,
      wins: run.wins + 1,
      coins: run.coins + earned.coins,
      gems: run.gems + earned.gems,
      spins: run.spins + earned.spins,
    };
    const decision = nextInRun(total, stageNumber);
    setRunAfter('next' in decision ? { run: total, next: decision.next } : { run: total, stop: decision.stop });
  }, [battle.result, battle.fighters, save, stage.kind, stageNumber, towerFloor, update, run, mode, bossStart, wave]);

  // Survival: after a cleared wave, the next one starts with the same fighters and no healing.
  useEffect(() => {
    if (mode !== 'survival' || battle.result !== 'won') return;
    const id = setTimeout(() => {
      setWave(wave + 1);
      setBattle((b) => nextWave(b, squad, wave + 1, { bonusFor: (u) => unitBonus(save, u) }));
    }, 900);
    return () => clearTimeout(id);
    // Only the result and wave should restart this timer.
  }, [mode, battle.result, wave]);

  // Auto runs roll into the next battle after a short pause.
  useEffect(() => {
    if (runAfter?.next === undefined) return;
    const id = setTimeout(() => onContinue(runAfter.next!, runAfter.run), 900 / speed);
    return () => clearTimeout(id);
  }, [runAfter, onContinue, speed]);

  const choose = (kind: ActionKind) => {
    if (!actor || !playerControls) return;
    if (targetsFor(battle, actor, kind)) setPending(kind);
    else act({ kind });
  };

  const targetIds = new Set(pending && actor ? (targetsFor(battle, actor, pending) ?? []).map((f) => f.id) : []);
  const aimingAtEnemies = pending !== null && [...targetIds].some((id) => id.startsWith('e-'));

  const clickFighter = (f: Fighter) => {
    if (!pending || !playerControls || !targetIds.has(f.id)) return;
    act({ kind: pending, targetId: f.id });
  };

  const cycleSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed as 1) + 1) % SPEEDS.length];
    setSpeed(next);
    try {
      localStorage.setItem(SPEED_KEY, String(next));
    } catch {
      // Speed just won't be remembered.
    }
  };

  const fighterClasses = (f: Fighter) => {
    const ev = event?.data;
    const classes = ['unit', f.side];
    if (f.hp <= 0) classes.push('ko');
    if (actor?.id === f.id && battle.result === 'ongoing') classes.push('active');
    if (targetIds.has(f.id)) classes.push('targetable');
    if (aimingAtEnemies && f.side === 'enemy' && f.hp > 0 && !targetIds.has(f.id)) classes.push('shielded');
    if (busy && ev?.actorId === f.id) classes.push(`do-${ev.kind}`);
    if (busy && ev?.hits.some((h) => h.targetId === f.id && h.kind === 'damage')) classes.push('hit');
    if (f.guarding) classes.push('guarding');
    if (f.stunned) classes.push('stunned');
    if (f.rank !== 'minion') classes.push(f.rank);
    return classes.join(' ');
  };

  // Turn order: who is still to move this turn, then the other side by speed.
  const queue = useMemo(() => {
    if (battle.result !== 'ongoing') return [];
    const bySpeed = (a: Fighter, b: Fighter) => b.spd - a.spd;
    const now = living(battle, battle.turn)
      .filter((f) => !battle.acted.includes(f.id))
      .sort(bySpeed);
    const later = living(battle, battle.turn === 'player' ? 'enemy' : 'player').sort(bySpeed);
    return [...now, ...later].slice(0, 7);
  }, [battle]);

  const special = actor ? specialOf(actor) : null;
  const specialBlocked = actor && specialReady(actor) && !canUse(battle, actor, 'special') ? 'No fallen ally' : null;
  const team = battle.fighters.filter((f) => f.side === 'player').sort((a, b) => a.slot - b.slot);
  const showControls = battle.result === 'ongoing' && battle.turn === 'player' && actor !== null && !auto;

  return (
    <div className="battle">
      <div className="battle-top">
        <div className="turn-queue" aria-label="Turn order">
          {queue.map((f, i) => (
            <span key={f.id} className={`queue-slot ${f.side} ${i === 0 ? 'now' : ''}`}>
              {i === 0 && <b>NEXT</b>}
              <Portrait familyId={f.familyId} star={f.star} size={30} flip={f.side === 'player'} />
            </span>
          ))}
        </div>
        <div className="battle-title">
          {mode === 'survival' ? `Survival · Wave ${wave}` : (stage.label ?? `Stage ${stage.number}`)}
          {run.mode !== 'single' && (
            <span className="run-chip">
              {run.mode === 'farm' ? 'AUTO-FARM' : 'AUTO-PROGRESS'} · {run.wins} won
            </span>
          )}
          <small>
            Round {battle.round} · {arena.name}
            {battle.weather !== 'clear' && ` · ${WEATHER_TEXT[battle.weather]}`}
          </small>
        </div>
      </div>

      <div className={`field ${busy && (event?.data.kind === 'special' || event?.data.kind === 'combo') ? 'special-impact' : ''}`}><WorldScene arena={arena} />
        <WeatherLayer weather={battle.weather} />
        {battle.fighters.map((f) => (
          <button
            key={f.id}
            className={fighterClasses(f)}
            style={fieldPosition(f)}
            onClick={() => clickFighter(f)}
            disabled={!targetIds.has(f.id)}
            aria-label={`${f.name}, ${f.hp} of ${f.maxHp} HP`}
          >
            {busy &&
              event?.data.hits
                .filter((h) => h.targetId === f.id)
                .map((h, i) => (
                  <span key={`${event.id}-${i}`} className={`float ${h.kind} ${h.crit ? 'crit' : ''}`}>
                    {hitText(h)}
                  </span>
                ))}
            {busy && event?.data.actorId === f.id && (event.data.kind === 'kiBlast' || event.data.kind === 'special' || event.data.kind === 'combo') && (
              <AttackEffect key={`fx-${event.id}`} familyId={f.familyId} side={f.side} special={event.data.kind === 'special' || event.data.kind === 'combo'} support={event.data.kind === 'special' && ['heal','revive','shield','rally'].includes(specialOf(f).kind)} duration={step} />
            )}
            <span className="unit-hp">
              <i style={{ width: `${(f.hp / f.maxHp) * 100}%` }} />
              {f.shield > 0 && <i className="shield-bar" style={{ width: `${Math.min(100, (f.shield / f.maxHp) * 100)}%` }} />}
            </span>
            {f.rank !== 'minion' && <span className="rank-tag">{f.rank === 'boss' ? 'BOSS' : 'MINI-BOSS'}</span>}
            {busy && event?.data.hits.some(h => h.targetId === f.id && h.kind === 'damage') && <span key={`impact-${event.id}`} className="impact-burst" aria-hidden="true" />}
            {busy && event?.data.actorId === f.id && event.data.kind === 'charge' && <span className="charge-aura" aria-hidden="true" />}
            <span className="unit-shadow" aria-hidden="true" />
            <Sprite familyId={f.familyId} star={f.star} size={f.rank === 'boss' ? 112 : 88} flip={f.side === 'player'} />
            <span className="unit-tags">
              {f.role === 'Tank' && f.row === 'front' && f.hp > 0 && <span className="status taunt">TAUNT</span>}
              {actor && aimingAtEnemies && targetIds.has(f.id) && classEdge(actor.role, f.role) !== 'neutral' && (
                <span className={`status edge-${classEdge(actor.role, f.role)}`}>
                  {classEdge(actor.role, f.role) === 'strong' ? '▲ STRONG' : '▼ WEAK'}
                </span>
              )}
              {f.stunned && <span className="status stun">STUN</span>}
              {f.rallyTurns > 0 && <span className="status rally">ATK↑</span>}
            </span>
          </button>
        ))}
        <div className="turn-banner">
          {battle.result === 'ongoing' ? (battle.turn === 'player' ? 'YOUR TURN' : 'ENEMY TURN') : ''}
        </div>
      </div>

      <div className="command-panel">
        <div className="command-head">
          {showControls && actor ? (
            <>
              <b>{actor.name}</b>
              {pending
                ? ` — pick a target${aimingAtEnemies ? ' (the front row shields the back row)' : ''}`
                : ` · Ki ${actor.ki}/${KI_MAX}`}
            </>
          ) : battle.result === 'ongoing' ? (
            auto ? 'Auto battle…' : 'Enemy is moving…'
          ) : (
            ''
          )}
        </div>
        <div className="command-grid">
          <button className="cmd attack" disabled={!showControls || !playerControls} onClick={() => choose('attack')}>
            <span className="cmd-icon"><PixelIcon kind="attack" size={26} /></span>Attack
          </button>
          <button
            className="cmd blast"
            disabled={!showControls || !playerControls || !actor || !canUse(battle, actor, 'kiBlast')}
            onClick={() => choose('kiBlast')}
          >
            <span className="cmd-icon"><PixelIcon kind="spin" size={26} /></span>Ki Blast<small>{KI_BLAST_COST} Ki</small>
          </button>
          <button
            className={`cmd special ${showControls && actor && canUse(battle, actor, 'special') ? 'ready' : ''}`}
            disabled={!showControls || !playerControls || !actor || !canUse(battle, actor, 'special')}
            onClick={() => choose('special')}
            title={special ? describeSpecial(special) : undefined}
          >
            <span className="cmd-icon"><PixelIcon kind="spin" size={26} /></span>
            {special?.name ?? 'Special'}
            <small>
              {actor && special
                ? actor.specialSpent
                  ? 'USED'
                  : (specialBlocked ?? (specialReady(actor) ? 'READY' : `${actor.charge}/${specialNeed(actor)}`))
                : ''}
            </small>
          </button>
          {showControls && actor && comboFor(battle, actor) && (
            <button className="cmd combo ready" disabled={!playerControls} onClick={() => choose('combo')}>
              <span className="cmd-icon">★★</span>
              {comboFor(battle, actor)!.combo.name}
              <small>with {comboFor(battle, actor)!.partner.name}</small>
            </button>
          )}
          <button className="cmd charge" disabled={!showControls || !playerControls} onClick={() => choose('charge')}>
            <span className="cmd-icon"><PixelIcon kind="charge" size={26} /></span>Charge<small>+Ki</small>
          </button>
          <button className="cmd guard" disabled={!showControls || !playerControls} onClick={() => choose('guard')}>
            <span className="cmd-icon"><PixelIcon kind="guard" size={26} /></span>Guard
          </button>
          {pending ? (
            <button className="cmd cancel" onClick={() => setPending(null)}>
              <span className="cmd-icon">✕</span>Cancel
            </button>
          ) : (
            <button className="cmd retreat" onClick={onExit} disabled={battle.result === 'won' && !rewards}>
              <span className="cmd-icon">⤺</span>
              {battle.result === 'ongoing' ? 'Retreat' : 'Leave'}
            </button>
          )}
          <button className={`cmd auto ${auto ? 'on' : ''}`} onClick={() => setAuto((a) => !a)}>
            <span className="cmd-icon">»</span>Auto<small>{auto ? 'ON' : 'OFF'}</small>
          </button>
          <button className="cmd speed" onClick={cycleSpeed}>
            <span className="cmd-icon">⏩</span>Speed<small>{speed}×</small>
          </button>
        </div>
        {showControls && special && <div className="special-hint">{describeSpecial(special)}</div>}

        <div className="team-status">
          {team.map((f) => (
            <button
              key={f.id}
              className={`status-card ${actor?.id === f.id ? 'active' : ''} ${f.hp <= 0 ? 'ko' : ''} ${targetIds.has(f.id) ? 'targetable' : ''}`}
              onClick={() => clickFighter(f)}
              disabled={!targetIds.has(f.id)}
            >
              <Portrait familyId={f.familyId} star={f.star} size={40} flip />
              <span className="sc-body">
                <span className="sc-name">
                  {f.name} <Stars star={f.star} />
                </span>
                <span className="sc-row hp">
                  <span>HP</span>
                  <b>{f.hp.toLocaleString()}</b>
                </span>
                <span className="sc-bar hp">
                  <i style={{ width: `${(f.hp / f.maxHp) * 100}%` }} />
                </span>
                <span className="sc-row ki">
                  <span>Ki</span>
                  <b>{f.ki}</b>
                  <ChargePips fighter={f} />
                </span>
                {f.shield > 0 && <span className="sc-shield">Shield {f.shield.toLocaleString()}</span>}
              </span>
            </button>
          ))}
        </div>
      </div>

      <ol className="battle-log">
        {log.map((line, i) => (
          <li key={log.length - i}>{line}</li>
        ))}
      </ol>

      {runAfter?.next !== undefined && (
        <div className="run-toast">
          Win {runAfter.run.wins} · ● {runAfter.run.coins.toLocaleString()} total · next battle…
          <button className="btn small" onClick={onExit}>
            Stop
          </button>
        </div>
      )}

      {mode === 'survival' && battle.result === 'won' && (
        <div className="run-toast">Wave {wave} cleared! Next wave coming, no healing…</div>
      )}

      {battle.result !== 'ongoing' && runAfter?.next === undefined && !(mode === 'survival' && battle.result === 'won') && (
        <div className="modal-backdrop">
          <div className="modal panel result">
            <h2>
              {mode === 'boss'
                ? battle.result === 'won'
                  ? 'BOSS DOWN!'
                  : 'ATTEMPT OVER'
                : mode === 'survival'
                  ? 'RUN OVER'
                  : battle.result === 'won'
                    ? 'VICTORY'
                    : 'DEFEAT'}
            </h2>
            {bossDamage !== null && (
              <p className="boss-damage">
                You dealt <b>{bossDamage.toLocaleString()}</b> damage to the world boss
                {battle.result === 'timeout' ? ` before time ran out (${stage.roundLimit} rounds)` : ''}.
              </p>
            )}
            {survivalDone !== null && (
              <p className="boss-damage">
                Waves cleared: <b>{survivalDone}</b> · ● {survivalCoins(survivalDone).toLocaleString()}
                {Math.floor(survivalDone / 5) > 0 && ` · ✦ ${Math.floor(survivalDone / 5)}`}
                {survivalDone > 0 && survivalDone >= save.survivalBest && ' · new best!'}
              </p>
            )}
            {battle.result === 'won' && !towerFloor && stageNumber === FINAL_STAGE && rewards?.firstClear && (
              <div className="the-end">
                <b>THE END</b>
                <p>Kael falls and the Vision Gate opens. You have conquered Dragon Vision!</p>
                <p className="muted">Keep growing your fighters in the City, or climb the Rival Tower.</p>
              </div>
            )}
            {battle.result === 'won' && towerFloor && towerRewards(towerFloor).shardStar && rewards?.firstClear && (
              <p className="shard-chip"><PixelIcon kind="shard" /> {towerRewards(towerFloor).shardStar}★ evolution shard</p>
            )}
            {battle.result === 'won' && towerFloor && rewards && !rewards.firstClear && (
              <p className="muted">Floor already cleared: no rewards this time.</p>
            )}
            {battle.result === 'won' && rewards ? (
              <ul className="reward-list">
                <li><PixelIcon kind="coin" /> {rewards.coins.toLocaleString()} coins</li>
                {rewards.spins > 0 && <li><PixelIcon kind="orb" /> {orbs(rewards.spins)}</li>}
                {rewards.gems > 0 && <li><PixelIcon kind="gem" /> {rewards.gems} gem{rewards.gems === 1 ? '' : 's'}</li>}
                {rewards.piece && (
                  <li className="reward-piece">
                    <ItemIcon icon="piece" size={40} /> Legendary piece: {getFamily(rewards.piece).name} ({save.pieces[rewards.piece] ?? 0}/{PIECES_TO_FORGE})
                  </li>
                )}
                {rewards.gear && (
                  <li className="reward-gear">
                    <GearCard item={rewards.gear} />
                  </li>
                )}
                {!rewards.firstClear && !towerFloor && <li className="muted">Replay reward (25% coins)</li>}
              </ul>
            ) : (
              <p className="muted">Level up your fighters or replay earlier stages for coins.</p>
            )}
            {runAfter && (
              <div className="run-summary">
                <b>{run.mode === 'farm' ? 'Auto-Farm' : 'Auto-Progress'} stopped.</b> {runAfter.stop}
                <div>
                  {runAfter.run.wins} win{runAfter.run.wins === 1 ? '' : 's'} · ● {runAfter.run.coins.toLocaleString()}
                  {runAfter.run.spins > 0 && ` · ${orbs(runAfter.run.spins)}`}
                  {runAfter.run.gems > 0 && ` · ◆ ${runAfter.run.gems}`}
                </div>
              </div>
            )}
            <button className="btn primary" onClick={onExit}>
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Special bar: one pip per move needed; full pips glow when the special is ready. */
function ChargePips({ fighter }: { fighter: Fighter }) {
  const need = specialNeed(fighter);
  if (fighter.specialSpent) return <span className="pips used">USED</span>;
  return (
    <span className={`pips ${specialReady(fighter) ? 'ready' : ''}`} aria-label={`Special ${fighter.charge} of ${need}`}>
      {Array.from({ length: need }, (_, i) => (
        <i key={i} className={i < fighter.charge ? 'on' : ''} />
      ))}
    </span>
  );
}
