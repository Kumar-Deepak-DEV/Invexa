import React, { useState } from 'react';
import { StockSenseProvider, useStockSense } from './context/StockSenseContext';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { CommandPalette } from './components/layout/CommandPalette';
import { ToastContainer } from './components/layout/ToastContainer';
import { InvexaAICopilot } from './components/chat/InvexaAICopilot';

// Views
import { DashboardView } from './components/views/DashboardView';
import { ProductsView } from './components/views/ProductsView';
import { StockView } from './components/views/StockView';
import { WarehousesView } from './components/views/WarehousesView';
import { ReceiptsView } from './components/views/ReceiptsView';
import { DeliveriesView } from './components/views/DeliveriesView';
import { TransfersView } from './components/views/TransfersView';
import { HistoryLedgerView } from './components/views/HistoryLedgerView';
import { CategoriesRulesView } from './components/views/CategoriesRulesView';
import { ProfileView } from './components/views/ProfileView';
import { AuthView } from './components/views/AuthView';
import { LandingView } from './components/views/LandingView';
import { InboxView } from './components/views/InboxView';


import { ErrorBoundary } from './components/common/ErrorBoundary';

const MainLayout: React.FC = () => {
  const { activeView, setActiveView } = useStockSense();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderActiveView = () => {
    switch (activeView) {
      case 'landing':
        return <LandingView />;
      case 'dashboard':
        return <DashboardView />;
      case 'inbox':
        return <InboxView />;
      case 'products':
        return <ProductsView />;
      case 'stock':
        return <StockView />;
      case 'warehouses':
        return <WarehousesView />;
      case 'receipts':
        return <ReceiptsView />;
      case 'deliveries':
        return <DeliveriesView />;
      case 'transfers':
      case 'adjustments':
        return <TransfersView />;
      case 'history':
      case 'ledger':
        return <HistoryLedgerView />;
      case 'categories':
      case 'rules':
        return <CategoriesRulesView />;
      case 'profile':
        return <ProfileView />;
      case 'auth':
      case 'login':
      case 'register':
      case 'signup':
        return <AuthView />;
      default:
        return <DashboardView />;
    }
  };

  // Standalone Full-Page Views
  if (activeView === 'landing') {
    return (
      <ErrorBoundary fallbackTitle="Landing Page Recovered" onReset={() => setActiveView('dashboard')}>
        <div className="min-h-screen w-full bg-white overflow-x-hidden flex flex-col font-sans">
          <LandingView />
          <ToastContainer />
        </div>
      </ErrorBoundary>
    );
  }

  // If on Auth view standalone
  if (activeView === 'auth' || activeView === 'login' || activeView === 'register' || activeView === 'signup') {
    return (
      <ErrorBoundary fallbackTitle="Authentication Screen Recovered" onReset={() => setActiveView('landing')}>
        <div className="h-screen w-full bg-white overflow-hidden flex flex-col">
          <AuthView />
          <ToastContainer />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex antialiased">
      {/* Sidebar as sticky side-by-side flex element */}
      <Sidebar
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />

      {/* Main Content Area (Natural flex sibling - 0 overlap possible) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Operational Navigation Bar */}
        <Navbar onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

        {/* Dynamic Module Workspace */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto pb-16">
          <ErrorBoundary onReset={() => setActiveView('dashboard')}>
            {renderActiveView()}
          </ErrorBoundary>
        </main>
      </div>

      {/* Global Command Spotlight Palette (⌘K / Ctrl+K) */}
      <CommandPalette />

      {/* Intelligent INVEXA AI Copilot Chatbot */}
      <InvexaAICopilot />

      {/* Semantic Notification Toasts */}
      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <StockSenseProvider>
        <MainLayout />
      </StockSenseProvider>
    </ErrorBoundary>
  );
}

export default App;
