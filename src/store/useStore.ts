import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Transaction, Category, Budget, Goal, Loan, Account, User } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface StoreState {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: Goal[];
  loans: Loan[];
  accounts: Account[];
  user: User | null;
  darkMode: boolean;
  showAccountForm: boolean;
  showCategoryForm: boolean;
  showBudgetForm: boolean;
  showGoalForm: boolean;
  showLoanForm: boolean;
  showSettings: boolean;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, transaction: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Omit<Category, 'id'>) => void;
  deleteCategory: (id: string) => void;
  addBudget: (budget: Omit<Budget, 'id'>) => void;
  updateBudget: (id: string, budget: Omit<Budget, 'id'>) => void;
  deleteBudget: (id: string) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, goal: Omit<Goal, 'id'>) => void;
  deleteGoal: (id: string) => void;
  addLoan: (loan: Omit<Loan, 'id'>) => void;
  updateLoan: (id: string, loan: Omit<Loan, 'id'>) => void;
  deleteLoan: (id: string) => void;
  addAccount: (account: Omit<Account, 'id'>) => void;
  updateAccount: (id: string, account: Omit<Account, 'id'>) => void;
  deleteAccount: (id: string) => void;
  setUser: (user: User | null) => void;
  toggleDarkMode: () => void;
  setShowAccountForm: (show: boolean) => void;
  setShowCategoryForm: (show: boolean) => void;
  setShowBudgetForm: (show: boolean) => void;
  setShowGoalForm: (show: boolean) => void;
  setShowLoanForm: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
}

const useStore = create<StoreState>()(
  devtools(
    persist(
      (set) => ({
        transactions: [],
        categories: [
          { id: '1', name: 'Food', type: 'expense', icon: '🍔' },
          { id: '2', name: 'Transportation', type: 'expense', icon: '🚌' },
          { id: '3', name: 'Salary', type: 'income', icon: '💰' },
          { id: '4', name: 'Rent', type: 'expense', icon: '🏠' },
          { id: '5', name: 'Shopping', type: 'expense', icon: '🛍️' },
          { id: '6', name: 'Entertainment', type: 'expense', icon: '🎬' },
          { id: '7', name: 'Freelance', type: 'income', icon: '💻' },
        ],
        budgets: [],
        goals: [],
        loans: [],
        accounts: [
          { id: '1', name: 'Cash', type: 'cash', description: 'Personal cash account', balance: 0 },
          { id: '2', name: 'Bank Account', type: 'bank', description: 'Main bank account', balance: 0 },
        ],
        user: null,
        darkMode: false,
        showAccountForm: false,
        showCategoryForm: false,
        showBudgetForm: false,
        showGoalForm: false,
        showLoanForm: false,
        showSettings: false,
        addTransaction: (transaction) =>
          set((state) => ({ transactions: [...state.transactions, { id: uuidv4(), ...transaction }] })),
        updateTransaction: (id, transaction) =>
          set((state) => ({
            transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...transaction } : t)),
          })),
        deleteTransaction: (id) =>
          set((state) => ({ transactions: state.transactions.filter((t) => t.id !== id) })),
        addCategory: (category) =>
          set((state) => ({ categories: [...state.categories, { id: uuidv4(), ...category }] })),
        updateCategory: (id, category) =>
          set((state) => ({
            categories: state.categories.map((c) => (c.id === id ? { ...c, ...category } : c)),
          })),
        deleteCategory: (id) =>
          set((state) => ({ categories: state.categories.filter((c) => c.id !== id) })),
        addBudget: (budget) =>
          set((state) => ({ budgets: [...state.budgets, { id: uuidv4(), ...budget }] })),
        updateBudget: (id, budget) =>
          set((state) => ({
            budgets: state.budgets.map((b) => (b.id === id ? { ...b, ...budget } : b)),
          })),
        deleteBudget: (id) =>
          set((state) => ({ budgets: state.budgets.filter((b) => b.id !== id) })),
          addGoal: (goal) =>
          set((state) => ({ goals: [...state.goals, { id: uuidv4(), ...goal }] })),
        updateGoal: (id, goal) =>
          set((state) => ({
            goals: state.goals.map((g) => (g.id === id ? { ...g, ...goal } : g)),
          })),
        deleteGoal: (id) =>
          set((state) => ({ goals: state.goals.filter((g) => g.id !== id) })),
        addLoan: (loan) =>
          set((state) => ({ loans: [...state.loans, { id: uuidv4(), ...loan }] })),
        updateLoan: (id, loan) =>
          set((state) => ({
            loans: state.loans.map((l) => (l.id === id ? { ...l, ...loan } : l)),
          })),
        deleteLoan: (id) =>
          set((state) => ({ loans: state.loans.filter((l) => l.id !== id) })),
        addAccount: (account) =>
          set((state) => ({ accounts: [...state.accounts, { id: uuidv4(), ...account }] })),
        updateAccount: (id, account) =>
          set((state) => ({
            accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...account } : a)),
          })),
        deleteAccount: (id) =>
          set((state) => ({ accounts: state.accounts.filter((a) => a.id !== id) })),
        setUser: (user) => set({ user }),
        toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
        setShowAccountForm: (show) => set({ showAccountForm: show }),
        setShowCategoryForm: (show) => set({ showCategoryForm: show }),
        setShowBudgetForm: (show) => set({ showBudgetForm: show }),
        setShowGoalForm: (show) => set({ showGoalForm: show }),
        setShowLoanForm: (show) => set({ showLoanForm: show }),
        setShowSettings: (show) => set({ showSettings: show }),
      }),
      {
        name: 'artho-hiseb-storage',
      }
    )
  )
);

export { useStore };
