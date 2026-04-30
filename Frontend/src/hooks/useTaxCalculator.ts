import { useMemo } from 'react';

export function useTaxCalculator(grossIncome: number, deductions: number) {
  return useMemo(() => {
    // Old Regime logic
    const calculateOldRegime = (income: number, ded: number) => {
      let taxable = Math.max(0, income - ded);
      if (taxable <= 500000) return 0; // 87A rebate

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
      return Math.round(tax * 1.04); // including 4% cess
    };

    // New Regime logic
    const calculateNewRegime = (income: number) => {
      // Default 50k standard deduction for new regime
      let taxable = Math.max(0, income - 50000);
      if (taxable <= 700000) return 0; // 87A rebate

      let tax = 0;
      if (taxable > 1500000) {
        tax += (taxable - 1500000) * 0.3;
        taxable = 1500000;
      }
      if (taxable > 1200000) {
        tax += (taxable - 1200000) * 0.2;
        taxable = 1200000;
      }
      if (taxable > 900000) {
        tax += (taxable - 900000) * 0.15;
        taxable = 900000;
      }
      if (taxable > 600000) {
        tax += (taxable - 600000) * 0.1;
        taxable = 600000;
      }
      if (taxable > 300000) {
        tax += (taxable - 300000) * 0.05;
      }
      return Math.round(tax * 1.04);
    };

    const oldTax = calculateOldRegime(grossIncome, deductions);
    const newTax = calculateNewRegime(grossIncome);

    return { oldTax, newTax };
  }, [grossIncome, deductions]);
}
