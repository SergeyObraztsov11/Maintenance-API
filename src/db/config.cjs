require("dotenv").config();

const shared = {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    dialect: "postgres",
};

module.exports = {
    development: {
        ...shared,
        logging: console.log,
    },
    test: {
        ...shared,
        // Keep tests off the development database even if .env has DB_NAME=maintenance.
        database: process.env.TEST_DB_NAME || "maintenance_test",
        logging: false,
    },
    production: {
        ...shared,
        logging: false,
    },
};
