/** @type {import('jest').Config} */
const config = {
    testEnvironment: "node",
    roots: ["<rootDir>/tests"],
    testMatch: ["**/*.test.js"],
    setupFiles: ["<rootDir>/tests/setupEnv.js"],
    clearMocks: true,
    // Shared Postgres test DB — avoid parallel writers.
    maxWorkers: 1,
    // ESM + pg/supertest can leave handles on Windows even after sequelize.close().
    forceExit: true,
    collectCoverageFrom: [
        "src/**/*.js",
        "!src/db/migrations/**",
        "!src/scripts/**",
        "!src/docs/**",
    ],
    coverageDirectory: "coverage",
    coverageReporters: ["text", "lcov"],
};

export default config;
