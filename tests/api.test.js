const test = require('node:test');
const assert = require('node:assert/strict');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_IDENTIFIER = 'automated.test.visitor@example.com';

const SAMPLE_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);

test('GET /api/config returns 5000ms slide duration and QR code', async () => {
  const res = await fetch(`${BASE_URL}/api/config`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.slideDurationMs, 5000);
  assert.ok(data.uploadUrl.startsWith('http'));
  assert.ok(data.qrDataUrl.startsWith('data:image/png;base64,'));
});

test('POST /api/upload rejects submission without consent', async () => {
  const form = new FormData();
  form.append('name', 'Test User');
  form.append('identifier', TEST_IDENTIFIER);
  form.append('consent', 'false');
  form.append('photos', new Blob([SAMPLE_PNG], { type: 'image/png' }), 'sample.png');

  const res = await fetch(`${BASE_URL}/api/upload`, { method: 'POST', body: form });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /consent/i);
});

test('POST /api/upload rejects invalid non-image file types (.txt)', async () => {
  const form = new FormData();
  form.append('name', 'Test User');
  form.append('identifier', TEST_IDENTIFIER);
  form.append('consent', 'true');
  form.append('photos', new Blob(['hello'], { type: 'text/plain' }), 'notes.txt');

  const res = await fetch(`${BASE_URL}/api/upload`, { method: 'POST', body: form });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.match(data.error, /allowed/i);
});

test('POST /api/upload handles new and returning visitors properly', async () => {
  const form1 = new FormData();
  form1.append('name', 'Automated Tester');
  form1.append('identifier', TEST_IDENTIFIER);
  form1.append('consent', 'true');
  form1.append('photos', new Blob([SAMPLE_PNG], { type: 'image/png' }), 'visit1.png');

  const res1 = await fetch(`${BASE_URL}/api/upload`, { method: 'POST', body: form1 });
  assert.equal(res1.status, 201);
  const data1 = await res1.json();
  assert.equal(data1.isReturning, false);

  const form2 = new FormData();
  form2.append('name', 'Automated Tester');
  form2.append('identifier', TEST_IDENTIFIER.toUpperCase());
  form2.append('consent', 'true');
  form2.append('photos', new Blob([SAMPLE_PNG], { type: 'image/png' }), 'visit2.png');

  const res2 = await fetch(`${BASE_URL}/api/upload`, { method: 'POST', body: form2 });
  assert.equal(res2.status, 201);
  const data2 = await res2.json();
  assert.equal(data2.isReturning, true);
  assert.equal(data2.previousCount, 1);
});

test('DELETE /api/photos deletes visitor data and files', async () => {
  const res = await fetch(`${BASE_URL}/api/photos`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: TEST_IDENTIFIER }),
  });
  assert.equal(res.status, 200);
});
