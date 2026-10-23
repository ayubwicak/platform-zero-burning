module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
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
