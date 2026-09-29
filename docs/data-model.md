# Current ledger data model

The successful path appends exactly 24 values, in this order. The duplicate parsed date positions are intentional source behavior and are preserved.

| # | Field / value | Source classification | Requiredness / validation visible in source |
|---:|---|---|---|
| 1 | submission timestamp | derived | always constructed; formatted in the successful path |
| 2 | sender | source Gmail message | always read from `message.getFrom()` |
| 3 | parsed date | extracted | optional fallback to empty string |
| 4 | `Email Ingestion` | derived constant | always written |
| 5 | archived Drive file URL | derived from Drive persistence | required for successful row; empty on error row |
| 6 | processing status | derived from extraction flags | `Pending Billing` or `Action Required: Review` |
| 7 | waybill number | extracted | optional fallback to `N/A` |
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
| 24 | extraction issues | derived from extracted issues array | joined with `; ` or `Clean extraction` |

The Gemini prompt requests 19 extracted properties: waybill number, date, carrier, payment type, shipper name/address, ship-to name/address, pieces, description, driver code, weight, base amount, FSC, GST, total amount, signature presence, confidence, and issues. The source directly dereferences the returned candidate and parses JSON; it does not perform an explicit post-parse schema validation.

The error path appends the same intended 24-column width: timestamp, sender, blank/constant error values, followed by blank cells. The source does not declare a separate header schema.
