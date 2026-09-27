import { reportRepository } from "../repositories/reportRepository.js";
import { NotFoundError } from "../errors/NotFoundError.js";

export const reportService = {
    async getSiteSummary(siteId) {
        const summary = await reportRepository.getSiteSummary(siteId);
        if (!summary) {
            throw new NotFoundError(`Site ${siteId} not found`);
        }
        return summary;
    },
};
