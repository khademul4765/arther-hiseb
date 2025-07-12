import React, { useState, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { GoalForm } from './GoalForm';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Target, DollarSign, X, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ThemedCheckbox } from '../common/ThemedCheckbox';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { DatePickerHeader, CustomCalendarContainer } from '../common/DatePickerHeader';

export const GoalManager: React.FC = () => {
  const { goals, deleteGoal, addToGoal, darkMode, updateGoal } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showAddMoney, setShowAddMoney] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState('');
  const [addDate, setAddDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [addNote, setAddNote] = useState('');
  const [toast, setToast] = useState<{ message: string; action?: () => void } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const undoTimeout = useRef<NodeJS.Timeout | null>(null);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [selectedGoalForDetails, setSelectedGoalForDetails] = useState<any>(null);
  const addMoneyDatePickerRef = useRef<any>(null);
  const [editingDeposit, setEditingDeposit] = useState<{ idx: number; entry: any } | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNote, setEditNote] = useState('');
  const [showEditForm, setShowEditForm] = useState(false);
  const editDatePickerRef = useRef<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Custom input for date picker (matches TransactionForm)
  const DateInput = React.forwardRef<HTMLInputElement, any>(({ value, onClick, placeholder, darkMode }, ref) => (
    <div
      className={`flex items-center w-full rounded-lg border ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'} shadow-sm focus-within:ring-2 focus-within:ring-green-400 focus-within:border-transparent transition-all`}
      tabIndex={0}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <Calendar size={22} className={`ml-3 mr-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
      <input
        ref={ref}
        type="text"
        value={value || ''}
        readOnly
        placeholder={placeholder}
        className={`w-full pl-2 pr-3 py-3 rounded-r-lg border-0 bg-transparent text-lg ${darkMode ? 'text-gray-100' : 'text-gray-900'} focus:ring-0 focus:border-transparent focus:outline-none`}
        style={{ cursor: 'pointer' }}
      />
    </div>
  ));

  // Close deposit details modal on Escape key
  React.useEffect(() => {
    if (!selectedGoalForDetails) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedGoalForDetails(null);
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [selectedGoalForDetails]);

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
      addToGoal(goalId, amount, addDate, addNote);
      setShowAddMoney(null);
      setAddAmount('');
      setAddDate(new Date().toISOString().slice(0, 10));
      setAddNote('');
    } else {
      alert('সঠিক পরিমাণ লিখুন।');
    }
  };

  // Save edited deposit
  const handleSaveDepositEdit = async (goalId: string) => {
    if (!editingDeposit) return;
    setEditLoading(true);
    setEditError('');
    try {
      const { idx } = editingDeposit;
      const goal = goals.find(g => g.id === goalId);
      if (!goal) throw new Error('Goal not found');
      const newDepositHistory = [...((goal as any).depositHistory || [])];
      newDepositHistory[idx] = {
        ...newDepositHistory[idx],
        amount: parseFloat(editAmount),
        date: editDate,
        note: editNote,
      };
      await updateGoal(goalId, { depositHistory: newDepositHistory } as any);
      // Refresh selectedGoalForDetails with latest goal from store
      const updatedGoal = goals.find(g => g.id === goalId);
      if (updatedGoal) setSelectedGoalForDetails(updatedGoal);
      setEditingDeposit(null);
      setShowEditForm(false);
      setEditAmount('');
      setEditDate('');
      setEditNote('');
    } catch (err: any) {
      setEditError('সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।');
      console.error(err);
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditDeposit = (entry: any, idx: number) => {
    setEditingDeposit({ idx, entry });
    setEditAmount(entry.amount.toString());
    
    // Validate and format the date properly
    let validDate = '';
    if (entry.date) {
      const dateObj = new Date(entry.date);
      if (!isNaN(dateObj.getTime())) {
        validDate = dateObj.toISOString().slice(0, 10);
      }
    }
    setEditDate(validDate);
    setEditNote(entry.note || '');
    setShowEditForm(true);
  };

  const handleCancelEdit = () => {
    setEditingDeposit(null);
    setShowEditForm(false);
    setEditAmount('');
    setEditDate('');
    setEditNote('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} tracking-wide mb-0`}>
            লক্ষ্য ব্যবস্থাপনা
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
              } cursor-pointer`}
              onClick={() => setSelectedGoalForDetails(goal)}
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
                    onClick={e => { e.stopPropagation(); handleEdit(goal); }}
                    className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    <Edit2 size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={e => { e.stopPropagation(); setShowDeleteConfirm(goal.id); }}
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
                    onClick={e => { e.stopPropagation(); setShowAddMoney(goal.id); }}
                    className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2"
                  >
                    <span className="text-lg font-bold">৳</span>
                    <span>জমা করুন</span>
                  </motion.button>
                )}

                {isCompleted && (
                  <div className="w-full bg-green-100 text-green-800 py-2 rounded-lg text-center font-medium">
                    🎉 লক্ষ্য অর্জিত!
                  </div>
                )}
              </div>
              {/* Deposit Details Section (জমার বিস্তারিত) */}
              {/* Now shown in modal below */}
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
      <AnimatePresence>
        {showForm && (
          <GoalForm
            goal={editingGoal}
            onClose={handleCloseForm}
            onSubmit={handleCloseForm}
          />
        )}
      </AnimatePresence>

      {/* Add Money Modal */}
      <AnimatePresence>
        {showAddMoney && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowAddMoney(null)}
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
                লক্ষ্যে টাকা জমা করুন
              </motion.h3>
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <div>
                  <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>পরিমাণ *</label>
                  <div className="relative">
                    <span className={`absolute left-3 top-3 text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>৳</span>
                    <input
                      type="number"
                      value={addAmount}
                      onChange={(e) => setAddAmount(e.target.value)}
                      placeholder="০.০০"
                      className={`w-full pl-10 pr-3 py-3 rounded-lg border text-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-green-500 focus:border-transparent focus:outline-none`}
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>তারিখ *</label>
                  <ReactDatePicker
                    ref={addMoneyDatePickerRef}
                    selected={addDate ? new Date(addDate) : null}
                    onChange={dateObj => {
                      if (dateObj) {
                        const iso = dateObj.toISOString().slice(0, 10);
                        setAddDate(iso);
                      } else {
                        setAddDate('');
                      }
                    }}
                    dateFormat="yyyy-MM-dd"
                    locale="bn"
                    placeholderText="তারিখ বাছাই করুন"
                    customInput={
                      <DateInput
                        darkMode={darkMode}
                        placeholder="তারিখ বাছাই করুন"
                      />
                    }
                    calendarClassName={`${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'} rounded-xl shadow-lg border-0 font-bengali pb-12`}
                    popperPlacement="bottom-start"
                    isClearable
                    renderCustomHeader={props => (
                      <DatePickerHeader {...props} darkMode={darkMode} datePickerRef={addMoneyDatePickerRef} />
                    )}
                    calendarContainer={props => (
                      <CustomCalendarContainer
                        {...props}
                        onToday={() => {
                          setAddDate(new Date().toISOString().slice(0, 10));
                          if (addMoneyDatePickerRef.current && addMoneyDatePickerRef.current.setOpen) {
                            addMoneyDatePickerRef.current.setOpen(false);
                          }
                        }}
                        onClear={() => {
                          setAddDate('');
                          if (addMoneyDatePickerRef.current && addMoneyDatePickerRef.current.setOpen) {
                            addMoneyDatePickerRef.current.setOpen(false);
                          }
                        }}
                        darkMode={darkMode}
                      />
                    )}
                  />
                </div>
                <div>
                  <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>নোট (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    value={addNote}
                    onChange={e => setAddNote(e.target.value)}
                    placeholder="নোট (ঐচ্ছিক)"
                    className={`w-full px-3 py-3 rounded-lg border text-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-green-500 focus:border-transparent focus:outline-none`}
                  />
                </div>
                <motion.div 
                  className="flex space-x-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddMoney(null)}
                    className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                      darkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    বাতিল
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAddMoney(showAddMoney)}
                    className="flex-1 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                  >
                    জমা করুন
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
              <motion.h3 
                className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                লক্ষ্য মুছবেন?
              </motion.h3>
              <motion.p 
                className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                এই লক্ষ্যটি স্থায়ীভাবে মুছে ফেলা হবে। এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
              </motion.p>
              <motion.div 
                className="flex space-x-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDeleteConfirm(null)}
                  className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  বাতিল
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  মুছে ফেলুন
                </motion.button>
              </motion.div>
            </motion.div>
          </motion.div>
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

      {/* Deposit Details Modal */}
      <AnimatePresence>
        {selectedGoalForDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedGoalForDetails(null)}
          >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
                  <Target size={24} className="text-purple-600" />
                </div>
                <div>
                  <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedGoalForDetails.name}
                  </h2>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    জমার বিস্তারিত তথ্য
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedGoalForDetails(null)}
                className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
              >
                <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
              </button>
            </div>

            {/* Goal Progress Summary */}
            <div className={`mb-6 p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedGoalForDetails.currentAmount.toLocaleString()} ৳
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    বর্তমান জমা
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {selectedGoalForDetails.targetAmount.toLocaleString()} ৳
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    লক্ষ্যমাত্রা
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                    {Math.round((selectedGoalForDetails.currentAmount / selectedGoalForDetails.targetAmount) * 100)}%
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    অগ্রগতি
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden`}>
                  <div 
                    className={`h-full bg-gradient-to-r from-purple-500 to-green-500 rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min((selectedGoalForDetails.currentAmount / selectedGoalForDetails.targetAmount) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Deposit History */}
            <div className="flex-1 overflow-y-auto">
            {selectedGoalForDetails.depositHistory && selectedGoalForDetails.depositHistory.length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(
                    selectedGoalForDetails.depositHistory.reduce((acc: any, entry: any, idx: number) => {
                      let dateKey = 'অজানা';
                      if (entry.date && !isNaN(new Date(entry.date).getTime())) {
                        dateKey = new Date(entry.date).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
                      }
                  if (!acc[dateKey]) acc[dateKey] = [];
                      acc[dateKey].push({ ...entry, _idx: idx });
                  return acc;
                    }, {} as { [date: string]: (any & { _idx: number })[] })
                  ).sort((a, b) => {
                    // Sort by date, with "অজানা" at the end
                    if (a[0] === 'অজানা') return 1;
                    if (b[0] === 'অজানা') return -1;
                    return new Date(b[0]).getTime() - new Date(a[0]).getTime();
                  })
                .map(([date, entries]) => (
                      <div key={date} className="space-y-3">
                        {/* Date Header */}
                        <div className={`flex items-center space-x-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}> 
                          <Calendar size={16} className="text-purple-500" />
                          <h3 className="font-semibold text-lg">{date}</h3>
                          <div className={`flex-1 h-px ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                        </div>
                        {/* Entries */}
                    <div className="space-y-2">
                          {(entries as any[]).slice().reverse().map((entry: any, idx: number) => (
                            editingDeposit && editingDeposit.idx === entry._idx ? (
                              <div key={idx} className={`flex items-center justify-between p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-white'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'} transition-all duration-200`}>
                                <div className="flex flex-col gap-2 w-full">
                                  <input
                                    type="number"
                                    value={editAmount}
                                    onChange={e => setEditAmount(e.target.value)}
                                    className={`mb-1 px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                  />
                                  <input
                                    type="date"
                                    value={editDate}
                                    onChange={e => setEditDate(e.target.value)}
                                    className={`mb-1 px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                  />
                                  <input
                                    type="text"
                                    value={editNote}
                                    onChange={e => setEditNote(e.target.value)}
                                    className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                                  />
                                </div>
                                <div className="flex flex-col gap-2 ml-4">
                                  <button onClick={() => handleSaveDepositEdit(selectedGoalForDetails.id)} className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700">Save</button>
                                  <button onClick={() => setEditingDeposit(null)} className="px-3 py-1 rounded bg-gray-400 text-white hover:bg-gray-500">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <motion.div 
                                key={idx} 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`flex items-center justify-between p-4 rounded-xl ${darkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'} transition-all duration-200 hover:shadow-md`}
                              > 
                                <div className="flex items-center space-x-3">
                                  <div className={`p-2 rounded-lg flex items-center justify-center text-green-600 text-xl font-bold ${darkMode ? 'bg-green-900/30' : 'bg-green-100'}`}>৳</div>
                          <div>
                                    <div className={`font-bold text-xl ${darkMode ? 'text-white' : 'text-gray-900'}`}>{entry.amount.toLocaleString()} ৳</div>
                                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{entry.note || 'কোনো নোট নেই'}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {/* Removed time and English date display */}
                                  <button
                                    className="ml-3 p-2 rounded hover:bg-green-100 dark:hover:bg-green-900/30"
                                    onClick={() => handleEditDeposit(entry, entry._idx)}
                                    title="Edit"
                                  >
                                    <Edit2 size={18} className="text-green-600" />
                                  </button>
                          </div>
                              </motion.div>
                            )
                          ))}
                        </div>
                        </div>
                      ))}
                    </div>
              ) : (
                <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <div className={`p-4 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} inline-block mb-4`}>
                    <Target size={32} className="text-gray-400" />
                  </div>
                  <p className="text-lg font-medium mb-2">কোনো জমার বিস্তারিত নেই</p>
                  <p className="text-sm">এই লক্ষ্যে এখনও কোনো টাকা জমা করা হয়নি</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Edit Deposit Form Modal */}
      <AnimatePresence>
        {showEditForm && editingDeposit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={handleCancelEdit}
          >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-md`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                জমা সম্পাদনা করুন
              </h3>
              <button
                onClick={handleCancelEdit}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>পরিমাণ *</label>
                <div className="relative">
                  <span className={`absolute left-3 top-3 text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>৳</span>
                  <input
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="০.০০"
                    className={`w-full pl-10 pr-3 py-3 rounded-lg border text-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-green-500 focus:border-transparent focus:outline-none`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>তারিখ *</label>
                <ReactDatePicker
                  ref={editDatePickerRef}
                  selected={editDate && !isNaN(new Date(editDate).getTime()) ? new Date(editDate) : null}
                  onChange={dateObj => {
                    if (dateObj) {
                      const iso = dateObj.toISOString().slice(0, 10);
                      setEditDate(iso);
                    } else {
                      setEditDate('');
                    }
                  }}
                  dateFormat="yyyy-MM-dd"
                  locale="bn"
                  placeholderText="তারিখ বাছাই করুন"
                  customInput={
                    <DateInput
                      darkMode={darkMode}
                      placeholder="তারিখ বাছাই করুন"
                    />
                  }
                  calendarClassName={`${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'} rounded-xl shadow-lg border-0 font-bengali pb-12`}
                  popperPlacement="bottom-start"
                  isClearable
                  renderCustomHeader={props => (
                    <DatePickerHeader {...props} darkMode={darkMode} datePickerRef={editDatePickerRef} />
                  )}
                  calendarContainer={props => (
                    <CustomCalendarContainer
                      {...props}
                      onToday={() => {
                        setEditDate(new Date().toISOString().slice(0, 10));
                        if (editDatePickerRef.current && editDatePickerRef.current.setOpen) {
                          editDatePickerRef.current.setOpen(false);
                        }
                      }}
                      onClear={() => {
                        setEditDate('');
                        if (editDatePickerRef.current && editDatePickerRef.current.setOpen) {
                          editDatePickerRef.current.setOpen(false);
                        }
                      }}
                      darkMode={darkMode}
                    />
                  )}
                />
              </div>

              <div>
                <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>নোট (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
                  placeholder="নোট (ঐচ্ছিক)"
                  className={`w-full px-3 py-3 rounded-lg border text-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-green-500 focus:border-transparent focus:outline-none`}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleCancelEdit}
                  className={`flex-1 px-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  disabled={editLoading}
                >
                  বাতিল
                </button>
                <button
                  onClick={() => handleSaveDepositEdit(selectedGoalForDetails.id)}
                  className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                  disabled={editLoading}
                >
                  {editLoading ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
              {editError && <div className="text-red-500 text-center pt-2">{editError}</div>}
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};
