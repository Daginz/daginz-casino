/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  // Inject minimal env before modules that parse config/env at import time.
  setupFiles: ['<rootDir>/../jest.setup.js'],
  moduleNameMapper: {
    // Mirror tsconfig path alias so tests can import @/...
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: ['**/*.ts', '!**/*.spec.ts', '!main.ts', '!**/*.module.ts'],
};
