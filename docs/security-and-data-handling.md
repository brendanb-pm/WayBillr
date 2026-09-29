# Security and data handling

## Baseline boundaries

The source handles potentially sensitive email attachments, extracted shipment details, sender information, Drive URLs, and operational ledger data. The repository contains source only; it does not contain production messages, waybills, images, spreadsheets, extraction output, logs, or credentials.

The committed configuration values are placeholders:

- `YOUR_GEMINI_API_KEY`
- `waybills@examplecompany.com`
- `YOUR_GOOGLE_DRIVE_FOLDER_ID`

They are not live credentials or production identifiers. No secrets were removed from the supplied source because none were present.

## Proven from supplied source

- Attachments are persisted to Drive before extraction success is known.
- The Gemini key is included in the request URL through a source constant.
- Gmail, Drive, Sheets, and outbound HTTP access are direct Apps Script service calls.
- Error text is written to the Apps Script log and included in an error-row status value.
- Driver replies include extracted fields and the Drive archive URL.

## Baseline limitations

The source has no explicit idempotency key or deduplication mechanism, retry/backoff policy, HTTP-status validation before candidate dereference, or structured schema validation after JSON parsing. These are documented observations, not remediated defects in this preservation story.

The `.gitignore` excludes local configuration and document/image artifacts. It does not replace the requirement to review staged content before every commit.

## Not verified externally

Permissions, account ownership, Drive sharing, Gmail retention, deployed secrets, and production data-handling controls were not inspected or changed.
