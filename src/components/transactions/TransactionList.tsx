import React, { useState, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { TransactionForm } from './TransactionForm';
import { TransactionItem } from './TransactionItem';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, RotateCcw, Calendar as CalendarIcon } from 'lucide-react';
import { Transaction } from '../../types';
import { CategorySelect } from '../common/CategorySelect';
import { ThemedCheckbox } from '../common/ThemedCheckbox';
import { format } from 'date-fns';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import bn from 'date-fns/locale/bn';

// Add helper for custom calendar footer
function CalendarFooter({ onToday, onClear, darkMode }) {
  return (
    <div className="flex justify-between px-3 pb-2 pt-1">
      <button
        type="button"
        onClick={onToday}
        className={`px-3 py-1 rounded-lg font-medium text-sm ${darkMode ? 'bg-green-700 text-white hover:bg-green-600' : 'bg-green-500 text-white hover:bg-green-600'} transition`}
      >আজ</button>
      <button
        type="button"
        onClick={onClear}
        className={`px-3 py-1 rounded-lg font-medium text-sm ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} transition`}
      >মুছুন</button>
    </div>
  );
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

  // Filter transactions by date range
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transaction.type === 'transfer' ? 'ট্রান্সফার' : transaction.category).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || (transaction.type === 'transfer' ? 'ট্রান্সফার' : transaction.category) === filterCategory;
    const matchesType = !filterType || transaction.type === filterType;
    
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
  const handleExport = () => {
    // Export selected transactions as CSV
    const selected = sortedTransactions.filter(t => selectedTransactions.includes(t.id));
    if (selected.length === 0) {
      setToast({ message: 'কোনো লেনদেন নির্বাচন করা হয়নি!' });
      return;
    }
    const csv = [
      ['ID', 'Amount', 'Type', 'Category', 'Account', 'Date', 'Time', 'Person', 'Note', 'Tags'].join(','),
      ...selected.map(t => [
        t.id,
        t.amount,
        t.type,
        t.type === 'transfer' ? 'ট্রান্সফার' : t.category,
        t.accountId,
        t.date,
        formatTime12h(t.time),
        t.person,
        t.note,
        t.tags.join(';')
      ].map(x => `"${x ?? ''}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
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
  const totalSelectedAmount = sortedTransactions.filter(t => selectedTransactions.includes(t.id)).reduce((sum, t) => sum + t.amount * (t.type === 'expense' ? -1 : 1), 0);

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
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-6 shadow-lg`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search Input */}
          <div className="relative flex items-center">
            <Search size={20} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            <input
              type="text"
              placeholder="অনুসন্ধান করুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border shadow-sm transition focus:outline-none
                ${darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-green-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-green-500'}
              `}
            />
          </div>
          {/* Category Select */}
          <div className="flex items-center">
            <CategorySelect
              value={filterCategory}
              onChange={setFilterCategory}
              options={Array.from(new Set(sortedTransactions.map(t => t.type === 'transfer' ? null : t.category))).filter(Boolean).map(cat => ({ value: cat, label: cat }))}
              placeholder="সব ক্যাটেগরি"
              disabled={false}
              className={`w-full rounded-lg border shadow-sm transition focus:outline-none
                ${darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-green-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-green-500'}
              `}
            />
          </div>
          {/* Type Select */}
          <div className="flex items-center">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border shadow-sm transition focus:outline-none
                ${darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-green-500' 
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-green-500'}
              `}
            >
              <option value="">সব ধরনের</option>
              <option value="income">আয়</option>
              <option value="expense">খরচ</option>
            </select>
          </div>
          {/* Start Date Picker */}
          <div className="flex flex-col justify-end">
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>শুরুর তারিখ</label>
            <div className="relative flex items-center">
              <CalendarIcon size={18} className={`absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
              <ReactDatePicker
                selected={filterStartDate ? new Date(filterStartDate) : null}
                onChange={date => setFilterStartDate(date ? date.toISOString().slice(0, 10) : '')}
                dateFormat="yyyy-MM-dd"
                locale={bn}
                placeholderText="তারিখ বাছাই করুন"
                className={`w-full pl-10 pr-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} shadow-sm focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all`}
                calendarClassName={`${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'} rounded-xl shadow-lg border-0 font-bengali`}
                popperPlacement="bottom-start"
                isClearable
                renderCustomHeader={(props) => (
                  <>
                    {props.children}
                    <CalendarFooter
                      onToday={() => {
                        props.changeMonth(new Date().getMonth());
                        props.changeYear(new Date().getFullYear());
                        props.onChange(new Date());
                      }}
                      onClear={() => props.onChange(null)}
                      darkMode={darkMode}
                    />
                  </>
                )}
              />
            </div>
          </div>
          {/* End Date Picker */}
          <div className="flex flex-col justify-end">
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>শেষ তারিখ</label>
            <div className="relative flex items-center">
              <CalendarIcon size={18} className={`absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
              <ReactDatePicker
                selected={filterEndDate ? new Date(filterEndDate) : null}
                onChange={date => setFilterEndDate(date ? date.toISOString().slice(0, 10) : '')}
                dateFormat="yyyy-MM-dd"
                locale={bn}
                placeholderText="তারিখ বাছাই করুন"
                className={`w-full pl-10 pr-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} shadow-sm focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all`}
                calendarClassName={`${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'} rounded-xl shadow-lg border-0 font-bengali`}
                popperPlacement="bottom-start"
                isClearable
                renderCustomHeader={(props) => (
                  <>
                    {props.children}
                    <CalendarFooter
                      onToday={() => {
                        props.changeMonth(new Date().getMonth());
                        props.changeYear(new Date().getFullYear());
                        props.onChange(new Date());
                      }}
                      onClear={() => props.onChange(null)}
                      darkMode={darkMode}
                    />
                  </>
                )}
              />
            </div>
          </div>
          {/* Filter Reset Button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setFilterCategory('');
                setFilterType('');
                setFilterStartDate('');
                setFilterEndDate('');
              }}
              disabled={
                !searchTerm && !filterCategory && !filterType && !filterStartDate && !filterEndDate
              }
              title="সব ফিল্টার রিসেট করুন"
              className={`w-full px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-semibold shadow transition
                bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700
                disabled:opacity-50 disabled:cursor-not-allowed
                ${darkMode ? 'shadow-green-900' : 'shadow-green-200'}`}
            >
              <RotateCcw size={18} />
              ফিল্টার রিসেট করুন
            </button>
          </div>
        </div>
      </motion.div>

      {/* Selection summary bar */}
      {selectedTransactions.length > 0 && (
        <div className={`flex flex-wrap items-center justify-between mb-4 p-4 rounded-xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow`}> 
          <div className="flex items-center gap-4">
            <span className="font-bold">নির্বাচিত: {selectedTransactions.length}</span>
            <span className="font-bold">মোট: {totalSelectedAmount.toLocaleString()} ৳</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExport} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">CSV এরের হিসাব</button>
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
                    <div className="flex-1">
                      <TransactionItem transaction={transaction} />
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
