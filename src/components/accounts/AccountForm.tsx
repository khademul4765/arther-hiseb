import React, { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { X, Wallet, Building2, Smartphone } from 'lucide-react';

interface AccountFormProps {
  onClose: () => void;
  onSubmit: () => void;
  account?: any;
}

interface FormData {
  name: string;
  type: 'cash' | 'bank' | 'mfs';
  description: string;
  balance: number;
  isDefault?: boolean;
}

// Custom MFS icon: smartphone outline with ৳ sign
const MfsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" {...props}>
    {/* Smartphone outline */}
    <rect x="6" y="3" width="12" height="18" rx="2.5" />
    <circle cx="12" cy="19" r="0.7" />
    {/* ৳ sign in bottom right */}
    <text x="16.5" y="20.5" fontSize="7" fontWeight="bold" fill="currentColor">৳</text>
  </svg>
);

export const AccountForm: React.FC<AccountFormProps> = ({ onClose, onSubmit, account }) => {
  const { addAccount, updateAccount, darkMode, accounts } = useStore();
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>({
    defaultValues: account ? {
      name: account.name,
      type: account.type,
      description: account.description,
      balance: account.balance,
      isDefault: account.isDefault || false
    } : {
      type: 'cash',
      balance: 0,
      isDefault: false
    }
  });

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const selectedType = watch('type');

  const onFormSubmit = async (data: FormData) => {
    if (data.isDefault) {
      for (const acc of accounts) {
        if (!account || acc.id !== account.id) {
          await updateAccount(acc.id, { isDefault: false });
        }
      }
    }
    if (account) {
      await updateAccount(account.id, data);
    } else {
      await addAccount(data);
    }
    onSubmit();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <Wallet size={20} className="text-green-600" />;
      case 'bank':
        return <Building2 size={20} className="text-blue-600" />;
      case 'mfs':
        return <MfsIcon className="text-red-600" />;
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
            <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
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
            <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
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
                selectedType === 'mfs' 
                  ? darkMode ? 'border-red-500 bg-red-900/20' : 'border-red-500 bg-red-50'
                  : darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'
              }`}>
                <input 
                  type="radio" 
                  value="mfs" 
                  {...register('type', { required: 'অ্যাকাউন্টের ধরন আবশ্যক' })} 
                  className="sr-only" 
                />
                <MfsIcon className={selectedType === 'mfs' ? 'text-red-600' : darkMode ? 'text-gray-400' : 'text-gray-600'} />
                <span className={`text-sm mt-1 ${selectedType === 'mfs' ? 'text-red-600 font-medium' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}>MFS</span>
              </label>
            </div>
            {errors.type && (
              <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              বিবরণ
            </label>
            <div className="relative">
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

          {/* Default Account Toggle */}
          <div className="flex items-center mt-6 mb-2">
            <label className={`mr-4 text-base md:text-lg font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>ডিফল্ট অ্যাকাউন্ট</label>
            <button
              type="button"
              onClick={() => setValue('isDefault', !watch('isDefault'))}
              className={`relative w-14 h-8 rounded-full transition-colors duration-200 focus:outline-none border-2 ${watch('isDefault') ? 'bg-green-500 border-green-600' : 'bg-gray-300 border-gray-400'}`}
              aria-pressed={watch('isDefault')}
              title={watch('isDefault') ? 'ডিফল্ট অ্যাকাউন্ট' : 'ডিফল্ট করুন'}
            >
              <span
                className={`absolute left-0 top-0 w-8 h-8 rounded-full bg-white shadow transition-transform duration-200 ${watch('isDefault') ? 'translate-x-6' : ''}`}
                style={{ transform: watch('isDefault') ? 'translateX(24px)' : 'translateX(0)' }}
              />
              <span className="sr-only">{watch('isDefault') ? 'ডিফল্ট অ্যাকাউন্ট' : 'ডিফল্ট করুন'}</span>
            </button>
          </div>

          {/* Initial Balance */}
          <div>
            <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
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
            <p className={`text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
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
