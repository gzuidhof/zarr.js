const base = require("./jest.config")

delete base.testEnvironment;
delete base.globalSetup;
delete base.globalTeardown;

module.exports = Object.assign(base, {
    preset: "jest-puppeteer",
});
