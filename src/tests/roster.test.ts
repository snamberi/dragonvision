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

  it('every special charges in 2 to 4 moves', () => {
    for (const family of FAMILIES) {
      expect(family.special.charge, family.id).toBeGreaterThanOrEqual(2);
      expect(family.special.charge, family.id).toBeLessThanOrEqual(4);
    }
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
    expect(roleFor(getFamily('aya'))).toBe('Blaster');
    expect(roleFor(getFamily('zeno'))).toBe('Support');
    expect(roleFor(getFamily('kenji'))).toBe('Support');
    expect(roleFor(getFamily('kairo'))).toBe('Assassin');
  });
});

describe('class loop', () => {
  it('every class beats exactly one and loses to exactly one', async () => {
    const { BEATS, classEdge } = await import('../game/roster');
    const roles = Object.keys(BEATS) as (keyof typeof BEATS)[];
    for (const r of roles) {
      expect(roles.filter((x) => BEATS[x] === r)).toHaveLength(1);
      expect(classEdge(r, BEATS[r])).toBe('strong');
      expect(classEdge(BEATS[r], r)).toBe('weak');
    }
    expect(classEdge('Tank', 'Assassin')).toBe('neutral');
  });
});
