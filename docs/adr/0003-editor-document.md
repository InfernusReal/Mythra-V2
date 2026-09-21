# ADR 0003: Editor adapter and ChapterDocument boundary

Status: Accepted for Phase 1

## Decision

Use a ProseMirror-compatible engine through a Mythra-owned adapter. Domain and persistence code depend only on the versioned `ChapterDocument` contract. Stable block identifiers and invisible reference marks are part of the contract from version 1.

## Consequences

The editor library can be upgraded or replaced without leaking library types into domain services. Application-level document migrations are pure, versioned, and tested independently from SQL migrations. The concrete editor implementation begins at Sub-gate 1.
