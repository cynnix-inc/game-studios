import { solve } from '../src/engine/solver';

test('solve solves a known valid puzzle', () => {
  // 0 = empty
  const puzzle = [
    5, 3, 0, 0, 7, 0, 0, 0, 0,
    6, 0, 0, 1, 9, 5, 0, 0, 0,
    0, 9, 8, 0, 0, 0, 0, 6, 0,
    8, 0, 0, 0, 6, 0, 0, 0, 3,
    4, 0, 0, 8, 0, 3, 0, 0, 1,
    7, 0, 0, 0, 2, 0, 0, 0, 6,
    0, 6, 0, 0, 0, 0, 2, 8, 0,
    0, 0, 0, 4, 1, 9, 0, 0, 5,
    0, 0, 0, 0, 8, 0, 0, 7, 9,
  ];

  const res = solve(puzzle);
  expect(res.ok).toBe(true);
  if (!res.ok) return;
  expect(res.solution).toHaveLength(81);
  // Spot check a few known cells from the canonical solution
  expect(res.solution[0]).toBe(5);
  expect(res.solution[4]).toBe(7);
  expect(res.solution[80]).toBe(9);
});

test('solve returns invalid for contradictory puzzle', () => {
  const bad = Array.from({ length: 81 }, () => 0);
  bad[0] = 1;
  bad[1] = 1; // same row contradiction
  const res = solve(bad);
  expect(res.ok).toBe(false);
  if (res.ok) return;
  expect(res.reason).toBe('invalid');
});


