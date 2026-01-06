export type LeaderboardMode = 'time_ms' | 'mistakes';

export type PlatformLeaderboardEntry = {
  rank: number;
  displayName: string;
  value: number;
};

export type PlatformServices = {
  leaderboards: {
    getTop(gameKey: string, mode: LeaderboardMode, limit: number): Promise<PlatformLeaderboardEntry[]>;
    submit(gameKey: string, mode: LeaderboardMode, value: number): Promise<void>;
  };
};



