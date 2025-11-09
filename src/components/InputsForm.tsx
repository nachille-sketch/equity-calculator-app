// Settings page - Crisp Wallet Style with organized sections
import React, { useState } from 'react';
import { useFinancial } from '../context/FinancialContext';
import type { ExpenseCategory, RSUGrant } from '../types/financial';

export const InputsForm: React.FC = () => {
  const {
    data,
    updateIncomeSettings,
    updateInvestmentSettings,
    updatePlanningSettings,
    addExpenseCategory,
    updateExpenseCategory,
    removeExpenseCategory,
    addRSUGrant,
    updateRSUGrant,
    removeRSUGrant
  } = useFinancial();

  const [activeSection, setActiveSection] = useState<'income' | 'expenses' | 'investments' | 'rsus' | 'planning'>('income');
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  
  const [showAddGrantForm, setShowAddGrantForm] = useState(false);
  const [editingGrantId, setEditingGrantId] = useState<string | null>(null);
  const [newGrant, setNewGrant] = useState({
    grantYear: new Date().getFullYear(),
    grantType: 'Refresher',
    grantValueEur: 40000,
    sharePriceEur: 150,
    vestingYears: 4,
    vestingPercentagePerYear: 25
  });

  const handleAddExpense = () => {
    if (newExpenseName && newExpenseAmount) {
      const newCategory: ExpenseCategory = {
        id: `expense-${Date.now()}`,
        name: newExpenseName,
        monthlyAmount: parseFloat(newExpenseAmount)
      };
      addExpenseCategory(newCategory);
      setNewExpenseName('');
      setNewExpenseAmount('');
    }
  };

  const handleAddGrant = () => {
    const grant: RSUGrant = {
      id: `grant-${Date.now()}`,
      grantYear: newGrant.grantYear,
      grantType: newGrant.grantType,
      grantValueEur: newGrant.grantValueEur,
      sharePriceEur: newGrant.sharePriceEur,
      grantShares: newGrant.grantValueEur / newGrant.sharePriceEur,
      vestingYears: newGrant.vestingYears,
      vestingPercentagePerYear: newGrant.vestingPercentagePerYear / 100
    };
    
    addRSUGrant(grant);
    setShowAddGrantForm(false);
    
    // Reset form
    setNewGrant({
      grantYear: new Date().getFullYear(),
      grantType: 'Refresher',
      grantValueEur: 40000,
      sharePriceEur: 150,
      vestingYears: 4,
      vestingPercentagePerYear: 25
    });
  };

  const handleEditGrant = (grant: RSUGrant) => {
    setEditingGrantId(grant.id);
    setNewGrant({
      grantYear: grant.grantYear,
      grantType: grant.grantType,
      grantValueEur: grant.grantValueEur,
      sharePriceEur: grant.sharePriceEur,
      vestingYears: grant.vestingYears,
      vestingPercentagePerYear: grant.vestingPercentagePerYear * 100
    });
    setShowAddGrantForm(false);
  };

  const handleSaveEdit = () => {
    if (editingGrantId) {
      updateRSUGrant(editingGrantId, {
        grantYear: newGrant.grantYear,
        grantType: newGrant.grantType,
        grantValueEur: newGrant.grantValueEur,
        sharePriceEur: newGrant.sharePriceEur,
        grantShares: newGrant.grantValueEur / newGrant.sharePriceEur,
        vestingYears: newGrant.vestingYears,
        vestingPercentagePerYear: newGrant.vestingPercentagePerYear / 100
      });
      
      setEditingGrantId(null);
      
      // Reset form
      setNewGrant({
        grantYear: new Date().getFullYear(),
        grantType: 'Refresher',
        grantValueEur: 40000,
        sharePriceEur: 150,
        vestingYears: 4,
        vestingPercentagePerYear: 25
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingGrantId(null);
    setNewGrant({
      grantYear: new Date().getFullYear(),
      grantType: 'Refresher',
      grantValueEur: 40000,
      sharePriceEur: 150,
      vestingYears: 4,
      vestingPercentagePerYear: 25
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('€', '€');
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  };

  const totalMonthlyExpenses = data.expenseCategories.reduce((sum, cat) => sum + cat.monthlyAmount, 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <section className="p-10 bg-gradient-to-br from-card via-card to-accent/30 border border-border/50 shadow-sm rounded-lg">
        <div className="space-y-2">
          <h2 className="text-4xl font-semibold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Configure your income, expenses, investments, and assumptions
          </p>
        </div>
      </section>

      {/* Section Navigation */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border/50">
        {[
          { id: 'income', label: 'Income', desc: 'Salary & benefits' },
          { id: 'expenses', label: 'Expenses', desc: 'Monthly budget' },
          { id: 'investments', label: 'Investments', desc: 'Portfolio & pension' },
          { id: 'rsus', label: 'RSU Grants', desc: 'Stock grants' },
          { id: 'planning', label: 'Planning', desc: 'Timeframe & growth' },
        ].map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id as any)}
            className={`flex-shrink-0 px-6 py-3 rounded-lg transition-all ${
              activeSection === section.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border/50 text-foreground hover:border-border'
            }`}
          >
            <div className="text-left">
              <div className="font-medium">{section.label}</div>
              <div className="text-xs opacity-80">{section.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Income Section */}
      {activeSection === 'income' && (
        <div className="space-y-6">
          <section className="bg-card border border-border/50 rounded-lg shadow-card hover:shadow-elevated transition-shadow duration-200 p-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Salary & Compensation</h3>
              <p className="text-sm text-muted-foreground">
                Your base salary and standard Dutch compensation components
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Base Salary (Annual)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">€</span>
                  <input
                    type="number"
                    value={data.incomeSettings.baseSalary}
                    onChange={(e) => updateIncomeSettings({ baseSalary: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Your yearly gross salary</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Bonus Percentage
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={(data.incomeSettings.bonusPercentage * 100).toFixed(1)}
                    onChange={(e) => updateIncomeSettings({ bonusPercentage: parseFloat(e.target.value) / 100 })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Annual bonus (tracked yearly, not monthly)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Holiday Allowance
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={(data.incomeSettings.holidayAllowancePercentage * 100).toFixed(1)}
                    onChange={(e) => updateIncomeSettings({ holidayAllowancePercentage: parseFloat(e.target.value) / 100 })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Paid once yearly (tracked annually, not monthly)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Salary Growth Rate
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={(data.incomeSettings.salaryGrowthRate * 100).toFixed(1)}
                    onChange={(e) => updateIncomeSettings({ salaryGrowthRate: parseFloat(e.target.value) / 100 })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Expected annual raise</p>
              </div>
            </div>
          </section>

          <section className="bg-card border border-border/50 rounded-lg shadow-card hover:shadow-elevated transition-shadow duration-200 p-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Pension & Benefits</h3>
              <p className="text-sm text-muted-foreground">
                Retirement contributions and employer benefits
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Your Pension Contribution
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={(data.incomeSettings.pensionPercentage * 100).toFixed(2)}
                    onChange={(e) => updateIncomeSettings({ pensionPercentage: parseFloat(e.target.value) / 100 })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Deducted from gross salary</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Employer Pension Contribution
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={(data.incomeSettings.employerPensionPercentage * 100).toFixed(1)}
                    onChange={(e) => updateIncomeSettings({ employerPensionPercentage: parseFloat(e.target.value) / 100 })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Company's contribution</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Healthcare Benefit (Monthly)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">€</span>
                  <input
                    type="number"
                    value={data.incomeSettings.healthcareBenefitMonthly}
                    onChange={(e) => updateIncomeSettings({ healthcareBenefitMonthly: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Tax-free healthcare perk</p>
              </div>

              <div className="flex items-center">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={data.incomeSettings.has30PercentRuling}
                    onChange={(e) => updateIncomeSettings({ has30PercentRuling: e.target.checked })}
                    className="w-5 h-5 border-border rounded focus:ring-primary"
                  />
                  <div>
                    <span className="text-sm font-medium">30% Ruling</span>
                    <p className="text-xs text-muted-foreground">Only 70% taxable</p>
                  </div>
                </label>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Expenses Section */}
      {activeSection === 'expenses' && (
        <div className="space-y-6">
          <section className="bg-card border border-border/50 rounded-lg shadow-card hover:shadow-elevated transition-shadow duration-200 p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">Monthly Expenses</h3>
                <p className="text-sm text-muted-foreground">
                  Track your regular monthly spending
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Monthly</p>
                <p className="text-3xl font-semibold">{formatCurrency(totalMonthlyExpenses)}</p>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              {data.expenseCategories.map((category) => (
                <div key={category.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                  <input
                    type="text"
                    value={category.name}
                    onChange={(e) => updateExpenseCategory(category.id, { name: e.target.value })}
                    className="flex-1 px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Category name"
                  />
                  <div className="relative w-40">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">€</span>
                    <input
                      type="number"
                      value={category.monthlyAmount}
                      onChange={(e) => updateExpenseCategory(category.id, { monthlyAmount: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-8 pr-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={() => removeExpenseCategory(category.id)}
                    className="px-4 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-border/50 pt-6">
              <h4 className="text-sm font-medium mb-3">Add New Expense</h4>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={newExpenseName}
                  onChange={(e) => setNewExpenseName(e.target.value)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Expense name"
                />
                <div className="relative w-40">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">€</span>
                  <input
                    type="number"
                    value={newExpenseAmount}
                    onChange={(e) => setNewExpenseAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Amount"
                  />
                </div>
                <button
                  onClick={handleAddExpense}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Add
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Investments Section */}
      {activeSection === 'investments' && (
        <div className="space-y-6">
          <section className="bg-card border border-border/50 rounded-lg shadow-card hover:shadow-elevated transition-shadow duration-200 p-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Liquid Investments</h3>
              <p className="text-sm text-muted-foreground">
                Your current portfolio and expected returns
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Current Net Worth
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">€</span>
                  <input
                    type="number"
                    value={data.investmentSettings.startingNetWorth}
                    onChange={(e) => updateInvestmentSettings({ startingNetWorth: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Liquid investments today</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Expected Annual Return
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={(data.investmentSettings.annualReturnRate * 100).toFixed(1)}
                    onChange={(e) => updateInvestmentSettings({ annualReturnRate: parseFloat(e.target.value) / 100 })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Portfolio growth rate</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Current Stock Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">€</span>
                  <input
                    type="number"
                    step="0.01"
                    value={data.investmentSettings.currentStockPrice}
                    onChange={(e) => updateInvestmentSettings({ currentStockPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">For RSU calculations</p>
              </div>
            </div>
          </section>

          <section className="bg-card border border-border/50 rounded-lg shadow-card hover:shadow-elevated transition-shadow duration-200 p-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Pension Fund</h3>
              <p className="text-sm text-muted-foreground">
                Locked retirement savings (separate from net worth)
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Current Pension Balance
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">€</span>
                  <input
                    type="number"
                    value={data.investmentSettings.startingPensionBalance}
                    onChange={(e) => updateInvestmentSettings({ startingPensionBalance: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Today's pension value</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Pension Return Rate
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={(data.investmentSettings.pensionReturnRate * 100).toFixed(1)}
                    onChange={(e) => updateInvestmentSettings({ pensionReturnRate: parseFloat(e.target.value) / 100 })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Conservative rate (~7%)</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Stock Price Growth
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={(data.investmentSettings.sharePriceGrowthRate * 100).toFixed(1)}
                    onChange={(e) => updateInvestmentSettings({ sharePriceGrowthRate: parseFloat(e.target.value) / 100 })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">RSU appreciation rate</p>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* RSU Grants Section */}
      {activeSection === 'rsus' && (
        <div className="space-y-6">
          <section className="bg-card border border-border/50 rounded-lg shadow-card hover:shadow-elevated transition-shadow duration-200 p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">RSU Grants</h3>
                <p className="text-sm text-muted-foreground">
                  Manage your stock compensation grants
                </p>
              </div>
              <button
                onClick={() => setShowAddGrantForm(true)}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                + Add Grant
              </button>
            </div>
            
            {/* Existing Grants */}
            <div className="space-y-3">
              {data.rsuGrants.map((grant) => (
                editingGrantId === grant.id ? (
                  <div key={grant.id} className="p-4 bg-accent/30 border border-border rounded-lg">
                    <h4 className="text-sm font-semibold mb-4">Edit Grant</h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-medium mb-1">Grant Year</label>
                        <input
                          type="number"
                          value={newGrant.grantYear}
                          onChange={(e) => setNewGrant({ ...newGrant, grantYear: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Grant Type</label>
                        <input
                          type="text"
                          value={newGrant.grantType}
                          onChange={(e) => setNewGrant({ ...newGrant, grantType: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Grant Value (EUR)</label>
                        <input
                          type="number"
                          value={newGrant.grantValueEur}
                          onChange={(e) => setNewGrant({ ...newGrant, grantValueEur: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Share Price at Grant</label>
                        <input
                          type="number"
                          value={newGrant.sharePriceEur}
                          onChange={(e) => setNewGrant({ ...newGrant, sharePriceEur: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Vesting Years</label>
                        <input
                          type="number"
                          value={newGrant.vestingYears}
                          onChange={(e) => setNewGrant({ ...newGrant, vestingYears: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Vesting % per Year</label>
                        <input
                          type="number"
                          value={newGrant.vestingPercentagePerYear}
                          onChange={(e) => setNewGrant({ ...newGrant, vestingPercentagePerYear: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="px-4 py-2 bg-success text-success-foreground rounded-lg text-sm font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-secondary text-foreground rounded-lg text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div key={grant.id} className="p-4 bg-secondary/30 border border-border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold">{grant.grantYear} - {grant.grantType}</span>
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                            {formatNumber(grant.grantShares)} shares
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground grid grid-cols-3 gap-4">
                          <div>Value: {formatCurrency(grant.grantValueEur)}</div>
                          <div>Grant Price: {formatCurrency(grant.sharePriceEur)}</div>
                          <div>Vesting: {grant.vestingYears}y @ {(grant.vestingPercentagePerYear * 100).toFixed(0)}%/y</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditGrant(grant)}
                          className="px-4 py-2 text-primary hover:bg-primary/10 rounded-lg text-sm transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => removeRSUGrant(grant.id)}
                          className="px-4 py-2 text-destructive hover:bg-destructive/10 rounded-lg text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>

            {/* Add Grant Form */}
            {showAddGrantForm && (
              <div className="mt-6 p-6 bg-accent/30 border border-border rounded-lg">
                <h4 className="text-sm font-semibold mb-4">New RSU Grant</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">Grant Year</label>
                    <input
                      type="number"
                      value={newGrant.grantYear}
                      onChange={(e) => setNewGrant({ ...newGrant, grantYear: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Grant Type</label>
                    <input
                      type="text"
                      value={newGrant.grantType}
                      onChange={(e) => setNewGrant({ ...newGrant, grantType: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
                      placeholder="e.g., Refresher"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Grant Value (EUR)</label>
                    <input
                      type="number"
                      value={newGrant.grantValueEur}
                      onChange={(e) => setNewGrant({ ...newGrant, grantValueEur: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Share Price at Grant (EUR)</label>
                    <input
                      type="number"
                      value={newGrant.sharePriceEur}
                      onChange={(e) => setNewGrant({ ...newGrant, sharePriceEur: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Vesting Years</label>
                    <input
                      type="number"
                      value={newGrant.vestingYears}
                      onChange={(e) => setNewGrant({ ...newGrant, vestingYears: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Vesting % per Year</label>
                    <input
                      type="number"
                      value={newGrant.vestingPercentagePerYear}
                      onChange={(e) => setNewGrant({ ...newGrant, vestingPercentagePerYear: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background"
                      placeholder="25"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddGrant}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
                  >
                    Add Grant
                  </button>
                  <button
                    onClick={() => setShowAddGrantForm(false)}
                    className="px-4 py-2 bg-secondary text-foreground rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Planning Section */}
      {activeSection === 'planning' && (
        <div className="space-y-6">
          <section className="bg-card border border-border/50 rounded-lg shadow-card hover:shadow-elevated transition-shadow duration-200 p-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Planning Horizon</h3>
              <p className="text-sm text-muted-foreground">
                Set your projection timeframe and growth assumptions
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Starting Year
                </label>
                <input
                  type="number"
                  value={data.planningSettings.startYear}
                  onChange={(e) => updatePlanningSettings({ startYear: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="text-xs text-muted-foreground mt-1">First year of projections</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Projection Years
                </label>
                <input
                  type="number"
                  value={data.planningSettings.projectionYears}
                  onChange={(e) => updatePlanningSettings({ projectionYears: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="text-xs text-muted-foreground mt-1">How far to project</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Expense Inflation Rate
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={(data.planningSettings.expenseInflationRate * 100).toFixed(1)}
                    onChange={(e) => updatePlanningSettings({ expenseInflationRate: parseFloat(e.target.value) / 100 })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Annual expense growth</p>
              </div>
            </div>
          </section>

          <section className="bg-secondary/50 border border-border/50 rounded-lg p-6">
            <h4 className="font-semibold mb-3">Planning Tips</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• All data is stored locally in your browser</li>
              <li>• Projections assume steady growth rates (actual results will vary)</li>
              <li>• Tax calculations are based on 2025 Dutch tax law</li>
              <li>• Consider reviewing your assumptions annually</li>
              <li>• This tool is for planning purposes only, not financial advice</li>
            </ul>
          </section>
        </div>
      )}
    </div>
  );
};
