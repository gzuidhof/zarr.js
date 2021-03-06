module.exports = {
  launch: {
    headless: true,
  },
  server: {
    command: 'node test/globalSetup.js',
    port: 3000,
  },
}