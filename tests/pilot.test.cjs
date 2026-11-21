const {test} = require('node:test');
const assert = require('node:assert/strict');
const {harness, message, extraction} = require('./harness.cjs');
const live = options => { const h = harness(options); h.initialize(); h.live(); return h; };
test('valid configuration initializes and validates without exposing credentials', () => {
  const h = harness(); h.initialize(); assert.equal(h.run('validatePilotConfiguration').status, 'VALID');
  assert(!JSON.stringify(h.logs).includes(h.props.GEMINI_API_KEY));
});
test('missing configuration fails before Google writes', () => {
  const h = harness(); delete h.props.GEMINI_API_KEY;
  assert.throws(() => h.initialize(), /CONFIG_GEMINI_API_KEY/); assert.equal(h.sheets.length, 0);
});
test('Gemini model IDs permit version dots and reject path/query injection', () => {
  const h = harness({GEMINI_MODEL: 'gemini-2.5-flash'}); h.initialize(); assert.equal(h.run('validatePilotConfiguration').status, 'VALID');
  for (const model of ['../models/other', 'model?key=bad', 'models/gemini', 'model:action']) {
    assert.throws(() => harness({GEMINI_MODEL: model}).initialize(), /CONFIG_GEMINI_MODEL/);
  }
});
test('single attachment produces one archived file and exact 24-column reviewed row', () => {
  const h = live(); h.process(); assert.equal(h.uploads, 1); assert.equal(h.calls, 1);
  assert.equal(h.ledger().length, 1); const row = h.ledger()[0]; assert.equal(row.length, 24);
  assert.equal(row[2], row[7]); assert.equal(row[5], 'Action Required: Review');
  assert.equal(row[6], 'SYNTHETIC-001'); assert.equal(row[22], 'Yes'); assert.equal(h.state()[0].status, 'DONE');
});
test('multiple different attachments remain independent', () => {
  const h = live(); h.messages = [message('m1', ['synthetic A', 'synthetic B'])]; h.process();
  assert.equal(h.ledger().length, 2); assert.equal(h.uploads, 2); assert.equal(h.state().length, 2);
});
test('cached SpreadsheetApp lastRow cannot overwrite reserved state rows', () => {
  const h = live(); h.messages = [message('m1', ['synthetic A', 'synthetic B'])];
  const sheet = h.ss.getSheetByName('_WayBillrProcessing'); const original = sheet.getLastRow.bind(sheet);
  sheet.getLastRow = () => 1; h.process(); sheet.getLastRow = original;
  assert.equal(h.state().length, 2); h.process(); assert.equal(h.ledger().length, 2); assert.equal(h.uploads, 2);
});
test('repeated message processing avoids rows, uploads, API calls and repeat downloads', () => {
  const h = live(); h.process(); h.process(); assert.equal(h.ledger().length, 1);
  assert.equal(h.uploads, 1); assert.equal(h.calls, 1); assert.equal(h.downloads, 1);
});
test('identical bytes across messages deduplicate while preserving both source references', () => {
  const h = live(); h.messages.push(message('m2')); h.process();
  assert.equal(h.uploads, 1); assert.equal(h.ledger().length, 1); assert.equal(h.calls, 1);
  const records = h.state(); assert.equal(records.length, 2); assert.equal(records[1].status, 'DUPLICATE');
  assert.equal(records[1].messageId, 'm2'); assert.equal(records[1].duplicateOf, records[0].key);
});
test('same filename with different content does not falsely deduplicate', () => {
  const h = live(); h.messages.push(message('m2', ['different synthetic bytes'])); h.process(); assert.equal(h.uploads, 2);
});
test('content duplicates wait while canonical document is unresolved', () => {
  const h = live(); h.messages.push(message('m2')); h.httpCode = 429; h.process();
  assert.equal(h.uploads, 1); assert.equal(h.state().length, 1); assert.equal(h.ledger().length, 0);
  h.httpCode = 200; h.tick(); h.process(); assert.equal(h.state()[1].status, 'DUPLICATE'); assert.equal(h.ledger().length, 1);
});
// Every durable boundary is interrupted both before and after the Google mutation.
// A fresh invocation must reconstruct from persisted state, never an in-memory record.
for (const at of [1, 2, 3, 4, 5]) for (const when of ['before', 'after']) {
  test(`interrupted Sheets boundary ${at} ${when}: restart reconciles exactly one row/file`, () => {
    const h = live(); h.fault = {at, when}; assert.throws(() => h.process(), /PROVIDER_OUTCOME_UNKNOWN/);
    h.fault = null; h.tick(); h.process(); h.process();
    assert.equal(h.uploads, 1); assert.equal(h.ledger().length, 1); assert.equal(h.state().length, 1); assert.equal(h.state()[0].status, 'DONE');
  });
}
test('partial Drive success reuses preallocated file ID after response loss', () => {
  const h = live(); h.driveAfter = true; assert.throws(() => h.process(), /PROVIDER_OUTCOME_UNKNOWN/);
  assert.equal(h.files.size, 1); h.tick(); h.process(); assert.equal(h.uploads, 1); assert.equal(h.ledger().length, 1);
});
test('Drive failure before mutation retries the same reserved ID', () => {
  const h = live(); h.driveBefore = true; assert.throws(() => h.process(), /PROVIDER_OUTCOME_UNKNOWN/);
  const id = h.state()[0].fileId; h.tick(); h.process(); assert.equal(h.state()[0].fileId, id); assert.equal(h.uploads, 1);
});
test('unknown Drive reconciliation cannot authorize upload', () => {
  const h = live(); h.driveGetError = '403 Forbidden synthetic'; h.process();
  assert.equal(h.uploads, 0); assert.equal(h.state()[0].code, 'DRIVE_RECONCILE_UNKNOWN');
});
test('overlapping invocation fails lock without writes', () => {
  const h = live(); h.onFetch = () => assert.equal(h.process().status, 'LOCK_BUSY'); h.process();
  assert.equal(h.ledger().length, 1); assert.equal(h.uploads, 1); assert.equal(h.locked, false);
});
test('Gemini rate limit defers and safely retries without another upload', () => {
  const h = live(); h.httpCode = 429; h.process(); assert.equal(h.state()[0].status, 'RETRY');
  h.process(); assert.equal(h.calls, 1); h.httpCode = 200; h.tick(); h.process();
  assert.equal(h.uploads, 1); assert.equal(h.calls, 2); assert.equal(h.ledger().length, 1);
});
test('Gemini 503 is transient; exhausted attempt budget stops retries', () => {
  const h = live({MAX_ATTEMPTS: '2'}); h.httpCode = 503;
  h.process(); h.tick(); h.process(); h.tick(); h.process(); assert.equal(h.calls, 2);
  assert.equal(h.state()[0].status, 'REVIEW'); assert.equal(h.state()[0].code, 'ATTEMPTS_EXHAUSTED');
});
test('Gemini authorization error is held for review without logging response', () => {
  const h = live(); h.httpCode = 403; h.rawResponse = 'SENSITIVE_PROVIDER_BODY'; h.process();
  assert.equal(h.state()[0].status, 'REVIEW'); assert.equal(h.ledger().length, 0);
  assert(!JSON.stringify(h.logs).includes('SENSITIVE_PROVIDER_BODY'));
});
test('malformed extraction is held with original archive intact', () => {
  const h = live(); h.rawResponse = '{broken'; h.process(); h.process();
  assert.equal(h.state()[0].code, 'EXTRACTION_INVALID'); assert.equal(h.files.size, 1); assert.equal(h.ledger().length, 0); assert.equal(h.calls, 1);
});
test('invalid extraction types are rejected', () => {
  const h = live(); h.parsed.signature_present = 'false'; h.process(); assert.equal(h.state()[0].code, 'EXTRACTION_INVALID');
});
test('missing required shipment fields remain blank and flagged', () => {
  const h = live(); delete h.parsed.waybill_number; h.parsed.total_amount = null; h.process();
  const row = h.ledger()[0]; assert.equal(row[6], ''); assert.equal(row[21], '');
  assert.match(row[23], /Missing waybill_number/); assert.match(row[23], /Missing total_amount/);
});
test('uncertain numeric/date/signature/payment values require review', () => {
  const h = live(); Object.assign(h.parsed, {date: '2026-02-30', pieces: '2.5', total_amount: '$1,000', payment_type: 'other', confidence: 'LOW', signature_present: false});
  h.process(); const issues = h.ledger()[0][23];
  for (const text of ['Invalid date', 'Pieces must be an integer', 'Uncertain numeric', 'Uncertain payment', 'Signature not confirmed', 'Low extraction']) assert(issues.includes(text));
});
test('attachment processing limit resumes without skipping remainder of message', () => {
  const h = live({MAX_ATTACHMENTS: '1'}); h.messages = [message('m1', ['synthetic A', 'synthetic B'])];
  assert.equal(h.process().pageComplete, false); assert.equal(h.ledger().length, 1);
  h.process(); assert.equal(h.ledger().length, 2); assert.equal(h.uploads, 2);
});
test('message bound and page token progression are preserved', () => {
  const h = live({MAX_MESSAGES: '1'}); h.messages.push(message('m2', ['synthetic second'])); h.nextPage = 'synthetic-next';
  h.process(); assert.equal(h.ledger().length, 1); assert.equal(h.listOptions.maxResults, 1); assert.equal(h.props.WB_PAGE_TOKEN, 'synthetic-next');
  h.nextPage = null; h.process(); assert.equal(h.listOptions.pageToken, 'synthetic-next'); assert.equal(h.props.WB_PAGE_TOKEN, undefined);
});
test('deadline stops scanning messages even without supported attachments', () => {
  const h = live({MAX_RUN_SECONDS: '1'}); h.messages = [message('m1', []), message('m2', []), message('m3', [])];
  let fetched = 0; h.onGetMessage = () => { fetched++; h.clock += 1500; }; h.nextPage = 'must-not-advance';
  assert.equal(h.process().pageComplete, false); assert.equal(fetched, 1); assert.equal(h.props.WB_PAGE_TOKEN, undefined);
});
test('oversized document fails closed without archive or extraction', () => {
  const h = live({MAX_ATTACHMENT_BYTES: '1'}); assert.throws(() => h.process(), /ATTACHMENT_SIZE/);
  assert.equal(h.uploads, 0); assert.equal(h.calls, 0);
});
test('dry run has zero processing writes, downloads, uploads, extraction or cursor mutation', () => {
  const h = harness(); h.initialize(); h.props.WB_PAGE_TOKEN = 'keep';
  const snapshot = JSON.stringify({props: h.props, sheets: h.sheets}); h.process();
  assert.equal(JSON.stringify({props: h.props, sheets: h.sheets}), snapshot);
  assert.equal(h.batches.length, 0); assert.equal(h.downloads, 0); assert.equal(h.calls, 0); assert.equal(h.uploads, 0);
});
test('tenant configuration change fails binding and cannot initialize over existing data', () => {
  const h = live(); h.process(); h.props.TENANT_ID = 'different-tenant';
  assert.throws(() => h.process(), /INSTALLATION_MISMATCH/); h.props.DRY_RUN = 'true';
  assert.throws(() => h.initialize(), /INSTALLATION_MISMATCH/); assert.equal(h.ledger().length, 1);
});
test('account and script identity changes cannot reuse an installation', () => {
  for (const key of ['account', 'scriptId']) { const h = live(); h[key] = 'different-identity'; assert.throws(() => h.process(), /INSTALLATION_MISMATCH/); }
});
test('folder cannot be shared by a different installation', () => {
  const h = live(); h.folderProperties.waybillrBinding = 'foreign-binding';
  assert.throws(() => h.process(), /FOLDER_INSTALLATION_MISMATCH/); h.props.DRY_RUN = 'true';
  assert.throws(() => h.initialize(), /FOLDER_INSTALLATION_MISMATCH/); assert.equal(h.uploads, 0);
});
test('initialization refuses nonempty destination folder', () => {
  const h = harness(); h.files.set('unrelated', {id: 'unrelated'});
  assert.throws(() => h.initialize(), /INITIALIZE_REQUIRES_EMPTY_FOLDER/); assert.deepEqual(h.folderProperties, {});
});
test('separate tenant installations share no state or credentials', () => {
  const a = live(), b = live({TENANT_ID: 'tenant-two', GEMINI_API_KEY: 'synthetic-key-two'}); a.process(); b.process();
  assert.notEqual(a.state()[0].key, b.state()[0].key); assert.equal(a.calls, 1); assert.equal(b.calls, 1);
  assert.notEqual(a.request.options.headers['x-goog-api-key'], b.request.options.headers['x-goog-api-key']);
});
test('message label recheck rejects unselected message in same conversation', () => {
  const h = live(); h.messages[0].labelIds = ['other-label']; h.process(); assert.equal(h.uploads, 0); assert.equal(h.calls, 0);
});
test('missing Gmail label fails closed', () => {
  const h = live(); h.labels = []; assert.throws(() => h.process(), /LABEL_NOT_FOUND/); assert.equal(h.uploads, 0);
});
test('unsupported attachment MIME is ignored', () => {
  const h = live(); h.messages[0].payload.parts[0].mimeType = 'application/zip'; h.process(); assert.equal(h.uploads, 0);
});
test('ledger header drift fails before any processing', () => {
  const h = live(); h.ss.getSheetByName('Shipments').rows[0][6] = 'changed'; assert.throws(() => h.process(), /SHEET_CONTRACT/); assert.equal(h.uploads, 0);
});
test('corrupt durable attempt budget fails closed rather than allowing unlimited retries', () => {
  const h = live(); h.httpCode = 429; h.process();
  const state = h.ss.getSheetByName('_WayBillrProcessing'); const r = JSON.parse(state.rows[1][1]);
  delete r.attempts; state.rows[1][1] = JSON.stringify(r); h.tick();
  assert.throws(() => h.process(), /STATE_CORRUPT/); assert.equal(h.calls, 1);
});
test('pending payload reconciles without another Gemini call even at exhausted attempt budget', () => {
  const h = live({MAX_ATTEMPTS: '1'}); h.fault = {at: 5, when: 'before'}; assert.throws(() => h.process());
  h.fault = null; h.process(); assert.equal(h.calls, 1); assert.equal(h.ledger().length, 1);
});
test('Drive metadata conflict stops and preserves existing file', () => {
  const h = live(); h.driveAfter = true; assert.throws(() => h.process());
  h.files.values().next().value.appProperties.sha256 = 'tampered'; h.tick(); h.process();
  assert.equal(h.state()[0].code, 'DRIVE_CONFLICT'); assert.equal(h.uploads, 1); assert.equal(h.calls, 0); assert.equal(h.ledger().length, 0);
});
test('incomplete Gemini finish reason is held rather than parsed as complete', () => {
  const h = live(); h.rawResponse = JSON.stringify({candidates: [{finishReason: 'MAX_TOKENS', content: {parts: [{text: JSON.stringify(extraction())}]}}]});
  h.process(); assert.equal(h.state()[0].code, 'EXTRACTION_INVALID'); assert.equal(h.ledger().length, 0);
});
test('valid numeric zero values remain zero, never invented fallback amounts', () => {
  const h = live(); h.parsed.total_amount = 0; h.parsed.gst = '0'; h.process();
  assert.equal(h.ledger()[0][21], '0'); assert.equal(h.ledger()[0][20], '0');
});
test('nonempty legacy workbook is preserved instead of migrated', () => {
  const h = harness(); h.ss.insertSheet('Legacy').getRange(1, 1).setValues([['preserve']]);
  assert.throws(() => h.initialize(), /INITIALIZE_REQUIRES_EMPTY_WORKBOOK/); assert.equal(h.sheets.length, 1);
});
test('pending row conflicting with manual data stops instead of overwriting', () => {
  const h = live(); h.fault = {at: 5, when: 'before'}; assert.throws(() => h.process());
  h.ss.getSheetByName('Shipments').getRange(2, 1).setValues([['manual record']]); h.fault = null;
  assert.throws(() => h.process(), /LEDGER_CONFLICT/); assert.equal(h.ledger()[0][0], 'manual record');
});
test('Sheets writes preserve hostile formula-like text as literal strings', () => {
  const h = live(); h.parsed.shipper_name = '=IMPORTXML("https://example.invalid","x")'; h.process();
  assert.equal(h.ledger()[0][10], h.parsed.shipper_name);
  const u = h.batches.at(-1).requests[0].updateCells.rows[0].values[10].userEnteredValue;
  assert.equal(u.stringValue, h.parsed.shipper_name); assert.equal(u.formulaValue, undefined);
});
test('credentials stay in header and API redirects are disabled', () => {
  const h = live(); h.process(); assert(!h.request.url.includes(h.props.GEMINI_API_KEY));
  assert.equal(h.request.options.followRedirects, false); assert.equal(h.request.options.headers['x-goog-api-key'], h.props.GEMINI_API_KEY);
});
test('scheduling defaults off; enabling is explicit and idempotent; disabling retains data', () => {
  const h = live(); assert.equal(h.run('processHourlyWaybills').status, 'SCHEDULE_DISABLED');
  assert.throws(() => h.run('enablePilotSchedule'), /SCHEDULE_NOT_APPROVED/);
  h.props.SCHEDULE_ENABLED = 'true'; h.run('enablePilotSchedule'); h.run('enablePilotSchedule'); assert.equal(h.triggers.length, 1);
  h.process(); h.run('disablePilotSchedule'); assert.equal(h.triggers.length, 0); assert.equal(h.props.SCHEDULE_ENABLED, 'false'); assert.equal(h.ledger().length, 1);
});
test('strict booleans, bounds and data-handling approval fail closed', () => {
  for (const props of [{DRY_RUN: 'False'}, {MAX_MESSAGES: '0'}, {MAX_RUN_SECONDS: '241'}, {MAX_ATTEMPTS: 'NaN'}, {MAX_ATTACHMENT_BYTES: '4000001'}]) {
    assert.throws(() => harness(props).initialize(), /CONFIG_/);
  }
  const h = harness(); h.initialize(); h.props.DRY_RUN = 'false'; assert.throws(() => h.process(), /DATA_HANDLING_APPROVAL_REQUIRED/);
});
test('redacted operational errors never echo provider message or API key', () => {
  const h = live(); h.fetchError = 'SENSITIVE_PAYLOAD ' + h.props.GEMINI_API_KEY;
  assert.throws(() => h.process(), /^Error: PROVIDER_OUTCOME_UNKNOWN$/);
  assert(!JSON.stringify(h.logs).includes('SENSITIVE_PAYLOAD')); assert(!JSON.stringify(h.logs).includes(h.props.GEMINI_API_KEY));
});
