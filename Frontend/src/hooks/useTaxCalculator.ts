import { useMemo } from 'react';

export function useTaxCalculator(grossIncome: number, deductions: number) {
  return useMemo(() => {
    const calculateOldRegime = (income: number, ded: number) => {
      // Standard deduction of 50,000 is included in deductions or base
      let taxable = Math.max(0, income - ded);
      if (taxable <= 500000) return 0; // 87A rebate in Old Regime

      let tax = 0;
      if (taxable > 1000000) {
        tax += (taxable - 1000000) * 0.30;
        taxable = 1000000;
      }
      if (taxable > 500000) {
        tax += (taxable - 500000) * 0.20;
        taxable = 500000;
      }
      if (taxable > 250000) {
        tax += (taxable - 250000) * 0.05;
      }
      return Math.round(tax * 1.04);
    };

    const calculateNewRegime = (income: number) => {
      // AY 2026-27 New Regime (Sec 115BAC) with ₹75,000 standard deduction
      const taxable = Math.max(0, income - 75000);
      if (taxable <= 700000) return 0; // Sec 87A rebate: zero tax up to ₹7L

      let tax = 0;
      let remaining = taxable;

      if (remaining > 1500000) {
        tax += (remaining - 1500000) * 0.30;
        remaining = 1500000;
      }
      if (remaining > 1200000) {
        tax += (remaining - 1200000) * 0.20;
        remaining = 1200000;
      }
      if (remaining > 1000000) {
        tax += (remaining - 1000000) * 0.15;
        remaining = 1000000;
      }
      if (remaining > 700000) {
        tax += (remaining - 700000) * 0.10;
        remaining = 700000;
      }
      if (remaining > 300000) {
        tax += (remaining - 300000) * 0.05;
      }

      // Marginal relief under Section 87A for income slightly above 7L
      if (taxable > 700000 && taxable <= 727770) {
        const excessIncome = taxable - 700000;
        if (tax > excessIncome) {
          tax = excessIncome;
        }
      }

      return Math.round(tax * 1.04);
    };

    const oldTax = calculateOldRegime(grossIncome, deductions);
    const newTax = calculateNewRegime(grossIncome);

    return { oldTax, newTax };
  }, [grossIncome, deductions]);
}