// Global state management with React Context and localStorage persistence
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type {
  FinancialData,
  FinancialProjections,
  DashboardMetrics,
  ExpenseCategory,
  RSUGrant,
  IncomeSettings,
  InvestmentSettings,
  PlanningSettings,
  TaxResult,
  RSUVestingYear,
  YearlyFinancial,
  YearlyInvestment,
  YearlyPension
} from '../types/financial';
import { calculateTax } from '../utils/taxCalculations';
import { calculateRSUVestingByYear, createDefaultRSUGrant } from '../utils/rsuCalculations';
import { 
  calculateSalaryByYear, 
  calculateFinancialProjections,
  calculateAverageMetrics 
} from '../utils/financialProjections';
import { calculateInvestmentProjections, calculateNetWorthMetrics } from '../utils/investmentCalculations';
import { calculatePensionProjections } from '../utils/pensionCalculations';

// Context type
interface FinancialContextType {
  data: FinancialData;
  projections: FinancialProjections;
  metrics: DashboardMetrics;
  updateIncomeSettings: (settings: Partial<IncomeSettings>) => void;
  updateInvestmentSettings: (settings: Partial<InvestmentSettings>) => void;
  updatePlanningSettings: (settings: Partial<PlanningSettings>) => void;
  addExpenseCategory: (category: ExpenseCategory) => void;
  updateExpenseCategory: (id: string, updates: Partial<ExpenseCategory>) => void;
  removeExpenseCategory: (id: string) => void;
  addRSUGrant: (grant: RSUGrant) => void;
  updateRSUGrant: (id: string, updates: Partial<RSUGrant>) => void;
  removeRSUGrant: (id: string) => void;
  updateRSUGrants: (grants: RSUGrant[]) => void;
  recalculate: () => void;
}

// Create context
const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

// Default values based on actual Databricks payslip
const defaultIncomeSettings: IncomeSettings = {
  baseSalary: 78500, // €6,541.66/month × 12 from payslip
  bonusPercentage: 0.10, // 10% annual bonus (paid separately, not monthly)
  holidayAllowancePercentage: 0.08, // 8% holiday allowance (paid once per year, typically May/June)
  pensionPercentage: 0.0338, // 3.38% from payslip (€221.02 / €6,541.66)
  employerPensionPercentage: 0.08, // Employer contribution
  healthcareBenefitMonthly: 200, // Healthcare benefit (tax-free)
  has30PercentRuling: true,
  salaryGrowthRate: 0.05
};

const defaultInvestmentSettings: InvestmentSettings = {
  startingNetWorth: 71000,
  startingPensionBalance: 0, // Starting pension balance
  annualReturnRate: 0.10,
  pensionReturnRate: 0.07, // Conservative pension fund return
  sharePriceGrowthRate: 0.05, // 5% annual stock price growth
  currentStockPrice: 150, // Current stock price for reference
  bonusInvestmentPercentage: 1.0, // 100% of bonus invested by default
  holidayAllowanceInvestmentPercentage: 1.0 // 100% of holiday allowance invested by default
};

const defaultPlanningSettings: PlanningSettings = {
  startYear: 2025,
  projectionYears: 6,
  expenseInflationRate: 0.02
};

const defaultExpenseCategories: ExpenseCategory[] = [
  { id: 'rent', name: 'Rent', monthlyAmount: 1450 },
  { id: 'utilities', name: 'Utilities', monthlyAmount: 150 },
  { id: 'food', name: 'Food', monthlyAmount: 500 },
  { id: 'holiday', name: 'Holiday', monthlyAmount: 200 },
  { id: 'clothing', name: 'Clothing', monthlyAmount: 200 },
  { id: 'family', name: 'Helping family', monthlyAmount: 400 },
  { id: 'fun', name: 'Fun / entertainment', monthlyAmount: 500 }
];

const defaultRSUGrants: RSUGrant[] = [
  createDefaultRSUGrant(2024)
];

