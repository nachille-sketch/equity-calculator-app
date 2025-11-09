import { useState, useEffect } from 'react';
import { FinancialProvider, useFinancial } from './context/FinancialContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { InputsForm } from './components/InputsForm';
import { FinancialOverviewPage } from './components/FinancialOverviewPage';
import { SignUpFlow } from './components/SignUpFlow';

function AppContent() {
  const { data } = useFinancial();
  const [showSignUp, setShowSignUp] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [previousTab, setPreviousTab] = useState('dashboard');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [financialOverviewView, setFinancialOverviewView] = useState<'financials' | 'rsus' | 'investments'>('financials');

  // Check if user needs to complete sign-up
  useEffect(() => {
    const hasCompletedSetup = localStorage.getItem('setupCompleted') === 'true' || 
                              (data.incomeSettings.baseSalary > 0 && data.investmentSettings.startingNetWorth >= 0);
    setShowSignUp(!hasCompletedSetup);
  }, [data.incomeSettings.baseSalary, data.investmentSettings.startingNetWorth]);

  const handleSignUpComplete = () => {
    localStorage.setItem('setupCompleted', 'true');
    setShowSignUp(false);
  };

  // Tab order for determining slide direction
  const tabOrder = ['dashboard', 'financial-overview', 'inputs'];

  // Reset to default view when navigating away from financial-overview
  const handleTabChange = (tab: string) => {
    if (tab !== 'financial-overview') {
      setFinancialOverviewView('financials');
    }
    setPreviousTab(activeTab);
    setIsTransitioning(true);
    setActiveTab(tab);
  };

  // Reset transition state after animation
  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 350); // Match animation duration (350ms for snappy feel)
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  // Determine slide direction
  const getSlideDirection = () => {
    const currentIndex = tabOrder.indexOf(activeTab);
    const previousIndex = tabOrder.indexOf(previousTab);
    return currentIndex > previousIndex ? 'left' : 'right';
  };

  const renderContent = () => {
    const direction = getSlideDirection();
    const slideClass = isTransitioning 
      ? direction === 'left' 
        ? 'animate-slideInFromRight' 
        : 'animate-slideInFromLeft'
      : '';

    const content = (() => {
      switch (activeTab) {
        case 'dashboard':
          return <Dashboard />;
        case 'financial-overview':
          return <FinancialOverviewPage initialView={financialOverviewView} />;
        case 'inputs':
          return <InputsForm />;
        default:
          return <Dashboard />;
      }
    })();

    return (
      <div key={activeTab} className={slideClass}>
        {content}
      </div>
    );
  };

  if (showSignUp) {
    return <SignUpFlow onComplete={handleSignUpComplete} />;
  }

  return (
    <Layout activeTab={activeTab} onTabChange={handleTabChange}>
      {renderContent()}
    </Layout>
  );
}

function App() {
  return (
    <FinancialProvider>
      <AppContent />
    </FinancialProvider>
  );
}

export default App;
