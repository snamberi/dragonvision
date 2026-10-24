import { TRAITS, wallRule } from './encounters';
import { BEATS, type Role } from './roster';
import type { Stage } from './stages';

/** How to play around each chapter trait and wall rule, keyed by effect id. */
const EFFECT_TIPS: Record<string, string> = {
  enraged: 'Hurt enemies hit harder, so finish targets off instead of spreading damage.',
  bulwark: 'Front-row enemies start shielded; hit-all specials strip shields fast.',
  swift: 'Enemies are quick and may act first; guard or shield early.',
  vampiric: 'Enemies heal off their hits; burst them down rather than trading blows.',
  volatile: 'Fallen enemies explode; keep your team’s HP topped up.',
  overclock: 'Enemy specials arrive early; guard on the first turn.',
  hellfire: 'Enemies hit 15% harder; a Tank up front helps.',
  nullfield: 'No healing here; bring damage instead of Supports.',
  voidChill: 'You start with no Ki; charge before you blast.',
  haste: 'Enemies are much faster; shields and guards buy time.',
  eclipse: 'Enemies crit more often; shields soak the spikes.',
  lastGate: 'The boss stands back up once; save a special for its second life.',
};

/** The class that beats `role` in the advantage cycle. */
export function counterOf(role: Role): Role {
  return (Object.keys(BEATS) as Role[]).find((r) => BEATS[r] === role)!;
}

/** One-line pre-fight hint from the team's classes against the stage's enemies and rules. */
export function preFightAdvice(teamRoles: Role[], stage: Stage): string {
  const enemy = stage.dominantRole;
  const counter = counterOf(enemy);
  const weak = BEATS[enemy];
  const parts: string[] = [];
  parts.push(
    teamRoles.includes(counter)
      ? `Your ${counter} has the edge on this chapter's ${enemy}s.`
      : `Bring a ${counter}: it beats the ${enemy}s here.`,
  );
  if (teamRoles.includes(weak)) parts.push(`Your ${weak}s take extra damage from them.`);
  const effect = wallRule(stage.number) ?? (stage.trait ? TRAITS[stage.trait] : undefined);
  const tip = effect && EFFECT_TIPS[effect.id];
  if (tip) parts.push(tip);
  return parts.join(' ');
}
