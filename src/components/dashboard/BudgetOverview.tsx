import React from 'react';
import { useStore } from '../../store/useStore';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export const BudgetOverview: React.FC = () => {
  const { budgets, transactions, darkMode } = useStore();

  const getBudgetStatus = (budget: any) => {
    const spentAmount = budget.spent || 0;
    const percentage = (spentAmount / budget.amount) * 100;

    if (percentage >= 90) return { status: 'danger', icon: AlertTriangle, color: 'text-red-600' };
    if (percentage >= 75) return { status: 'warning', icon: Clock, color: 'text-yellow-600' };
    return { status: 'safe', icon: CheckCircle, color: 'text-green-600' };
  };

  const activeBudgets = budgets.filter(b => b.isActive).slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6`}
    >
      <h2 className={`text-lg md:text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        বাজেট পরিস্থিতি
      </h2>
      <div className="space-y-4">
        {activeBudgets.length === 0 ? (
          <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            কোন সক্রিয় বাজেট নেই
          </p>
        ) : (
          activeBudgets.map((budget) => {
            const spentAmount = budget.spent || 0;
            const percentage = Math.min((spentAmount / budget.amount) * 100, 100);
            const { status, icon: Icon, color } = getBudgetStatus(budget);

            return (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Icon size={16} className={color} />
                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {budget.name}
                    </span>
                  </div>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {Math.round(percentage)}%
                  </span>
                </div>
                <div className={`w-full bg-gray-200 rounded-full h-2 ${darkMode ? 'bg-gray-600' : ''}`}>
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      percentage >= 90 ? 'bg-red-500' : 
                      percentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {spentAmount.toLocaleString()} ৳ / {budget.amount.toLocaleString()} ৳
                </p>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};
