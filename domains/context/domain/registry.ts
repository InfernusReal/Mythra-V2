import type { ContextQuery, ContextFieldDescriptor } from "./types";
import type { ContextSnapshot } from "../application/ports";

export interface ContextProvider {
  readonly id: string;
  produce(snapshot: ContextSnapshot, query: ContextQuery): ContextFieldDescriptor[];
}

export class ContextProviderRegistry {
  private readonly providers = new Map<string, ContextProvider>();
  register(provider: ContextProvider): void {
    if (this.providers.has(provider.id)) throw new Error(`Context provider already registered: ${provider.id}`);
    this.providers.set(provider.id, provider);
  }
  resolve(snapshot: ContextSnapshot, query: ContextQuery): ContextFieldDescriptor[] {
    return [...this.providers.values()].flatMap((provider) => provider.produce(snapshot, query));
  }
  activeProviderIds(): string[] { return [...this.providers.keys()]; }
}
