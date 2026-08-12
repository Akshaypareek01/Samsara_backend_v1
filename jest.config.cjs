module.exports = {
  testEnvironment: 'node',
  testEnvironmentOptions: {
    NODE_ENV: 'test',
  },
  restoreMocks: true,
  // NOTE: the three tests/integration suites currently fail to load. They
  // import src/app.js, which pulls in @aws-sdk (R2). Jest's ESM runtime cannot
  // resolve the builtin `stream` import inside @smithy/util-stream's CJS build.
  // Mapping `node:*` -> `*` does not help. Fixing it needs the R2 client
  // stubbed for tests, or a transform for that dependency. Unit suites are
  // unaffected and cover the remediated behaviour.
  coveragePathIgnorePatterns: ['node_modules', 'src/config', 'src/app.js', 'tests'],
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
};
