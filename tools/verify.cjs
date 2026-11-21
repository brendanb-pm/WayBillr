const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const code = fs.readFileSync('apps-script/src/Code.gs', 'utf8');
new vm.Script(code, {filename: 'Code.gs'});
const manifest = JSON.parse(fs.readFileSync('apps-script/appsscript.json', 'utf8'));
assert.equal(manifest.runtimeVersion, 'V8');
assert.deepEqual(manifest.oauthScopes.map(s => s.split('/auth/')[1]).sort(),
  ['drive', 'gmail.readonly', 'script.external_request', 'script.scriptapp', 'spreadsheets'].sort());
assert.deepEqual(manifest.dependencies.enabledAdvancedServices.map(s => s.userSymbol).sort(), ['Drive', 'Gmail', 'Sheets']);
assert(!/GmailApp|MailApp|\.reply\(|markRead|markUnread|\.trash\(|\.delete\(|appendRow\(/.test(code));
assert(!/\?key=|AIza[\w-]{30,}|-----BEGIN.*PRIVATE KEY/.test(code));
const config = JSON.parse(fs.readFileSync('apps-script/config.example.json', 'utf8'));
assert.equal(config.DRY_RUN, 'true'); assert.equal(config.SCHEDULE_ENABLED, 'false');
assert.equal(config.DATA_HANDLING_APPROVED, 'false');
console.log('Static checks PASS: V8 syntax, manifest, scopes, services, no Gmail mutation/append replay, secret patterns, safe defaults.');
