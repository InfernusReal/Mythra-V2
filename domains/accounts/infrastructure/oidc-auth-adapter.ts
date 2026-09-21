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
      const { payload } = await jwtVerify(credential, this.keys, {
        issuer: this.issuer,
        audience: this.audience,
        requiredClaims: ["iss", "aud", "sub", "exp", "iat"]
      });
      const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
      if (audiences.some((audience) => audience !== this.audience)
        || (payload.azp !== undefined && payload.azp !== this.audience)
        || payload.iat! > Math.floor(Date.now() / 1000)
        || payload.exp! <= payload.iat!) throw errors.unauthenticated();
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
