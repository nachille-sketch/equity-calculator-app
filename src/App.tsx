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
  const tabOrder = ['dashboard', 'financials', 'rsus', 'investments', 'inputs'];

  const handleTabChange = (tab: string) => {
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
        case 'financials':
          return <FinancialOverviewPage initialView="financials" />;
        case 'rsus':
          return <FinancialOverviewPage initialView="rsus" />;
        case 'investments':
          return <FinancialOverviewPage initialView="investments" />;
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
