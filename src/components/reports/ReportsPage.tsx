import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { motion } from 'framer-motion';
import { Receipt, Download, Calendar, TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { ThemedCheckbox } from '../common/ThemedCheckbox';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

export const ReportsPage: React.FC = () => {
  const { transactions, categories, darkMode } = useStore();
  const [dateRange, setDateRange] = useState('month');
  const [startDate, setStartDate] = useState(startOfMonth(new Date()).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(endOfMonth(new Date()).toISOString().split('T')[0]);

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'year':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'custom':
        return { start: new Date(startDate), end: new Date(endDate) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const { start, end } = getDateRange();
  
  const filteredTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate >= start && transactionDate <= end;
  });

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // Category-wise expense data
  const expensesByCategory = filteredTransactions.reduce((acc, transaction) => {
    const cat = transaction.type === 'transfer' ? 'ট্রান্সফার' : transaction.category;
    acc[cat] = (acc[cat] || 0) + transaction.amount;
    return acc;
  }, {} as Record<string, number>);

  const pieChartData = {
    labels: Object.keys(expensesByCategory),
    datasets: [
      {
        data: Object.values(expensesByCategory),
        backgroundColor: [
          '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
          '#DDA0DD', '#98D8E8', '#F7DC6F', '#FF8A80', '#81C784'
        ],
        borderWidth: 2,
        borderColor: darkMode ? '#374151' : '#ffffff',
      },
    ],
  };

  // Monthly trend data
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(new Date().getFullYear(), i, 1);
    const monthTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === i && tDate.getFullYear() === new Date().getFullYear();
    });
    
    return {
      month: format(month, 'MMM'),
      income: monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
      expense: monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    };
  });

  const lineChartData = {
    labels: monthlyData.map(d => d.month),
    datasets: [
      {
        label: 'আয়',
        data: monthlyData.map(d => d.income),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
      {
        label: 'খরচ',
        data: monthlyData.map(d => d.expense),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: darkMode ? '#E5E7EB' : '#374151',
          font: { family: 'Noto Serif Bengali' },
        },
      },
    },
    scales: {
      y: {
        ticks: { color: darkMode ? '#E5E7EB' : '#374151' },
        grid: { color: darkMode ? '#374151' : '#E5E7EB' },
      },
      x: {
        ticks: { color: darkMode ? '#E5E7EB' : '#374151' },
        grid: { color: darkMode ? '#374151' : '#E5E7EB' },
      },
    },
  };

  const exportReport = () => {
    const reportData = {
      period: `${format(start, 'dd MMM yyyy')} - ${format(end, 'dd MMM yyyy')}`,
      summary: { totalIncome, totalExpense, balance },
      transactions: filteredTransactions,
      categoryBreakdown: expensesByCategory
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          আর্থিক রিপোর্ট
        </h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={exportReport}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700"
        >
          <Download size={20} />
          <span>রিপোর্ট ডাউনলোড</span>
        </motion.button>
      </div>

      {/* Date Range Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6`}
      >
        <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
          সময়কাল নির্বাচন করুন
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className={`px-3 py-2 rounded-lg border ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
          >
            <option value="month">এই মাস</option>
            <option value="year">এই বছর</option>
            <option value="custom">কাস্টম</option>
          </select>
          
          {dateRange === 'custom' && (
            <>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
              />
            </>
          )}
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                মোট আয়
              </p>
              <p className={`text-2xl font-bold text-green-600 mt-1`}>
                ৳{totalIncome.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-100 rounded-lg p-3">
              <TrendingUp size={24} className="text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                মোট খরচ
              </p>
              <p className={`text-2xl font-bold text-red-600 mt-1`}>
                ৳{totalExpense.toLocaleString()}
              </p>
            </div>
            <div className="bg-red-100 rounded-lg p-3">
              <TrendingDown size={24} className="text-red-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                নেট ব্যালেন্স
              </p>
              <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-red-600'} mt-1`}>
                ৳{balance.toLocaleString()}
              </p>
            </div>
            <div className={`${balance >= 0 ? 'bg-blue-100' : 'bg-red-100'} rounded-lg p-3`}>
              <Receipt size={24} className={balance >= 0 ? 'text-blue-600' : 'text-red-600'} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6`}
        >
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
            <PieChart size={20} className="mr-2" />
            ক্যাটেগরি অনুযায়ী খরচ
          </h3>
          <div className="h-64">
            {Object.keys(expensesByCategory).length > 0 ? (
              <Doughnut data={pieChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            ) : (
              <div className={`flex items-center justify-center h-full ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                কোন খরচের তথ্য নেই
              </div>
            )}
          </div>
        </motion.div>

        {/* Monthly Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6`}
        >
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
            <TrendingUp size={20} className="mr-2" />
            মাসিক ট্রেন্ড
          </h3>
          <div className="h-64">
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </motion.div>
      </div>

      {/* Transaction Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6`}
      >
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
          লেনদেনের বিস্তারিত ({filteredTransactions.length}টি)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <th className={`text-left py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>তারিখ</th>
                <th className={`text-left py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>ক্যাটেগরি</th>
                <th className={`text-left py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>ধরন</th>
                <th className={`text-right py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>পরিমাণ</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.slice(0, 10).map((transaction) => (
                <tr key={transaction.id} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <td className={`py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {format(new Date(transaction.date), 'dd MMM yyyy')}
                  </td>
                  <td className={`py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {transaction.type === 'transfer' ? 'ট্রান্সফার' : transaction.category}
                  </td>
                  <td className={
                    `${darkMode ? 'text-gray-300' : 'text-gray-700'} py-2`
                  }>
                    {transaction.type === 'income' ? 'আয়' : transaction.type === 'expense' ? 'খরচ' : 'ট্রান্সফার'}
                  </td>
                  <td className={`text-right py-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {transaction.amount.toLocaleString()} ৳
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};
