export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: Date;
  time: string;
  person: string;
  note: string;
  tags: string[];
  accountId: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  isCompleted: boolean;
}

export interface Loan {
  id: string;
  name: string;
  amount: number;
  interestRate: number;
  startDate: Date;
  endDate: Date;
  isPaid: boolean;
}

export interface Account {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'mfs';
  description: string;
  balance: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}
