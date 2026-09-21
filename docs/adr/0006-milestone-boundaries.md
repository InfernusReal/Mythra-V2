# ADR 0006: Milestones are cross-cutting plans, not owners

Status: accepted for Sub-gate 5.

## Decision

`Milestone` is an ordered, project-owned planning object with an optional chapter-index range, thread label, advisory word target, soft target date, status, and placeholder flag. It never owns a Chapter. `ChapterMilestoneLink` is the many-to-many association and records one of introduce, develop, escalate, turn, resolve, or custom plus a non-negative progress weight. Multiple semantic roles between the same chapter and milestone are valid; an exact active duplicate is idempotent.

`MilestoneDependency` is a separate directed graph. Only hard, active edges participate in the cycle invariant. Tentative, retired, and soft edges do not block author planning. Service traversal is capped at 5,000 existing hard edges; overflow fails closed with `DEPENDENCY_UNAVAILABLE` rather than silently accepting an unverified hard edge.

Milestone/Thread joins Semantic Zoom as a relevance step between Volume Outline and Chapter Outline. It does not join the ownership ancestor path. Narrative Intent and non-causal Story Reference now accept a same-project Milestone endpoint.

## Projection and write rules

- Ordered ranges are the default view. Dependency and chapter-matrix views are alternatives over the same objects.
- Progress is derived from linked chapter completion ratios and link weights; it is never canonical milestone truth.
- Projection reads cap milestones at 500, displayed edges at 750, and progress inputs at `min(50,000, nodeBudget*100)`. A truncation flag identifies a bounded estimate.
- Scaffold preview is deterministic and ownership-checked. Apply verifies the preview hash and expected structural version in one transaction.
- Rebalancing requires the current active milestone count to match the reviewed allocation count. It updates only range, word, and date allocation fields.
- Creative targets are advisory. No milestone, date, word target, dependency, or progress value blocks manuscript writing.
- Each canonical write stores a full resultant-state `ObjectRevision`, increments `Project.structuralVersion`, and inserts a content-free transactional outbox event. Exact duplicate link/dependency requests return the existing object without a version increment.

## Consequences

A discovery writer can maintain zero milestones. A planner can create placeholders, rebalance reviewed ranges, attach the same chapter to multiple milestones with distinct roles, and model a soft dependency loop. Cross-workspace and cross-project identifiers resolve as not found. Milestone persistence can be rolled back without removing Structure Core or changing chapter prose.
