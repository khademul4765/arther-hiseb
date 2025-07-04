import React from 'react';
import { useStore } from '../../store/useStore';
import { motion } from 'framer-motion';
import { Target, Plus } from 'lucide-react';

export const GoalsProgress: React.FC = () => {
  const { goals, darkMode } = useStore();

  const activeGoals = goals.filter(g => !g.isCompleted).slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6`}
    >
      <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
        লক্ষ্যের অগ্রগতি
      </h2>
      <div className="space-y-4">
        {activeGoals.length === 0 ? (
          <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            কোন সক্রিয় লক্ষ্য নেই
          </p>
        ) : (
          activeGoals.map((goal) => {
            const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);

            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Target size={16} className="text-purple-600" />
                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {goal.name}
                    </span>
                  </div>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {Math.round(percentage)}%
                  </span>
                </div>
                <div className={`w-full bg-gray-200 rounded-full h-2 ${darkMode ? 'bg-gray-600' : ''}`}>
                  <div
                    className="h-2 rounded-full bg-purple-500 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  ৳{goal.currentAmount.toLocaleString()} / ৳{goal.targetAmount.toLocaleString()}
                </p>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};
