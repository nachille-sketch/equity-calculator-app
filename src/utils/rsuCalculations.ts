// RSU vesting calculation logic with multi-grant support
import type { RSUGrant, RSUVestingYear } from '../types/financial';
import { calculateRSUTax } from './taxCalculations';

/**
 * Calculate how many shares vest from a specific grant in a given year
 */
export function calculateSharesVestingInYear(grant: RSUGrant, year: number): number {
  // Check if this year falls within the vesting period
  const yearsFromGrant = year - grant.grantYear;
  
  // Vesting typically starts in year after grant (or same year depending on schedule)
  if (yearsFromGrant < 0 || yearsFromGrant >= grant.vestingYears) {
    return 0;
  }
  
  // Calculate shares vesting this year
  const sharesPerYear = grant.grantShares * grant.vestingPercentagePerYear;
  return sharesPerYear;
}

/**
 * Calculate total shares vesting across all grants for each year
 */
export function calculateVestingSchedule(
  grants: RSUGrant[],
  startYear: number,
  projectionYears: number
): Map<number, number> {
  const vestingByYear = new Map<number, number>();
  
  // Initialize all years with 0
  for (let i = 0; i < projectionYears; i++) {
    const year = startYear + i;
    vestingByYear.set(year, 0);
  }
  
  // Calculate vesting for each grant
  for (const grant of grants) {
    for (let i = 0; i < projectionYears; i++) {
      const year = startYear + i;
      const sharesVesting = calculateSharesVestingInYear(grant, year);
      
      if (sharesVesting > 0) {
        const currentTotal = vestingByYear.get(year) || 0;
        vestingByYear.set(year, currentTotal + sharesVesting);
      }
    }
  }
  
  return vestingByYear;
}

/**
 * Calculate RSU vesting with tax for all years, including stock appreciation
 */
export function calculateRSUVestingByYear(
  grants: RSUGrant[],
  startYear: number,
  projectionYears: number,
  salaryByYear: Map<number, number>, // Gross salary per year (for reference)
  sharePriceGrowthRate: number, // Annual share price growth
  currentStockPrice: number, // Current stock price for projections
  pensionPercentage: number,
  has30PercentRuling: boolean,
  taxResults?: import('../types/financial').TaxResult[], // Tax results with RSU included
  taxResultsWithoutRSU?: import('../types/financial').TaxResult[] // Tax results without RSU
): RSUVestingYear[] {
  const results: RSUVestingYear[] = [];
  
  // Use current stock price as base for future projections
  const baseSharePrice = currentStockPrice;
  
  for (let i = 0; i < projectionYears; i++) {
    const year = startYear + i;
    
    // Calculate how many shares vest this year and their grant prices
    let totalSharesVested = 0;
    let weightedGrantPrice = 0;
    
    for (const grant of grants) {
      const sharesVesting = calculateSharesVestingInYear(grant, year);
      if (sharesVesting > 0) {
        totalSharesVested += sharesVesting;
        weightedGrantPrice += sharesVesting * grant.sharePriceEur;
      }
    }
    
    const avgGrantPrice = totalSharesVested > 0 ? weightedGrantPrice / totalSharesVested : baseSharePrice;
    
    // Calculate current share price with growth from base year
    const yearsFromBase = year - startYear;
    const vestingPriceEur = baseSharePrice * Math.pow(1 + sharePriceGrowthRate, yearsFromBase);
    
    // Calculate gross RSU value at vesting price
    const grossRSUValue = totalSharesVested * vestingPriceEur;
    
    // Calculate stock appreciation
    const stockAppreciation = totalSharesVested * (vestingPriceEur - avgGrantPrice);
    const appreciationPercentage = avgGrantPrice > 0 ? (vestingPriceEur - avgGrantPrice) / avgGrantPrice : 0;
    
    // Get salary for this year
    const salaryGrossIncome = salaryByYear.get(year) || 0;
    
    // If tax results provided, use those; otherwise calculate marginal tax on RSU
    let marginalTaxRate = 0;
    let taxPaid = 0;
    let netRSUValue = grossRSUValue;
    
    if (taxResults && taxResults[i] && taxResultsWithoutRSU && taxResultsWithoutRSU[i]) {
      // ACCURATE METHOD: Calculate actual tax difference
      // Tax on RSU = (Total tax with RSU) - (Total tax without RSU)
      const taxWithRSU = taxResults[i].totalTax;
      const taxWithoutRSU = taxResultsWithoutRSU[i].totalTax;
      taxPaid = taxWithRSU - taxWithoutRSU;
      netRSUValue = grossRSUValue - taxPaid;
      
      // Calculate effective marginal rate for display
      marginalTaxRate = grossRSUValue > 0 ? taxPaid / grossRSUValue : 0;
    } else {
      // Fallback: calculate tax on RSU separately (old method)
      const rsuTax = calculateRSUTax(
        salaryGrossIncome,
        grossRSUValue,
        pensionPercentage,
        has30PercentRuling,
        year
      );
      marginalTaxRate = rsuTax.marginalTaxRate;
      taxPaid = rsuTax.taxOnRSU;
      netRSUValue = rsuTax.netRSUValue;
    }
    
    results.push({
      year,
      sharesVested: totalSharesVested,
      grantPriceAvg: avgGrantPrice,
      vestingPriceEur,
      grossRSUValue,
      stockAppreciation,
      appreciationPercentage,
      marginalTaxRate,
      taxPaid,
      netRSUValue
    });
  }
  
  return results;
}

/**
 * Create a default RSU grant (main grant from 2024)
 */
export function createDefaultRSUGrant(grantYear: number = 2024): RSUGrant {
  const grantValueEur = 100000;
  const sharePriceEur = 100;
  
  return {
    id: `grant-${grantYear}-main`,
    grantYear,
    grantType: 'Main',
    grantValueEur,
    sharePriceEur,
    grantShares: grantValueEur / sharePriceEur,
    vestingYears: 4,
    vestingPercentagePerYear: 0.25
  };
}

/**
 * Create a refresher grant
 */
export function createRefresherGrant(grantYear: number, grantValue: number = 40000): RSUGrant {
  const sharePriceEur = 150;
  
  return {
    id: `grant-${grantYear}-refresher`,
    grantYear,
    grantType: 'Refresher',
    grantValueEur: grantValue,
    sharePriceEur,
    grantShares: grantValue / sharePriceEur,
    vestingYears: 4,
    vestingPercentagePerYear: 0.25
  };
}

/**
 * Update grant shares when value or price changes
 */
export function updateGrantShares(grant: RSUGrant): RSUGrant {
  return {
    ...grant,
    grantShares: grant.grantValueEur / grant.sharePriceEur
  };
}

