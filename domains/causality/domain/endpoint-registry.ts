import { errors } from "@/lib/contracts/errors";
import {
  activeCausalEndpointTypes,
  reservedCausalEndpointTypes,
  type ActiveCausalEndpointType,
  type CausalEndpoint,
  type CausalEndpointType,
} from "./types";

export interface ResolvedCausalEndpoint {
  endpoint: CausalEndpoint;
  projectId: string;
  label: string;
  labelCode?: string;
  labelOrdinal?: number;
  archived: boolean;
  storyTime: number | null;
  discoveryTime: number | null;
}

export interface CausalEndpointAdapter<
  T extends CausalEndpointType = CausalEndpointType,
> {
  readonly type: T;
  readonly availability: "ACTIVE" | "RESERVED";
  resolve(
    projectId: string,
    endpoint: CausalEndpoint & { type: T },
  ): Promise<ResolvedCausalEndpoint>;
}

export class CausalEndpointRegistry {
  private readonly adapters = new Map<
    CausalEndpointType,
    CausalEndpointAdapter
  >();

  constructor(adapters: readonly CausalEndpointAdapter[]) {
    for (const adapter of adapters) {
      if (this.adapters.has(adapter.type))
        throw new Error(`Duplicate causal endpoint adapter: ${adapter.type}`);
      this.adapters.set(adapter.type, adapter);
    }
    for (const type of [
      ...activeCausalEndpointTypes,
      ...reservedCausalEndpointTypes,
    ])
      if (!this.adapters.has(type))
        throw new Error(`Missing causal endpoint adapter: ${type}`);
  }

  availability(type: CausalEndpointType): "ACTIVE" | "RESERVED" {
    return this.adapters.get(type)?.availability ?? "RESERVED";
  }

  async resolve(
    projectId: string,
    endpoint: CausalEndpoint,
  ): Promise<ResolvedCausalEndpoint> {
    const adapter = this.adapters.get(endpoint.type);
    if (!adapter || adapter.availability === "RESERVED") {
      // Console trace S6-ENDPOINT-002: reserved endpoint resolution was rejected with discriminants only.
      console.log(
        JSON.stringify({
          level: "info",
          step: "S6-ENDPOINT-002",
          event: "causality.endpoint_unavailable",
          projectId,
          endpointType: endpoint.type,
          result: "dependency_unavailable",
        }),
      );
      throw errors.dependencyUnavailable();
    }
    const resolved = await adapter.resolve(
      projectId,
      endpoint as CausalEndpoint & { type: ActiveCausalEndpointType },
    );
    // Console trace S6-ENDPOINT-001: active endpoint resolution completed without its authored label or time values.
    console.log(
      JSON.stringify({
        level: "info",
        step: "S6-ENDPOINT-001",
        event: "causality.endpoint_resolved",
        projectId,
        endpointType: endpoint.type,
        endpointId: endpoint.id,
        archived: resolved.archived,
      }),
    );
    return resolved;
  }
}

export function reservedAdapter<T extends CausalEndpointType>(
  type: T,
): CausalEndpointAdapter<T> {
  return {
    type,
    availability: "RESERVED",
    async resolve() {
      throw errors.dependencyUnavailable();
    },
  };
}
