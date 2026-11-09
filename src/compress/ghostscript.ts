export const PRESETS = ['screen', 'ebook', 'printer'] as const;

export type Preset = (typeof PRESETS)[number];

type GhostscriptModule = {
  FS: {
    writeFile(path: string, data: Uint8Array): void;
    readFile(path: string): Uint8Array;
  };
  callMain(args: string[]): number;
};

export type GhostscriptFactory = (options: {
  noInitialRun: boolean;
  print: (line: string) => void;
  printErr: (line: string) => void;
}) => Promise<GhostscriptModule>;

export type CompressResult = {
  output: Uint8Array;
  inputSize: number;
  outputSize: number;
  usedOriginal: boolean;
};

export async function compressPdf({
  input,
  preset,
  createModule,
}: {
  input: Uint8Array;
  preset: Preset;
  createModule: GhostscriptFactory;
}): Promise<CompressResult> {
  const log: string[] = [];
  const gs = await createModule({
    noInitialRun: true,
    print: (line) => log.push(line),
    printErr: (line) => log.push(line),
  });

  gs.FS.writeFile('/in.pdf', input);
  const exitCode = gs.callMain([
    '-sDEVICE=pdfwrite',
    '-dCompatibilityLevel=1.5',
    `-dPDFSETTINGS=/${preset}`,
    '-dDetectDuplicateImages=true',
    '-dCompressFonts=true',
    '-dNOPAUSE',
    '-dBATCH',
    '-dQUIET',
    '-sOutputFile=/out.pdf',
    '/in.pdf',
  ]);
  if (exitCode !== 0) {
    throw new Error(`Ghostscript failed (exit ${exitCode}): ${log.slice(-5).join('\n') || 'no output'}`);
  }

  const compressed = gs.FS.readFile('/out.pdf');
  const usedOriginal = compressed.byteLength >= input.byteLength;
  const output = usedOriginal ? input : compressed;
  return { output, inputSize: input.byteLength, outputSize: output.byteLength, usedOriginal };
}
