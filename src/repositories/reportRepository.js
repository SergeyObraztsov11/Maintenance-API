import { QueryTypes } from "sequelize";
import { sequelize } from "../db/index.js";
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
            SELECT status, COUNT(*)::int AS count
            FROM equipment
            WHERE site_id = :siteId
            GROUP BY status
            `,
            {
                replacements: { siteId },
                type: QueryTypes.SELECT,
            },
        );
        const requestRows = await sequelize.query(
            `
            SELECT mr.status, COUNT(*)::int AS count
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
        const equipmentByStatus = {};
        let equipmentTotal = 0;
        for (const row of equipmentRows) {
            equipmentByStatus[row.status] = row.count;
            equipmentTotal += row.count;
        }
        const requestsByStatus = {};
        let requestsTotal = 0;
        for (const row of requestRows) {
            requestsByStatus[row.status] = row.count;
            requestsTotal += row.count;
        }
        return {
            site,
            equipmentTotal,
            equipmentByStatus,
            requestsTotal,
            requestsByStatus,
        };
    },
    async getTechniciansWorkload() {
        const rows = await sequelize.query(
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
        return rows;
    },
};
