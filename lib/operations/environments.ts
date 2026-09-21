export type DeploymentEnvironment = "local" | "preview" | "staging" | "production";
export interface EnvironmentProfile { key: DeploymentEnvironment; syntheticDataOnly: boolean; isolatedCredentials: boolean; publicTraffic: boolean; canaryRequired: boolean }

export const environmentProfiles: Readonly<Record<DeploymentEnvironment, EnvironmentProfile>> = Object.freeze({
  local: Object.freeze({ key: "local", syntheticDataOnly: true, isolatedCredentials: true, publicTraffic: false, canaryRequired: false }),
  preview: Object.freeze({ key: "preview", syntheticDataOnly: true, isolatedCredentials: true, publicTraffic: false, canaryRequired: false }),
  staging: Object.freeze({ key: "staging", syntheticDataOnly: true, isolatedCredentials: true, publicTraffic: false, canaryRequired: true }),
  production: Object.freeze({ key: "production", syntheticDataOnly: false, isolatedCredentials: true, publicTraffic: true, canaryRequired: true })
});

export function assertWorkerCompatibility(webSchemaVersion: number, workerSchemaVersion: number): void {
  if (!Number.isInteger(webSchemaVersion) || !Number.isInteger(workerSchemaVersion) || webSchemaVersion < 1 || workerSchemaVersion < 1) throw new Error("Schema versions must be positive integers.");
  if (Math.abs(webSchemaVersion - workerSchemaVersion) > 1) throw new Error("Web and worker schema versions are incompatible.");
}
