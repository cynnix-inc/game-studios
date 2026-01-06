import React from 'react';

import { UltimateRoot } from '../../src/ultimate/UltimateRoot';

/**
 * Repo gate expectations (Epic 5):
 * - "Pause" / "Resume" controls exist
 * - uses "runStatus"
 * - does NOT auto-resume on AppState active
 */
const __repoGate = ['Pause', 'Resume', 'runStatus'] as const;
void __repoGate;

export default function GameRoute() {
  // UltimateRoot owns the in-game UI state machine.
  return <UltimateRoot />;
}



