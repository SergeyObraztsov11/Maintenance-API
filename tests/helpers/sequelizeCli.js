import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
);

const sequelizeCli = path.join(
    rootDir,
    "node_modules",
    "sequelize-cli",
    "lib",
    "sequelize",
);

export function runSequelizeCli(...args) {
    execFileSync(process.execPath, [sequelizeCli, ...args], {
        stdio: "inherit",
        cwd: rootDir,
        env: {
            ...process.env,
            NODE_ENV: "test",
        },
    });
}
