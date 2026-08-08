(() => {
  const region = document.querySelector('#document-status-region');
  if (!region) return;
  let stopped = region.dataset.processing !== 'true';

  const refresh = async () => {
    if (stopped || document.hidden) return;
    try {
      const response = await fetch(location.href, {headers: {'Accept': 'text/html'}, cache: 'no-store'});
      if (!response.ok) return;
      const html = await response.text();
      const nextDocument = new DOMParser().parseFromString(html, 'text/html');
      const next = nextDocument.querySelector('#document-status-region');
      if (!next) return;
      if (next.innerHTML !== region.innerHTML) region.innerHTML = next.innerHTML;
      region.dataset.processing = next.dataset.processing;
      stopped = next.dataset.processing !== 'true';
    } catch (_) {
      // 다음 주기에 실제 서버 상태를 다시 확인한다.
    }
  };
  const timer = setInterval(async () => {
    await refresh();
    if (stopped) clearInterval(timer);
  }, 1500);
})();
