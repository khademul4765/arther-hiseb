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
              {/* Hide person/org for loan/interest category */}
              {transaction.person && transaction.category !== 'লোন / ইন্টারেস্ট' && (
                <p className={`text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>ব্যক্তি / প্রতিষ্ঠান: {transaction.person}</p>
              )}
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
              <h2 className="text-xl font-extrabold tracking-tight flex-1 text-center" style={{ color: '#131A29' }}>লেনদেনের বিস্তারিত</h2>
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
                  className="p-2 rounded-lg transition hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 focus:outline-none font-bold text-lg"
                  style={{ color: '#131A29' }}
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
              {/* Header Row */}
              <div className="print:receipt-header-row">
                <div className="print:receipt-app-info">
                  <div className="print:receipt-app-logo">💰</div>
                  <div className="print:receipt-app-name">অর্থের হিসেব</div>
                  <div>by MK Bashar</div>
                </div>
                <div className="print:receipt-meta">
                  <div className="print:receipt-label">তারিখ:</div>
                  <div className="print:receipt-value">{format(new Date(transaction.date), 'dd/MM/yyyy')}</div>
                  <div className="print:receipt-label">সময়:</div>
                  <div className="print:receipt-value">{formatTime12h(transaction.time)}</div>
                </div>
              </div>
              
              {/* Title */}
              <div className="print:receipt-title-box">লেনদেন রসিদ</div>
              
              {/* Fields */}
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
              
              {/* Footer */}
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
    const printElement = document.getElementById(id);
    if (!printElement) return;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('পপআপ ব্লকার সক্রিয়। প্রিন্ট করার জন্য পপআপ অনুমতি দিন।');
      return;
    }
    
    // Get the print-only content
    const printContent = printElement.querySelector('.print\\:receipt-paper-outer');
    if (!printContent) return;
    
    // Create the print document
    const printDocument = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>লেনদেন রসিদ - ${new Date().toLocaleDateString('bn-BD')}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            @media print {
              body { 
                margin: 0; 
                padding: 20px; 
                background: white !important; 
              }
              .receipt-paper {
                background: #fff !important;
                color: #000 !important;
                width: 360px !important;
                margin: 0 auto !important;
                border: 1.5px solid #27ae60 !important;
                border-radius: 8px !important;
                box-shadow: none !important;
                font-family: 'Noto Serif Bengali', 'Fira Mono', 'Consolas', 'Menlo', monospace !important;
                padding: 0 !important;
                position: relative;
              }
              .receipt-paper * {
                color: #000 !important;
                background: none !important;
                box-shadow: none !important;
              }
              .print\\:receipt-outer {
                padding: 24px 24px 0 24px;
              }
              .print\\:receipt-header-row {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 8px;
              }
              .print\\:receipt-app-info {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                font-size: 13px;
                font-weight: 600;
                gap: 2px;
              }
              .print\\:receipt-app-logo {
                width: 28px;
                height: 28px;
                border-radius: 50%;
                background: #27ae60;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #fff;
                font-size: 18px;
                margin-bottom: 2px;
              }
              .print\\:receipt-app-name {
                font-size: 14px;
                font-weight: 700;
                color: #27ae60;
                letter-spacing: 0.5px;
              }
              .print\\:receipt-meta {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                font-size: 12px;
                gap: 2px;
              }
              .print\\:receipt-label {
                font-weight: 600;
                font-size: 13px;
                color: #27ae60 !important;
                margin-bottom: 1px;
              }
              .print\\:receipt-value {
                font-size: 13px;
                font-family: inherit;
                margin-bottom: 2px;
                border-bottom: 1px dotted #bbb;
                min-width: 60px;
                display: inline-block;
                text-align: right;
              }
              .print\\:receipt-title-box {
                border: 1.5px solid #27ae60;
                border-radius: 6px;
                display: inline-block;
                padding: 3px 18px;
                font-size: 18px;
                font-weight: 800;
                letter-spacing: 1.5px;
                color: #27ae60;
                background: #f6fef9;
                margin: 0 auto 18px auto;
                text-align: center;
                width: 100%;
              }
              .print\\:receipt-fields {
                display: grid;
                grid-template-columns: 120px 1fr;
                gap: 0 12px;
                padding: 0 24px 0 24px;
                font-size: 14px;
                margin-bottom: 18px;
              }
              .print\\:receipt-underline {
                border-bottom: 1px solid #bbb;
                min-height: 18px;
                padding-bottom: 2px;
                font-family: inherit;
                font-size: 14px;
                margin-bottom: 2px;
                display: flex;
                align-items: center;
              }
              .print\\:receipt-amount {
                font-size: 20px;
                font-weight: bold;
                color: #27ae60;
                letter-spacing: 1px;
                border-bottom: 2.5px double #27ae60;
                padding-bottom: 2px;
                margin-bottom: 2px;
                min-height: 22px;
                display: flex;
                align-items: center;
              }
              .print\\:receipt-footer {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                padding: 0 24px 0 24px;
                margin-top: 32px;
                font-size: 13px;
                color: #888;
              }
              .print\\:receipt-signature {
                border-top: 1px dashed #27ae60;
                min-width: 100px;
                text-align: center;
                padding-top: 8px;
                font-size: 13px;
                color: #27ae60;
                font-weight: 600;
              }
              .print\\:receipt-bottom-bar {
                width: 100%;
                height: 16px;
                background: #27ae60;
                border-bottom-left-radius: 8px;
                border-bottom-right-radius: 8px;
                margin-top: 18px;
              }
            }
            body {
              font-family: 'Noto Serif Bengali', serif;
              background: #f5f5f5;
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .receipt-paper {
              background: #fff;
              color: #000;
              width: 360px;
              margin: 0 auto;
              border: 1.5px solid #27ae60;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              font-family: 'Noto Serif Bengali', 'Fira Mono', 'Consolas', 'Menlo', monospace;
              padding: 0;
              position: relative;
            }
            .receipt-paper * {
              color: #000;
              background: none;
              box-shadow: none;
            }
            .print\\:receipt-outer {
              padding: 24px 24px 0 24px;
            }
            .print\\:receipt-header-row {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 8px;
            }
            .print\\:receipt-app-info {
              display: flex;
              flex-direction: column;
              align-items: flex-start;
              font-size: 13px;
              font-weight: 600;
              gap: 2px;
            }
            .print\\:receipt-app-logo {
              width: 28px;
              height: 28px;
              border-radius: 50%;
              background: #27ae60;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #fff;
              font-size: 18px;
              margin-bottom: 2px;
            }
            .print\\:receipt-app-name {
              font-size: 14px;
              font-weight: 700;
              color: #27ae60;
              letter-spacing: 0.5px;
            }
            .print\\:receipt-meta {
              display: flex;
              flex-direction: column;
              align-items: flex-end;
              font-size: 12px;
              gap: 2px;
            }
            .print\\:receipt-label {
              font-weight: 600;
              font-size: 13px;
              color: #27ae60;
              margin-bottom: 1px;
            }
            .print\\:receipt-value {
              font-size: 13px;
              font-family: inherit;
              margin-bottom: 2px;
              border-bottom: 1px dotted #bbb;
              min-width: 60px;
              display: inline-block;
              text-align: right;
            }
            .print\\:receipt-title-box {
              border: 1.5px solid #27ae60;
              border-radius: 6px;
              display: inline-block;
              padding: 3px 18px;
              font-size: 18px;
              font-weight: 800;
              letter-spacing: 1.5px;
              color: #27ae60;
              background: #f6fef9;
              margin: 0 auto 18px auto;
              text-align: center;
              width: 100%;
            }
            .print\\:receipt-fields {
              display: grid;
              grid-template-columns: 120px 1fr;
              gap: 0 12px;
              padding: 0 24px 0 24px;
              font-size: 14px;
              margin-bottom: 18px;
            }
            .print\\:receipt-underline {
              border-bottom: 1px solid #bbb;
              min-height: 18px;
              padding-bottom: 2px;
              font-family: inherit;
              font-size: 14px;
              margin-bottom: 2px;
              display: flex;
              align-items: center;
            }
            .print\\:receipt-amount {
              font-size: 20px;
              font-weight: bold;
              color: #27ae60;
              letter-spacing: 1px;
              border-bottom: 2.5px double #27ae60;
              padding-bottom: 2px;
              margin-bottom: 2px;
              min-height: 22px;
              display: flex;
              align-items: center;
            }
            .print\\:receipt-footer {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              padding: 0 24px 0 24px;
              margin-top: 32px;
              font-size: 13px;
              color: #888;
            }
            .print\\:receipt-signature {
              border-top: 1px dashed #27ae60;
              min-width: 100px;
              text-align: center;
              padding-top: 8px;
              font-size: 13px;
              color: #27ae60;
              font-weight: 600;
            }
            .print\\:receipt-bottom-bar {
              width: 100%;
              height: 16px;
              background: #27ae60;
              border-bottom-left-radius: 8px;
              border-bottom-right-radius: 8px;
              margin-top: 18px;
            }
            .print-button {
              position: fixed;
              top: 20px;
              right: 20px;
              background: #27ae60;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 8px;
              cursor: pointer;
              font-family: 'Noto Serif Bengali', serif;
              font-weight: 600;
              z-index: 1000;
            }
            .print-button:hover {
              background: #229954;
            }
            @media print {
              .print-button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <button class="print-button" onclick="window.print()">প্রিন্ট করুন</button>
          <div class="receipt-paper">
            ${printContent.outerHTML}
          </div>
          <script>
            // Auto-print after a short delay
            setTimeout(() => {
    window.print();
            }, 500);
            
            // Close window after printing
            window.onafterprint = function() {
              window.close();
            };
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(printDocument);
    printWindow.document.close();
    printWindow.focus();
  };
}
