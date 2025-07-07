import React from 'react';
import { useStore } from '../../store/useStore';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { motion } from 'framer-motion';

ChartJS.register(ArcElement, Tooltip, Legend);

export const ExpenseChart: React.FC = () => {
  const { transactions, categories, darkMode } = useStore();

  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
  const expensesByCategory = expenseTransactions.reduce((acc, transaction) => {
    const cat = transaction.type === 'transfer' ? 'ট্রান্সফার' : transaction.category;
    acc[cat] = (acc[cat] || 0) + transaction.amount;
    return acc;
  }, {} as Record<string, number>);

  const chartData = {
    labels: Object.keys(expensesByCategory),
    datasets: [
      {
        data: Object.values(expensesByCategory),
        backgroundColor: [
          '#FF6B6B',
          '#4ECDC4',
          '#45B7D1',
          '#96CEB4',
          '#FFEAA7',
          '#DDA0DD',
          '#98D8E8',
          '#F7DC6F',
        ],
        borderWidth: 2,
        borderColor: darkMode ? '#374151' : '#ffffff',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: darkMode ? '#E5E7EB' : '#374151',
          font: {
            family: 'Noto Serif Bengali',
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            return `${label}: ${value.toLocaleString()} ৳`;
          },
        },
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6`}
    >
      <h2 className={`text-lg md:text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        ক্যাটেগরি অনুযায়ী খরচ
      </h2>
      <div className="h-64">
        {Object.keys(expensesByCategory).length === 0 ? (
          <div className={`flex items-center justify-center h-full ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            কোন খরচের তথ্য নেই
          </div>
        ) : (
          <Doughnut data={chartData} options={options} />
        )}
      </div>
    </motion.div>
  );
};
