import { shouldAnimateParticles, type ReducedMotionSetting } from './reducedMotion';

describe('reducedMotion (portable decisions)', () => {
  it('disables non-essential particles animation when user prefers reduced motion', () => {
    expect(shouldAnimateParticles({ reducedMotion: true })).toBe(false);
  });

  it('enables particles animation when user has no reduced-motion preference', () => {
    expect(shouldAnimateParticles({ reducedMotion: false })).toBe(true);
  });

  it('treats missing value as no-preference (default)', () => {
    const reducedMotion: ReducedMotionSetting = null;
    expect(shouldAnimateParticles({ reducedMotion })).toBe(true);
  });
});


