/** "1 Spin Orb", "5 Spin Orbs". */
export function orbs(n: number): string {
  return `${n} Spin Orb${n === 1 ? '' : 's'}`;
}
