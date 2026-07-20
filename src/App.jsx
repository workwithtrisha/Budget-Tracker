import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import TransactionForm from './components/TransactionForm';
import BudgetSettings from './components/BudgetSettings';
import DebtList from './components/DebtList';
import Login from './components/Login';
import { auth } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Plus, LayoutDashboard, Settings, Sun, Moon, CreditCard } from 'lucide-react';
import useBudgetStore from './store/useBudgetStore';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'settings'
  const [theme, setTheme] = useState('light');
  const { initializeSync } = useBudgetStore();
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser) {
        initializeSync(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, [initializeSync]);

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [theme]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="app-container">
      <header>
        <div>
          <h1 className="header-title">Monthly Budget Dashboard</h1>
          <p>Track your income, expenses, and savings seamlessly.</p>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div className="glass-panel flex" style={{ padding: '0.25rem', borderRadius: '999px' }}>
             <button 
                className={`btn ${currentView === 'dashboard' ? 'btn-primary' : ''}`}
                style={{ borderRadius: '999px', background: currentView === 'dashboard' ? '' : 'transparent', color: currentView === 'dashboard' ? 'white' : 'var(--text-secondary)' }}
                onClick={() => setCurrentView('dashboard')}
             >
                <LayoutDashboard size={18} /> Dashboard
             </button>
             <button 
                className={`btn ${currentView === 'debtlist' ? 'btn-primary' : ''}`}
                style={{ borderRadius: '999px', background: currentView === 'debtlist' ? '' : 'transparent', color: currentView === 'debtlist' ? 'white' : 'var(--text-secondary)' }}
                onClick={() => setCurrentView('debtlist')}
             >
                <CreditCard size={18} /> Debt List
             </button>
             <button 
                className={`btn ${currentView === 'settings' ? 'btn-primary' : ''}`}
                style={{ borderRadius: '999px', background: currentView === 'settings' ? '' : 'transparent', color: currentView === 'settings' ? 'white' : 'var(--text-secondary)' }}
                onClick={() => setCurrentView('settings')}
             >
                <Settings size={18} /> Settings
             </button>
          </div>

          <button 
             className="btn-icon" 
             onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
             title="Toggle theme"
             style={{ padding: '0.5rem', display: 'flex', alignItems: 'center' }}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={20} /> Add Transaction
          </button>

          <button 
            onClick={() => signOut(auth)}
            className="btn" 
            style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <main>
        {currentView === 'dashboard' && (
          <>
            <Dashboard />
            <TransactionList />
          </>
        )}
        {currentView === 'debtlist' && <DebtList />}
        {currentView === 'settings' && <BudgetSettings />}
      </main>

      {isModalOpen && <TransactionForm onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}

export default App;
