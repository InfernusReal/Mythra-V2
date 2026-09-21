DROP TABLE IF EXISTS "RecoveryAction";
DROP TABLE IF EXISTS "RateLimitBucket";
DROP TABLE IF EXISTS "OperationalEvent";

-- PostgreSQL enum values are intentionally retained during rollback. Removing enum
-- labels requires a table/type rewrite and is unsafe once audit rows may reference them.
