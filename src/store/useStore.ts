import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Transaction, Category, Budget, Goal, Loan, Notification, User } from '../types';

interface StoreState {
  user: User | null;
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: Goal[];
  loans: Loan[];
  notifications: Notification[];
  darkMode: boolean;
  
  // Auth Actions
  setUser: (user: User | null) => void;
  logout: () => void;
  
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
  deleteGoal: (id: string) => void;
  addToGoal: (goalId: string, amount: number, transactionId: string) => void;
  
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
  initializeDefaultCategories: (userId: string) => void;
  clearUserData: () => void;
  loadUserData: (userId: string) => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      user: null,
      transactions: [],
      categories: [],
      budgets: [],
      goals: [],
      loans: [],
      notifications: [],
      darkMode: false,

      // Auth Actions
      setUser: (user) => {
        set({ user });
        if (user) {
          // Load user's data when they log in
          get().loadUserData(user.id);
          
          // Initialize default categories if none exist for this user
          const userCategories = get().categories.filter(c => c.userId === user.id);
          if (userCategories.length === 0) {
            get().initializeDefaultCategories(user.id);
          }
        }
      },

      logout: () => {
        // Only clear the current user, keep all data in storage
        set({ user: null });
      },

      loadUserData: (userId) => {
        // Filter data to show only current user's data
        const allState = get();
        set({
          transactions: allState.transactions.filter(t => t.userId === userId),
          categories: allState.categories.filter(c => c.userId === userId),
          budgets: allState.budgets.filter(b => b.userId === userId),
          goals: allState.goals.filter(g => g.userId === userId),
          loans: allState.loans.filter(l => l.userId === userId),
          notifications: allState.notifications.filter(n => n.userId === userId),
        });
      },

