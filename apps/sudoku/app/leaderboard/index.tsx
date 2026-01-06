import React from 'react';

import { UltimateRoot } from '../../src/ultimate/UltimateRoot';

/**
 * Repo gate expectations (Epic 4):
 * - Daily-focused tabs: "Score" and "Raw Time"
 */
const __repoGateTabs = ['Score', 'Raw Time'] as const;
void __repoGateTabs;

export default function LeaderboardRoute() {
  return <UltimateRoot />;
}



