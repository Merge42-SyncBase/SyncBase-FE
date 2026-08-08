async page => {
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };

  const webURL = await page.evaluate(() => location.origin);
  await page.goto(`${webURL}/documents/new`);
  const storageKey = 'syncbase.upload./documents/new';
  const fileInput = page.locator('#pdf-file');
  await fileInput.setInputFiles('sample-v1.pdf');
  await page.locator('#preflight:not([hidden])').waitFor();
  const firstState = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey);
  assert(firstState?.key, 'first preflight did not persist a request key');
  assert(firstState?.sha256?.length === 64, 'first preflight did not persist a PDF SHA-256');
  assert(firstState.submitted === false, 'preflight-only request was marked submitted');

  await fileInput.setInputFiles('sample-v2.pdf');
  await page.waitForFunction(
    ([key, previousRequestKey, previousSHA256]) => {
      const state = JSON.parse(localStorage.getItem(key));
      const submit = document.querySelector('#submit-upload');
      return state?.key !== previousRequestKey && state?.sha256 !== previousSHA256 &&
        state?.submitted === false && submit?.disabled === false;
    },
    [storageKey, firstState.key, firstState.sha256],
  );
  const secondState = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey);
  const hiddenRequestKey = await page.locator('#request-key').inputValue();
  const documentName = await page.locator('#document-name').inputValue();
  assert(secondState.key !== firstState.key, 'replacing a preflight PDF reused the old request key');
  assert(secondState.sha256 !== firstState.sha256, 'replacing a preflight PDF kept the old hash');
  assert(hiddenRequestKey === secondState.key, 'submitted form key does not match persisted recovery key');
  assert(documentName === 'sample-v2', `replacement kept the stale suggested name ${documentName}`);
  await page.screenshot({path: 'upload-file-replacement.png', fullPage: true});

  let recoveryCalls = 0;
  await page.route('**/api/uploads/recovery?**', async route => {
    recoveryCalls += 1;
    const body = recoveryCalls <= 2
      ? {status: 'pending'}
      : {status: 'accepted', documentUrl: '/documents'};
    await route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify(body)});
  });
  await page.evaluate(key => {
    localStorage.setItem(key, JSON.stringify({
      key: 'playwright-pending-recovery',
      sha256: 'a'.repeat(64),
      createdAt: Date.now(),
      submitted: true,
    }));
  }, storageKey);

  await page.reload();
  await page.locator('#upload-recovery:not([hidden])').waitFor();
  await page.getByText('등록 승인을 처리하고 있습니다', {exact: false}).waitFor();
  await page.screenshot({path: 'upload-pending-recovery.png', fullPage: true});
  await page.waitForURL(url => url.pathname === '/documents', {timeout: 15_000});
  assert(recoveryCalls >= 3, `pending recovery stopped after ${recoveryCalls} calls`);
  const retainedState = await page.evaluate(key => localStorage.getItem(key), storageKey);
  assert(retainedState === null, 'accepted recovery did not clear the upload state');

  await page.screenshot({path: 'upload-recovery-pass.png', fullPage: true});
  return {
    fileReplacement: 'passed',
    pendingRecovery: 'passed',
    recoveryCalls,
  };
}
