/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  moduleNameMapper: {
    '^@cynnix-studios/sudoku-core$': '<rootDir>/../sudoku-core/src/index.ts',
    '^@cynnix-studios/game-foundation/http$': '<rootDir>/../game-foundation/src/http/index.ts',
  },
};


