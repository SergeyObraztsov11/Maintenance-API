import { closeTestDb } from "./helpers/db.js";

describe("database teardown", () => {
    it("closes Sequelize pool so Jest can exit without --forceExit", async () => {
        await closeTestDb();
    });
});
