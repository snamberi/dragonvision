import { type Release, RELEASES } from '../content/changelog';
import { Modal } from './Modal';

/** `**bold**` only; the text is ours. */
const rich = (t: string) => t.split(/(\*\*[^*]+\*\*)/).map((part, i) => (part.startsWith('**') ? <b key={i}>{part.slice(2, -2)}</b> : part));

/** "What's new" after an update, or every update when opened from the top bar. */
export function WhatsNew({ releases = RELEASES, onClose }: { releases?: Release[]; onClose: () => void }) {
  return (
    <Modal title={releases === RELEASES ? 'Updates' : "What's new"} onClose={onClose} className="whats-new">
      {releases.map((r, i) => (
        <section key={r.id} className="release">
          <span className="eyebrow">Update {r.id}</span>
          {i === 0 ? <h3>{r.title}</h3> : <h4>{r.title}</h4>}
          <ul>
            {r.items.map((t) => (
              <li key={t}>{rich(t)}</li>
            ))}
          </ul>
        </section>
      ))}
      <div className="button-row">
        <button className="btn primary" onClick={onClose}>
          Let's play
        </button>
      </div>
    </Modal>
  );
}
