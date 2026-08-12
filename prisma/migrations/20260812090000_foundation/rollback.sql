-- Sub-gate 0 rollback. Run only after verifying no later migration depends on these tables.
DROP TABLE IF EXISTS "OutboxEvent";
DROP TABLE IF EXISTS "AuditEvent";
DROP TABLE IF EXISTS "UserPreference";
DROP TABLE IF EXISTS "WorkspaceMember";
DROP TABLE IF EXISTS "Workspace";
DROP TABLE IF EXISTS "ExternalIdentity";
DROP TABLE IF EXISTS "User";
DROP TYPE IF EXISTS "OutboxStatus";
DROP TYPE IF EXISTS "AuditEventKind";
DROP TYPE IF EXISTS "WorkspaceMemberStatus";
DROP TYPE IF EXISTS "WorkspaceRole";
