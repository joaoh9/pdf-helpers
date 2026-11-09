import type { Translation } from '../index';

export default {
  meta: {
    title: 'PDF Helpers',
    description: 'Ferramentas de PDF gratuitas que rodam inteiramente no seu navegador. Seus arquivos nunca saem do seu dispositivo.',
  },
  nav: {
    tools: 'Ferramentas',
    compress: 'Comprimir',
    language: 'Idioma',
  },
  compress: {
    title: 'Comprimir PDF',
    lede: 'Reduza o tamanho de um PDF recomprimindo suas imagens. Tudo roda no seu navegador — o arquivo nunca é enviado.',
    dropTitle: 'Solte um PDF aqui ou clique para escolher',
    dropHint: 'Um arquivo, de qualquer tamanho que seu dispositivo aguente',
    fileHint: '{{size}} · clique para escolher outro',
    notPdf: '"{{name}}" não é um PDF.',
    level: 'Nível de compressão',
    presets: {
      screen: { label: 'Menor tamanho', hint: 'Imagens em 72 dpi — ideal para ler na tela' },
      ebook: { label: 'Equilibrado', hint: 'Imagens em 150 dpi — boa qualidade, bem menor' },
      printer: { label: 'Alta qualidade', hint: 'Imagens em 300 dpi — seguro para impressão' },
    },
    button: 'Comprimir',
    working: 'Comprimindo… na primeira vez o motor de compressão (~15 MB) é baixado; as próximas são mais rápidas.',
    failed: 'Não foi possível comprimir este PDF: {{error}}',
    workerCrashed: 'O processo de compressão travou.',
    alreadyOptimized: 'Este PDF já está bem otimizado — a compressão o deixou maior, então você recebe o original.',
    original: 'Original',
    compressed: 'Comprimido',
    saved: 'Economia',
    download: 'Baixar PDF',
    downloadSuffix: 'comprimido',
  },
  footer: {
    poweredBy: 'Feito com',
    compiledTo: 'compilado para WebAssembly',
    source: 'Código-fonte',
  },
} satisfies Translation;
