import React, { useState, useEffect } from 'react';
import { useFinancial } from '../context/FinancialContext';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid, Line, Legend } from 'recharts';
import type { RSUGrant } from '../types/financial';
import { TrendingUp, DollarSign, PiggyBank, Target, Award } from 'lucide-react';

interface FinancialOverviewPageProps {
  initialView?: 'financials' | 'rsus' | 'investments';
}

export const FinancialOverviewPage: React.FC<FinancialOverviewPageProps> = ({ initialView = 'financials' }) => {
  const { data, projections, updateInvestmentSettings, updateRSUGrants } = useFinancial();
  const [activeView, setActiveView] = useState<'financials' | 'rsus' | 'investments'>(initialView);
  const [expandedInvestmentYear, setExpandedInvestmentYear] = useState<number | null>(null);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);
  const [expandedBreakdowns, setExpandedBreakdowns] = useState<Record<number, { investments?: boolean; pension?: boolean }>>({});
  const [expandedRSUYear, setExpandedRSUYear] = useState<number | null>(null);
  const [showRSUAssumptions, setShowRSUAssumptions] = useState(false);
  const [showGrantManagement, setShowGrantManagement] = useState(false);
  const [newGrantType, setNewGrantType] = useState<'Main' | 'Refresher' | 'Promo' | 'Retention'>('Refresher');
  
  // Auto-expand grant management when there are no grants
  useEffect(() => {
    if (data.rsuGrants.length === 0 && activeView === 'rsus') {
      setShowGrantManagement(true);
    }
  }, [data.rsuGrants.length, activeView]);
  
  // Auto-calculate suggested year based on existing grants
  const getNextGrantYear = (grantType: string) => {
    const sortedGrants = [...data.rsuGrants].sort((a, b) => b.grantYear - a.grantYear);
    const latestGrant = sortedGrants[0];
    const existingYears = new Set(data.rsuGrants.map(g => g.grantYear));
    
    if (!latestGrant) {
      return data.planningSettings.startYear;
    }
    
    // Find next available year (no grant already exists)
    const findNextAvailableYear = (startYear: number) => {
      let year = startYear;
      while (existingYears.has(year)) {
        year++;
      }
      return year;
    };
    
    // For refreshers, suggest next year after the latest grant
    if (grantType === 'Refresher') {
      return findNextAvailableYear(latestGrant.grantYear + 1);
    }
    
    // For promotions, suggest 2-3 years after latest grant (typical promo cycle)
    if (grantType === 'Promo') {
      const latestPromo = sortedGrants.find(g => g.grantType === 'Promo');
      if (latestPromo) {
        return findNextAvailableYear(latestPromo.grantYear + 2); // 2 years between promos
      }
      return findNextAvailableYear(latestGrant.grantYear + 2); // First promo, 2 years from start
    }
    
    // For main/retention, suggest current year or next available
    return findNextAvailableYear(Math.max(latestGrant.grantYear, data.planningSettings.startYear));
  };
  
  const [newGrantYear, setNewGrantYear] = useState(getNextGrantYear('Refresher'));

  useEffect(() => {
    setActiveView(initialView);
  }, [initialView]);

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

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Calculate key metrics
  const finalInvestmentBalance = projections.yearlyInvestments[projections.yearlyInvestments.length - 1]?.closingBalance || 0;
  const finalPensionBalance = projections.yearlyPension[projections.yearlyPension.length - 1]?.closingBalance || 0;
  const totalWealth = finalInvestmentBalance + finalPensionBalance;
  
  // TODAY's wealth (most important!) - with safe defaults
  const currentNetWorth = data.investmentSettings.startingNetWorth || 0;
  const currentPension = data.investmentSettings.startingPensionBalance || 0;
  const todaysWealth = currentNetWorth + currentPension;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Section - Today's Wealth (Clean, Professional) */}
      <section className="relative p-12 bg-white border border-border/30 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
        {/* Subtle gradient accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-success/3 via-transparent to-primary/3 pointer-events-none" />
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-success/10 rounded-lg">
                <Target className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Your Total Wealth</p>
                <p className="text-xs text-muted-foreground">Current assets & investments</p>
              </div>
            </div>
            
            {/* Projection Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                {formatCurrency(totalWealth)} in {data.planningSettings.projectionYears}y
              </span>
            </div>
          </div>
          
          {/* Main Amount */}
          <div className="mb-6">
            <h2 className="text-6xl font-bold tracking-tight text-foreground mb-2">
              {formatCurrency(todaysWealth)}
            </h2>
            <p className="text-sm text-muted-foreground">
              Available today across all accounts
            </p>
          </div>
          
          {/* Key Metrics Grid - Clean & Simple */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border/30">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-primary/10 rounded">
                  <DollarSign className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">Liquid Assets</p>
              </div>
              <p className="text-lg font-semibold text-foreground">{formatCurrency(currentNetWorth)}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-accent/30 rounded">
                  <PiggyBank className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">Pension Fund</p>
              </div>
              <p className="text-lg font-semibold text-foreground">{formatCurrency(currentPension)}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-success/10 rounded">
                  <TrendingUp className="w-3.5 h-3.5 text-success" />
                </div>
                <p className="text-xs text-muted-foreground">Expected Growth</p>
              </div>
              <p className="text-lg font-semibold text-success">{formatCurrency(totalWealth - todaysWealth)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border/50 pb-2">
        <button
          onClick={() => setActiveView('financials')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeView === 'financials'
              ? 'bg-card border border-border/50 border-b-transparent text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Yearly Financials
        </button>
        <button
          onClick={() => setActiveView('rsus')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeView === 'rsus'
              ? 'bg-card border border-border/50 border-b-transparent text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          RSUs
        </button>
        <button
          onClick={() => setActiveView('investments')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeView === 'investments'
              ? 'bg-card border border-border/50 border-b-transparent text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Investments & Pension
        </button>
      </div>

      {/* Financials Tab */}
      {activeView === 'financials' && (
        <div className="space-y-6">
          {/* Income & Savings Visualization - Enhanced Multi-Line */}
          <section className="bg-white rounded-xl p-8 border border-border/20 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-success/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Income & Savings Over Time</h3>
                <p className="text-xs text-muted-foreground">Track your income, expenses, and savings trends</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={projections.yearlyFinancials.map(f => ({
                year: f.year,
                totalNetIncome: f.totalNetIncome,
                netSavings: f.netSavings,
                expenses: f.totalExpenses
              }))}>
                <defs>
                  <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" vertical={false} />
                <XAxis 
                  dataKey="year" 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '13px', fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      'totalNetIncome': 'Total Net Income',
                      'netSavings': 'Net Savings',
                      'expenses': 'Expenses'
                    };
                    return [formatCurrency(value), labels[name] || name];
                  }}
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '2px solid hsl(var(--primary))',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
                  }}
                  labelStyle={{ fontWeight: 700, color: 'hsl(var(--primary))' }}
                />
                {/* Net Savings - with gradient fill */}
                <Area
                  type="monotone"
                  dataKey="netSavings"
                  name="Net Savings"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  fill="url(#savingsGradient)"
                  fillOpacity={1}
                />
                {/* Total Net Income - dashed line overlay */}
                <Line
                  type="monotone"
                  dataKey="totalNetIncome"
                  name="Total Net Income"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  dot={{ r: 4, strokeWidth: 2, fill: 'white' }}
                />
                {/* Expenses - solid line */}
                <Line
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="hsl(var(--muted))"
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2, fill: 'white' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </section>

          {/* Yearly Financials Table with Sparklines */}
          <section className="bg-card border border-border/50 rounded-lg shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/30 border-b border-border/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Year</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Gross Income</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Expenses</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Net Savings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {projections.yearlyFinancials.map((fin, index) => {
                    const isExpanded = expandedYear === fin.year;
                    const taxAndDeductions = fin.totalGrossIncome - fin.totalNetIncome;
                    const toPension = (projections.yearlyPension[index]?.employeeContributions || 0) + (projections.yearlyPension[index]?.employerContributions || 0);
                    const toInvestments = projections.yearlyInvestments[index]?.contributions || 0;

                    return (
                      <React.Fragment key={fin.year}>
                        <tr 
                          className="hover:bg-secondary/10 transition-colors cursor-pointer"
                          onClick={() => setExpandedYear(expandedYear === fin.year ? null : fin.year)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                              {fin.year}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                            {formatCurrency(fin.totalGrossIncome)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-destructive">
                            -{formatCurrency(fin.totalExpenses)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-success font-semibold">
                            {formatCurrency(fin.netSavings)}
                          </td>
                        </tr>

                        {/* Expanded Detail Row */}
                        {isExpanded && (
                          <tr className="bg-secondary/10">
                            <td colSpan={4} className="px-6 py-6">
                              {/* Where Does Your Money Go? */}
                              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-card rounded-lg border border-border/50 shadow-sm">
                                  <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm font-medium text-foreground">To Investments (Liquid)</p>
                                    <p className="text-2xl font-semibold text-success">{formatCurrency(toInvestments)}</p>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedBreakdowns(prev => ({
                                        ...prev,
                                        [fin.year]: { ...prev[fin.year], investments: !prev[fin.year]?.investments }
                                      }));
                                    }}
                                    className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors"
                                  >
                                    <span className={`transition-transform duration-200 ${expandedBreakdowns[fin.year]?.investments ? 'rotate-90' : ''}`}>▶</span>
                                    <span>Show breakdown</span>
                                  </button>
                                  {expandedBreakdowns[fin.year]?.investments && projections.yearlyInvestments[index] && (
                                    <div className="space-y-2 text-xs mt-3 pt-3 border-t border-border/50">
                                      <div className="flex justify-between py-1">
                                        <span className="text-muted-foreground">Monthly Savings</span>
                                        <span className="font-medium">{formatCurrency(projections.yearlyInvestments[index].monthlySavingsContributions)}</span>
                                      </div>
                                      <div className="flex justify-between py-1">
                                        <span className="text-muted-foreground">Holiday Allowance</span>
                                        <span className="font-medium">{formatCurrency(projections.yearlyInvestments[index].holidayAllowanceContributions)}</span>
                                      </div>
                                      <div className="flex justify-between py-1">
                                        <span className="text-muted-foreground">Bonus</span>
                                        <span className="font-medium">{formatCurrency(projections.yearlyInvestments[index].bonusContributions)}</span>
                                      </div>
                                      <div className="flex justify-between py-1 border-t border-border/50 pt-2">
                                        <span className="text-muted-foreground">RSU Equity</span>
                                        <span className="font-medium">{formatCurrency(projections.yearlyInvestments[index].rsuContributions)}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="p-4 bg-card rounded-lg border border-border/50 shadow-sm">
                                  <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm font-medium text-foreground">To Pension (Locked)</p>
                                    <p className="text-2xl font-semibold text-success">{formatCurrency(toPension)}</p>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedBreakdowns(prev => ({
                                        ...prev,
                                        [fin.year]: { ...prev[fin.year], pension: !prev[fin.year]?.pension }
                                      }));
                                    }}
                                    className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors"
                                  >
                                    <span className={`transition-transform duration-200 ${expandedBreakdowns[fin.year]?.pension ? 'rotate-90' : ''}`}>▶</span>
                                    <span>Show breakdown</span>
                                  </button>
                                  {expandedBreakdowns[fin.year]?.pension && projections.yearlyPension[index] && (
                                    <div className="space-y-2 text-xs mt-3 pt-3 border-t border-border/50">
                                      <div className="flex justify-between py-1">
                                        <span className="text-muted-foreground">Your Contributions</span>
                                        <span className="font-medium">{formatCurrency(projections.yearlyPension[index].employeeContributions)}</span>
                                      </div>
                                      <div className="flex justify-between py-1 border-t border-border/50 pt-2">
                                        <span className="text-muted-foreground">Employer Contributions</span>
                                        <span className="font-medium">{formatCurrency(projections.yearlyPension[index].employerContributions)}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Gross Income Breakdown */}
                                <div className="bg-card border border-border/50 rounded-lg p-4 shadow-sm">
                                  <h4 className="font-semibold text-sm text-primary mb-3">Gross Income</h4>
                                  <div className="space-y-2 text-xs mb-3">
                                    <div className="flex justify-between py-1">
                                      <span className="text-muted-foreground">Base Salary</span>
                                      <span className="font-medium">{formatCurrency(fin.grossIncome / (1 + data.incomeSettings.holidayAllowancePercentage + data.incomeSettings.bonusPercentage))}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                      <span className="text-muted-foreground">Bonus ({formatPercentage(data.incomeSettings.bonusPercentage)})</span>
                                      <span className="font-medium">{formatCurrency(fin.grossIncome * data.incomeSettings.bonusPercentage / (1 + data.incomeSettings.holidayAllowancePercentage + data.incomeSettings.bonusPercentage))}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                      <span className="text-muted-foreground">Holiday ({formatPercentage(data.incomeSettings.holidayAllowancePercentage)})</span>
                                      <span className="font-medium">{formatCurrency(fin.grossIncome * data.incomeSettings.holidayAllowancePercentage / (1 + data.incomeSettings.holidayAllowancePercentage + data.incomeSettings.bonusPercentage))}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-t border-border/50 pt-2">
                                      <span className="text-muted-foreground">RSU Value</span>
                                      <span className="font-medium text-success">{formatCurrency(fin.rsuGrossValue)}</span>
                                    </div>
                                    <div className="flex justify-between py-1 font-semibold border-t border-border/50 pt-2">
                                      <span>Total Gross</span>
                                      <span>{formatCurrency(fin.totalGrossIncome)}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Tax & Deductions Breakdown */}
                                <div className="bg-card border border-border/50 rounded-lg p-4 shadow-sm">
                                  <h4 className="font-semibold text-sm text-destructive mb-3">Tax & Deductions</h4>
                                  <div className="space-y-2 text-xs mb-3">
                                    <div className="flex justify-between py-1">
                                      <span className="text-muted-foreground">Income Tax</span>
                                      <span className="font-medium">-{formatCurrency(taxAndDeductions - fin.rsuGrossValue + fin.netRSUValue)}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                      <span className="text-muted-foreground">RSU Tax</span>
                                      <span className="font-medium">-{formatCurrency(fin.rsuGrossValue - fin.netRSUValue)}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                      <span className="text-muted-foreground">Your Pension</span>
                                      <span className="font-medium">-{formatCurrency(projections.yearlyPension[index]?.employeeContributions || 0)}</span>
                                    </div>
                                    <div className="flex justify-between py-1 font-semibold border-t border-border/50 pt-2">
                                      <span>Total Deductions</span>
                                      <span>-{formatCurrency(taxAndDeductions)}</span>
                                    </div>
                                    <div className="flex justify-between py-1 text-muted-foreground text-xs">
                                      <span>Effective Tax Rate</span>
                                      <span>{formatPercentage(fin.effectiveTaxRate)}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Net Income & Expenses */}
                                <div className="bg-card border border-border/50 rounded-lg p-4 shadow-sm">
                                  <h4 className="font-semibold text-sm text-success mb-3">Net Income & Use</h4>
                                  <div className="space-y-2 text-xs mb-3">
                                    <div className="flex justify-between py-1">
                                      <span className="text-muted-foreground">Net Salary</span>
                                      <span className="font-medium">{formatCurrency(fin.netIncome)}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                      <span className="text-muted-foreground">Net RSU</span>
                                      <span className="font-medium">{formatCurrency(fin.netRSUValue)}</span>
                                    </div>
                                    <div className="flex justify-between py-1 font-semibold border-t border-border/50 pt-2">
                                      <span>Total Net Income</span>
                                      <span>{formatCurrency(fin.totalNetIncome)}</span>
                                    </div>
                                    <div className="flex justify-between py-1 text-destructive">
                                      <span>Living Expenses</span>
                                      <span>-{formatCurrency(fin.totalExpenses)}</span>
                                    </div>
                                    <div className="flex justify-between py-1 font-semibold text-success border-t border-border/50 pt-2">
                                      <span>Net Savings</span>
                                      <span>{formatCurrency(fin.netSavings)}</span>
                                    </div>
                                    <div className="flex justify-between py-1 text-muted-foreground text-xs">
                                      <span>Savings Rate</span>
                                      <span>{formatPercentage(fin.savingsRate)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Expense Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <section className="p-8 bg-card border border-border/50 rounded-lg shadow-card">
              <h3 className="text-lg font-semibold mb-6">Expense Distribution</h3>
              {(() => {
                const totalExpenses = data.expenseCategories.reduce((sum, cat) => sum + cat.monthlyAmount, 0);
                const expenseData = data.expenseCategories.map(cat => ({
                  name: cat.name,
                  value: cat.monthlyAmount,
                  percentage: (cat.monthlyAmount / totalExpenses) * 100
                })).sort((a, b) => b.value - a.value);
                const COLORS = ['hsl(var(--foreground))', 'hsl(var(--foreground) / 0.7)', 'hsl(var(--foreground) / 0.5)', 'hsl(var(--foreground) / 0.3)', 'hsl(var(--muted-foreground))', 'hsl(var(--muted-foreground) / 0.7)', 'hsl(var(--muted-foreground) / 0.5)'];
                
                return expenseData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={expenseData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percentage }) => `${name} ${percentage.toFixed(0)}%`}
                      >
                        {expenseData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No expense categories defined
                  </div>
                );
              })()}
            </section>

            {/* Category Breakdown */}
            <section className="p-8 bg-card border border-border/50 rounded-lg shadow-card">
              <h3 className="text-lg font-semibold mb-6">Monthly Breakdown</h3>
              <div className="space-y-4">
                {(() => {
                  const totalExpenses = data.expenseCategories.reduce((sum, cat) => sum + cat.monthlyAmount, 0);
                  const expenseData = data.expenseCategories.map(cat => ({
                    name: cat.name,
                    value: cat.monthlyAmount,
                    percentage: (cat.monthlyAmount / totalExpenses) * 100
                  })).sort((a, b) => b.value - a.value);
                  const COLORS = ['hsl(var(--foreground))', 'hsl(var(--foreground) / 0.7)', 'hsl(var(--foreground) / 0.5)', 'hsl(var(--foreground) / 0.3)', 'hsl(var(--muted-foreground))', 'hsl(var(--muted-foreground) / 0.7)', 'hsl(var(--muted-foreground) / 0.5)'];
                  
                  return expenseData.map((expense, index) => (
                    <div key={expense.name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{expense.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{formatCurrency(expense.value)}</span>
                          <span className="text-xs text-muted-foreground">({expense.percentage.toFixed(0)}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${expense.percentage}%`,
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* RSUs Tab */}
      {activeView === 'rsus' && (
        <div className="space-y-8">
          {/* Vesting Schedule Visualization - Enhanced */}
          <section className="bg-white rounded-xl p-8 border border-border/20 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-accent/30 rounded-lg">
                <Award className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Vesting Schedule Overview</h3>
                <p className="text-xs text-muted-foreground">Cumulative vesting trends by grant over time</p>
              </div>
            </div>
            {(() => {
              // Get all unique years from planning settings
              const startYear = data.planningSettings.startYear;
              const projectionYears = data.planningSettings.projectionYears;
              const allYears = Array.from({ length: projectionYears }, (_, i) => startYear + i);
              
              if (data.rsuGrants.length === 0) {
                return (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/20 mb-4">
                      <Award className="w-8 h-8 text-primary" />
                    </div>
                    <h4 className="text-lg font-semibold text-foreground mb-2">No RSU Grants Yet</h4>
                    <p className="text-muted-foreground mb-6">Add your RSU grants below to visualize your vesting schedule.</p>
                    <div className="inline-flex items-center gap-2 text-sm text-primary font-medium">
                      <span>↓</span>
                      <span>Scroll down to add grants</span>
                    </div>
                  </div>
                );
              }

              if (data.investmentSettings.currentStockPrice === 0) {
                return (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/20 mb-4">
                      <Award className="w-8 h-8 text-primary" />
                    </div>
                    <h4 className="text-lg font-semibold text-foreground mb-2">Stock Price Not Set</h4>
                    <p className="text-muted-foreground mb-6">Please set the current stock price in RSU Assumptions to view the vesting schedule.</p>
                  </div>
                );
              }

              // Assign colors - grayscale palette for visual consistency
              const colors = [
                'hsl(var(--foreground))',           // Main grant - darkest
                'hsl(var(--foreground) / 0.7)',     // First refresher
                'hsl(var(--foreground) / 0.5)',     // Second refresher
                'hsl(var(--foreground) / 0.3)',     // Third refresher
                'hsl(var(--muted-foreground))',     // Fourth refresher
                'hsl(var(--muted-foreground) / 0.7)', // Fifth refresher
                'hsl(var(--muted-foreground) / 0.5)', // Sixth refresher
                'hsl(var(--muted-foreground) / 0.3)'  // Seventh refresher
              ];

              // Build chart data - cumulative vesting value per grant over time
              const chartData = allYears.map(year => {
                const dataPoint: any = { year };
                
                data.rsuGrants.forEach((grant) => {
                  const grantKey = `${grant.grantType}_${grant.grantYear}`;
                  
                  // Calculate cumulative vested value up to this year
                  let cumulativeValue = 0;
                  for (let y = grant.grantYear; y <= year; y++) {
                    const yearsFromGrant = y - grant.grantYear;
                    if (yearsFromGrant >= 0 && yearsFromGrant < grant.vestingYears) {
                      const sharesVesting = grant.grantShares * grant.vestingPercentagePerYear;
                      // Get the stock price for year y
                      const priceGrowthYears = y - startYear;
                      const stockPrice = data.investmentSettings.currentStockPrice * Math.pow(1 + data.investmentSettings.sharePriceGrowthRate, priceGrowthYears);
                      const yearValue = sharesVesting * stockPrice;
                      cumulativeValue += yearValue;
                    }
                  }
                  
                  dataPoint[grantKey] = cumulativeValue;
                });
                
                return dataPoint;
              });

              // Custom tooltip
              const CustomRSUTooltip = ({ active, payload, label }: any) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white border-2 border-primary rounded-xl p-4 shadow-2xl">
                      <p className="text-sm font-bold text-primary mb-2">Year {label}</p>
                      <div className="space-y-1">
                        {payload.map((entry: any, index: number) => (
                          <div key={index} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-sm" 
                                style={{ backgroundColor: entry.color }}
                              />
                              <span className="text-xs text-foreground">{entry.name.replace('_', ' ')}</span>
                            </div>
                            <span className="text-sm font-semibold text-foreground">{formatCurrency(entry.value)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 pt-2 border-t border-border/30">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Total</span>
                          <span className="text-sm font-bold text-primary">
                            {formatCurrency(payload.reduce((sum: number, entry: any) => sum + entry.value, 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              };

              return (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={chartData}>
                    <defs>
                      {data.rsuGrants.map((_, idx) => (
                        <linearGradient 
                          key={`gradient-${idx}`} 
                          id={`grantGradient${idx}`} 
                          x1="0" 
                          y1="0" 
                          x2="0" 
                          y2="1"
                        >
                          <stop offset="5%" stopColor={colors[idx % colors.length]} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={colors[idx % colors.length]} stopOpacity={0.05}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" vertical={false} />
                    <XAxis 
                      dataKey="year" 
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '13px', fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomRSUTooltip />} />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      formatter={(value) => value.replace('_', ' ')}
                    />
                    {data.rsuGrants.map((grant, idx) => {
                      const grantKey = `${grant.grantType}_${grant.grantYear}`;
                      return (
                        <Area
                          key={idx}
                          type="monotone"
                          dataKey={grantKey}
                          name={`${grant.grantType} ${grant.grantYear}`}
                          stroke={colors[idx % colors.length]}
                          strokeWidth={2.5}
                          fill={`url(#grantGradient${idx})`}
                          fillOpacity={1}
                          dot={{ r: 4, strokeWidth: 2, fill: 'white' }}
                          activeDot={{ r: 6 }}
                        />
                      );
                    })}
                  </AreaChart>
                </ResponsiveContainer>
              );
            })()}
          </section>

          {/* All RSU Grants Management - Unified Panel */}
          <section className="bg-card border border-border/50 rounded-lg shadow-card overflow-hidden">
            <button
              onClick={() => setShowGrantManagement(!showGrantManagement)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-secondary/10 transition-colors"
            >
              <div>
                <h3 className="text-lg font-semibold">All RSU Grants</h3>
                <p className="text-xs text-muted-foreground mt-0.5">View, edit, and add grants</p>
              </div>
              <span className={`transition-transform duration-200 ${showGrantManagement ? 'rotate-90' : ''}`}>▶</span>
            </button>

            {showGrantManagement && (
              <div className="px-4 pb-4 space-y-2">
                {/* Current Grants List */}
                <div className="space-y-1.5">
                  <h4 className="font-medium text-xs text-muted-foreground mb-2">Current Grants ({data.rsuGrants.length})</h4>
                  {data.rsuGrants.map((grant, idx) => (
                    <div key={grant.id} className="p-2 bg-secondary/10 rounded border border-border/30">
                      <div className="grid grid-cols-7 gap-2 items-end">
                        <div>
                          <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-0.5">Type</label>
                          <select
                            value={grant.grantType}
                            onChange={(e) => {
                              const updated = [...data.rsuGrants];
                              updated[idx] = { ...grant, grantType: e.target.value };
                              updateRSUGrants(updated);
                            }}
                            className="w-full px-1.5 py-1 bg-background border border-border rounded text-xs"
                          >
                            <option value="Main">Main</option>
                            <option value="Refresher">Refresher</option>
                            <option value="Promo">Promo</option>
                            <option value="Retention">Retention</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-0.5">Year</label>
                          <input
                            type="number"
                            value={grant.grantYear}
                            onChange={(e) => {
                              const updated = [...data.rsuGrants];
                              const grantYear = parseInt(e.target.value);
                              const yearsFromNow = grantYear - data.planningSettings.startYear;
                              const projectedPrice = data.investmentSettings.currentStockPrice * Math.pow(1 + data.investmentSettings.sharePriceGrowthRate, yearsFromNow);
                              updated[idx] = { 
                                ...grant, 
                                grantYear,
                                sharePriceEur: projectedPrice,
                                grantShares: grant.grantValueEur / projectedPrice
                              };
                              updateRSUGrants(updated);
                            }}
                            className="w-full px-1.5 py-1 bg-background border border-border rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-0.5">Value €</label>
                          <input
                            type="number"
                            value={grant.grantValueEur}
                            onChange={(e) => {
                              const updated = [...data.rsuGrants];
                              const grantValueEur = parseFloat(e.target.value);
                              updated[idx] = { 
                                ...grant, 
                                grantValueEur,
                                grantShares: grantValueEur / grant.sharePriceEur
                              };
                              updateRSUGrants(updated);
                            }}
                            className="w-full px-1.5 py-1 bg-background border border-border rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-0.5">Price €</label>
                          <input
                            type="number"
                            step="0.01"
                            value={grant.sharePriceEur.toFixed(2)}
                            onChange={(e) => {
                              const updated = [...data.rsuGrants];
                              const sharePriceEur = parseFloat(e.target.value);
                              updated[idx] = { 
                                ...grant, 
                                sharePriceEur,
                                grantShares: grant.grantValueEur / sharePriceEur
                              };
                              updateRSUGrants(updated);
                            }}
                            className="w-full px-1.5 py-1 bg-background border border-border rounded text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-0.5">Shares</label>
                          <div className="px-1.5 py-1 bg-secondary/30 rounded text-xs font-medium">
                            {grant.grantShares.toFixed(1)}
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-muted-foreground uppercase tracking-wide block mb-0.5">Vesting</label>
                          <input
                            type="number"
                            value={grant.vestingYears}
                            onChange={(e) => {
                              const updated = [...data.rsuGrants];
                              const vestingYears = parseInt(e.target.value);
                              updated[idx] = { 
                                ...grant, 
                                vestingYears,
                                vestingPercentagePerYear: 1 / vestingYears
                              };
                              updateRSUGrants(updated);
                            }}
                            className="w-full px-1.5 py-1 bg-background border border-border rounded text-xs"
                          />
                        </div>
                        <div>
                          <button
                            onClick={() => {
                              const updated = data.rsuGrants.filter((_, i) => i !== idx);
                              updateRSUGrants(updated);
                            }}
                            className="w-full px-2 py-1 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded text-[10px] font-medium transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Add with Presets */}
                <div className="pt-4 border-t border-border/50 space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Quick Add New Grant</h4>
                  
                  {/* Grant Type & Year Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-muted-foreground">Type</label>
                      <select
                        value={newGrantType}
                        onChange={(e) => {
                          const type = e.target.value as any;
                          setNewGrantType(type);
                          // Auto-update year based on grant type
                          setNewGrantYear(getNextGrantYear(type));
                        }}
                        className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md text-sm"
                      >
                        <option value="Main">Main</option>
                        <option value="Refresher">Refresher</option>
                        <option value="Promo">Promotion</option>
                        <option value="Retention">Retention</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Year</label>
                      <input
                        type="number"
                        value={newGrantYear}
                        onChange={(e) => setNewGrantYear(parseInt(e.target.value))}
                        className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md text-sm"
                      />
                    </div>
                  </div>

                  {/* Smart Suggestions Based on Grant Type */}
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">Suggested Grant Values</label>
                    {(() => {
                      // Find the main grant (usually the first/largest)
                      const mainGrant = data.rsuGrants.find(g => g.grantType === 'Main') || data.rsuGrants[0];
                      const mainGrantValue = mainGrant?.grantValueEur || 300000;
                      
                      // Calculate current refresher baseline (25% of main)
                      const currentRefresherBase = mainGrantValue * 0.25;
                      
                      // Find the most recent promotion to determine current level
                      const promoGrants = data.rsuGrants.filter(g => g.grantType === 'Promo').sort((a, b) => b.grantYear - a.grantYear);
                      const latestPromo = promoGrants[0];
                      
                      let suggestions: number[] = [];
                      let explanationText = '';
                      let calculations: string[] = [];
                      
                      if (newGrantType === 'Refresher') {
                        // After a promotion, your NEW refresher baseline is 60% MORE than before
                        let baselineGrant = currentRefresherBase;
                        let baselineType = 'Main grant refreshers';
                        
                        if (latestPromo && newGrantYear > latestPromo.grantYear) {
                          // Post-promotion: new baseline is your OLD refreshers * 1.6 (60% more)
                          // This is because the promo grant was 1.6x your old refreshers
                          // So your new refresher level should also be 1.6x your old refreshers
                          baselineGrant = currentRefresherBase * 1.6;
                          baselineType = `Post-${latestPromo.grantType} ${latestPromo.grantYear} level`;
                        }
                        
                        suggestions = [
                          Math.round(baselineGrant * 0.8),  // 80% of new baseline
                          Math.round(baselineGrant),         // 100% of new baseline (typical)
                          Math.round(baselineGrant * 1.2),   // 120% of new baseline
                          Math.round(baselineGrant * 1.4)    // 140% of new baseline
                        ];
                        calculations = [
                          `80% of ${baselineType} (${formatCurrency(baselineGrant)})`,
                          `100% of ${baselineType} (${formatCurrency(baselineGrant)})`,
                          `120% of ${baselineType} (${formatCurrency(baselineGrant)})`,
                          `140% of ${baselineType} (${formatCurrency(baselineGrant)})`
                        ];
                        explanationText = latestPromo && newGrantYear > latestPromo.grantYear
                          ? `Post-promotion: New refresher level is ${formatCurrency(Math.round(baselineGrant))} (60% more than pre-promo)`
                          : `Pre-promotion: Refreshers at ${formatCurrency(Math.round(currentRefresherBase))} (25% of main grant)`;
                      } else if (newGrantType === 'Promo') {
                        // Promotion grant should be 60% MORE than your current refresher level
                        // Each promotion multiplies the refresher level by 1.6
                        let currentRefresherLevel = currentRefresherBase;
                        
                        // Count how many promotions have already happened
                        const promosCount = data.rsuGrants.filter(g => g.grantType === 'Promo').length;
                        
                        if (promosCount > 0) {
                          // After N promotions, refresher level = base * (1.6^N)
                          currentRefresherLevel = currentRefresherBase * Math.pow(1.6, promosCount);
                        }
                        
                        const promoBase = Math.round(currentRefresherLevel * 1.6);
                        suggestions = [
                          Math.round(promoBase * 0.9),     // Conservative: 1.44x current refreshers
                          promoBase,                        // Typical: 1.6x current refreshers (60% more)
                          Math.round(promoBase * 1.1),     // Good: 1.76x current refreshers
                          Math.round(promoBase * 1.25)     // Great: 2x current refreshers
                        ];
                        calculations = [
                          `1.44x current refreshers (${formatCurrency(currentRefresherLevel)})`,
                          `1.6x current refreshers (${formatCurrency(currentRefresherLevel)}) - typical`,
                          `1.76x current refreshers (${formatCurrency(currentRefresherLevel)})`,
                          `2x current refreshers (${formatCurrency(currentRefresherLevel)})`
                        ];
                        explanationText = promosCount > 0
                          ? `Promotion ${promosCount + 1}: 60% more than your current ${formatCurrency(Math.round(currentRefresherLevel))} refresher level`
                          : `First promotion: 60% more than your current ${formatCurrency(Math.round(currentRefresherLevel))} refresher level`;
                      } else {
                        // Generic suggestions for Main/Retention
                        suggestions = [100000, 200000, 300000, 400000];
                        calculations = ['', '', '', ''];
                        explanationText = 'Common grant values';
                      }
                      
                      return (
                        <>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {suggestions.map((value, idx) => (
                              <div key={value} className="relative group">
                                <button
                                  onClick={() => {
                                    // Check if a grant already exists for this year
                                    const existingGrant = data.rsuGrants.find(g => g.grantYear === newGrantYear);
                                    if (existingGrant) {
                                      alert(`A grant already exists for ${newGrantYear} (${existingGrant.grantType}). Please choose a different year or remove the existing grant first.`);
                                      return;
                                    }
                                    
                                    // Auto-calculate price based on year
                                    const yearsFromNow = newGrantYear - data.planningSettings.startYear;
                                    const projectedPrice = data.investmentSettings.currentStockPrice * Math.pow(1 + data.investmentSettings.sharePriceGrowthRate, yearsFromNow);
                                    
                                    const newGrant: RSUGrant = {
                                      id: `grant-${Date.now()}`,
                                      grantYear: newGrantYear,
                                      grantType: newGrantType,
                                      grantValueEur: value,
                                      sharePriceEur: projectedPrice,
                                      grantShares: value / projectedPrice,
                                      vestingYears: 4,
                                      vestingPercentagePerYear: 0.25
                                    };
                                    updateRSUGrants([...data.rsuGrants, newGrant]);
                                    
                                    // Auto-increment to next available year
                                    setNewGrantYear(getNextGrantYear(newGrantType));
                                  }}
                                  className="w-full px-3 py-2 bg-secondary/50 hover:bg-secondary/70 rounded-md text-sm font-medium transition-colors border border-border/30"
                                >
                                  €{(value / 1000).toFixed(0)}k
                                </button>
                                {calculations[idx] && (
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2.5 bg-white rounded-md shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30 border-2 border-primary min-w-[200px] text-center">
                                    <div className="font-semibold text-primary mb-1">€{(value / 1000).toFixed(0)}k</div>
                                    <div className="text-[11px] text-gray-700">{calculations[idx]}</div>
                                    {/* Arrow */}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[2px]">
                                      <div className="border-[7px] border-transparent border-t-white" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2 font-medium">{explanationText}</p>
                        </>
                      );
                    })()}
                  </div>

                  {/* Custom Value */}
                  <div className="flex gap-3">
                    <input
                      type="number"
                      id="customGrantValue"
                      placeholder="Custom value (€)"
                      className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-sm"
                    />
                    <button
                      onClick={() => {
                        const valueInput = document.getElementById('customGrantValue') as HTMLInputElement;
                        const grantValue = parseFloat(valueInput.value);
                        
                        if (isNaN(grantValue) || grantValue <= 0) {
                          alert('Please enter a valid grant value');
                          return;
                        }
                        
                        // Check if a grant already exists for this year
                        const existingGrant = data.rsuGrants.find(g => g.grantYear === newGrantYear);
                        if (existingGrant) {
                          alert(`A grant already exists for ${newGrantYear} (${existingGrant.grantType}). Please choose a different year or remove the existing grant first.`);
                          return;
                        }
                        
                        // Auto-calculate price based on year
                        const yearsFromNow = newGrantYear - data.planningSettings.startYear;
                        const projectedPrice = data.investmentSettings.currentStockPrice * Math.pow(1 + data.investmentSettings.sharePriceGrowthRate, yearsFromNow);
                        
                        const newGrant: RSUGrant = {
                          id: `grant-${Date.now()}`,
                          grantYear: newGrantYear,
                          grantType: newGrantType,
                          grantValueEur: grantValue,
                          sharePriceEur: projectedPrice,
                          grantShares: grantValue / projectedPrice,
                          vestingYears: 4,
                          vestingPercentagePerYear: 0.25
                        };
                        updateRSUGrants([...data.rsuGrants, newGrant]);
                        valueInput.value = '';
                        
                        // Auto-increment to next available year
                        setNewGrantYear(getNextGrantYear(newGrantType));
                      }}
                      className="px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium transition-colors shadow-sm hover:shadow-md"
                    >
                      Add Custom
                    </button>
                  </div>
                  
                  <div className="p-3 bg-secondary/20 rounded-lg border border-border/30">
                    <p className="text-xs text-muted-foreground">
                      <strong>How grant values are calculated:</strong><br/>
                      • <strong>Refreshers (before promo):</strong> 25% of your main grant<br/>
                      • <strong>Promotions:</strong> 60% more than your current refreshers<br/>
                      • <strong>Refreshers (after promo):</strong> 60% more than your old refreshers (same as the promo multiplier!)<br/>
                      • <strong>Hover over buttons</strong> to see the calculation<br/>
                      • Grant price is auto-calculated based on year and {(data.investmentSettings.sharePriceGrowthRate * 100).toFixed(1)}% growth rate
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* RSU Assumptions Panel - Collapsible */}
          <section className="bg-card border border-border/50 rounded-lg shadow-card overflow-hidden">
            <button
              onClick={() => setShowRSUAssumptions(!showRSUAssumptions)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-secondary/10 transition-colors"
            >
              <h3 className="text-lg font-semibold">RSU Assumptions</h3>
              <span className={`transition-transform duration-200 ${showRSUAssumptions ? 'rotate-90' : ''}`}>▶</span>
            </button>
            
            {showRSUAssumptions && (
              <div className="px-6 pb-6 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Current Stock Price */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Current Stock Price (USD)</label>
                      <span className="text-sm font-semibold">${data.investmentSettings.currentStockPrice.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="500"
                      step="5"
                      value={data.investmentSettings.currentStockPrice}
                      onChange={(e) => updateInvestmentSettings({ currentStockPrice: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${((data.investmentSettings.currentStockPrice - 50) / (500 - 50)) * 100}%, hsl(var(--secondary)) ${((data.investmentSettings.currentStockPrice - 50) / (500 - 50)) * 100}%, hsl(var(--secondary)) 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>$50</span>
                      <span>$500</span>
                    </div>
                  </div>

                  {/* Share Price Growth Rate */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Share Price Growth Rate</label>
                      <span className="text-sm font-semibold">{(data.investmentSettings.sharePriceGrowthRate * 100).toFixed(1)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.30"
                      step="0.01"
                      value={data.investmentSettings.sharePriceGrowthRate}
                      onChange={(e) => updateInvestmentSettings({ sharePriceGrowthRate: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${(data.investmentSettings.sharePriceGrowthRate / 0.30) * 100}%, hsl(var(--secondary)) ${(data.investmentSettings.sharePriceGrowthRate / 0.30) * 100}%, hsl(var(--secondary)) 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0%</span>
                      <span>30%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* RSU Vesting Table */}
          <section className="bg-card border border-border/50 rounded-lg shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50">
              <h3 className="text-lg font-semibold">RSU Vesting Schedule</h3>
              <p className="text-sm text-muted-foreground mt-1">Click to see grant-level details</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-secondary/30 border-b border-border/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Year</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Shares</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Vesting Price</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Gross Value</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Tax</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Tax Rate</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Net Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {projections.rsuVestingByYear.map((rsu) => {
                    const isExpanded = expandedRSUYear === rsu.year;
                    const effectiveTaxRate = rsu.grossRSUValue > 0 ? rsu.taxPaid / rsu.grossRSUValue : 0;
                    
                    // Calculate relative magnitudes for visual enhancements
                    const maxShares = Math.max(...projections.rsuVestingByYear.map(r => r.sharesVested));
                    const maxNetValue = Math.max(...projections.rsuVestingByYear.map(r => r.netRSUValue));
                    const sharesIntensity = (rsu.sharesVested / maxShares) * 0.15; // Max 15% opacity
                    const netValueIntensity = (rsu.netRSUValue / maxNetValue) * 0.20; // Max 20% opacity
                    
                    // Get grants that vest this year
                    const vestingGrantsThisYear = data.rsuGrants.filter(grant => {
                      const grantYear = grant.grantYear;
                      return rsu.year >= grantYear && rsu.year < grantYear + grant.vestingYears;
                    }).map(grant => {
                      const grantYear = grant.grantYear;
                      const vestingPercentage = grant.vestingPercentagePerYear;
                      const sharesVesting = grant.grantShares * vestingPercentage;
                      const grossValue = sharesVesting * rsu.vestingPriceEur;
                      
                      // Calculate cumulative vesting progress up to this year
                      const yearsVested = Math.min(rsu.year - grantYear + 1, grant.vestingYears);
                      const cumulativeVestingPercentage = (yearsVested / grant.vestingYears);
                      
                      return {
                        grantName: `${grant.grantType} ${grant.grantYear}`,
                        grantYear: grant.grantYear,
                        totalShares: grant.grantShares,
                        sharesVesting,
                        vestingPercentage,
                        cumulativeVestingPercentage,
                        grossValue,
                        vestingPriceEur: rsu.vestingPriceEur
                      };
                    }).filter(g => g.sharesVesting > 0);

                    return (
                      <React.Fragment key={rsu.year}>
                        <tr 
                          className="hover:bg-secondary/10 transition-colors cursor-pointer"
                          onClick={() => setExpandedRSUYear(expandedRSUYear === rsu.year ? null : rsu.year)}
                        >
                          <td className="px-6 py-4 text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                              {rsu.year}
                            </div>
                          </td>
                          <td 
                            className="px-6 py-4 text-sm text-right"
                            style={{ backgroundColor: `hsl(var(--accent) / ${sharesIntensity})` }}
                          >
                            <div className="flex items-center justify-end gap-3">
                              <span>{formatNumber(rsu.sharesVested)}</span>
                              {rsu.sharesVested > 0 && (
                                <div className="w-12 h-4 bg-secondary/30 rounded-sm overflow-hidden">
                                  <div 
                                    className="h-full bg-accent transition-all duration-300"
                                    style={{ width: `${(rsu.sharesVested / maxShares) * 100}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-right text-muted-foreground">{formatCurrency(rsu.vestingPriceEur)}</td>
                          <td className="px-6 py-4 text-sm text-right font-medium">{formatCurrency(rsu.grossRSUValue)}</td>
                          <td className="px-6 py-4 text-sm text-right text-destructive">-{formatCurrency(rsu.taxPaid)}</td>
                          <td className="px-6 py-4 text-sm text-right text-muted-foreground">{formatPercentage(effectiveTaxRate)}</td>
                          <td 
                            className="px-6 py-4 text-sm text-right font-medium text-success"
                            style={{ backgroundColor: `hsl(var(--success) / ${netValueIntensity})` }}
                          >
                            {formatCurrency(rsu.netRSUValue)}
                          </td>
                        </tr>
                        
                        {/* Expanded Grant Details */}
                        {isExpanded && (
                          <tr className="bg-secondary/10">
                            <td colSpan={7} className="px-6 py-4">
                              <div className="space-y-4">
                                <h4 className="font-semibold text-sm mb-3">Grants Vesting in {rsu.year}</h4>
                                {vestingGrantsThisYear.length > 0 ? (
                                  <div className="space-y-3">
                                    {vestingGrantsThisYear.map((grant, idx) => (
                                      <div key={idx} className="p-4 bg-card rounded-lg border border-border/50 shadow-sm">
                                        {/* Compact Header with Grant Info and Value */}
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="flex items-baseline gap-3">
                                            <p className="font-semibold text-sm">{grant.grantName}</p>
                                            <p className="text-xs text-muted-foreground">Granted {grant.grantYear}</p>
                                          </div>
                                          <p className="text-lg font-bold text-success">{formatCurrency(grant.grossValue)}</p>
                                        </div>

                                        {/* Compact Progress Bar */}
                                        <div className="mb-3">
                                          <div className="flex justify-between text-xs mb-1.5">
                                            <span className="text-muted-foreground">Cumulative Vesting Progress</span>
                                            <span className="font-medium">{formatPercentage(grant.cumulativeVestingPercentage)} complete</span>
                                          </div>
                                          <div className="relative h-2 bg-secondary/30 rounded-full overflow-hidden">
                                            <div 
                                              className="absolute h-full bg-gradient-to-r from-primary to-success transition-all duration-500"
                                              style={{ width: `${grant.cumulativeVestingPercentage * 100}%` }}
                                            />
                                          </div>
                                          <div className="flex justify-between text-xs mt-1 text-muted-foreground">
                                            <span>Vesting this year: {formatNumber(grant.sharesVesting)} shares ({formatPercentage(grant.vestingPercentage)})</span>
                                          </div>
                                        </div>

                                        {/* Compact Info Grid */}
                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                          <div className="p-2 bg-secondary/20 rounded">
                                            <p className="text-muted-foreground mb-0.5">Total Shares</p>
                                            <p className="font-semibold">{formatNumber(grant.totalShares)}</p>
                                          </div>
                                          <div className="p-2 bg-secondary/20 rounded">
                                            <p className="text-muted-foreground mb-0.5">Vesting Price</p>
                                            <p className="font-semibold">{formatCurrency(grant.vestingPriceEur)}</p>
                                          </div>
                                          <div className="p-2 bg-success/10 border border-success/20 rounded">
                                            <p className="text-muted-foreground mb-0.5">Gross Value</p>
                                            <p className="font-semibold text-success">{formatCurrency(grant.grossValue)}</p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">No grants vesting this year</p>
                                )}
                                
                                {/* Compact Tax Summary */}
                                <div className="p-4 bg-gradient-to-br from-destructive/5 to-destructive/10 rounded-lg border border-destructive/20">
                                  <h5 className="font-semibold text-sm mb-3">Tax Impact Summary</h5>
                                  
                                  {/* Horizontal Flow */}
                                  <div className="flex items-center gap-2 mb-3">
                                    <div className="flex-1 text-center p-2.5 bg-card rounded border border-border/50">
                                      <p className="text-xs text-muted-foreground mb-0.5">Gross</p>
                                      <p className="text-base font-bold">{formatCurrency(rsu.grossRSUValue)}</p>
                                    </div>
                                    <div className="text-lg text-muted-foreground">→</div>
                                    <div className="flex-1 text-center p-2.5 bg-destructive/10 rounded border border-destructive/30">
                                      <p className="text-xs text-muted-foreground mb-0.5">Tax</p>
                                      <p className="text-base font-bold text-destructive">-{formatCurrency(rsu.taxPaid)}</p>
                                    </div>
                                    <div className="text-lg text-muted-foreground">=</div>
                                    <div className="flex-1 text-center p-2.5 bg-success/10 rounded border border-success/30">
                                      <p className="text-xs text-muted-foreground mb-0.5">Net</p>
                                      <p className="text-base font-bold text-success">{formatCurrency(rsu.netRSUValue)}</p>
                                    </div>
                                  </div>

                                  {/* Compact Tax Rate Bar */}
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-muted-foreground">Effective Tax Rate: {formatPercentage(effectiveTaxRate)}</span>
                                      {data.incomeSettings.has30PercentRuling && <span className="text-xs text-success">✓ 30% ruling</span>}
                                    </div>
                                    <div className="relative h-2 bg-secondary/30 rounded-full overflow-hidden">
                                      <div 
                                        className="absolute h-full bg-destructive transition-all duration-500"
                                        style={{ width: `${effectiveTaxRate * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* Investments Tab */}
      {activeView === 'investments' && (
        <div className="space-y-8">
          {/* Wealth Growth Visualization - Enhanced */}
          <section className="bg-white rounded-xl p-8 border border-border/20 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <PiggyBank className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Wealth Growth Projection</h3>
                <p className="text-xs text-muted-foreground">Opening balance, contributions, growth, and total wealth over time</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={projections.yearlyInvestments.map((inv, idx) => ({
                year: inv.year,
                opening: inv.openingBalance,
                contributions: inv.contributions,
                growth: inv.investmentGrowth,
                closing: inv.closingBalance,
                pension: projections.yearlyPension[idx]?.closingBalance || 0,
                totalWealth: inv.closingBalance + (projections.yearlyPension[idx]?.closingBalance || 0)
              }))}>
                <defs>
                  <linearGradient id="openingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0.03}/>
                  </linearGradient>
                  <linearGradient id="contributionsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.08}/>
                  </linearGradient>
                  <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.08}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.3)" vertical={false} />
                <XAxis 
                  dataKey="year" 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '13px', fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      'opening': 'Opening Balance',
                      'contributions': 'Contributions',
                      'growth': 'Investment Growth',
                      'totalWealth': 'Total Wealth'
                    };
                    return [formatCurrency(value), labels[name] || name];
                  }}
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '2px solid hsl(var(--primary))',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
                  }}
                  labelStyle={{ fontWeight: 700, color: 'hsl(var(--primary))' }}
                />
                {/* Stacked areas with reduced opacity */}
                <Area
                  type="monotone"
                  dataKey="opening"
                  stackId="1"
                  stroke="hsl(var(--foreground))"
                  strokeWidth={1.5}
                  fill="url(#openingGradient)"
                  fillOpacity={0.8}
                />
                <Area
                  type="monotone"
                  dataKey="contributions"
                  stackId="1"
                  stroke="hsl(var(--accent))"
                  strokeWidth={1.5}
                  fill="url(#contributionsGradient)"
                  fillOpacity={0.8}
                />
                <Area
                  type="monotone"
                  dataKey="growth"
                  stackId="1"
                  stroke="hsl(var(--primary))"
                  strokeWidth={1.5}
                  fill="url(#growthGradient)"
                  fillOpacity={0.8}
                />
                {/* Bold line overlay for total wealth */}
                <Line
                  type="monotone"
                  dataKey="totalWealth"
                  name="Total Wealth"
                  stroke="hsl(var(--foreground))"
                  strokeWidth={3}
                  strokeDasharray="8 4"
                  dot={{ r: 5, strokeWidth: 2, fill: 'white', stroke: 'hsl(var(--foreground))' }}
                  activeDot={{ r: 7 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </section>

          {/* Investment Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-6 bg-card border border-border/50 rounded-lg shadow-card hover:shadow-elevated transition-all duration-200 shadow-card hover:shadow-elevated transition-shadow duration-200">
              <p className="text-sm text-muted-foreground font-medium mb-2">Starting Balance</p>
              <p className="text-2xl font-semibold">{formatCurrency(data.investmentSettings.startingNetWorth)}</p>
            </div>
            <div className="p-6 bg-card border border-border/50 rounded-lg shadow-card hover:shadow-elevated transition-all duration-200 shadow-card hover:shadow-elevated transition-shadow duration-200">
              <p className="text-sm text-muted-foreground font-medium mb-2">Final Balance</p>
              <p className="text-2xl font-semibold text-success">{formatCurrency(finalInvestmentBalance)}</p>
            </div>
            <div className="p-6 bg-card border border-border/50 rounded-lg shadow-card hover:shadow-elevated transition-all duration-200 shadow-card hover:shadow-elevated transition-shadow duration-200">
              <p className="text-sm text-muted-foreground font-medium mb-2">Total Growth</p>
              <p className="text-2xl font-semibold text-success">
                +{formatCurrency(finalInvestmentBalance - data.investmentSettings.startingNetWorth)}
              </p>
            </div>
            <div className="p-6 bg-card border border-border/50 rounded-lg shadow-card hover:shadow-elevated transition-all duration-200 shadow-card hover:shadow-elevated transition-shadow duration-200">
              <p className="text-sm text-muted-foreground font-medium mb-2">Return Rate</p>
              <p className="text-2xl font-semibold">{formatPercentage(data.investmentSettings.annualReturnRate)}</p>
            </div>
          </div>

          {/* Investment Timeline Table with Drill-Down */}
          <section className="bg-card border border-border/50 rounded-lg shadow-card hover:shadow-elevated transition-shadow duration-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50">
              <h3 className="text-lg font-semibold">Investment Timeline</h3>
              <p className="text-sm text-muted-foreground mt-1">Liquid investments - Click to see breakdown</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-secondary/30 border-b border-border/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Year</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Opening</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">+ Contributions</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">+ Growth</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">= Closing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {projections.yearlyInvestments.map((inv) => {
                    const isExpanded = expandedInvestmentYear === inv.year;
                    return (
                      <React.Fragment key={inv.year}>
                        {/* Main Row */}
                        <tr 
                          className="hover:bg-secondary/20 transition-colors cursor-pointer"
                          onClick={() => setExpandedInvestmentYear(isExpanded ? null : inv.year)}
                        >
                          <td className="px-6 py-4 text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                              <span>{inv.year}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-right text-muted-foreground">{formatCurrency(inv.openingBalance)}</td>
                          <td className="px-6 py-4 text-sm text-right text-success">+{formatCurrency(inv.contributions)}</td>
                          <td className="px-6 py-4 text-sm text-right text-success">+{formatCurrency(inv.investmentGrowth)}</td>
                          <td className="px-6 py-4 text-sm text-right font-semibold">{formatCurrency(inv.closingBalance)}</td>
                        </tr>

                        {/* Expanded Detail Row */}
                        {isExpanded && (
                          <tr className="bg-secondary/10">
                            <td colSpan={5} className="px-6 py-6">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Opening Balance */}
                                <div className="bg-card border border-border/50 rounded-lg p-4 shadow-sm">
                                  <h4 className="font-semibold text-sm mb-3 text-foreground">Money Already There</h4>
                                  <div className="space-y-2 text-xs">
                                    <div className="flex justify-between py-2">
                                      <span className="text-muted-foreground">Opening Balance</span>
                                      <span className="font-semibold text-lg">{formatCurrency(inv.openingBalance)}</span>
                                    </div>
                                    <p className="text-muted-foreground text-xs">
                                      Your portfolio value at the start of {inv.year}
                                    </p>
                                  </div>
                                </div>

                                {/* Contributions Breakdown */}
                                <div className="bg-card border border-border/50 rounded-lg p-4 shadow-sm">
                                  <h4 className="font-semibold text-sm mb-3 text-success">Added Money</h4>
                                  <div className="space-y-2 text-xs">
                                    <div className="flex justify-between py-1 border-b border-border/30">
                                      <span className="text-muted-foreground">Monthly Savings</span>
                                      <span className="font-medium text-success">+{formatCurrency(inv.monthlySavingsContributions)}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-border/30">
                                      <span className="text-muted-foreground">Holiday Allowance ({formatPercentage(data.investmentSettings.holidayAllowanceInvestmentPercentage)})</span>
                                      <span className="font-medium text-success">+{formatCurrency(inv.holidayAllowanceContributions)}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-border/30">
                                      <span className="text-muted-foreground">Bonus Invested ({formatPercentage(data.investmentSettings.bonusInvestmentPercentage)})</span>
                                      <span className="font-medium text-success">+{formatCurrency(inv.bonusContributions)}</span>
                                    </div>
                                    <div className="flex justify-between py-1 border-b border-border/50">
                                      <span className="text-muted-foreground">RSU Equity (after tax)</span>
                                      <span className="font-medium text-success">+{formatCurrency(inv.rsuContributions)}</span>
                                    </div>
                                    <div className="flex justify-between py-2 font-semibold text-foreground">
                                      <span>Total Added</span>
                                      <span className="text-success">+{formatCurrency(inv.contributions)}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Growth & Final */}
                                <div className="bg-card border border-border/50 rounded-lg p-4 shadow-sm">
                                  <h4 className="font-semibold text-sm mb-3 text-primary">Return on Money</h4>
                                  <div className="space-y-2 text-xs">
                                    <div className="flex justify-between py-1 border-b border-border/30">
                                      <span className="text-muted-foreground">Investment Growth ({formatPercentage(data.investmentSettings.annualReturnRate)})</span>
                                      <span className="font-medium text-success">+{formatCurrency(inv.investmentGrowth)}</span>
                                    </div>
                                    <div className="flex justify-between py-2 font-semibold text-foreground text-base border-t border-border/50 mt-2 pt-2">
                                      <span>Closing Balance</span>
                                      <span className="text-primary">{formatCurrency(inv.closingBalance)}</span>
                                    </div>
                                    <p className="text-muted-foreground text-xs mt-2">
                                      Growth on average balance: {formatCurrency((inv.openingBalance + inv.contributions/2) * data.investmentSettings.annualReturnRate)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Pension Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-6 bg-card border border-border/50 rounded-lg shadow-card hover:shadow-elevated transition-all duration-200 shadow-card hover:shadow-elevated transition-shadow duration-200">
              <p className="text-sm text-muted-foreground font-medium mb-2">Starting Pension</p>
              <p className="text-2xl font-semibold">{formatCurrency(data.investmentSettings.startingPensionBalance)}</p>
            </div>
            <div className="p-6 bg-card border border-border/50 rounded-lg shadow-card hover:shadow-elevated transition-all duration-200 shadow-card hover:shadow-elevated transition-shadow duration-200">
              <p className="text-sm text-muted-foreground font-medium mb-2">Final Pension</p>
              <p className="text-2xl font-semibold text-success">{formatCurrency(finalPensionBalance)}</p>
            </div>
            <div className="p-6 bg-card border border-border/50 rounded-lg shadow-card hover:shadow-elevated transition-all duration-200 shadow-card hover:shadow-elevated transition-shadow duration-200">
              <p className="text-sm text-muted-foreground font-medium mb-2">Total Pension Growth</p>
              <p className="text-2xl font-semibold text-success">
                +{formatCurrency(finalPensionBalance - data.investmentSettings.startingPensionBalance)}
              </p>
            </div>
            <div className="p-6 bg-card border border-border/50 rounded-lg shadow-card hover:shadow-elevated transition-all duration-200 shadow-card hover:shadow-elevated transition-shadow duration-200">
              <p className="text-sm text-muted-foreground font-medium mb-2">Pension Return Rate</p>
              <p className="text-2xl font-semibold">{formatPercentage(data.investmentSettings.pensionReturnRate)}</p>
            </div>
          </div>

          {/* Pension Timeline Table */}
          <section className="bg-card border border-border/50 rounded-lg shadow-card hover:shadow-elevated transition-shadow duration-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-border/50">
              <h3 className="text-lg font-semibold">Pension Fund Growth</h3>
              <p className="text-sm text-muted-foreground mt-1">Locked until retirement</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-secondary/30 border-b border-border/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Year</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Opening</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Your Contributions</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Employer</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Growth</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Closing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {projections.yearlyPension.map((pension) => (
                    <tr key={pension.year} className="hover:bg-secondary/20 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium">{pension.year}</td>
                      <td className="px-6 py-4 text-sm text-right text-muted-foreground">{formatCurrency(pension.openingBalance)}</td>
                      <td className="px-6 py-4 text-sm text-right text-success">+{formatCurrency(pension.employeeContributions)}</td>
                      <td className="px-6 py-4 text-sm text-right text-success">+{formatCurrency(pension.employerContributions)}</td>
                      <td className="px-6 py-4 text-sm text-right text-success">+{formatCurrency(pension.pensionGrowth)}</td>
                      <td className="px-6 py-4 text-sm text-right font-medium">{formatCurrency(pension.closingBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

