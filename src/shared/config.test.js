import { describe, expect, test } from 'vitest';
import { normalizeApiOrigin } from './config.js';

describe('normalizeApiOrigin', () => {
  test('vacío significa mismo dominio', () => {
    expect(normalizeApiOrigin('')).toBe('');
    expect(normalizeApiOrigin(undefined)).toBe('');
  });

  test.each([
    'https://qlcsw-b.onrender.com',
    'https://qlcsw-b.onrender.com/',
    'https://qlcsw-b.onrender.com/api',
    'https://qlcsw-b.onrender.com/api/',
    'https://qlcsw-b.onrender.com/trad/api',
    ' https://qlcsw-b.onrender.com/api ',
  ])('%s queda como el origen del backend', (value) => {
    expect(normalizeApiOrigin(value)).toBe('https://qlcsw-b.onrender.com');
  });
});
