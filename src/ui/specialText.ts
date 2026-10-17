import type { Special } from '../game/types';

/** One-line player-facing description of a special. */
export function describeSpecial(special: Special): string {
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  switch (special.kind) {
    case 'beam':
      return `Huge hit on one enemy (${special.power}× damage).`;
    case 'wave':
      return `Hits every enemy (${special.power}× damage each).`;
    case 'heal':
      return `Heals every ally for ${pct(special.power)} of their max HP.`;
    case 'drain':
      return `Hits one enemy (${special.power}×) and heals from the damage.`;
    case 'revive':
      return `Revives one fallen ally at ${pct(special.power)} HP. Once per battle.`;
    case 'shield':
      return `Gives every ally a shield worth ${pct(special.power)} of their max HP.`;
    case 'stun':
      return `Hits one enemy (${special.power}×) and makes it skip its next turn. Bosses resist.`;
    case 'rally':
      return `Every ally deals ${pct(special.power)} more damage for 2 turns.`;
  }
}
