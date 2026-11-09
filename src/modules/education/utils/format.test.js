import { describe, expect, test } from 'vitest';
import { money, pct, periodLabel, priceMoney, setCurrency, signedMoney, tone } from './format.js';

describe('formato de cifras', () => {
  test('ROI nulo (capital inicial 0) se muestra como N/D', () => {
    expect(pct(null)).toBe('N/D');
    expect(pct(2.5, { signed: true })).toBe('+2.50%');
    expect(pct(-1)).toBe('-1.00%');
  });
  test('moneda y signo', () => {
    expect(money(1080000)).toContain('1,080,000.00');
    expect(signedMoney(-50000)).toMatch(/^−/);
    expect(signedMoney(0)).not.toMatch(/^[+−]/);
    expect(tone(5)).toBe('up');
    expect(tone(-5)).toBe('down');
  });
  test('la moneda elegida cambia el formato pero los precios siguen en MXN', () => {
    setCurrency('EUR');
    expect(money(1500)).toContain('€');
    setCurrency('USD');
    expect(signedMoney(-20)).toMatch(/^−USD/);
    expect(priceMoney(4990)).toBe('$4,990.00');
    setCurrency('XXX');
    expect(money(1)).toContain('USD');
    setCurrency('MXN');
    expect(money(1)).toBe('$1.00');
  });
  test('etiqueta de periodo', () => {
    expect(periodLabel({ year: 2026, month: 9 })).toBe('Septiembre 2026');
  });
});
