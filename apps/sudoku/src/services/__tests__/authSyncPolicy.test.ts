import { decideMainSaveSyncAction } from '../authSyncPolicy';

describe('decideMainSaveSyncAction', () => {
  it('pushes when local is newer than cloud', () => {
    expect(
      decideMainSaveSyncAction({
        localUpdatedAtMs: 2000,
        cloudUpdatedAtMs: 1000,
      }),
    ).toEqual('push');
  });

  it('pulls when cloud is newer than local', () => {
    expect(
      decideMainSaveSyncAction({
        localUpdatedAtMs: 1000,
        cloudUpdatedAtMs: 2000,
      }),
    ).toEqual('pull');
  });

  it('noops when neither side exists', () => {
    expect(
      decideMainSaveSyncAction({
        localUpdatedAtMs: null,
        cloudUpdatedAtMs: null,
      }),
    ).toEqual('noop');
  });
});


