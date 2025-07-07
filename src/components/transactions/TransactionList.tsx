import React, { useState, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { TransactionForm } from './TransactionForm';
import { TransactionItem } from './TransactionItem';
import { motion } from 'framer-motion';
import { Plus, Search, Filter } from 'lucide-react';
import { Transaction } from '../../types';
import { CategorySelect } from '../common/CategorySelect';
import { ThemedCheckbox } from '../common/ThemedCheckbox';

export const TransactionList: React.FC = () => {
  const { transactions, categories, darkMode, deleteTransaction } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; action?: () => void } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string[] | null>(null);
  const undoTimeout = useRef<NodeJS.Timeout | null>(null);

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (transaction.type === 'transfer' ? 'ট্রান্সফার' : transaction.category).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || (transaction.type === 'transfer' ? 'ট্রান্সফার' : transaction.category) === filterCategory;
    const matchesType = !filterType || transaction.type === filterType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    // First sort by date (newest first)
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA !== dateB) {
      return dateB - dateA; // Latest date first
    }
    
    // If dates are equal, sort by time (latest time first)
    function parseTime(timeStr?: string) {
      if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return 0;
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    }
    
    const timeA = parseTime(a.time);
    const timeB = parseTime(b.time);
    if (timeA !== timeB) {
      return timeB - timeA; // Latest time first
    }
    
    // If both date and time are equal, sort by creation time (newest first)
    const createdA = new Date(a.createdAt || a.date).getTime();
    const createdB = new Date(b.createdAt || b.date).getTime();
    return createdB - createdA;
  });

  // Group transactions by date
  const groupedTransactions: { [date: string]: Transaction[] } = {};
  sortedTransactions.forEach((transaction) => {
    const transactionDate = new Date(transaction.date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let dateKey: string;
    
    // Check if it's today
    if (transactionDate.toDateString() === today.toDateString()) {
      dateKey = 'আজ (' + transactionDate.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long' }) + ')';
    }
    // Check if it's yesterday
    else if (transactionDate.toDateString() === yesterday.toDateString()) {
      dateKey = 'গতকাল (' + transactionDate.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long' }) + ')';
    }
    // For other dates
    else {
      dateKey = transactionDate.toLocaleDateString('bn-BD', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
      });
    }
    
    if (!groupedTransactions[dateKey]) groupedTransactions[dateKey] = [];
    groupedTransactions[dateKey].push(transaction);
  });

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
            লেনদেনের তালিকা
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
          <span className="text-base">নতুন লেনদেন</span>
        </motion.button>
      </motion.div>

      {/* Search and Filter */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-6 shadow-lg`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search size={20} className={`absolute left-3 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            <input
              type="text"
              placeholder="অনুসন্ধান করুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
            />
          </div>
          <div>
            <CategorySelect
              value={filterCategory}
              onChange={setFilterCategory}
              options={Array.from(new Set(sortedTransactions.map(t => t.type === 'transfer' ? null : t.category))).filter(Boolean).map(cat => ({ value: cat, label: cat }))}
              placeholder="সব ক্যাটেগরি"
              disabled={false}
            />
          </div>
          
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
          >
            <option value="">সব ধরনের</option>
            <option value="income">আয়</option>
            <option value="expense">খরচ</option>
          </select>
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
            <button onClick={handleExport} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Export CSV</button>
            <button onClick={handleDelete} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">Delete</button>
            <button onClick={handleDeselectAll} className="px-4 py-2 rounded-lg bg-gray-400 text-white hover:bg-gray-500">Deselect</button>
          </div>
        </div>
      )}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="space-y-8"
      >
        {Object.keys(groupedTransactions).length === 0 ? (
          <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-8 text-center shadow-lg`}>
            <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>কোন লেনদেন পাওয়া যায়নি</p>
          </div>
        ) : (
          Object.entries(groupedTransactions).map(([date, txns]) => (
            <div key={date}>
              <div className={`font-bold text-lg mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{date}</div>
              <div className="space-y-2">
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={txns.every(t => selectedTransactions.includes(t.id))}
                    onChange={e => e.target.checked ? handleSelectAll(txns.map(t => t.id)) : handleDeselectAll()}
                    className="mr-2"
                  />
                  <span className="text-sm">সব নির্বাচন করুন</span>
                </div>
                {txns.map((transaction, index) => (
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
