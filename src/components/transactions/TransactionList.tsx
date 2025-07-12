import React, { useState, useRef, useMemo, useEffect } from 'react';
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

import { DatePickerHeader, CustomCalendarContainer } from '../common/DatePickerHeader';

interface CustomCalendarContainerProps {
  className?: string;
  children: ReactNode;
  onToday: () => void;
  onClear: () => void;
  darkMode: boolean;
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Refs for date pickers
  const startDatePickerRef = useRef<any>(null);
  const endDatePickerRef = useRef<any>(null);

  // Filter categories based on selected type
  const filteredCategories = useMemo(() => {
    if (!filterType) {
      // If no type is selected, show all categories except transfer
      return categories.filter(cat => cat.name !== 'ট্রান্সফার');
    } else if (filterType === 'transfer') {
      // If transfer is selected, only show transfer category
      return categories.filter(cat => cat.name === 'ট্রান্সফার');
    } else {
      // If income or expense is selected, show only categories of that type
      return categories.filter(cat => cat.type === filterType && cat.name !== 'ট্রান্সফার');
    }
  }, [categories, filterType]);

  // Reset category filter when type changes
  useEffect(() => {
    setFilterCategory('');
  }, [filterType]);

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
  function handleSelectAll(ids: string[]) {
    setSelectedTransactions(prev => Array.from(new Set([...prev, ...ids])));
  }

