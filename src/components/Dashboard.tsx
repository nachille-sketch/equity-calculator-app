import React, { useState } from 'react';
import { useFinancial } from '../context/FinancialContext';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  BarChart,
  Bar
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Settings, Zap, ChevronUp, DollarSign, Receipt } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { metrics, projections, data, updateIncomeSettings, updateInvestmentSettings, updatePlanningSettings } = useFinancial();
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [yearRange, setYearRange] = useState<'5Y' | '10Y' | 'All'>('All');

  // Custom tooltip component for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border-2 border-primary rounded-xl p-4 shadow-2xl">
          <p className="text-sm font-bold text-primary mb-2">Year {label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <span className="text-xs text-muted-foreground">{entry.name}</span>
                <span className="text-sm font-semibold text-foreground">{formatCurrency(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('€', '€');
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Calculate growth
  const growth = metrics.finalNetWorth - data.investmentSettings.startingNetWorth;
  const growthPercentage = (growth / data.investmentSettings.startingNetWorth) * 100;
  const isPositive = growth >= 0;

  // Chart data with year range filtering
  const allNetWorthData = projections.yearlyInvestments.map((inv) => ({
    year: inv.year,
    value: inv.closingBalance,
  }));
  
  const getFilteredData = (data: any[], range: '5Y' | '10Y' | 'All') => {
    if (range === 'All') return data;
    const yearsToShow = range === '5Y' ? 5 : 10;
    return data.slice(0, Math.min(yearsToShow, data.length));
  };
  
  const netWorthChartData = getFilteredData(allNetWorthData, yearRange);

  // Current year financials
  const currentYear = projections.yearlyFinancials[0];
  
  if (!currentYear) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Quick Assumptions Toggle - Enhanced with icon */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Wallet className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Financial Dashboard</h1>
        </div>
        <button
          onClick={() => setShowAssumptions(!showAssumptions)}
          className="px-4 py-2.5 bg-card border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all duration-200 text-sm font-medium flex items-center gap-2 shadow-sm hover:shadow-md group"
        >
          {showAssumptions ? <ChevronUp className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" /> : <Settings className="w-4 h-4 text-primary group-hover:rotate-90 transition-transform duration-300" />}
          <span>Quick Adjustments</span>
        </button>
      </div>

      {/* Collapsible Assumptions Panel - Clean & Minimal */}
      {showAssumptions && (
        <section className="p-8 bg-white border border-border/30 rounded-2xl shadow-sm space-y-8 animate-slideDown">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Modeling Assumptions</h3>
            </div>
            <p className="text-sm text-muted-foreground">Adjust parameters to see instant impact</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Salary Growth Rate */}
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-muted-foreground">Salary Growth Rate</span>
                <span className="ml-2 text-lg font-bold text-foreground">{(data.incomeSettings.salaryGrowthRate * 100).toFixed(1)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="15"
                step="0.5"
                value={data.incomeSettings.salaryGrowthRate * 100}
                onChange={(e) => updateIncomeSettings({ salaryGrowthRate: parseFloat(e.target.value) / 100 })}
                className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                style={{
                  background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${(data.incomeSettings.salaryGrowthRate * 100) / 15 * 100}%, hsl(var(--border)) ${(data.incomeSettings.salaryGrowthRate * 100) / 15 * 100}%, hsl(var(--border)) 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>15%</span>
              </div>
            </div>

            {/* Investment Return Rate */}
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-muted-foreground">Investment Return Rate</span>
                <span className="ml-2 text-lg font-bold text-foreground">{(data.investmentSettings.annualReturnRate * 100).toFixed(1)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="20"
                step="0.5"
                value={data.investmentSettings.annualReturnRate * 100}
                onChange={(e) => updateInvestmentSettings({ annualReturnRate: parseFloat(e.target.value) / 100 })}
                className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                style={{
                  background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${(data.investmentSettings.annualReturnRate * 100) / 20 * 100}%, hsl(var(--border)) ${(data.investmentSettings.annualReturnRate * 100) / 20 * 100}%, hsl(var(--border)) 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>20%</span>
              </div>
            </div>

            {/* Expense Inflation Rate */}
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-muted-foreground">Expense Inflation Rate</span>
                <span className="ml-2 text-lg font-bold text-foreground">{(data.planningSettings.expenseInflationRate * 100).toFixed(1)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={data.planningSettings.expenseInflationRate * 100}
                onChange={(e) => updatePlanningSettings({ expenseInflationRate: parseFloat(e.target.value) / 100 })}
                className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                style={{
                  background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${(data.planningSettings.expenseInflationRate * 100) / 10 * 100}%, hsl(var(--border)) ${(data.planningSettings.expenseInflationRate * 100) / 10 * 100}%, hsl(var(--border)) 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>10%</span>
              </div>
            </div>

            {/* Stock Price Growth Rate */}
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-muted-foreground">Stock Price Growth (RSU)</span>
                <span className="ml-2 text-lg font-bold text-foreground">{(data.investmentSettings.sharePriceGrowthRate * 100).toFixed(1)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="20"
                step="0.5"
                value={data.investmentSettings.sharePriceGrowthRate * 100}
                onChange={(e) => updateInvestmentSettings({ sharePriceGrowthRate: parseFloat(e.target.value) / 100 })}
                className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                style={{
                  background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${(data.investmentSettings.sharePriceGrowthRate * 100) / 20 * 100}%, hsl(var(--border)) ${(data.investmentSettings.sharePriceGrowthRate * 100) / 20 * 100}%, hsl(var(--border)) 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>20%</span>
              </div>
            </div>

            {/* Projection Years */}
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-muted-foreground">Projection Years</span>
                <span className="ml-2 text-lg font-bold text-foreground">{data.planningSettings.projectionYears}</span>
              </label>
              <input
                type="range"
                min="1"
                max="15"
                step="1"
                value={data.planningSettings.projectionYears}
                onChange={(e) => updatePlanningSettings({ projectionYears: parseInt(e.target.value) })}
                className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                style={{
                  background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${(data.planningSettings.projectionYears - 1) / 14 * 100}%, hsl(var(--border)) ${(data.planningSettings.projectionYears - 1) / 14 * 100}%, hsl(var(--border)) 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1</span>
                <span>15</span>
              </div>
            </div>

            {/* 30% Ruling Toggle */}
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-muted-foreground">30% Ruling</span>
                <span className="ml-2 text-xs text-muted-foreground">Expat tax benefit</span>
              </label>
              <div className="inline-flex w-full rounded-lg border-2 border-border p-1 bg-muted/10">
                <button
                  onClick={() => updateIncomeSettings({ has30PercentRuling: false })}
                  className={`flex-1 px-6 py-2.5 text-sm font-semibold rounded-md transition-all duration-200 ${
                    !data.incomeSettings.has30PercentRuling
                      ? 'bg-white shadow-md border-2 border-border text-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                  }`}
                >
                  No
                </button>
                <button
                  onClick={() => updateIncomeSettings({ has30PercentRuling: true })}
                  className={`flex-1 px-6 py-2.5 text-sm font-semibold rounded-md transition-all duration-200 ${
                    data.incomeSettings.has30PercentRuling
                      ? 'bg-primary text-white shadow-md border-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                  }`}
                >
                  Yes
                </button>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="pt-6 mt-2 border-t border-border/30">
            <p className="text-sm font-medium text-muted-foreground mb-4">Quick Presets:</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  updateIncomeSettings({ salaryGrowthRate: 0.03 });
                  updateInvestmentSettings({ annualReturnRate: 0.07, sharePriceGrowthRate: 0.03 });
                  updatePlanningSettings({ expenseInflationRate: 0.02 });
                }}
                className="px-6 py-2.5 bg-card border-2 border-border hover:border-primary hover:bg-primary/5 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md"
              >
                Conservative
              </button>
              <button
                onClick={() => {
                  updateIncomeSettings({ salaryGrowthRate: 0.05 });
                  updateInvestmentSettings({ annualReturnRate: 0.10, sharePriceGrowthRate: 0.05 });
                  updatePlanningSettings({ expenseInflationRate: 0.02 });
                }}
                className="px-6 py-2.5 bg-card border-2 border-border hover:border-primary hover:bg-primary/5 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md"
              >
                Moderate
              </button>
              <button
                onClick={() => {
                  updateIncomeSettings({ salaryGrowthRate: 0.08 });
                  updateInvestmentSettings({ annualReturnRate: 0.15, sharePriceGrowthRate: 0.10 });
                  updatePlanningSettings({ expenseInflationRate: 0.03 });
                }}
                className="px-6 py-2.5 bg-card border-2 border-border hover:border-primary hover:bg-primary/5 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md"
              >
                Aggressive
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Hero Balance Card - Clean, Professional Design */}
      <section className="relative p-12 bg-white border border-border/30 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
        {/* Subtle gradient accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3 pointer-events-none" />
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Projected Net Worth</p>
                <p className="text-xs text-muted-foreground">{data.planningSettings.projectionYears}-year outlook</p>
              </div>
            </div>
            
            {/* Growth Badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${isPositive ? 'bg-success/10' : 'bg-destructive/10'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4 text-success" /> : <TrendingDown className="w-4 h-4 text-destructive" />}
              <span className={`text-sm font-semibold ${isPositive ? 'text-success' : 'text-destructive'}`}>
                {isPositive ? '+' : ''}{formatPercentage(growthPercentage / 100)}
              </span>
            </div>
          </div>
          
          {/* Main Amount */}
          <div className="mb-6">
            <h2 className="text-6xl font-bold tracking-tight text-foreground mb-2">
              {formatCurrency(metrics.finalNetWorth)}
            </h2>
            <p className="text-sm text-muted-foreground">
              Growing from {formatCurrency(data.investmentSettings.startingNetWorth)} today
            </p>
          </div>
          
          {/* Key Metrics Grid - Clean & Simple */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border/30">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Savings</p>
              <p className="text-lg font-semibold text-foreground">{formatCurrency(metrics.totalSavings)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Investment Growth</p>
              <p className="text-lg font-semibold text-success">{formatCurrency(metrics.finalNetWorth - data.investmentSettings.startingNetWorth - metrics.totalSavings)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Avg. Tax Rate</p>
              <p className="text-lg font-semibold text-foreground">{formatPercentage(metrics.averageEffectiveTaxRate)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Net Worth Chart - Enhanced with icons */}
      <section className="bg-white rounded-xl p-8 border border-border/20 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Net Worth Projection</h3>
              <p className="text-xs text-muted-foreground">
                {data.planningSettings.startYear} - {data.planningSettings.startYear + data.planningSettings.projectionYears - 1}
              </p>
            </div>
          </div>
          {/* Year Range Selector */}
          <div className="flex items-center gap-1 bg-secondary/30 rounded-lg p-1">
            {(['5Y', '10Y', 'All'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setYearRange(range)}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  yearRange === range
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={netWorthChartData}>
            <defs>
              <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--foreground))" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="hsl(var(--foreground))" stopOpacity={0.02}/>
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
              tickFormatter={(value) => `€${(value / 1000).toFixed(1)}k`}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--foreground))"
              strokeWidth={2.5}
              fill="url(#netWorthGradient)"
              fillOpacity={1}
            />
          </AreaChart>
        </ResponsiveContainer>
      </section>


      {/* Financial Breakdown - Enhanced with icons and visualizations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Income Breakdown */}
        <section className="p-6 bg-card border border-border/50 rounded-lg shadow-card hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-success/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <h3 className="text-lg font-semibold">Income Breakdown</h3>
          </div>
          <div className="space-y-4">
            {/* Horizontal stacked bar visualization */}
            <div className="h-10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={[{
                    baseSalary: currentYear?.grossIncome || 0,
                    rsuIncome: currentYear?.rsuGrossValue || 0
                  }]}
                  margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                >
                  <Bar dataKey="baseSalary" stackId="a" fill="hsl(var(--foreground))" radius={[4, 0, 0, 4]} />
                  <Bar dataKey="rsuIncome" stackId="a" fill="hsl(var(--success))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Text breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(var(--foreground))' }} />
                  <span className="text-sm text-muted-foreground">Base Salary</span>
                </div>
                <span className="text-sm font-semibold">{formatCurrency(currentYear?.grossIncome || 0)}</span>
              </div>
              {currentYear && currentYear.rsuGrossValue > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-success" />
                    <span className="text-sm text-muted-foreground">RSU Income</span>
                  </div>
                  <span className="text-sm font-semibold text-success">+{formatCurrency(currentYear.rsuGrossValue)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <span className="text-sm font-medium">Total Gross</span>
                <span className="text-base font-semibold">{formatCurrency(currentYear?.totalGrossIncome || 0)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Tax Summary */}
        <section className="p-6 bg-card border border-border/50 rounded-lg shadow-card hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <Receipt className="w-5 h-5 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold">Tax Summary</h3>
          </div>
          <div className="space-y-4">
            {/* Horizontal flow visualization */}
            <div className="h-10 flex items-center gap-2">
              <div className="flex-1">
                <div className="h-8 bg-foreground/10 rounded flex items-center justify-center">
                  <span className="text-xs font-medium text-foreground">Gross</span>
                </div>
              </div>
              <div className="text-muted-foreground">→</div>
              <div className="flex-1">
                <div className="h-8 bg-destructive/10 rounded flex items-center justify-center">
                  <span className="text-xs font-medium text-destructive">Tax</span>
                </div>
              </div>
              <div className="text-muted-foreground">=</div>
              <div className="flex-1">
                <div className="h-8 bg-success/10 rounded flex items-center justify-center">
                  <span className="text-xs font-medium text-success">Net</span>
                </div>
              </div>
            </div>
            {/* Text breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Gross Income</span>
                <span className="text-sm font-semibold">{formatCurrency(currentYear?.totalGrossIncome || 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tax & Deductions</span>
                <span className="text-sm font-semibold text-destructive">-{formatCurrency((currentYear?.totalGrossIncome || 0) - (currentYear?.totalNetIncome || 0))}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <span className="text-sm font-medium">Net Income</span>
                <span className="text-base font-semibold text-success">{formatCurrency(currentYear?.totalNetIncome || 0)}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
