# WayBillr

WayBillr is an installable, controlled Google Apps Script pilot for explicitly selected Gmail waybills. Google Drive retains originals, Gemini extracts shipment fields, and Google Sheets holds the unchanged 24-column ledger plus a separate durable processing journal. Every pilot row requires human review.

Start with [installation and first run](apps-script/README.md), [Gemini setup](docs/gemini-setup.md), and the [live acceptance checklist](docs/pilot-validation.md). Dry-run is on and scheduling is off by default. No desktop, Docker, database, external runner, or GitHub processing of business documents is required.

Offline developer verification (Node 22+; no packages or credentials required):

```powershell
node tools/verify.cjs
node --test tests/pilot.test.cjs
git diff --check
```

See [architecture and recovery](docs/architecture.md), [data contract](docs/data-model.md), [privacy/scopes](docs/security-and-data-handling.md), and [verification evidence](docs/verification.md). Google integration remains unverified until the operator executes the live checklist. The preservation baseline remains in Git at `cb58d5f08fe2efc977e67820425644bfbc84a455`.
