import { beforeEach, describe, expect, test, vi } from 'vitest';
import { languagePromptPending, rememberLanguageChoice } from './languageChoice.js';

describe('elección de idioma', () => {
  let store;

  beforeEach(() => {
    store = {};
    vi.stubGlobal('localStorage', {
      getItem: (key) => store[key] ?? null,
      setItem: (key, value) => {
        store[key] = value;
      },
    });
    vi.stubGlobal('document', { cookie: '' });
  });

  test('pregunta mientras no se haya elegido hoy', () => {
    expect(languagePromptPending()).toBe(true);
    store.site_language_prompt_date = '2000-01-01';
    expect(languagePromptPending()).toBe(true);
  });

  test('al elegir, deja de preguntar y aplica a ambas plataformas', () => {
    rememberLanguageChoice('en');
    expect(languagePromptPending()).toBe(false);
    expect(store.edu_lang).toBe('en');
    expect(document.cookie).toContain('trad_language=en');
    expect(document.cookie).toContain('Path=/trad');
  });

  test('sin localStorage no bloquea la página', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('bloqueado');
      },
    });
    expect(languagePromptPending()).toBe(false);
    expect(() => rememberLanguageChoice('es')).not.toThrow();
  });
});
