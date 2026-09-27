import { reportService } from "../services/reportService.js";

export const reportController = {
    async getSiteSummary(req, res, next) {
        try {
            const data = await reportService.getSiteSummary(req.params.id);
            res.status(200).json({ data });
        } catch (error) {
            next(error);
        }
    },
    async getTechniciansWorkload(req, res, next) {
        try {
            const data = await reportService.getTechniciansWorkload();
            res.status(200).json({ data });
        } catch (error) {
            next(error);
        }
    },
};
