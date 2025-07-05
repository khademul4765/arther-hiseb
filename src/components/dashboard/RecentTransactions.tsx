import React from 'react';
import { useStore } from '../../store/useStore';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const RecentTransactions: React.FC = () => {
  const { transactions, categories, darkMode } = useStore();

  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const getCategoryIcon = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName);
    return category?.icon || '💰';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6`}
    >
      <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
        সাম্প্রতিক লেনদেন
      </h2>
      <div className="space-y-4">
        {recentTransactions.length === 0 ? (
          <p className={`text-center py-8 text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            কোন লেনদেন নেই
          </p>
        ) : (
          recentTransactions.map((transaction) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex items-center justify-between p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
            >
              <div className="flex items-center space-x-3">
                <div className="text-2xl">
                  {getCategoryIcon(transaction.category)}
                </div>
                <div>
                  <p className={`font-medium text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {transaction.category}
                  </p>
                  <p className={`text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {format(new Date(transaction.date), 'dd MMM yyyy')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.type === 'income' ? (
                    <ArrowUpRight size={16} />
                  ) : (
                    <ArrowDownRight size={16} />
                  )}
                </div>
                <span className={`font-semibold text-lg ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.type === 'income' ? '+' : '-'}৳{transaction.amount.toLocaleString()}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};
