import React, { useState } from 'react';
import { useFinancial } from '../context/FinancialContext';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { Settings, Zap, ChevronUp } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { projections, data, updateIncomeSettings, updateInvestmentSettings, updatePlanningSettings } = useFinancial();
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header with Quick Adjustments */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-foreground">Financial Overview</h1>
        <button
          onClick={() => setShowAssumptions(!showAssumptions)}
          className="px-4 py-2 bg-white border border-border/50 rounded-lg hover:border-primary hover:bg-primary/5 transition-all duration-200 text-sm font-medium flex items-center gap-2 shadow-sm hover:shadow-md"
        >
          {showAssumptions ? <ChevronUp className="w-4 h-4 text-primary" /> : <Settings className="w-4 h-4 text-primary" />}
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
                <span className="ml-2 text-lg font-bold text-foreground">{Math.round(data.incomeSettings.salaryGrowthRate * 100)}%</span>
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
                <span className="ml-2 text-lg font-bold text-foreground">{Math.round(data.investmentSettings.annualReturnRate * 100)}%</span>
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
                <span className="ml-2 text-lg font-bold text-foreground">{Math.round(data.planningSettings.expenseInflationRate * 100)}%</span>
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
                <span className="ml-2 text-lg font-bold text-foreground">{Math.round(data.investmentSettings.sharePriceGrowthRate * 100)}%</span>
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

      {/* Net Worth Chart */}
      <section className="bg-white rounded-xl p-6 border border-border/20 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Net Worth Projection</h3>
            <p className="text-xs text-muted-foreground">
              {data.planningSettings.startYear} - {data.planningSettings.startYear + data.planningSettings.projectionYears - 1}
            </p>
          </div>
          {/* Year Range Selector */}
          <div className="flex items-center gap-1 bg-secondary/30 rounded-lg p-1">
            {(['5Y', '10Y', 'All'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setYearRange(range)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
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


      {/* Financial Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Income Breakdown */}
        <section className="bg-white rounded-xl p-6 border border-border/20 shadow-sm">
          <h3 className="text-base font-semibold mb-4">Income Breakdown</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Base Salary</span>
              <span className="text-sm font-semibold">{formatCurrency(currentYear?.grossIncome || 0)}</span>
            </div>
            {currentYear && currentYear.rsuGrossValue > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">RSU Income</span>
                <span className="text-sm font-semibold text-success">+{formatCurrency(currentYear.rsuGrossValue)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <span className="text-sm font-medium">Total Gross</span>
              <span className="text-base font-semibold">{formatCurrency(currentYear?.totalGrossIncome || 0)}</span>
            </div>
          </div>
        </section>

        {/* Tax Summary */}
        <section className="bg-white rounded-xl p-6 border border-border/20 shadow-sm">
          <h3 className="text-base font-semibold mb-4">Tax Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Gross Income</span>
              <span className="text-sm font-semibold">{formatCurrency(currentYear?.totalGrossIncome || 0)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tax & Deductions</span>
              <span className="text-sm font-semibold text-destructive">-{formatCurrency((currentYear?.totalGrossIncome || 0) - (currentYear?.totalNetIncome || 0))}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <span className="text-sm font-medium">Net Income</span>
              <span className="text-base font-semibold text-success">{formatCurrency(currentYear?.totalNetIncome || 0)}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
