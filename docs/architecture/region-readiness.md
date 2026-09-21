# Region Capability Readiness

`lib/regions/capabilities.ts` is the only S15 region-readiness registry. It reports deployment capability state; it does not assert legal or regulatory compliance.

The global configuration marks currently integrated payment, messaging, storage, and analytics seams as available and keeps future AI unavailable. The China configuration marks payment, messaging, storage, and analytics as `REQUIRES_VERIFICATION`; future AI is `UNAVAILABLE`. Expansion requires independent legal, hosting, data-residency, payment, communications, and model-provider review before any state can change.

Every report fixes `complianceClaimed` to `false`. Callers must not reinterpret readiness as a legal conclusion.
