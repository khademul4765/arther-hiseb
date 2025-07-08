import React, { useState, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { BudgetForm } from './BudgetForm';
import { BudgetDetails } from './BudgetDetails';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, TrendingUp, AlertTriangle, CheckCircle, Clock, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ThemedCheckbox } from '../common/ThemedCheckbox';

export const BudgetManager: React.FC = () => {
  const { budgets, transactions, deleteBudget, darkMode } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; action?: () => void } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const undoTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleEdit = (budget: any) => {
    setEditingBudget(budget);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setPendingDelete(id);
    setToast({
      message: 'বাজেট মুছে ফেলা হয়েছে',
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
    deleteBudget(id);
  };

  const handleUndo = () => {
    if (undoTimeout.current) clearTimeout(undoTimeout.current);
    setToast(null);
    setPendingDelete(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingBudget(null);
  };

  const getBudgetStatus = (budget: any) => {
    const spentAmount = budget.spent || 0;
    const percentage = (spentAmount / budget.amount) * 100;

    if (percentage >= 90) return { status: 'danger', icon: AlertTriangle, color: 'text-red-600', bgColor: 'bg-red-100' };
    if (percentage >= 75) return { status: 'warning', icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { status: 'safe', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} tracking-wide mb-0`}>
            বাজেট ব্যবস্থাপনা
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
          <span>নতুন বাজেট</span>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.map((budget) => {
          const spentAmount = budget.spent || 0;
          const percentage = Math.min((spentAmount / budget.amount) * 100, 100);
          const { status, icon: Icon, color, bgColor } = getBudgetStatus(budget);

          return (
            <motion.div
              key={budget.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6 hover:shadow-md transition-shadow`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp size={20} className="text-blue-600" />
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {budget.name}
                  </h3>
                </div>
                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowDetails(budget.id)}
                    className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    title="বিস্তারিত দেখুন"
                  >
                    <Eye size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleEdit(budget)}
                    className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    <Edit2 size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowDeleteConfirm(budget.id)}
                    className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </motion.button>
                </div>
              </div>

              <div className="space-y-3">
                {/* Categories */}
                <div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                    ক্যাটেগরি ({budget.categories?.length || 0}টি):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(budget.categories || []).slice(0, 3).map((categoryName: string) => (
                      <span
                        key={categoryName}
                        className={`text-xs px-2 py-1 rounded-full ${
                          darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {categoryName}
                      </span>
                    ))}
                    {(budget.categories?.length || 0) > 3 && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}>
                        +{(budget.categories?.length || 0) - 3} আরও
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${bgColor}`}>
                    <Icon size={12} className={color} />
                    <span className={`text-xs font-medium ${color}`}>
                      {Math.round(percentage)}%
                    </span>
                  </div>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {budget.period === 'weekly' ? 'সাপ্তাহিক' : budget.period === 'monthly' ? 'মাসিক' : 'বার্ষিক'}
                  </span>
                </div>

                <div className={`w-full bg-gray-200 rounded-full h-3 ${darkMode ? 'bg-gray-600' : ''}`}>
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      percentage >= 90 ? 'bg-red-500' : 
                      percentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      খরচ হয়েছে
                    </p>
                    <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      ৳{spentAmount.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      বাজেট
                    </p>
                    <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      ৳{budget.amount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {format(new Date(budget.startDate), 'dd MMM yyyy (dd/MM/yyyy)')} - {format(new Date(budget.endDate), 'dd MMM yyyy (dd/MM/yyyy)')}
                </div>
              </div>
            </motion.div>
          );
        })}

        {budgets.length === 0 && (
          <div className={`col-span-full ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-8 text-center`}>
            <TrendingUp size={48} className={`mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              কোন বাজেট তৈরি করা হয়নি
            </p>
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-2`}>
              আপনার খরচ নিয়ন্ত্রণের জন্য বাজেট তৈরি করুন
            </p>
          </div>
        )}
      </div>

      {/* Budget Form Modal */}
      {showForm && (
        <BudgetForm
          budget={editingBudget}
          onClose={handleCloseForm}
          onSubmit={handleCloseForm}
        />
      )}

      {/* Budget Details Modal */}
      {showDetails && (
        <BudgetDetails
          budgetId={showDetails}
          onClose={() => setShowDetails(null)}
        />
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
              বাজেট মুছবেন?
            </h3>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
              এই বাজেটটি স্থায়ীভাবে মুছে ফেলা হবে। এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
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
