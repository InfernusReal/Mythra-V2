# Future Agent Evaluation Harness

The S17 harness is deterministic and contains no model integration. Explicit fixtures declare expected and observed finding truth, cited evidence IDs, usefulness, false-positive cost, causal path correctness, attribution correctness, and canonical mutation count. The runner computes exact category coverage and pass/fail results without network access.

The ten frozen categories are continuity, POV knowledge, chronology, intent alignment, character state, usefulness, false-positive cost, causal path correctness, attribution correctness, and authorship preservation. A fixture fails if its finding is wrong, required evidence is missed, false evidence is cited, a category-specific score fails, or a canonical mutation is observed.

These results validate the future evaluation contract only. They make no claim about model quality, and they cannot make a model or agent necessary for deterministic V2 operation.
