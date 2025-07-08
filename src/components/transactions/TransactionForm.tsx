import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { X, Users, Calendar as CalendarIcon, DollarSign, Phone, MapPin, FileText, Clock, Tag, User, ChevronDown, Wallet, CreditCard, Smartphone, Building } from 'lucide-react';
import { Transaction } from '../../types';
import { CategorySelect } from '../common/CategorySelect';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface TransactionFormProps {
  onClose: () => void;
  onSubmit: () => void;
  transaction?: Transaction;
  defaultType?: 'income' | 'expense';
}

interface FormData {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  accountId: string;
  date: string;
  time: string;
  person: string;
  note: string;
  tags: string;
}

const RECENT_DATES_KEY = 'recent-transaction-dates';
function getRecentDates() {
  const data = localStorage.getItem(RECENT_DATES_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}
function addRecentDate(dateStr: string) {
  let dates = getRecentDates();
  dates = dates.filter(d => d !== dateStr);
  dates.unshift(dateStr);
  if (dates.length > 5) dates = dates.slice(0, 5);
  localStorage.setItem(RECENT_DATES_KEY, JSON.stringify(dates));
}
const getTodayString = () => new Date().toISOString().split('T')[0];

// Add helper for custom calendar footer
function CalendarFooter({ onToday, onClear, darkMode }) {
  return (
    <div className="flex justify-between px-3 pb-2 pt-1 w-full">
      <button
        type="button"
        onClick={onClear}
        className={`px-3 py-1 rounded-lg font-medium text-sm ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} transition`}
      >মুছুন</button>
      <button
        type="button"
        onClick={onToday}
        className={`px-3 py-1 rounded-lg font-medium text-sm ${darkMode ? 'bg-green-700 text-white hover:bg-green-600' : 'bg-green-500 text-white hover:bg-green-600'} transition`}
      >আজ</button>
    </div>
  );
}

// Add a custom calendar container for react-datepicker
function CustomCalendarContainer({ className, children, onToday, onClear, darkMode }) {
  return (
    <div className={className + ' relative'}>
      {children}
      <div className="absolute bottom-0 left-0 w-full flex pointer-events-none">
        <div className="pointer-events-auto w-full">
          <CalendarFooter onToday={onToday} onClear={onClear} darkMode={darkMode} />
        </div>
      </div>
    </div>
  );
}

// Custom dropdown for calendar (like CategorySelect)
function CustomDropdown({ value, options, onChange, width = 110, darkMode }) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const ref = React.useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => { if (!open) setHighlighted(0); }, [open]);

  return (
    <div className="relative" ref={ref} style={{ minWidth: width }}>
      <button
        type="button"
        className={`w-full px-3 py-2 rounded-lg border text-left flex items-center justify-between focus:ring-2 focus:ring-green-500 focus:border-transparent font-bengali shadow transition ${darkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-white text-green-700 border-gray-300'}`}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        tabIndex={0}
      >
        <span>{options.find(opt => opt.value === value)?.label}</span>
        <ChevronDown size={18} className={`ml-2 transition-transform ${open ? 'rotate-180' : ''} ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
      </button>
      {open && (
        <div className={`absolute z-50 mt-1 w-full min-w-[${width}px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto animate-fade-in`}> 
          {options.map((opt, i) => (
            <div
              key={opt.value}
              className={`px-3 py-2 cursor-pointer select-none transition-all font-bengali ${i === highlighted ? 'bg-green-100 dark:bg-green-900/30' : ''} ${opt.value === value ? 'font-bold' : ''}`}
              style={{ borderRadius: '0.95rem', margin: '0.18rem 0' }}
              onMouseEnter={() => setHighlighted(i)}
              onMouseDown={() => { onChange(opt.value); setOpen(false); }}
              role="option"
              aria-selected={opt.value === value}
              tabIndex={-1}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// AccountSelect: visually matches CategorySelect, but for accounts
function AccountSelect({ value, onChange, options, placeholder = 'অ্যাকাউন্ট নির্বাচন করুন', disabled, darkMode }) {
  return (
    <div className="inline-block relative w-full">
      <CategorySelect
        value={value}
        onChange={onChange}
        options={options.map(acc => ({
          value: acc.id,
          label: `${acc.name} - ${acc.balance.toLocaleString()} ৳`,
          icon: acc.icon
        }))}
        placeholder={placeholder}
        disabled={disabled}
        showSearch={false}
      />
    </div>
  );
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onClose,
  onSubmit,
  transaction,
  defaultType = 'expense'
}) => {
  const { addTransaction, updateTransaction, categories, accounts, darkMode } = useStore();
  const defaultCashAccount = accounts.find(a => a.type === 'cash' && a.isDefault);

  const [recentDates, setRecentDates] = useState(getRecentDates());
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  // Local state for date value to guarantee correct behavior
  const [localDate, setLocalDate] = useState<string>(transaction ? transaction.date.toISOString().split('T')[0] : getTodayString());
  const [date, setDate] = useState<string>(transaction ? transaction.date.toISOString().split('T')[0] : getTodayString());

  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<FormData>({
    defaultValues: transaction ? {
      amount: transaction.amount,
      type: transaction.type as 'income' | 'expense',
      category: transaction.category,
      accountId: transaction.accountId,
      date: transaction.date.toISOString().split('T')[0],
      time: transaction.time,
      person: transaction.person || '',
      note: transaction.note,
      tags: transaction.tags.join(', ')
    } : {
      type: defaultType,
      date: getTodayString(),
      time: new Date().toTimeString().slice(0, 5),
      accountId: defaultCashAccount?.id || accounts[0]?.id || ''
    }
  });

  // Always reset localDate to today for new transactions
  useEffect(() => {
    if (!transaction) {
      setLocalDate(getTodayString());
      reset({
        type: defaultType,
        date: getTodayString(),
        time: new Date().toTimeString().slice(0, 5),
        accountId: defaultCashAccount?.id || accounts[0]?.id || '',
        amount: undefined,
        category: '',
        person: '',
        note: '',
        tags: ''
      });
    } else {
      setLocalDate(transaction.date.toISOString().split('T')[0]);
    }
    setRecentDates(getRecentDates());
  }, [transaction, reset, defaultType, defaultCashAccount, accounts, onClose]);

  // Keep react-hook-form in sync with localDate
  useEffect(() => {
    setValue('date', localDate, { shouldValidate: true, shouldDirty: true });
  }, [localDate, setValue]);

  const selectedType = watch('type');
  const selectedAccountId = watch('accountId');

  const onFormSubmit = (data: FormData) => {
    addRecentDate(data.date);
    const transactionData = {
      ...data,
      date: new Date(data.date),
      tags: data.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
    };
    if (transaction) {
      updateTransaction(transaction.id, transactionData);
    } else {
      addTransaction(transactionData);
    }
    onSubmit();
  };

  const expenseCategories = Array.from(new Map(categories.filter(c => c.type === 'expense').map(c => [c.name, c])).values());
  const incomeCategories = Array.from(new Map(categories.filter(c => c.type === 'income').map(c => [c.name, c])).values());
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <Wallet size={18} className="text-green-600" />;
      case 'bank':
        return <Building size={18} className="text-blue-600" />;
      case 'mfs':
        return <Smartphone size={18} className="text-red-500" />;
      case 'credit':
        return <CreditCard size={18} className="text-yellow-600" />;
      default:
        return <Wallet size={18} className="text-gray-500" />;
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

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
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className={`text-lg md:text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{transaction ? 'লেনদেন সম্পাদনা' : 'নতুন লেনদেন'}</h2>
          <button onClick={onClose} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
            <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
          </button>
        </div>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Amount */}
          <div>
            <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>পরিমাণ *</label>
            <div className="relative">
              <span className={`absolute left-3 top-3 md:top-2.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>৳</span>
              <input
                type="number"
                step="0.01"
                {...register('amount', { required: 'পরিমাণ আবশ্যক', min: 0.01 })}
                className={`w-full pl-8 pr-3 py-3 md:py-2 rounded-lg border text-lg md:text-base ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                placeholder="০.০০"
              />
            </div>
            {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>}
          </div>

          {/* Type */}
          <div>
            <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>ধরন *</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-colors ${selectedType === 'expense' ? darkMode ? 'border-red-500 bg-red-900/20' : 'border-red-500 bg-red-50' : darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'}`}>
                <input type="radio" value="expense" {...register('type', { required: 'ধরন নির্বাচন করুন' })} className="sr-only" />
                <span className={`font-medium ${selectedType === 'expense' ? 'text-red-600' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}>খরচ</span>
              </label>
              <label className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-colors ${selectedType === 'income' ? darkMode ? 'border-green-500 bg-green-900/20' : 'border-green-500 bg-green-50' : darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'}`}>
                <input type="radio" value="income" {...register('type', { required: 'ধরন নির্বাচন করুন' })} className="sr-only" />
                <span className={`font-medium ${selectedType === 'income' ? 'text-green-600' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}>আয়</span>
              </label>
            </div>
          </div>

          {/* Account */}
          <div>
            <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>অ্যাকাউন্ট *</label>
            <AccountSelect
              value={watch('accountId')}
              onChange={val => setValue('accountId', val, { shouldValidate: true })}
              options={accounts.map(acc => ({ ...acc, icon: getAccountIcon(acc.type) }))}
              placeholder="অ্যাকাউন্ট নির্বাচন করুন"
              disabled={false}
              darkMode={darkMode}
            />
            {errors.accountId && <p className="text-red-500 text-sm mt-1">{errors.accountId.message}</p>}
            {selectedAccount && (
              <div className={`mt-2 p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center space-x-2">
                  {getAccountIcon(selectedAccount.type)}
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>বর্তমান ব্যালেন্স: {selectedAccount.balance.toLocaleString()} ৳</span>
                </div>
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>ক্যাটেগরি *</label>
            {selectedType !== 'transfer' && (
              <CategorySelect
                value={watch('category')}
                onChange={val => setValue('category', val, { shouldValidate: true })}
                options={(selectedType === 'expense' ? expenseCategories : incomeCategories).map(category => ({ value: category.name, label: `${category.icon} ${category.name}` }))}
                placeholder="ক্যাটেগরি নির্বাচন করুন"
                disabled={false}
              />
            )}
            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>তারিখ *</label>
              <div className="relative flex items-center">
                <CalendarIcon size={18} className={`absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                <ReactDatePicker
                  selected={date ? new Date(date) : null}
                  onChange={dateObj => setDate(dateObj ? dateObj.toISOString().slice(0, 10) : '')}
                  dateFormat="yyyy-MM-dd"
                  locale={bn}
                  placeholderText="তারিখ বাছাই করুন"
                  className={`w-full pl-10 pr-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} shadow-sm focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all`}
                  calendarClassName={`${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'} rounded-xl shadow-lg border-0 font-bengali pb-12`}
                  popperPlacement="bottom-start"
                  isClearable
                  renderCustomHeader={({ date, changeYear, changeMonth }) => {
                    const years = Array.from({ length: 21 }, (_, i) => 2015 + i);
                    const months = [
                      "জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"
                    ];
                    return (
                      <div
                        className="flex items-center justify-center gap-2 py-3 rounded-t-xl shadow-sm"
                        style={{ background: darkMode ? '#18181b' : '#FCFFFD' }}
                      >
                        <CustomDropdown
                          value={date.getFullYear()}
                          options={years.map(year => ({ value: year, label: year.toLocaleString('bn-BD').replace(/,/g, '') }))}
                          onChange={val => changeYear(Number(val))}
                          width={90}
                          darkMode={darkMode}
                        />
                        <CustomDropdown
                          value={date.getMonth()}
                          options={months.map((month, idx) => ({ value: idx, label: month }))}
                          onChange={val => changeMonth(Number(val))}
                          width={110}
                          darkMode={darkMode}
                        />
                      </div>
                    );
                  }}
                  calendarContainer={(props) => (
                    <CustomCalendarContainer
                      {...props}
                      onToday={() => setDate(new Date().toISOString().slice(0, 10))}
                      onClear={() => setDate('')}
                      darkMode={darkMode}
                    />
                  )}
                />
              </div>
              {errors.date && <span className="text-red-500 text-sm mt-1">{errors.date.message}</span>}
            </div>
            <div>
              <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>সময় *</label>
              <div className="relative">
                <Clock size={16} className={`absolute left-3 top-3 md:top-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                <input
                  type="time"
                  {...register('time', { required: 'সময় আবশ্যক' })}
                  className={`w-full pl-10 pr-3 py-3 md:py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                />
              </div>
            </div>
          </div>

          {/* Person */}
          <div>
            <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>ব্যক্তি / প্রতিষ্ঠান</label>
            <div className="relative">
              <Users size={16} className={`absolute left-3 top-3 md:top-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <input
                type="text"
                {...register('person')}
                className={`w-full pl-10 pr-3 py-3 md:py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                placeholder="ব্যক্তি/ প্রতিষ্ঠানের নাম"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>নোট</label>
            <div className="relative">
              <FileText size={16} className={`absolute left-3 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <textarea
                {...register('note')}
                rows={3}
                className={`w-full pl-10 pr-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                placeholder="বিস্তারিত লিখুন..."
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>ট্যাগ</label>
            <div className="relative">
              <Tag size={16} className={`absolute left-3 top-3 md:top-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <input
                type="text"
                {...register('tags')}
                className={`w-full pl-10 pr-3 py-3 md:py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                placeholder="ট্যাগসমূহ কমা দিয়ে আলাদা করুন"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-3 md:py-2 rounded-lg border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 md:py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium"
            >
              {transaction ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
