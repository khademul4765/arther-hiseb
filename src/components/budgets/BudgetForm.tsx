import React from 'react';
import { useStore } from '../../store/useStore';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { X, TrendingUp, Calendar, DollarSign, Tag, Check } from 'lucide-react';

interface BudgetFormProps {
  onClose: () => void;
  onSubmit: () => void;
  budget?: any;
}

interface FormData {
  name: string;
  amount: number;
  categories: string[];
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
}

export const BudgetForm: React.FC<BudgetFormProps> = ({
  onClose,
  onSubmit,
  budget
}) => {
  const { addBudget, updateBudget, categories, darkMode } = useStore();
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>({
    defaultValues: budget ? {
      name: budget.name,
      amount: budget.amount,
      categories: budget.categories || [],
      period: budget.period,
      startDate: budget.startDate.toISOString().split('T')[0],
      endDate: budget.endDate.toISOString().split('T')[0]
    } : {
      period: 'monthly',
      categories: [],
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  });

  const period = watch('period');
  const selectedCategories = watch('categories') || [];

  const onFormSubmit = (data: FormData) => {
    if (data.categories.length === 0) {
      alert('অন্তত একটি ক্যাটেগরি নির্বাচন করুন');
      return;
    }

    const budgetData = {
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      isActive: true,
      categorySpending: {}
    };

    if (budget) {
      updateBudget(budget.id, budgetData);
    } else {
      addBudget(budgetData);
    }

    onSubmit();
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');

  const toggleCategory = (categoryName: string) => {
    const currentCategories = selectedCategories;
    const isSelected = currentCategories.includes(categoryName);
    
    if (isSelected) {
      setValue('categories', currentCategories.filter(c => c !== categoryName));
    } else {
      setValue('categories', [...currentCategories, categoryName]);
    }
  };

  const selectAllCategories = () => {
    setValue('categories', expenseCategories.map(c => c.name));
  };

  const clearAllCategories = () => {
    setValue('categories', []);
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
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {budget ? 'বাজেট সম্পাদনা' : 'নতুন বাজেট'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Name */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              বাজেটের নাম *
            </label>
            <div className="relative">
              <TrendingUp size={16} className={`absolute left-3 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <input
                type="text"
                {...register('name', { required: 'বাজেটের নাম আবশ্যক' })}
                className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                placeholder="বাজেটের নাম লিখুন"
              />
            </div>
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              পরিমাণ *
            </label>
            <div className="relative">
              <DollarSign size={16} className={`absolute left-3 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <input
                type="number"
                step="0.01"
                {...register('amount', { required: 'পরিমাণ আবশ্যক', min: 0.01 })}
                className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                placeholder="০.০০"
              />
            </div>
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
            )}
          </div>

          {/* Categories */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                ক্যাটেগরি নির্বাচন করুন * ({selectedCategories.length} টি নির্বাচিত)
              </label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={selectAllCategories}
                  className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  সব নির্বাচন
                </button>
                <button
                  type="button"
                  onClick={clearAllCategories}
                  className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  সব বাতিল
                </button>
              </div>
            </div>
            
            <div className={`max-h-48 overflow-y-auto border rounded-lg p-3 ${
              darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
            }`}>
              <div className="grid grid-cols-1 gap-2">
                {expenseCategories.map(category => {
                  const isSelected = selectedCategories.includes(category.name);
                  return (
                    <motion.button
                      key={category.id}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleCategory(category.name)}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        isSelected
                          ? darkMode 
                            ? 'border-green-500 bg-green-900/20 text-white' 
                            : 'border-green-500 bg-green-50 text-gray-900'
                          : darkMode 
                            ? 'border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700' 
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-xl">{category.icon}</span>
                        <span className="font-medium">{category.name}</span>
                      </div>
                      {isSelected && (
                        <Check size={16} className="text-green-600" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
            {selectedCategories.length === 0 && (
              <p className="text-red-500 text-sm mt-1">অন্তত একটি ক্যাটেগরি নির্বাচন করুন</p>
            )}
          </div>

          {/* Period */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              সময়কাল *
            </label>
            <select
              {...register('period', { required: 'সময়কাল নির্বাচন করুন' })}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
            >
              <option value="weekly">সাপ্তাহিক</option>
              <option value="monthly">মাসিক</option>
              <option value="yearly">বার্ষিক</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                শুরুর তারিখ *
              </label>
              <div className="relative">
                <Calendar size={16} className={`absolute left-3 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                <input
                  type="date"
                  {...register('startDate', { required: 'শুরুর তারিখ আবশ্যক' })}
                  className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                />
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                শেষের তারিখ *
              </label>
              <div className="relative">
                <Calendar size={16} className={`absolute left-3 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                <input
                  type="date"
                  {...register('endDate', { required: 'শেষের তারিখ আবশ্যক' })}
                  className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                />
              </div>
            </div>
          </div>

          {/* Selected Categories Preview */}
          {selectedCategories.length > 0 && (
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                নির্বাচিত ক্যাটেগরিসমূহ:
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedCategories.map(categoryName => {
                  const category = expenseCategories.find(c => c.name === categoryName);
                  return (
                    <span
                      key={categoryName}
                      className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm ${
                        darkMode ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-700'
                      } border`}
                    >
                      <span>{category?.icon}</span>
                      <span>{categoryName}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2 rounded-lg border ${
                darkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
            >
              {budget ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};