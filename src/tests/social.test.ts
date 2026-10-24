import { beforeEach, describe, expect, it } from 'vitest';
import { activeSocials, inviteMilestone, queueInvite, shouldInvite, takeInvite } from '../content/social';

describe('community links', () => {
  it('only shows links that have an address', () => {
    expect(activeSocials().map((l) => l.id)).toEqual(['discord', 'tiktok', 'instagram', 'youtube', 'reddit']);
    expect(activeSocials().every((l) => l.url?.startsWith('https://'))).toBe(true);
  });

  it('invites on first clears of walls and the first boss only', () => {
    expect(inviteMilestone(50, true)).toBe('wall-50');
    expect(inviteMilestone(10, true)).toBe('boss-10');
    expect(inviteMilestone(50, false)).toBeNull();
    expect(inviteMilestone(20, true)).toBeNull();
    expect(inviteMilestone(7, true)).toBeNull();
  });

  it('never repeats a milestone', () => {
    expect(shouldInvite('wall-50', [])).toBe(true);
    expect(shouldInvite('wall-50', ['wall-50'])).toBe(false);
    expect(shouldInvite(null, [])).toBe(false);
  });
});

describe('invite queue', () => {
  const store = new Map<string, string>();
  beforeEach(() => {
    store.clear();
    (globalThis as { localStorage?: Storage }).localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    } as Storage;
  });

  it('shows a queued milestone once', () => {
    queueInvite(100, true);
    expect(takeInvite()).toBe('wall-100');
    expect(takeInvite()).toBeNull();
    queueInvite(100, true);
    expect(takeInvite()).toBeNull();
  });
});
