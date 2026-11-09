import { describe, expect, it } from 'vitest';
import { toSupportedLanguage } from './index';

describe('toSupportedLanguage', () => {
  it.each([
    ['pt-BR', 'pt-BR'],
    ['pt-PT', 'pt-BR'],
    ['pt', 'pt-BR'],
    ['es-ES', 'es-ES'],
    ['es-MX', 'es-ES'],
    ['es_AR', 'es-ES'],
    ['en-GB', 'en-US'],
    ['EN', 'en-US'],
  ])('maps %s to %s', (detected, expected) => {
    expect(toSupportedLanguage(detected)).toBe(expected);
  });

  it('leaves unsupported languages untouched so i18next falls through to the next one', () => {
    expect(toSupportedLanguage('fr-FR')).toBe('fr-FR');
  });
});
