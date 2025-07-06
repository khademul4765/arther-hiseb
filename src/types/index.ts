export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: 'cash' | 'bank' | 'credit';
  description: string;
  balance: number;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  accountId: string;
  toAccountId?: string; // For transfers
  date: Date;
  time: string;
  person?: string;
  note: string;
  tags: string[];
  receiptUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  type: 'income' | 'expense';
  isDefault: boolean;
  createdAt: Date;
}

export interface Budget {
  id: string;
  userId: string;
  name: string;
  amount: number;
  spent: number;
  categories: string[]; // Changed from single category to multiple categories
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  categorySpending: { [categoryName: string]: number }; // Track spending per category
  createdAt: Date;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  transactionIds: string[];
  isCompleted: boolean;
  createdAt: Date;
}

export interface Loan {
  id: string;
  userId: string;
  type: 'borrowed' | 'lent';
  amount: number;
  remainingAmount: number;
  personName: string;
  personPhone?: string;
  personAddress?: string;
  date: Date;
  dueDate?: Date;
  installments: Installment[];
  note: string;
  isCompleted: boolean;
  createdAt: Date;
}

export interface Installment {
  id: string;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  isPaid: boolean;
  note?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'budget' | 'goal' | 'loan' | 'insight';
  priority: 'low' | 'medium' | 'high';
  isRead: boolean;
  createdAt: Date;
}