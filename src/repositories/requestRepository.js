import {
    MaintenanceRequest,
    RequestAssignee,
    Technician,
} from "../models/index.js";

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

export const requestRepository = {
    async findAll() {
        const rows = await MaintenanceRequest.findAll({
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

    async create(request) {
        await MaintenanceRequest.create({
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
};