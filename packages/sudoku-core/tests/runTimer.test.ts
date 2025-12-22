import { createRunTimer, getRunTimerElapsedMs, pauseRunTimer, resumeRunTimer } from '../src';

describe('run timer (pause-aware raw_time_ms)', () => {
  test('elapsed increases while running', () => {
    const t0 = 1_000;
    const timer = createRunTimer(t0);
    expect(getRunTimerElapsedMs(timer, t0)).toBe(0);
    expect(getRunTimerElapsedMs(timer, t0 + 123)).toBe(123);
  });

  test('elapsed excludes paused time (single pause interval)', () => {
    const t0 = 1_000;
    const t1 = 2_000;
    const t2 = 5_000;
    const t3 = 6_000;

    let timer = createRunTimer(t0);
    timer = pauseRunTimer(timer, t1);

    // While paused, elapsed does not increase.
    expect(getRunTimerElapsedMs(timer, t2)).toBe(t1 - t0);

    timer = resumeRunTimer(timer, t2);
    expect(getRunTimerElapsedMs(timer, t3)).toBe((t1 - t0) + (t3 - t2));
  });

  test('supports multiple pause/resume cycles', () => {
    const t0 = 0;
    let timer = createRunTimer(t0);

    // Run 100ms
    expect(getRunTimerElapsedMs(timer, 100)).toBe(100);

    // Pause for 900ms
    timer = pauseRunTimer(timer, 100);
    expect(getRunTimerElapsedMs(timer, 1_000)).toBe(100);
    timer = resumeRunTimer(timer, 1_000);

    // Run another 50ms
    expect(getRunTimerElapsedMs(timer, 1_050)).toBe(150);

    // Pause again
    timer = pauseRunTimer(timer, 1_050);
    expect(getRunTimerElapsedMs(timer, 2_050)).toBe(150);
    timer = resumeRunTimer(timer, 2_050);

    // Run another 25ms
    expect(getRunTimerElapsedMs(timer, 2_075)).toBe(175);
  });
});


