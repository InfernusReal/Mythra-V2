import { errors } from "@/lib/contracts/errors";
import type { ExternalAuthAdapter } from "../application/ports";
import { externalPrincipalSchema, type ExternalPrincipal } from "../domain/identity";

export class DevelopmentAuthAdapter implements ExternalAuthAdapter {
  readonly provider = "development";
  constructor(private readonly configured: ExternalPrincipal, private readonly expectedCredential: string) {
    if (process.env.NODE_ENV === "production") throw new Error("DevelopmentAuthAdapter cannot run in production.");
  }

  async verifyCredential(credential: string): Promise<ExternalPrincipal> {
    if (credential !== this.expectedCredential) throw errors.unauthenticated();
    return externalPrincipalSchema.parse(this.configured);
  }
}
