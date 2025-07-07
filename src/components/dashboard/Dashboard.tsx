import React from 'react';
import { useStore } from '../../store/useStore';
import { StatsCard } from './StatsCard';
import { RecentTransactions } from './RecentTransactions';
import { BudgetOverview } from './BudgetOverview';
import { GoalsProgress } from './GoalsProgress';
import { ExpenseChart } from './ExpenseChart';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, CreditCard, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { transactions, budgets, goals, accounts, loans, darkMode } = useStore();

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = accounts.reduce((sum, account) => sum + account.balance, 0);

  const activeGoals = goals.filter(g => !g.isCompleted).length;

  const totalLoanTaken = loans.filter(l => l.type === 'borrowed').reduce((sum, l) => sum + l.amount, 0);
  const totalMoneyLent = loans.filter(l => l.type === 'lent').reduce((sum, l) => sum + l.amount, 0);

  return (
    <div className="space-y-4 md:space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h1 className={`text-4xl md:text-5xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 md:mb-6 tracking-wide`}>
          ড্যাশবোর্ড
        </h1>
        <div className={`w-20 h-1 ${darkMode ? 'bg-green-500' : 'bg-green-600'} rounded-full mb-6`}></div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6"
      >
        <StatsCard
          title="মোট বর্তমান ব্যালেন্স"
          value={`${balance.toLocaleString()} ৳`}
          icon={<CreditCard size={20} className="md:w-6 md:h-6" />}
          color="bg-blue-600"
          trend={balance > 0 ? '+' : ''}
        />
        <StatsCard
          title="মোট আয়"
          value={`${totalIncome.toLocaleString()} ৳`}
          icon={<TrendingUp size={20} className="md:w-6 md:h-6" />}
          color="bg-green-600"
          trend="+"
        />
        <StatsCard
          title="মোট খরচ"
          value={`${totalExpense.toLocaleString()} ৳`}
          icon={<TrendingDown size={20} className="md:w-6 md:h-6" />}
          color="bg-red-600"
          trend="-"
        />
        <StatsCard
          title="সক্রিয় লক্ষ্য"
          value={activeGoals.toString()}
          icon={<Target size={20} className="md:w-6 md:h-6" />}
          color="bg-purple-600"
          trend=""
        />
        <StatsCard
          title="মোট ঋণ"
          value={`${totalLoanTaken.toLocaleString()} ৳`}
          icon={<ArrowDownCircle size={20} className="md:w-6 md:h-6" />}
          color="bg-pink-600"
          trend={totalLoanTaken > 0 ? '-' : ''}
        />
        <StatsCard
          title="মোট পাওনা"
          value={`${totalMoneyLent.toLocaleString()} ৳`}
          icon={<ArrowUpCircle size={20} className="md:w-6 md:h-6" />}
          color="bg-yellow-600"
          trend={totalMoneyLent > 0 ? '+' : ''}
        />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6"
      >
        <ExpenseChart />
        <RecentTransactions />
        
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6"
      >
        <BudgetOverview />
        <GoalsProgress />
      </motion.div>
    </div>
  );
};
