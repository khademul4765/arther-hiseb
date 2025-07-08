import React, { useEffect, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { motion } from 'framer-motion';
import { X, TrendingUp, Calendar, DollarSign, Tag, ArrowDownRight, User, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface BudgetDetailsProps {
  budgetId: string;
  onClose: () => void;
}

export const BudgetDetails: React.FC<BudgetDetailsProps> = ({ budgetId, onClose }) => {
  const { budgets, transactions, categories, darkMode } = useStore();

  const budget = budgets.find(b => b.id === budgetId);
  
  const budgetData = useMemo(() => {
    if (!budget) return null;

    // Get transactions for this budget's categories within the date range
    const budgetTransactions = transactions.filter(t => 
      t.type === 'expense' && 
      (budget.categories || []).includes(t.category) &&
      new Date(t.date) >= new Date(budget.startDate) &&
      new Date(t.date) <= new Date(budget.endDate)
    );

    // Calculate spending per category
    const categorySpending = (budget.categories || []).reduce((acc, categoryName) => {
      const categoryTransactions = budgetTransactions.filter(t => t.category === categoryName);
      const spent = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      acc[categoryName] = {
        spent,
        transactions: categoryTransactions,
        category: categories.find(c => c.name === categoryName)
      };
      return acc;
    }, {} as Record<string, { spent: number; transactions: any[]; category: any }>);

    const totalSpent = Object.values(categorySpending).reduce((sum, cat) => sum + cat.spent, 0);
    const percentage = (totalSpent / budget.amount) * 100;

    return {
      budget,
      categorySpending,
      totalSpent,
      percentage,
      allTransactions: budgetTransactions
    };
  }, [budget, transactions, categories]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!budgetData) {
    return null;
  }

  const { budget: budgetInfo, categorySpending, totalSpent, percentage, allTransactions } = budgetData;

  // Chart data for category spending
  const chartData = {
    labels: Object.keys(categorySpending).filter(cat => categorySpending[cat].spent > 0),
    datasets: [
      {
        data: Object.keys(categorySpending)
          .filter(cat => categorySpending[cat].spent > 0)
          .map(cat => categorySpending[cat].spent),
        backgroundColor: Object.keys(categorySpending)
          .filter(cat => categorySpending[cat].spent > 0)
          .map(cat => categorySpending[cat].category?.color || '#6B7280'),
        borderWidth: 2,
        borderColor: darkMode ? '#374151' : '#ffffff',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: darkMode ? '#E5E7EB' : '#374151',
          font: { family: 'Noto Serif Bengali' },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = Object.values(categorySpending).reduce((sum, cat) => sum + cat.spent, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value.toLocaleString()} ৳ (${percentage}%)`;
          },
        },
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center`}>
            <TrendingUp size={24} className="mr-2" />
            {budgetInfo.name} - বিস্তারিত
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Budget Overview */}
          <div className={`lg:col-span-1 space-y-4`}>
            {/* Budget Summary */}
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                বাজেট সারাংশ
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>মোট বাজেট:</span>
                  <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    ৳{budgetInfo.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>খরচ হয়েছে:</span>
                  <span className={`font-semibold ${totalSpent > budgetInfo.amount ? 'text-red-600' : 'text-green-600'}`}>
                    ৳{totalSpent.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>বাকি আছে:</span>
                  <span className={`font-semibold ${(budgetInfo.amount - totalSpent) < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                    ৳{(budgetInfo.amount - totalSpent).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>ব্যবহৃত:</span>
                  <span className={`font-semibold ${percentage > 100 ? 'text-red-600' : percentage > 75 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className={`w-full bg-gray-200 rounded-full h-3 mt-4 ${darkMode ? 'bg-gray-600' : ''}`}>
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    percentage >= 100 ? 'bg-red-500' : 
                    percentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Budget Info */}
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                বাজেট তথ্য
              </h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Calendar size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {format(new Date(budgetInfo.startDate), 'dd MMM yyyy (dd/MM/yyyy)')} - {format(new Date(budgetInfo.endDate), 'dd MMM yyyy (dd/MM/yyyy)')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Tag size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {budgetInfo.period === 'weekly' ? 'সাপ্তাহিক' : budgetInfo.period === 'monthly' ? 'মাসিক' : 'বার্ষিক'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <DollarSign size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {(budgetInfo.categories || []).length} টি ক্যাটেগরি
                  </span>
                </div>
              </div>
            </div>

            {/* Chart */}
            {Object.keys(categorySpending).some(cat => categorySpending[cat].spent > 0) && (
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                  ক্যাটেগরি অনুযায়ী খরচ
                </h3>
                <div className="h-64">
                  <Doughnut data={chartData} options={chartOptions} />
                </div>
              </div>
            )}
          </div>

          {/* Category Spending & Transactions */}
          <div className="lg:col-span-2 space-y-4">
            {/* Category Spending Breakdown */}
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                ক্যাটেগরি অনুযায়ী খরচ
              </h3>
              <div className="space-y-3">
                {(budgetInfo.categories || []).map(categoryName => {
                  const catData = categorySpending[categoryName];
                  const catPercentage = budgetInfo.amount > 0 ? (catData.spent / budgetInfo.amount) * 100 : 0;
                  
                  return (
                    <div key={categoryName} className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: catData.category?.color || '#6B7280' }}
                          />
                          <span className="text-xl">{catData.category?.icon || '💰'}</span>
                          <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {categoryName}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={`font-semibold ${catData.spent > 0 ? 'text-red-600' : darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            ৳{catData.spent.toLocaleString()}
                          </span>
                          <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {catData.transactions.length} টি লেনদেন
                          </p>
                        </div>
                      </div>
                      {catData.spent > 0 && (
                        <div className={`w-full bg-gray-200 rounded-full h-2 ${darkMode ? 'bg-gray-600' : ''}`}>
                          <div
                            className="h-2 rounded-full bg-red-500"
                            style={{ width: `${Math.min(catPercentage, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Transactions */}
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                সাম্প্রতিক লেনদেন ({allTransactions.length} টি)
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {allTransactions
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 20)
                  .map(transaction => {
                    const category = categories.find(c => c.name === transaction.category);
                    return (
                      <div key={transaction.id} className={`p-3 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="text-xl">{category?.icon || '💰'}</div>
                            <div>
                              <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {transaction.category}
                              </p>
                              <div className="flex items-center space-x-2 text-sm">
                                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                                  {format(new Date(transaction.date), 'dd MMM yyyy (dd/MM/yyyy)')}
                                </span>
                                {transaction.person && (
                                  <>
                                    <span className={darkMode ? 'text-gray-500' : 'text-gray-400'}>•</span>
                                    <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                                      {transaction.person}
                                    </span>
                                  </>
                                )}
                              </div>
                              {transaction.note && (
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                                  {transaction.note}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-red-600">
                              -৳{transaction.amount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                {allTransactions.length === 0 && (
                  <div className="text-center py-8">
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      এই বাজেটে কোন লেনদেন নেই
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