      // Transaction Actions
      addTransaction: (transaction) => {
        const user = get().user;
        if (!user) return;

        const newTransaction: Transaction = {
          ...transaction,
          id: Date.now().toString(),
          userId: user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        set((state) => ({
          transactions: [...state.transactions, newTransaction],
        }));

        // Update budget spent amount
        const budgets = get().budgets.filter(b => b.userId === user.id);
        const relatedBudget = budgets.find(b => b.category === transaction.category && transaction.type === 'expense');
        if (relatedBudget) {
          get().updateBudget(relatedBudget.id, {
            spent: relatedBudget.spent + transaction.amount
          });
        }

        // Check for budget alerts
        if (relatedBudget) {
          const spentPercentage = ((relatedBudget.spent + transaction.amount) / relatedBudget.amount) * 100;
          if (spentPercentage >= 90) {
            get().addNotification({
              title: 'বাজেট সতর্কতা',
              message: `${relatedBudget.name} বাজেট ৯০% শেষ!`,
              type: 'budget',
              priority: 'high',
              isRead: false
            });
          }
        }
      },

      updateTransaction: (id, updates) => {
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
          ),
        }));
      },

      deleteTransaction: (id) => {
        const user = get().user;
        if (!user) return;

        const transaction = get().transactions.find(t => t.id === id);
        if (transaction && transaction.type === 'expense') {
          // Update budget spent amount
          const budgets = get().budgets.filter(b => b.userId === user.id);
          const relatedBudget = budgets.find(b => b.category === transaction.category);
          if (relatedBudget) {
            get().updateBudget(relatedBudget.id, {
              spent: Math.max(0, relatedBudget.spent - transaction.amount)
            });
          }
        }

        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        }));
      },

      // Category Actions
      addCategory: (category) => {
        const user = get().user;
        if (!user) return;

        const newCategory: Category = {
          ...category,
          id: Date.now().toString(),
          userId: user.id,
          createdAt: new Date(),
        };
        set((state) => ({
          categories: [...state.categories, newCategory],
        }));
      },

      updateCategory: (id, updates) => {
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },

      deleteCategory: (id) => {
        const category = get().categories.find(c => c.id === id);
        if (category?.isDefault) return; // Prevent deletion of default categories

        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        }));
      },

      // Budget Actions
      addBudget: (budget) => {
        const user = get().user;
        if (!user) return;

        const newBudget: Budget = {
          ...budget,
          id: Date.now().toString(),
          userId: user.id,
          spent: 0,
          createdAt: new Date(),
        };
        set((state) => ({
          budgets: [...state.budgets, newBudget],
        }));
      },

      updateBudget: (id, updates) => {
        set((state) => ({
          budgets: state.budgets.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        }));
      },

      deleteBudget: (id) => {
        set((state) => ({
          budgets: state.budgets.filter((b) => b.id !== id),
        }));
      },

      // Goal Actions
      addGoal: (goal) => {
        const user = get().user;
        if (!user) return;

        const newGoal: Goal = {
          ...goal,
          id: Date.now().toString(),
          userId: user.id,
          currentAmount: 0,
          transactionIds: [],
          isCompleted: false,
          createdAt: new Date(),
        };
        set((state) => ({
          goals: [...state.goals, newGoal],
        }));
      },

      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        }));
      },

      deleteGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        }));
      },

      addToGoal: (goalId, amount, transactionId) => {
        const goal = get().goals.find(g => g.id === goalId);
        if (!goal) return;

        const newCurrentAmount = goal.currentAmount + amount;
        const isCompleted = newCurrentAmount >= goal.targetAmount;

        get().updateGoal(goalId, {
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
        }
      },

      // Loan Actions
      addLoan: (loan) => {
        const user = get().user;
        if (!user) return;

        const newLoan: Loan = {
          ...loan,
          id: Date.now().toString(),
          userId: user.id,
          remainingAmount: loan.amount,
          installments: [],
          isCompleted: false,
          createdAt: new Date(),
        };
        set((state) => ({
          loans: [...state.loans, newLoan],
        }));
      },

      updateLoan: (id, updates) => {
        set((state) => ({
          loans: state.loans.map((l) =>
            l.id === id ? { ...l, ...updates } : l
          ),
        }));
      },

      deleteLoan: (id) => {
        set((state) => ({
          loans: state.loans.filter((l) => l.id !== id),
        }));
      },

      payInstallment: (loanId, installmentId, amount) => {
        const loan = get().loans.find(l => l.id === loanId);
        if (!loan) return;

        const updatedInstallments = loan.installments.map(inst =>
          inst.id === installmentId
            ? { ...inst, isPaid: true, paidDate: new Date() }
            : inst
        );

        const newRemainingAmount = Math.max(0, loan.remainingAmount - amount);
        const isCompleted = newRemainingAmount === 0;

        get().updateLoan(loanId, {
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
      addNotification: (notification) => {
        const user = get().user;
        if (!user) return;

        const newNotification: Notification = {
          ...notification,
          id: Date.now().toString(),
          userId: user.id,
          createdAt: new Date(),
        };
        set((state) => ({
          notifications: [...state.notifications, newNotification],
        }));
      },

      markNotificationAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          ),
        }));
      },

      clearAllNotifications: () => {
        const user = get().user;
        if (!user) return;

        set((state) => ({
          notifications: state.notifications.filter(n => n.userId !== user.id)
        }));
      },

      // UI Actions
      toggleDarkMode: () => {
        set((state) => ({ darkMode: !state.darkMode }));
      },

      // Utility Actions
      initializeDefaultCategories: (userId) => {
        const defaultCategories: Category[] = [
          { id: `${userId}-1`, userId, name: 'খাবার', color: '#FF6B6B', icon: '🍽️', type: 'expense', isDefault: true, createdAt: new Date() },
          { id: `${userId}-2`, userId, name: 'পরিবহন', color: '#4ECDC4', icon: '🚗', type: 'expense', isDefault: true, createdAt: new Date() },
          { id: `${userId}-3`, userId, name: 'বিনোদন', color: '#45B7D1', icon: '🎬', type: 'expense', isDefault: true, createdAt: new Date() },
          { id: `${userId}-4`, userId, name: 'স্বাস্থ্য', color: '#96CEB4', icon: '🏥', type: 'expense', isDefault: true, createdAt: new Date() },
          { id: `${userId}-5`, userId, name: 'শিক্ষা', color: '#FFEAA7', icon: '📚', type: 'expense', isDefault: true, createdAt: new Date() },
          { id: `${userId}-6`, userId, name: 'বেতন', color: '#DDA0DD', icon: '💰', type: 'income', isDefault: true, createdAt: new Date() },
          { id: `${userId}-7`, userId, name: 'ব্যবসা', color: '#98D8E8', icon: '🏢', type: 'income', isDefault: true, createdAt: new Date() },
          { id: `${userId}-8`, userId, name: 'বিনিয়োগ', color: '#F7DC6F', icon: '📈', type: 'income', isDefault: true, createdAt: new Date() },
        ];

        set((state) => ({
          categories: [...state.categories, ...defaultCategories]
        }));
      },

      clearUserData: () => {
        const user = get().user;
        if (!user) return;

        // Only clear current user's data
        set((state) => ({
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
