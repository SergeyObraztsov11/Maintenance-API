/** @type {import('jest').Config} */
const config = {
    testEnvironment: "node",
    roots: ["<rootDir>/tests"],
    testMatch: ["**/*.test.js"],
    clearMocks: true,
    collectCoverageFrom: [
        "src/**/*.js",
        "!src/db/migrations/**",
        "!src/scripts/**",
    ],
    coverageDirectory: "coverage",
    coverageReporters: ["text", "lcov"],
};

export default config;
