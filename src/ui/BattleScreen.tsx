import { useEffect, useMemo, useRef, useState } from 'react';
import { KI_BLAST_COST, KI_MAX, SPECIAL_COST } from '../game/balance';
import {
  type Action,
  type ActionEvent,
  type ActionKind,
  type BattleState,
  type Fighter,
  canUse,
  chooseAction,
  createBattle,
  legalTargets,
  needsTarget,
  nextActor,
  performAction,
} from '../game/battle';
import { teamSlots } from '../game/progression';
import { getFamily } from '../game/roster';
import { type Rewards, applyRewards, getStage, rewardsFor } from '../game/stages';
import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { Sprite, Stars } from './Sprite';

interface Props {
  save: SaveData;
  stageNumber: number;
  update: Updater;
  onExit: () => void;
}

const STEP_MS = 650;

export function BattleScreen({ save, stageNumber, update, onExit }: Props) {
  const stage = useMemo(() => getStage(stageNumber), [stageNumber]);
  const [battle, setBattle] = useState<BattleState>(() => createBattle(teamSlots(save), stage));
  const [event, setEvent] = useState<{ id: number; data: ActionEvent } | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<ActionKind | null>(null);
  const [auto, setAuto] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [rewards, setRewards] = useState<Rewards | null>(null);
  const eventId = useRef(0);
  // Blocks a second action from a fast double tap before React re-renders.
  const acting = useRef(false);
  const rewarded = useRef(false);

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
    const targets = ev.hits.filter((h) => !h.heal).map((h) => `${nameOf(h.targetId)} -${h.amount}${h.crit ? '!' : ''}`);
    const heals = ev.hits.filter((h) => h.heal).map((h) => `${nameOf(h.targetId)} +${h.amount}`);
    setLog((l) => [[nameOf(ev.actorId), ev.label, ...targets, ...heals].join(' · '), ...l].slice(0, 30));
    setTimeout(() => {
      acting.current = false;
      setBusy(false);
    }, STEP_MS);
  };

  // Enemy turns and Auto mode play themselves one action at a time.
  useEffect(() => {
    if (busy || battle.result !== 'ongoing') return;
    if (battle.turn === 'enemy' || auto) {
      const id = setTimeout(() => act(chooseAction(battle)), 250);
      return () => clearTimeout(id);
    }
  });

  // Pay out once when the battle is won.
  useEffect(() => {
    if (battle.result !== 'won' || rewarded.current) return;
    rewarded.current = true;
    const earned = rewardsFor(save, stageNumber);
    update((s) => applyRewards(s, stageNumber, earned));
    setRewards(earned);
  }, [battle.result, save, stageNumber, update]);

  const choose = (kind: ActionKind) => {
    if (!actor || !playerControls) return;
    if (needsTarget(actor, kind)) setPending(kind);
    else act({ kind });
  };

  const legal = new Set(legalTargets(battle, 'player').map((f) => f.id));

  const clickFighter = (f: Fighter) => {
    if (!pending || !playerControls || !legal.has(f.id)) return;
    act({ kind: pending, targetId: f.id });
  };

  const fighterClasses = (f: Fighter) => {
    const ev = event?.data;
    const classes = ['fighter', f.side];
    if (f.hp <= 0) classes.push('ko');
    if (actor?.id === f.id && battle.result === 'ongoing') classes.push('active');
    if (pending && legal.has(f.id)) classes.push('targetable');
    if (pending && f.side === 'enemy' && f.hp > 0 && !legal.has(f.id)) classes.push('shielded');
    if (f.row === 'back') classes.push('back-row');
    if (busy && ev?.actorId === f.id) classes.push(`do-${ev.kind}`);
    if (busy && ev?.hits.some((h) => h.targetId === f.id && !h.heal)) classes.push('hit');
    if (f.guarding) classes.push('guarding');
    if (f.rank !== 'minion') classes.push(f.rank);
    return classes.join(' ');
  };

  const renderRow = (side: 'player' | 'enemy', row: 'front' | 'back') => (
    <div className={`side side-${side} row-${row}`}>
      {battle.fighters
        .filter((f) => f.side === side && f.row === row)
        .sort((a, b) => a.slot - b.slot)
        .map((f) => (
          <button key={f.id} className={fighterClasses(f)} onClick={() => clickFighter(f)} disabled={f.side === 'player'}>
            {busy &&
              event?.data.hits
                .filter((h) => h.targetId === f.id)
                .map((h, i) => (
                  <span key={`${event.id}-${i}`} className={`float ${h.heal ? 'heal' : ''} ${h.crit ? 'crit' : ''}`}>
                    {h.heal ? '+' : '-'}
                    {h.amount.toLocaleString()}
                  </span>
                ))}
            {busy && event?.data.actorId === f.id && (event.data.kind === 'kiBlast' || event.data.kind === 'special') && (
              <span key={`fx-${event.id}`} className={`beam ${side}`} />
            )}
            {f.rank !== 'minion' && <span className="rank-tag">{f.rank === 'boss' ? 'BOSS' : 'MINI-BOSS'}</span>}
            {f.role === 'Tank' && f.row === 'front' && f.hp > 0 && <span className="taunt-tag">TAUNT</span>}
            <Sprite familyId={f.familyId} star={f.star} size={72} flip={side === 'enemy'} />
            <span className="f-name">{f.name}</span>
            <span className="f-meta">
              Lv {f.level} <Stars star={f.star} />
            </span>
            <span className="bar hp">
              <i style={{ width: `${(f.hp / f.maxHp) * 100}%` }} />
            </span>
            <span className="bar ki">
              <i style={{ width: `${(f.ki / KI_MAX) * 100}%` }} />
            </span>
          </button>
        ))}
    </div>
  );

  const special = actor ? getFamily(actor.familyId).special : null;

  return (
    <div className="battle">
      <div className="battle-top">
        <button className="btn ghost small" onClick={onExit} disabled={battle.result === 'won' && !rewards}>
          {battle.result === 'ongoing' ? 'Retreat' : 'Leave'}
        </button>
        <div className="battle-title">
          Stage {stage.number} · Round {battle.round}
        </div>
        <button className={`btn small ${auto ? 'primary' : ''}`} onClick={() => setAuto((a) => !a)}>
          Auto {auto ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="arena">
        {renderRow('enemy', 'back')}
        {renderRow('enemy', 'front')}
        <div className="turn-banner">{battle.result === 'ongoing' ? (battle.turn === 'player' ? 'YOUR TURN' : 'ENEMY TURN') : ''}</div>
        {renderRow('player', 'front')}
        {renderRow('player', 'back')}
      </div>

      {battle.result === 'ongoing' && (
        <div className="action-bar">
          {battle.turn === 'player' && actor && !auto ? (
            <>
              <div className="action-who">
                {pending ? `${actor.name}: pick a target — the front row shields the back row` : `${actor.name}'s move`} · Ki{' '}
                {actor.ki}
              </div>
              <div className="button-row">
                <button className="btn" disabled={!playerControls} onClick={() => choose('attack')}>
                  Attack
                </button>
                <button className="btn" disabled={!playerControls || !canUse(actor, 'kiBlast')} onClick={() => choose('kiBlast')}>
                  Ki Blast <small>{KI_BLAST_COST}</small>
                </button>
                <button
                  className="btn special"
                  disabled={!playerControls || !canUse(actor, 'special')}
                  onClick={() => choose('special')}
                >
                  {special?.name} <small>{SPECIAL_COST}</small>
                </button>
                <button className="btn" disabled={!playerControls} onClick={() => choose('charge')}>
                  Charge
                </button>
                <button className="btn" disabled={!playerControls} onClick={() => choose('guard')}>
                  Guard
                </button>
                {pending && (
                  <button className="btn ghost" onClick={() => setPending(null)}>
                    Cancel
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="action-who">{auto ? 'Auto battle…' : 'Enemy is moving…'}</div>
          )}
        </div>
      )}

      <ol className="battle-log">
        {log.map((line, i) => (
          <li key={log.length - i}>{line}</li>
        ))}
      </ol>

      {battle.result !== 'ongoing' && (
        <div className="modal-backdrop">
          <div className="modal panel result">
            <h2>{battle.result === 'won' ? 'VICTORY' : 'DEFEAT'}</h2>
            {battle.result === 'won' && rewards ? (
              <ul className="reward-list">
                <li>● {rewards.coins.toLocaleString()} coins</li>
                {rewards.spins > 0 && <li>✦ {rewards.spins} summon spin{rewards.spins === 1 ? '' : 's'}</li>}
                {rewards.gems > 0 && <li>◆ {rewards.gems} gem{rewards.gems === 1 ? '' : 's'}</li>}
                {!rewards.firstClear && <li className="muted">Replay reward (25% coins)</li>}
              </ul>
            ) : (
              <p className="muted">Level up your fighters or replay earlier stages for coins.</p>
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
