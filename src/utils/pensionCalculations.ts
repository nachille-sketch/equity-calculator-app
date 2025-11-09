// Pension fund calculations (separate from liquid investments)
import type { YearlyPension, YearlyFinancial, TaxResult } from '../types/financial';

/**
 * Calculate pension fund growth over time
 * Pension includes both employee and employer contributions
 */
export function calculatePensionProjections(
  startingPensionBalance: number,
  pensionReturnRate: number,
  yearlyFinancials: YearlyFinancial[],
  taxResults: TaxResult[]
): YearlyPension[] {
  const results: YearlyPension[] = [];
  let currentBalance = startingPensionBalance;
  
  for (let i = 0; i < yearlyFinancials.length; i++) {
    const financial = yearlyFinancials[i];
    const taxResult = taxResults[i];
    const year = financial.year;
    
    const openingBalance = currentBalance;
    
    // Employee pension contributions (from tax deductions)
    const employeeContributions = taxResult.pensionContributions;
    
    // Employer pension contributions (not taxed, goes directly to pension)
    const employerContributions = financial.employerPensionContribution;
    
    // Total contributions this year
    const totalContributions = employeeContributions + employerContributions;
    
    // Calculate pension growth on opening balance + contributions
    // Assumes contributions happen throughout the year
    const balanceForGrowth = openingBalance + (totalContributions / 2);
    const pensionGrowth = balanceForGrowth * pensionReturnRate;
    
    // Closing balance
    const closingBalance = openingBalance + totalContributions + pensionGrowth;
    
    results.push({
      year,
      openingBalance,
      employeeContributions,
      employerContributions,
      pensionGrowth,
      closingBalance
    });
    
    // Update current balance for next year
    currentBalance = closingBalance;
  }
  
  return results;
}

