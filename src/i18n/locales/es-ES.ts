import type { Translation } from '../index';

export default {
  meta: {
    title: 'PDF Helpers',
    description: 'Herramientas PDF gratuitas que funcionan por completo en tu navegador. Tus archivos nunca salen de tu dispositivo.',
  },
  nav: {
    tools: 'Herramientas',
    compress: 'Comprimir',
    language: 'Idioma',
  },
  compress: {
    title: 'Comprimir PDF',
    lede: 'Reduce el tamaño de un PDF recomprimiendo sus imágenes. Todo funciona en tu navegador — el archivo nunca se sube.',
    dropTitle: 'Suelta un PDF aquí o haz clic para elegirlo',
    dropHint: 'Un solo archivo, del tamaño que tu dispositivo soporte',
    fileHint: '{{size}} · haz clic para elegir otro',
    notPdf: '«{{name}}» no es un PDF.',
    level: 'Nivel de compresión',
    presets: {
      screen: { label: 'Mínimo tamaño', hint: 'Imágenes a 72 ppp — ideal para leer en pantalla' },
      ebook: { label: 'Equilibrado', hint: 'Imágenes a 150 ppp — buena calidad, mucho más ligero' },
      printer: { label: 'Alta calidad', hint: 'Imágenes a 300 ppp — apto para imprimir' },
    },
    button: 'Comprimir',
    working: 'Comprimiendo… la primera vez se descarga el motor de compresión (~15 MB); las siguientes son más rápidas.',
    failed: 'No se pudo comprimir este PDF: {{error}}',
    workerCrashed: 'El proceso de compresión ha fallado.',
    alreadyOptimized: 'Este PDF ya está bien optimizado — comprimirlo lo hacía más grande, así que recibes el original.',
    original: 'Original',
    compressed: 'Comprimido',
    saved: 'Ahorro',
    download: 'Descargar PDF',
    downloadSuffix: 'comprimido',
  },
  footer: {
    poweredBy: 'Funciona con',
    compiledTo: 'compilado a WebAssembly',
    source: 'Código fuente',
  },
} satisfies Translation;
