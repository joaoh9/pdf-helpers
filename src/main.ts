import './style.css';
import type { ParseKeys } from 'i18next';
import { PRESETS, type Preset } from './compress/ghostscript';
import type { CompressRequest, CompressResponse } from './compress/worker';
import { LANGUAGES, currentLanguage, formatBytes, i18next, initI18n } from './i18n';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const fileInput = $<HTMLInputElement>('file-input');
const dropzone = $<HTMLLabelElement>('dropzone');
const dropzoneTitle = $('dropzone-title');
const dropzoneHint = $('dropzone-hint');
const presetOptions = $('preset-options');
const compressButton = $<HTMLButtonElement>('compress-button');
const languageSelect = $<HTMLSelectElement>('language-select');
const statusBox = $('status');
const result = $('result');
const download = $<HTMLAnchorElement>('download');

type Status = { kind: 'info' | 'error'; message: () => string };
type Outcome = { fileName: string; inputSize: number; outputSize: number };

let selectedFile: File | undefined;
let status: Status | undefined;
let outcome: Outcome | undefined;
let downloadUrl: string | undefined;

function translateStaticText() {
  const t = i18next.t;
  document.documentElement.lang = currentLanguage();
  document.title = t('meta.title');
  document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.description'));
  for (const element of document.querySelectorAll<HTMLElement>('[data-i18n]')) {
    element.textContent = t(element.dataset.i18n as ParseKeys);
  }
  for (const element of document.querySelectorAll<HTMLElement>('[data-i18n-attr]')) {
    const [attribute, key] = element.dataset.i18nAttr!.split(':');
    element.setAttribute(attribute, t(key as ParseKeys));
  }
}

function renderPresets() {
  const checked = document.querySelector<HTMLInputElement>('input[name="preset"]:checked')?.value ?? 'ebook';
  presetOptions.replaceChildren(
    ...PRESETS.map((preset) => {
      const label = document.createElement('label');
      label.className = 'preset';
      const input = Object.assign(document.createElement('input'), {
        type: 'radio',
        name: 'preset',
        value: preset,
        checked: preset === checked,
      });
      const title = Object.assign(document.createElement('span'), {
        className: 'preset-label',
        textContent: i18next.t(`compress.presets.${preset}.label`),
      });
      const hint = Object.assign(document.createElement('span'), {
        className: 'preset-hint',
        textContent: i18next.t(`compress.presets.${preset}.hint`),
      });
      label.append(input, title, hint);
      return label;
    }),
  );
}

function render() {
  const t = i18next.t;

  dropzone.classList.toggle('has-file', Boolean(selectedFile));
  dropzoneTitle.textContent = selectedFile ? selectedFile.name : t('compress.dropTitle');
  dropzoneHint.textContent = selectedFile
    ? t('compress.fileHint', { size: formatBytes(selectedFile.size) })
    : t('compress.dropHint');

  statusBox.hidden = !status;
  if (status) {
    statusBox.textContent = status.message();
    statusBox.dataset.kind = status.kind;
  }

  result.hidden = !outcome;
  if (outcome) {
    const saved = outcome.inputSize - outcome.outputSize;
    const percent = new Intl.NumberFormat(currentLanguage(), { style: 'percent' }).format(saved / outcome.inputSize);
    $('size-before').textContent = formatBytes(outcome.inputSize);
    $('size-after').textContent = formatBytes(outcome.outputSize);
    $('size-saved').textContent = `${formatBytes(saved)} (${percent})`;
    download.download = `${outcome.fileName.replace(/\.pdf$/i, '')}-${t('compress.downloadSuffix')}.pdf`;
  }
}

function renderAll() {
  translateStaticText();
  renderPresets();
  render();
}

function selectFile(file: File | undefined) {
  if (!file) return;
  outcome = undefined;
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    selectedFile = undefined;
    status = { kind: 'error', message: () => i18next.t('compress.notPdf', { name: file.name }) };
  } else {
    selectedFile = file;
    status = undefined;
  }
  compressButton.disabled = !selectedFile;
  render();
}

fileInput.addEventListener('change', () => selectFile(fileInput.files?.[0]));

for (const type of ['dragenter', 'dragover'] as const) {
  dropzone.addEventListener(type, (event) => {
    event.preventDefault();
    dropzone.classList.add('dragging');
  });
}
for (const type of ['dragleave', 'drop'] as const) {
  dropzone.addEventListener(type, () => dropzone.classList.remove('dragging'));
}
dropzone.addEventListener('drop', (event) => {
  event.preventDefault();
  selectFile(event.dataTransfer?.files[0]);
});

const worker = new Worker(new URL('./compress/worker.ts', import.meta.url), { type: 'module' });

function runCompression(request: CompressRequest) {
  return new Promise<CompressResponse>((resolve) => {
    worker.onmessage = ({ data }: MessageEvent<CompressResponse>) => resolve(data);
    worker.onerror = (event) =>
      resolve({ ok: false, error: event.message || i18next.t('compress.workerCrashed') });
    worker.postMessage(request, [request.input.buffer]);
  });
}

compressButton.addEventListener('click', async () => {
  if (!selectedFile) return;
  const file = selectedFile;
  const preset = (document.querySelector<HTMLInputElement>('input[name="preset"]:checked')?.value ?? 'ebook') as Preset;

  compressButton.disabled = true;
  outcome = undefined;
  status = { kind: 'info', message: () => i18next.t('compress.working') };
  render();

  const response = await runCompression({ input: new Uint8Array(await file.arrayBuffer()), preset });
  compressButton.disabled = false;

  if (!response.ok) {
    const { error } = response;
    status = { kind: 'error', message: () => i18next.t('compress.failed', { error }) };
    render();
    return;
  }

  if (downloadUrl) URL.revokeObjectURL(downloadUrl);
  downloadUrl = URL.createObjectURL(new Blob([response.output as BlobPart], { type: 'application/pdf' }));
  download.href = downloadUrl;

  outcome = { fileName: file.name, inputSize: response.inputSize, outputSize: response.outputSize };
  status = response.usedOriginal
    ? { kind: 'info', message: () => i18next.t('compress.alreadyOptimized') }
    : undefined;
  render();
});

await initI18n();

languageSelect.replaceChildren(
  ...LANGUAGES.map(({ code, name }) => new Option(name, code, false, code === currentLanguage())),
);
languageSelect.addEventListener('change', () => i18next.changeLanguage(languageSelect.value));
i18next.on('languageChanged', renderAll);

renderAll();
