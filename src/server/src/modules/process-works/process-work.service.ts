import type { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../shared/errors/app-error.js";
import { hasPermission } from "../../shared/http/permissions.js";
import type { RolePermissions } from "../roles/role.types.js";
import type {
	GetProcessWorksQuery,
	GetProcessWorksTableQuery,
	UpdateProcessWorkPayload,
	UpdateProcessWorksPayload,
} from "./process-work.schemas.js";

const processWorkTableSelect = {
	id: true,
	processStepId: true,
	workId: true,
	sortOrder: true,
	count: true,
	tpz: true,
	tsht: true,
	description: true,
	createdAt: true,
	updatedAt: true,
	processStep: {
		select: {
			processOperation: {
				select: {
					process: {
						select: {
							creatorId: true,
							disabledById: true,
						},
					},
				},
			},
		},
	},
	work: {
		select: {
			id: true,
			name: true,
			description: true,
			workGroup: {
				select: {
					id: true,
					name: true,
					operationId: true,
				},
			},
		},
	},
} satisfies Prisma.processWorkSelect;

const processWorkSelect = {
	id: true,
	processStepId: true,
	workId: true,
	sortOrder: true,
	count: true,
	tpz: true,
	tsht: true,
	description: true,
	createdAt: true,
	updatedAt: true,
	processStep: {
		select: {
			id: true,
			name: true,
			sortOrder: true,
			processOperationId: true,
			processOperation: {
				select: {
					id: true,
					processId: true,
					operationId: true,
					operation: {
						select: {
							id: true,
							name: true,
						},
					},
					process: {
						select: {
							id: true,
							name: true,
							productId: true,
							creatorId: true,
							disabledById: true,
						},
					},
				},
			},
		},
	},
	work: {
		select: {
			id: true,
			name: true,
			description: true,
			tpz: true,
			tsht: true,
			workGroupId: true,
			workGroup: {
				select: {
					id: true,
					name: true,
					description: true,
					operationId: true,
					operation: {
						select: {
							id: true,
							name: true,
							operationGroup: {
								select: {
									id: true,
									name: true,
								},
							},
						},
					},
				},
			},
		},
	},
} satisfies Prisma.processWorkSelect;

const processWorkUpdateSelect = {
	id: true,
	processStepId: true,
	workId: true,
	tpz: true,
	tsht: true,
	count: true,
	description: true,
	processStep: {
		select: {
			processOperation: {
				select: {
					process: {
						select: {
							creatorId: true,
							disabledById: true,
						},
					},
				},
			},
		},
	},
} satisfies Prisma.processWorkSelect;

const processStepSelect = {
	id: true,
	processOperation: {
		select: {
			operationId: true,
			process: {
				select: {
					creatorId: true,
					disabledById: true,
				},
			},
		},
	},
} satisfies Prisma.processStepSelect;

const PROCESS_WORK_TABLE_FIELDS = [
	"index",
	"name",
	"tpz",
	"tsht",
	"count",
	"workGroup",
	"description",
] as const;

const PROCESS_WORK_READONLY_TABLE_FIELDS = [
	"index",
	"name",
	"workGroup",
] as const;

const PROCESS_STEP_NOT_FOUND_ERROR = "Этап не найден";
const PROCESS_WORK_NOT_FOUND_ERROR = "Работа этапа не найдена";
const GUIDE_WORK_NOT_FOUND_ERROR = "Работа из справочника не найдена";
const PROCESS_LOCKED_ERROR = "Техпроцесс закрыт для редактирования";
const UPDATE_PROCESS_WORK_NO_RIGHTS_ERROR = "У вас нет прав для редактирования работ этапа";

const parseProcessWorkSearchId = (search?: string) => {
	if (!search || !/^[1-9]\d*$/.test(search)) {
		return null;
	}

	const id = Number(search);

	return Number.isSafeInteger(id) ? id : null;
};

const roundProcessWorkTime = (value: number) => {
	const rounded = Number(value.toFixed(3));

	return Object.is(rounded, -0) ? 0 : rounded;
};

const getUniqueIds = (ids: number[]) => {
	const uniqueIds = new Set<number>();

	return ids.filter((id) => {
		if (uniqueIds.has(id)) {
			return false;
		}

		uniqueIds.add(id);
		return true;
	});
};

const getProcessWorkPermissions = async (actorId: number) => {
	const actor = await prisma.user.findUnique({
		where: { id: actorId },
		select: {
			role: {
				select: {
					permissions: true,
				},
			},
		},
	});

	if (!actor) {
		throw new AppError(404, "Пользователь не найден");
	}

	return actor.role.permissions as RolePermissions;
};

const canEditProcessWorks = (
	permissions: RolePermissions,
	process: { creatorId: number },
	actorId: number,
) => process.creatorId === actorId || hasPermission(permissions, "/products", "editingProcess");

const assertCanEditProcessWorks = (
	permissions: RolePermissions,
	process: { creatorId: number; disabledById: number | null },
	actorId: number,
) => {
	if (process.disabledById !== null) {
		throw new AppError(423, PROCESS_LOCKED_ERROR);
	}

	if (!canEditProcessWorks(permissions, process, actorId)) {
		throw new AppError(403, UPDATE_PROCESS_WORK_NO_RIGHTS_ERROR);
	}
};

const ensureProcessStepExists = async (id: number) => {
	const processStep = await prisma.processStep.findUnique({
		where: { id },
		select: processStepSelect,
	});

	if (!processStep) {
		throw new AppError(404, PROCESS_STEP_NOT_FOUND_ERROR);
	}

	return processStep;
};

const buildProcessWorksTableWhere = (query: GetProcessWorksTableQuery): Prisma.processWorkWhereInput => {
	const filters: Prisma.processWorkWhereInput = {
		processStepId: query.stepId,
	};

	if (query.search) {
		const searchId = parseProcessWorkSearchId(query.search);
		const searchFilters: Prisma.processWorkWhereInput[] = [
			{
				description: {
					contains: query.search,
					mode: "insensitive",
				},
			},
			{
				work: {
					is: {
						name: {
							contains: query.search,
							mode: "insensitive",
						},
					},
				},
			},
			{
				work: {
					is: {
						description: {
							contains: query.search,
							mode: "insensitive",
						},
					},
				},
			},
			{
				work: {
					is: {
						workGroup: {
							is: {
								name: {
									contains: query.search,
									mode: "insensitive",
								},
							},
						},
					},
				},
			},
		];

		if (searchId !== null) {
			searchFilters.unshift(
				{ id: searchId },
				{ workId: searchId },
			);
		}

		filters.OR = searchFilters;
	}

	if (typeof query.workGroupId === "number") {
		filters.work = {
			is: {
				workGroupId: query.workGroupId,
			},
		};
	}

	return filters;
};

const buildProcessWorksTableOrderBy = (
	sorting: GetProcessWorksTableQuery["sorting"],
): Prisma.processWorkOrderByWithRelationInput[] => {
	if (!sorting) {
		return [
			{ sortOrder: "asc" },
			{ id: "asc" },
		];
	}

	switch (sorting.id) {
		case "index":
			return [
				{ sortOrder: sorting.sort },
				{ id: "asc" },
			];
		case "name":
			return [
				{ work: { name: sorting.sort } },
				{ sortOrder: "asc" },
				{ id: "asc" },
			];
		case "workGroup":
			return [
				{ work: { workGroup: { name: sorting.sort } } },
				{ sortOrder: "asc" },
				{ id: "asc" },
			];
		case "tpz":
		case "tsht":
		case "count":
		case "description":
			return [
				{ [sorting.id]: sorting.sort } as Prisma.processWorkOrderByWithRelationInput,
				{ sortOrder: "asc" },
				{ id: "asc" },
			];
		default:
			return [
				{ sortOrder: "asc" },
				{ id: "asc" },
			];
	}
};

const mapSelectedProcessWork = <TWork extends {
	id: number;
	workId: number;
	sortOrder: number;
	count: number;
	tpz: number;
	tsht: number;
	work: {
		name: string;
		workGroup: {
			id: number;
			name: string;
		};
	};
}>(work: TWork) => ({
	id: work.id,
	workId: work.workId,
	name: work.work.name,
	workGroup: work.work.workGroup.name,
	workGroupId: work.work.workGroup.id,
	sortOrder: work.sortOrder,
	count: work.count,
	tpz: roundProcessWorkTime(work.tpz),
	tsht: roundProcessWorkTime(work.tsht),
});

export const getProcessWorksTable = async (
	query: GetProcessWorksTableQuery,
	actorId: number,
) => {
	const processStep = await ensureProcessStepExists(query.stepId);
	const permissions = await getProcessWorkPermissions(actorId);
	const where = buildProcessWorksTableWhere(query);
	const orderBy = buildProcessWorksTableOrderBy(query.sorting);
	const skip = query.page * query.rows;
	const canEdit = canEditProcessWorks(permissions, processStep.processOperation.process, actorId)
		&& processStep.processOperation.process.disabledById === null;
	const [total, works] = await prisma.$transaction([
		prisma.processWork.count({ where }),
		prisma.processWork.findMany({
			where,
			select: processWorkTableSelect,
			orderBy,
			skip,
			take: query.rows,
		}),
	]);

	return {
		total,
		data: works.map((work) => {
			const rowCanEdit = canEdit && work.processStep.processOperation.process.disabledById === null;

			return {
				id: work.id,
				index: work.sortOrder + 1,
				name: work.work.name,
				tpz: roundProcessWorkTime(work.tpz),
				tsht: roundProcessWorkTime(work.tsht),
				count: work.count,
				workGroup: work.work.workGroup.name,
				description: work.description ?? "",
				workId: work.workId,
				workGroupId: work.work.workGroup.id,
				canEdit: rowCanEdit,
				createdAt: work.createdAt,
				updatedAt: work.updatedAt,
				isConst: rowCanEdit ? PROCESS_WORK_READONLY_TABLE_FIELDS : PROCESS_WORK_TABLE_FIELDS,
				isRequired: rowCanEdit ? ["tpz", "tsht", "count"] : [],
			};
		}),
	};
};

export const listProcessWorks = async (query: GetProcessWorksQuery) => {
	await ensureProcessStepExists(query.stepId);

	const works = await prisma.processWork.findMany({
		where: {
			processStepId: query.stepId,
		},
		select: {
			id: true,
			workId: true,
			sortOrder: true,
			count: true,
			tpz: true,
			tsht: true,
			work: {
				select: {
					name: true,
					workGroup: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			},
		},
		orderBy: [
			{ sortOrder: "asc" },
			{ id: "asc" },
		],
	});

	return works.map(mapSelectedProcessWork);
};

export const getProcessWorkById = async (id: number) => {
	const processWork = await prisma.processWork.findUnique({
		where: { id },
		select: processWorkSelect,
	});

	if (!processWork) {
		throw new AppError(404, PROCESS_WORK_NOT_FOUND_ERROR);
	}

	return {
		...processWork,
		tpz: roundProcessWorkTime(processWork.tpz),
		tsht: roundProcessWorkTime(processWork.tsht),
	};
};

export const updateProcessWorks = async (
	processStepId: number,
	data: UpdateProcessWorksPayload,
	actorId: number,
) => {
	const processStep = await ensureProcessStepExists(processStepId);
	const permissions = await getProcessWorkPermissions(actorId);
	assertCanEditProcessWorks(permissions, processStep.processOperation.process, actorId);

	const workIds = getUniqueIds(data.items.map((item) => item.workId));
	if (workIds.length !== data.items.length) {
		throw new AppError(400, "Некорректный список работ");
	}

	const guideWorks = workIds.length
		? await prisma.work.findMany({
				where: {
					id: {
						in: workIds,
					},
					workGroup: {
						is: {
							operationId: processStep.processOperation.operationId,
						},
					},
				},
				select: {
					id: true,
					tpz: true,
					tsht: true,
				},
			})
		: [];

	if (guideWorks.length !== workIds.length) {
		throw new AppError(404, GUIDE_WORK_NOT_FOUND_ERROR);
	}

	const guideWorksById = new Map(guideWorks.map((work) => [work.id, work]));
	const currentWorks = await prisma.processWork.findMany({
		where: { processStepId },
		select: {
			id: true,
			workId: true,
		},
	});
	const nextWorkIds = new Set(workIds);
	const removedWorks = currentWorks.filter((work) => !nextWorkIds.has(work.workId));

	await prisma.$transaction(async (tx) => {
		if (removedWorks.length) {
			await tx.processWork.deleteMany({
				where: {
					id: {
						in: removedWorks.map((work) => work.id),
					},
				},
			});
		}

		for (const [sortOrder, item] of data.items.entries()) {
			const guideWork = guideWorksById.get(item.workId);

			if (!guideWork) {
				throw new AppError(404, GUIDE_WORK_NOT_FOUND_ERROR);
			}

			await tx.processWork.upsert({
				where: {
					processStepId_workId: {
						processStepId,
						workId: item.workId,
					},
				},
				update: {
					sortOrder,
					count: item.count,
				},
				create: {
					processStepId,
					workId: item.workId,
					sortOrder,
					count: item.count,
					tpz: guideWork.tpz,
					tsht: guideWork.tsht,
				},
			});
		}
	});

	return listProcessWorks({ stepId: processStepId });
};

export const updateProcessWork = async (
	id: number,
	data: UpdateProcessWorkPayload,
	actorId: number,
) => {
	const currentProcessWork = await prisma.processWork.findUnique({
		where: { id },
		select: processWorkUpdateSelect,
	});

	if (!currentProcessWork) {
		throw new AppError(404, PROCESS_WORK_NOT_FOUND_ERROR);
	}

	const permissions = await getProcessWorkPermissions(actorId);
	assertCanEditProcessWorks(permissions, currentProcessWork.processStep.processOperation.process, actorId);

	const processWork = await prisma.processWork.update({
		where: { id },
		data: {
			...(data.tpz !== undefined ? { tpz: data.tpz } : {}),
			...(data.tsht !== undefined ? { tsht: data.tsht } : {}),
			...(data.count !== undefined ? { count: data.count } : {}),
			...(data.description !== undefined ? { description: data.description } : {}),
		},
		select: processWorkSelect,
	});

	return {
		...processWork,
		tpz: roundProcessWorkTime(processWork.tpz),
		tsht: roundProcessWorkTime(processWork.tsht),
	};
};
