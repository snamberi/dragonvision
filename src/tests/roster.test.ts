import { describe, expect, it } from 'vitest';
import { paintFighter } from '../art/sprite';
import { FAMILIES } from '../game/roster';

describe('roster', () => {
  it('has 18 characters with unique ids and form names', () => {
    expect(FAMILIES).toHaveLength(18);
    expect(new Set(FAMILIES.map((f) => f.id)).size).toBe(FAMILIES.length);
    const names = FAMILIES.flatMap((f) => f.forms.map((form) => form.name));
    expect(new Set(names).size).toBe(names.length);
  });

  it('paints every form', () => {
    for (const family of FAMILIES) {
      for (const form of family.forms) {
        const filled = paintFighter(form.look).flat().filter(Boolean).length;
        expect(filled, form.name).toBeGreaterThan(150);
      }
    }
  });
});

describe('roles', () => {
  it('derives roles from specials and stats', async () => {
    const { getFamily, roleFor } = await import('../game/roster');
    expect(roleFor(getFamily('orrin'))).toBe('Support');
    expect(roleFor(getFamily('vorg'))).toBe('Drainer');
    expect(roleFor(getFamily('bruno'))).toBe('Tank');
    expect(roleFor(getFamily('tobi'))).toBe('Blaster');
    expect(roleFor(getFamily('kairo'))).toBe('Striker');
  });
});
