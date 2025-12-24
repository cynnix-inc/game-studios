import { formatElapsedSecondsMMSS } from './formatTime';

describe('formatElapsedSecondsMMSS', () => {
  it('formats 0 as 00:00', () => {
    expect(formatElapsedSecondsMMSS(0)).toBe('00:00');
  });

  it('pads minutes/seconds', () => {
    expect(formatElapsedSecondsMMSS(5)).toBe('00:05');
    expect(formatElapsedSecondsMMSS(65)).toBe('01:05');
  });

  it('handles large values', () => {
    expect(formatElapsedSecondsMMSS(60 * 60 + 7)).toBe('60:07');
  });

  it('clamps negative to 00:00', () => {
    expect(formatElapsedSecondsMMSS(-1)).toBe('00:00');
  });
});


