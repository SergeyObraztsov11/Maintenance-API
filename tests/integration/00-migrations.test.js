import { runSequelizeCli } from "../helpers/sequelizeCli.js";
import { listPublicTables } from "../helpers/testDb.js";

const EXPECTED_TABLES = [
    "SequelizeMeta",
    "equipment",
    "equipment_passports",
    "maintenance_requests",
    "request_assignees",
    "request_status_history",
    "sites",
    "technicians",
    "users",
];

describe("database migrations", () => {
    it("rolls back all migrations and applies them again", async () => {
        runSequelizeCli("db:migrate:undo:all", "--env", "test");

        const afterUndo = await listPublicTables();
        expect(afterUndo).not.toEqual(
            expect.arrayContaining(["sites", "users"]),
        );

        runSequelizeCli("db:migrate", "--env", "test");

        const afterMigrate = await listPublicTables();
        expect(afterMigrate).toEqual(expect.arrayContaining(EXPECTED_TABLES));
    });

    it("can undo the latest migration and migrate forward again", async () => {
        runSequelizeCli("db:migrate:undo", "--env", "test");

        const afterOneUndo = await listPublicTables();
        expect(afterOneUndo).not.toContain("users");

        runSequelizeCli("db:migrate", "--env", "test");

        const restored = await listPublicTables();
        expect(restored).toContain("users");
        expect(restored).toEqual(expect.arrayContaining(EXPECTED_TABLES));
    });
});
