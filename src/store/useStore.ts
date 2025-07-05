import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Transaction, Category, Budget, Goal, Loan, Notification, User, Account } from '../types';
import { db } from '../config/firebase';
import { collection, getDocs, query, where, onSnapshot, addDoc, setDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';

interface StoreState {
  user: User | null;
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: Goal[];
  loans: Loan[];
  notifications: Notification[];
  darkMode: boolean;
  isInitialized: boolean;
  
  // Auth Actions
  setUser: (user: User | null) => Promise<void>;
  logout: () => void;
  
  // Account Actions
  addAccount: (account: Omit<Account, 'id' | 'userId' | 'createdAt'>) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  transferMoney: (fromAccountId: string, toAccountId: string, amount: number, note?: string) => void;
  
  // Transaction Actions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  
  // Category Actions
  addCategory: (category: Omit<Category, 'id' | 'userId' | 'createdAt'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  
  // Budget Actions
  addBudget: (budget: Omit<Budget, 'id' | 'userId' | 'createdAt'>) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  
  // Goal Actions
  addGoal: (goal: Omit<Goal, 'id' | 'userId' | 'createdAt'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  addToGoal: (goalId: string, amount: number, transactionId: string) => void;
  deleteGoal: (id: string) => void;
  
  // Loan Actions
  addLoan: (loan: Omit<Loan, 'id' | 'userId' | 'createdAt'>) => void;
  updateLoan: (id: string, updates: Partial<Loan>) => void;
  deleteLoan: (id: string) => void;
  payInstallment: (loanId: string, installmentId: string, amount: number) => void;
  
  // Notification Actions
  addNotification: (notification: Omit<Notification, 'id' | 'userId' | 'createdAt'>) => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  
  // UI Actions
  toggleDarkMode: () => void;
  
  // Utility Actions
  initializeDefaultCategories: (userId: string) => Promise<void>;
  initializeDefaultAccounts: (userId: string) => Promise<void>;
  clearUserData: () => void;
  loadUserData: (userId: string) => void;
  calculateBudgetSpent: () => void;
}

// Helper function to convert Firestore Timestamps to Date objects
const convertTimestampsToDate = (obj: any): any => {
  if (!obj) return obj;
  
  if (obj instanceof Timestamp) {
    return obj.toDate();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertTimestampsToDate);
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertTimestampsToDate(value);
    }
    return converted;
  }
  
  return obj;
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      user: null,
      accounts: [],
      transactions: [],
      categories: [],
      budgets: [],
      goals: [],
      loans: [],
      notifications: [],
      darkMode: false,
      isInitialized: false,

      // Auth Actions
      setUser: async (user) => {
        set({ user });
        if (user) {
          // Load user's data when they log in
          get().loadUserData(user.id);
          
          // Wait a bit for the data to load, then check if we need to initialize defaults
          setTimeout(async () => {
            if (get().isInitialized) return; // Prevent duplicate initialization
            
            const userCategories = get().categories.filter(c => c.userId === user.id);
            if (userCategories.length === 0) {
              await get().initializeDefaultCategories(user.id);
            }

            const userAccounts = get().accounts.filter(a => a.userId === user.id);
            if (userAccounts.length === 0) {
              await get().initializeDefaultAccounts(user.id);
            }
            
            set({ isInitialized: true });
          }, 1000); // Wait 1 second for Firestore listeners to load data
        } else {
          set({ isInitialized: false });
        }
      },

      logout: () => {
        // Only clear the current user, keep all data in storage
        set({ user: null });
      },

      loadUserData: async (userId) => {
        try {
          // Setup listeners for accounts
          const accountsQuery = query(collection(db, 'accounts'), where('userId', '==', userId));
          onSnapshot(accountsQuery, (snapshot) => {
            const accounts: Account[] = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...convertTimestampsToDate(data)
              } as Account;
            });
            set({ accounts: accounts });
          });

          // Setup listeners for transactions
          const transactionsQuery = query(collection(db, 'transactions'), where('userId', '==', userId));
          onSnapshot(transactionsQuery, (snapshot) => {
            const transactions: Transaction[] = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...convertTimestampsToDate(data)
              } as Transaction;
            });
            set({ transactions: transactions });
            // Recalculate budget spent amounts when transactions change
            get().calculateBudgetSpent();
          });

          // Setup listeners for categories
          const categoriesQuery = query(collection(db, 'categories'), where('userId', '==', userId));
          onSnapshot(categoriesQuery, (snapshot) => {
            const categories: Category[] = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...convertTimestampsToDate(data)
              } as Category;
            });
            set({ categories: categories });
          });

          // Setup listeners for budgets
          const budgetsQuery = query(collection(db, 'budgets'), where('userId', '==', userId));
          onSnapshot(budgetsQuery, (snapshot) => {
            const budgets: Budget[] = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...convertTimestampsToDate(data)
              } as Budget;
            });
            set({ budgets: budgets });
            // Recalculate budget spent amounts when budgets change
            get().calculateBudgetSpent();
          });

          // Setup listeners for goals
          const goalsQuery = query(collection(db, 'goals'), where('userId', '==', userId));
          onSnapshot(goalsQuery, (snapshot) => {
            const goals: Goal[] = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...convertTimestampsToDate(data)
              } as Goal;
            });
            set({ goals: goals });
          });

          // Setup listeners for loans
          const loansQuery = query(collection(db, 'loans'), where('userId', '==', userId));
          onSnapshot(loansQuery, (snapshot) => {
            const loans: Loan[] = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...convertTimestampsToDate(data)
              } as Loan;
            });
            set({ loans: loans });
          });

          // Setup listeners for notifications
          const notificationsQuery = query(collection(db, 'notifications'), where('userId', '==', userId));
          onSnapshot(notificationsQuery, (snapshot) => {
            const notifications: Notification[] = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...convertTimestampsToDate(data)
              } as Notification;
            });
            set({ notifications: notifications });
          });
        } catch (error) {
          console.error('Error fetching user data from Firestore:', error);
        }
      },

      // Account Actions
      addAccount: async (account) => {
        const user = get().user;
        if (!user) return;
        await addDoc(collection(db, 'accounts'), {
          ...account,
          userId: user.id,
          createdAt: serverTimestamp(),
        });
      },

      updateAccount: async (id, updates) => {
        await updateDoc(doc(db, 'accounts', id), {
          ...updates,
        });
      },

      deleteAccount: async (id) => {
        const hasTransactions = get().transactions.some(t => t.accountId === id || t.toAccountId === id);
        if (hasTransactions) {
          get().addNotification({
            title: 'অ্যাকাউন্ট মুছতে পারবেন না',
            message: 'এই অ্যাকাউন্টে লেনদেন রয়েছে। প্রথমে সব লেনদেন মুছুন।',
            type: 'insight',
            priority: 'medium',
            isRead: false
          });
          return;
        }
        await deleteDoc(doc(db, 'accounts', id));
      },

      transferMoney: async (fromAccountId, toAccountId, amount, note = '') => {
        const user = get().user;
        if (!user) return;
        const fromAccount = get().accounts.find(a => a.id === fromAccountId);
        const toAccount = get().accounts.find(a => a.id === toAccountId);
        if (!fromAccount || !toAccount) return;
        if (fromAccount.balance < amount) {
          get().addNotification({
            title: 'অপর্যাপ্ত ব্যালেন্স',
            message: 'অ্যাকাউন্টে পর্যাপ্ত টাকা নেই।',
            type: 'insight',
            priority: 'medium',
            isRead: false
          });
          return;
        }
        await updateDoc(doc(db, 'accounts', fromAccountId), {
          balance: fromAccount.balance - amount
        });
        await updateDoc(doc(db, 'accounts', toAccountId), {
          balance: toAccount.balance + amount
        });
        await addDoc(collection(db, 'transactions'), {
          userId: user.id,
          amount,
          type: 'transfer',
          category: 'ট্রান্সফার',
          accountId: fromAccountId,
          toAccountId: toAccountId,
          date: new Date(),
          time: new Date().toTimeString().slice(0, 5),
          note: note || `${fromAccount.name} থেকে ${toAccount.name} এ ট্রান্সফার`,
          tags: ['ট্রান্সফার'],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        get().addNotification({
          title: 'ট্রান্সফার সফল',
          message: `৳${amount.toLocaleString()} ${fromAccount.name} থেকে ${toAccount.name} এ ট্রান্সফার হয়েছে।`,
          type: 'insight',
          priority: 'low',
          isRead: false
        });
      },

      // Transaction Actions
      addTransaction: async (transaction) => {
        const user = get().user;
        if (!user) return;
        
        // Update account balance
        const account = get().accounts.find(a => a.id === transaction.accountId);
        if (account) {
          const newBalance = transaction.type === 'income' 
            ? account.balance + transaction.amount 
            : account.balance - transaction.amount;
          
          await updateDoc(doc(db, 'accounts', transaction.accountId), {
            balance: newBalance
          });
        }

        await addDoc(collection(db, 'transactions'), {
          ...transaction,
          userId: user.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      },

      updateTransaction: async (id, updates) => {
        const oldTransaction = get().transactions.find(t => t.id === id);
        if (!oldTransaction) return;

        // Revert old transaction effect on account balance
        const account = get().accounts.find(a => a.id === oldTransaction.accountId);
        if (account) {
          const revertedBalance = oldTransaction.type === 'income' 
            ? account.balance - oldTransaction.amount 
            : account.balance + oldTransaction.amount;

          // Apply new transaction effect
          const newAmount = updates.amount || oldTransaction.amount;
          const newType = updates.type || oldTransaction.type;
          const newAccountId = updates.accountId || oldTransaction.accountId;
          
          const targetAccount = get().accounts.find(a => a.id === newAccountId);
          if (targetAccount) {
            const finalBalance = newType === 'income' 
              ? (newAccountId === oldTransaction.accountId ? revertedBalance : targetAccount.balance) + newAmount
              : (newAccountId === oldTransaction.accountId ? revertedBalance : targetAccount.balance) - newAmount;

            await updateDoc(doc(db, 'accounts', newAccountId), {
              balance: finalBalance
            });

            // If account changed, update the old account too
            if (newAccountId !== oldTransaction.accountId) {
              await updateDoc(doc(db, 'accounts', oldTransaction.accountId), {
                balance: revertedBalance
              });
            }
          }
        }

        await updateDoc(doc(db, 'transactions', id), {
          ...updates,
          updatedAt: serverTimestamp(),
        });
      },

      deleteTransaction: async (id) => {
        const transaction = get().transactions.find(t => t.id === id);
        if (!transaction) return;

        // Revert transaction effect on account balance
        const account = get().accounts.find(a => a.id === transaction.accountId);
        if (account) {
          const newBalance = transaction.type === 'income' 
            ? account.balance - transaction.amount 
            : account.balance + transaction.amount;
          
          await updateDoc(doc(db, 'accounts', transaction.accountId), {
            balance: newBalance
          });
        }

        await deleteDoc(doc(db, 'transactions', id));
      },

      // Category Actions
      addCategory: async (category) => {
        const user = get().user;
        if (!user) return;
        await addDoc(collection(db, 'categories'), {
          ...category,
          userId: user.id,
          createdAt: serverTimestamp(),
        });
      },

      updateCategory: async (id, updates) => {
        await updateDoc(doc(db, 'categories', id), {
          ...updates,
        });
      },

      deleteCategory: async (id) => {
        const category = get().categories.find(c => c.id === id);
        if (category?.isDefault) return;
        await deleteDoc(doc(db, 'categories', id));
      },

      // Budget Actions
      addBudget: async (budget) => {
        const user = get().user;
        if (!user) return;
        await addDoc(collection(db, 'budgets'), {
          ...budget,
          userId: user.id,
          spent: 0,
          createdAt: serverTimestamp(),
        });
      },

      updateBudget: async (id, updates) => {
        await updateDoc(doc(db, 'budgets', id), {
          ...updates,
        });
      },

      deleteBudget: async (id) => {
        await deleteDoc(doc(db, 'budgets', id));
      },

      calculateBudgetSpent: () => {
        const { budgets, transactions } = get();
        
        budgets.forEach(async (budget) => {
          const budgetTransactions = transactions.filter(t => 
            t.type === 'expense' && 
            t.category === budget.category &&
            new Date(t.date) >= new Date(budget.startDate) &&
            new Date(t.date) <= new Date(budget.endDate)
          );
          
          const spent = budgetTransactions.reduce((sum, t) => sum + t.amount, 0);
          
          if (budget.spent !== spent) {
            updateDoc(doc(db, 'budgets', budget.id), { spent });
          }
        });
      },

      // Goal Actions
      addGoal: async (goal) => {
        const user = get().user;
        if (!user) return;
        await addDoc(collection(db, 'goals'), {
          ...goal,
          userId: user.id,
          currentAmount: 0,
          transactionIds: [],
          isCompleted: false,
          createdAt: serverTimestamp(),
        });
      },

      updateGoal: async (id, updates) => {
        await updateDoc(doc(db, 'goals', id), {
          ...updates,
        });
      },

      deleteGoal: async (id) => {
        await deleteDoc(doc(db, 'goals', id));
      },

      addToGoal: async (goalId, amount, transactionId) => {
        const goal = get().goals.find(g => g.id === goalId);
        if (!goal) return;
        const newCurrentAmount = goal.currentAmount + amount;
        const isCompleted = newCurrentAmount >= goal.targetAmount;
        await updateDoc(doc(db, 'goals', goalId), {
          currentAmount: newCurrentAmount,
          transactionIds: [...goal.transactionIds, transactionId],
          isCompleted
        });
        if (isCompleted) {
          get().addNotification({
            title: 'লক্ষ্য অর্জিত!',
            message: `অভিনন্দন! "${goal.name}" লক্ষ্য সম্পূর্ণ হয়েছে।`,
            type: 'goal',
            priority: 'high',
            isRead: false
          });
        } else if (newCurrentAmount >= goal.targetAmount * 0.8) {
          get().addNotification({
            title: 'লক্ষ্যের কাছাকাছি!',
            message: `"${goal.name}" লক্ষ্য ৮০% সম্পূর্ণ হয়েছে।`,
            type: 'goal',
            priority: 'medium',
            isRead: false
          });
        }
      },

      // Loan Actions
      addLoan: async (loan) => {
        const user = get().user;
        if (!user) return;
        await addDoc(collection(db, 'loans'), {
          ...loan,
          userId: user.id,
          remainingAmount: loan.amount,
          installments: [],
          isCompleted: false,
          createdAt: serverTimestamp(),
        });
      },

      updateLoan: async (id, updates) => {
        await updateDoc(doc(db, 'loans', id), {
          ...updates,
        });
      },

      deleteLoan: async (id) => {
        await deleteDoc(doc(db, 'loans', id));
      },

      payInstallment: async (loanId, installmentId, amount) => {
        const loan = get().loans.find(l => l.id === loanId);
        if (!loan) return;
        let updatedInstallments = loan.installments;
        const existingInstallment = loan.installments.find(inst => inst.id === installmentId);
        if (!existingInstallment) {
          const newInstallment = {
            id: installmentId,
            amount,
            dueDate: new Date(),
            paidDate: new Date(),
            isPaid: true,
            note: 'ম্যানুয়াল পেমেন্ট'
          };
          updatedInstallments = [...loan.installments, newInstallment];
        } else {
          updatedInstallments = loan.installments.map(inst =>
            inst.id === installmentId
              ? { ...inst, isPaid: true, paidDate: new Date() }
              : inst
          );
        }
        const newRemainingAmount = Math.max(0, loan.remainingAmount - amount);
        const isCompleted = newRemainingAmount === 0;
        await updateDoc(doc(db, 'loans', loanId), {
          installments: updatedInstallments,
          remainingAmount: newRemainingAmount,
          isCompleted
        });
        if (isCompleted) {
          get().addNotification({
            title: 'ঋণ পরিশোধ সম্পূর্ণ',
            message: `${loan.personName} এর সাথে ঋণ সম্পূর্ণ পরিশোধ হয়েছে।`,
            type: 'loan',
            priority: 'medium',
            isRead: false
          });
        }
      },

      // Notification Actions
      addNotification: async (notification) => {
        const user = get().user;
        if (!user) return;
        await addDoc(collection(db, 'notifications'), {
          ...notification,
          userId: user.id,
          createdAt: serverTimestamp(),
        });
      },

      markNotificationAsRead: async (id) => {
        await updateDoc(doc(db, 'notifications', id), {
          isRead: true
        });
      },

      clearAllNotifications: async () => {
        const user = get().user;
        if (!user) return;
        const notifications = get().notifications.filter(n => n.userId === user.id);
        for (const n of notifications) {
          await deleteDoc(doc(db, 'notifications', n.id));
        }
      },

      // UI Actions
      toggleDarkMode: () => {
        set((state) => ({ darkMode: !state.darkMode }));
      },

      // Utility Actions
      initializeDefaultCategories: async (userId) => {
        const defaultCategories = [
          { name: 'খাবার', color: '#FF6B6B', icon: '🍽️', type: 'expense', isDefault: true },
          { name: 'পরিবহন', color: '#4ECDC4', icon: '🚗', type: 'expense', isDefault: true },
          { name: 'বিনোদন', color: '#45B7D1', icon: '🎬', type: 'expense', isDefault: true },
          { name: 'স্বাস্থ্য', color: '#96CEB4', icon: '🏥', type: 'expense', isDefault: true },
          { name: 'শিক্ষা', color: '#FFEAA7', icon: '📚', type: 'expense', isDefault: true },
          { name: 'বেতন', color: '#DDA0DD', icon: '💰', type: 'income', isDefault: true },
          { name: 'ব্যবসা', color: '#98D8E8', icon: '🏢', type: 'income', isDefault: true },
          { name: 'বিনিয়োগ', color: '#F7DC6F', icon: '📈', type: 'income', isDefault: true },
        ];

        for (const category of defaultCategories) {
          await addDoc(collection(db, 'categories'), {
            ...category,
            userId,
            createdAt: serverTimestamp(),
          });
        }
      },

      initializeDefaultAccounts: async (userId) => {
        const defaultAccounts = [
          {
            name: 'নগদ',
            type: 'cash',
            description: 'হাতে থাকা নগদ টাকা',
            balance: 0,
          },
          {
            name: 'ব্যাংক অ্যাকাউন্ট',
            type: 'bank',
            description: 'প্রধান ব্যাংক অ্যাকাউন্ট',
            balance: 0,
          }
        ];

        for (const account of defaultAccounts) {
          await addDoc(collection(db, 'accounts'), {
            ...account,
            userId,
            createdAt: serverTimestamp(),
          });
        }
      },

      clearUserData: () => {
        const user = get().user;
        if (!user) return;

        // Only clear current user's data
        set((state) => ({
          accounts: state.accounts.filter(a => a.userId !== user.id),
          transactions: state.transactions.filter(t => t.userId !== user.id),
          categories: state.categories.filter(c => c.userId !== user.id),
          budgets: state.budgets.filter(b => b.userId !== user.id),
          goals: state.goals.filter(g => g.userId !== user.id),
          loans: state.loans.filter(l => l.userId !== user.id),
          notifications: state.notifications.filter(n => n.userId !== user.id)
        }));
      },
    }),
    {
      name: 'amar-hiseb-storage',
    }
  )
);