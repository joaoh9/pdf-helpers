import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { deflateSync } from 'node:zlib';
import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import createGhostscript from '@jspawn/ghostscript-wasm/gs.js';
import { compressPdf, type GhostscriptFactory } from './ghostscript';

const wasmModule = new WebAssembly.Module(
  readFileSync(createRequire(import.meta.url).resolve('@jspawn/ghostscript-wasm/gs.wasm')),
);
const createModule: GhostscriptFactory = (options) =>
  createGhostscript({
    ...options,
    instantiateWasm: (imports: WebAssembly.Imports, done: (instance: WebAssembly.Instance) => void) => {
      WebAssembly.instantiate(wasmModule, imports).then(done);
      return {};
    },
  }) as ReturnType<GhostscriptFactory>;

function crc32(bytes: Uint8Array) {
  let crc = ~0;
  for (const byte of bytes) {
    crc ^= byte;
    for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

function chunk(type: string, data: Uint8Array) {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const out = Buffer.alloc(body.length + 8);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), body.length + 4);
  return out;
}

function noisyPng(size: number) {
  const rows = Buffer.alloc(size * (size * 3 + 1));
  let seed = 42;
  for (let y = 0; y < size; y++) {
    const row = y * (size * 3 + 1);
    for (let x = 0; x < size * 3; x++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      rows[row + 1 + x] = ((x + y) & 0xff) ^ (seed & 0x1f);
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 2, 0, 0, 0], 8);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

async function imageHeavyPdf() {
  const doc = await PDFDocument.create();
  const image = await doc.embedPng(noisyPng(1500));
  const page = doc.addPage([595, 842]);
  page.drawImage(image, { x: 0, y: 121, width: 595, height: 595 });
  page.drawText('Compression fixture', { x: 50, y: 800, size: 24 });
  return doc.save();
}

describe('compressPdf', () => {
  it('shrinks an image-heavy PDF and keeps it a valid PDF', async () => {
    const input = await imageHeavyPdf();
    const result = await compressPdf({ input, preset: 'ebook', createModule });

    expect(result.usedOriginal).toBe(false);
    expect(result.outputSize).toBeLessThan(result.inputSize / 2);
    const reloaded = await PDFDocument.load(result.output);
    expect(reloaded.getPageCount()).toBe(1);
  });

  it('returns the original bytes when compression would not help', async () => {
    const doc = await PDFDocument.create();
    doc.addPage();
    const input = await doc.save({ useObjectStreams: true });
    const result = await compressPdf({ input, preset: 'screen', createModule });

    if (result.usedOriginal) expect(result.output).toBe(input);
    expect(result.outputSize).toBeLessThanOrEqual(result.inputSize);
  });

  it('rejects input that is not a PDF', async () => {
    const input = new TextEncoder().encode('definitely not a pdf');
    await expect(compressPdf({ input, preset: 'ebook', createModule })).rejects.toThrow(/Ghostscript failed/);
  });
});
