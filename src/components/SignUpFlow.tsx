import React, { useState } from 'react';
import { useFinancial } from '../context/FinancialContext';
import { TrendingUp, DollarSign, Award, ArrowRight, Receipt } from 'lucide-react';

interface SignUpFlowProps {
  onComplete: () => void;
}

export const SignUpFlow: React.FC<SignUpFlowProps> = ({ onComplete }) => {
  const { updateIncomeSettings, updateInvestmentSettings, updatePlanningSettings, addExpenseCategory } = useFinancial();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    baseSalary: '',
    has30PercentRuling: false,
    startingNetWorth: '',
    currentStockPrice: '',
    rent: '',
    food: '',
    utilities: '',
    startYear: new Date().getFullYear(),
    projectionYears: 6
  });

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 4) {
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
        has30PercentRuling: formData.has30PercentRuling
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
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  step >= s ? 'bg-primary border-primary text-primary-foreground' : 'border-border text-muted-foreground'
                }`}>
                  {step > s ? '✓' : s}
                </div>
                {s < 4 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    step > s ? 'bg-primary' : 'bg-border'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Income</span>
            <span>Investments</span>
            <span>Expenses</span>
            <span>Review</span>
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
                <h2 className="text-2xl font-bold mb-2">Set Up Your Income</h2>
                <p className="text-muted-foreground">Let's start with your base salary</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Annual Base Salary (€)</label>
                  <input
                    type="number"
                    value={formData.baseSalary}
                    onChange={(e) => handleInputChange('baseSalary', e.target.value)}
                    placeholder="e.g., 80000"
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center gap-3 p-4 border border-border rounded-lg">
                  <input
                    type="checkbox"
                    id="30ruling"
                    checked={formData.has30PercentRuling}
                    onChange={(e) => handleInputChange('has30PercentRuling', e.target.checked)}
                    className="w-5 h-5 text-primary rounded"
                  />
                  <label htmlFor="30ruling" className="text-sm cursor-pointer">
                    I have 30% ruling
                  </label>
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
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
                  <Award className="w-8 h-8 text-success" />
                </div>
                <h2 className="text-2xl font-bold mb-2">You're All Set!</h2>
                <p className="text-muted-foreground">Review your settings and get started</p>
              </div>

              <div className="space-y-4 bg-muted/30 rounded-lg p-6">
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Base Salary</span>
                  <span className="font-semibold">€{parseFloat(formData.baseSalary || '0').toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">30% Ruling</span>
                  <span className="font-semibold">{formData.has30PercentRuling ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Starting Net Worth</span>
                  <span className="font-semibold">€{parseFloat(formData.startingNetWorth || '0').toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border/50">
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
              {step === 4 ? 'Get Started' : 'Next'}
              {step < 4 && <ArrowRight className="w-4 h-4" />}
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

