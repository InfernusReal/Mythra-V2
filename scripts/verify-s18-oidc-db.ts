import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { AuthenticateUser } from "../domains/accounts/application/authenticate";
import { OidcAuthAdapter } from "../domains/accounts/infrastructure/oidc-auth-adapter";
import { PrismaIdentityRepository } from "../domains/accounts/infrastructure/prisma-identity-repository";
import { createSessionToken, readSessionToken } from "../lib/auth/session";
import { createLogger } from "../lib/observability/logger";
import { InMemoryMetricsSink } from "../lib/observability/metrics";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const pair = await generateKeyPair("RS256");
const jwk = { ...await exportJWK(pair.publicKey), kid: "s18-native-key", alg: "RS256", use: "sig" };
const server = createServer((_request, response) => { response.writeHead(200, { "content-type": "application/json" }); response.end(JSON.stringify({ keys: [jwk] })); });
try {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const subject = randomUUID();
  const issuer = "https://s18-identity.example.test";
  const audience = "mythra-s18-native";
  const token = await new SignJWT({ email: `${subject}@example.test`, email_verified: true }).setProtectedHeader({ alg: "RS256", kid: "s18-native-key" }).setIssuer(issuer).setAudience(audience).setSubject(subject).setIssuedAt().setExpirationTime("5m").sign(pair.privateKey);
  const identities = new PrismaIdentityRepository(prisma);
  const authenticate = new AuthenticateUser(new OidcAuthAdapter(`http://127.0.0.1:${address.port}/jwks`, issuer, audience), identities, createLogger({ service: "s18-native-oidc" }), new InMemoryMetricsSink());
  const first = await authenticate.execute(token, randomUUID());
  const second = await authenticate.execute(token, randomUUID());
  assert.equal(first.userId, second.userId);
  assert.equal(first.workspaceId, second.workspaceId);
  assert.notEqual(first.sessionId, second.sessionId);
  const secret = "s18-native-test-only-session-secret-32-characters";
  assert.deepEqual(readSessionToken(createSessionToken(first, secret), secret), { userId: first.userId, workspaceId: first.workspaceId, role: first.role, sessionId: first.sessionId });
  assert.equal(await prisma.externalIdentity.count({ where: { provider: "oidc", providerSubject: subject } }), 1);
  assert.equal(await prisma.workspaceMember.count({ where: { userId: first.userId } }), 1);
  await assert.rejects(authenticate.execute(`${token.slice(0, token.lastIndexOf(".") + 1)}invalid`, randomUUID()), { code: "UNAUTHENTICATED" });
  assert.equal(await prisma.externalIdentity.count({ where: { provider: "oidc", providerSubject: subject } }), 1);
  assert.equal(await identities.findActor(first.userId, randomUUID(), first.sessionId), null);
  await prisma.workspaceMember.update({ where: { workspaceId_userId: { workspaceId: first.workspaceId, userId: first.userId } }, data: { role: "MEMBER" } });
  assert.equal((await identities.findActor(first.userId, first.workspaceId, first.sessionId))?.role, "MEMBER");
  // Console trace S18-DB-003: real identity provisioning and role re-resolution proof emits counts/outcomes only, never provider claims or credentials.
  console.log(JSON.stringify({ level: "info", step: "S18-DB-003", event: "auth.oidc_database_verified", identityCount: 1, membershipCount: 1, freshSessions: true, currentRoleResolved: true, crossWorkspaceRejected: true, tamperedCredentialRejected: true }));
} finally {
  server.closeAllConnections();
  if (server.listening) await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await prisma.$disconnect();
}
