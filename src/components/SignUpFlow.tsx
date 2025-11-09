import React, { useState } from 'react';
import { useFinancial } from '../context/FinancialContext';
import { TrendingUp, DollarSign, Award, ArrowRight, Receipt } from 'lucide-react';

interface SignUpFlowProps {
  onComplete: () => void;
}

export const SignUpFlow: React.FC<SignUpFlowProps> = ({ onComplete }) => {
  const { updateIncomeSettings, updateInvestmentSettings, updatePlanningSettings, addExpenseCategory, addRSUGrant } = useFinancial();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    baseSalary: '',
    has30PercentRuling: false,
    holidayAllowancePercentage: '',
    bonusPercentage: '',
    salaryGrowthRate: '',
    pensionPercentage: '',
    employerPensionPercentage: '',
    healthcareBenefitMonthly: '',
    startingNetWorth: '',
    currentStockPrice: '',
    rent: '',
    food: '',
    utilities: '',
    rsuGrantYear: new Date().getFullYear().toString(),
    rsuGrantValue: '',
    rsuGrantType: 'Main' as 'Main' | 'Refresher' | 'Promo' | 'Retention',
    rsuVestingYears: '4',
    rsuVestingType: 'Equal Annual' as 'Equal Annual' | 'Cliff' | 'Custom',
    startYear: new Date().getFullYear(),
    projectionYears: 6
  });

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    // Save all data
    if (formData.baseSalary) {
      updateIncomeSettings({
        baseSalary: parseFloat(formData.baseSalary) || 0,
        has30PercentRuling: formData.has30PercentRuling,
        holidayAllowancePercentage: parseFloat(formData.holidayAllowancePercentage) / 100 || 0,
        bonusPercentage: parseFloat(formData.bonusPercentage) / 100 || 0,
        salaryGrowthRate: parseFloat(formData.salaryGrowthRate) / 100 || 0,
        pensionPercentage: parseFloat(formData.pensionPercentage) / 100 || 0,
        employerPensionPercentage: parseFloat(formData.employerPensionPercentage) / 100 || 0,
        healthcareBenefitMonthly: parseFloat(formData.healthcareBenefitMonthly) || 0
      });
    }
    
    if (formData.startingNetWorth) {
      updateInvestmentSettings({
        startingNetWorth: parseFloat(formData.startingNetWorth) || 0,
        currentStockPrice: parseFloat(formData.currentStockPrice) || 0
      });
    }

    // Add expense categories
    if (formData.rent) {
      addExpenseCategory({
        id: 'rent',
        name: 'Rent',
        monthlyAmount: parseFloat(formData.rent) || 0
      });
    }
    if (formData.food) {
      addExpenseCategory({
        id: 'food',
        name: 'Food',
        monthlyAmount: parseFloat(formData.food) || 0
      });
    }
    if (formData.utilities) {
      addExpenseCategory({
        id: 'utilities',
        name: 'Utilities',
        monthlyAmount: parseFloat(formData.utilities) || 0
      });
    }

    // Add RSU grant if provided
    if (formData.rsuGrantValue && formData.currentStockPrice) {
      const grantYear = parseInt(formData.rsuGrantYear) || new Date().getFullYear();
      const grantValue = parseFloat(formData.rsuGrantValue) || 0;
      const sharePrice = parseFloat(formData.currentStockPrice) || 0;
      const vestingYears = parseInt(formData.rsuVestingYears) || 4;
      
      // Calculate vesting percentage per year based on vesting type
      let vestingPercentagePerYear = 0.25; // Default: equal annual
      if (formData.rsuVestingType === 'Equal Annual') {
        vestingPercentagePerYear = 1 / vestingYears;
      } else if (formData.rsuVestingType === 'Cliff') {
        vestingPercentagePerYear = 0; // Will vest 100% at the end
      } else {
        // Custom: default to equal annual for now
        vestingPercentagePerYear = 1 / vestingYears;
      }
      
      if (grantValue > 0 && sharePrice > 0) {
        addRSUGrant({
          id: `grant-${grantYear}-${formData.rsuGrantType.toLowerCase()}`,
          grantYear,
          grantType: formData.rsuGrantType,
          grantValueEur: grantValue,
          sharePriceEur: sharePrice,
          grantShares: grantValue / sharePrice,
          vestingYears,
          vestingPercentagePerYear: formData.rsuVestingType === 'Cliff' ? 0 : vestingPercentagePerYear
        });
      }
    }

    updatePlanningSettings({
      startYear: formData.startYear,
      projectionYears: formData.projectionYears
    });

    onComplete();
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.baseSalary !== '';
      case 2:
        return formData.startingNetWorth !== '' && formData.currentStockPrice !== '';
      case 3:
        return formData.rent !== '' || formData.food !== '';
      case 4:
        return true; // RSU grants are optional
      case 5:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center shrink-0">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    step >= s ? 'bg-primary border-primary text-primary-foreground' : 'border-border text-muted-foreground'
                  }`}>
                    {step > s ? '✓' : s}
                  </div>
                </div>
                {s < 5 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    step > s ? 'bg-primary' : 'bg-border'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex text-xs text-muted-foreground">
            <div className="w-10 text-center shrink-0">Income</div>
            <div className="flex-1 text-center">Investments</div>
            <div className="flex-1 text-center">Expenses</div>
            <div className="flex-1 text-center">RSU Grants</div>
            <div className="w-10 text-center shrink-0">Review</div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-border/50 p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <DollarSign className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Salary & Compensation</h2>
                <p className="text-muted-foreground">Your base salary and standard Dutch compensation components</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Base Salary (Annual) (€)</label>
                  <input
                    type="number"
                    value={formData.baseSalary}
                    onChange={(e) => handleInputChange('baseSalary', e.target.value)}
                    placeholder="e.g., 80000"
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Your yearly gross salary</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Holiday Allowance (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={formData.holidayAllowancePercentage}
                        onChange={(e) => handleInputChange('holidayAllowancePercentage', e.target.value)}
                        placeholder="0.0"
                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Paid once yearly</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Bonus Percentage (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={formData.bonusPercentage}
                        onChange={(e) => handleInputChange('bonusPercentage', e.target.value)}
                        placeholder="0.0"
                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Annual bonus</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Salary Growth Rate (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      value={formData.salaryGrowthRate}
                      onChange={(e) => handleInputChange('salaryGrowthRate', e.target.value)}
                      placeholder="0.0"
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Expected annual raise</p>
                </div>

                <div className="pt-4 border-t border-border/50">
                  <h3 className="text-sm font-semibold mb-4">Pension & Benefits</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Your Pension Contribution (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          value={formData.pensionPercentage}
                          onChange={(e) => handleInputChange('pensionPercentage', e.target.value)}
                          placeholder="0.00"
                          className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Deducted from gross salary</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Employer Pension (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          value={formData.employerPensionPercentage}
                          onChange={(e) => handleInputChange('employerPensionPercentage', e.target.value)}
                          placeholder="0.0"
                          className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Company's contribution</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Healthcare Benefit (Monthly) (€)</label>
                    <input
                      type="number"
                      value={formData.healthcareBenefitMonthly}
                      onChange={(e) => handleInputChange('healthcareBenefitMonthly', e.target.value)}
                      placeholder="e.g., 200"
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Tax-free healthcare perk</p>
                  </div>

                  <div className="flex items-center gap-3 p-4 border border-border rounded-lg">
                    <input
                      type="checkbox"
                      id="30ruling"
                      checked={formData.has30PercentRuling}
                      onChange={(e) => handleInputChange('has30PercentRuling', e.target.checked)}
                      className="w-5 h-5 text-primary rounded"
                    />
                    <div>
                      <label htmlFor="30ruling" className="text-sm font-medium cursor-pointer block">
                        30% Ruling
                      </label>
                      <p className="text-xs text-muted-foreground">Only 70% taxable</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Investment Settings</h2>
                <p className="text-muted-foreground">Tell us about your current investments</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Starting Net Worth (€)</label>
                  <input
                    type="number"
                    value={formData.startingNetWorth}
                    onChange={(e) => handleInputChange('startingNetWorth', e.target.value)}
                    placeholder="e.g., 50000"
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Current Stock Price (€)</label>
                  <input
                    type="number"
                    value={formData.currentStockPrice}
                    onChange={(e) => handleInputChange('currentStockPrice', e.target.value)}
                    placeholder="e.g., 100"
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">For RSU vesting calculations</p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Receipt className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Monthly Expenses</h2>
                <p className="text-muted-foreground">Tell us about your main expenses</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rent (€/month)</label>
                  <input
                    type="number"
                    value={formData.rent}
                    onChange={(e) => handleInputChange('rent', e.target.value)}
                    placeholder="e.g., 1200"
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Food (€/month)</label>
                  <input
                    type="number"
                    value={formData.food}
                    onChange={(e) => handleInputChange('food', e.target.value)}
                    placeholder="e.g., 400"
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Utilities (€/month)</label>
                  <input
                    type="number"
                    value={formData.utilities}
                    onChange={(e) => handleInputChange('utilities', e.target.value)}
                    placeholder="e.g., 150"
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Optional - you can add more later</p>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Award className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">RSU Grants</h2>
                <p className="text-muted-foreground">Add your stock grant (optional - you can add more later)</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Grant Year</label>
                  <input
                    type="number"
                    value={formData.rsuGrantYear}
                    onChange={(e) => handleInputChange('rsuGrantYear', e.target.value)}
                    placeholder={new Date().getFullYear().toString()}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Grant Type</label>
                  <select
                    value={formData.rsuGrantType}
                    onChange={(e) => handleInputChange('rsuGrantType', e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Main">Main Grant</option>
                    <option value="Refresher">Refresher</option>
                    <option value="Promo">Promotion</option>
                    <option value="Retention">Retention</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Grant Value (€)</label>
                  <input
                    type="number"
                    value={formData.rsuGrantValue}
                    onChange={(e) => handleInputChange('rsuGrantValue', e.target.value)}
                    placeholder="e.g., 50000"
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Total value of the grant</p>
                </div>

                <div className="pt-4 border-t border-border/50">
                  <h3 className="text-sm font-semibold mb-4">Vesting Schedule</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Vesting Years</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.rsuVestingYears}
                        onChange={(e) => handleInputChange('rsuVestingYears', e.target.value)}
                        placeholder="4"
                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Total vesting period</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Vesting Type</label>
                      <select
                        value={formData.rsuVestingType}
                        onChange={(e) => handleInputChange('rsuVestingType', e.target.value)}
                        className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="Equal Annual">Equal Annual</option>
                        <option value="Cliff">Cliff (all at end)</option>
                        <option value="Custom">Custom</option>
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formData.rsuVestingType === 'Equal Annual' 
                          ? `${Math.round(100 / parseFloat(formData.rsuVestingYears || '4'))}% per year`
                          : formData.rsuVestingType === 'Cliff'
                          ? '100% after vesting period'
                          : 'Specify custom schedule'}
                      </p>
                    </div>
                  </div>
                </div>

                {!formData.currentStockPrice && (
                  <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg">
                    <p className="text-sm text-warning-foreground">
                      ⚠️ Stock price is required. Please go back to Investments step to set it.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
                  <Award className="w-8 h-8 text-success" />
                </div>
                <h2 className="text-2xl font-bold mb-2">You're All Set!</h2>
                <p className="text-muted-foreground">Review your settings and get started</p>
              </div>

              <div className="space-y-4 bg-muted/30 rounded-lg p-6">
                <div className="pb-2 border-b border-border/50">
                  <p className="text-sm font-semibold text-foreground mb-3">Salary & Compensation</p>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Base Salary</span>
                  <span className="font-semibold">€{parseFloat(formData.baseSalary || '0').toLocaleString()}</span>
                </div>
                {formData.holidayAllowancePercentage && (
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Holiday Allowance</span>
                    <span className="font-semibold">{parseFloat(formData.holidayAllowancePercentage || '0').toFixed(1)}%</span>
                  </div>
                )}
                {formData.bonusPercentage && (
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Bonus</span>
                    <span className="font-semibold">{parseFloat(formData.bonusPercentage || '0').toFixed(1)}%</span>
                  </div>
                )}
                {formData.salaryGrowthRate && (
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Salary Growth</span>
                    <span className="font-semibold">{parseFloat(formData.salaryGrowthRate || '0').toFixed(1)}%</span>
                  </div>
                )}
                <div className="pt-2 border-t border-border/50">
                  <p className="text-sm font-semibold text-foreground mb-3">Pension & Benefits</p>
                </div>
                {formData.pensionPercentage && (
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Pension Contribution</span>
                    <span className="font-semibold">{parseFloat(formData.pensionPercentage || '0').toFixed(2)}%</span>
                  </div>
                )}
                {formData.employerPensionPercentage && (
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Employer Pension</span>
                    <span className="font-semibold">{parseFloat(formData.employerPensionPercentage || '0').toFixed(1)}%</span>
                  </div>
                )}
                {formData.healthcareBenefitMonthly && (
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Healthcare Benefit</span>
                    <span className="font-semibold">€{parseFloat(formData.healthcareBenefitMonthly || '0').toLocaleString()}/month</span>
                  </div>
                )}
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">30% Ruling</span>
                  <span className="font-semibold">{formData.has30PercentRuling ? 'Yes' : 'No'}</span>
                </div>
                <div className="pt-2 border-t border-border/50">
                  <p className="text-sm font-semibold text-foreground mb-3">Investments</p>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Starting Net Worth</span>
                  <span className="font-semibold">€{parseFloat(formData.startingNetWorth || '0').toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Current Stock Price</span>
                  <span className="font-semibold">€{parseFloat(formData.currentStockPrice || '0').toLocaleString()}</span>
                </div>
                {(formData.rent || formData.food || formData.utilities) && (
                  <>
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Monthly Expenses</p>
                    </div>
                    {formData.rent && (
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground text-sm">Rent</span>
                        <span className="font-semibold text-sm">€{parseFloat(formData.rent || '0').toLocaleString()}</span>
                      </div>
                    )}
                    {formData.food && (
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground text-sm">Food</span>
                        <span className="font-semibold text-sm">€{parseFloat(formData.food || '0').toLocaleString()}</span>
                      </div>
                    )}
                    {formData.utilities && (
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground text-sm">Utilities</span>
                        <span className="font-semibold text-sm">€{parseFloat(formData.utilities || '0').toLocaleString()}</span>
                      </div>
                    )}
                  </>
                )}
                {formData.rsuGrantValue && (
                  <>
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-sm font-semibold text-foreground mb-3">RSU Grant</p>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Grant Type</span>
                      <span className="font-semibold">{formData.rsuGrantType}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Grant Year</span>
                      <span className="font-semibold">{formData.rsuGrantYear}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Grant Value</span>
                      <span className="font-semibold">€{parseFloat(formData.rsuGrantValue || '0').toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Vesting Years</span>
                      <span className="font-semibold">{formData.rsuVestingYears} years</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">Vesting Type</span>
                      <span className="font-semibold">{formData.rsuVestingType}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/50">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-6 py-2.5 text-muted-foreground hover:text-foreground transition-colors"
              >
                Back
              </button>
            )}
            <div className="flex-1" />
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {step === 5 ? 'Get Started' : 'Next'}
              {step < 5 && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          All data is stored locally in your browser
        </p>
      </div>
    </div>
  );
};

