const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const htmlSource = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const context = {
  window: { addEventListener() {}, lucide: null },
  document: { getElementById() { return null; } },
  localStorage: { getItem() { return null; }, setItem() {} },
  console,
  Date,
  Math,
  Set,
  Map,
  JSON,
  confirm() { return true; },
  alert() {},
  navigator: {},
};
vm.createContext(context);
vm.runInContext(`${source}\nglobalThis.PromptFactoryAppForTest = PromptFactoryApp;`, context);
const PromptFactoryApp = context.PromptFactoryAppForTest;

function bareApp() {
  return Object.create(PromptFactoryApp.prototype);
}

test('internally generated block IDs always match the safe inline-handler format', () => {
  const app = bareApp();
  const originalNow = Date.now;
  const originalRandom = Math.random;
  try {
    Date.now = () => 12345;
    Math.random = () => 0.5;
    const first = app.createBlockId();
    const second = app.createBlockId([first]);
    assert.ok(/^blk-[A-Za-z0-9_-]{1,120}$/.test(first));
    assert.ok(/^blk-[A-Za-z0-9_-]{1,120}$/.test(second));
    assert.notEqual(first, second);
  } finally {
    Date.now = originalNow;
    Math.random = originalRandom;
  }
});

test('import assigns safe unique IDs instead of trusting JSON IDs', () => {
  const app = bareApp();
  const imported = [
    { id: "x');alert(1)//", title: 'A', content: 'one' },
    { id: 'blk-safe', title: 'B', content: 'two' },
    { id: 'blk-safe', title: 'C', content: 'three' },
  ];
  const normalized = app.sanitizeBlocks(imported);
  assert.equal(normalized.length, 3);
  assert.ok(normalized.every(block => /^blk-[A-Za-z0-9_-]+$/.test(block.id)));
  assert.equal(new Set(normalized.map(block => block.id)).size, 3);
  assert.deepEqual(normalized.map(block => block.content), ['one', 'two', 'three']);
});

test('import rejects records without string titles and contents', () => {
  const app = bareApp();
  const normalized = app.sanitizeBlocks([
    { title: 'valid', content: 'text' },
    { title: '<img>', content: 123 },
    null,
  ]);
  assert.equal(normalized.length, 1);
  assert.equal(normalized[0].title, 'valid');
});

test('no-results search text is escaped before rendering HTML', () => {
  const app = bareApp();
  app.state = { searchQuery: '<img src=x onerror=alert(1)>', blocks: [], selectedIds: [], expandedCards: new Set() };
  let html = '';
  const list = { set innerHTML(value) { html = value; } };
  const badge = { set textContent(value) {} };
  context.document.getElementById = (id) => id === 'blocksList' ? list : badge;
  app.renderCardsList();
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.ok(!html.includes('<img src=x onerror=alert(1)>'));
});

test('HTML escaping neutralizes all quote and tag delimiters', () => {
  const app = bareApp();
  assert.equal(app.escapeHtml(`<'"&>`), '&lt;&#039;&quot;&amp;&gt;');
});

test('application displays both bundled license notices through textContent', () => {
  assert.match(source, /projectLicenseDisplay\.textContent\s*=\s*projectLicenseTemplate\.content\.textContent/);
  assert.match(source, /thirdPartyLicenseDisplay\.textContent\s*=\s*thirdPartyLicenseTemplate\.content\.textContent/);
  assert.match(htmlSource, /id="licenseInfoBtn"/);
  assert.match(htmlSource, /id="licenseInfoPanel"[^>]*role="dialog"/);
});

test('license dialog traps focus and handles Escape outside its panel', () => {
  assert.match(source, /focusableSelectors/);
  assert.match(source, /document\.addEventListener\('keydown'/);
  assert.match(source, /event\.shiftKey/);
});
