import {
  bindPreflightHash,
  markUploadSubmitted,
  newUploadState,
  normalizeUploadState,
  recoveryDisposition,
} from './upload-state.mjs';

(() => {
  const form = document.querySelector('#upload-form');
  if (!form) return;
  const file = document.querySelector('#pdf-file');
  const submit = document.querySelector('#submit-upload');
  const summary = document.querySelector('#preflight');
  const error = document.querySelector('#preflight-error');
  const requestKey = document.querySelector('#request-key');
  const name = document.querySelector('#document-name');
  const recovery = document.querySelector('#upload-recovery');
  const recoveryMessage = document.querySelector('#recovery-message');
  const recoveryCode = document.querySelector('#recovery-code');
  const recoveryUrl = document.querySelector('#recovery-url');
  const storageKey = `syncbase.upload.${location.pathname}`;
  let state;
  let ready = false;
  let submitting = false;
  let preflightHash = null;
  let nameEdited = false;

  const newState = () => newUploadState(crypto.randomUUID());
  const persist = (next) => {
    localStorage.setItem(storageKey, JSON.stringify(next));
    if (localStorage.getItem(storageKey) !== JSON.stringify(next)) {
      throw new Error('요청 키를 안전하게 저장할 수 없어 등록을 차단했습니다.');
    }
    state = next;
    requestKey.value = state.key;
  };
  try {
    const stored = localStorage.getItem(storageKey);
    state = normalizeUploadState(stored ? JSON.parse(stored) : null, newState());
    persist(state);
  } catch (reason) {
    error.textContent = reason.message || '브라우저 저장소를 사용할 수 없습니다.';
    error.hidden = false;
    return;
  }

  const refresh = () => {
    const validName = !name || (name.value.trim().length >= 1 && name.value.trim().length <= 200);
    submit.disabled = submitting || !ready || !validName;
  };
  const showRecovery = (message) => {
    const url = `/api/uploads/recovery?requestKey=${encodeURIComponent(state.key)}`;
    recoveryCode.textContent = state.key;
    recoveryUrl.href = url;
    recoveryMessage.textContent = message;
    recovery.hidden = false;
  };
  const clearState = () => localStorage.removeItem(storageKey);
  const rotateExpiredState = () => {
    persist(newState());
    preflightHash = null;
    ready = false;
    summary.hidden = true;
    showRecovery('이전 복구 코드가 만료되어 새 등록 코드를 만들었습니다. PDF를 다시 선택하세요.');
    refresh();
  };
  const recoverOnce = async () => {
    const response = await fetch(`/api/uploads/recovery?requestKey=${encodeURIComponent(state.key)}`, {
      headers: {'Accept': 'application/json', 'X-SyncBase-Return-To': location.pathname}
    });
	if (response.status === 401) {
	  const result = await response.json();
	  showRecovery('로그인 세션이 만료되었습니다. 복구 코드를 유지한 채 다시 로그인합니다.');
	  location.assign(result.loginUrl);
	  return {status: 'session_expired'};
	}
    if (!response.ok) throw new Error('복구 상태를 확인하지 못했습니다.');
    return response.json();
  };
  const applyRecovery = (result) => {
    switch (recoveryDisposition(result.status)) {
      case 'redirect':
        clearState();
        location.assign(result.documentUrl);
        return true;
      case 'poll':
        submitting = true;
        showRecovery('등록 승인을 처리하고 있습니다. 확정된 문서 주소가 준비될 때까지 자동으로 확인합니다.');
        refresh();
        return false;
      case 'rotate':
        rotateExpiredState();
        return true;
      case 'conflict':
        showRecovery('복구 코드가 다른 등록과 충돌합니다. 기존 등록 결과를 확인하세요.');
        ready = false;
        refresh();
        return true;
      default:
        return false;
    }
  };
  const pollRecovery = async () => {
    showRecovery('응답이 불확실해 서버의 승인 결과를 자동으로 확인하고 있습니다.');
    for (let attempt = 0; attempt < 60; attempt += 1) {
      try {
        const result = await recoverOnce();
        if (applyRecovery(result)) return;
        if (result.status === 'not_committed') {
          showRecovery('아직 승인된 등록이 없습니다. 같은 PDF hash를 확인한 뒤 다시 제출할 수 있습니다.');
          submitting = false;
          refresh();
          return;
        }
      } catch (_) {
        // A transient Web/OpenSQL outage remains in the recovery loop.
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    showRecovery('복구 확인이 계속 지연되고 있습니다. 이 페이지를 유지한 채 다시 확인하세요.');
    submitting = false;
    refresh();
  };

  name?.addEventListener('input', () => {
    nameEdited = true;
    refresh();
  });
  file.addEventListener('change', async () => {
    ready = false;
    preflightHash = null;
    refresh();
    summary.hidden = true;
    error.hidden = true;
    if (!file.files?.length) return;
    const body = new FormData();
    body.append('file', file.files[0]);
    const csrf = document.querySelector('meta[name="_csrf"]')?.content;
    const header = document.querySelector('meta[name="_csrf_header"]')?.content;
    try {
      const response = await fetch('/api/uploads/preflight', {
        method: 'POST', body, headers: {
		  ...(header && csrf ? {[header]: csrf} : {}),
		  'Accept': 'application/json', 'X-SyncBase-Return-To': location.pathname
		}
      });
	  if (response.status === 401) {
		const result = await response.json();
		showRecovery('로그인 세션이 만료되었습니다. 복구 코드는 유지됩니다.');
		location.assign(result.loginUrl);
		return;
	  }
      if (!response.ok) throw new Error('선택한 PDF를 사용할 수 없습니다.');
      const result = await response.json();
      preflightHash = result.sha256;
      persist(bindPreflightHash(state, result.sha256, newState()));
      document.querySelector('#preflight-name').textContent = result.fileName;
      document.querySelector('#preflight-size').textContent = `${(result.byteSize / 1024 / 1024).toFixed(2)} MB`;
      document.querySelector('#preflight-pages').textContent = `${result.pageCount}페이지`;
      if (name && (!name.value.trim() || !nameEdited)) name.value = result.suggestedName;
      file.closest('.upload-dropzone')?.classList.add('has-file');
      summary.hidden = false;
      ready = true;
      refresh();
    } catch (reason) {
      error.textContent = reason.message || 'PDF 사전 검사를 완료하지 못했습니다.';
      error.hidden = false;
    }
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting || !ready || preflightHash !== state.sha256) return;
    try {
      persist(markUploadSubmitted(state));
    } catch (reason) {
      error.textContent = reason.message || '복구 코드를 저장하지 못해 등록을 차단했습니다.';
      error.hidden = false;
      return;
    }
    submitting = true;
    refresh();
    showRecovery('등록 요청을 제출했습니다. 응답이 유실되어도 같은 코드로 결과를 복구합니다.');
    try {
      const response = await fetch(form.action, {method: 'POST', body: new FormData(form), headers: {
		'Accept': 'application/json', 'X-SyncBase-Return-To': location.pathname
	  }});
	  if (response.status === 401) {
		const result = await response.json();
		showRecovery('로그인 세션이 만료되었습니다. 복구 코드는 유지됩니다.');
		location.assign(result.loginUrl);
		return;
	  }
      if (response.ok && response.redirected) {
        clearState();
        location.assign(response.url);
        return;
      }
      if (response.status === 503) {
        showRecovery('처리 대기열이 가득 찼습니다. 파일과 복구 코드를 유지한 채 다시 제출하세요.');
        submitting = false;
        refresh();
        return;
      }
      if (response.status === 409) {
        await pollRecovery();
        return;
      }
      throw new Error('등록 응답을 확인하지 못했습니다.');
    } catch (_) {
      await pollRecovery();
    }
  });

  recoverOnce().then(result => {
    if (!applyRecovery(result) && recoveryDisposition(result.status) === 'poll') void pollRecovery();
  }).catch(() => {});
})();
