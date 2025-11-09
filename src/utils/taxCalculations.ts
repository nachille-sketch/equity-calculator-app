// Dutch tax calculation engine (2025 rates)
import type { TaxConfig, TaxBracket, SocialContribution, TaxResult } from '../types/financial';

// Netherlands 2025 tax configuration (Box 1 - Income from work and home)
// Rates from Arbeitnow calculator (accurate for 2025)
export const NETHERLANDS_TAX_CONFIG_2025: TaxConfig = {
  year: 2025,
  incomeTaxBrackets: [
    {
      lowerBound: 0,
      upperBound: 35472,
      rate: 0.0942 // 9.42% income tax (social security added separately below)
    },
    {
      lowerBound: 35472,
      upperBound: 69399,
      rate: 0.3707 // 37.07% income tax
    },
    {
      lowerBound: 69399,
      upperBound: null, // No upper bound for highest bracket
      rate: 0.495 // 49.5% income tax
    }
  ],
  socialContributions: [
    {
      name: 'Social Security', // Combined AOW + ANW + WLZ
      rate: 0.2765, // 27.65% (only on first bracket)
      maxIncome: 35472
    }
  ]
};

// Tax credits (heffingskortingen) for 2025 - from Arbeitnow
export const GENERAL_TAX_CREDIT_2025 = 2888; // Algemene heffingskorting
export const LABOUR_TAX_CREDIT_MAX_2025 = 4260; // Arbeidskorting (maximum)
export const LABOUR_TAX_CREDIT_THRESHOLD_LOW = 10351;
export const LABOUR_TAX_CREDIT_THRESHOLD_MID = 22357;
export const LABOUR_TAX_CREDIT_THRESHOLD_HIGH = 36650;
export const LABOUR_TAX_CREDIT_PHASEOUT_END = 109347;

/**
 * Calculate labour tax credit (arbeidskorting) - 2025 formula from Arbeitnow
 * Formula:
 * - Up to €10,351: 4.541% of gross income
 * - €10,351 to €22,357: €470 + 28.461% of (income - €10,351)
 * - €22,357 to €36,650: €3,887 + 2.610% of (income - €22,357)
 * - €36,650 to €109,347: €4,260 - 5.860% of (income - €36,650)
 * - Over €109,347: €0
 */
function calculateLabourTaxCredit(grossIncome: number): number {
  if (grossIncome <= LABOUR_TAX_CREDIT_THRESHOLD_LOW) {
    // Build-up phase 1: 4.541% of income
    return grossIncome * 0.04541;
  } else if (grossIncome <= LABOUR_TAX_CREDIT_THRESHOLD_MID) {
    // Build-up phase 2
    const base = 470;
    const additional = (grossIncome - LABOUR_TAX_CREDIT_THRESHOLD_LOW) * 0.28461;
    return base + additional;
  } else if (grossIncome <= LABOUR_TAX_CREDIT_THRESHOLD_HIGH) {
    // Build-up phase 3
    const base = 3887;
    const additional = (grossIncome - LABOUR_TAX_CREDIT_THRESHOLD_MID) * 0.02610;
    return base + additional;
  } else if (grossIncome <= LABOUR_TAX_CREDIT_PHASEOUT_END) {
    // Phase-out: reduces by 5.860% of income above €36,650
    const reduction = (grossIncome - LABOUR_TAX_CREDIT_THRESHOLD_HIGH) * 0.05860;
    return Math.max(0, LABOUR_TAX_CREDIT_MAX_2025 - reduction);
  } else {
    return 0;
  }
}

/**
 * Calculate general tax credit (algemene heffingskorting) - 2025 formula from Arbeitnow
 * Formula:
 * - Up to €21,318: €2,888
 * - €21,318 to €69,399: €2,888 - 6.007% of (income - €21,318)
 * - Over €69,399: €0
 */
function calculateGeneralTaxCredit(taxableIncome: number): number {
  const phaseoutStart = 21318;
  const phaseoutEnd = 69399;
  
  if (taxableIncome <= phaseoutStart) {
    return GENERAL_TAX_CREDIT_2025;
  } else if (taxableIncome <= phaseoutEnd) {
    // Phase-out: reduces by 6.007% of income above €21,318
    const reduction = (taxableIncome - phaseoutStart) * 0.06007;
    return Math.max(0, GENERAL_TAX_CREDIT_2025 - reduction);
  } else {
    return 0;
  }
}

/**
 * Calculate progressive income tax based on Dutch tax brackets
 */
function calculateIncomeTax(taxableIncome: number, brackets: TaxBracket[]): number {
  let tax = 0;
  
  for (const bracket of brackets) {
    const lowerBound = bracket.lowerBound;
    const upperBound = bracket.upperBound ?? Infinity;
    
    if (taxableIncome > lowerBound) {
      const incomeInBracket = Math.min(taxableIncome, upperBound) - lowerBound;
      tax += incomeInBracket * bracket.rate;
    }
  }
  
  return tax;
}

/**
 * Calculate social contributions (premies) - AOW, ANW, WLZ
 */
