import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './config/firebase';
import { useStore } from './store/useStore';
import { AuthForm } from './components/auth/AuthForm';
import { Layout } from './components/common/Layout';
import { Dashboard } from './components/dashboard/Dashboard';
import { AccountManager } from './components/accounts/AccountManager';
import { TransactionList } from './components/transactions/TransactionList';
import { CategoryManager } from './components/categories/CategoryManager';
import { BudgetManager } from './components/budgets/BudgetManager';
import { GoalManager } from './components/goals/GoalManager';
import { LoanManager } from './components/loans/LoanManager';
import { ReportsPage } from './components/reports/ReportsPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { AccountPage } from './components/account/AccountPage';
import { ContactManager } from './components/contacts/ContactManager';

// Custom hook to update page title
const usePageTitle = () => {
  const location = useLocation();
  
  useEffect(() => {
    const pathToTitle: Record<string, string> = {
      '/': 'ড্যাশবোর্ড - অর্থের হিসেব',
      '/accounts': 'অ্যাকাউন্ট - অর্থের হিসেব',
      '/transactions': 'লেনদেন - অর্থের হিসেব',
      '/categories': 'ক্যাটেগরি - অর্থের হিসেব',
      '/budgets': 'বাজেট - অর্থের হিসেব',
      '/goals': 'লক্ষ্য - অর্থের হিসেব',
      '/loans': 'ঋণ ও পাওনা - অর্থের হিসেব',
      '/contacts': 'যোগাযোগ - অর্থের হিসেব',
      '/reports': 'রিপোর্ট - অর্থের হিসেব',
      '/settings': 'সেটিংস - অর্থের হিসেব',
      '/profile': 'প্রোফাইল - অর্থের হিসেব'
    };
    
    const title = pathToTitle[location.pathname] || 'অর্থের হিসেব';
    document.title = title;
  }, [location.pathname]);
};

// Wrapper component to use the hook
const AppContent = () => {
  usePageTitle();
  
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/accounts" element={<AccountManager />} />
        <Route path="/transactions" element={<TransactionList />} />
        <Route path="/categories" element={<CategoryManager />} />
        <Route path="/budgets" element={<BudgetManager />} />
        <Route path="/goals" element={<GoalManager />} />
        <Route path="/loans" element={<LoanManager />} />
        <Route path="/contacts" element={<ContactManager />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<AccountPage />} />
      </Routes>
    </Layout>
  );
};

function App() {
  const { user, setUser, darkMode } = useStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.data();
          
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            name: userData?.name || firebaseUser.displayName || 'ব্যবহারকারী',
            createdAt: userData?.createdAt?.toDate() || new Date()
          });
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            name: firebaseUser.displayName || 'ব্যবহারকারী',
            createdAt: new Date()
          });
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [setUser]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  if (!user) {
    return <AuthForm />;
  }

  return (
    <Router>
      <div>
        <AppContent />
      </div>
    </Router>
  );
}

export default App;
