// Investment portfolio calculations with compound growth
import type { YearlyInvestment, YearlyFinancial, IncomeSettings, InvestmentSettings } from '../types/financial';

/**
 * Calculate investment portfolio growth over time
 * Separates monthly savings, bonus invested, and RSU equity compensation
 */
export function calculateInvestmentProjections(
  startingNetWorth: number,
  annualReturnRate: number,
  yearlyFinancials: YearlyFinancial[],
  incomeSettings: IncomeSettings,
  investmentSettings: InvestmentSettings
): YearlyInvestment[] {
  const results: YearlyInvestment[] = [];
  let currentBalance = startingNetWorth;
  
  for (let i = 0; i < yearlyFinancials.length; i++) {
    const financial = yearlyFinancials[i];
    const year = financial.year;
    
    const openingBalance = currentBalance;
    
    // Calculate bonus and holiday allowance amounts (gross)
    const baseSalary = incomeSettings.baseSalary * Math.pow(1 + incomeSettings.salaryGrowthRate, i);
    const bonusGross = baseSalary * incomeSettings.bonusPercentage;
    const holidayAllowanceGross = baseSalary * incomeSettings.holidayAllowancePercentage;
    
    // Estimate net amounts (use effective tax rate as approximation)
    const bonusNet = bonusGross * (1 - financial.effectiveTaxRate);
    const holidayAllowanceNet = holidayAllowanceGross * (1 - financial.effectiveTaxRate);
    
    // Investments based on percentages
    const bonusContributions = bonusNet * investmentSettings.bonusInvestmentPercentage;
    const holidayAllowanceContributions = holidayAllowanceNet * investmentSettings.holidayAllowanceInvestmentPercentage;
    
    // Monthly savings = salary net income ONLY (excluding RSU, bonus, and holiday allowance) - expenses
    // These come as lump sums on top of regular monthly pay
    // totalNetIncome includes everything, so we subtract RSU, bonus, and holiday allowance
    const netSalaryOnly = financial.totalNetIncome - financial.netRSUValue - bonusNet - holidayAllowanceNet;
    const monthlySavings = netSalaryOnly - financial.totalExpenses;
    const monthlySavingsContributions = Math.max(0, monthlySavings);
    
    // RSU contributions = net RSU value (after tax, goes directly to investments)
    const rsuContributions = financial.netRSUValue;
    
    // Total cash contributions (monthly + holiday allowance + bonus)
    const cashContributions = monthlySavingsContributions + holidayAllowanceContributions + bonusContributions;
    
    // Total contributions
    const contributions = monthlySavingsContributions + holidayAllowanceContributions + bonusContributions + rsuContributions;
    
    // Calculate investment growth on opening balance + contributions
    // Assumes contributions happen throughout the year, so apply return on average balance
    const balanceForGrowth = openingBalance + (contributions / 2);
    const investmentGrowth = balanceForGrowth * annualReturnRate;
    
    // Closing balance
    const closingBalance = openingBalance + contributions + investmentGrowth;
    
    // Cumulative ROI (return on initial investment)
    const cumulativeROI = startingNetWorth > 0 
      ? (closingBalance - startingNetWorth) / startingNetWorth 
      : 0;
    
    results.push({
      year,
      openingBalance,
      contributions,
      monthlySavingsContributions,
      holidayAllowanceContributions,
      bonusContributions,
      cashContributions,
      rsuContributions,
      investmentGrowth,
      closingBalance,
      cumulativeROI
    });
    
    // Update current balance for next year
    currentBalance = closingBalance;
  }
  
  return results;
}

/**
 * Calculate CAGR (Compound Annual Growth Rate)
 */
export function calculateCAGR(
  startingValue: number,
  endingValue: number,
  years: number
): number {
  if (startingValue <= 0 || years <= 0) return 0;
  
  return Math.pow(endingValue / startingValue, 1 / years) - 1;
}

/**
 * Calculate final net worth and CAGR
 */
export function calculateNetWorthMetrics(
  investments: YearlyInvestment[]
): {
  finalNetWorth: number;
  netWorthCAGR: number;
} {
  if (investments.length === 0) {
    return {
      finalNetWorth: 0,
      netWorthCAGR: 0
    };
  }
  
  const firstYear = investments[0];
  const lastYear = investments[investments.length - 1];
  
  const finalNetWorth = lastYear.closingBalance;
  const netWorthCAGR = calculateCAGR(
    firstYear.openingBalance,
    finalNetWorth,
    investments.length
  );
  
  return {
    finalNetWorth,
    netWorthCAGR
  };
}

/**
 * Project a single year's investment growth
 */
export function projectSingleYear(
  openingBalance: number,
  contribution: number,
  returnRate: number
): {
  growth: number;
  closingBalance: number;
} {
  const balanceForGrowth = openingBalance + (contribution / 2);
  const growth = balanceForGrowth * returnRate;
  const closingBalance = openingBalance + contribution + growth;
  
  return {
    growth,
    closingBalance
  };
}

/**
 * Calculate investment allocation breakdown (for future use)
 */
export function calculateAllocationBreakdown(
  totalValue: number,
  allocations: { name: string; percentage: number }[]
): Map<string, number> {
  const breakdown = new Map<string, number>();
  
  for (const allocation of allocations) {
    const value = totalValue * allocation.percentage;
    breakdown.set(allocation.name, value);
  }
  
  return breakdown;
}

