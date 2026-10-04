import dotenv from "dotenv";
import { runSequelizeCli } from "./helpers/sequelizeCli.js";
import { createPgClient, getTestDbName } from "./helpers/testDb.js";

dotenv.config({ quiet: true });

async function ensureTestDatabase(dbName) {
    const client = createPgClient("postgres");
    await client.connect();
    try {
        const existing = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [dbName],
        );
        if (existing.rowCount === 0) {
            await client.query(`CREATE DATABASE ${dbName}`);
            console.log(`[jest] created database ${dbName}`);
        }
    } finally {
        await client.end();
    }
}

export default async function globalSetup() {
    const dbName = getTestDbName();
    await ensureTestDatabase(dbName);
    runSequelizeCli("db:migrate", "--env", "test");
}
