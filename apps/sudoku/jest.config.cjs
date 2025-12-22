/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(spec|test).ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/.expo/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleNameMapper: {
    '^expo-apple-authentication$': '<rootDir>/src/testStubs/expoAppleAuthentication.ts',
    '^@react-native-google-signin/google-signin$': '<rootDir>/src/testStubs/googleSignin.ts',
  },
  clearMocks: true,
  restoreMocks: true,
};


