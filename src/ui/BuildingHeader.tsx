import type { ReactNode } from 'react';

/** Back button and title panel shared by every City building. */
export function BuildingHeader({ title, onBack, children }: { title: string; onBack: () => void; children?: ReactNode }) {
  return (
    <>
      <button className="btn ghost" onClick={onBack}>
        ← City
      </button>
      <section className="panel">
        <div className="eyebrow">Vision City</div>
        <h2>{title}</h2>
        {children}
      </section>
    </>
  );
}
