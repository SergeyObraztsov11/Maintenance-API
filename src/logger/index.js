const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = LEVELS[process.env.LOG_LEVEL || "info"] ?? LEVELS.info;
function write(level, message, meta = {}) {
    if ((LEVELS[level] ?? 99) > currentLevel) return;
    const entry = {
        level,
        time: new Date().toISOString(),
        message,
        ...meta,
    };
    const line = JSON.stringify(entry);
    if (level === "error") {
        console.error(line);
    } else if (level === "warn") {
        console.warn(line);
    } else {
        console.log(line);
    }
}
export const logger = {
    error: (message, meta) => write("error", message, meta),
    warn: (message, meta) => write("warn", message, meta),
    info: (message, meta) => write("info", message, meta),
    debug: (message, meta) => write("debug", message, meta),
};
