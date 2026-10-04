import pg from "pg";

export function getTestDbName() {
    const name = process.env.TEST_DB_NAME || "maintenance_test";
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
        throw new Error(`Invalid TEST_DB_NAME: ${name}`);
    }
    return name;
}

export function createPgClient(database) {
    return new pg.Client({
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || "maintenance",
        password: process.env.DB_PASSWORD || "",
        database,
    });
}

export async function listPublicTables() {
    const client = createPgClient(getTestDbName());
    await client.connect();
    try {
        const result = await client.query(
            `
            SELECT tablename
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename
            `,
        );
        return result.rows.map((row) => row.tablename);
    } finally {
        await client.end();
    }
}
