// `null` means “unknown / not yet loaded”; default behavior is to animate.
export type ReducedMotionSetting = boolean | null;

export function shouldAnimateParticles(args: { reducedMotion: ReducedMotionSetting }): boolean {
  if (args.reducedMotion === true) return false;
  return true;
}


