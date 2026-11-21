# WAYBILLR-PILOT-01 build authority

Baseline: `cb58d5f08fe2efc977e67820425644bfbc84a455` (`main`).
Branch: `feature/waybillr-jesse-pilot-v01`.
Canonical standards: `brendanb-pm/Codex-Standards` at
`79e27cab42c3ed22cb4a0ac28f8f51a1c65d197a`, read directly from verified Git objects.
Loaded core, SECURITY-AUTH, DATA-MIGRATIONS, PRODUCTION-EXTERNAL-SYSTEMS,
AGENTIC-OPERATIONS, AUTONOMOUS-DELIVERY and DELIVERY-CLOSEOUT.

AUTONOMY ELIGIBLE for local implementation, synthetic verification, commit, push,
and PR creation under the user's supplied pilot brief. T3 / High risk: recovery,
credentials, tenancy, and cross-service persistence. No Google deployment,
customer data access, merge, outbound email, or production activation authorized.
GitHub delivery capability is checked separately; missing permissions block only
that step. Remediate understood offline defects within scope; after three failed
attempts at the same unresolved gate, preserve work and report the blocker.

The brief defines all 18 verification categories and the deployment package.
The runtime is Apps Script V8; offline verification uses Node's built-in runner
and synthetic Google-service fakes without additional packages.

Notion search for the exact story identifier returned broad matches, no exact
story record. No authoritative EFF ledger destination was provided. Do not
modify unrelated pages or invent a control plane. Final reconciliation remains
outstanding independently of GitHub pilot delivery.

Implementation plan: preserve the 24 fields; replace source constants and Gmail
mutation with validated Script Properties and read-only message-label selection;
add locked durable attachment state, preallocated Drive IDs, atomic fixed-row
Sheets writes, bounded extraction and redacted logs; verify failure/restart and
privacy invariants; package installation/rollback; independently review; deliver
the branch and PR. Google live checks remain operator acceptance.

## Offline acceptance (2026-11-21)

- `node tools/verify.cjs`: PASS (syntax, manifest/scopes/services, defaults, forbidden mutation/credential patterns).
- `node --test tests/pilot.test.cjs`: **57 passed, 0 failed**, no skipped/cancelled tests.
- `git diff --check`: PASS (Windows line-ending notices only).
- Independent read-only verifier: **PASS**, no remaining actionable blockers.
  It independently reran the 57 tests/static/diff checks and reviewed installation,
  manifest, scope rationale and recovery boundaries.
- Four independent-review findings were remediated: dotted Gemini model IDs;
  cached SpreadsheetApp row allocation; deadline checks for messages without
  supported attachments; and the advanced Drive metadata-update null-media
  argument. Regression tests/mock contracts now cover each.
- Source, template, tests, docs and CI reviewed for credentials/customer content.
  Only synthetic fixtures are included; no real Google environment was accessed.
- Live integration: **NOT RUN**. See `pilot-validation.md`; installation readiness
  is distinct from authorization to process business documents or merge/release.

The deployment package is `apps-script/` plus the linked `docs/` procedures.
Changes are limited to pilot runtime/config/manifest, documentation, dependency-free
synthetic verification and its GitHub CI workflow. Canonical standards and
`AGENTS.md` were not changed. No unrelated repository/project was modified.

Remote commit/PR/CI evidence is supplied in the PR and final delivery report after
push; this document does not claim a remote result before it is observed. Notion
and authoritative EFF synchronization remain unavailable without an exact record
and approved ledger destination; the local delivery handoff retains that boundary.
