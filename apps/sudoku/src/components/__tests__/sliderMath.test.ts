import { ratioFromValue, valueFromDragDx, valueFromRatio, valueFromX } from '../sliderMath';

describe('sliderMath', () => {
  test('ratioFromValue clamps to [0,1]', () => {
    expect(ratioFromValue(0, 0, 100)).toBe(0);
    expect(ratioFromValue(100, 0, 100)).toBe(1);
    expect(ratioFromValue(-5, 0, 100)).toBe(0);
    expect(ratioFromValue(150, 0, 100)).toBe(1);
  });

  test('valueFromRatio respects step + clamps', () => {
    expect(valueFromRatio(0, 10, 20, 1)).toBe(10);
    expect(valueFromRatio(1, 10, 20, 1)).toBe(20);
    expect(valueFromRatio(0.51, 0, 10, 1)).toBe(5);

    // fractional step rounding
    expect(valueFromRatio(0.5, 1, 2, 0.1)).toBe(1.5);
  });

  test('valueFromX returns null when trackWidth<=0', () => {
    expect(valueFromX({ x: 10, trackWidth: 0, min: 0, max: 100, step: 1 })).toBeNull();
  });

  test('valueFromX clamps x outside the track', () => {
    expect(valueFromX({ x: -10, trackWidth: 100, min: 0, max: 100, step: 1 })).toBe(0);
    expect(valueFromX({ x: 200, trackWidth: 100, min: 0, max: 100, step: 1 })).toBe(100);
  });

  test('valueFromDragDx moves relative to the start value', () => {
    // startValue 50 => startX 50px, dx +10 => 60px => 60
    expect(valueFromDragDx({ startValue: 50, dx: 10, trackWidth: 100, min: 0, max: 100, step: 1 })).toBe(60);
    // dx -100 => clamps to 0
    expect(valueFromDragDx({ startValue: 50, dx: -100, trackWidth: 100, min: 0, max: 100, step: 1 })).toBe(0);
  });
});


