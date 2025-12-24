import { initialUltimateNavState, ultimateNavReducer, type UltimateNavAction, type UltimateNavState } from './UltimateNavState';

describe('ultimateNavReducer (Figma Make screen state machine)', () => {
  it('starts on menu with Make-aligned defaults', () => {
    expect(initialUltimateNavState).toEqual<UltimateNavState>({
      screen: 'menu',
      authModalOpen: false,
      isAuthenticated: false,
      username: '',
      selectedDifficulty: 'medium',
      gameType: 'classic',
    });
  });

  it('navigating to game routes to difficulty first (guarded transition)', () => {
    const next = ultimateNavReducer(initialUltimateNavState, {
      type: 'NAVIGATE',
      screen: 'game',
    });
    expect(next.screen).toBe('difficulty');
  });

  it('selecting difficulty sets it and routes to game', () => {
    const stateAtDifficulty = ultimateNavReducer(initialUltimateNavState, { type: 'NAVIGATE', screen: 'game' });
    expect(stateAtDifficulty.screen).toBe('difficulty');

    const next = ultimateNavReducer(stateAtDifficulty, { type: 'SELECT_DIFFICULTY', difficulty: 'expert' });
    expect(next).toEqual<UltimateNavState>({
      ...stateAtDifficulty,
      screen: 'game',
      selectedDifficulty: 'expert',
      gameType: 'classic',
    });
  });

  it('AUTH_SUCCESS closes auth modal, sets username, and marks authenticated', () => {
    const open = ultimateNavReducer(initialUltimateNavState, { type: 'SET_AUTH_MODAL_OPEN', open: true });
    expect(open.authModalOpen).toBe(true);

    const next = ultimateNavReducer(open, { type: 'AUTH_SUCCESS', username: 'Neil' });
    expect(next).toEqual<UltimateNavState>({
      ...open,
      authModalOpen: false,
      isAuthenticated: true,
      username: 'Neil',
    });
  });

  it('SIGN_OUT clears username/auth and routes to menu', () => {
    const authed: UltimateNavState = {
      screen: 'profile',
      authModalOpen: false,
      isAuthenticated: true,
      username: 'Neil',
      selectedDifficulty: 'hard',
      gameType: 'classic',
    };

    const next = ultimateNavReducer(authed, { type: 'SIGN_OUT' });
    expect(next).toEqual<UltimateNavState>({
      ...authed,
      screen: 'menu',
      isAuthenticated: false,
      username: '',
    });
  });

  it('START_DAILY routes to game directly and sets game type to daily', () => {
    const next = ultimateNavReducer(initialUltimateNavState, { type: 'START_DAILY' });
    expect(next.screen).toBe('game');
    expect(next.gameType).toBe('daily');
  });

  it('is exhaustive over action types (compile-time)', () => {
    const _action: UltimateNavAction = { type: 'NAVIGATE', screen: 'menu' };
    expect(_action.type).toBe('NAVIGATE');
  });
});


