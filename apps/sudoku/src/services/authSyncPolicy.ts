export type MainSaveSyncAction = 'push' | 'pull' | 'noop';

export function decideMainSaveSyncAction(args: {
  localUpdatedAtMs: number | null;
  cloudUpdatedAtMs: number | null;
}): MainSaveSyncAction {
  const local = args.localUpdatedAtMs;
  const cloud = args.cloudUpdatedAtMs;

  if (local == null && cloud == null) return 'noop';
  if (local != null && cloud == null) return 'push';
  if (local == null && cloud != null) return 'pull';

  if ((local as number) > (cloud as number)) return 'push';
  if ((cloud as number) > (local as number)) return 'pull';
  return 'noop';
}


