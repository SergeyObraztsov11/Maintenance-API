import { jest } from "@jest/globals";

const requestRepository = {
    findById: jest.fn(),
    countAssignees: jest.fn(),
    changeStatus: jest.fn(),
};

jest.unstable_mockModule("../../src/repositories/requestRepository.js", () => ({
    requestRepository,
}));

jest.unstable_mockModule("../../src/repositories/equipmentRepository.js", () => ({
    equipmentRepository: {},
}));

jest.unstable_mockModule("../../src/models/index.js", () => ({
    Technician: { findAll: jest.fn() },
}));

const { requestService } = await import("../../src/services/requestService.js");
const { ConflictError } = await import("../../src/errors/ConflictError.js");
const { ForbiddenError } = await import("../../src/errors/ForbiddenError.js");

describe("requestService.changeStatus", () => {
    const requestId = "33333333-3333-3333-3333-333333333333";
    const techId = "44444444-4444-4444-4444-444444444444";

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("allows new -> in_progress when assignees exist", async () => {
        requestRepository.findById.mockResolvedValue({
            id: requestId,
            status: "new",
            assignees: [{ technician: { id: techId } }],
        });
        requestRepository.countAssignees.mockResolvedValue(1);
        requestRepository.changeStatus.mockResolvedValue({
            id: requestId,
            status: "in_progress",
        });

        const result = await requestService.changeStatus(
            requestId,
            "in_progress",
            { role: "admin", technicianId: null },
        );

        expect(result.status).toBe("in_progress");
        expect(requestRepository.changeStatus).toHaveBeenCalled();
    });

    it("rejects invalid transition from done", async () => {
        requestRepository.findById.mockResolvedValue({
            id: requestId,
            status: "done",
            assignees: [],
        });

        await expect(
            requestService.changeStatus(requestId, "new", {
                role: "admin",
                technicianId: null,
            }),
        ).rejects.toBeInstanceOf(ConflictError);
    });

    it("rejects in_progress without assignees", async () => {
        requestRepository.findById.mockResolvedValue({
            id: requestId,
            status: "new",
            assignees: [],
        });
        requestRepository.countAssignees.mockResolvedValue(0);

        await expect(
            requestService.changeStatus(requestId, "in_progress", {
                role: "admin",
                technicianId: null,
            }),
        ).rejects.toMatchObject({
            message: "Cannot set in_progress without assignees",
        });
    });

    it("forbids technician who is not assigned", async () => {
        requestRepository.findById.mockResolvedValue({
            id: requestId,
            status: "new",
            assignees: [{ technician: { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" } }],
        });

        await expect(
            requestService.changeStatus(requestId, "rejected", {
                role: "technician",
                technicianId: techId,
            }),
        ).rejects.toBeInstanceOf(ForbiddenError);
    });

    it("allows assigned technician to change status", async () => {
        requestRepository.findById.mockResolvedValue({
            id: requestId,
            status: "new",
            assignees: [{ technician: { id: techId } }],
        });
        requestRepository.changeStatus.mockResolvedValue({
            id: requestId,
            status: "rejected",
        });

        const result = await requestService.changeStatus(requestId, "rejected", {
            role: "technician",
            technicianId: techId,
        });

        expect(result.status).toBe("rejected");
    });

    it("forbids viewer", async () => {
        requestRepository.findById.mockResolvedValue({
            id: requestId,
            status: "new",
            assignees: [],
        });

        await expect(
            requestService.changeStatus(requestId, "rejected", {
                role: "viewer",
                technicianId: null,
            }),
        ).rejects.toBeInstanceOf(ForbiddenError);
    });
});
