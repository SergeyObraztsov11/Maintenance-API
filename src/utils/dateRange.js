// Compares ISO date/date-time strings for list filters.

export function isInDateRange(value, from, to) {
    if (value == null || value === "") {
        return false;
    }

    const time = Date.parse(value);
    if (Number.isNaN(time)) {
        return false;
    }

    if (from) {
        const fromTime = Date.parse(from);
        if (!Number.isNaN(fromTime) && time < fromTime) {
            return false;
        }
    }

    if (to) {
        const toTime = Date.parse(to);
        if (!Number.isNaN(toTime) && time > toTime) {
            return false;
        }
    }

    return true;
}
