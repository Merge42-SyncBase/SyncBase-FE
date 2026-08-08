import assert from 'node:assert/strict';
import test from 'node:test';

import {
  bindPreflightHash,
  markUploadSubmitted,
  newUploadState,
  normalizeUploadState,
  recoveryDisposition,
} from '../static/js/upload-state.mjs';

test('a different PDF replaces a preflight-only request key', () => {
  const first = {...newUploadState('first', 1), sha256: 'hash-a'};
  const replacement = newUploadState('second', 2);
  assert.deepEqual(bindPreflightHash(first, 'hash-b', replacement), {
    key: 'second', sha256: 'hash-b', createdAt: 2, submitted: false,
  });
});

test('a submitted request key remains bound to its PDF hash', () => {
  const submitted = markUploadSubmitted({...newUploadState('first', 1), sha256: 'hash-a'});
  assert.throws(
    () => bindPreflightHash(submitted, 'hash-b', newUploadState('second', 2)),
    /같은 PDF/,
  );
});

test('legacy bound states are conservatively treated as submitted', () => {
  const normalized = normalizeUploadState(
    {key: 'legacy', sha256: 'hash-a', createdAt: 1},
    newUploadState('replacement', 2),
  );
  assert.equal(normalized.submitted, true);
});

test('pending recovery keeps polling instead of redirecting', () => {
  assert.equal(recoveryDisposition('accepted'), 'redirect');
  assert.equal(recoveryDisposition('pending'), 'poll');
  assert.equal(recoveryDisposition('not_committed'), 'retry');
});
