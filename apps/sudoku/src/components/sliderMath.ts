export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function roundToStep(v: number, min: number, step: number): number {
  const n = Math.round((v - min) / step);
  const next = min + n * step;
  const places = step < 1 ? Math.min(6, String(step).split('.')[1]?.length ?? 0) : 0;
  return places > 0 ? Number(next.toFixed(places)) : next;
}

export function ratioFromValue(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
}

export function valueFromRatio(ratio: number, min: number, max: number, step: number): number {
  if (max <= min) return min;
  const raw = min + clamp(ratio, 0, 1) * (max - min);
  const stepped = roundToStep(raw, min, step);
  return clamp(stepped, min, max);
}

export function valueFromX(args: {
  x: number;
  trackWidth: number;
  min: number;
  max: number;
  step: number;
}): number | null {
  if (args.trackWidth <= 0) return null;
  const ratio = clamp(args.x / args.trackWidth, 0, 1);
  return valueFromRatio(ratio, args.min, args.max, args.step);
}

export function valueFromDragDx(args: {
  startValue: number;
  dx: number;
  trackWidth: number;
  min: number;
  max: number;
  step: number;
}): number | null {
  if (args.trackWidth <= 0) return null;
  const startRatio = ratioFromValue(args.startValue, args.min, args.max);
  const startX = startRatio * args.trackWidth;
  return valueFromX({
    x: startX + args.dx,
    trackWidth: args.trackWidth,
    min: args.min,
    max: args.max,
    step: args.step,
  });
}


