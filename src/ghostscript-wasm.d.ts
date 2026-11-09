declare module '@jspawn/ghostscript-wasm/gs.js' {
  const createModule: (options: Record<string, unknown>) => Promise<unknown>;
  export default createModule;
}

declare module '@jspawn/ghostscript-wasm/gs.wasm?url' {
  const url: string;
  export default url;
}
