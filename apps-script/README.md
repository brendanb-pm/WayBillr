# Jesse pilot installation

This package is source for a **new standalone Apps Script project in Jesse's authorized account**. It is not a deployed service. Complete [live validation](../docs/pilot-validation.md) with synthetic documents before business use. Do not run the old baseline alongside the pilot against the same messages.

## Prerequisites and resource setup

1. Jesse or his authorized administrator approves Gmail read access, Drive/Sheets access, and the Gemini API data handling described in [Gemini setup](../docs/gemini-setup.md). A consumer Gemini subscription does not establish API credentials, quota, billing, or data approval.
2. In Jesse's Gmail, create the user label `WayBillr/Pilot` (or the configured alternative). Do not create an automatic inbox-wide label rule. Apply it only to selected individual messages. Gmail's conversation UI can label every message in a thread: turn conversation view off or verify the exact messages before selecting. Incoming future replies are not eligible merely because the conversation was previously processed.
3. In Jesse's My Drive, create an **empty dedicated folder** with restricted sharing. Copy its ID from the URL. Do not use a shared drive for this pilot; shared-drive behavior has not been qualified. The script stores a non-secret installation fingerprint on the folder and refuses a foreign installation or initially nonempty folder.
4. Create a **new empty Google spreadsheet** with restricted sharing. Copy its ID. Its initial blank tab may remain. Do not import legacy rows. Initialization refuses a nonempty workbook, preserving existing data. This pilot has no migration or automatic import of historical processed markers.
5. Create a new standalone project at [Apps Script](https://script.google.com/) under Jesse's account. Name it WayBillr Pilot. Restrict project editors: editors can read Script Properties and business data.

## Install source and configure

1. Paste [src/Code.gs](src/Code.gs) into the project's `Code.gs`, replacing the blank starter. There are no libraries or other runtime source files.
2. Project Settings: enable showing `appsscript.json`; replace it with [appsscript.json](appsscript.json). Save. Confirm Services lists Gmail v1, Drive v3, and Sheets v4. With a standard Cloud project, enable Gmail API, Google Drive API, and Google Sheets API in that project as well. See [Google's advanced services guide](https://developers.google.com/apps-script/guides/services/advanced).
3. Project Settings → Script Properties: enter the keys from [config.example.json](config.example.json) as **individual string properties**, replacing angle-bracket placeholders only in Google. Do not paste credentials into source, GitHub, screenshots, issue comments, or logs. Choose a unique `TENANT_ID`; set `GEMINI_MODEL` to a model verified in your API project that supports document/image input and structured JSON output (the preserved integration used `gemini-2.5-flash`).
4. Keep `DRY_RUN=true`, `SCHEDULE_ENABLED=false`, and `DATA_HANDLING_APPROVED=false`. Defaults: 20 messages per page, 10 attachment operations per run, 4,000,000 bytes per attachment, a 200-second soft deadline, and 3 attempts. Hard configurable caps: 50 messages/operations, 4,000,000 bytes, 240 seconds, 5 attempts. Supported: PDF, JPEG, PNG, WebP with attachment filenames. HEIC, SVG, ZIP and unnamed inline images are excluded.
5. Run `initializePilot` manually. Review the OAuth consent against [scope rationale](../docs/security-and-data-handling.md). This explicit setup command **does write** the folder fingerprint and three named tabs even though dry-run is enabled. It does not ingest mail, upload documents, call Gemini, or install triggers.
6. Run `validatePilotConfiguration`. Expect `VALID` and dry-run true. Initialization creates `Shipments` (24 columns), `_WayBillrProcessing` (attachment key/JSON journal), `_WayBillrInstall` (binding). It stores `WB_BINDING` in Script Properties. Do not manually remove those records/properties. Interrupted setup can rerun against the same binding.

## Manual first run

1. Send yourself a synthetic PDF/image with invented freight details and apply the pilot label to that individual message. Never put a real document in this repository.
2. Run `processPilotManually` with dry-run true. The execution log should show `dry_run`; it lists/counts selected attachment metadata without downloads, Gemini calls, uploads, ledger writes, journal writes or pagination writes. Dry-run does not validate Gemini credentials or prove full extraction works.
3. Complete the Gemini data/billing review; set `DATA_HANDLING_APPROVED=true`. Only then set `DRY_RUN=false`. Keep scheduling false.
4. Run `processPilotManually`. Confirm one original archive, one shipment row, and journal `DONE`. Compare all 24 cells to the synthetic source. The status is always `Action Required: Review`; no billing or outbound email is performed. Record missing/uncertain fields, never fill them by guessing.
5. Run it again: verify no extra row, archive, or Gemini request. Follow the rest of the [acceptance checklist](../docs/pilot-validation.md), including multiple attachments, duplicate content, label boundaries, failure/recovery, and scope review. Only authorize actual business documents after acceptance.

## Optional hourly schedule

After manual acceptance only: set `SCHEDULE_ENABLED=true` with `DRY_RUN=false` and approval true, then run `enablePilotSchedule`. It creates at most one hourly `processHourlyWaybills` trigger for the current installer. No trigger is created by install, validation, or manual processing. Apps Script triggers execute as their creator. Use one installer account; triggers owned by others may not appear in your trigger list.

To stop: set `SCHEDULE_ENABLED=false` and run `disablePilotSchedule`. Confirm the trigger is absent in the Apps Script Triggers panel and check other authorized installers' trigger lists. A false property blocks this handler for all installers in the project, including old triggers using the same handler name. Manual processing remains available. Set `DRY_RUN=true` to disable manual writes as well. An execution already running may finish; stop/wait for it in Executions before maintenance.

## Troubleshooting and rollback

See [recovery and troubleshooting](../docs/troubleshooting.md). Preserve the journal, binding, row coordinates, original Gmail messages and Drive files. Never clear state to force a retry.

Rollback is a **disable-and-retain** operation: disable scheduling, enable dry-run, wait for active execution to stop, and retain source/data/state for review. Remove account authorizations or rotate/revoke the Gemini API key if access must end. Restore code from the reviewed pilot commit if necessary; do **not** restore the baseline hourly implementation into an active account: it sends replies and uses unread-state processing without durable deduplication. A new customer needs a new project, key, tenant slug, folder and workbook; no shared credentials or data.
