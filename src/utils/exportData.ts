// Export functionality for financial data
import type { FinancialData, FinancialProjections } from '../types/financial';

export const exportToJSON = (data: FinancialData, projections: FinancialProjections) => {
  const exportData = {
    exportDate: new Date().toISOString(),
    settings: data,
    projections: projections,
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `financial-plan-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToCSV = (projections: FinancialProjections) => {
  const headers = [
    'Year',
    'Gross Income',
    'Net Income',
    'Total Expenses',
    'Net Savings',
    'Savings Rate',
    'Effective Tax Rate',
    'Investment Balance',
    'Pension Balance',
  ];

  const rows = projections.yearlyFinancials.map((fin, index) => {
    const investment = projections.yearlyInvestments[index];
    const pension = projections.yearlyPension[index];
    return [
      fin.year,
      fin.totalGrossIncome.toFixed(2),
      fin.totalNetIncome.toFixed(2),
      fin.totalExpenses.toFixed(2),
      fin.netSavings.toFixed(2),
      (fin.savingsRate * 100).toFixed(2) + '%',
      (fin.effectiveTaxRate * 100).toFixed(2) + '%',
      investment?.closingBalance.toFixed(2) || '0',
      pension?.closingBalance.toFixed(2) || '0',
    ];
  });

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `financial-projections-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

