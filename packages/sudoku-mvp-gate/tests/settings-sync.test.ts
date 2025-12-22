import { isSudokuSettingsV1, mergeSettingsLww, type SudokuSettingsV1 } from '../../../apps/sudoku/src/services/settingsModel';

describe('Epic 6 settings sync plumbing', () => {
  test('mergeSettingsLww prefers the newer updatedAtMs', () => {
    const local: SudokuSettingsV1 = {
      schemaVersion: 1,
      kind: 'sudoku_settings',
      updatedAtMs: 100,
      updatedByDeviceId: 'a',
      extra: { theme: 'dark' },
    };
    const remote: SudokuSettingsV1 = {
      schemaVersion: 1,
      kind: 'sudoku_settings',
      updatedAtMs: 200,
      updatedByDeviceId: 'b',
      extra: { theme: 'light' },
    };
    expect(mergeSettingsLww(local, remote)).toEqual(remote);
  });

  test('mergeSettingsLww is deterministic when timestamps match (device id tiebreaker)', () => {
    const a: SudokuSettingsV1 = { schemaVersion: 1, kind: 'sudoku_settings', updatedAtMs: 123, updatedByDeviceId: 'aaa' };
    const b: SudokuSettingsV1 = { schemaVersion: 1, kind: 'sudoku_settings', updatedAtMs: 123, updatedByDeviceId: 'bbb' };
    expect(mergeSettingsLww(a, b)).toEqual(b);
  });

  test('isSudokuSettingsV1 validates minimal required shape', () => {
    expect(
      isSudokuSettingsV1({
        schemaVersion: 1,
        kind: 'sudoku_settings',
        updatedAtMs: 1,
        updatedByDeviceId: 'device-1',
      }),
    ).toBe(true);
    expect(isSudokuSettingsV1({})).toBe(false);
  });
});


