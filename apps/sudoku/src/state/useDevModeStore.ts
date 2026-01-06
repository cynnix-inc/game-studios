import { create } from 'zustand';

import { isDevToolsAllowed } from '../services/runtimeEnv';

type DevModeState = {
  open: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
};

export const useDevModeStore = create<DevModeState>((set, get) => ({
  open: false,

  toggle: () => {
    if (!isDevToolsAllowed()) {
      set({ open: false });
      return;
    }
    set({ open: !get().open });
  },

  setOpen: (open) => {
    if (!isDevToolsAllowed()) {
      set({ open: false });
      return;
    }
    set({ open });
  },
}));


