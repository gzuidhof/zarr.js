const { setup: setupDevServer } = require('jest-dev-server')

module.exports = async function globalSetup() {
  await setupDevServer({
    command: 'node fixtures-server.js',
    port: 7357,
    debug: true,
  })
}