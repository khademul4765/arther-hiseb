import React from 'react';
import { useStore } from '../../store/useStore';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { X, Wallet, Building2, CreditCard, FileText, DollarSign } from 'lucide-react';

interface AccountFormProps {
  onClose: () => void;
  onSubmit: () => void;
  account?: any;
}

interface FormData {
  name: string;
  type: 'cash' | 'bank' | 'credit';
  description: string;
  balance: number;
}

export const AccountForm: React.FC<AccountFormProps> = ({ onClose, onSubmit, account }) => {
  const { addAccount, updateAccount, darkMode } = useStore();
  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    defaultValues: account ? {
      name: account.name,
      type: account.type,
      description: account.description,
      balance: account.balance
    } : {
      type: 'cash',
      balance: 0
    }
  });

  const selectedType = watch('type');

  const onFormSubmit = (data: FormData) => {
    if (account) {
      updateAccount(account.id, data);
    } else {
      addAccount(data);
    }
    onSubmit();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <Wallet size={20} className="text-green-600" />;
      case 'bank':
        return <Building2 size={20} className="text-blue-600" />;
      case 'credit':
        return <CreditCard size={20} className="text-purple-600" />;
      default:
        return <Wallet size={20} />;
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
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {account ? 'অ্যাকাউন্ট সম্পাদনা' : 'নতুন অ্যাকাউন্ট তৈরি করুন'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              অ্যাকাউন্টের নাম *
            </label>
            <input
              type="text"
              {...register('name', { required: 'অ্যাকাউন্টের নাম আবশ্যক' })}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
              placeholder="যেমন: নগদ, ব্যাংক অ্যাকাউন্ট"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              অ্যাকাউন্টের ধরন *
            </label>
            <div className="grid grid-cols-3 gap-3">
              <label className={`flex flex-col items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedType === 'cash' 
                  ? darkMode ? 'border-green-500 bg-green-900/20' : 'border-green-500 bg-green-50'
                  : darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
              }`}>
                <input 
                  type="radio" 
                  value="cash" 
                  {...register('type', { required: 'অ্যাকাউন্টের ধরন আবশ্যক' })} 
                  className="sr-only" 
                />
                <Wallet size={24} className={selectedType === 'cash' ? 'text-green-600' : darkMode ? 'text-gray-400' : 'text-gray-600'} />
                <span className={`text-sm mt-1 ${selectedType === 'cash' ? 'text-green-600 font-medium' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  নগদ
                </span>
              </label>
              
              <label className={`flex flex-col items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedType === 'bank' 
                  ? darkMode ? 'border-blue-500 bg-blue-900/20' : 'border-blue-500 bg-blue-50'
                  : darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
              }`}>
                <input 
                  type="radio" 
                  value="bank" 
                  {...register('type', { required: 'অ্যাকাউন্টের ধরন আবশ্যক' })} 
                  className="sr-only" 
                />
                <Building2 size={24} className={selectedType === 'bank' ? 'text-blue-600' : darkMode ? 'text-gray-400' : 'text-gray-600'} />
                <span className={`text-sm mt-1 ${selectedType === 'bank' ? 'text-blue-600 font-medium' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  ব্যাংক
                </span>
              </label>
              
              <label className={`flex flex-col items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedType === 'credit' 
                  ? darkMode ? 'border-purple-500 bg-purple-900/20' : 'border-purple-500 bg-purple-50'
                  : darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
              }`}>
                <input 
                  type="radio" 
                  value="credit" 
                  {...register('type', { required: 'অ্যাকাউন্টের ধরন আবশ্যক' })} 
                  className="sr-only" 
                />
                <CreditCard size={24} className={selectedType === 'credit' ? 'text-purple-600' : darkMode ? 'text-gray-400' : 'text-gray-600'} />
                <span className={`text-sm mt-1 ${selectedType === 'credit' ? 'text-purple-600 font-medium' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  ক্রেডিট কার্ড
                </span>
              </label>
            </div>
            {errors.type && (
              <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              বিবরণ
            </label>
            <div className="relative">
              <FileText size={16} className={`absolute left-3 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <textarea
                {...register('description')}
                rows={3}
                className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                placeholder="অ্যাকাউন্ট সম্পর্কে বিস্তারিত লিখুন..."
              />
            </div>
          </div>

          {/* Initial Balance */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              প্রাথমিক ব্যালেন্স *
            </label>
            <div className="relative">
              <span className={`absolute left-3 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>৳</span>
              <input
                type="number"
                step="0.01"
                {...register('balance', { required: 'প্রাথমিক ব্যালেন্স আবশ্যক' })}
                className={`w-full pl-8 pr-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                placeholder="০.০০"
              />
            </div>
            {errors.balance && (
              <p className="text-red-500 text-sm mt-1">{errors.balance.message}</p>
            )}
          </div>

          {/* Preview */}
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              প্রিভিউ:
            </p>
            <div className="flex items-center space-x-3">
              {getTypeIcon(selectedType)}
              <div>
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {watch('name') || 'অ্যাকাউন্টের নাম'}
                </span>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {(watch('balance') || 0).toLocaleString()} ৳
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
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
              {account ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
