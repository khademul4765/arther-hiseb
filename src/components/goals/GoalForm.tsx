import React, { useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { X, Target, Calendar, DollarSign, ChevronDown } from 'lucide-react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CalendarDays, CalendarRange, Edit3 } from 'lucide-react';
import { DatePickerHeader, CustomCalendarContainer } from '../common/DatePickerHeader';

interface GoalFormProps {
  onClose: () => void;
  onSubmit: () => void;
  goal?: any;
}

interface FormData {
  name: string;
  targetAmount: number;
  startDate: string;
  deadline: string;
  duration?: number;
  period?: 'weekly' | 'monthly' | 'yearly' | 'custom';
}

export const GoalForm: React.FC<GoalFormProps> = ({
  onClose,
  onSubmit,
  goal
}) => {
  const { addGoal, updateGoal, darkMode } = useStore();
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>({
    defaultValues: goal ? {
      name: goal.name,
      targetAmount: goal.targetAmount,
      startDate: goal.startDate ? goal.startDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      deadline: goal.deadline.toISOString().split('T')[0],
      period: goal.period || 'monthly',
      duration: goal.duration
    } : {
      startDate: new Date().toISOString().split('T')[0],
      deadline: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      period: 'monthly'
    }
  });

  const startDate = watch('startDate');
  const duration = watch('duration');

  // Auto-calculate deadline when duration or start date changes
  useEffect(() => {
    if (startDate && duration && duration > 0) {
      const start = new Date(startDate);
      const deadline = new Date(start.getTime() + duration * 24 * 60 * 60 * 1000);
      setValue('deadline', deadline.toISOString().split('T')[0]);
    }
  }, [startDate, duration, setValue]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Add period state and dropdown logic
  const [period, setPeriod] = React.useState<'weekly' | 'monthly' | 'yearly' | 'custom'>(goal?.period || 'monthly');
  const [periodDropdownOpen, setPeriodDropdownOpen] = React.useState(false);
  const periodOptions = [
    { value: 'weekly', label: 'সাপ্তাহিক', icon: <CalendarDays size={18} className="mr-2" /> },
    { value: 'monthly', label: 'মাসিক', icon: <CalendarRange size={18} className="mr-2" /> },
    { value: 'yearly', label: 'বার্ষিক', icon: <Calendar size={18} className="mr-2" /> },
    { value: 'custom', label: 'কাস্টম (দিন নির্ধারণ করুন)', icon: <Edit3 size={18} className="mr-2" /> },
  ];
  // Sync period with form
  React.useEffect(() => { setValue('period', period); }, [period, setValue]);

  const onFormSubmit = (data: FormData) => {
    const goalData = {
      ...data,
      startDate: new Date(data.startDate),
      deadline: new Date(data.deadline),
      currentAmount: goal?.currentAmount ?? 0,
      isCompleted: goal?.isCompleted ?? false
    };

    if (goal) {
      updateGoal(goal.id, goalData);
    } else {
      addGoal(goalData);
    }

    onSubmit();
  };

  const startDatePickerRef = useRef<any>(null);
  const deadlinePickerRef = useRef<any>(null);

  // Custom input for date picker (matches TransactionForm)
  const DateInput = React.forwardRef<HTMLInputElement, any>(({ value, onClick, placeholder, darkMode }, ref) => (
    <div
      className={`flex items-center w-full rounded-lg border ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'} shadow-sm focus-within:ring-2 focus-within:ring-green-400 focus-within:border-transparent transition-all`}
      tabIndex={0}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <Calendar size={22} className={`ml-3 mr-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
      <input
        ref={ref}
        type="text"
        value={value || ''}
        readOnly
        placeholder={placeholder}
        className={`w-full pl-2 pr-3 py-2 rounded-r-lg border-0 bg-transparent ${darkMode ? 'text-gray-100' : 'text-gray-900'} focus:ring-0 focus:border-transparent focus:outline-none`}
        style={{ cursor: 'pointer' }}
      />
    </div>
  ));

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
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto`}
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
            {goal ? 'লক্ষ্য সম্পাদনা' : 'নতুন লক্ষ্য'}
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
              লক্ষ্য নাম *
            </label>
            <div className="relative">
              <Target size={16} className={`absolute left-3 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <input
                type="text"
                {...register('name', { required: 'লক্ষ্য নাম আবশ্যক' })}
                className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                placeholder="লক্ষ্য নাম লিখুন"
              />
            </div>
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              লক্ষ্যমাত্রা *
            </label>
            <div className="relative">
              <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>৳</span>
              <input
                type="number"
                step="0.01"
                {...register('targetAmount', { required: 'লক্ষ্যমাত্রা আবশ্যক', min: 0.01 })}
                className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                placeholder="০.০০"
              />
            </div>
            {errors.targetAmount && (
              <p className="text-red-500 text-sm mt-1">{errors.targetAmount.message}</p>
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
                      onClick={() => { setPeriod(opt.value as any); setPeriodDropdownOpen(false); }}
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
              <ReactDatePicker
                ref={startDatePickerRef}
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
                customInput={
                  <DateInput
                    darkMode={darkMode}
                    placeholder="তারিখ বাছাই করুন"
                  />
                }
                calendarClassName={`${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'} rounded-xl shadow-lg border-0 font-bengali pb-12`}
                popperPlacement="bottom-start"
                isClearable
                renderCustomHeader={props => (
                  <DatePickerHeader {...props} darkMode={darkMode} datePickerRef={startDatePickerRef} />
                )}
                calendarContainer={props => (
                  <CustomCalendarContainer
                    {...props}
                    onToday={() => {
                      setValue('startDate', new Date().toISOString().slice(0, 10), { shouldValidate: true });
                      if (startDatePickerRef.current && startDatePickerRef.current.setOpen) {
                        startDatePickerRef.current.setOpen(false);
                      }
                    }}
                    onClear={() => {
                      setValue('startDate', '', { shouldValidate: true });
                      if (startDatePickerRef.current && startDatePickerRef.current.setOpen) {
                        startDatePickerRef.current.setOpen(false);
                      }
                    }}
                    darkMode={darkMode}
                  />
                )}
              />
              {errors.startDate && <span className="text-red-500 text-sm mt-1">{errors.startDate.message}</span>}
            </div>
            <div>
              <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                শেষ তারিখ *
              </label>
              <ReactDatePicker
                ref={deadlinePickerRef}
                selected={watch('deadline') ? new Date(watch('deadline')) : null}
                onChange={dateObj => {
                  if (dateObj) {
                    const iso = dateObj.toISOString().slice(0, 10);
                    setValue('deadline', iso, { shouldValidate: true });
                  } else {
                    setValue('deadline', '', { shouldValidate: true });
                  }
                }}
                dateFormat="yyyy-MM-dd"
                locale="bn"
                placeholderText="তারিখ বাছাই করুন"
                customInput={
                  <DateInput
                    darkMode={darkMode}
                    placeholder="তারিখ বাছাই করুন"
                  />
                }
                calendarClassName={`${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'} rounded-xl shadow-lg border-0 font-bengali pb-12`}
                popperPlacement="bottom-start"
                isClearable
                renderCustomHeader={props => (
                  <DatePickerHeader {...props} darkMode={darkMode} datePickerRef={deadlinePickerRef} />
                )}
                calendarContainer={props => (
                  <CustomCalendarContainer
                    {...props}
                    onToday={() => {
                      setValue('deadline', new Date().toISOString().slice(0, 10), { shouldValidate: true });
                      if (deadlinePickerRef.current && deadlinePickerRef.current.setOpen) {
                        deadlinePickerRef.current.setOpen(false);
                      }
                    }}
                    onClear={() => {
                      setValue('deadline', '', { shouldValidate: true });
                      if (deadlinePickerRef.current && deadlinePickerRef.current.setOpen) {
                        deadlinePickerRef.current.setOpen(false);
                      }
                    }}
                    darkMode={darkMode}
                  />
                )}
              />
              {errors.deadline && <span className="text-red-500 text-sm mt-1">{errors.deadline.message}</span>}
            </div>
          </div>

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
              className="flex-1 px-4 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700"
            >
              {goal ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
