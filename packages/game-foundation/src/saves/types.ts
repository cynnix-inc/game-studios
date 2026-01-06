export type SaveSlot = 'main' | (string & {});

export type GameSave<TData extends object = Record<string, unknown>> = {
  gameKey: string;
  slot: SaveSlot;
  data: TData;
  updatedAtMs: number;
};

export type SaveWriteResult = {
  ok: boolean;
  updatedAtMs: number;
};



