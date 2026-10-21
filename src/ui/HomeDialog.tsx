import { useEffect, useId, useRef, type ReactNode } from 'react';

/** Yard panels keep focus inside, restore it on close, and leave the landscape in view. */
export function HomeDialog({ title, eyebrow, onClose, children, className = '' }: {
  title: string; eyebrow: string; onClose: () => void; children: ReactNode; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const id = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.querySelector<HTMLButtonElement>('.home-dialog-close')?.focus();
    const keydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current(); }
      if (e.key !== 'Tab') return;
      const items = Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, select, a[href], [tabindex="0"]') ?? [])
        .filter(el => el.getClientRects().length > 0);
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', keydown);
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return <div className="home-dialog-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div ref={ref} className={`home-dialog ${className}`} role="dialog" aria-modal="true" aria-labelledby={id}>
      <header className="home-dialog-head"><div><span className="home-eyebrow">{eyebrow}</span><h2 id={id}>{title}</h2></div><button className="home-dialog-close" aria-label="Close" onClick={onClose}>×</button></header>
      {children}
    </div>
  </div>;
}
