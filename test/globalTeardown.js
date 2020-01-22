// eslint-disable-next-line @typescript-eslint/no-var-requires
const { teardown: teardownDevServer } = require('jest-dev-server');

module.exports = async function globalTeardown() {
    await teardownDevServer();
};
