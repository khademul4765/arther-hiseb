import React, { useEffect, useState, useRef } from 'react';
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
import { AnalogClockTimePicker } from './AnalogClockTimePicker';
import ReactDOM from 'react-dom';

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
  const datePickerRef = useRef(null);
  const [showClock, setShowClock] = useState(false);
  const timeInputRef = useRef(null);
  const clockModalRef = useRef(null);

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

  const [customYear, setCustomYear] = React.useState('');
  const [showYearInput, setShowYearInput] = React.useState(false);
  const [selectedYear, setSelectedYear] = React.useState<number | 'custom'>(new Date().getFullYear());
  const [yearError, setYearError] = React.useState('');

  // On mount, set customYear to the current year
  React.useEffect(() => {
    setCustomYear(new Date().getFullYear().toString());
  }, []);

  // Remove the always-on input, restore dropdown+custom input pattern
  function DatePickerHeader({ date, changeYear, changeMonth, darkMode }) {
    // Change year range to 2023-2100
    const years = Array.from({ length: 2100 - 2023 + 1 }, (_, i) => 2023 + i);
    const months = [
      "জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"
    ];
    // Add custom year to options if needed
    let yearOptions = years.map(year => ({ value: year.toString(), label: year.toLocaleString('bn-BD').replace(/,/g, '') }));
    if (
      selectedYear !== 'custom' &&
      typeof selectedYear === 'number' &&
      !years.includes(selectedYear)
    ) {
      yearOptions.push({ value: selectedYear.toString(), label: selectedYear.toLocaleString('bn-BD').replace(/,/g, '') });
    }
    yearOptions.push({ value: 'custom', label: 'লিখুন' });
    // Determine what to show as selected
    const currentYear = (showYearInput ? 'custom' : (selectedYear || date.getFullYear())).toString();
    const handleCustomYearConfirm = () => {
      if (customYear && customYear.length === 4 && !isNaN(Number(customYear)) && Number(customYear) > 1900 && Number(customYear) < 3000) {
        setShowYearInput(false);
        setSelectedYear(Number(customYear));
        changeYear(Number(customYear));
        setYearError('');
        // Force calendar to show correct year
        if (datePickerRef.current && datePickerRef.current.setPreSelection) {
          const newDate = new Date(Number(customYear), date.getMonth(), 1);
          datePickerRef.current.setPreSelection(newDate);
        }
      } else {
        setYearError('সঠিক বছর লিখুন');
      }
    };
    return (
      <div
        className="flex items-center justify-center gap-2 py-3 rounded-t-xl shadow-sm"
        style={{ background: darkMode ? '#18181b' : '#FCFFFD' }}
      >
        <div className="w-[90px]">
          {!showYearInput ? (
            <CategorySelect
              value={currentYear}
              onChange={val => {
                if (val === 'custom') {
                  setShowYearInput(true);
                  setTimeout(() => {
                    const input = document.getElementById('custom-year-input');
                    if (input) input.focus();
                  }, 50);
                } else {
                  setShowYearInput(false);
                  setSelectedYear(Number(val));
                  changeYear(Number(val));
                  setYearError('');
                  // Force calendar to show correct year
                  if (datePickerRef.current && datePickerRef.current.setPreSelection) {
                    const newDate = new Date(Number(val), date.getMonth(), 1);
                    datePickerRef.current.setPreSelection(newDate);
                  }
                }
              }}
              dropdownProps={{ onMouseDown: e => e.stopPropagation(), onPointerDown: e => e.stopPropagation() }}
              options={yearOptions}
              placeholder="বছর"
              disabled={false}
              showSearch={false}
            />
          ) : (
            <div className="relative">
              <input
                id="custom-year-input"
                type="number"
                className="w-full px-3 py-2 rounded-lg border text-center text-base font-bengali focus:ring-2 focus:ring-green-400 focus:border-green-400 shadow transition bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none"
                placeholder="লিখুন"
                value={customYear}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setCustomYear(val);
                  setYearError('');
                }}
                onBlur={handleCustomYearConfirm}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCustomYearConfirm();
                }}
                onMouseDown={e => e.stopPropagation()}
                onPointerDown={e => e.stopPropagation()}
              />
              {yearError && <div className="text-red-500 text-xs mt-1 text-center">{yearError}</div>}
            </div>
          )}
        </div>
        <div className="w-[110px]">
          <CategorySelect
            value={date.getMonth().toString()}
            onChange={val => {
              changeMonth(Number(val));
              // Force calendar to show correct month
              if (datePickerRef.current && datePickerRef.current.setPreSelection) {
                const newDate = new Date(date.getFullYear(), Number(val), 1);
                datePickerRef.current.setPreSelection(newDate);
              }
            }}
            dropdownProps={{ onMouseDown: e => e.stopPropagation(), onPointerDown: e => e.stopPropagation() }}
            options={months.map((month, idx) => ({ value: idx.toString(), label: month }))}
            placeholder="মাস"
            disabled={false}
            showSearch={false}
          />
        </div>
      </div>
    );
  }

  const handleClockClose = (e: MouseEvent) => {
    if (
      timeInputRef.current &&
      !timeInputRef.current.contains(e.target) &&
      clockModalRef.current &&
      !clockModalRef.current.contains(e.target)
    ) {
      setShowClock(false);
    }
  };
  React.useEffect(() => {
    if (showClock) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('mousedown', handleClockClose);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('mousedown', handleClockClose);
      };
    }
  }, [showClock]);

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
          <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-red-900/40' : 'hover:bg-red-100'}`}>
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
                className={`w-full pl-8 pr-3 py-3 md:py-2 rounded-lg border text-lg md:text-base ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-green-500 focus:border-transparent focus:outline-none`}
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
              <div className={`flex items-center rounded-lg border ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'} shadow-sm focus-within:ring-2 focus-within:ring-green-400 focus-within:border-transparent transition-all`}>
                <CalendarIcon
                  size={22}
                  className={`ml-3 mr-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`}
                />
                <ReactDatePicker
                  ref={datePickerRef}
                  selected={date ? new Date(date) : null}
                  onChange={dateObj => {
                    if (dateObj) {
                      const iso = dateObj.toISOString().slice(0, 10);
                      setDate(iso);
                      setValue('date', iso, { shouldValidate: true });
                    } else {
                      setDate('');
                      setValue('date', '', { shouldValidate: true });
                    }
                  }}
                  dateFormat="yyyy-MM-dd"
                  locale={bn}
                  placeholderText="তারিখ বাছাই করুন"
                  className={`w-full pl-2 pr-3 py-2 rounded-r-lg border-0 ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'} focus:ring-0 focus:border-transparent focus:outline-none`}
                  calendarClassName={`${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'} rounded-xl shadow-lg border-0 font-bengali pb-12`}
                  popperPlacement="bottom-start"
                  isClearable
                  renderCustomHeader={(props) => (
                    <DatePickerHeader {...props} darkMode={darkMode} />
                  )}
                  calendarContainer={(props) => (
                    <CustomCalendarContainer
                      {...props}
                      onToday={() => {
                        setDate(new Date().toISOString().slice(0, 10));
                        if (datePickerRef.current && datePickerRef.current.setOpen) {
                          datePickerRef.current.setOpen(false);
                        }
                      }}
                      onClear={() => setDate('')}
                      darkMode={darkMode}
                    />
                  )}
                  inputReadOnly
                />
              </div>
              {errors.date && <span className="text-red-500 text-sm mt-1">{errors.date.message}</span>}
            </div>
            <div>
              <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>সময় *</label>
              <div className={`flex items-center rounded-lg border relative ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'} shadow-sm focus-within:ring-2 focus-within:ring-green-400 focus-within:border-transparent transition-all`}>
                <Clock size={22} className={`ml-3 mr-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                <input
                  ref={timeInputRef}
                  type="text"
                  value={(() => {
                    const t = watch('time');
                    if (!t) return '';
                    const [h, m] = t.split(':').map(Number);
                    let hour = h % 12 || 12;
                    const ampm = h >= 12 ? 'PM' : 'AM';
                    return `${hour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
                  })()}
                  readOnly
                  onClick={() => setShowClock(true)}
                  className={`w-full pl-2 pr-3 py-2 rounded-r-lg border-0 cursor-pointer ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'} focus:ring-0 focus:border-transparent focus:outline-none`}
                  placeholder="সময় নির্বাচন করুন"
                />
                {showClock && ReactDOM.createPortal(
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(0,0,0,0.35)' }} />
                    <div
                      ref={clockModalRef}
                      style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999, boxShadow: '0 8px 32px #0006', borderRadius: 20, background: 'transparent' }}
                    >
                      <AnalogClockTimePicker
                        value={watch('time')}
                        onChange={val => {
                          setValue('time', val, { shouldValidate: true });
                          setShowClock(false);
                        }}
                        darkMode={darkMode}
                        onCancel={() => setShowClock(false)}
                      />
                    </div>
                  </>,
                  document.body
                )}
              </div>
              {errors.time && <span className="text-red-500 text-sm mt-1">{errors.time.message}</span>}
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
                className={`w-full pl-10 pr-3 py-3 md:py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-green-500 focus:border-transparent focus:outline-none`}
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
                className={`w-full pl-10 pr-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-green-500 focus:border-transparent focus:outline-none`}
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
                className={`w-full pl-10 pr-3 py-3 md:py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-green-500 focus:border-transparent focus:outline-none`}
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
