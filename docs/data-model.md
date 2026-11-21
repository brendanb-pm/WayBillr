# Ledger data model (24 positions preserved)

The pilot writes exactly 24 values at a reserved row, in this order. Duplicate parsed date positions are intentional and preserved. Missing extracted information remains blank. The status is always `Action Required: Review` during the pilot; human comparison to the original is mandatory before accounting. The table records the baseline field lineage with updated pilot behavior.

| # | Field / value | Source classification | Requiredness / validation visible in source |
|---:|---|---|---|
| 1 | submission timestamp | derived | persisted UTC ISO timestamp at reservation |
| 2 | sender | source Gmail message | From header, blank if absent; literal text |
| 3 | parsed date | extracted | optional fallback to empty string |
| 4 | `Email Ingestion` | derived constant | always written |
| 5 | archived Drive file URL | derived from Drive persistence | required for a shipment row; failures stay in journal |
| 6 | processing status | derived | always `Action Required: Review` in pilot |
| 7 | waybill number | extracted | blank and flagged if missing |
| 8 | parsed date (duplicate) | extracted | optional fallback to empty string |
| 9 | carrier | extracted | optional fallback to empty string |
| 10 | payment type | extracted | optional fallback to empty string |
| 11 | shipper name | extracted | optional fallback to empty string |
| 12 | shipper address | extracted | optional fallback to empty string |
| 13 | ship-to name | extracted | optional fallback to empty string |
| 14 | ship-to address | extracted | optional fallback to empty string |
| 15 | pieces | extracted | optional fallback to empty string |
| 16 | description | extracted | optional fallback to empty string |
| 17 | driver code | extracted | optional fallback to empty string |
| 18 | weight | extracted | optional fallback to empty string |
| 19 | base amount | extracted | optional fallback to empty string |
| 20 | FSC | extracted | optional fallback to empty string |
| 21 | GST | extracted | optional fallback to empty string |
| 22 | total amount | extracted | optional fallback to empty string |
| 23 | signature detected | derived from extracted boolean | `Yes` or `No` |
| 24 | extraction issues | derived from extracted issues array | joined with `; `; deterministic flags and mandatory human-review reminder |

The Gemini request defines 19 extracted properties: waybill number, date, carrier, payment type, shipper name/address, ship-to name/address, pieces, description, driver code, weight, base amount, FSC, GST, total amount, signature presence, confidence, and issues. A strict response schema is requested. Deterministic validation checks types and lengths; missing waybill/date/shipper/recipient/total, impossible dates, unclear numeric/payment values, absent signatures and low confidence are flagged. Extracted values are never authoritative accounting approval.

Invalid extractions and provider failures remain in the separate processing journal with source/file references; no fabricated error shipment rows are written. `_WayBillrProcessing` has `Attachment key` and `State JSON`; `_WayBillrInstall` holds an installation fingerprint. These additive tabs do not extend the shipment ledger. See [architecture](architecture.md) for durable state and restart invariants. No in-place migration or mixed baseline/pilot writer is supported.
