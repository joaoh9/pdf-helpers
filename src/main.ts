import './style.css';
import { PRESETS, type Preset } from './compress/ghostscript';
import type { CompressRequest, CompressResponse } from './compress/worker';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const fileInput = $<HTMLInputElement>('file-input');
const dropzone = $<HTMLLabelElement>('dropzone');
const dropzoneTitle = $('dropzone-title');
const dropzoneHint = $('dropzone-hint');
const presetOptions = $('preset-options');
const compressButton = $<HTMLButtonElement>('compress-button');
const status = $('status');
const result = $('result');
const download = $<HTMLAnchorElement>('download');

let selectedFile: File | undefined;
let downloadUrl: string | undefined;

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
};

presetOptions.innerHTML = (Object.entries(PRESETS) as [Preset, (typeof PRESETS)[Preset]][])
  .map(
    ([value, { label, hint }]) => `
      <label class="preset">
        <input type="radio" name="preset" value="${value}" ${value === 'ebook' ? 'checked' : ''} />
        <span class="preset-label">${label}</span>
        <span class="preset-hint">${hint}</span>
      </label>`,
  )
  .join('');

function showStatus(message: string, kind: 'info' | 'error' = 'info') {
  status.hidden = false;
  status.textContent = message;
  status.dataset.kind = kind;
}

function selectFile(file: File | undefined) {
  result.hidden = true;
  status.hidden = true;
  if (!file) return;
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    selectedFile = undefined;
    compressButton.disabled = true;
    showStatus(`"${file.name}" is not a PDF.`, 'error');
    return;
  }
  selectedFile = file;
  dropzone.classList.add('has-file');
  dropzoneTitle.textContent = file.name;
  dropzoneHint.textContent = `${formatSize(file.size)} · click to choose another`;
  compressButton.disabled = false;
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
    worker.onerror = (event) => resolve({ ok: false, error: event.message || 'The compression worker crashed.' });
    worker.postMessage(request, [request.input.buffer]);
  });
}

compressButton.addEventListener('click', async () => {
  if (!selectedFile) return;
  const file = selectedFile;
  const preset = (document.querySelector<HTMLInputElement>('input[name="preset"]:checked')?.value ?? 'ebook') as Preset;

  compressButton.disabled = true;
  result.hidden = true;
  showStatus('Compressing… the first run downloads the compression engine (~15 MB), later runs are faster.');

  const response = await runCompression({ input: new Uint8Array(await file.arrayBuffer()), preset });
  compressButton.disabled = false;

  if (!response.ok) {
    showStatus(`Could not compress this PDF: ${response.error}`, 'error');
    return;
  }

  if (downloadUrl) URL.revokeObjectURL(downloadUrl);
  downloadUrl = URL.createObjectURL(new Blob([response.output as BlobPart], { type: 'application/pdf' }));
  download.href = downloadUrl;
  download.download = file.name.replace(/\.pdf$/i, '') + '-compressed.pdf';

  const saved = response.inputSize - response.outputSize;
  $('size-before').textContent = formatSize(response.inputSize);
  $('size-after').textContent = formatSize(response.outputSize);
  $('size-saved').textContent = `${formatSize(saved)} (${Math.round((saved / response.inputSize) * 100)}%)`;

  if (response.usedOriginal) {
    showStatus('This PDF is already well optimized — compressing made it bigger, so you get the original back.');
  } else {
    status.hidden = true;
  }
  result.hidden = false;
});
