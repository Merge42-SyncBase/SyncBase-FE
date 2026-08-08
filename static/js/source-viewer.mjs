import {
  getDocument,
  GlobalWorkerOptions,
  TextLayer,
} from '/vendor/pdfjs/pdf.mjs';

GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.mjs';

const pageElement = document.querySelector('#pdf-page');
const canvas = document.querySelector('#pdf-canvas');
const textLayerElement = document.querySelector('#text-layer');
const status = document.querySelector('#viewer-status');
const fallback = document.querySelector('#viewer-fallback');

async function renderExactPage() {
  const pageNumber = Number.parseInt(pageElement.dataset.page, 10);
  const loadingTask = getDocument({url: pageElement.dataset.pdfUrl});
  const documentProxy = await loadingTask.promise;
  if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > documentProxy.numPages) {
    throw new Error('requested PDF page is out of range');
  }
  const page = await documentProxy.getPage(pageNumber);
  const natural = page.getViewport({scale: 1});
  const availableWidth = Math.max(320, pageElement.parentElement.clientWidth - 30);
  const scale = Math.min(1.6, availableWidth / natural.width);
  const viewport = page.getViewport({scale});
  const outputScale = Math.min(window.devicePixelRatio || 1, 2);
  const context = canvas.getContext('2d', {alpha: false});
  canvas.width = Math.floor(viewport.width * outputScale);
  canvas.height = Math.floor(viewport.height * outputScale);
  canvas.style.width = `${Math.floor(viewport.width)}px`;
  canvas.style.height = `${Math.floor(viewport.height)}px`;
  pageElement.style.width = `${Math.floor(viewport.width)}px`;
  pageElement.style.height = `${Math.floor(viewport.height)}px`;
  await page.render({
    canvasContext: context,
    viewport,
    transform: outputScale === 1 ? null : [outputScale, 0, 0, outputScale, 0, 0],
  }).promise;
  const textContent = await page.getTextContent();
  const textLayer = new TextLayer({
    textContentSource: textContent,
    container: textLayerElement,
    viewport,
  });
  await textLayer.render();
  status.hidden = true;
  pageElement.hidden = false;
}

renderExactPage().catch(() => {
  status.hidden = true;
  pageElement.hidden = true;
  fallback.hidden = false;
});
