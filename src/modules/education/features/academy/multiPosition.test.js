import { describe, expect, test } from 'vitest';
import { START_PRICE, applyMove, closeAll, estimatedRisk, exposureOf, initialState, randomMove, riskPctOfMargin, summarize, validate } from './multiPosition.js';

const position = (over) => ({ id: 'P1', entry: START_PRICE, direction: 'LONG', margin: 1000, leverage: 5, tp: 4, sl: 2, status: 'OPEN', exitPrice: null, ...over });
const stateWith = (positions, capital = 10000) => ({ ...initialState({ capital }), positions });

describe('Laboratorio multiposición', () => {
  test('arranca en 100,000 y el reinicio vuelve a ese precio', () => {
    const s = initialState();
    expect(s.price).toBe(START_PRICE);
    expect(s.positions.every((p) => p.entry === START_PRICE)).toBe(true);
    expect(validate(s).valid).toBe(true);
  });

  test('exposición y riesgo estimado se calculan desde margen, apalancamiento y SL', () => {
    const p = position();
    expect(exposureOf(p)).toBe(5000);
    expect(estimatedRisk(p)).toBe(100);
    expect(riskPctOfMargin(p)).toBe(10);
  });

  test('LONG y SHORT responden en sentidos opuestos', () => {
    const s = applyMove(stateWith([position(), position({ id: 'P2', direction: 'SHORT' })]), 1);
    const [long, short] = summarize(s).results;
    expect(long.result).toBeCloseTo(50);
    expect(short.result).toBeCloseTo(-50);
  });

  test('TP y SL cierran posiciones en el umbral configurado', () => {
    const s = applyMove(stateWith([position(), position({ id: 'P2', direction: 'SHORT' })]), 4.5);
    expect(s.positions[0].status).toBe('TP');
    expect(s.positions[1].status).toBe('SL');
    const [long, short] = summarize(s).results;
    expect(long.result).toBeCloseTo(200);
    expect(short.result).toBeCloseTo(-100);
    expect(s.rounds[0].closed).toEqual(['P1 TP', 'P2 SL']);
  });

  test('valida la suma de márgenes frente al capital', () => {
    const v = validate(stateWith([position({ margin: 6000 }), position({ id: 'P2', margin: 5000 })]));
    expect(v.valid).toBe(false);
    expect(v.excess).toBe(1000);
  });

  test('drawdown y cierre manual actualizan el registro', () => {
    let s = stateWith([position()]);
    s = applyMove(s, -1);
    expect(s.maxDrawdown).toBeCloseTo(0.5);
    s = closeAll(s);
    expect(s.positions[0].status).toBe('MANUAL');
    expect(s.rounds).toHaveLength(2);
    expect(summarize(s).net).toBeCloseTo(-50);
  });

  test('el movimiento aleatorio respeta la volatilidad', () => {
    expect(randomMove('ALTA', () => 1)).toBe(3);
    expect(randomMove('BAJA', () => 0)).toBe(-0.75);
  });
});
