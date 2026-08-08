export const newUploadState = (key, createdAt = Date.now()) => ({
  key,
  sha256: null,
  createdAt,
  submitted: false,
});

export const normalizeUploadState = (stored, replacement) => {
  if (!stored || typeof stored.key !== 'string' || stored.key.length === 0) return replacement;
  const sha256 = typeof stored.sha256 === 'string' && stored.sha256.length > 0 ? stored.sha256 : null;
  return {
    key: stored.key,
    sha256,
    createdAt: Number.isFinite(stored.createdAt) ? stored.createdAt : replacement.createdAt,
    // States written before this field existed are treated conservatively: a
    // bound hash may already have been submitted after an uncertain response.
    submitted: typeof stored.submitted === 'boolean' ? stored.submitted : sha256 !== null,
  };
};

export const bindPreflightHash = (state, sha256, replacement) => {
  if (state.sha256 && state.sha256 !== sha256) {
    if (state.submitted) {
      throw new Error('기존 복구 코드는 다른 PDF hash에 묶여 있습니다. 같은 PDF를 다시 선택하세요.');
    }
    return {...replacement, sha256};
  }
  return {...state, sha256};
};

export const markUploadSubmitted = state => ({...state, submitted: true});

export const recoveryDisposition = status => {
  switch (status) {
    case 'accepted':
      return 'redirect';
    case 'pending':
      return 'poll';
    case 'expired':
      return 'rotate';
    case 'conflict':
      return 'conflict';
    case 'not_committed':
      return 'retry';
    default:
      return 'unknown';
  }
};
