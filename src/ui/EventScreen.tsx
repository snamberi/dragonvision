import { type CSSProperties, useState } from 'react';
import { ARENAS, WEATHER_TEXT } from '../game/arenas';
import { EVENT_STAGES, currentEvent, eventProgress, eventStageUnlocked, eventTimeLeft, eventTokens, formatTimeLeft, introSceneKey, replayTokensLeft, EVENT_REPLAY_DAILY_CAP } from '../game/events';
import { buyEventOffer, eventOffers, offerLeft } from '../game/eventShop';
import { getFamily } from '../game/roster';
import { markScene, sceneSeen } from '../game/story';
import type { SaveData } from '../game/types';
import type { Updater } from './App';
import { BuildingHeader } from './BuildingHeader';
import { Sprite } from './Sprite';
import { StoryScene } from './StoryScene';
import { useActionFeedback } from './useActionFeedback';

interface Props {
  save: SaveData;
  update: Updater;
  onBack: () => void;
  onFight: (stage: number) => void;
}

type Scene = { title: string; key: string; then?: number } | null;

function stageButtonLabel(cleared: boolean, unlocked: boolean): string {
  if (cleared) return 'Replay';
  return unlocked ? 'Fight' : 'Locked';
}

export function EventScreen({ save, update: commit, onBack, onFight }: Props) {
  const { update, feedback } = useActionFeedback(commit);
  const ev = currentEvent();
  const progress = eventProgress(save);
  const arena = ARENAS[ev.arenaId];
  const introKey = introSceneKey(save);
  const finaleKey = `${introKey}-finale`;
  const [scene, setScene] = useState<Scene>(() =>
    progress.cleared >= EVENT_STAGES && !sceneSeen(save, finaleKey) ? { title: `${ev.name} · Finale`, key: finaleKey } : null,
  );

  const fight = (n: number) => {
    if (!sceneSeen(save, introKey)) setScene({ title: ev.name, key: introKey, then: n });
    else onFight(n);
  };

  const closeScene = () => {
    if (!scene) return;
    update((s) => markScene(s, scene.key));
    const next = scene.then;
    setScene(null);
    if (next !== undefined) onFight(next);
  };

  const heroStyle = { '--event-sky-top': arena?.skyTop, '--event-sky-bottom': arena?.skyBottom } as CSSProperties;

  return (
    <div className="event-screen">
      {feedback}
      <BuildingHeader title={ev.name} onBack={onBack}>
        <p className="muted">A limited chapter that changes every Monday. Clear its 10 stages for {ev.currency}, then spend them in the event shop before it closes.</p>
      </BuildingHeader>

      <section className="event-hero" style={heroStyle}>
        <div className="eyebrow">WEEKLY EVENT</div>
        <h2>{ev.name}</h2>
        <p>{ev.tagline}</p>
        <div className="event-meta">
          <span>Ends in <b>{formatTimeLeft(eventTimeLeft())}</b></span>
          <span>{ev.currency}: <b>{progress.currency}</b></span>
          <span>{arena?.name} · {WEATHER_TEXT[ev.weather]}</span>
          <span>Featured: <b>{getFamily(ev.featured).name}</b> (rate-up on the Summoning Shrine)</span>
        </div>
        <span className="event-featured" aria-hidden="true">
          <Sprite familyId={ev.featured} star={3} size={96} skinId={(save.ownedSkins ?? []).includes(ev.skinId) ? ev.skinId : undefined} />
        </span>
      </section>

      <section className="panel">
        <h3>Event chapter · {progress.cleared}/{EVENT_STAGES} cleared</h3>
        <p className="muted small-text">Replay {ev.currency} left today: {replayTokensLeft(save)}/{EVENT_REPLAY_DAILY_CAP}</p>
        <div className="event-stages">
          {Array.from({ length: EVENT_STAGES }, (_, i) => i + 1).map((n) => {
            const cleared = n <= progress.cleared;
            const unlocked = eventStageUnlocked(save, n);
            const boss = n === EVENT_STAGES;
            return (
              <div key={n} className={`event-stage ${cleared ? 'cleared' : ''} ${boss ? 'boss' : ''} ${unlocked ? '' : 'locked'}`}>
                <b>{boss ? `Stage ${n} · BOSS` : `Stage ${n}`}</b>
                <small>{cleared ? `Replay: +${eventTokens(n, false)}` : `First clear: +${eventTokens(n, true)}`} {ev.currency}</small>
                <button className={`btn ${cleared ? '' : 'primary'} small`} disabled={!unlocked} onClick={() => fight(n)}>
                  {stageButtonLabel(cleared, unlocked)}
                </button>
              </div>
            );
          })}
        </div>
        {progress.cleared >= EVENT_STAGES && (
          <button className="btn ghost small" onClick={() => setScene({ title: `${ev.name} · Finale`, key: finaleKey })}>Replay the finale</button>
        )}
      </section>

      <section className="panel">
        <h3>Event shop</h3>
        <p className="muted small-text">{ev.currency} and shop limits reset when the event ends. Skins you buy are yours to keep.</p>
        <div className="event-shop">
          {eventOffers(ev).map((offer) => {
            const left = offerLeft(save, offer);
            const afford = progress.currency >= offer.price;
            return (
              <div key={offer.id} className={`event-offer ${left === 0 ? 'sold-out' : ''}`}>
                <span>
                  {offer.label}
                  <small className="muted"> · {left === 0 ? 'sold out' : `${left} left`}</small>
                </span>
                <button
                  className="btn small"
                  disabled={left === 0 || !afford}
                  onClick={() =>
                    update((s) => buyEventOffer(s, offer.id).save, offer.good.kind === 'featured' ? `Summoned ${getFamily(ev.featured).name}!` : `Bought ${offer.label}`)
                  }
                >
                  <span className="event-price">{offer.price} {ev.currency}</span>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {scene && <StoryScene title={scene.title} lines={scene.key === finaleKey ? ev.finale : ev.intro} onDone={closeScene} />}
    </div>
  );
}
