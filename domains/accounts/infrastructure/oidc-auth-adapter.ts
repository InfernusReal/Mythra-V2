import { createRemoteJWKSet, jwtVerify } from "jose";
import { errors } from "@/lib/contracts/errors";
import type { ExternalAuthAdapter } from "../application/ports";
import { externalPrincipalSchema, type ExternalPrincipal } from "../domain/identity";

export class OidcAuthAdapter implements ExternalAuthAdapter {
  readonly provider = "oidc";
  private readonly keys;

  constructor(
    jwksUrl: string,
    private readonly issuer: string,
    private readonly audience: string
  ) {
    this.keys = createRemoteJWKSet(new URL(jwksUrl));
  }

  async verifyCredential(credential: string): Promise<ExternalPrincipal> {
    try {
      const { payload } = await jwtVerify(credential, this.keys, { issuer: this.issuer, audience: this.audience });
      return externalPrincipalSchema.parse({
        provider: this.provider,
        subject: payload.sub,
        email: payload.email,
        displayName: payload.name,
        emailVerified: payload.email_verified === true
      });
    } catch {
      throw errors.unauthenticated();
    }
  }
}
