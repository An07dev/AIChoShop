/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const loader = require('./test-support/load-ts.cjs');
const media = loader({})('src/lib/media.ts');
test('media paths reject traversal and ambiguous names', () => {
  for (const name of ['../secret.mp4', 'a/secret.mp4', 'a\\secret.mp4', '%2e%2e.mp4', 'a..mp4', 'a.mp4.exe']) assert.equal(media.mediaName(name), false);
  assert.equal(media.mediaName('video_123.mp4'), true);
});
test('video range requests support seeking and suffixes', () => {
  assert.equal(JSON.stringify(media.byteRange('bytes=10-19', 100)), JSON.stringify({ start: 10, end: 19, partial: true }));
  assert.equal(media.byteRange('bytes=-20', 100).start, 80);
  assert.equal(media.byteRange('bytes=90-', 100).end, 99);
  for (const header of ['bytes=100-', 'bytes=20-10', 'bytes=-0', 'bytes=0-1,4-5', 'bytes=-', 'bytes=999999999999999999999-']) assert.equal(media.byteRange(header, 100), null);
});
