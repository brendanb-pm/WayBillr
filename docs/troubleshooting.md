# Troubleshooting, recovery and disable

Start by setting `SCHEDULE_ENABLED=false`, running `disablePilotSchedule`, and waiting for any active execution to end. Keep `DRY_RUN=true` during inspection. Do not delete source mail, Drive originals, state records, workbook rows, or `WB_BINDING` to force progress. Do not create an alternative upload manually and erase the original reservation.

| Safe code/symptom | Operator action |
|---|---|
| `CONFIG_*`, `DATA_HANDLING_APPROVAL_REQUIRED` | Correct only the indicated Script Property; use literal lowercase booleans, documented bounds, and real API access approved under current terms. Never publish property values. |
| `LABEL_NOT_FOUND` | Create/check the exact user label in the authorized Gmail account; selection is not an inbox search. |
| `SHEET_CONTRACT` | Stop. Compare the named tab headers and 24-column order against the install package. Preserve all data; do not let initialization migrate a legacy sheet. |
| `INSTALLATION_MISMATCH`, `FOLDER_INSTALLATION_MISMATCH` | Restore the original account/project/resource configuration. For a different customer use entirely fresh resources/project; do not erase fingerprints or reassign a populated folder. |
| `INITIALIZE_REQUIRES_EMPTY_*` | Choose a new empty dedicated destination; retain the old one unchanged. |
| `LOCK_BUSY` | Another invocation is running. Wait for it, inspect Executions, then retry manually. No write occurs on a busy lock. |
| `ATTACHMENT_SIZE`, unsupported MIME | Original stays in Gmail. Select a supported PDF/JPEG/PNG/WebP up to the configured byte cap. Oversized selected attachments stop the run; remove their pilot selection label manually after recording the review decision, then retry other selected documents. Preserve the original. |
| `GEMINI_TRANSIENT`, RETRY | Wait for `nextAt` in the journal and correct provider quota/outage conditions; retry manually. Backoff/attempt budgets apply. No new Drive ID is allocated for that source. |
| `GEMINI_REJECTED`, `EXTRACTION_INVALID`, REVIEW | Inspect the archived source privately. Confirm key/model/billing/schema access or image clarity. No shipment row is created for invalid output. Record the human disposition privately. Do not keep calling the API or invent missing values. |
| `PROVIDER_OUTCOME_UNKNOWN` | A transport/API operation may have succeeded. Preserve all state; retry manually only after inspecting the same installation and waiting for active execution to stop. Normal recovery reconciles persisted IDs/rows; it never blindly appends/uploads with a fresh ID. Repeated failure requires technical review, not state deletion. |
| `DRIVE_RECONCILE_UNKNOWN`, `DRIVE_CONFLICT` | Restore access to the exact reserved file/folder. Verify key/hash metadata, parent, size and trash state. Do not substitute a different file or force a new ID. Source remains in Gmail. |
| `ROW_PENDING` | Extraction payload is already persisted. Retry the same installation; the authoritative Sheets read must show the reserved row empty or equal before the atomic fixed-row transaction can finish. No new Gemini call is needed. |
| `LEDGER_CONFLICT`, `STATE_CORRUPT`, `STATE_TOO_LARGE` | Stop ingestion. A qualified maintainer must reconcile the journal and reserved rows against originals. Do not overwrite conflicting data. Restore a verified backup only under an explicit reconciliation plan. |
| `ATTEMPTS_EXHAUSTED`, REVIEW | Automated retries are held. Fix the cause and obtain a documented human retry decision. For this pilot there is deliberately no public reset/reprocess command; a maintainer may reconcile and repair the existing record only after proving no conflicting shipment or upload, preserving IDs, hashes, rows and attempt history. |
| Duplicate waiting | Find the canonical record by hash; it is not DONE. Resolve that record rather than bypassing the hold with a copy. |
| Gmail stale page token | Stop active runs; remove only `WB_PAGE_TOKEN` in Script Properties. Re-scan selected messages. Durable per-attachment state prevents duplicates. Keep selection stable during a page scan. |
| Timeout or quota exceeded | Lower page/attachment limits, wait for quota reset, and retry. The deadline is soft; a Google call in flight can exceed it. Verify journal/Drive/Sheets before judging the result. |

**Disable/rollback:** set scheduling false, run disable, verify trigger removal for every installer, set dry-run true, and wait/stop active execution. Retain original messages, files, ledger and state. Restrict/revoke authorization and rotate the key when ending access. Restore only a reviewed pilot version compatible with this journal. The preserved baseline automatically replies and lacks these recovery controls; do not activate it on the pilot dataset.