// Provider component
export const FinancialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<FinancialData>(() => {
    // Try to load from localStorage
    const saved = localStorage.getItem('financialData');
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        
        // Migrate old data: add healthcareBenefitMonthly if missing
        if (parsedData.incomeSettings && parsedData.incomeSettings.healthcareBenefitMonthly === undefined) {
          parsedData.incomeSettings.healthcareBenefitMonthly = 200;
        }
        
        // Migrate old data: add bonusInvestmentPercentage if missing
        if (parsedData.investmentSettings && parsedData.investmentSettings.bonusInvestmentPercentage === undefined) {
          parsedData.investmentSettings.bonusInvestmentPercentage = 1.0;
        }
        
        // Migrate old data: add holidayAllowanceInvestmentPercentage if missing
        if (parsedData.investmentSettings && parsedData.investmentSettings.holidayAllowanceInvestmentPercentage === undefined) {
          parsedData.investmentSettings.holidayAllowanceInvestmentPercentage = 1.0;
        }
        
        return parsedData;
      } catch (e) {
        console.error('Failed to parse saved data', e);
      }
    }
    
    // Return default data
    return {
      incomeSettings: defaultIncomeSettings,
      investmentSettings: defaultInvestmentSettings,
      planningSettings: defaultPlanningSettings,
      expenseCategories: defaultExpenseCategories,
      rsuGrants: defaultRSUGrants
    };
  });

  const [projections, setProjections] = useState<FinancialProjections>({
    taxResults: [],
    rsuVestingByYear: [],
    yearlyFinancials: [],
    yearlyInvestments: [],
    yearlyPension: []
  });

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    averageSavingsRate: 0,
    totalSavings: 0,
    finalNetWorth: 0,
    netWorthCAGR: 0,
    totalRSUGrossValue: 0,
    totalRSUTaxPaid: 0,
    totalRSUNetValue: 0,
    averageEffectiveTaxRate: 0
  });

  // Recalculate all projections
  const recalculate = () => {
    const { incomeSettings, investmentSettings, planningSettings, expenseCategories, rsuGrants } = data;
    const { startYear, projectionYears } = planningSettings;

    // Step 1: Calculate salary by year
    const salaryByYear = calculateSalaryByYear(
      incomeSettings.baseSalary,
      incomeSettings.salaryGrowthRate,
      startYear,
      projectionYears
    );

    // Step 2: Calculate RSU vesting by year (without tax first, to get gross RSU values)
    const rsuVestingInitial: RSUVestingYear[] = calculateRSUVestingByYear(
      rsuGrants,
      startYear,
      projectionYears,
      salaryByYear,
      investmentSettings.sharePriceGrowthRate,
      investmentSettings.currentStockPrice,
      incomeSettings.pensionPercentage,
      incomeSettings.has30PercentRuling
      // No taxResults yet - will use fallback calculation
    );

    // Step 3: Calculate tax for each year (salary + RSU combined - this is how it works in NL)
    const taxResults: TaxResult[] = [];
    const taxResultsWithoutRSU: TaxResult[] = [];
    
    for (let i = 0; i < projectionYears; i++) {
      const year = startYear + i;
      const salary = salaryByYear.get(year) || 0;
      // Total salary income = base + holiday allowance + bonus
      const salaryIncome = salary * (1 + incomeSettings.holidayAllowancePercentage + incomeSettings.bonusPercentage);
      const rsuIncome = rsuVestingInitial[i]?.grossRSUValue || 0;
      
      // Total gross income includes both salary and RSU
      const totalGrossIncome = salaryIncome + rsuIncome;
      
      // IMPORTANT: Pension is only calculated on BASE SALARY, not on bonus/holiday/RSU
      const pensionAmount = salary * incomeSettings.pensionPercentage;
      
      // Calculate tax with RSU
      const taxResult = calculateTax(
        totalGrossIncome,
        incomeSettings.pensionPercentage,
        incomeSettings.has30PercentRuling,
        year,
        undefined, // Use default tax config
        pensionAmount // Pass explicit pension amount (only on base salary)
      );
      
      // Calculate tax without RSU (for accurate RSU tax calculation)
      const taxResultWithoutRSU = calculateTax(
        salaryIncome,
        incomeSettings.pensionPercentage,
        incomeSettings.has30PercentRuling,
        year,
        undefined, // Use default tax config
        pensionAmount // Pass explicit pension amount (only on base salary)
      );
      
      taxResults.push(taxResult);
      taxResultsWithoutRSU.push(taxResultWithoutRSU);
    }

    // Step 4: Recalculate RSU vesting with proper tax information
    const rsuVestingByYear: RSUVestingYear[] = calculateRSUVestingByYear(
      rsuGrants,
      startYear,
      projectionYears,
      salaryByYear,
      investmentSettings.sharePriceGrowthRate,
      investmentSettings.currentStockPrice,
      incomeSettings.pensionPercentage,
      incomeSettings.has30PercentRuling,
      taxResults, // Tax with RSU
      taxResultsWithoutRSU // Tax without RSU for accurate RSU tax calculation
    );

    // Step 5: Calculate yearly financials
    const yearlyFinancials: YearlyFinancial[] = calculateFinancialProjections(
      incomeSettings,
      planningSettings,
      expenseCategories,
      taxResults,
      rsuVestingByYear,
      taxResultsWithoutRSU // Pass salary-only tax for accurate net income
    );

    // Step 6: Calculate investment projections
    const yearlyInvestments: YearlyInvestment[] = calculateInvestmentProjections(
      investmentSettings.startingNetWorth,
      investmentSettings.annualReturnRate,
      yearlyFinancials,
      incomeSettings,
      investmentSettings
    );

    // Step 6b: Calculate pension projections (separate from investments)
    const yearlyPension: YearlyPension[] = calculatePensionProjections(
      investmentSettings.startingPensionBalance,
      investmentSettings.pensionReturnRate,
      yearlyFinancials,
      taxResults
    );

    // Step 7: Calculate dashboard metrics
    const avgMetrics = calculateAverageMetrics(yearlyFinancials);
    const netWorthMetrics = calculateNetWorthMetrics(yearlyInvestments);
    
    const totalRSUGrossValue = rsuVestingByYear.reduce((sum, r) => sum + r.grossRSUValue, 0);
    const totalRSUTaxPaid = rsuVestingByYear.reduce((sum, r) => sum + r.taxPaid, 0);
    const totalRSUNetValue = rsuVestingByYear.reduce((sum, r) => sum + r.netRSUValue, 0);

    const newMetrics: DashboardMetrics = {
      averageSavingsRate: avgMetrics.averageSavingsRate,
      totalSavings: avgMetrics.totalSavings,
      finalNetWorth: netWorthMetrics.finalNetWorth,
      netWorthCAGR: netWorthMetrics.netWorthCAGR,
      totalRSUGrossValue,
      totalRSUTaxPaid,
      totalRSUNetValue,
      averageEffectiveTaxRate: avgMetrics.averageEffectiveTaxRate
    };

    setProjections({
      taxResults,
      rsuVestingByYear,
      yearlyFinancials,
      yearlyInvestments,
      yearlyPension
    });

    setMetrics(newMetrics);
  };

  // Recalculate whenever data changes
  useEffect(() => {
    recalculate();
    // Save to localStorage
    localStorage.setItem('financialData', JSON.stringify(data));
  }, [data]);

  // Update functions
  const updateIncomeSettings = (settings: Partial<IncomeSettings>) => {
    setData(prev => ({
      ...prev,
      incomeSettings: { ...prev.incomeSettings, ...settings }
    }));
  };

  const updateInvestmentSettings = (settings: Partial<InvestmentSettings>) => {
    setData(prev => ({
      ...prev,
      investmentSettings: { ...prev.investmentSettings, ...settings }
    }));
  };

  const updatePlanningSettings = (settings: Partial<PlanningSettings>) => {
    setData(prev => ({
      ...prev,
      planningSettings: { ...prev.planningSettings, ...settings }
    }));
  };

  const addExpenseCategory = (category: ExpenseCategory) => {
    setData(prev => ({
      ...prev,
      expenseCategories: [...prev.expenseCategories, category]
    }));
  };

  const updateExpenseCategory = (id: string, updates: Partial<ExpenseCategory>) => {
    setData(prev => ({
      ...prev,
      expenseCategories: prev.expenseCategories.map(cat =>
        cat.id === id ? { ...cat, ...updates } : cat
      )
    }));
  };

  const removeExpenseCategory = (id: string) => {
    setData(prev => ({
      ...prev,
      expenseCategories: prev.expenseCategories.filter(cat => cat.id !== id)
    }));
  };

  const addRSUGrant = (grant: RSUGrant) => {
    setData(prev => ({
      ...prev,
      rsuGrants: [...prev.rsuGrants, grant]
    }));
  };

  const updateRSUGrant = (id: string, updates: Partial<RSUGrant>) => {
    setData(prev => ({
      ...prev,
      rsuGrants: prev.rsuGrants.map(grant => {
        if (grant.id === id) {
          const updated = { ...grant, ...updates };
          // Recalculate shares if value or price changed
          if (updates.grantValueEur !== undefined || updates.sharePriceEur !== undefined) {
            updated.grantShares = updated.grantValueEur / updated.sharePriceEur;
          }
          return updated;
        }
        return grant;
      })
    }));
  };

  const removeRSUGrant = (id: string) => {
    setData(prev => ({
      ...prev,
      rsuGrants: prev.rsuGrants.filter(grant => grant.id !== id)
    }));
  };

  const updateRSUGrants = (grants: RSUGrant[]) => {
    setData(prev => ({
      ...prev,
      rsuGrants: grants
    }));
  };

  const value: FinancialContextType = {
    data,
    projections,
    metrics,
    updateIncomeSettings,
    updateInvestmentSettings,
    updatePlanningSettings,
    addExpenseCategory,
    updateExpenseCategory,
    removeExpenseCategory,
    addRSUGrant,
    updateRSUGrant,
    removeRSUGrant,
    updateRSUGrants,
    recalculate
  };

  return (
    <FinancialContext.Provider value={value}>
      {children}
    </FinancialContext.Provider>
  );
};

// Hook to use the context
export const useFinancial = (): FinancialContextType => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};

