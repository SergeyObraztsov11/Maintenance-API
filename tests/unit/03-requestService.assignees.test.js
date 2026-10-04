import { jest } from "@jest/globals";

const requestRepository = {
    findById: jest.fn(),
    replaceAssignees: jest.fn(),
};

const Technician = {
    findAll: jest.fn(),
};

jest.unstable_mockModule("../../src/repositories/requestRepository.js", () => ({
    requestRepository,
}));

jest.unstable_mockModule(
    "../../src/repositories/equipmentRepository.js",
    () => ({
        equipmentRepository: {},
    }),
);

jest.unstable_mockModule("../../src/models/index.js", () => ({
    Technician,
}));

const { requestService } = await import("../../src/services/requestService.js");
const { ValidationError } = await import("../../src/errors/ValidationError.js");
const { NotFoundError } = await import("../../src/errors/NotFoundError.js");

describe("requestService.setAssignees", () => {
    const requestId = "33333333-3333-3333-3333-333333333333";
    const tech1 = "44444444-4444-4444-4444-444444444444";
    const tech2 = "44444444-4444-4444-4444-444444444445";

    beforeEach(() => {
        jest.clearAllMocks();
        requestRepository.findById.mockResolvedValue({
            id: requestId,
            status: "new",
        });
    });

    it("requires exactly one lead", async () => {
        await expect(
            requestService.setAssignees(requestId, [
                { technicianId: tech1, role: "member" },
            ]),
        ).rejects.toBeInstanceOf(ValidationError);
    });

    it("rejects duplicate technicians", async () => {
        await expect(
            requestService.setAssignees(requestId, [
                { technicianId: tech1, role: "lead" },
                { technicianId: tech1, role: "member" },
            ]),
        ).rejects.toMatchObject({
            message: "Duplicate technician in crew",
        });
    });

    it("rejects missing technician", async () => {
        Technician.findAll.mockResolvedValue([{ id: tech1 }]);

        await expect(
            requestService.setAssignees(requestId, [
                { technicianId: tech1, role: "lead" },
                { technicianId: tech2, role: "member" },
            ]),
        ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("replaces assignees when crew is valid", async () => {
        Technician.findAll.mockResolvedValue([{ id: tech1 }, { id: tech2 }]);
        requestRepository.replaceAssignees.mockResolvedValue([
            { technicianId: tech1, role: "lead" },
            { technicianId: tech2, role: "member" },
        ]);

        const result = await requestService.setAssignees(requestId, [
            { technicianId: tech1, role: "lead" },
            { technicianId: tech2, role: "member" },
        ]);

        expect(result).toHaveLength(2);
        expect(requestRepository.replaceAssignees).toHaveBeenCalledWith(
            requestId,
            [
                { technicianId: tech1, role: "lead" },
                { technicianId: tech2, role: "member" },
            ],
        );
    });
});
