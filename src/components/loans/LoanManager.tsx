import React, { useState, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { LoanForm } from './LoanForm';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Users, ArrowUpRight, ArrowDownLeft, DollarSign, MessageSquare, X, Search } from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { ThemedCheckbox } from '../common/ThemedCheckbox';

export const LoanManager: React.FC = () => {
  const { loans, deleteLoan, payInstallment, darkMode, transactions } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingLoan, setEditingLoan] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [toast, setToast] = useState<{ message: string; action?: () => void } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const undoTimeout = useRef<NodeJS.Timeout | null>(null);
  const [showRecordModal, setShowRecordModal] = useState<string | null>(null); // loanId or null
  const [recordMode, setRecordMode] = useState<'select' | 'new' | null>(null);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);

  const handleEdit = (loan: any) => {
    setEditingLoan(loan);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setPendingDelete(id);
    setToast({
      message: 'ঋণ/পাওনা মুছে ফেলা হয়েছে',
      action: handleUndo
    });
    if (undoTimeout.current) clearTimeout(undoTimeout.current);
    undoTimeout.current = setTimeout(() => {
      finalizeDelete(id);
      setToast(null);
      setPendingDelete(null);
    }, 5000);
    setShowDeleteConfirm(null);
  };

  const finalizeDelete = (id: string) => {
    deleteLoan(id);
  };

  const handleUndo = () => {
    if (undoTimeout.current) clearTimeout(undoTimeout.current);
    setToast(null);
    setPendingDelete(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingLoan(null);
  };

  const handlePayment = (loanId: string) => {
    const amount = parseFloat(paymentAmount);
    const loan = loans.find(l => l.id === loanId);
    
    if (amount > 0 && loan) {
      if (amount > loan.remainingAmount) {
        alert('পেমেন্টের পরিমাণ বাকি টাকার চেয়ে বেশি হতে পারে না।');
        return;
      }
      payInstallment(loanId, Date.now().toString(), amount);
      setShowPayment(null);
      setPaymentAmount('');
    } else {
      alert('সঠিক পরিমাণ লিখুন।');
    }
  };

  const borrowedLoans = loans.filter(l => l.type === 'borrowed');
  const lentLoans = loans.filter(l => l.type === 'lent');

  // New Record Form
  const NewRecordForm = ({ loan, onClose }: { loan: any, onClose: () => void }) => {
    const { addTransaction, accounts, user, contacts } = useStore();
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
      defaultValues: {
        type: 'payment',
        accountId: accounts[0]?.id || '',
        amount: '',
        date: new Date().toISOString().slice(0, 10),
      }
    });
    const type = watch('type');
    const onSubmit = async (data: any) => {
      if (!user) return;
      const contactName = loan.personName || 'ব্যাক্তি / প্রতিষ্ঠান';
      let note = '';
      if (data.type === 'payment') {
        note = `${contactName} এর ঋণ পরিশোধ।`;
      } else {
        note = `${contactName} এর ঋণ বৃদ্ধি।`;
      }
      await addTransaction({
        amount: Number(data.amount),
        type: data.type === 'payment' ? 'expense' : 'income',
        category: 'লোন / ইন্টারেস্ট',
        accountId: data.accountId,
        date: new Date(data.date),
        time: new Date().toTimeString().slice(0, 5),
        person: contactName,
        note,
        tags: [],
      });
      onClose();
      setToast({ message: 'নতুন রেকর্ড সফলভাবে যোগ হয়েছে!' });
      setTimeout(() => setToast(null), 3000);
    };
    return (
      <>
        <h2 className={`text-lg md:text-xl font-bold text-center mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>নতুন রেকর্ড যোগ করুন</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">ধরন *</label>
            <select {...register('type', { required: true })} className="w-full p-2 rounded border">
              <option value="payment">পরিশোধ</option>
              <option value="increase">ঋণ বৃদ্ধি</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">অ্যাকাউন্ট *</label>
            <select {...register('accountId', { required: true })} className="w-full p-2 rounded border">
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} - {acc.balance.toLocaleString()} ৳</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">পরিমাণ *</label>
            <input type="number" step="0.01" {...register('amount', { required: true, min: 0.01 })} className="w-full p-2 rounded border" placeholder="৳" />
            {errors.amount && <span className="text-red-500 text-sm">পরিমাণ আবশ্যক</span>}
          </div>
          <div>
            <label className="block mb-1 font-medium">তারিখ *</label>
            <input type="date" {...register('date', { required: true })} className="w-full p-2 rounded border" />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-gray-200">বাতিল</button>
            <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white">যোগ করুন</button>
          </div>
        </form>
      </>
    );
  };

  // Select Record Modal Component
  const SelectRecordModal = ({ loan, onClose }: { loan: any, onClose: () => void }) => {
    const { darkMode } = useStore();
    
    // Show all transactions with loan/interest category
    const relevantTransactions = transactions.filter(t => 
      t.category === 'লোন / ইন্টারেস্ট'
    );

    const handleSelectTransaction = (transactionId: string) => {
      setSelectedTransactionIds(prev => 
        prev.includes(transactionId) 
          ? prev.filter(id => id !== transactionId)
          : [...prev, transactionId]
      );
    };

    const handleConfirmSelection = () => {
      if (selectedTransactionIds.length > 0) {
        // Here you would link the selected transactions to the loan
        // For now, just show a success message
        setToast({ message: `${selectedTransactionIds.length}টি রেকর্ড সফলভাবে যুক্ত হয়েছে!` });
        setTimeout(() => setToast(null), 3000);
        setSelectedTransactionIds([]);
        // Add a small delay to prevent modal flickering
        setTimeout(() => {
          onClose();
        }, 100);
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={(e) => {
          // Only close if clicking directly on the backdrop
          if (e.target === e.currentTarget) {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 30, rotateX: -15 }}
          animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 30, rotateX: -15 }}
          transition={{ 
            type: "spring", 
            damping: 30, 
            stiffness: 300,
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
          className={`${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-white via-gray-50 to-white'} rounded-3xl shadow-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="p-6 border-b border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-2xl md:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} tracking-wide`}>
                  সিলেক্ট রেকর্ড
                </h2>
                <div className={`w-20 h-1 ${darkMode ? 'bg-green-500' : 'bg-green-600'} rounded-full mt-2`}></div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
                  সব লোন/ইন্টারেস্ট রেকর্ড থেকে নির্বাচন করুন
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className={`p-3 rounded-xl transition-all duration-300 ${darkMode ? 'hover:bg-red-900/40 text-gray-400 hover:text-red-400' : 'hover:bg-red-100 text-gray-600 hover:text-red-600'}`}
              >
                <X size={20} />
              </motion.button>
            </div>
            
            {/* Stats Bar */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                    {relevantTransactions.length}
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    মোট রেকর্ড
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {selectedTransactionIds.length}
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    নির্বাচিত
                  </div>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedTransactionIds.length > 0
                  ? darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'
                  : darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'
              }`}>
                {selectedTransactionIds.length > 0 ? 'রেকর্ড নির্বাচিত হয়েছে' : 'রেকর্ড নির্বাচন করুন'}
              </div>
            </div>
          </motion.div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {relevantTransactions.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-8 text-center shadow-lg`}
              >
                <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>কোন লোন/ইন্টারেস্ট রেকর্ড পাওয়া যায়নি</p>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-2"
              >
                {relevantTransactions.map((transaction, index) => (
                  <div key={transaction.id} className="flex items-center">
                    <div onClick={(e) => e.stopPropagation()}>
                      <ThemedCheckbox
                        checked={selectedTransactionIds.includes(transaction.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectTransaction(transaction.id);
                        }}
                        disabled={false}
                      />
                    </div>
                    <div className="flex-1 ml-8">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        whileHover={{ scale: 1.01, y: -2 }}
                        className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm cursor-pointer`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSelectTransaction(transaction.id);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <motion.div 
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              className="text-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-xl p-3 shadow-md"
                            >
                              💰
                            </motion.div>
                            <div className="flex-1">
                              <div className={`flex items-center space-x-2`}>
                                <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>লোন / ইন্টারেস্ট</h3>
                                <div className={`${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                  {transaction.type === 'income' ? '📈' : '📉'}
                                </div>
                              </div>
                              <p className={`text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {new Date(transaction.date).toLocaleDateString('bn-BD')} • {transaction.time}
                              </p>
                              {transaction.note && (
                                <p className={`text-base ${darkMode ? 'text-gray-300' : 'text-gray-700'} mt-1`}>{transaction.note}</p>
                              )}
                              {transaction.person && (
                                <p className={`text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>ব্যক্তি / প্রতিষ্ঠান: {transaction.person}</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className={`text-2xl font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toLocaleString()} ৳
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Footer */}
          {relevantTransactions.length > 0 && (
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>নির্বাচিত: {selectedTransactionIds.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={onClose}
                    className={`px-4 py-2 rounded-lg border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                  >
                    বাতিল
                  </button>
                  <button
                    onClick={handleConfirmSelection}
                    disabled={selectedTransactionIds.length === 0}
                    className={`px-4 py-2 rounded-lg ${
                      selectedTransactionIds.length === 0
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    নির্বাচিত রেকর্ড যুক্ত করুন
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    );
  };

  // Record Modal
  const RecordModal = ({ loan, onClose }: { loan: any, onClose: () => void }) => {
    if (recordMode === 'select') {
      return <SelectRecordModal loan={loan} onClose={onClose} />;
    } else if (recordMode === 'new') {
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
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-md`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg md:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                রেকর্ড যোগ করুন
              </h2>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-red-900/40' : 'hover:bg-red-100'}`}
              >
                <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
              </button>
            </div>
            <NewRecordForm loan={loan} onClose={onClose} />
          </motion.div>
        </motion.div>
      );
    }

    // Initial modal with two options
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
          className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-md`}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-lg md:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              রেকর্ড যোগ করুন
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-red-900/40' : 'hover:bg-red-100'}`}
            >
              <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
            </button>
          </div>

          <div className="space-y-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setRecordMode('select')}
              className={`w-full p-4 rounded-xl border-2 border-dashed transition-all ${
                darkMode 
                  ? 'border-blue-500 bg-blue-900/20 hover:bg-blue-900/30 text-blue-400' 
                  : 'border-blue-500 bg-blue-50 hover:bg-blue-100 text-blue-600'
              }`}
            >
              <div className="flex items-center justify-center space-x-3">
                <Search size={24} />
                <div className="text-left">
                  <div className="font-semibold text-lg">সিলেক্ট রেকর্ড</div>
                  <div className="text-sm opacity-80">পূর্বাবস্থায় যোগ করা রেকর্ড থেকে নির্বাচন করুন</div>
                </div>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setRecordMode('new')}
              className={`w-full p-4 rounded-xl border-2 border-dashed transition-all ${
                darkMode 
                  ? 'border-green-500 bg-green-900/20 hover:bg-green-900/30 text-green-400' 
                  : 'border-green-500 bg-green-50 hover:bg-green-100 text-green-600'
              }`}
            >
              <div className="flex items-center justify-center space-x-3">
                <Plus size={24} />
                <div className="text-left">
                  <div className="font-semibold text-lg">নতুন রেকর্ড</div>
                  <div className="text-sm opacity-80">নতুন রেকর্ড যোগ করুন</div>
                </div>
              </div>
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} tracking-wide mb-0`}>
            ঋণ ও পাওনা ব্যবস্থাপনা
          </h1>
          <div className={`w-20 h-1 ${darkMode ? 'bg-green-500' : 'bg-green-600'} rounded-full mt-2`}></div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700"
        >
          <Plus size={20} />
          <span>নতুন ঋণ/পাওনা</span>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Borrowed Money */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6`}
        >
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
            <ArrowDownLeft size={20} className="mr-2 text-red-500" />
            ঋণ (যা নিয়েছি)
          </h2>
          <div className="space-y-4">
            {borrowedLoans.map((loan) => {
              const percentPaid = loan.amount > 0 ? ((loan.amount - loan.remainingAmount) / loan.amount) * 100 : 0;
              return (
                <motion.div
                  key={loan.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`relative overflow-hidden group p-0 rounded-2xl shadow-lg border-l-4 ${
                    loan.isCompleted
                      ? 'border-green-500'
                      : 'border-red-500'
                  } ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-700 border-gray-700' : 'bg-gradient-to-br from-white to-gray-100 border-gray-200'} mb-1`}
                >
                  {/* Card Content */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4">
                    {/* Left: Person Info */}
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md ${darkMode ? 'bg-red-900/30' : 'bg-red-100'}`}>
                        <Users size={24} className="text-red-500" />
                      </div>
                      <div className="min-w-0">
                        <div className={`font-bold text-lg md:text-xl truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{loan.personName}</div>
                        {/* Show note if present, directly below name */}
                        {loan.note && (
                          <div className={`mt-0.5 flex items-start gap-1 rounded px-1.5 py-0.5 text-xs ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                            <MessageSquare size={12} className={darkMode ? 'text-green-300 mt-0.5' : 'text-green-600 mt-0.5'} />
                            <span className="whitespace-pre-line">{loan.note}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 md:gap-3">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEdit(loan)}
                        className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} shadow-md`}
                        title="সম্পাদনা"
                      >
                        <Edit2 size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowDeleteConfirm(loan.id)}
                        className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} shadow-md`}
                        title="ডিলিট করুন"
                      >
                        <Trash2 size={16} className="text-red-500" />
                      </motion.button>
                    </div>
                  </div>
                  {/* Info Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 px-5 pb-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>মোট: <span className="font-bold">{loan.amount.toLocaleString()} ৳</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowDownLeft size={16} className="text-red-500" />
                      <span className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>বাকি: <span className={`font-bold ${loan.isCompleted ? 'text-green-500' : 'text-red-500'}`}>{loan.remainingAmount.toLocaleString()} ৳</span></span>
                    </div>
                    {loan.dueDate && (
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-yellow-400" />
                        <span className={`text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>শেষ তারিখ: <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{format(new Date(loan.dueDate), 'dd MMM yyyy')}</span></span>
                      </div>
                    )}
                  </div>
                  {/* Progress Bar */}
                  <div className="px-5 pb-4">
                    <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                        style={{ width: `${percentPaid}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>পরিশোধ: {percentPaid.toFixed(0)}%</span>
                      {loan.isCompleted && <span className="text-green-600 font-semibold">✅ সম্পূর্ণ</span>}
                    </div>
                    {/* Payment Record Button at bottom of card */}
                    {!loan.isCompleted && (
                      <motion.button
                        whileHover={{ scale: 1.07 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => { setShowRecordModal(loan.id); setRecordMode(null); }}
                        className={`w-full mt-4 px-5 py-2.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg focus:outline-none focus:ring-2 transition-all duration-200
                          ${loan.isCompleted ?
                            'bg-gradient-to-r from-green-500 to-green-700 text-white hover:from-green-600 hover:to-green-800 focus:ring-green-400' :
                            'bg-gradient-to-r from-red-500 to-red-700 text-white hover:from-red-600 hover:to-red-800 focus:ring-red-400'}
                        `}
                      >
                        <motion.span
                          whileHover={{ rotate: 90, scale: 1.2 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                          className="flex items-center"
                        >
                          <Plus size={20} className="mr-1" />
                        </motion.span>
                        রেকর্ড যুক্ত করুন
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
            {borrowedLoans.length === 0 && (
              <p className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                কোন ঋণ নেই
              </p>
            )}
          </div>
        </motion.div>

        {/* Lent Money */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6`}
        >
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
            <ArrowUpRight size={20} className="mr-2 text-green-500" />
            পাওনা (যা দিয়েছি)
          </h2>
          <div className="space-y-4">
            {lentLoans.map((loan) => (
              <motion.div
                key={loan.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} ${
                  loan.isCompleted ? 'ring-2 ring-green-500' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Users size={16} className="text-green-500" />
                    <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {loan.personName}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!loan.isCompleted && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowPayment(loan.id)}
                        className="p-1 rounded bg-green-600 text-white hover:bg-green-700"
                        title="পেমেন্ট পেয়েছি"
                      >
                        <DollarSign size={12} />
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEdit(loan)}
                      className={`p-1 rounded ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                    >
                      <Edit2 size={12} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowDeleteConfirm(loan.id)}
                      className={`p-1 rounded ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                    >
                      <Trash2 size={12} className="text-red-500" />
                    </motion.button>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      মোট পরিমাণ:
                    </span>
                    <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {loan.amount.toLocaleString()} ৳
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      বাকি:
                    </span>
                    <span className={`text-sm font-medium ${loan.isCompleted ? 'text-green-600' : 'text-orange-600'}`}>
                      {loan.remainingAmount.toLocaleString()} ৳
                    </span>
                  </div>
                  {loan.dueDate && (
                    <div className="flex justify-between">
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        শেষ তারিখ:
                      </span>
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {format(new Date(loan.dueDate), 'dd MMM yyyy')}
                      </span>
                    </div>
                  )}
                  {loan.isCompleted && (
                    <div className="text-center text-green-600 font-medium text-sm mt-2">
                      ✅ ফেরত পেয়েছি
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            {lentLoans.length === 0 && (
              <p className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                কোন পাওনা নেই
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Loan Form Modal */}
      <AnimatePresence>
        {showForm && (
          <LoanForm
            loan={editingLoan}
            onClose={handleCloseForm}
            onSubmit={() => {
              handleCloseForm();
              setToast({ message: 'ঋণ/পাওনা সফলভাবে আপডেট হয়েছে!' });
              setTimeout(() => setToast(null), 3000);
            }}
          />
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowPayment(null)}
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
              className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-md`}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.h3 
                className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                পেমেন্ট রেকর্ড করুন
              </motion.h3>
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="পরিমাণ লিখুন"
                  className={`w-full px-3 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                />
                <motion.div 
                  className="flex space-x-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowPayment(null)}
                    className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                      darkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    বাতিল
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.07 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handlePayment(showPayment)}
                    className={`flex-1 px-5 py-2.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg focus:outline-none focus:ring-2 transition-all duration-200
                      ${(() => {
                        const loan = loans.find(l => l.id === showPayment);
                        if (loan && loan.type === 'borrowed') {
                          return 'bg-gradient-to-r from-red-500 to-red-700 text-white hover:from-red-600 hover:to-red-800 focus:ring-red-400';
                        } else {
                          return 'bg-gradient-to-r from-green-500 to-green-700 text-white hover:from-green-600 hover:to-green-800 focus:ring-green-400';
                        }
                      })()}
                    `}
                  >
                    <motion.span
                      whileHover={{ rotate: 20, scale: 1.2 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                      className="flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </motion.span>
                    রেকর্ড করুন
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowDeleteConfirm(null)}
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
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-md`}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <motion.h3 
                className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                ঋণ/পাওনা মুছবেন?
              </motion.h3>
              <motion.p 
                className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                এই রেকর্ডটি স্থায়ীভাবে মুছে ফেলা হবে। এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
              </motion.p>
              <motion.div 
                className="flex space-x-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteConfirm(null)}
                  className={`flex-1 px-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  বাতিল
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  মুছে ফেলুন
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Record Modal */}
      <AnimatePresence>
        {showRecordModal && (
          <RecordModal 
            loan={loans.find(l => l.id === showRecordModal)} 
            onClose={() => {
              setShowRecordModal(null);
              setRecordMode(null);
              setSelectedTransactionIds([]);
            }} 
          />
        )}
      </AnimatePresence>

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
