/** Presentation only: damage and Ki costs remain in the battle resolver. */
export function basicMotion(family: string): 'teleport' | 'projectile' | 'rush' {
  if (['tobi','zeno','kael','nyxara','orzen','zephyra','sumi','quillon','asterion'].includes(family)) return 'teleport';
  if (['kairo','varek','mei','vorg','nyx','sora','lyra','solenne','aurel','grimm','morvain','vesper','kest','namiya','helion','noctelle','saffra'].includes(family)) return 'projectile';
  return 'rush';
}
