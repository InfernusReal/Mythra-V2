export interface MonthlyCostInputs { writerCount: number; databaseUsd: number; objectStorageUsd: number; bandwidthUsd: number; workerUsd: number; observabilityUsd: number; snapshotCount: number; snapshotBytes: number }
export interface MonthlyCostModel { totalUsd: number; costPerWriterUsd: number; costPerSnapshotUsd: number; averageSnapshotBytes: number }

export function monthlyCostModel(input: MonthlyCostInputs): MonthlyCostModel {
  for (const [key, value] of Object.entries(input)) if (!Number.isFinite(value) || value < 0) throw new Error(`${key} must be a non-negative finite number.`);
  if (!Number.isInteger(input.writerCount) || input.writerCount < 1) throw new Error("writerCount must be a positive integer.");
  if (!Number.isInteger(input.snapshotCount)) throw new Error("snapshotCount must be an integer.");
  const totalUsd = input.databaseUsd + input.objectStorageUsd + input.bandwidthUsd + input.workerUsd + input.observabilityUsd;
  return { totalUsd, costPerWriterUsd: totalUsd / input.writerCount, costPerSnapshotUsd: input.snapshotCount ? totalUsd / input.snapshotCount : 0, averageSnapshotBytes: input.snapshotCount ? input.snapshotBytes / input.snapshotCount : 0 };
}
