import React, { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { X, ArrowRightLeft, FileText, Wallet, Building2, Smartphone } from 'lucide-react';

interface TransferFormProps {
  onClose: () => void;
  onSubmit: () => void;
  initialData?: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    note: string;
    id?: string;
  };
  isEdit?: boolean;
}

interface FormData {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  note: string;
}

export const TransferForm: React.FC<TransferFormProps> = ({ onClose, onSubmit, initialData, isEdit }) => {
  const { accounts, transferMoney, darkMode, updateTransaction } = useStore();
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>({
    defaultValues: initialData ? {
      fromAccountId: initialData.fromAccountId,
      toAccountId: initialData.toAccountId,
      amount: initialData.amount,
      note: initialData.note
    } : {}
  });

  useEffect(() => {
    if (initialData) {
      setValue('fromAccountId', initialData.fromAccountId);
      setValue('toAccountId', initialData.toAccountId);
      setValue('amount', initialData.amount);
      setValue('note', initialData.note);
    }
  }, [initialData, setValue]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const fromAccountId = watch('fromAccountId');
  const toAccountId = watch('toAccountId');
  const amount = watch('amount');

  const fromAccount = accounts.find(a => a.id === fromAccountId);
  const toAccount = accounts.find(a => a.id === toAccountId);

  const onFormSubmit = (data: FormData) => {
    const fromAccount = accounts.find(a => a.id === data.fromAccountId);
    
    if (fromAccount && data.amount > fromAccount.balance) {
      alert('অপর্যাপ্ত ব্যালেন্স।');
      return;
    }
    
    if (isEdit && initialData?.id) {
      // Update both related transactions (expense and income)
      // For simplicity, update the main transaction (expense from fromAccountId)
      updateTransaction(initialData.id, {
        accountId: data.fromAccountId,
        toAccountId: data.toAccountId,
        amount: data.amount,
        note: data.note,
        type: 'transfer',
        category: 'Transfer'
      });
      // Optionally, update the paired income transaction if you store its id
      onSubmit();
      return;
    }
    
    transferMoney(data.fromAccountId, data.toAccountId, data.amount, data.note);
    onSubmit();
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <Wallet size={16} className="text-green-600" />;
      case 'bank':
        return <Building2 size={16} className="text-blue-600" />;
      case 'mfs':
        return <Smartphone size={16} className="text-red-600" />;
      default:
        return <Wallet size={16} />;
    }
  };

  const availableToAccounts = accounts.filter(a => a.id !== fromAccountId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
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
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div 
          className="flex items-center justify-between mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <motion.h2 
            className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center`}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <ArrowRightLeft size={20} className="mr-2" />
            টাকা ট্রান্সফার
          </motion.h2>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
          </motion.button>
        </motion.div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* From Account */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              কোন অ্যাকাউন্ট থেকে *
            </label>
            <select
              {...register('fromAccountId', { required: 'অ্যাকাউন্ট নির্বাচন করুন' })}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="">অ্যাকাউন্ট নির্বাচন করুন</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} - {account.balance.toLocaleString()} ৳
                </option>
              ))}
            </select>
            {errors.fromAccountId && (
              <p className="text-red-500 text-sm mt-1">{errors.fromAccountId.message}</p>
            )}
            {fromAccount && (
              <div className={`mt-2 p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center space-x-2">
                  {getAccountIcon(fromAccount.type)}
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    বর্তমান ব্যালেন্স: {fromAccount.balance.toLocaleString()} ৳
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* To Account */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              কোন অ্যাকাউন্টে *
            </label>
            <select
              {...register('toAccountId', { required: 'অ্যাকাউন্ট নির্বাচন করুন' })}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            >
              <option value="">অ্যাকাউন্ট নির্বাচন করুন</option>
              {availableToAccounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} - {account.balance.toLocaleString()} ৳
                </option>
              ))}
            </select>
            {errors.toAccountId && (
              <p className="text-red-500 text-sm mt-1">{errors.toAccountId.message}</p>
            )}
            {toAccount && (
              <div className={`mt-2 p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center space-x-2">
                  {getAccountIcon(toAccount.type)}
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    বর্তমান ব্যালেন্স: {toAccount.balance.toLocaleString()} ৳
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              পরিমাণ *
            </label>
            <div className="relative">
              <span className={`absolute left-3 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>৳</span>
              <input
                type="number"
                step="0.01"
                {...register('amount', { 
                  required: 'পরিমাণ আবশ্যক', 
                  min: { value: 0.01, message: 'পরিমাণ ০ এর চেয়ে বেশি হতে হবে' },
                  max: fromAccount ? { value: fromAccount.balance, message: 'অপর্যাপ্ত ব্যালেন্স' } : undefined
                })}
                className={`w-full pl-8 pr-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="০.০০"
              />
            </div>
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
            )}
            {fromAccount && amount > fromAccount.balance && (
              <p className="text-red-500 text-sm mt-1">অপর্যাপ্ত ব্যালেন্স</p>
            )}
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
                } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                placeholder="ট্রান্সফারের কারণ লিখুন..."
              />
            </div>
          </div>

          {/* Transfer Summary */}
          {fromAccount && toAccount && amount > 0 && (
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-900/20 border border-blue-500' : 'bg-blue-50 border border-blue-200'}`}>
              <h4 className={`font-medium ${darkMode ? 'text-blue-300' : 'text-blue-800'} mb-2`}>
                ট্রান্সফার সারাংশ:
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-blue-200' : 'text-blue-700'}>থেকে:</span>
                  <span className={darkMode ? 'text-white' : 'text-gray-900'}>{fromAccount.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-blue-200' : 'text-blue-700'}>যেখানে:</span>
                  <span className={darkMode ? 'text-white' : 'text-gray-900'}>{toAccount.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-blue-200' : 'text-blue-700'}>পরিমাণ:</span>
                  <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{amount.toLocaleString()} ৳</span>
                </div>
                <hr className={darkMode ? 'border-blue-700' : 'border-blue-300'} />
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-blue-200' : 'text-blue-700'}>ট্রান্সফারের পর {fromAccount.name}:</span>
                  <span className={darkMode ? 'text-white' : 'text-gray-900'}>{(fromAccount.balance - amount).toLocaleString()} ৳</span>
                </div>
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-blue-200' : 'text-blue-700'}>ট্রান্সফারের পর {toAccount.name}:</span>
                  <span className={darkMode ? 'text-white' : 'text-gray-900'}>{(toAccount.balance + amount).toLocaleString()} ৳</span>
                </div>
              </div>
            </div>
          )}

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
              disabled={!fromAccount || !toAccount || !amount || amount > (fromAccount?.balance || 0)}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ট্রান্সফার করুন
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
