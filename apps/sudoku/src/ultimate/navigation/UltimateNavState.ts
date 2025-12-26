export type UltimateScreen =
  | 'menu'
  | 'settings'
  | 'stats'
  | 'leaderboard'
  | 'profile'
  | 'game'
  | 'dailyChallenges'
  | 'difficulty';

import type { Difficulty } from '@cynnix-studios/sudoku-core';

export type UltimateDifficulty = Difficulty;

export type UltimateNavState = {
  screen: UltimateScreen;
  authModalOpen: boolean;
  isAuthenticated: boolean;
  username: string;
  selectedDifficulty: UltimateDifficulty;
  gameType: 'classic' | 'daily';
};

export type UltimateNavAction =
  | { type: 'NAVIGATE'; screen: UltimateScreen }
  | { type: 'SELECT_DIFFICULTY'; difficulty: UltimateDifficulty }
  | { type: 'SET_AUTH_MODAL_OPEN'; open: boolean }
  | { type: 'AUTH_SUCCESS'; username: string }
  | { type: 'SIGN_OUT' }
  | { type: 'START_DAILY' }
  | { type: 'RESUME_FREE_PLAY' };

export const initialUltimateNavState: UltimateNavState = {
  screen: 'menu',
  authModalOpen: false,
  isAuthenticated: false,
  username: '',
  selectedDifficulty: 'skilled',
  gameType: 'classic',
};

export function ultimateNavReducer(state: UltimateNavState, action: UltimateNavAction): UltimateNavState {
  switch (action.type) {
    case 'NAVIGATE': {
      // Make behavior: navigating to "game" actually routes to a difficulty picker first.
      if (action.screen === 'game') return { ...state, screen: 'difficulty', gameType: 'classic' };
      return { ...state, screen: action.screen };
    }

    case 'SELECT_DIFFICULTY': {
      return { ...state, selectedDifficulty: action.difficulty, screen: 'game', gameType: 'classic' };
    }

    case 'SET_AUTH_MODAL_OPEN': {
      return { ...state, authModalOpen: action.open };
    }

    case 'AUTH_SUCCESS': {
      return {
        ...state,
        authModalOpen: false,
        isAuthenticated: true,
        username: action.username,
      };
    }

    case 'SIGN_OUT': {
      return {
        ...state,
        screen: 'menu',
        isAuthenticated: false,
        username: '',
      };
    }

    case 'START_DAILY': {
      return { ...state, screen: 'game', gameType: 'daily' };
    }

    case 'RESUME_FREE_PLAY': {
      // Home screen "Resume" should go directly back into the game surface without a difficulty pick.
      return { ...state, screen: 'game', gameType: 'classic' };
    }

    default: {
      // Exhaustiveness check
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _exhaustive: never = action;
      return state;
    }
  }
}


