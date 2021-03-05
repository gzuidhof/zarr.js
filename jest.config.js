function baseConfig() {
  if (process.env.TEST_ENV === 'browser') {
    console.log('Running tests in browser env.');
    return { preset: 'jest-puppeteer' }
  }
  console.log('Running tests in Node env.');
  return {
    globalSetup: '<rootDir>/test/globalSetup.js',
    globalTeardown: '<rootDir>/test/globalTeardown.js'
  }
}


module.exports = {
  ...baseConfig(),
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 55,
      lines: 55,
      statements: 55
    }
  },
  collectCoverageFrom: ["src/**/*.ts"]
}
