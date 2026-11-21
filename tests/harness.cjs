const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const source = fs.readFileSync('apps-script/src/Code.gs', 'utf8');
const clone = x => JSON.parse(JSON.stringify(x));
class Sheet {
  constructor(name, id) { this.name = name; this.id = id; this.rows = []; this.max = 1000; }
  getName() { return this.name; }
  getSheetId() { return this.id; }
  getMaxRows() { return this.max; }
  getLastRow() { return this.rows.reduce((n, row, i) => row.some(v => v !== '') ? i + 1 : n, 0); }
  getLastColumn() { return Math.max(0, ...this.rows.map(row => row.reduce((n, v, i) => v !== '' ? i + 1 : n, 0))); }
  getRange(r, c, nr = 1, nc = 1) {
    return {
      getValues: () => Array.from({length: nr}, (_, i) => Array.from({length: nc}, (_, j) => this.rows[r + i - 1]?.[c + j - 1] ?? '')),
      getValue: () => this.rows[r - 1]?.[c - 1] ?? '',
      setValues: values => {
        values.forEach((row, i) => row.forEach((v, j) => { this.rows[r + i - 1] ||= []; this.rows[r + i - 1][c + j - 1] = v; }));
      }
    };
  }
}
const extraction = () => ({waybill_number: 'SYNTHETIC-001', date: '2026-01-15', carrier: 'Synthetic Carrier', payment_type: 'Prepaid',
  shipper_name: 'Synthetic Sender', shipper_address: '', ship_to_name: 'Synthetic Receiver', ship_to_address: '', pieces: '2',
  description: 'Synthetic freight', driver_code: '', weight: '10', base_amount: '100', fsc: '5', gst: '5', total_amount: '110',
  signature_present: true, confidence: 'HIGH', issues: []});
