import React, { useState, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { LoanForm } from './LoanForm';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Users, ArrowUpRight, ArrowDownLeft, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export const LoanManager: React.FC = () => {
  const { loans, deleteLoan, payInstallment, darkMode } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingLoan, setEditingLoan] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [toast, setToast] = useState<{ message: string; action?: () => void } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const undoTimeout = useRef<NodeJS.Timeout | null>(null);

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
            {borrowedLoans.map((loan) => (
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
                    <Users size={16} className="text-red-500" />
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
                        title="পেমেন্ট করুন"
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
                    <span className={`text-sm font-medium ${loan.isCompleted ? 'text-green-600' : 'text-red-600'}`}>
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
                      ✅ পরিশোধ সম্পূর্ণ
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
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
      {showForm && (
        <LoanForm
          loan={editingLoan}
          onClose={handleCloseForm}
          onSubmit={handleCloseForm}
        />
      )}

      {/* Payment Modal */}
      {showPayment && (
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
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
              পেমেন্ট রেকর্ড করুন
            </h3>
            <div className="space-y-4">
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
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPayment(null)}
                  className={`flex-1 px-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  বাতিল
                </button>
                <button
                  onClick={() => handlePayment(showPayment)}
                  className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                >
                  রেকর্ড করুন
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
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
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
              ঋণ/পাওনা মুছবেন?
            </h3>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
              এই রেকর্ডটি স্থায়ীভাবে মুছে ফেলা হবে। এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className={`flex-1 px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                বাতিল
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                মুছে ফেলুন
              </button>
            </div>
          </motion.div>
        </motion.div>
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
