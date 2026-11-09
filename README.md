# PDF Helpers

Simple PDF tools that run entirely in your browser — files are never uploaded anywhere.

**Live:** https://joaoh9.github.io/pdf-helpers/

## Tools

- **Compress** — shrinks a PDF by downsampling and recompressing its images with [Ghostscript](https://www.ghostscript.com/) compiled to WebAssembly. Three levels: Smallest (72 dpi), Balanced (150 dpi), High quality (300 dpi). If the result would be bigger than the original, you get the original back.

The interface is available in English (en-US), Portuguese (pt-BR) and Spanish (es-ES), picked automatically from your browser language (any `pt-*` → pt-BR, `es-*` → es-ES, anything else → en-US) and switchable from the header. Translations live in `src/i18n/locales/`; `en-US.ts` is the source of truth and the other locales fail type-checking if a key is missing.

Text-only or already-optimized PDFs won't shrink much; scanned and image-heavy PDFs shrink the most.

## Development

```sh
npm install
npm run dev        # local dev server
npm test           # compression tests (runs real Ghostscript WASM in Node)
npm run typecheck
npm run build      # static site in dist/
```

Pushes to `main` deploy to GitHub Pages via `.github/workflows/deploy.yml`.

## License

AGPL-3.0, because the site bundles Ghostscript ([`@jspawn/ghostscript-wasm`](https://github.com/jsscheller/ghostscript-wasm)), which is AGPL-licensed.
