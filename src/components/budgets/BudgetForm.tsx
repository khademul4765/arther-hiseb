import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { X, TrendingUp, Calendar, DollarSign, Tag, Check, ChevronDown, CalendarDays, CalendarRange, Edit3 } from 'lucide-react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CategorySelect } from '../common/CategorySelect';
import { DatePickerHeader, CustomCalendarContainer } from '../common/DatePickerHeader';

interface BudgetFormProps {
  onClose: () => void;
  onSubmit: () => void;
  budget?: any;
}

interface FormData {
  name: string;
  amount: number;
  categories: string[];
  period: 'weekly' | 'monthly' | 'yearly' | 'custom';
  startDate: string;
  endDate: string;
  duration?: number;
}

export const BudgetForm: React.FC<BudgetFormProps> = ({
  onClose,
  onSubmit,
  budget
}) => {
  const { addBudget, updateBudget, categories, darkMode, user } = useStore();
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

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const period = watch('period');
  const selectedCategories = watch('categories') || [];
  const startDate = watch('startDate');
  const duration = watch('duration');

  // Auto-calculate end date when duration or start date changes
  useEffect(() => {
    if (startDate && duration && duration > 0) {
      const start = new Date(startDate);
      const end = new Date(start.getTime() + duration * 24 * 60 * 60 * 1000);
      setValue('endDate', end.toISOString().split('T')[0]);
    }
  }, [startDate, duration, setValue]);

  // Add this useEffect after the period, startDate, and duration watches:
  useEffect(() => {
    if (!startDate) return;
    const start = new Date(startDate);
    let end: Date | null = null;
    if (period === 'weekly') {
      end = new Date(start);
      end.setDate(start.getDate() + 6);
    } else if (period === 'monthly') {
      end = new Date(start);
      end.setMonth(start.getMonth() + 1);
      end.setDate(end.getDate() - 1);
    } else if (period === 'yearly') {
      end = new Date(start);
      end.setFullYear(start.getFullYear() + 1);
      end.setDate(end.getDate() - 1);
    }
    if (end) {
      setValue('endDate', end.toISOString().split('T')[0]);
    }
  }, [period, startDate, setValue]);

  // Filter and deduplicate expense categories for current user
  const expenseCategories = useMemo(() => {
    if (!user) return [];
    
    const userExpenseCategories = categories.filter(c => 
      c.userId === user.id && c.type === 'expense'
    );
    
    // Remove duplicates based on name (case-insensitive)
    const uniqueCategories = userExpenseCategories.reduce((acc, current) => {
      const existing = acc.find(cat => 
        cat.name.toLowerCase() === current.name.toLowerCase()
      );
      
      if (!existing) {
        acc.push(current);
      } else {
        // Keep the default one or the one created first
        if (current.isDefault && !existing.isDefault) {
          const index = acc.findIndex(cat => cat.id === existing.id);
          acc[index] = current;
        } else if (!current.isDefault && !existing.isDefault) {
          // Keep the one created first
          if (new Date(current.createdAt) < new Date(existing.createdAt)) {
            const index = acc.findIndex(cat => cat.id === existing.id);
            acc[index] = current;
          }
        }
      }
      
      return acc;
    }, [] as typeof userExpenseCategories);
    
    // Sort alphabetically by name
    return uniqueCategories.sort((a, b) => a.name.localeCompare(b.name));
  }, [categories, user]);

  // Add state for category search
  const [categorySearch, setCategorySearch] = useState('');

  // Filtered categories based on search
  const filteredExpenseCategories = useMemo(() => {
    if (!categorySearch.trim()) return expenseCategories;
    return expenseCategories.filter(cat => cat.name.toLowerCase().includes(categorySearch.trim().toLowerCase()));
  }, [expenseCategories, categorySearch]);

  // Add state for custom dropdown
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
  const periodOptions = [
    { value: 'weekly', label: 'সাপ্তাহিক', icon: <CalendarDays size={18} className="mr-2" /> },
    { value: 'monthly', label: 'মাসিক', icon: <CalendarRange size={18} className="mr-2" /> },
    { value: 'yearly', label: 'বার্ষিক', icon: <Calendar size={18} className="mr-2" /> },
    { value: 'custom', label: 'কাস্টম (দিন নির্ধারণ করুন)', icon: <Edit3 size={18} className="mr-2" /> },
  ];

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
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ 
          type: 'spring', 
          stiffness: 300, 
          damping: 25,
          duration: 0.3 
        }}
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div 
          className="flex items-center justify-between mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <motion.h2 
            className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            {budget ? 'বাজেট সম্পাদনা' : 'নতুন বাজেট'}
          </motion.h2>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
          </motion.button>
        </motion.div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Name */}
          <div>
            <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
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
            <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              পরিমাণ *
            </label>
            <div className="relative">
              <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>৳</span>
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
              <label className={`text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                ক্যাটেগরি নির্বাচন করুন * ({selectedCategories.length} টি নির্বাচিত)
              </label>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={selectAllCategories}
                  className="text-sm px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  সব নির্বাচন
                </button>
                <button
                  type="button"
                  onClick={clearAllCategories}
                  className="text-sm px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  সব বাতিল
                </button>
              </div>
            </div>
            
            {/* Category Search Box */}
            <div className="mb-3">
              <input
                type="text"
                value={categorySearch}
                onChange={e => setCategorySearch(e.target.value)}
                placeholder="ক্যাটেগরি অনুসন্ধান করুন..."
                className={`w-full px-3 py-2 rounded-lg border text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all placeholder:text-gray-400 font-bengali ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>

            <div className={`max-h-48 overflow-y-auto border rounded-lg p-3 ${
              darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
            }`}>
              {filteredExpenseCategories.length === 0 ? (
                <div className="text-center py-8">
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    কোন খরচের ক্যাটেগরি পাওয়া যায়নি
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                    প্রথমে ক্যাটেগরি তৈরি করুন
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {filteredExpenseCategories.map(category => {
                    const isSelected = selectedCategories.includes(category.name);
                    return (
                      <motion.button
                        key={`${category.id}-${category.name}`} // Unique key to prevent React issues
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
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-xl flex-shrink-0">{category.icon}</span>
                          <span className="font-medium truncate">{category.name}</span>
                          {category.isDefault && (
                            <span className={`text-xs px-1 py-0.5 rounded ${
                              darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                            }`}>
                              ডিফল্ট
                            </span>
                          )}
                        </div>
                        {isSelected && (
                          <Check size={16} className="text-green-600 flex-shrink-0" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
            {selectedCategories.length === 0 && (
              <p className="text-red-500 text-sm mt-1">অন্তত একটি ক্যাটেগরি নির্বাচন করুন</p>
            )}
          </div>

          {/* Period */}
          <div className="mb-4">
            <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>সময়কাল *</label>
            <div className="relative">
              <button
                type="button"
                className={`w-full px-3 py-2 rounded-lg border flex items-center justify-between focus:ring-2 focus:ring-green-500 focus:border-transparent font-bengali shadow transition ${darkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-white text-green-700 border-gray-300'}`}
                onClick={() => setPeriodDropdownOpen(o => !o)}
                aria-haspopup="listbox"
                aria-expanded={periodDropdownOpen}
              >
                <span className="flex items-center">{periodOptions.find(opt => opt.value === period)?.icon}{periodOptions.find(opt => opt.value === period)?.label || 'সময়কাল নির্বাচন করুন'}</span>
                <ChevronDown size={18} className={`ml-2 transition-transform ${periodDropdownOpen ? 'rotate-180' : ''} ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
              </button>
              {periodDropdownOpen && (
                <div className={`absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto animate-fade-in`}>
                  {periodOptions.map(opt => (
                    <div
                      key={opt.value}
                      className={`px-3 py-2 cursor-pointer select-none transition-all font-bengali rounded-lg flex items-center ${opt.value === period ? (darkMode ? 'bg-green-900/20 text-green-200 font-bold' : 'bg-green-50 text-green-700 font-bold') : (darkMode ? 'text-white hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100')}`}
                      onClick={() => { setValue('period', opt.value, { shouldValidate: true }); setPeriodDropdownOpen(false); }}
                      role="option"
                      aria-selected={opt.value === period}
                      tabIndex={-1}
                    >
                      {opt.icon}{opt.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Duration */}
          {period === 'custom' && (
            <div>
              <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                সময়কাল (দিনে)
              </label>
              <input
                type="number"
                min="1"
                {...register('duration', { min: 1 })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                placeholder="দিনের সংখ্যা লিখুন"
              />
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                শুরুর তারিখ থেকে শেষের তারিখ স্বয়ংক্রিয়ভাবে গণনা হবে
              </p>
            </div>
          )}

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                শুরুর তারিখ *
              </label>
              <div className={`flex items-center rounded-lg border ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'} shadow-sm focus-within:ring-2 focus-within:ring-green-400 focus-within:border-transparent transition-all`}>
                <Calendar size={22} className={`ml-3 mr-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                <ReactDatePicker
                  selected={startDate ? new Date(startDate) : null}
                  onChange={dateObj => {
                    if (dateObj) {
                      const iso = dateObj.toISOString().slice(0, 10);
                      setValue('startDate', iso, { shouldValidate: true });
                    } else {
                      setValue('startDate', '', { shouldValidate: true });
                    }
                  }}
                  dateFormat="yyyy-MM-dd"
                  locale="bn"
                  placeholderText="তারিখ বাছাই করুন"
                  className={`w-full pl-2 pr-3 py-2 rounded-r-lg border-0 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'} focus:ring-0 focus:border-transparent focus:outline-none`}
                  calendarClassName={`${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'} rounded-xl shadow-lg border-0 font-bengali pb-12`}
                  popperPlacement="bottom-start"
                  isClearable
                  renderCustomHeader={(props) => (
                    <DatePickerHeader {...props} darkMode={darkMode} datePickerRef={null} />
                  )}
                  calendarContainer={(props) => (
                    <CustomCalendarContainer
                      {...props}
                      onToday={() => {
                        setValue('startDate', new Date().toISOString().slice(0, 10), { shouldValidate: true });
                      }}
                      onClear={() => setValue('startDate', '', { shouldValidate: true })}
                      darkMode={darkMode}
                    />
                  )}
                  inputReadOnly
                />
              </div>
              {errors.startDate && <span className="text-red-500 text-sm mt-1">{errors.startDate.message}</span>}
            </div>
            <div>
              <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                শেষের তারিখ *
              </label>
              <div className={`flex items-center rounded-lg border ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'} shadow-sm focus-within:ring-2 focus-within:ring-green-400 focus-within:border-transparent transition-all`}>
                <Calendar size={22} className={`ml-3 mr-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                <ReactDatePicker
                  selected={watch('endDate') ? new Date(watch('endDate')) : null}
                  onChange={dateObj => {
                    if (dateObj) {
                      const iso = dateObj.toISOString().slice(0, 10);
                      setValue('endDate', iso, { shouldValidate: true });
                    } else {
                      setValue('endDate', '', { shouldValidate: true });
                    }
                  }}
                  dateFormat="yyyy-MM-dd"
                  locale="bn"
                  placeholderText="তারিখ বাছাই করুন"
                  className={`w-full pl-2 pr-3 py-2 rounded-r-lg border-0 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'} focus:ring-0 focus:border-transparent focus:outline-none`}
                  calendarClassName={`${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'} rounded-xl shadow-lg border-0 font-bengali pb-12`}
                  popperPlacement="bottom-start"
                  isClearable
                  renderCustomHeader={(props) => (
                    <DatePickerHeader {...props} darkMode={darkMode} datePickerRef={null} />
                  )}
                  calendarContainer={(props) => (
                    <CustomCalendarContainer
                      {...props}
                      onToday={() => {
                        setValue('endDate', new Date().toISOString().slice(0, 10), { shouldValidate: true });
                      }}
                      onClear={() => setValue('endDate', '', { shouldValidate: true })}
                      darkMode={darkMode}
                    />
                  )}
                  inputReadOnly
                />
              </div>
              {errors.endDate && <span className="text-red-500 text-sm mt-1">{errors.endDate.message}</span>}
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
                      key={`preview-${categoryName}`}
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
              disabled={selectedCategories.length === 0}
              className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {budget ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
