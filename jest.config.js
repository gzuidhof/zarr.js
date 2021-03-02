module.exports = {
    "globalSetup": "<rootDir>/test/globalSetup.js",
    "globalTeardown": "<rootDir>/test/globalTeardown.js",
    "testEnvironment": "node",
    "transform": {
        ".ts": "ts-jest"
    },
    "testRegex": "(/__tests__/.*|\\.(test|spec))\\.(ts|tsx|js)$",
    "moduleFileExtensions": ["ts", "js"],
    "coveragePathIgnorePatterns": [
        "/node_modules/",
        "/test/"
    ],
    "coverageThreshold": {
        "global": {
            "branches": 40,
            "functions": 55,
            "lines": 55,
            "statements": 55
        }
    },
    "collectCoverageFrom": [
        "src/**/*.{js,ts}"
    ]
}
