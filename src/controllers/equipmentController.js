import { equipmentService } from "../services/equipmentService.js";

export const equipmentController = {
    async list(req, res, next) {
        try {
            const result = await equipmentService.list(req.query);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    async getById(req, res, next) {
        try {
            const item = await equipmentService.getById(req.params.id);
            res.status(200).json({ data: item });
        } catch (error) {
            next(error);
        }
    },

    async create(req, res, next) {
        try {
            const item = await equipmentService.create(req.body);
            res.status(201)
                .location(`/api/equipment/${item.id}`)
                .json({ data: item });
        } catch (error) {
            next(error);
        }
    },

    async update(req, res, next) {
        try {
            const item = await equipmentService.update(req.params.id, req.body);
            res.status(200).json({ data: item });
        } catch (error) {
            next(error);
        }
    },

    async remove(req, res, next) {
        try {
            await equipmentService.remove(req.params.id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    },
};
