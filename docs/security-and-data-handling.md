# Pilot security and data handling

GitHub contains source, secret-free templates and synthetic tests only. Customer Gmail content, originals, extraction, journal, runtime logs, credentials and resource IDs stay out of GitHub. The runtime stores originals in the dedicated customer Drive folder and shipment/extraction/source audit records in the dedicated workbook. Selected bytes are sent to the Gemini Developer API under its own [terms](https://ai.google.dev/gemini-api/terms); [Gemini approval](gemini-setup.md) is a separate gate.

## Reviewed authorization scopes

| Manifest scope suffix | Purpose / limit |
|---|---|
| `gmail.readonly` | List user labels, account profile and explicitly labeled message payloads/attachment bytes. Does not permit sending, deleting, relabeling or read-state mutation. It grants mailbox-wide read capability; code narrows selection to the configured label. |
| `drive` | Read the manually supplied existing folder, stamp installation metadata, generate IDs, reconcile and create original files in that folder. This simple standalone installer has no Drive Picker/file-selection grant; `drive.file` does not automatically grant access to an arbitrary manually entered folder ID. Full Drive scope is broad: consent must be reviewed and project editors trusted. No delete, share, move or update of document content is implemented. |
| `spreadsheets` | Read/initialize the manually supplied workbook and atomically update shipment/journal tabs. A standalone project with an arbitrary workbook ID needs this scope; no other workbook is queried. |
| `script.external_request` | Call the fixed HTTPS Gemini endpoint through UrlFetchApp. Model ID validation prevents path/query injection; API key goes in the header and redirects are disabled. |
| `script.scriptapp` | Explicitly install/remove this project's optional hourly trigger. No trigger is installed by default. |

No Gmail send/modify, Calendar, Contacts, or external desktop credential scopes. See [Apps Script scopes](https://developers.google.com/apps-script/concepts/scopes) and [Gmail message label selection](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/list). OAuth permits more Drive/Sheets access than this code uses: resource binding and review are application controls, not provider-level sandboxing.

## Isolation and safe operation

Separate Apps Script project, Google authorization, API key/project as appropriate, tenant slug, folder and workbook per customer. Bindings prevent accidental retargeting of an initialized project or reuse of a marked destination. The fingerprint includes the effective Gmail account and script ID. Do not clear binding/state or share installation resources to bypass a mismatch. Simultaneous installers in different projects are not supported; provision serially under one owner. No customer data is fetched during development.

`LockService` excludes concurrent runs of one script. Journal retries reconcile unknown outcomes. Structured logs include event, hashed attachment key and safe error code only; even these are operational metadata and remain private. Exception logging is disabled in the manifest, and the public processing entry point sanitizes thrown provider exceptions. Setup/provider authorization errors can still be shown by Google's own editor UI; never copy raw execution/provider output into public issues.

Script Properties are not a vault against project editors: minimize and audit editors, OAuth grants, folder/workbook sharing and key access. Protect journal/binding/ledger tabs from structural edits and use filter views. Do not sort/insert/delete rows while the pilot owns fixed row coordinates. Store human accounting decisions in a separate controlled workflow. On disable, retain Gmail, Drive originals and journal so recovery remains possible.

Deterministic validation bounds output types/lengths, flags missing required fields, impossible/unclear dates, suspicious numeric/payment values, uncertain signature and low confidence. Cell writes use literal string values, preventing formula execution from sender/model text. All pilot rows require human review regardless of confidence; no email, automatic billing, deletion or read-state writes exist. Source identity and content hashes do not prove a document's truth or authenticity.

## Development checks and remaining boundary

The dependency-free test suite exercises denial paths, cross-tenant/account/script changes, foreign folder binding, unknown outcomes, concurrency, duplicate identities/content, malformed output, and formula injection. Static checks audit scopes, defaults, forbidden Gmail mutations and common secret signatures. A diff/content review is still necessary: pattern scanning cannot prove absence of every secret. The live owner must inspect OAuth consent, sharing, billing/data settings, label boundaries, actual advanced-service behavior, runtime quota and logs before business use. Offline tests do not establish any live result.
