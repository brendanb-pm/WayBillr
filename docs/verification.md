# Pilot verification evidence

Baseline: `cb58d5f08fe2efc977e67820425644bfbc84a455`. No dependencies installed.
Run from the repository root with Node 22+:

```powershell
node tools/verify.cjs
node --test tests/pilot.test.cjs
git diff --check
```

The static script parses Apps Script V8-compatible JavaScript with `vm.Script`
(Node's `--check Code.gs` rejects the extension), parses manifest/template JSON,
asserts the exact reviewed scopes/services and defaults, and rejects common
credential patterns or Gmail mutation/append-replay APIs. The Node runner uses
synthetic in-memory Gmail/Drive/Sheets/Gemini services. No real document, API key,
account or Google service is accessed.

## Required coverage mapping

| Brief requirement | Deterministic coverage |
|---|---|
| Valid / missing configuration | Initialization/validation, missing-key denial, strict booleans/bounds, API data-approval gate, versioned model IDs |
| Single / multiple attachments | Exact one-row archive path, independent attachment processing, original source identities |
| Repeated message / duplicate attachment | Immutable source replay skip, same bytes across messages with duplicate references, same-name/different-content distinction, unresolved canonical hold |
| Interrupted execution | Before/after all five Sheets persistence boundaries, reconstructing only persisted state on next invocation |
| Partial Drive success | Response lost after upload; failure before upload; reserved ID reused; unknown get cannot authorize creation |
| Partial Sheets success | Final atomic row/DONE response loss, pending payload replay, conflicting row preserved, cached last-row regression |
| Concurrent execution | Reentrant invocation during extraction receives LOCK_BUSY and no duplicate write |
| Gemini failure | 429/backoff, 503/exhaustion, 403/review, transport exceptions, sanitized errors |
| Invalid response | Malformed JSON, invalid boolean type, retained archive, no fabricated error shipment |
| Missing required fields | Missing waybill/amount remain blank and flagged; date/numeric/payment/signature/confidence flags |
| Processing limits | Attachment resume, message/page cursor bound, oversized input rejection, deadline for messages without supported attachments |
| Dry-run | Exact before/after property/sheet snapshots; zero extraction/download/upload/batch/cursor mutation |
| Recovery retry | Same Drive ID and fixed shipment coordinates, no re-extraction of pending payload, finite attempts |
| Ledger integrity | Exactly 24 cells with duplicate date positions, headers/schema drift, literal formula-like data, legacy preservation |
| Tenant isolation | Changed tenant/account/script denial, foreign/nonempty folder denial, separate installation keys/state/credentials |

Independent read-only review is recorded in the build record after remediation.
Final exact counts and static/diff outcomes are recorded there when verification
finishes. The tests verify application behavior against fakes, not Google service
atomicity, advanced-service method compatibility, OAuth grants, billing or actual
model accuracy. See [live acceptance](pilot-validation.md) for the unrun boundary.
