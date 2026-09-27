import {
    MaintenanceRequest,
    RequestAssignee,
    RequestStatusHistory,
    Technician,
} from "../models/index.js";
import { Op } from "sequelize";
import { sequelize } from "../db/index.js";

function toNumber(value) {
    return value === null || value === undefined ? value : Number(value);
}

function toApi(request) {
    const plain = request.get({ plain: true });

    return {
        id: plain.id,
        equipmentId: plain.equipmentId,
        title: plain.title,
        description: plain.description,
        priority: plain.priority,
        status: plain.status,
        plannedAt: plain.plannedAt,
        author: plain.author,
        createdAt: plain.createdAt,
        updatedAt: plain.updatedAt,
        assignees: (plain.assignees ?? []).map((item) => ({
            id: item.id,
            role: item.role,
            hours: toNumber(item.hours),
            technician: item.technician
                ? {
                      id: item.technician.id,
                      fullName: item.technician.fullName,
                      specialization: item.technician.specialization,
                      employeeNumber: item.technician.employeeNumber,
                  }
                : null,
        })),
    };
}

function buildListQuery(query = {}) {
    const where = {};
    if (query.status) {
        where.status = query.status;
    }
    if (query.priority) {
        where.priority = query.priority;
    }
    if (query.equipmentId) {
        where.equipmentId = query.equipmentId;
    }
    if (query.createdAtFrom || query.createdAtTo) {
        where.createdAt = {};
        if (query.createdAtFrom) {
            where.createdAt[Op.gte] = query.createdAtFrom;
        }
        if (query.createdAtTo) {
            where.createdAt[Op.lte] = query.createdAtTo;
        }
    }
    if (query.plannedAtFrom || query.plannedAtTo) {
        where.plannedAt = {};
        if (query.plannedAtFrom) {
            where.plannedAt[Op.gte] = query.plannedAtFrom;
        }
        if (query.plannedAtTo) {
            where.plannedAt[Op.lte] = query.plannedAtTo;
        }
    }
    const allowedSort = [
        "title",
        "priority",
        "status",
        "plannedAt",
        "createdAt",
        "updatedAt",
    ];
    const sortBy = allowedSort.includes(query.sortBy)
        ? query.sortBy
        : "createdAt";
    const sortOrder = query.sortOrder === "asc" ? "ASC" : "DESC";
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const offset = (page - 1) * limit;
    return { where, order: [[sortBy, sortOrder]], limit, offset, page };
}

export const requestRepository = {
    async findAll(query = {}) {
        const { where, order, limit, offset, page } = buildListQuery(query);
        const { rows, count } = await MaintenanceRequest.findAndCountAll({
            where,
            order,
            limit,
            offset,
            distinct: true,
            include: [
                {
                    model: RequestAssignee,
                    as: "assignees",
                    include: [
                        {
                            model: Technician,
                            as: "technician",
                            attributes: [
                                "id",
                                "fullName",
                                "specialization",
                                "employeeNumber",
                            ],
                        },
                    ],
                },
            ],
        });
        return {
            data: rows.map(toApi),
            meta: { total: count, page, limit },
        };
    },

    async findById(id) {
        const row = await MaintenanceRequest.findByPk(id, {
            include: [
                {
                    model: RequestAssignee,
                    as: "assignees",
                    include: [
                        {
                            model: Technician,
                            as: "technician",
                            attributes: [
                                "id",
                                "fullName",
                                "specialization",
                                "employeeNumber",
                            ],
                        },
                    ],
                },
            ],
        });
        return row ? toApi(row) : null;
    },

    async findByEquipmentId(equipmentId) {
        const rows = await MaintenanceRequest.findAll({
            where: { equipmentId },
            include: [
                {
                    model: RequestAssignee,
                    as: "assignees",
                    include: [
                        {
                            model: Technician,
                            as: "technician",
                            attributes: [
                                "id",
                                "fullName",
                                "specialization",
                                "employeeNumber",
                            ],
                        },
                    ],
                },
            ],
            order: [["createdAt", "DESC"]],
        });
        return rows.map(toApi);
    },
    async findStatusHistory(requestId) {
        const rows = await RequestStatusHistory.findAll({
            where: { requestId },
            order: [["createdAt", "ASC"]],
        });
        return rows.map((row) => {
            const plain = row.get({ plain: true });
            return {
                id: plain.id,
                requestId: plain.requestId,
                fromStatus: plain.fromStatus,
                toStatus: plain.toStatus,
                changedBy: plain.changedBy,
                comment: plain.comment,
                createdAt: plain.createdAt,
            };
        });
    },
    async create(request) {
        await sequelize.transaction(async (t) => {
            await MaintenanceRequest.create(
                {
                    id: request.id,
                    equipmentId: request.equipmentId,
                    title: request.title,
                    description: request.description ?? "",
                    priority: request.priority,
                    status: request.status ?? "new",
                    plannedAt: request.plannedAt ?? new Date().toISOString(),
                    author: request.author ?? "api",
                    createdAt: request.createdAt,
                    updatedAt: request.updatedAt,
                },
                { transaction: t },
            );
            await RequestStatusHistory.create(
                {
                    requestId: request.id,
                    fromStatus: null,
                    toStatus: request.status ?? "new",
                    changedBy: request.author ?? "api",
                    comment: "Created",
                },
                { transaction: t },
            );
        });
        return this.findById(request.id);
    },

    async update(id, patch) {
        const row = await MaintenanceRequest.findByPk(id);
        if (!row) return null;

        const data = { ...patch };
        delete data.id;
        delete data.createdAt;
        delete data.assignees;

        await row.update(data);
        return this.findById(id);
    },

    async remove(id) {
        const deleted = await MaintenanceRequest.destroy({ where: { id } });
        return deleted > 0;
    },
    async changeStatus(id, { status, changedBy, comment }) {
        await sequelize.transaction(async (t) => {
            const row = await MaintenanceRequest.findByPk(id, {
                transaction: t,
                lock: t.LOCK.UPDATE,
            });
            if (!row) return null;
            const fromStatus = row.status;
            await row.update(
                { status, updatedAt: new Date().toISOString() },
                { transaction: t },
            );
            await RequestStatusHistory.create(
                {
                    requestId: id,
                    fromStatus,
                    toStatus: status,
                    changedBy: changedBy,
                    comment: comment,
                },
                { transaction: t },
            );
        });
        return this.findById(id);
    },
};
