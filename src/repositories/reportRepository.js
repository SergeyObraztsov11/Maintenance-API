import { QueryTypes } from "sequelize";
import { sequelize } from "../db/index.js";

function rowsToCountMap(rows) {
    const map = {};
    let total = 0;
    for (const row of rows) {
        map[row.key] = row.count;
        total += row.count;
    }
    return { map, total };
}

export const reportRepository = {
    async getSiteSummary(siteId) {
        const sites = await sequelize.query(
            `
            SELECT id, name, code, region
            FROM sites
            WHERE id = :siteId
            `,
            {
                replacements: { siteId },
                type: QueryTypes.SELECT,
            },
        );
        if (!sites.length) return null;
        const site = sites[0];

        const equipmentRows = await sequelize.query(
            `
            SELECT status AS key, COUNT(*)::int AS count
            FROM equipment
            WHERE site_id = :siteId
            GROUP BY status
            `,
            {
                replacements: { siteId },
                type: QueryTypes.SELECT,
            },
        );

        const requestStatusRows = await sequelize.query(
            `
            SELECT mr.status AS key, COUNT(*)::int AS count
            FROM maintenance_requests AS mr
            INNER JOIN equipment AS e ON e.id = mr.equipment_id
            WHERE e.site_id = :siteId
            GROUP BY mr.status
            `,
            {
                replacements: { siteId },
                type: QueryTypes.SELECT,
            },
        );

        const requestPriorityRows = await sequelize.query(
            `
            SELECT mr.priority AS key, COUNT(*)::int AS count
            FROM maintenance_requests AS mr
            INNER JOIN equipment AS e ON e.id = mr.equipment_id
            WHERE e.site_id = :siteId
            GROUP BY mr.priority
            `,
            {
                replacements: { siteId },
                type: QueryTypes.SELECT,
            },
        );

        const avgRows = await sequelize.query(
            `
            SELECT AVG(
                EXTRACT(EPOCH FROM (closed.closed_at - mr.created_at)) / 3600.0
            )::float AS "avgCloseTimeHours"
            FROM maintenance_requests AS mr
            INNER JOIN equipment AS e ON e.id = mr.equipment_id
            INNER JOIN (
                SELECT request_id, MIN(created_at) AS closed_at
                FROM request_status_history
                WHERE to_status = 'done'
                GROUP BY request_id
            ) AS closed ON closed.request_id = mr.id
            WHERE e.site_id = :siteId
            `,
            {
                replacements: { siteId },
                type: QueryTypes.SELECT,
            },
        );

        const equipment = rowsToCountMap(equipmentRows);
        const byStatus = rowsToCountMap(requestStatusRows);
        const byPriority = rowsToCountMap(requestPriorityRows);

        return {
            site,
            equipmentTotal: equipment.total,
            equipmentByStatus: equipment.map,
            requestsTotal: byStatus.total,
            requestsByStatus: byStatus.map,
            requestsByPriority: byPriority.map,
            avgCloseTimeHours: avgRows[0]?.avgCloseTimeHours ?? null,
        };
    },

    async getEquipmentLoad(query = {}) {
        const replacements = {
            minRequests: query.minRequests ?? 0,
        };

        function periodClause(alias) {
            const parts = [];
            if (query.from) {
                parts.push(`${alias}.created_at >= :fromDate`);
                replacements.fromDate = query.from;
            }
            if (query.to) {
                parts.push(`${alias}.created_at <= :toDate`);
                replacements.toDate = query.to;
            }
            return parts.length ? `AND ${parts.join(" AND ")}` : "";
        }

        const mrPeriod = periodClause("mr");
        const mr2Period = periodClause("mr2");

        return sequelize.query(
            `
            SELECT
                e.id,
                e.name,
                e.type,
                e.serial_number AS "serialNumber",
                e.status,
                COUNT(mr.id)::int AS "requestsCount",
                COUNT(mr.id) FILTER (WHERE mr.status = 'done')::int AS "closedRequestsCount",
                COALESCE((
                    SELECT SUM(ra.hours)
                    FROM request_assignees AS ra
                    INNER JOIN maintenance_requests AS mr2 ON mr2.id = ra.request_id
                    WHERE mr2.equipment_id = e.id
                    ${mr2Period}
                ), 0)::float AS "totalPlannedHours",
                (
                    SELECT MAX(h.created_at)
                    FROM request_status_history AS h
                    INNER JOIN maintenance_requests AS mr3 ON mr3.id = h.request_id
                    WHERE mr3.equipment_id = e.id
                      AND h.to_status = 'done'
                ) AS "lastServicedAt"
            FROM equipment AS e
            LEFT JOIN maintenance_requests AS mr
                ON mr.equipment_id = e.id
                ${mrPeriod}
            GROUP BY e.id, e.name, e.type, e.serial_number, e.status
            HAVING COUNT(mr.id) >= :minRequests
            ORDER BY "requestsCount" DESC, e.name ASC
            `,
            {
                replacements,
                type: QueryTypes.SELECT,
            },
        );
    },

    async getTechniciansWorkload() {
        return sequelize.query(
            `
            SELECT
                t.id,
                t.full_name AS "fullName",
                t.specialization,
                t.employee_number AS "employeeNumber",
                COUNT(ra.id)::int AS "assignmentsCount",
                COALESCE(SUM(ra.hours), 0)::float AS "totalHours"
            FROM technicians AS t
            LEFT JOIN request_assignees AS ra ON ra.technician_id = t.id
            GROUP BY t.id, t.full_name, t.specialization, t.employee_number
            ORDER BY "totalHours" DESC, t.full_name ASC
            `,
            { type: QueryTypes.SELECT },
        );
    },
};
