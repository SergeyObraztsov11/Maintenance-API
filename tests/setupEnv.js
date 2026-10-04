import dotenv from "dotenv";

dotenv.config({ quiet: true });

process.env.NODE_ENV = "test";
process.env.DB_NAME = process.env.TEST_DB_NAME || "maintenance_test";
process.env.RATE_LIMIT_MAX = "100000";
process.env.JWT_ACCESS_SECRET =
    process.env.JWT_ACCESS_SECRET || "test-access-secret";
process.env.JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET || "test-refresh-secret";
process.env.LOG_LEVEL = "silent";
