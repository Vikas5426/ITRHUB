import { useMemo } from 'react';

export function useTaxCalculator(grossIncome: number, deductions: number) {
  return useMemo(() => {
    const calculateOldRegime = (income: number, ded: number) => {
      let taxable = Math.max(0, income - ded);
      if (taxable <= 500000) return 0;

      let tax = 0;
      if (taxable > 1000000) {
        tax += (taxable - 1000000) * 0.3;
        taxable = 1000000;
      }
      if (taxable > 500000) {
        tax += (taxable - 500000) * 0.2;
        taxable = 500000;
      }
      if (taxable > 250000) {
        tax += (taxable - 250000) * 0.05;
      }
      return Math.round(tax * 1.04);
    };

    const calculateNewRegime = (income: number) => {
      let taxable = Math.max(0, income - 75000);
      if (taxable <= 1200000) return 0;

      let tax = 0;
      if (taxable > 2400000) {
        tax += (taxable - 2400000) * 0.3;
        taxable = 2400000;
      }
      if (taxable > 2000000) {
        tax += (taxable - 2000000) * 0.25;
        taxable = 2000000;
      }
      if (taxable > 1600000) {
        tax += (taxable - 1600000) * 0.2;
        taxable = 1600000;
      }
      if (taxable > 1200000) {
        tax += (taxable - 1200000) * 0.15;
        taxable = 1200000;
      }
      if (taxable > 800000) {
        tax += (taxable - 800000) * 0.1;
        taxable = 800000;
      }
      if (taxable > 400000) {
        tax += (taxable - 400000) * 0.05;
      }
      return Math.round(tax * 1.04);
    };

    const oldTax = calculateOldRegime(grossIncome, deductions);
    const newTax = calculateNewRegime(grossIncome);

    return { oldTax, newTax };
  }, [grossIncome, deductions]);
}