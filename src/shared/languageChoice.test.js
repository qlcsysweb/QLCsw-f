import { beforeEach, describe, expect, test, vi } from 'vitest';
import { languagePromptPending, rememberLanguageChoice } from './languageChoice.js';

describe('elección de idioma', () => {
  let store;
  let session;

  const fakeStorage = (data) => ({
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value;
    },
  });

  beforeEach(() => {
    store = {};
    session = {};
    vi.stubGlobal('localStorage', fakeStorage(store));
    vi.stubGlobal('sessionStorage', fakeStorage(session));
    vi.stubGlobal('document', { cookie: '' });
  });

  test('pregunta en cada visita nueva, aunque ya se haya elegido antes', () => {
    store.edu_lang = 'en';
    expect(languagePromptPending()).toBe(true);
  });

  test('al elegir, deja de preguntar en esa visita y aplica a ambas plataformas', () => {
    rememberLanguageChoice('en');
    expect(languagePromptPending()).toBe(false);
    session = {};
    vi.stubGlobal('sessionStorage', fakeStorage(session));
    expect(languagePromptPending()).toBe(true);
    expect(store.edu_lang).toBe('en');
    expect(document.cookie).toContain('trad_language=en');
    expect(document.cookie).toContain('Path=/trad');
  });

  test('sin almacenamiento no bloquea la página', () => {
    const blocked = {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('bloqueado');
      },
    };
    vi.stubGlobal('localStorage', blocked);
    vi.stubGlobal('sessionStorage', blocked);
    expect(languagePromptPending()).toBe(false);
    expect(() => rememberLanguageChoice('es')).not.toThrow();
  });
});