  function handleDeselectAll(ids: string[]) {
    setSelectedTransactions(prev => prev.filter(id => !ids.includes(id)));
  }
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
  function handleDelete() {
    if (selectedTransactions.length === 0) return;
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
  // Calculate total income and total expenses for selected transactions
  const selectedIncome = transactions
    .filter(t => selectedTransactions.includes(t.id) && t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const selectedExpense = transactions
    .filter(t => selectedTransactions.includes(t.id) && t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  function handlePrintTransactions() {
    // Get filtered transactions based on current filters
    const filteredTransactions = transactions.filter(transaction => {
      // Search filter
      if (searchTerm && !transaction.note.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !transaction.person?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Type filter
      if (filterType && transaction.type !== filterType) {
        return false;
      }
      
      // Category filter
      if (filterCategory && transaction.category !== filterCategory) {
        return false;
      }
      
      // Date range filter
      if (filterStartDate && new Date(transaction.date) < new Date(filterStartDate)) {
        return false;
      }
      if (filterEndDate && new Date(transaction.date) > new Date(filterEndDate)) {
        return false;
      }
      
      return true;
    });

    if (filteredTransactions.length === 0) {
      alert('প্রিন্ট করার জন্য কোন লেনদেন পাওয়া যায়নি।');
      return;
    }

    // Helper to convert English digits to Bengali
    const toBengaliDigits = (str: string | number) => String(str).replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[Number(d)]);
    
    // Helper to pad numbers to two digits
    const pad2 = (n: string | number) => n.toString().padStart(2, '0');
    
    // Helper to format date in Bengali with two digits for day and month
    const formatDateBengali = (dateObj: Date) => {
      const d = dateObj.getDate();
      const m = dateObj.getMonth() + 1;
      const y = dateObj.getFullYear();
      return `${toBengaliDigits(String(pad2(d)))}/${toBengaliDigits(String(pad2(m)))}/${toBengaliDigits(String(y))}`;
    };
    
    // Helper to format time in Bengali with two digits for hour and minute, AM/PM in English
    const formatTimeBengali = (time: string) => {
      if (!time) return '';
      const [h, m] = time.split(':');
      let hour = parseInt(h, 10);
      const minute = m;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12;
      if (hour === 0) hour = 12;
      return `${toBengaliDigits(String(pad2(hour)))}:${toBengaliDigits(String(pad2(minute)))} ${ampm}`;
    };

    // Calculate totals
    let totalIncome = 0;
    let totalExpense = 0;
    let totalTransfer = 0;

    const tableRows = filteredTransactions.map(t => {
      let income = '';
      let expense = '';
      let transfer = '';
      
      if (t.type === 'income') {
        income = `<span style='color:#00B44C;font-weight:600;font-size:1.1em;'>${t.amount.toLocaleString()} ৳</span>`;
        totalIncome += t.amount;
      } else if (t.type === 'expense') {
        expense = `<span style='color:#e53935;font-weight:600;font-size:1.1em;'>${t.amount.toLocaleString()} ৳</span>`;
        totalExpense += t.amount;
      } else if (t.type === 'transfer') {
        transfer = `<span style='color:#2196F3;font-weight:600;font-size:1.1em;'>${t.amount.toLocaleString()} ৳</span>`;
        totalTransfer += t.amount;
      }
      
      return [
        formatDateBengali(new Date(t.date)),
        formatTimeBengali(t.time),
        t.type === 'income' ? 'আয়' : t.type === 'expense' ? 'খরচ' : 'ট্রান্সফার',
        t.category,
        income,
        expense,
        transfer,
        t.person || '—',
        t.note || '—'
      ];
    });

    // Create total row
    let totalRow = `<tr>
      <td colspan='4' style='padding:10px 8px;border:1px solid #e5e7eb;font-weight:700;text-align:center;vertical-align:middle;background:#00B44C;color:#fff;font-size:1.05rem;'>মোট</td>
      <td style='padding:10px 8px;border:1px solid #e5e7eb;font-weight:700;text-align:center;vertical-align:middle;background:#00B44C;color:#fff;font-size:1.05rem;'>${toBengaliDigits(totalIncome.toLocaleString())} ৳</td>
      <td style='padding:10px 8px;border:1px solid #e5e7eb;font-weight:700;text-align:center;vertical-align:middle;background:#00B44C;color:#fff;font-size:1.05rem;'>${toBengaliDigits(totalExpense.toLocaleString())} ৳</td>
      <td style='padding:10px 8px;border:1px solid #e5e7eb;font-weight:700;text-align:center;vertical-align:middle;background:#00B44C;color:#fff;font-size:1.05rem;'>${toBengaliDigits(totalTransfer.toLocaleString())} ৳</td>
      <td colspan='2' style='padding:10px 8px;border:1px solid #e5e7eb;background:#00B44C;'></td>
    </tr>`;

    // Helper to format the printed date/time in Bengali
    const formatPrintedDateTime = (dateObj: Date) => {
      const d = dateObj.getDate();
      const m = dateObj.getMonth() + 1;
      const y = dateObj.getFullYear();
      const h = dateObj.getHours();
      const min = dateObj.getMinutes();
      const s = dateObj.getSeconds();
      const ampm = h >= 12 ? 'PM' : 'AM';
      let hour12 = h % 12;
      if (hour12 === 0) hour12 = 12;
      return `${toBengaliDigits(String(pad2(d)))}/${toBengaliDigits(String(pad2(m)))}/${toBengaliDigits(String(y))}, ${toBengaliDigits(String(pad2(hour12)))}:${toBengaliDigits(String(pad2(min)))}:${toBengaliDigits(String(pad2(s)))} ${ampm}`;
    };

    const appName = 'অর্থের হিসেব';
    const creatorName = 'by MK Bashar';
    const logoUrl = window.location.origin + '/logo.svg';
    const tableHeaders = ['তারিখ', 'সময়', 'ধরন', 'ক্যাটেগরি', 'আয়', 'খরচ', 'ট্রান্সফার', 'ব্যক্তি/প্রতিষ্ঠান', 'নোট'];

    let html = `
      <div class="print-header" style="text-align:center;margin-bottom:16px;position:relative;z-index:1;">
        <img src="${logoUrl}" alt="Logo" style="width:64px;height:64px;object-fit:contain;margin-bottom:8px;display:block;margin-left:auto;margin-right:auto;" />
        <div style="font-size:2rem;font-weight:bold;color:#00B44C;font-family:'Noto Serif Bengali',serif;margin-bottom:0px;">${appName}</div>
        <div style="font-size:1.1rem;color:#666;margin-bottom:18px;font-family:'Noto Serif Bengali',serif;">${creatorName}</div>
        <div style="font-size:1.5rem;font-weight:700;margin-top:18px;margin-bottom:8px;font-family:'Noto Serif Bengali',serif;">লেনদেন রিপোর্ট</div>
        <div style="font-size:1rem;color:#666;margin-bottom:8px;font-family:'Noto Serif Bengali',serif;">প্রিন্টের তারিখ: ${formatPrintedDateTime(new Date())}</div>
        <div style="font-size:1rem;color:#666;margin-bottom:18px;font-family:'Noto Serif Bengali',serif;">মোট লেনদেন: ${toBengaliDigits(filteredTransactions.length)}টি</div>
      </div>
      <table>
        <thead>
          <tr>
            ${tableHeaders.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${tableRows.map(row => `<tr>${row.map((cell,i) => `<td>${cell || ''}</td>`).join('')}</tr>`).join('')}
          ${totalRow.replace('<tr>', '<tr class="total-row">')}
        </tbody>
      </table>
    `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('পপআপ ব্লকার সক্রিয়। প্রিন্ট করার জন্য পপআপ অনুমতি দিন।');
      return;
    }
    
    printWindow.document.write(`<html><head><title>${appName} - লেনদেন রিপোর্ট</title>`);
    printWindow.document.write('<meta charset="UTF-8">');
    printWindow.document.write('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
    printWindow.document.write('<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet">');
    printWindow.document.write('<style>body{font-family:\'Noto Serif Bengali\',serif;background:#fff;padding:32px;} .print-header{margin-bottom:24px;} table{box-shadow:0 2px 8px #0001;border-radius:12px;overflow:hidden;width:100%;border-collapse:separate;border-spacing:0;margin-top:18px;} th,td{transition:background 0.2s;text-align:center;vertical-align:middle;} th{background:#00B44C;color:#fff;letter-spacing:0.5px;font-size:1.08rem;font-weight:700;padding:12px 8px;border:1px solid #e5e7eb;} td{font-size:1rem;padding:10px 8px;border:1px solid #e5e7eb;} tr:nth-child(even):not(.total-row){background:#f3fef6;} .total-row td{font-size:1.05rem;font-weight:700;background:#00B44C;color:#fff;} @media print { body { background: #fff !important; } }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(html);
    printWindow.document.write('<script>setTimeout(function(){window.print();window.onafterprint=function(){window.close();};},300);</script>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
  }

  // Format the date to always show two digits for the day in Bengali numerals
  const formatBengaliDate = (dateString: string) => {
    const bnDigits = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
    const parts = dateString.split(' ');
    if (parts.length === 3) {
      let day = parts[0];
      if (day.length === 1) day = '0' + day;
      // Convert each digit to Bengali
      day = day.replace(/\d/g, d => bnDigits[parseInt(d)]);
      return `${day} ${parts[1]} ${parts[2]}`;
    }
    return dateString;
  };

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
                options={filteredCategories.map(cat => ({ value: cat.name, label: `${cat.icon} ${cat.name}` }))}
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
                  <DatePickerHeader {...props} darkMode={darkMode} datePickerRef={startDatePickerRef} />
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
                  <DatePickerHeader {...props} darkMode={darkMode} datePickerRef={startDatePickerRef} />
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
        <div
          className={`
            fixed bottom-6 left-1/2 transform -translate-x-1/2
            flex items-center justify-between
            p-4 rounded-xl border shadow
            z-50
            ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
            w-[calc(100vw-32px)] max-w-4xl
          `}
          style={{ minWidth: 320 }}
        >
          {/* Left: Selected count */}
          <div className="flex items-center">
            <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>নির্বাচিত: {selectedTransactions.length}</span>
          </div>
          {/* Center: Totals */}
          <div className="flex items-center gap-4">
            <span className={`font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>মোট আয়: {selectedIncome.toLocaleString()} ৳</span>
            <span className={`font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>মোট খরচ: {selectedExpense.toLocaleString()} ৳</span>
          </div>
          {/* Right: Action buttons */}
          <div className="flex items-center gap-2">
            <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">মুছে ফেলুন</button>
            <button onClick={() => handleDeselectAll(selectedTransactions)} className="px-4 py-2 rounded-lg bg-gray-400 text-white hover:bg-gray-500">সব বাতিল করুন</button>
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
              <div className="flex items-start justify-between mb-2">
                <div className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatBengaliDate(date)}</div>
                <div className="flex flex-col items-end text-right">
                  <span className={`font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>দিনের মোট আয়: {groupedTransactions[date].filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0).toLocaleString()} ৳</span>
                  <span className={`font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>দিনের মোট খরচ: {groupedTransactions[date].filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0).toLocaleString()} ৳</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center mb-2">
                  <ThemedCheckbox
                    checked={groupedTransactions[date].every(t => selectedTransactions.includes(t.id))}
                    onChange={e =>
                      e.target.checked
                        ? handleSelectAll(groupedTransactions[date].map(t => t.id))
                        : handleDeselectAll(groupedTransactions[date].map(t => t.id))
                    }
                    label="সব নির্বাচন করুন"
                    disabled={false}
                    className="text-sm"
                    size={16}
                  />
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
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className={`rounded-xl p-8 max-w-sm w-full shadow-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
            <h2 className="text-xl font-bold mb-4">নিশ্চিত?</h2>
            <p className="mb-6">আপনি কি নির্বাচিত লেনদেনগুলো মুছে ফেলতে চান?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`px-4 py-2 rounded-lg border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
              >
                বাতিল
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  handleDelete();
                }}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
