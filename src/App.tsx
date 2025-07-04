import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './config/firebase';
import { useStore } from './store/useStore';
import { AuthForm } from './components/auth/AuthForm';
import { Layout } from './components/common/Layout';
import { Dashboard } from './components/dashboard/Dashboard';
import { TransactionList } from './components/transactions/TransactionList';
import { CategoryManager } from './components/categories/CategoryManager';
import { BudgetManager } from './components/budgets/BudgetManager';
import { GoalManager } from './components/goals/GoalManager';
import { LoanManager } from './components/loans/LoanManager';
import { ReportsPage } from './components/reports/ReportsPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { AccountPage } from './components/account/AccountPage';

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

  if (!user) {
    return <AuthForm />;
  }

  return (
    <Router>
      <div className={`${darkMode ? 'dark' : ''}`}>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<TransactionList />} />
            <Route path="/categories" element={<CategoryManager />} />
            <Route path="/budgets" element={<BudgetManager />} />
            <Route path="/goals" element={<GoalManager />} />
            <Route path="/loans" element={<LoanManager />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/account" element={<AccountPage />} />
          </Routes>
        </Layout>
      </div>
    </Router>
  );
}

export default App;
