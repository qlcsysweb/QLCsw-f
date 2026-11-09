import { describe, expect, test } from 'vitest';
import { budgetView, BUDGET_DEFAULTS, debtEstimate, emergencyFund, taxItem } from '@shared/patrimonial.js';

describe('vista previa con las fórmulas compartidas', () => {
  test('el frontend usa exactamente las mismas fórmulas que el backend', () => {
    const lines = BUDGET_DEFAULTS.map(([category, percent]) => ({ category, percent }));
    expect(budgetView({ netIncome: 30000, lines }).rows[0].planned).toBe(7500);
    expect(emergencyFund({ essentialExpenses: 18000, liquid: 36000, targetMonths: 3, monthlyContribution: 2000 }).monthsToGoal).toBe(9);
    expect(debtEstimate({ balance: 28000, annualRate: 42, payment: 3500, fees: 150 }).principalContribution).toBe(2370);
    expect(taxItem({ capital: 100000, grossProfit: 12000, commissions: 800, otherCosts: 200, taxRate: 25 }).net).toBe(8250);
  });
});
