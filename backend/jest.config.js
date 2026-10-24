module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  globalSetup: '<rootDir>/__tests__/globalSetup.js',
  globalTeardown: '<rootDir>/__tests__/globalTeardown.js',
  setupFiles: ['<rootDir>/__tests__/setupEnv.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/**',
    '!src/middleware/uploadMiddleware.js',
  ],
  coveragePathIgnorePatterns: ['/node_modules/', '/uploads/'],
  testTimeout: 15000,
  verbose: true,
  maxWorkers: 1,
  forceExit: true,
};