function message(id = 'm1', contents = ['synthetic document one']) {
  return {id, labelIds: ['pilot-label'], payload: {mimeType: 'multipart/mixed', headers: [{name: 'From', value: 'synthetic@example.invalid'}],
    parts: contents.map((text, i) => ({partId: String(i + 1), filename: 'synthetic.pdf', mimeType: 'application/pdf',
      body: {attachmentId: 'a' + i, size: Buffer.byteLength(text)}, _data: Buffer.from(text).toString('base64url')}))}};
}
function harness(overrides = {}) {
  const h = {props: {TENANT_ID: 'synthetic-tenant', DRIVE_FOLDER_ID: 'synthetic-folder', SPREADSHEET_ID: 'synthetic-sheet',
    GEMINI_API_KEY: 'synthetic-not-a-key', GEMINI_MODEL: 'synthetic-model', ...overrides},
    messages: [message()], files: new Map(), sheets: [], logs: [], batches: [], uploads: 0, calls: 0, downloads: 0,
    lockBusy: false, locked: false, clock: Date.parse('2026-01-15T00:00:00Z'), triggers: [], nextFile: 1,
    fault: null, batchCount: 0, scriptId: 'synthetic-script', account: 'synthetic@example.invalid', httpCode: 200,
    parsed: extraction(), rawResponse: null, nextPage: null, folderProperties: {}};
  h.ss = {getId: () => h.props.SPREADSHEET_ID,
    getSheetByName: name => h.sheets.find(s => s.name === name), getSheets: () => h.sheets,
    insertSheet: name => { const s = new Sheet(name, h.sheets.length + 1); h.sheets.push(s); return s; }};
  h.propsApi = {getProperties: () => ({...h.props}), getProperty: k => h.props[k] ?? null,
    setProperty: (k, v) => { h.props[k] = v; }, deleteProperty: k => { delete h.props[k]; }};
  const FakeDate = class extends Date { constructor(...args) { super(...(args.length ? args : [h.clock])); } static now() { return h.clock; } };
  h.ctx = vm.createContext({console: {log: line => h.logs.push(JSON.parse(line))}, Date: FakeDate,
    PropertiesService: {getScriptProperties: () => h.propsApi},
    LockService: {getScriptLock: () => ({tryLock: () => {
      if (h.lockBusy || h.locked) return false; h.locked = true; return true;
    }, releaseLock: () => { h.locked = false; }})},
    Utilities: {DigestAlgorithm: {SHA_256: 'sha256'}, computeDigest: (_, value) => [...crypto.createHash('sha256').update(typeof value === 'string' ? value : Buffer.from(value)).digest()],
      base64DecodeWebSafe: value => [...Buffer.from(value, 'base64url')], base64Encode: bytes => Buffer.from(bytes).toString('base64'),
      newBlob: (bytes, mime) => ({bytes, mime})},
    ScriptApp: {getScriptId: () => h.scriptId, getProjectTriggers: () => h.triggers,
      newTrigger: handler => ({timeBased: () => ({everyHours: n => ({create: () => h.triggers.push({getHandlerFunction: () => handler, hours: n})})})}),
      deleteTrigger: t => { h.triggers = h.triggers.filter(x => x !== t); }},
    SpreadsheetApp: {openById: id => { if (id !== h.props.SPREADSHEET_ID) throw Error('wrong workbook'); return h.ss; }, flush() {}},
    Gmail: {Users: {getProfile: () => ({emailAddress: h.account}), Labels: {list: () => ({labels: h.labels || [{id: 'pilot-label', name: 'WayBillr/Pilot', type: 'user'}]})},
      Messages: {list: (_, options) => { h.listOptions = options; return {messages: h.messages.slice(0, options.maxResults).map(m => ({id: m.id})), nextPageToken: h.nextPage}; },
        get: (_, id) => { if (h.onGetMessage) h.onGetMessage(); return clone(h.messages.find(m => m.id === id)); },
        Attachments: {get: (_, mid, aid) => { h.downloads++; const m = h.messages.find(m => m.id === mid);
          return {data: m.payload.parts.find(p => p.body.attachmentId === aid)._data}; }}}}},
    Drive: {Files: {get: id => {
      if (id === h.props.DRIVE_FOLDER_ID) return {id, properties: clone(h.folderProperties), mimeType: 'application/vnd.google-apps.folder', capabilities: {canAddChildren: true}};
      if (h.driveGetError) throw Error(h.driveGetError);
      if (!h.files.has(id)) throw Error('File not found: ' + id); return clone(h.files.get(id));
    }, list: () => ({files: [...h.files.values()].map(f => ({id: f.id}))}),
    update: (metadata, id, media, options) => {
      if (media !== null || options?.fields !== 'id') throw Error('Advanced Drive metadata update requires null media argument');
      if (id !== h.props.DRIVE_FOLDER_ID) throw Error('wrong folder');
      h.folderProperties = {...h.folderProperties, ...metadata.properties}; return {id};
    },
    generateIds: () => ({ids: ['synthetic-file-' + h.nextFile++]}), create: (metadata, blob) => {
      if (h.files.has(metadata.id)) throw Error('409 conflict');
      if (h.driveBefore) { h.driveBefore = false; throw Error('Synthetic network failure'); }
      h.uploads++; h.files.set(metadata.id, {...clone(metadata), size: blob.bytes.length});
      if (h.driveAfter) { h.driveAfter = false; throw Error('Synthetic response lost'); } return {id: metadata.id};
    }}},
    UrlFetchApp: {fetch: (url, options) => {
      h.calls++; h.request = {url, options: clone(options)};
      if (h.onFetch) h.onFetch(); if (h.fetchError) throw Error(h.fetchError);
      return {getResponseCode: () => h.httpCode, getContentText: () => h.rawResponse ?? JSON.stringify({candidates: [
        {finishReason: 'STOP', content: {parts: [{text: JSON.stringify(h.parsed)}]}}
      ]})};
    }},
    Sheets: {Spreadsheets: {Values: {get: (id, range) => {
      const match = /^'((?:[^']|'')+)'!A(\d+):X\d+$/.exec(range);
      const s = h.ss.getSheetByName(match[1].replace(/''/g, "'"));
      return {values: [s.rows[Number(match[2]) - 1] || []]};
    }}, batchUpdate: (body, id) => {
      if (id !== h.props.SPREADSHEET_ID) throw Error('wrong workbook');
      h.batchCount++; const fault = h.fault && h.fault.at === h.batchCount ? h.fault : null;
      if (fault?.when === 'before') throw Error('Synthetic batch rejected');
      const draft = h.sheets.map(s => ({sheet: s, rows: clone(s.rows), max: s.max}));
      body.requests.forEach(req => {
        if (req.appendDimension) { const d = req.appendDimension; draft.find(x => x.sheet.id === d.sheetId).max += d.length; return; }
        const u = req.updateCells, target = draft.find(x => x.sheet.id === u.range.sheetId);
        if (!target || u.range.endRowIndex > target.max) throw Error('Invalid range');
        const row = u.range.startRowIndex; target.rows[row] ||= [];
        u.rows[0].values.forEach((v, j) => { const ev = v.userEnteredValue;
          if (ev.formulaValue !== undefined) throw Error('Formula forbidden');
          target.rows[row][j + u.range.startColumnIndex] = ev.stringValue ?? ev.numberValue;
        });
      });
      draft.forEach(x => { x.sheet.rows = x.rows; x.sheet.max = x.max; });
      h.batches.push(clone(body)); if (fault?.when === 'after') throw Error('Synthetic batch response lost'); return {};
    }}}
  });
  vm.runInContext(source, h.ctx);
  h.run = (name, ...args) => h.ctx[name](...args);
  h.initialize = () => h.run('initializePilot');
  h.live = () => { h.props.DRY_RUN = 'false'; h.props.DATA_HANDLING_APPROVED = 'true'; };
  h.process = () => h.run('processPilotManually');
  h.state = () => (h.ss.getSheetByName('_WayBillrProcessing')?.rows.slice(1) || []).map(row => JSON.parse(row[1]));
  h.ledger = () => h.ss.getSheetByName('Shipments').rows.slice(1).filter(row => row.some(v => v !== ''));
  h.tick = () => { h.clock += 4000000; };
  return h;
}
module.exports = {harness, message, extraction, source};
