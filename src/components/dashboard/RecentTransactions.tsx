import React from 'react';
import { useStore } from '../../store/useStore';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

function formatTime12h(time: string) {
  if (!time) return '';
  const [h, m] = time.split(':');
  let hour = parseInt(h, 10);
  const minute = m;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${ampm}`;
}

export const RecentTransactions: React.FC = () => {
  const { transactions, categories, darkMode } = useStore();

  const recentTransactions = transactions
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) {
        return dateB - dateA; // Most recent date first
      }
      // If dates are equal, compare time (assuming HH:mm format)
      function parseTime(t?: string) {
        if (!t || !/^\d{2}:\d{2}$/.test(t)) return 0;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      }
      const timeA = parseTime(a.time);
      const timeB = parseTime(b.time);
      return timeB - timeA; // Most recent time first
    })
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
      <h2 className={`text-lg md:text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        সাম্প্রতিক লেনদেন
      </h2>
      <div className="space-y-4">
        {recentTransactions.length === 0 ? (
          <p className={`text-center py-8 text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            কোন লেনদেন নেই
          </p>
        ) : (
          recentTransactions.map((transaction) => {
            const parsedDate = new Date(transaction.date); // Parse the date here

            // Check if the date is valid.  If not, use a default or handle appropriately.
            if (isNaN(parsedDate.getTime())) {
              console.error("Invalid date:", transaction.date);
              return null; // Or render a placeholder
            }

            const displayCategory = transaction.type === 'transfer' ? 'ট্রান্সফার' : transaction.category;

            return (
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
                      {displayCategory}
                    </p>
                    <p className={`text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {format(parsedDate, 'dd MMM yyyy')} {formatTime12h(transaction.time)}
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
                    {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toLocaleString()} ৳
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};
