export type RunTimer = {
  startedAtMs: number;
  /**
   * Total accumulated paused time in ms (not including the currently paused interval).
   */
  totalPausedMs: number;
  /**
   * If paused, the timestamp at which the pause began.
   */
  pausedAtMs: number | null;
};

export function createRunTimer(nowMs: number): RunTimer {
  return { startedAtMs: nowMs, totalPausedMs: 0, pausedAtMs: null };
}

export function pauseRunTimer(timer: RunTimer, nowMs: number): RunTimer {
  if (timer.pausedAtMs != null) return timer;
  return { ...timer, pausedAtMs: nowMs };
}

export function resumeRunTimer(timer: RunTimer, nowMs: number): RunTimer {
  if (timer.pausedAtMs == null) return timer;
  const delta = Math.max(0, nowMs - timer.pausedAtMs);
  return { ...timer, pausedAtMs: null, totalPausedMs: timer.totalPausedMs + delta };
}

export function getRunTimerElapsedMs(timer: RunTimer, nowMs: number): number {
  const base = Math.max(0, nowMs - timer.startedAtMs);
  const currentlyPaused = timer.pausedAtMs == null ? 0 : Math.max(0, nowMs - timer.pausedAtMs);
  const paused = Math.max(0, timer.totalPausedMs + currentlyPaused);
  return Math.max(0, base - paused);
}


