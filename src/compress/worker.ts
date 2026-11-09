import createGhostscript from '@jspawn/ghostscript-wasm/gs.js';
import wasmUrl from '@jspawn/ghostscript-wasm/gs.wasm?url';
import { compressPdf, type GhostscriptFactory, type Preset } from './ghostscript';

export type CompressRequest = { input: Uint8Array; preset: Preset };
export type CompressResponse =
  | { ok: true; output: Uint8Array; inputSize: number; outputSize: number; usedOriginal: boolean }
  | { ok: false; error: string };

let compiled: Promise<WebAssembly.Module> | undefined;

function loadWasm() {
  compiled ??= WebAssembly.compileStreaming(fetch(wasmUrl)).catch((error) => {
    compiled = undefined;
    throw error;
  });
  return compiled;
}

const createModule: GhostscriptFactory = async (options) => {
  const wasm = await loadWasm();
  return createGhostscript({
    ...options,
    instantiateWasm: (imports: WebAssembly.Imports, done: (instance: WebAssembly.Instance) => void) => {
      WebAssembly.instantiate(wasm, imports).then(done);
      return {};
    },
  }) as ReturnType<GhostscriptFactory>;
};

self.onmessage = async ({ data }: MessageEvent<CompressRequest>) => {
  try {
    const result = await compressPdf({ ...data, createModule });
    const response: CompressResponse = { ok: true, ...result };
    self.postMessage(response, { transfer: [result.output.buffer] });
  } catch (error) {
    const response: CompressResponse = { ok: false, error: error instanceof Error ? error.message : String(error) };
    self.postMessage(response);
  }
};
