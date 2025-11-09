// Core data structures for financial planning app

// Expense category for customizable budget items
export interface ExpenseCategory {
  id: string;
  name: string;
  monthlyAmount: number;
}

// Income and tax settings
export interface IncomeSettings {
  baseSalary: number; // Annual gross salary
  bonusPercentage: number; // Bonus as % of salary (separate from holiday allowance)
  holidayAllowancePercentage: number; // Holiday allowance % (typically 8% in NL)
  pensionPercentage: number; // Employee pension contribution %
  employerPensionPercentage: number; // Employer pension contribution %
  healthcareBenefitMonthly: number; // Monthly healthcare benefit (tax-free)
  has30PercentRuling: boolean; // Netherlands 30% ruling
  salaryGrowthRate: number; // Annual salary increase %
}

// Investment assumptions
export interface InvestmentSettings {
  startingNetWorth: number; // Initial portfolio value (liquid investments)
  startingPensionBalance: number; // Initial pension balance (separate)
  annualReturnRate: number; // Expected annual return %
  pensionReturnRate: number; // Expected pension fund return %
  sharePriceGrowthRate: number; // Annual share price growth %
  currentStockPrice: number; // Current stock price (for reference)
  bonusInvestmentPercentage: number; // % of bonus to invest (rest is spent)
  holidayAllowanceInvestmentPercentage: number; // % of holiday allowance to invest (rest is spent)
}

// General planning settings
export interface PlanningSettings {
  startYear: number; // Starting year for projections
  projectionYears: number; // Number of years to project
  expenseInflationRate: number; // Annual expense inflation %
}

// RSU Grant - represents a single stock grant
export interface RSUGrant {
  id: string;
  grantYear: number;
  grantType: string; // e.g., "Main", "Refresher"
  grantValueEur: number; // Total grant value in EUR
  sharePriceEur: number; // Share price at grant
  grantShares: number; // Calculated: grantValueEur / sharePriceEur
  vestingYears: number; // Usually 4 years
  vestingPercentagePerYear: number; // Usually 25% (0.25)
}

// Netherlands tax brackets (hard-coded government data)
export interface TaxBracket {
  lowerBound: number;
  upperBound: number | null; // null for highest bracket
  rate: number; // Tax rate as decimal (e.g., 0.3697 for 36.97%)
}

// Social contributions (premies) in Netherlands
export interface SocialContribution {
  name: string; // e.g., "AOW", "ANW", "WLZ"
  rate: number; // Rate as decimal
  maxIncome: number; // Maximum income subject to this contribution
}

// Tax configuration for Netherlands (2025)
export interface TaxConfig {
  year: number;
  incomeTaxBrackets: TaxBracket[];
  socialContributions: SocialContribution[];
}

// Tax calculation result for a given year
export interface TaxResult {
  year: number;
  grossIncome: number; // Total income before tax
  taxableIncome: number; // After 30% ruling if applicable
  incomeTax: number; // Income tax amount
  socialContributions: number; // Total premies
  pensionContributions: number; // Employee pension
  generalTaxCredit: number; // Algemene heffingskorting
  labourTaxCredit: number; // Arbeidskorting
  totalTaxBeforeCredits: number; // Tax before credits
  totalTax: number; // Total deductions
  netIncome: number; // Take-home pay
  effectiveTaxRate: number; // Total tax / gross income
  marginalTaxRate: number; // Tax rate on next euro earned
}

// RSU vesting details for a specific year
export interface RSUVestingYear {
  year: number;
  sharesVested: number; // Total shares vesting across all grants
  grantPriceAvg: number; // Average grant price across all vesting shares
  vestingPriceEur: number; // Current share price at vesting
  grossRSUValue: number; // Shares * vesting price
  stockAppreciation: number; // Gain from price increase (vesting price - grant price) * shares
  appreciationPercentage: number; // Percentage gain from grant to vest
  marginalTaxRate: number; // Tax rate applied to RSU income
  taxPaid: number; // Tax on RSU vesting
  netRSUValue: number; // After-tax RSU value
}

// Financial summary for a single year
export interface YearlyFinancial {
  year: number;
  grossIncome: number; // Salary + bonus
  rsuGrossValue: number; // RSU vesting value
  totalGrossIncome: number; // Salary + RSU
  netIncome: number; // After tax and pension
  netRSUValue: number; // After RSU tax
  totalNetIncome: number; // Net salary + net RSU
  employerPensionContribution: number; // Employer's pension contribution (not taxed)
  totalExpenses: number; // Annual expenses with inflation
  netSavings: number; // Net income - expenses
  savingsRate: number; // Net savings / total net income
  effectiveTaxRate: number; // Overall tax rate
}

// Investment portfolio tracking for a year
export interface YearlyInvestment {
  year: number;
  openingBalance: number; // Portfolio value at start
  contributions: number; // Total net savings invested
  monthlySavingsContributions: number; // From regular salary savings
  holidayAllowanceContributions: number; // From holiday allowance invested
  bonusContributions: number; // From bonus invested
  cashContributions: number; // From salary savings (not RSU) - DEPRECATED, use monthlySavings + bonus + holiday
  rsuContributions: number; // From RSU vesting (after tax)
  investmentGrowth: number; // Return on investment
  closingBalance: number; // End-of-year value
  cumulativeROI: number; // Growth vs starting net worth
}

// Pension tracking for a year (separate from liquid net worth)
export interface YearlyPension {
  year: number;
  openingBalance: number; // Pension value at start
  employeeContributions: number; // Your pension contributions
  employerContributions: number; // Employer's pension contributions
  pensionGrowth: number; // Returns on pension investments
  closingBalance: number; // Pension value at end
}

// Complete financial state (all user inputs)
export interface FinancialData {
  incomeSettings: IncomeSettings;
  investmentSettings: InvestmentSettings;
  planningSettings: PlanningSettings;
  expenseCategories: ExpenseCategory[];
  rsuGrants: RSUGrant[];
}

// Computed projections and summaries
export interface FinancialProjections {
  taxResults: TaxResult[];
  rsuVestingByYear: RSUVestingYear[];
  yearlyFinancials: YearlyFinancial[];
  yearlyInvestments: YearlyInvestment[];
  yearlyPension: YearlyPension[]; // New: separate pension tracking
}

// Dashboard KPI metrics
export interface DashboardMetrics {
  averageSavingsRate: number;
  totalSavings: number;
  finalNetWorth: number;
  netWorthCAGR: number;
  totalRSUGrossValue: number;
  totalRSUTaxPaid: number;
  totalRSUNetValue: number;
  averageEffectiveTaxRate: number;
}

