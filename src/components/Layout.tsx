import React, { useState, useRef, useEffect } from 'react';
import { exportToJSON, exportToCSV } from '../utils/exportData';
import { useFinancial } from '../context/FinancialContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const { data, projections } = useFinancial();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(89);

  const tabs = [
    { id: 'dashboard', name: 'Financial Overview' },
    { id: 'financials', name: 'Yearly Financials' },
    { id: 'rsus', name: 'RSUs' },
    { id: 'investments', name: 'Investments & Pension' }
  ];

  const handleExportJSON = () => {
    exportToJSON(data, projections);
    setShowExportMenu(false);
  };

  const handleExportCSV = () => {
    exportToCSV(projections);
    setShowExportMenu(false);
  };

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, []);

  return (
    <div className="min-h-screen bg-background transition-colors duration-200">
      {/* Header - Crisp Style with backdrop blur */}
      <header ref={headerRef} className="border-b border-border/50 bg-card/95 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Financial Planning</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Tech Worker Financial Tools · Netherlands
              </p>
            </div>
            
            {/* Action Icons */}
            <div className="flex items-center gap-2">
              {/* Export Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="p-3 rounded-full transition-colors hover:bg-secondary text-muted-foreground hover:text-foreground"
                  title="Export Data"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-lg shadow-elevated overflow-hidden animate-fadeIn">
                    <button
                      onClick={handleExportJSON}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors"
                    >
                      Export as JSON
                    </button>
                    <button
                      onClick={handleExportCSV}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-secondary transition-colors"
                    >
                      Export as CSV
                    </button>
                  </div>
                )}
              </div>

              {/* Settings Icon */}
              <button
                onClick={() => onTabChange('inputs')}
                className={`p-3 rounded-full transition-colors ${
                  activeTab === 'inputs'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                }`}
                title="Settings"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs - Crisp Style */}
      <nav className="border-b border-border/50 bg-card/90 sticky z-10 backdrop-blur-sm" style={{ top: `${headerHeight}px` }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? 'border-primary text-foreground bg-accent/30'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-primary hover:bg-accent/40 hover:shadow-lg hover:scale-105'
                  }
                `}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 overflow-hidden">
        {children}
      </main>

      {/* Footer - Minimal */}
      <footer className="border-t border-border/50 mt-12 bg-card/30">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="text-center text-xs text-muted-foreground">
            <p>Local storage only · NL Tax 2025 · Not financial advice</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

