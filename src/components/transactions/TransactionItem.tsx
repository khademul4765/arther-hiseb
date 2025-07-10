import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { TransactionForm } from './TransactionForm';
import { TransferForm } from '../accounts/TransferForm';
import { motion } from 'framer-motion';
import { Edit2, Trash2, ArrowUpRight, ArrowDownRight, ArrowRightLeft, Printer, Info } from 'lucide-react';
import { format } from 'date-fns';
import { Transaction } from '../../types/index';
import './TransactionReceiptPrint.css';

interface TransactionItemProps {
  transaction: Transaction & { toAccountId?: string };
  darkMode: boolean;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, darkMode }) => {
  const { deleteTransaction, categories, darkMode: appDarkMode, accounts } = useStore();
  const [showEditForm, setShowEditForm] = useState(false);
  const [showEditTransferForm, setShowEditTransferForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!showDetails) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowDetails(false);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [showDetails]);

  const getCategoryIcon = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName);
    return category?.icon || '💰';
  };

  const handleDelete = () => {
    deleteTransaction(transaction.id);
    setShowDeleteConfirm(false);
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

  // Helper to detect transfer
  const isTransfer = transaction.type === 'transfer';

  const displayCategory = isTransfer ? 'ট্রান্সফার' : transaction.category;

  function getTypeColorAndIcon(type: 'income' | 'expense' | 'transfer') {
    switch (type) {
      case 'income':
        return { color: 'text-green-600', icon: <ArrowUpRight size={16} /> };
      case 'expense':
        return { color: 'text-red-600', icon: <ArrowDownRight size={16} /> };
      case 'transfer':
      default:
        return { color: 'text-blue-600', icon: <ArrowRightLeft size={16} /> };
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        whileHover={{ scale: 1.01, y: -2 }}
        className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm cursor-pointer`}
        onClick={() => setShowDetails(true)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="text-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl p-3 shadow-md"
            >
              {getCategoryIcon(transaction.category)}
            </motion.div>
            <div className="flex-1">
              <div className={`flex items-center space-x-2`}>
                <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{displayCategory}</h3>
                {(() => {
                  const { color, icon } = getTypeColorAndIcon(transaction.type);
                  return <div className={color}>{icon}</div>;
                })()}
              </div>
              <p className={`text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{format(new Date(transaction.date), 'dd MMM yyyy')}  {formatTime12h(transaction.time)}</p>
              {/* Extra info row for report view */}
              <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}> 
                {transaction.accountId && (
                  <span>অ্যাকাউন্ট: {accounts.find(a => a.id === transaction.accountId)?.name || transaction.accountId}</span>
                )}
                {isTransfer && transaction.toAccountId && (
                  <span> → {accounts.find(a => a.id === transaction.toAccountId)?.name || transaction.toAccountId}</span>
                )}
              </div>
              {/* End extra info row */}
              {transaction.note && (<p className={`text-base ${darkMode ? 'text-gray-300' : 'text-gray-700'} mt-1`}>{transaction.note}</p>)}
              {transaction.person && (<p className={`text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>ব্যক্তি / প্রতিষ্ঠান: {transaction.person}</p>)}
              {transaction.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {transaction.tags.filter(tag => tag !== 'ট্রান্সফার').map((tag, index) => (
                    <span key={index} className={`px-3 py-1 text-sm rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              {(() => {
                const { color } = getTypeColorAndIcon(transaction.type);
                let sign = '';
                switch (transaction.type) {
                  case 'income':
                    sign = '+';
                    break;
                  case 'expense':
                    sign = '-';
                    break;
                  default:
                    sign = '';
                }
                return <p className={`text-2xl font-bold ${color}`}>{sign}{transaction.amount.toLocaleString()} ৳</p>;
              })()}
            </div>
            
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={e => {
                  e.stopPropagation();
                  if (isTransfer) {
                    setShowEditTransferForm(true);
                  } else {
                    setShowEditForm(true);
                  }
                }}
                className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} shadow-md transition-all duration-200`}
              >
                <Edit2 size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={e => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} shadow-md transition-all duration-200`}
              >
                <Trash2 size={16} className="text-red-500" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Edit Form */}
      {showEditForm && !isTransfer && (
        <TransactionForm
          transaction={transaction}
          onClose={() => setShowEditForm(false)}
          onSubmit={() => setShowEditForm(false)}
        />
      )}
      {/* Edit Transfer Form */}
      {showEditTransferForm && isTransfer && (
        <TransferForm
          // Pre-fill transfer data
          initialData={{
            fromAccountId: transaction.accountId,
            toAccountId: transaction.toAccountId || '',
            amount: transaction.amount,
            note: transaction.note,
            id: transaction.id
          }}
          onClose={() => setShowEditTransferForm(false)}
          onSubmit={() => setShowEditTransferForm(false)}
          isEdit={true}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-md`}
          >
            <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
              লেনদেন মুছবেন?
            </h3>
            <p className={`text-base ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
              এই লেনদেনটি স্থায়ীভাবে মুছে ফেলা হবে। এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`flex-1 px-4 py-2 rounded-lg border text-base ${
                  darkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                বাতিল
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-base"
              >
                মুছে ফেলুন
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Transaction Details Modal */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowDetails(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`relative w-full max-w-md p-0 rounded-2xl shadow-2xl border-0 print:shadow-none print:border-0 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}
            style={{ boxShadow: '0 8px 32px 0 rgba(34,197,94,0.18)' }}
            onClick={e => e.stopPropagation()}
            id="transaction-details-modal-print"
          >
            {/* Header Bar */}
            <div className="flex items-center gap-3 px-6 pt-6 pb-3 rounded-t-2xl border-b border-green-200 print:rounded-none print:border-0 print:pt-4 print:pb-2 print:px-0 print:bg-white print:justify-center" style={{ background: '#DEF8E7', borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/80 shadow-lg border-4 border-green-500">
                <Info size={28} className="text-green-600 dark:text-green-300" />
              </div>
              <h2 className="text-xl font-extrabold text-green-900 dark:text-green-100 tracking-tight flex-1 text-center">লেনদেনের বিস্তারিত</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    window.printModalContent && window.printModalContent('transaction-details-modal-print');
                  }}
                  className="p-2 rounded-lg bg-green-500 hover:bg-green-600 transition text-white flex items-center gap-1 shadow-md print:hidden"
                  title="প্রিন্ট করুন"
                >
                  <Printer size={20} />
                </button>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 rounded-lg transition text-green-900 dark:text-green-100 hover:bg-green-50 dark:hover:bg-green-900 hover:text-green-600 focus:outline-none"
                  title="বন্ধ করুন"
                >
                  ✕
                </button>
              </div>
            </div>
            {/* Card Content (visible on screen) */}
            <div className="relative bg-gradient-to-br from-green-50/80 to-blue-50/80 dark:from-gray-900 dark:to-gray-800 rounded-b-2xl border-t-0 border border-green-200 p-8 space-y-4 print:hidden">
              {/* Main card content as before */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-3 mb-2">
                </div>
                <div className="grid grid-cols-3 gap-x-2 gap-y-4 items-center w-full max-w-xs mx-auto">
                  <span className="font-semibold text-green-700 dark:text-green-300 text-right">তারিখ</span><span className="text-green-700 dark:text-green-300 text-center">:</span><span>{format(new Date(transaction.date), 'dd MMM yyyy')}</span>
                  <span className="font-semibold text-green-700 dark:text-green-300 text-right">সময়</span><span className="text-green-700 dark:text-green-300 text-center">:</span><span>{formatTime12h(transaction.time)}</span>
                  <span className="font-semibold text-green-700 dark:text-green-300 text-right">ধরন</span><span className="text-green-700 dark:text-green-300 text-center">:</span><span>{(() => {
                    switch (transaction.type) {
                      case 'income': return 'আয়';
                      case 'expense': return 'খরচ';
                      case 'transfer': return 'ট্রান্সফার';
                      default: return transaction.type;
                    }
                  })()}</span>
                  <span className="font-semibold text-green-700 dark:text-green-300 text-right">ক্যাটেগরি</span><span className="text-green-700 dark:text-green-300 text-center">:</span><span className="truncate">{displayCategory}</span>
                  <span className="font-semibold text-green-700 dark:text-green-300 text-right">পরিমাণ</span><span className="text-green-700 dark:text-green-300 text-center">:</span><span className={
                    `font-bold text-lg ` +
                    (transaction.type === 'income' ? 'text-green-600' : transaction.type === 'expense' ? 'text-red-500' : 'text-gray-700 dark:text-gray-200')
                  }>
                    {transaction.amount.toLocaleString()} ৳
                  </span>
                  <span className="font-semibold text-green-700 dark:text-green-300 text-right">অ্যাকাউন্ট</span><span className="text-green-700 dark:text-green-300 text-center">:</span><span>{accounts.find(a => a.id === transaction.accountId)?.name || transaction.accountId}</span>
                  {transaction.toAccountId && <><span className="font-semibold text-green-700 dark:text-green-300 text-right">গন্তব্য অ্যাকাউন্ট</span><span className="text-green-700 dark:text-green-300 text-center">:</span><span>{accounts.find(a => a.id === transaction.toAccountId)?.name || transaction.toAccountId}</span></>}
                  {transaction.person && <><span className="font-semibold text-green-700 dark:text-green-300 text-right">ব্যক্তি / প্রতিষ্ঠান</span><span className="text-green-700 dark:text-green-300 text-center">:</span><span>{transaction.person}</span></>}
                  {transaction.note && <><span className="font-semibold text-green-700 dark:text-green-300 text-right">নোট</span><span className="text-green-700 dark:text-green-300 text-center">:</span><span>{transaction.note}</span></>}
                  {transaction.tags.length > 0 && <><span className="font-semibold text-green-700 dark:text-green-300 text-right">ট্যাগ</span><span className="text-green-700 dark:text-green-300 text-center">:</span><span>{transaction.tags.join(', ')}</span></>}
                </div>
              </div>
            </div>
            {/* Print-only receipt layout */}
            <div className="hidden print:block print:receipt-paper-outer">
              <div className="print:receipt-title">লেনদেন রসিদ</div>
              <div className="print:receipt-fields">
                <div>ক্যাটেগরি:</div>
                <div className="print:receipt-underline">{displayCategory || '—'}</div>
                <div>ধরন:</div>
                <div className="print:receipt-underline">{(() => {
                  switch (transaction.type) {
                    case 'income': return 'আয়';
                    case 'expense': return 'খরচ';
                    case 'transfer': return 'ট্রান্সফার';
                    default: return transaction.type;
                  }
                })()}</div>
                <div>অ্যাকাউন্ট:</div>
                <div className="print:receipt-underline">{accounts.find(a => a.id === transaction.accountId)?.name || transaction.accountId || '—'}</div>
                {transaction.toAccountId && <><div>গন্তব্য অ্যাকাউন্ট:</div><div className="print:receipt-underline">{accounts.find(a => a.id === transaction.toAccountId)?.name || transaction.toAccountId}</div></>}
                {transaction.person && <><div>ব্যক্তি / প্রতিষ্ঠান:</div><div className="print:receipt-underline">{transaction.person}</div></>}
                {transaction.note && <><div>নোট:</div><div className="print:receipt-underline">{transaction.note}</div></>}
                {transaction.tags.length > 0 && <><div>ট্যাগ:</div><div className="print:receipt-underline">{transaction.tags.join(', ')}</div></>}
                <div className="print:receipt-amount-label">পরিমাণ (টাকা):</div>
                <div className="print:receipt-amount">{transaction.amount.toLocaleString()} ৳</div>
              </div>
              <div className="print:receipt-footer">
                <div className="print:receipt-signature">প্রাপ্তির স্বাক্ষর</div>
                <div className="print:receipt-signature">অনুমোদিত স্বাক্ষর</div>
              </div>
              <div className="print:receipt-bottom-bar"></div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

// Add this at the top of the file (after imports)
declare global {
  interface Window {
    printModalContent?: (id: string) => void;
  }
}

// Print helper for modal only
if (typeof window !== 'undefined' && !window.printModalContent) {
  window.printModalContent = (id: string) => {
    const printContents = document.getElementById(id)?.innerHTML;
    if (!printContents) return;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };
}
