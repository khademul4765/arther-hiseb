import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { X, Calendar, Clock, User, FileText, Tag, Wallet, Building2, CreditCard } from 'lucide-react';
import { Transaction } from '../../types';

interface TransactionFormProps {
  onClose: () => void;
  onSubmit: () => void;
  transaction?: Transaction;
  defaultType?: 'income' | 'expense';
}

interface FormData {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  accountId: string;
  date: string;
  time: string;
  person: string;
  note: string;
  tags: string;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onClose,
  onSubmit,
  transaction,
  defaultType = 'expense'
}) => {
  const { addTransaction, updateTransaction, categories, accounts, darkMode } = useStore();
  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    defaultValues: transaction ? {
      amount: transaction.amount,
      type: transaction.type as 'income' | 'expense',
      category: transaction.category,
      accountId: transaction.accountId,
      date: transaction.date.toISOString().split('T')[0],
      time: transaction.time,
      person: transaction.person || '',
      note: transaction.note,
      tags: transaction.tags.join(', ')
    } : {
      type: defaultType,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      accountId: accounts[0]?.id || ''
    }
  });

  const selectedType = watch('type');
  const selectedAccountId = watch('accountId');

  const onFormSubmit = (data: FormData) => {
    const transactionData = {
      ...data,
      date: new Date(data.date),
      tags: data.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
    };

    if (transaction) {
      updateTransaction(transaction.id, transactionData);
    } else {
      addTransaction(transactionData);
    }

    onSubmit();
  };

  const expenseCategories = Array.from(new Map(categories.filter(c => c.type === 'expense').map(c => [c.name, c])).values());
  const incomeCategories = Array.from(new Map(categories.filter(c => c.type === 'income').map(c => [c.name, c])).values());
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <Wallet size={16} className="text-green-600" />;
      case 'bank':
        return <Building2 size={16} className="text-blue-600" />;
      case 'credit':
        return <CreditCard size={16} className="text-purple-600" />;
      default:
        return <Wallet size={16} />;
    }
  };

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
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className={`text-lg md:text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {transaction ? 'লেনদেন সম্পাদনা' : 'নতুন লেনদেন'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Amount */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              পরিমাণ *
            </label>
            <div className="relative">
              <span className={`absolute left-3 top-3 md:top-2.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>৳</span>
              <input
                type="number"
                step="0.01"
                {...register('amount', { required: 'পরিমাণ আবশ্যক', min: 0.01 })}
                className={`w-full pl-8 pr-3 py-3 md:py-2 rounded-lg border text-lg md:text-base ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                placeholder="০.০০"
              />
            </div>
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              ধরন *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedType === 'expense' 
                  ? darkMode ? 'border-red-500 bg-red-900/20' : 'border-red-500 bg-red-50'
                  : darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
              }`}>
                <input 
                  type="radio" 
                  value="expense" 
                  {...register('type', { required: 'ধরন নির্বাচন করুন' })} 
                  className="sr-only" 
                />
                <span className={`font-medium ${selectedType === 'expense' ? 'text-red-600' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  খরচ
                </span>
              </label>
              
              <label className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedType === 'income' 
                  ? darkMode ? 'border-green-500 bg-green-900/20' : 'border-green-500 bg-green-50'
                  : darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
              }`}>
                <input 
                  type="radio" 
                  value="income" 
                  {...register('type', { required: 'ধরন নির্বাচন করুন' })} 
                  className="sr-only" 
                />
                <span className={`font-medium ${selectedType === 'income' ? 'text-green-600' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  আয়
                </span>
              </label>
            </div>
          </div>

          {/* Account */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
            অ্যাকাউন্ট *
            </label>
            <select
              {...register('accountId', { required: 'অ্যাকাউন্ট নির্বাচন করুন' })}
              className={`w-full px-3 py-3 md:py-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
            >
              <option value="">অ্যাকাউন্ট নির্বাচন করুন</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} - {account.balance.toLocaleString()} ৳
                </option>
              ))}
            </select>
            {errors.accountId && (
              <p className="text-red-500 text-sm mt-1">{errors.accountId.message}</p>
            )}
            {selectedAccount && (
              <div className={`mt-2 p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center space-x-2">
                  {getAccountIcon(selectedAccount.type)}
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    বর্তমান ব্যালেন্স: {selectedAccount.balance.toLocaleString()} ৳
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              ক্যাটেগরি *
            </label>
            <select
              {...register('category', { required: 'ক্যাটেগরি নির্বাচন করুন' })}
              className={`w-full px-3 py-3 md:py-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
            >
              <option value="">ক্যাটেগরি নির্বাচন করুন</option>
              {selectedType === 'expense' ? (
                expenseCategories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.icon} {category.name}
                  </option>
                ))
              ) : (
                incomeCategories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.icon} {category.name}
                  </option>
                ))
              )}
            </select>
            {errors.category && (
              <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                তারিখ *
              </label>
              <div className="relative">
                <Calendar size={16} className={`absolute left-3 top-3 md:top-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                <input
                  type="date"
                  {...register('date', { required: 'তারিখ আবশ্যক' })}
                  className={`w-full pl-10 pr-3 py-3 md:py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                />
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                সময় *
              </label>
              <div className="relative">
                <Clock size={16} className={`absolute left-3 top-3 md:top-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                <input
                  type="time"
                  {...register('time', { required: 'সময় আবশ্যক' })}
                  className={`w-full pl-10 pr-3 py-3 md:py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                />
              </div>
            </div>
          </div>

          {/* Person */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              ব্যক্তি / প্রতিষ্ঠান
            </label>
            <div className="relative">
              <User size={16} className={`absolute left-3 top-3 md:top-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <input
                type="text"
                {...register('person')}
                className={`w-full pl-10 pr-3 py-3 md:py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                placeholder="ব্যক্তি/ প্রতিষ্ঠানের নাম"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              নোট
            </label>
            <div className="relative">
              <FileText size={16} className={`absolute left-3 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <textarea
                {...register('note')}
                rows={3}
                className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                placeholder="বিস্তারিত লিখুন..."
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              ট্যাগ
            </label>
            <div className="relative">
              <Tag size={16} className={`absolute left-3 top-3 md:top-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <input
                type="text"
                {...register('tags')}
                className={`w-full pl-10 pr-3 py-3 md:py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                placeholder="ট্যাগসমূহ কমা দিয়ে আলাদা করুন"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-3 md:py-2 rounded-lg border ${
                darkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 md:py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium"
            >
              {transaction ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
