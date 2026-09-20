import { requestService } from "../services/requestService.js";

export const requestController = {
    async list(req, res, next) {
        try {
            const result = await requestService.list(req.query);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    async listByEquipment(req, res, next) {
        try {
            const result = await requestService.listByEquipmentId(
                req.params.id,
                req.query,
            );
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    },

    async getById(req, res, next) {
        try {
            const item = await requestService.getById(req.params.id);
            res.status(200).json({ data: item });
        } catch (error) {
            next(error);
        }
    },

    async create(req, res, next) {
        try {
            const item = await requestService.create(req.body);
            res.status(201)
                .location(`/api/requests/${item.id}`)
                .json({ data: item });
        } catch (error) {
            next(error);
        }
    },

    async update(req, res, next) {
        try {
            const item = await requestService.update(req.params.id, req.body);
            res.status(200).json({ data: item });
        } catch (error) {
            next(error);
        }
    },

    async changeStatus(req, res, next) {
        try {
            const item = await requestService.changeStatus(
                req.params.id,
                req.body.status,
            );
            res.status(200).json({ data: item });
        } catch (error) {
            next(error);
        }
    },

    async remove(req, res, next) {
        try {
            await requestService.remove(req.params.id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    },
};
