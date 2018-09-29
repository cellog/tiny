module.exports = function(wallaby) {
  return {
    files: [
      { pattern: 'tests/**/*.test.js*', ignore: true },
      'src/**/*.js*',
    ],
    tests: [
      { pattern: 'node_modules/*', ignore: true, instrument: false },
      'tests/**/*.test.js*',
    ],
    compilers: {
      '**/*.js': wallaby.compilers.babel({
        babel: require('babel-core'),
      }),
    },
    env: {
      type: 'node'
    },
    testFramework: 'jest'
  }
}
