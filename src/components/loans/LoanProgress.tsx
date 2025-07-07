import React from 'react';
import { useStore } from '../../store/useStore';
import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, CheckCircle } from 'lucide-react';

export const LoanProgress: React.FC = () => {
  const { loans, darkMode } = useStore();

  const borrowed = loans.filter(l => l.type === 'borrowed');
  const lent = loans.filter(l => l.type === 'lent');

  const borrowedTotal = borrowed.reduce((sum, l) => sum + l.amount, 0);
  const borrowedRemaining = borrowed.reduce((sum, l) => sum + l.remainingAmount, 0);
  const borrowedCompleted = borrowed.filter(l => l.isCompleted).length;

  const lentTotal = lent.reduce((sum, l) => sum + l.amount, 0);
  const lentRemaining = lent.reduce((sum, l) => sum + l.remainingAmount, 0);
  const lentCompleted = lent.filter(l => l.isCompleted).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6`}
    >
      <h2 className={`text-2xl md:text-3xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>ঋণ ও পাওনা ব্যবস্থাপনা</h2>
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        {/* Borrowed */}
        <div className="flex-1 flex flex-col justify-center items-center border-b lg:border-b-0 lg:border-r px-2 border-gray-300 dark:border-gray-700">
          <div className="flex items-center mb-2">
            <ArrowDownLeft size={18} className="mr-2 text-pink-500" />
            <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>ঋণ (নিয়েছি)</span>
          </div>
          <div className="flex flex-col gap-1 text-sm items-center">
            <span>মোট: <span className="font-bold">{borrowedTotal.toLocaleString()} ৳</span></span>
            <span>বাকি: <span className="font-bold">{borrowedRemaining.toLocaleString()} ৳</span></span>
            <span className="flex items-center gap-1">সম্পূর্ণ: <CheckCircle size={14} className="text-green-500" /> {borrowedCompleted}</span>
          </div>
        </div>
        {/* Lent */}
        <div className="flex-1 flex flex-col justify-center items-center px-2">
          <div className="flex items-center mb-2">
            <ArrowUpRight size={18} className="mr-2 text-yellow-500" />
            <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>পাওনা (দিয়েছি)</span>
          </div>
          <div className="flex flex-col gap-1 text-sm items-center">
            <span>মোট: <span className="font-bold">{lentTotal.toLocaleString()} ৳</span></span>
            <span>বাকি: <span className="font-bold">{lentRemaining.toLocaleString()} ৳</span></span>
            <span className="flex items-center gap-1">সম্পূর্ণ: <CheckCircle size={14} className="text-green-500" /> {lentCompleted}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
