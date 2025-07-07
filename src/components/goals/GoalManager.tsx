import React, { useState, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { GoalForm } from './GoalForm';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Target, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export const GoalManager: React.FC = () => {
  const { goals, deleteGoal, addToGoal, darkMode } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showAddMoney, setShowAddMoney] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState('');
  const [toast, setToast] = useState<{ message: string; action?: () => void } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const undoTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleEdit = (goal: any) => {
    setEditingGoal(goal);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setPendingDelete(id);
    setToast({
      message: 'লক্ষ্য মুছে ফেলা হয়েছে',
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
    deleteGoal(id);
  };

  const handleUndo = () => {
    if (undoTimeout.current) clearTimeout(undoTimeout.current);
    setToast(null);
    setPendingDelete(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingGoal(null);
  };

  const handleAddMoney = (goalId: string) => {
    const amount = parseFloat(addAmount);
    const goal = goals.find(g => g.id === goalId);
    
    if (amount > 0 && goal) {
      const newTotal = goal.currentAmount + amount;
      if (newTotal > goal.targetAmount) {
        alert('মোট জমা লক্ষ্যমাত্রার চেয়ে বেশি হতে পারে না।');
        return;
      }
      addToGoal(goalId, amount, Date.now().toString());
      setShowAddMoney(null);
      setAddAmount('');
    } else {
      alert('সঠিক পরিমাণ লিখুন।');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          লক্ষ্য ব্যবস্থাপনা
        </h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700"
        >
          <Plus size={20} />
          <span>নতুন লক্ষ্য</span>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const percentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          const isCompleted = goal.isCompleted;
          const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6 hover:shadow-md transition-shadow ${
                isCompleted ? 'ring-2 ring-green-500' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Target size={20} className={isCompleted ? 'text-green-600' : 'text-purple-600'} />
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {goal.name}
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleEdit(goal)}
                    className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    <Edit2 size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowDeleteConfirm(goal.id)}
                    className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </motion.button>
                </div>
              </div>

              <div className="space-y-4">
                {/* Progress Circle */}
                <div className="flex items-center justify-center">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={darkMode ? '#374151' : '#E5E7EB'}
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke={isCompleted ? '#10B981' : '#8B5CF6'}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${percentage * 2.513} 251.3`}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {Math.round(percentage)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Amount Info */}
                <div className="text-center">
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {goal.currentAmount.toLocaleString()} ৳
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    লক্ষ্য: {goal.targetAmount.toLocaleString()} ৳
                  </p>
                </div>

                {/* Deadline */}
                <div className="text-center">
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    শেষ তারিখ: {format(new Date(goal.deadline), 'dd MMM yyyy')}
                  </p>
                  {!isCompleted && (
                    <p className={`text-xs ${daysLeft > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {daysLeft > 0 ? `${daysLeft} দিন বাকি` : 'সময় শেষ'}
                    </p>
                  )}
                </div>

                {/* Add Money Button */}
                {!isCompleted && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAddMoney(goal.id)}
                    className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2"
                  >
                    <DollarSign size={16} />
                    <span>জমা করুন</span>
                  </motion.button>
                )}

                {isCompleted && (
                  <div className="w-full bg-green-100 text-green-800 py-2 rounded-lg text-center font-medium">
                    🎉 লক্ষ্য অর্জিত!
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {goals.length === 0 && (
          <div className={`col-span-full ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-8 text-center`}>
            <Target size={48} className={`mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              কোন লক্ষ্য তৈরি করা হয়নি
            </p>
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-2`}>
              আপনার আর্থিক লক্ষ্য নির্ধারণ করুন
            </p>
          </div>
        )}
      </div>

      {/* Goal Form Modal */}
      {showForm && (
        <GoalForm
          goal={editingGoal}
          onClose={handleCloseForm}
          onSubmit={handleCloseForm}
        />
      )}

      {/* Add Money Modal */}
      {showAddMoney && (
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
              লক্ষ্যে টাকা জমা করুন
            </h3>
            <div className="space-y-4">
              <input
                type="number"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                placeholder="পরিমাণ লিখুন"
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
              />
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddMoney(null)}
                  className={`flex-1 px-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  বাতিল
                </button>
                <button
                  onClick={() => handleAddMoney(showAddMoney)}
                  className="flex-1 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700"
                >
                  জমা করুন
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
              লক্ষ্য মুছবেন?
            </h3>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
              এই লক্ষ্যটি স্থায়ীভাবে মুছে ফেলা হবে। এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
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
