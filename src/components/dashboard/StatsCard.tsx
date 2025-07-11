import React from 'react';
import { useStore } from '../../store/useStore';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  trend: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  color,
  trend
}) => {
  const { darkMode } = useStore();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ scale: 1.02, y: -4 }}
      className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className={`text-xs md:text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} truncate`}>
            {title}
          </p>
          <div className={`text-xl md:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mt-1 truncate`}>
            {value}
          </div>
        </div>
        <motion.div 
          whileHover={{ scale: 1.1, rotate: 5 }}
          className={`${color} rounded-xl p-2 md:p-3 text-white flex-shrink-0 ml-2 shadow-lg`}
        >
          {icon}
        </motion.div>
      </div>
      {trend && (
        <div className="mt-2 md:mt-4 flex items-center">
          <span className={`text-sm md:text-base font-medium ${trend === '+' ? 'text-green-600' : 'text-red-600'}`}>
            {trend}
          </span>
        </div>
      )}
    </motion.div>
  );
};
