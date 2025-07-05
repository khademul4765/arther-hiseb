import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, Edit2, Save, X, Camera, Shield, Award, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

export const AccountPage: React.FC = () => {
  const { user, setUser, accounts, transactions, budgets, goals, loans, darkMode } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async () => {
    if (!user || !auth.currentUser) return;
    
    setLoading(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        displayName: editName
      });

      // Update Firestore user document
      await updateDoc(doc(db, 'users', user.id), {
        name: editName
      });

      // Update local state
      setUser({
        ...user,
        name: editName
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
      alert('প্রোফাইল আপডেট করতে সমস্যা হয়েছে');
    } finally {
      setLoading(false);
    }
  };

  // Calculation helpers with leading zero formatting
  const formatAmount = (amount: number) => amount < 10 ? `0${amount.toLocaleString()}` : amount.toLocaleString();

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const completedGoals = goals.filter(g => g.isCompleted).length;
  const activeBudgets = budgets.filter(b => b.isActive).length;
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  const accountAge = user ? Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  const getAccountLevel = () => {
    const transactionCount = transactions.length;
    if (transactionCount >= 100) return { level: 'এক্সপার্ট', color: 'text-purple-600', bg: 'bg-purple-100' };
    if (transactionCount >= 50) return { level: 'অভিজ্ঞ', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (transactionCount >= 20) return { level: 'মধ্যম', color: 'text-green-600', bg: 'bg-green-100' };
    return { level: 'নতুন', color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  const accountLevel = getAccountLevel();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          প্রোফাইল
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`lg:col-span-1 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6`}
        >
          <div className="text-center">
            {/* Profile Picture */}
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <button className="absolute bottom-0 right-0 bg-green-600 text-white p-2 rounded-full hover:bg-green-700">
                <Camera size={16} />
              </button>
            </div>

            {/* Name */}
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-center ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleUpdateProfile}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-1"
                  >
                    <Save size={16} />
                    <span>{loading ? 'সংরক্ষণ...' : 'সংরক্ষণ'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditName(user?.name || '');
                    }}
                    className={`flex-1 border py-2 rounded-lg flex items-center justify-center space-x-1 ${
                      darkMode 
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <X size={16} />
                    <span>বাতিল</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                  {user?.name}
                </h2>
                <button
                  onClick={() => setIsEditing(true)}
                  className={`text-sm ${darkMode ? 'text-green-400' : 'text-green-600'} hover:underline flex items-center space-x-1 mx-auto`}
                >
                  <Edit2 size={14} />
                  <span>সম্পাদনা করুন</span>
                </button>
              </div>
            )}

            {/* Account Level */}
            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ${accountLevel.bg} mt-3`}>
              <Award size={16} className={accountLevel.color} />
              <span className={`text-sm font-medium ${accountLevel.color}`}>
                {accountLevel.level} ব্যবহারকারী
              </span>
            </div>
          </div>

          {/* Account Info */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center space-x-3">
              <Mail size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {user?.email}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                যোগদান: {user ? format(new Date(user.createdAt), 'dd MMM yyyy') : ''}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Shield size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {accountAge} দিন সক্রিয়
              </span>
            </div>
          </div>
        </motion.div>

        {/* Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`lg:col-span-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6`}
        >
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6 flex items-center`}>
            <TrendingUp size={20} className="mr-2" />
            আপনার পরিসংখ্যান
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="text-center">
                <p className={`text-2xl font-bold text-green-600`}>
                  {transactions.length}
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  মোট লেনদেন
                </p>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="text-center">
                <p className={`text-2xl font-bold text-blue-600`}>
                  {activeBudgets}
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  সক্রিয় বাজেট
                </p>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="text-center">
                <p className={`text-2xl font-bold text-purple-600`}>
                  {completedGoals}
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  সম্পূর্ণ লক্ষ্য
                </p>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="text-center">
                <p className={`text-2xl font-bold text-orange-600`}>
                  {loans.length}
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  ঋণ/পাওনা
                </p>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg border-l-4 border-green-500 ${darkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
              <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                মোট আয়
              </h4>
              <p className="text-2xl font-bold text-green-600">
                {formatAmount(totalIncome)} ৳
              </p>
            </div>

            <div className={`p-4 rounded-lg border-l-4 border-red-500 ${darkMode ? 'bg-gray-700' : 'bg-red-50'}`}>
              <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                মোট খরচ
              </h4>
              <p className="text-2xl font-bold text-red-600">
                {formatAmount(totalExpense)} ৳
              </p>
            </div>
          </div>

          {/* Net Worth */}
          <div className={`mt-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-blue-50'} border-l-4 border-blue-500`}>
            <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
              নেট সম্পদ
            </h4>
            <p className={`text-3xl font-bold ${totalBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatAmount(totalBalance)} ৳
            </p>
          </div>
        </motion.div>
      </div>

      {/* Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6`}
      >
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6 flex items-center`}>
          <Award size={20} className="mr-2" />
          অর্জনসমূহ
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* First Transaction */}
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} ${transactions.length > 0 ? 'ring-2 ring-green-500' : ''}`}>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transactions.length > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>
                🎯
              </div>
              <div>
                <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  প্রথম লেনদেন
                </h4>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {transactions.length > 0 ? 'সম্পূর্ণ' : 'অসম্পূর্ণ'}
                </p>
              </div>
            </div>
          </div>

          {/* Budget Master */}
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} ${budgets.length >= 3 ? 'ring-2 ring-blue-500' : ''}`}>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${budgets.length >= 3 ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'}`}>
                📊
              </div>
              <div>
                <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  বাজেট মাস্টার
                </h4>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  ৩টি বাজেট তৈরি করুন ({budgets.length}/3)
                </p>
              </div>
            </div>
          </div>

          {/* Goal Achiever */}
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} ${completedGoals >= 1 ? 'ring-2 ring-purple-500' : ''}`}>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${completedGoals >= 1 ? 'bg-purple-100 text-purple-600' : 'bg-gray-200 text-gray-400'}`}>
                🏆
              </div>
              <div>
                <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  লক্ষ্য অর্জনকারী
                </h4>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {completedGoals >= 1 ? 'সম্পূর্ণ' : 'প্রথম লক্ষ্য অর্জন করুন'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
