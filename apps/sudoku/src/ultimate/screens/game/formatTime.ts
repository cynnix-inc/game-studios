export function formatElapsedSecondsMMSS(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  const pad2 = (n: number) => String(n).padStart(2, '0');
  return `${pad2(mins)}:${pad2(secs)}`;
}


