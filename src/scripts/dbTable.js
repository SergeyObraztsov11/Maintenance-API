import { spawnSync } from "node:child_process";

const mode = process.argv[2];
const table = process.argv[3];

const allowed = new Set([
    "sites",
    "equipment",
    "equipment_passports",
    "technicians",
    "maintenance_requests",
    "request_status_history",
    "request_assignees",
    "SequelizeMeta",
    "users",
]);

if (!mode || !table || !["structure", "data"].includes(mode)) {
    console.error("Usage: npm run db:show-table -- <table>");
    console.error("       npm run db:show-data -- <table>");
    process.exit(1);
}

if (!allowed.has(table)) {
    console.error(`Unknown table: ${table}`);
    console.error(`Allowed: ${[...allowed].join(", ")}`);
    process.exit(1);
}

const sql =
    mode === "data"
        ? `SELECT * FROM "${table}";`
        : `SELECT column_name, data_type, is_nullable, column_default
           FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = '${table}'
           ORDER BY ordinal_position;`;

const result = spawnSync(
    "docker",
    [
        "compose",
        "exec",
        "-T",
        "db",
        "psql",
        "-U",
        "maintenance",
        "-d",
        "maintenance",
        "-c",
        sql,
    ],
    { stdio: "inherit" },
);

process.exit(result.status ?? 1);
