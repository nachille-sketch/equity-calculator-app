// Financial projection calculations
import type { 
  ExpenseCategory, 
  IncomeSettings, 
  PlanningSettings, 
  YearlyFinancial,
  RSUVestingYear,
  TaxResult
} from '../types/financial';

/**
 * Calculate gross salary for each year with growth
 */
export function calculateSalaryByYear(
  baseSalary: number,
  salaryGrowthRate: number,
  startYear: number,
  projectionYears: number
): Map<number, number> {
  const salaryByYear = new Map<number, number>();
  
  for (let i = 0; i < projectionYears; i++) {
    const year = startYear + i;
    const salary = baseSalary * Math.pow(1 + salaryGrowthRate, i);
    salaryByYear.set(year, salary);
  }
  
  return salaryByYear;
}

/**
 * Calculate total annual expenses with inflation
 */
export function calculateYearlyExpenses(
  expenseCategories: ExpenseCategory[],
  expenseInflationRate: number,
  startYear: number,
  projectionYears: number
): Map<number, number> {
  const expensesByYear = new Map<number, number>();
  
  // Calculate base monthly expenses
  const baseMonthlyExpenses = expenseCategories.reduce(
    (total, category) => total + category.monthlyAmount,
    0
  );
  
  const baseAnnualExpenses = baseMonthlyExpenses * 12;
  
  for (let i = 0; i < projectionYears; i++) {
    const year = startYear + i;
    const yearlyExpenses = baseAnnualExpenses * Math.pow(1 + expenseInflationRate, i);
    expensesByYear.set(year, yearlyExpenses);
  }
  
  return expensesByYear;
}

/**
 * Calculate complete financial projections for all years
 */
export function calculateFinancialProjections(
  incomeSettings: IncomeSettings,
  planningSettings: PlanningSettings,
  expenseCategories: ExpenseCategory[],
  taxResults: TaxResult[],
  rsuVestingByYear: RSUVestingYear[],
  taxResultsWithoutRSU?: TaxResult[] // Optional: tax on salary only
): YearlyFinancial[] {
  const { startYear, projectionYears, expenseInflationRate } = planningSettings;
  const { baseSalary, bonusPercentage, holidayAllowancePercentage, employerPensionPercentage, salaryGrowthRate } = incomeSettings;
  
  const salaryByYear = calculateSalaryByYear(baseSalary, salaryGrowthRate, startYear, projectionYears);
  const expensesByYear = calculateYearlyExpenses(expenseCategories, expenseInflationRate, startYear, projectionYears);
  
  const results: YearlyFinancial[] = [];
  
  for (let i = 0; i < projectionYears; i++) {
    const year = startYear + i;
    const baseSalaryYear = salaryByYear.get(year) || 0;
    
    // Gross income from salary (including bonus and holiday allowance)
    const grossIncome = baseSalaryYear * (1 + holidayAllowancePercentage + bonusPercentage);
    
    // Employer pension contribution (not part of gross taxable income)
    const employerPensionContribution = baseSalaryYear * employerPensionPercentage;
    
    // RSU information for this year
    const rsuYear = rsuVestingByYear[i];
    const rsuGrossValue = rsuYear?.grossRSUValue || 0;
    const netRSUValue = rsuYear?.netRSUValue || 0;
    
    // Get net income from salary only (if available)
    let netIncome: number;
    if (taxResultsWithoutRSU && taxResultsWithoutRSU[i]) {
      // Use accurate tax calculation on salary only
      netIncome = taxResultsWithoutRSU[i].netIncome;
    } else {
      // Fallback: split proportionally (less accurate)
      const taxResult = taxResults[i];
      const totalNetIncome = taxResult?.netIncome || 0;
      const totalGrossIncome = grossIncome + rsuGrossValue;
      const salaryPortion = totalGrossIncome > 0 ? grossIncome / totalGrossIncome : 1;
      netIncome = totalNetIncome * salaryPortion;
    }
    
    // Add healthcare benefit (tax-free) to net salary income
    const healthcareBenefit = incomeSettings.healthcareBenefitMonthly * 12;
    const netIncomeWithBenefits = netIncome + healthcareBenefit;
    
    const taxResult = taxResults[i];
    const effectiveTaxRate = taxResult?.effectiveTaxRate || 0;
    
    // Total income
    const totalGrossIncomeCalc = grossIncome + rsuGrossValue;
    const totalNetIncomeCalc = netIncomeWithBenefits + netRSUValue;
    
    // Expenses
    const totalExpenses = expensesByYear.get(year) || 0;
    
    // Savings (including employer pension as savings since it goes to your pension fund)
    const netSavings = totalNetIncomeCalc - totalExpenses + employerPensionContribution;
    const savingsRate = totalNetIncomeCalc > 0 ? netSavings / (totalNetIncomeCalc + employerPensionContribution) : 0;
    
    results.push({
      year,
      grossIncome,
      rsuGrossValue,
      totalGrossIncome: totalGrossIncomeCalc,
      netIncome: netIncomeWithBenefits,
      netRSUValue,
      totalNetIncome: totalNetIncomeCalc,
      employerPensionContribution,
      totalExpenses,
      netSavings,
      savingsRate,
      effectiveTaxRate
    });
  }
  
  return results;
}

/**
 * Calculate expense breakdown by category for a specific year
 */
export function calculateExpenseBreakdown(
  expenseCategories: ExpenseCategory[],
  year: number,
  startYear: number,
  expenseInflationRate: number
): Map<string, number> {
  const breakdown = new Map<string, number>();
  const yearsFromStart = year - startYear;
  const inflationMultiplier = Math.pow(1 + expenseInflationRate, yearsFromStart);
  
  for (const category of expenseCategories) {
    const annualAmount = category.monthlyAmount * 12 * inflationMultiplier;
    breakdown.set(category.name, annualAmount);
  }
  
  return breakdown;
}

/**
 * Calculate average metrics across all years
 */
export function calculateAverageMetrics(financials: YearlyFinancial[]): {
  averageSavingsRate: number;
  averageEffectiveTaxRate: number;
  totalSavings: number;
} {
  if (financials.length === 0) {
    return {
      averageSavingsRate: 0,
      averageEffectiveTaxRate: 0,
      totalSavings: 0
    };
  }
  
  const totalSavings = financials.reduce((sum, f) => sum + f.netSavings, 0);
  const averageSavingsRate = financials.reduce((sum, f) => sum + f.savingsRate, 0) / financials.length;
  const averageEffectiveTaxRate = financials.reduce((sum, f) => sum + f.effectiveTaxRate, 0) / financials.length;
  
  return {
    averageSavingsRate,
    averageEffectiveTaxRate,
    totalSavings
  };
}

