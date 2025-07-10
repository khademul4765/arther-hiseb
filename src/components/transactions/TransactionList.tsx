import React, { useState, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { TransactionForm } from './TransactionForm';
import { TransactionItem } from './TransactionItem';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, RotateCcw, Calendar as CalendarIcon } from 'lucide-react';
import { Transaction } from '../../types/index';
import { CategorySelect } from '../common/CategorySelect';
import { ThemedCheckbox } from '../common/ThemedCheckbox';
import { format } from 'date-fns';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { bn } from 'date-fns/locale/bn';
import { ReactNode } from 'react';

interface DatePickerHeaderProps {
  date: Date;
  changeYear: (year: number) => void;
  changeMonth: (month: number) => void;
  darkMode: boolean;
}

function DatePickerHeader({ date, changeYear, changeMonth, darkMode }: DatePickerHeaderProps) {
  const years = Array.from({ length: 2100 - 2023 + 1 }, (_, i) => 2023 + i);
  const months = [
    "জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"
  ];
  return (
    <div
      className={`flex items-center justify-center gap-2 py-3 rounded-t-xl shadow-sm ${
        darkMode ? 'bg-gray-800 border-b border-gray-700' : 'bg-green-50 border-b border-green-200'
      }`}
    >
      <select
        value={date.getFullYear()}
        onChange={e => changeYear(Number(e.target.value))}
        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
          darkMode 
            ? 'bg-gray-700 border-gray-600 text-white hover:border-gray-500 focus:border-green-400 focus:ring-2 focus:ring-green-500/20' 
            : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
        } focus:outline-none`}
      >
        {years.map(year => (
          <option key={year} value={year}>{year.toLocaleString('bn-BD').replace(/,/g, '')}</option>
        ))}
      </select>
      <select
        value={date.getMonth()}
        onChange={e => changeMonth(Number(e.target.value))}
        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
          darkMode 
            ? 'bg-gray-700 border-gray-600 text-white hover:border-gray-500 focus:border-green-400 focus:ring-2 focus:ring-green-500/20' 
            : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
        } focus:outline-none`}
      >
        {months.map((month, idx) => (
          <option key={month} value={idx}>{month}</option>
        ))}
      </select>
    </div>
  );
}

interface CustomCalendarContainerProps {
  className?: string;
  children: ReactNode;
  onToday: () => void;
  onClear: () => void;
  darkMode: boolean;
}

function CustomCalendarContainer({ className = '', children, onToday, onClear, darkMode }: CustomCalendarContainerProps) {
  return (
    <div className={`${className} relative`}>
      {children}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white to-transparent dark:from-gray-900 dark:to-transparent pt-8 pb-2">
        <div className="flex justify-between px-3">
          <button
            type="button"
            onClick={onClear}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              darkMode 
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 hover:shadow-md' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-md'
            }`}
          >
            মুছুন
          </button>
          <button
            type="button"
            onClick={onToday}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              darkMode 
                ? 'bg-green-700 text-white hover:bg-green-600 hover:shadow-md' 
                : 'bg-green-500 text-white hover:bg-green-600 hover:shadow-md'
            }`}
          >
            আজ
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper for Bengali type label
function getTypeLabel(type: 'income' | 'expense' | 'transfer') {
  switch (type) {
    case 'income': return 'আয়';
    case 'expense': return 'খরচ';
    case 'transfer':
    default: return 'ট্রান্সফার';
  }
}
// Type guard for transfer
function isTransfer(t: Transaction): t is Transaction & { type: 'transfer' } {
  return t.type === 'transfer';
}
// Helper for category label
function getCategoryLabel(transaction: Transaction) {
  const t = transaction as any;
  // @ts-ignore
  if (t.type === 'transfer') {
    return getTypeLabel(t.type);
  }
  return t.category;
}

