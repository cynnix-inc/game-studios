import { computeSlotSyncAction, extractClientUpdatedAtMs } from '../cloudSaveSync';

describe('extractClientUpdatedAtMs', () => {
  it('returns clientUpdatedAtMs when present', () => {
    expect(extractClientUpdatedAtMs({ clientUpdatedAtMs: 1234 })).toEqual(1234);
  });

  it('returns null when missing', () => {
    expect(extractClientUpdatedAtMs({})).toEqual(null);
  });
});

describe('computeSlotSyncAction', () => {
  it('pushes when local is newer (via data.clientUpdatedAtMs)', () => {
    expect(
      computeSlotSyncAction({
        local: { gameKey: 'sudoku', slot: 'main', updatedAtMs: 1, data: { clientUpdatedAtMs: 2000 } },
        cloud: { game_key: 'sudoku', slot: 'main', updated_at: new Date(0).toISOString(), data: { clientUpdatedAtMs: 1000 } },
      }),
    ).toEqual('push');
  });

  it('pulls when cloud is newer (fallback to updated_at)', () => {
    expect(
      computeSlotSyncAction({
        local: { gameKey: 'sudoku', slot: 'main', updatedAtMs: 1000, data: {} },
        cloud: { game_key: 'sudoku', slot: 'main', updated_at: new Date(2000).toISOString(), data: {} },
      }),
    ).toEqual('pull');
  });
});


