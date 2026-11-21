# Current ingestion flow

The pilot supersedes the preserved unread/reply workflow at baseline
`cb58d5f08fe2efc977e67820425644bfbc84a455`.

1. Validate Script Properties, resource bindings and the exact ledger headers under a script lock.
2. List messages with the configured **user label** through Gmail's read-only API and recheck each message's label before processing.
3. Dry-run counts supported attachment metadata only and performs no ingestion writes or external extraction.
4. For live processing, identify the MIME part/attachment and hash its bytes. Skip completed identities, retain aliases for identical-content resubmissions, and persist new reservations.
5. Reconcile the preallocated Drive ID; retain the original without modifying Gmail.
6. Extract through Gemini using header-held API credentials, strict output schema, and deterministic value validation. Missing fields stay blank. Suspicious values and every pilot row require human review.
7. Persist the exact 24-cell payload, then atomically write its reserved shipment row and DONE journal record. Reconcile uncertain outcomes before retry.
8. Advance the Gmail page cursor only if the page completes; processing/count/time/size/attempt limits bound work.

Failures retain originals and journal evidence; no email is sent, no read/unread state changes, no source deletion, and no error shipment rows. PDFs/JPEG/PNG/WebP attachments are independent units. Multi-photo aggregation, semantic cross-scan deduplication, accounting approval and automatic billing are out of scope. See [architecture](architecture.md) and [operator procedures](../apps-script/README.md).