export const TransactionList: React.FC = () => {
  const { transactions, categories, darkMode, deleteTransaction } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; action?: () => void } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string[] | null>(null);
  const undoTimeout = useRef<NodeJS.Timeout | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // Refs for date pickers
  const startDatePickerRef = useRef<any>(null);
  const endDatePickerRef = useRef<any>(null);

  // Filter transactions by date range
  const filteredTransactions = transactions.filter(transaction => {
    const t = transaction as any;
    const matchesSearch = t.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getCategoryLabel(t).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || getCategoryLabel(t) === filterCategory;
    const matchesType = !filterType || t.type === filterType;
    
    // Date range filtering
    const transactionDate = new Date(transaction.date);
    const startDate = filterStartDate ? new Date(filterStartDate) : null;
    const endDate = filterEndDate ? new Date(filterEndDate) : null;
    
    if (startDate && transactionDate < startDate) return false;
    if (endDate && transactionDate > endDate) return false;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA !== dateB) {
      return dateB - dateA; // Most recent date first
    }
    // If dates are equal, compare time (assuming HH:mm format)
    function parseTime(t?: string) {
      if (!t || !/^\d{2}:\d{2}$/.test(t)) return 0;
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    }
    const timeA = parseTime(a.time);
    const timeB = parseTime(b.time);
    return timeB - timeA; // Most recent time first
  });

  // Group transactions by date and sort within each group
  const groupedTransactions: { [date: string]: Transaction[] } = {};
  sortedTransactions.forEach((transaction) => {
    const dateKey = new Date(transaction.date).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
    if (!groupedTransactions[dateKey]) groupedTransactions[dateKey] = [];
    groupedTransactions[dateKey].push(transaction);
  });

  // Sort transactions within each date group by time (newest first)
  Object.keys(groupedTransactions).forEach(dateKey => {
    groupedTransactions[dateKey].sort((a, b) => {
      function parseTime(t?: string) {
        if (!t || !/^\d{2}:\d{2}$/.test(t)) return 0;
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      }
      const timeA = parseTime(a.time);
      const timeB = parseTime(b.time);
      return timeB - timeA; // Most recent time first
    });
  });

  // Sort date groups by most recent date first
  const sortedDateKeys = Object.keys(groupedTransactions).sort((a, b) => {
    const dateA = new Date(a.split(' ')[2] + '-' + getMonthNumber(a.split(' ')[1]) + '-' + a.split(' ')[0]);
    const dateB = new Date(b.split(' ')[2] + '-' + getMonthNumber(b.split(' ')[1]) + '-' + b.split(' ')[0]);
    return dateB.getTime() - dateA.getTime(); // Most recent date first
  });

  // Helper function to convert Bengali month names to numbers
  function getMonthNumber(monthName: string): string {
    const monthMap: { [key: string]: string } = {
      'জানুয়ারি': '01', 'ফেব্রুয়ারি': '02', 'মার্চ': '03', 'এপ্রিল': '04',
      'মে': '05', 'জুন': '06', 'জুলাই': '07', 'আগস্ট': '08',
      'সেপ্টেম্বর': '09', 'অক্টোবর': '10', 'নভেম্বর': '11', 'ডিসেম্বর': '12'
    };
    return monthMap[monthName] || '01';
  }

  const handleSelect = (id: string) => {
    setSelectedTransactions((prev) => prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]);
  };
  const handleSelectAll = (ids: string[]) => {
    setSelectedTransactions(ids);
  };
  const handleDeselectAll = () => {
    setSelectedTransactions([]);
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
  const handleDelete = () => {
    if (selectedTransactions.length === 0) return;
    if (!window.confirm('নির্বাচিত লেনদেনগুলো মুছে ফেলতে চান?')) return;
    setPendingDelete(selectedTransactions);
    setToast({
      message: `লেনদেন মুছে ফেলা হয়েছে (${selectedTransactions.length})`,
      action: handleUndo
    });
    // Start undo timer
    if (undoTimeout.current) clearTimeout(undoTimeout.current);
    undoTimeout.current = setTimeout(() => {
      finalizeDelete(selectedTransactions);
      setToast(null);
      setPendingDelete(null);
    }, 5000);
    setSelectedTransactions([]);
  };

  const finalizeDelete = (ids: string[]) => {
    ids.forEach(id => deleteTransaction(id));
  };

  const handleUndo = () => {
    if (undoTimeout.current) clearTimeout(undoTimeout.current);
    setToast(null);
    setPendingDelete(null);
  };
  const totalSelectedAmount = sortedTransactions.filter(t => selectedTransactions.includes(t.id)).reduce((sum, t) => {
    switch (t.type) {
      case 'expense':
        return sum - t.amount;
      case 'income':
        return sum + t.amount;
      default:
        return sum;
    }
  }, 0);

  function handlePrintTransactions() {
    // TODO: Implement transaction print/export logic
    alert('Print/export feature coming soon!');
  }

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} tracking-wide`}>
            লেনদেন
          </h1>
          <div className={`w-20 h-1 ${darkMode ? 'bg-green-500' : 'bg-green-600'} rounded-full mt-2`}></div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(true)}
          className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl flex items-center space-x-2 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Plus size={20} />
          <span className="text-base">নতুন লেনদেন যোগ করুন</span>
        </motion.button>
      </motion.div>

      {/* Search and Filter */}
      {/* Mobile Filter Toggle Button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setShowMobileFilters && setShowMobileFilters((prev: boolean) => !prev)}
          className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 flex items-center justify-center gap-3 font-medium text-base ${
            darkMode
              ? 'border-green-500 text-green-400 hover:bg-green-500 hover:text-white hover:border-green-400 shadow-lg hover:shadow-green-500/25'
              : 'border-green-500 text-green-600 hover:bg-green-500 hover:text-white hover:border-green-600 shadow-lg hover:shadow-green-500/25'
          }`}
        >
          <Filter size={20} className={`transition-transform duration-300`} />
          {showMobileFilters ? 'ফিল্টার বন্ধ করুন' : 'ফিল্টার করুন'}
        </button>
      </div>
      {/* Enhanced Filters */}
      <div className={`bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 mb-6 border border-green-200 dark:border-gray-600 ${typeof showMobileFilters === 'undefined' || showMobileFilters ? 'block' : 'hidden lg:block'}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            <Filter size={18} className="inline-block mr-1 -mt-0.5" />
            ফিল্টার অপশন
          </h3>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterCategory('');
              setFilterType('');
              setFilterStartDate('');
              setFilterEndDate('');
            }}
            className={`text-sm px-3 py-1 rounded-full border transition-all flex items-center gap-1 ${
              darkMode
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500'
                : 'border-green-400 text-green-600 hover:bg-green-100 hover:border-green-500'
            }`}
          >
            <RotateCcw size={14} className="inline" />
            রিসেট
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          {/* Search Input */}
          <div className="flex flex-col h-[80px]">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-bengali`}>
              🔍 অনুসন্ধান
            </label>
            <div className="relative flex items-center flex-1">
              <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
              <input
                type="text"
                placeholder="অনুসন্ধান করুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full h-11 pl-10 pr-4 py-2 rounded-lg border text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all placeholder:text-gray-400 font-bengali ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white hover:border-gray-500 focus:border-green-400'
                    : 'bg-white border-green-300 text-gray-900 hover:border-gray-400 focus:border-green-500'
                }`}
              />
            </div>
          </div>
          {/* Type Select */}
          <div className="flex flex-col h-[80px]">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-bengali`}>💰 ধরন</label>
            <div className="flex-1">
              <CategorySelect
                value={filterType}
                onChange={setFilterType}
                options={[
                  { value: '', label: '📊 সব ধরনের' },
                  { value: 'income', label: '📈 আয়' },
                  { value: 'expense', label: '📉 খরচ' },
                  { value: 'transfer', label: '🔄 ট্রান্সফার' }
                ]}
                placeholder="সব ধরন"
                disabled={false}
                showSearch={false}
              />
            </div>
          </div>
          {/* Category Select */}
          <div className="flex flex-col h-[80px]">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-bengali`}>🏷️ ক্যাটেগরি</label>
            <div className="flex-1">
              <CategorySelect
                value={filterCategory}
                onChange={setFilterCategory}
                options={categories
                  .filter(cat => cat.name !== 'ট্রান্সফার')
                  .map(cat => ({ value: cat.name, label: `${cat.icon} ${cat.name}` }))}
                placeholder="সব ক্যাটেগরি"
                disabled={false}
                showSearch={false}
              />
            </div>
          </div>
          {/* Start Date Picker */}
          <div className="flex flex-col h-[80px]">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-bengali`}>📅 শুরুর তারিখ</label>
            <div className="flex-1">
              <ReactDatePicker
                ref={startDatePickerRef}
                selected={filterStartDate ? new Date(filterStartDate) : null}
                onChange={date => setFilterStartDate(date ? date.toISOString().slice(0, 10) : '')}
                dateFormat="yyyy-MM-dd"
                locale={bn}
                placeholderText="তারিখ বাছাই করুন"
                customInput={
                  <div className={`w-full h-11 px-3 py-2.5 rounded-lg border text-sm transition-all cursor-pointer flex items-center gap-2 font-bengali ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white hover:border-gray-500 focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-500/20'
                      : 'bg-white border-green-300 text-gray-900 hover:border-gray-400 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/20'
                  } focus-within:outline-none`}>
                    <CalendarIcon size={18} className={darkMode ? 'text-green-400' : 'text-green-600'} />
                    <input
                      type="text"
                      value={filterStartDate || ''}
                      className="w-full bg-transparent border-0 outline-none cursor-pointer placeholder-gray-400"
                      placeholder="তারিখ বাছাই করুন"
                      readOnly
                    />
                  </div>
                }
                calendarClassName={`${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'} rounded-xl shadow-xl border-0 font-bengali pb-16`}
                popperPlacement="bottom-start"
                isClearable
                showPopperArrow={false}
                renderCustomHeader={props => (
                  <DatePickerHeader {...props} darkMode={darkMode} />
                )}
                calendarContainer={props => (
                  <CustomCalendarContainer
                    {...props}
                    onToday={() => {
                      setFilterStartDate(new Date().toISOString().slice(0, 10));
                      if (startDatePickerRef.current) {
                        startDatePickerRef.current.setOpen(false);
                      }
                    }}
                    onClear={() => {
                      setFilterStartDate('');
                      if (startDatePickerRef.current) {
                        startDatePickerRef.current.setOpen(false);
                      }
                    }}
                    darkMode={darkMode}
                  />
                )}
              />
            </div>
          </div>
          {/* End Date Picker */}
          <div className="flex flex-col h-[80px]">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-bengali`}>📅 শেষের তারিখ</label>
            <div className="flex-1">
              <ReactDatePicker
                ref={endDatePickerRef}
                selected={filterEndDate ? new Date(filterEndDate) : null}
                onChange={date => setFilterEndDate(date ? date.toISOString().slice(0, 10) : '')}
                dateFormat="yyyy-MM-dd"
                locale={bn}
                placeholderText="তারিখ বাছাই করুন"
                customInput={
                  <div className={`w-full h-11 px-3 py-2.5 rounded-lg border text-sm transition-all cursor-pointer flex items-center gap-2 font-bengali ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white hover:border-gray-500 focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-500/20'
                      : 'bg-white border-green-300 text-gray-900 hover:border-gray-400 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/20'
                  } focus-within:outline-none`}>
                    <CalendarIcon size={18} className={darkMode ? 'text-green-400' : 'text-green-600'} />
                    <input
                      type="text"
                      value={filterEndDate || ''}
                      className="w-full bg-transparent border-0 outline-none cursor-pointer placeholder-gray-400"
                      placeholder="তারিখ বাছাই করুন"
                      readOnly
                    />
                  </div>
                }
                calendarClassName={`${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'} rounded-xl shadow-xl border-0 font-bengali pb-16`}
                popperPlacement="bottom-start"
                isClearable
                showPopperArrow={false}
                renderCustomHeader={props => (
                  <DatePickerHeader {...props} darkMode={darkMode} />
                )}
                calendarContainer={props => (
                  <CustomCalendarContainer
                    {...props}
                    onToday={() => {
                      setFilterEndDate(new Date().toISOString().slice(0, 10));
                      if (endDatePickerRef.current) {
                        endDatePickerRef.current.setOpen(false);
                      }
                    }}
                    onClear={() => {
                      setFilterEndDate('');
                      if (endDatePickerRef.current) {
                        endDatePickerRef.current.setOpen(false);
                      }
                    }}
                    darkMode={darkMode}
                  />
                )}
              />
            </div>
          </div>
          {/* Print/Export Button */}
          <div className="flex flex-col h-[80px]">
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-bengali`}>📄 এক্সপোর্ট</label>
            <div className="flex-1">
              <button
                onClick={handlePrintTransactions}
                className={`w-full h-11 px-4 py-2.5 rounded-lg border transition-all duration-200 font-bengali flex items-center justify-center gap-2 ${
                  darkMode
                    ? 'border-green-500 text-green-400 hover:bg-green-500 hover:text-white hover:border-green-400'
                    : 'border-green-500 text-green-600 hover:bg-green-500 hover:text-white hover:border-green-600'
                } focus:ring-2 focus:ring-green-500/20 focus:outline-none`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75V4.5A2.25 2.25 0 0015 2.25H9A2.25 2.25 0 006.75 4.5v2.25m10.5 0A2.25 2.25 0 0119.5 9v7.5A2.25 2.25 0 0117.25 18.75H6.75A2.25 2.25 0 014.5 16.5V9a2.25 2.25 0 012.25-2.25m10.5 0H6.75" />
                </svg>
                প্রিন্ট / ডাউনলোড
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Selection summary bar */}
      {selectedTransactions.length > 0 && (
        <div className={`flex flex-wrap items-center justify-between mb-4 p-4 rounded-xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow`}> 
          <div className="flex items-center gap-4">
            <span className="font-bold">নির্বাচিত: {selectedTransactions.length}</span>
            <span className="font-bold">মোট: {totalSelectedAmount.toLocaleString()} ৳</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleDelete} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">মুছে ফেলুন</button>
            <button onClick={handleDeselectAll} className="px-4 py-2 rounded-lg bg-gray-400 text-white hover:bg-gray-500">সব বাতিল করুন</button>
          </div>
        </div>
      )}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="space-y-8"
      >
        {sortedDateKeys.length === 0 ? (
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-8 text-center shadow-lg`}>
            <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>কোন লেনদেন পাওয়া যায়নি</p>
          </div>
        ) : (
          sortedDateKeys.map((date) => (
            <div key={date}>
              <div className={`font-bold text-lg mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{date}</div>
              <div className="space-y-2">
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={groupedTransactions[date].every(t => selectedTransactions.includes(t.id))}
                    onChange={e => e.target.checked ? handleSelectAll(groupedTransactions[date].map(t => t.id)) : handleDeselectAll()}
                    className="mr-2"
                  />
                  <span className="text-sm">সব নির্বাচন করুন</span>
                </div>
                {groupedTransactions[date].map((transaction, index) => (
                  <div key={transaction.id} className="flex items-center">
                    <ThemedCheckbox
                      checked={selectedTransactions.includes(transaction.id)}
                      onChange={() => handleSelect(transaction.id)}
                      disabled={false}
                    />
                    <div className="flex-1 ml-8">
                      <TransactionItem
                        key={transaction.id}
                        transaction={transaction}
                        darkMode={darkMode}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </motion.div>

      {/* Transaction Form Modal */}
      {showForm && (
        <TransactionForm 
          key="new"
          onClose={() => setShowForm(false)}
          onSubmit={() => setShowForm(false)}
        />
      )}
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-4 animate-fade-in">
          <span>{toast.message}</span>
          {toast.action && (
            <button
              onClick={toast.action}
              className="ml-2 px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white font-semibold transition"
            >
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
};
