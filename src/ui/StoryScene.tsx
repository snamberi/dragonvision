import { useState } from 'react';
import { getFamily } from '../game/roster';
import type { Line } from '../game/story';
import { Portrait } from './Sprite';

/** Dialogue box with portraits; tap to advance, or skip. */
export function StoryScene({ title, lines, onDone }: { title: string; lines: Line[]; onDone: () => void }) {
  const [i, setI] = useState(0);
  const line = lines[i];
  const next = () => (i + 1 < lines.length ? setI(i + 1) : onDone());
  return (
    <div className="modal-backdrop story" role="dialog" aria-modal="true" onClick={next}>
      <div className="story-box panel" onClick={(e) => e.stopPropagation()}>
        <div className="eyebrow">{title}</div>
        <div className="story-line">
          <Portrait familyId={line.who} star={3} size={72} />
          <div>
            <b>{getFamily(line.who).name}</b>
            <p>{line.text}</p>
          </div>
        </div>
        <div className="button-row">
          <button className="btn ghost small" onClick={onDone}>
            Skip
          </button>
          <button className="btn primary" onClick={next}>
            {i + 1 < lines.length ? 'Next' : 'Fight!'}
          </button>
        </div>
      </div>
    </div>
  );
}
