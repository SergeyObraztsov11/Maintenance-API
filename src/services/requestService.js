import { randomUUID } from "node:crypto";
import { requestRepository } from "../repositories/requestRepository.js";
import { equipmentRepository } from "../repositories/equipmentRepository.js";
import { NotFoundError } from "../errors/NotFoundError.js";
import { ConflictError } from "../errors/ConflictError.js";
import { ValidationError } from "../errors/ValidationError.js";
import { Technician } from "../models/index.js";
import { Op } from "sequelize";
import { ForbiddenError } from "../errors/ForbiddenError.js";

// Бизнес-логика заявок: правила, статусы, привязка к оборудованию.
const ALLOWED_TRANSITIONS = {
    new: ["in_progress", "rejected"],
    in_progress: ["done", "rejected"],
    done: [],
    rejected: [],
};

export const requestService = {
    async list(query = {}) {
        return requestRepository.findAll(query);
    },

    async listByEquipmentId(equipmentId, query = {}) {
        const equipment = await equipmentRepository.findById(equipmentId);
        if (!equipment) {
            throw new NotFoundError(`Equipment ${equipmentId} not found`);
        }
        return this.list({ ...query, equipmentId });
    },

    async getById(id) {
        const request = await requestRepository.findById(id);
        if (!request) {
            throw new NotFoundError(`Request ${id} not found`);
        }
        return request;
    },

    async create(input) {
        const equipment = await equipmentRepository.findById(input.equipmentId);
        if (!equipment) {
            throw new NotFoundError(`Equipment ${input.equipmentId} not found`);
        }

        const now = new Date().toISOString();
        const request = {
            id: randomUUID(),
            equipmentId: input.equipmentId,
            title: input.title,
            description: input.description ?? "",
            priority: input.priority,
            status: "new",
            plannedAt: input.plannedAt ?? null,
            createdAt: now,
            updatedAt: now,
        };

        return requestRepository.create(request);
    },

    async update(id, input) {
        await this.getById(id);

        const patch = { ...input, updatedAt: new Date().toISOString() };
        delete patch.id;
        delete patch.createdAt;
        delete patch.status;

        return requestRepository.update(id, patch);
    },
    async changeStatus(id, status, user) {
        const request = await this.getById(id);

        // Только админ и техник может менять статус заявки
        if (user.role !== "admin" && user.role !== "technician") {
            throw new ForbiddenError(
                "No access to change the status of this request",
            );
        }
        // Техник может менять только свои заяки. Админ все
        if (user.role === "technician") {
            let isAssigned = false;

            for (const assignee of request.assignees ?? []) {
                if (assignee.technician?.id === user.technicianId) {
                    isAssigned = true;
                    break;
                }
            }
            if (!isAssigned) {
                throw new ForbiddenError(
                    "No access to change the status of this request.",
                );
            }
        }

        const allowed = ALLOWED_TRANSITIONS[request.status] ?? [];

        if (!allowed.includes(status)) {
            throw new ConflictError(
                `Cannot change status from ${request.status} to ${status}`,
            );
        }

        if (status === "in_progress") {
            const count = await requestRepository.countAssignees(id);
            if (count === 0) {
                throw new ConflictError(
                    "Cannot set in_progress without assignees",
                );
            }
        }

        const updated = await requestRepository.changeStatus(id, {
            status,
            changedBy: "api",
            comment: null,
        });

        return updated;
    },
    async getStatusHistory(id) {
        await this.getById(id);
        return requestRepository.findStatusHistory(id);
    },
    async remove(id) {
        await this.getById(id);
        await requestRepository.remove(id);
    },
    async setAssignees(requestId, assignees) {
        await this.getById(requestId);

        const leadCount = assignees.filter(
            (item) => item.role === "lead",
        ).length;
        if (leadCount !== 1) {
            throw new ValidationError("Crew must contain exactly one lead", [
                { field: "assignees", message: "Exactly one lead is required" },
            ]);
        }

        const technicianIds = assignees.map((item) => item.technicianId);
        if (new Set(technicianIds).size !== technicianIds.length) {
            throw new ValidationError("Duplicate technician in crew", [
                {
                    field: "assignees",
                    message: "Duplicate technicianId in assignees list",
                },
            ]);
        }

        const technicians = await Technician.findAll({
            where: { id: { [Op.in]: technicianIds } },
        });
        if (technicians.length !== technicianIds.length) {
            const found = new Set(technicians.map((item) => item.id));
            const missing = technicianIds.find((id) => !found.has(id));
            throw new NotFoundError(`Technician ${missing} not found`);
        }

        return requestRepository.replaceAssignees(requestId, assignees);
    },
    async removeAssignee(requestId, technicianId) {
        await this.getById(requestId);
        const removed = await requestRepository.removeAssignee(
            requestId,
            technicianId,
        );
        if (!removed) {
            throw new NotFoundError(
                `Assignee ${technicianId} not found on request ${requestId}`,
            );
        }
    },
};
