import React from 'react';
import { useStore } from '../../store/useStore';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { X, Wallet, Bank, CreditCard } from 'lucide-react';

interface AccountFormProps {
  onClose: () => void;
}

interface FormData {
  name: string;
  type: 'cash' | 'bank' | 'credit';
  description: string;
  balance: number;
}

export const AccountForm: React.FC<AccountFormProps> = ({ onClose }) => {
  const { addAccount, darkMode } = useStore();
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit = (data: FormData) => {
    addAccount(data);
    onClose();
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
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-md`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            নতুন একাউন্ট তৈরি করুন
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              একাউন্টের নাম *
            </label>
            <input
              type="text"
              {...register('name', { required: 'একাউন্টের নাম আবশ্যক' })}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
              placeholder="যেমন: নগদ, ব্যাংক একাউন্ট"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              একাউন্টের ধরন *
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input type="radio" value="cash" {...register('type', { required: 'একাউন্টের ধরন আবশ্যক' })} className="focus:ring-green-500" />
                <Wallet size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>নগদ</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="radio" value="bank" {...register('type', { required: 'একাউন্টের ধরন আবশ্যক' })} className="focus:ring-green-500" />
                <Bank size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>ব্যাংক</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="radio" value="credit" {...register('type', { required: 'একাউন্টের ধরন আবশ্যক' })} className="focus:ring-green-500" />
                <CreditCard size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>ক্রেডিট কার্ড</span>
              </label>
            </div>
            {errors.type && (
              <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
            )}
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              বিবরণ
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
              placeholder="একাউন্ট সম্পর্কে বিস্তারিত লিখুন..."
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              Initial Balance *
            </label>
            <input
              type="number"
              step="0.01"
              {...register('balance', { required: 'Initial Balance is required', min: 0 })}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
              placeholder="0.00"
            />
            {errors.balance && (
              <p className="text-red-500 text-sm mt-1">{errors.balance.message}</p>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2 rounded-lg border ${
                darkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
            >
              সংরক্ষণ করুন
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