function calculateSocialContributions(
  taxableIncome: number, 
  contributions: SocialContribution[]
): number {
  let total = 0;
  
  for (const contribution of contributions) {
    const incomeSubjectToContribution = Math.min(taxableIncome, contribution.maxIncome);
    total += incomeSubjectToContribution * contribution.rate;
  }
  
  return total;
}

/**
 * Calculate marginal tax rate (rate on next euro earned)
 */
function calculateMarginalTaxRate(
  taxableIncome: number,
  brackets: TaxBracket[],
  socialContributions: SocialContribution[]
): number {
  // Find which bracket the income falls into
  let incomeTaxRate = 0;
  for (const bracket of brackets) {
    const upperBound = bracket.upperBound ?? Infinity;
    if (taxableIncome >= bracket.lowerBound && taxableIncome < upperBound) {
      incomeTaxRate = bracket.rate;
      break;
    }
    if (bracket.upperBound === null) {
      incomeTaxRate = bracket.rate;
    }
  }
  
  // Add social contributions if income is still below caps
  let socialContributionRate = 0;
  for (const contribution of socialContributions) {
    if (taxableIncome < contribution.maxIncome) {
      socialContributionRate += contribution.rate;
    }
  }
  
  return incomeTaxRate + socialContributionRate;
}

/**
 * Main tax calculation function
 * @param grossIncome - Total gross income (salary + bonus + RSU)
 * @param pensionPercentage - Employee pension contribution percentage (for reference)
 * @param has30PercentRuling - Whether 30% ruling applies
 * @param year - Tax year
 * @param taxConfig - Tax configuration (defaults to NL 2025)
 * @param pensionContributionsOverride - Optional: explicit pension amount (if pension is only on base salary)
 */
export function calculateTax(
  grossIncome: number,
  pensionPercentage: number,
  has30PercentRuling: boolean,
  year: number,
  taxConfig: TaxConfig = NETHERLANDS_TAX_CONFIG_2025,
  pensionContributionsOverride?: number
): TaxResult {
  // Step 1: Calculate pension contributions (pre-tax deduction)
  // Use override if provided (for cases where pension is only on base salary, not total income)
  const pensionContributions = pensionContributionsOverride !== undefined 
    ? pensionContributionsOverride 
    : grossIncome * pensionPercentage;
  
  // Step 2: Calculate taxable income
  // If 30% ruling applies, only 70% of income is taxable
  let incomeAfterPension = grossIncome - pensionContributions;
  const taxableIncome = has30PercentRuling 
    ? incomeAfterPension * 0.70 
    : incomeAfterPension;
  
  // Step 3: Calculate income tax
  const incomeTax = calculateIncomeTax(taxableIncome, taxConfig.incomeTaxBrackets);
  
  // Step 4: Calculate social contributions (premies)
  const socialContributions = calculateSocialContributions(
    taxableIncome, 
    taxConfig.socialContributions
  );
  
  // Step 5: Calculate tax credits
  const generalTaxCredit = calculateGeneralTaxCredit(taxableIncome);
  const labourTaxCredit = calculateLabourTaxCredit(grossIncome);
  
  // Total tax before credits
  const totalTaxBeforeCredits = incomeTax + socialContributions + pensionContributions;
  
  // Apply credits to reduce tax bill (but not below pension contributions)
  const taxAfterCredits = Math.max(
    pensionContributions,
    incomeTax + socialContributions - generalTaxCredit - labourTaxCredit
  );
  
  // Step 6: Calculate totals
  const totalTax = taxAfterCredits + pensionContributions;
  const netIncome = grossIncome - totalTax;
  const effectiveTaxRate = totalTax / grossIncome;
  
  // Step 6: Calculate marginal tax rate
  const marginalTaxRate = calculateMarginalTaxRate(
    taxableIncome,
    taxConfig.incomeTaxBrackets,
    taxConfig.socialContributions
  );
  
  return {
    year,
    grossIncome,
    taxableIncome,
    incomeTax,
    socialContributions,
    pensionContributions,
    generalTaxCredit,
    labourTaxCredit,
    totalTaxBeforeCredits,
    totalTax,
    netIncome,
    effectiveTaxRate,
    marginalTaxRate // Already calculated on correct taxable income
  };
}

/**
 * Calculate tax specifically for RSU vesting
 * RSUs are taxed as income at marginal rate
 */
export function calculateRSUTax(
  salaryGrossIncome: number,
  rsuGrossValue: number,
  pensionPercentage: number,
  has30PercentRuling: boolean,
  year: number,
  taxConfig: TaxConfig = NETHERLANDS_TAX_CONFIG_2025
): { marginalTaxRate: number; taxOnRSU: number; netRSUValue: number } {
  // Total income for determining marginal rate
  const totalIncome = salaryGrossIncome + rsuGrossValue;
  
  // Calculate tax on total income
  const taxResult = calculateTax(totalIncome, pensionPercentage, has30PercentRuling, year, taxConfig);
  
  // The marginal rate applies to RSU income
  const marginalTaxRate = taxResult.marginalTaxRate;
  const taxOnRSU = rsuGrossValue * marginalTaxRate;
  const netRSUValue = rsuGrossValue - taxOnRSU;
  
  return {
    marginalTaxRate,
    taxOnRSU,
    netRSUValue
  };
}

