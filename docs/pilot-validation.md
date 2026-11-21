# Live pilot acceptance checklist — NOT RUN

Owner: Jesse / authorized Google administrator. Record evidence privately in the customer's environment. No live Google account, business document or production configuration was accessed during this build. Mock results are separate from these requirements.

- [ ] Review PR/source and authorize installation; confirm correct Apps Script project/account, dedicated empty My Drive folder/workbook and restricted editors/sharing.
- [ ] Verify Gemini API access, selected model, structured-output support, billing/quota, region, retention/data-sharing settings and approval record. Confirm consumer subscription is not used as API access evidence.
- [ ] Review consent scopes. Confirm Gmail is readonly and no send/modify authorization is requested; acknowledge broad Drive/Sheets scopes with application resource restrictions.
- [ ] Install source/manifest, enable advanced services/APIs, set string Script Properties with dry-run true and schedule false. Confirm initialization only creates expected tabs and folder binding.
- [ ] Run validation. Check exact 24 headers, immutable journal/binding tabs, and private log codes. Configure protective sharing/tab permissions and filter views; do not sort ingestion rows.
- [ ] Send/select synthetic messages only. Test a labeled message beside an unlabeled message in the same thread. Verify only explicitly labeled message attachments are eligible; no read/unread change, send, deletion, label write or unrelated resource change occurs.
- [ ] Run dry-run and independently confirm no document download/extraction/upload/ledger/journal/cursor write, API consumption or trigger. Explicit initialization writes are expected and separate.
- [ ] Approve data handling, turn dry-run off manually, process one synthetic PDF. Compare all 24 fields against source, original Drive bytes and Gmail reference. Every row requires human review; blanks/uncertainty must remain visible.
- [ ] Repeat the exact source: one shipment/archive and no extra extraction. Resend identical bytes: separate duplicate source record, same canonical archive/row. Use same filename/different bytes: distinct records. Confirm deduplication policy matches intended pilot workflow.
- [ ] Test multiple attachments, JPEG/PNG/WebP and a multi-page PDF within limits. Unsupported/oversized documents remain available in Gmail. No multi-photo shipment aggregation is claimed.
- [ ] Test missing signature, missing required fields, uncertain numeric values, low confidence and invalid/malformed/truncated model output. Confirm review or held journal state and preserved originals.
- [ ] In a synthetic-only installation, interrupt during reservation, upload, extraction/payload persistence and final Sheets write. Wait for termination, rerun, and verify reserved IDs/row state reconcile without extra files/rows. Confirm actual Drive pre-generated ID and Sheets transaction contracts through observed results.
- [ ] Test a provider denial/429/outage with synthetic data; check safe logs, backoff, finite attempts, review hold and recovery. Inspect API request counts privately.
- [ ] Start overlapping invocations; confirm lock skip and one result. Do not share resources across projects. Confirm binding changes fail closed in a separate synthetic installation.
- [ ] Test page, attachment, size and time limits and pagination resume over a stable synthetic selection. Verify progress across more than one page and after clearing only a stale cursor.
- [ ] Only after manual acceptance, opt into hourly scheduling. Verify exactly one owned trigger and approved account; disable it and confirm no further scheduled writes. Check existing baseline/other-installer triggers are absent or blocked.
- [ ] Accept the operational limitations in architecture/troubleshooting, record human reviewer/date, and explicitly authorize the first small business-data pilot batch. Keep accounting approval separate.

Until these are signed off, this is an offline-verified install candidate, not a live-qualified deployment or approval to process customer documents.
