import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { X, Users, Calendar, DollarSign, Phone, MapPin, FileText } from 'lucide-react';
import ContactSelect from '../common/ContactSelect';

interface LoanFormProps {
  onClose: () => void;
  onSubmit: () => void;
  loan?: any;
}

interface FormData {
  type: 'borrowed' | 'lent';
  amount: number;
  personName: string;
  personPhone?: string;
  personAddress?: string;
  date: string;
  dueDate?: string;
  note: string;
  duration?: number;
}

export const LoanForm: React.FC<LoanFormProps> = ({
  onClose,
  onSubmit,
  loan
}) => {
  const { addLoan, updateLoan, darkMode, user, contacts } = useStore();
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>({
    defaultValues: loan ? {
      type: loan.type,
      amount: loan.amount,
      personName: loan.personName,
      personPhone: loan.personPhone || '',
      personAddress: loan.personAddress || '',
      date: loan.date.toISOString().split('T')[0],
      dueDate: loan.dueDate ? loan.dueDate.toISOString().split('T')[0] : '',
      note: loan.note
    } : {
      type: 'borrowed',
      date: new Date().toISOString().split('T')[0],
      note: ''
    }
  });

  const date = watch('date');
  const duration = watch('duration');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  // Auto-calculate due date when duration or date changes
  useEffect(() => {
    if (date && duration && duration > 0) {
      const start = new Date(date);
      const dueDate = new Date(start.getTime() + duration * 24 * 60 * 60 * 1000);
      setValue('dueDate', dueDate.toISOString().split('T')[0]);
    }
  }, [date, duration, setValue]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const onFormSubmit = (data: FormData) => {
    console.log('Loan form submit data:', data, 'user:', user);
    if (!user) {
      alert('আপনি লগইন করেননি। দয়া করে লগইন করুন।');
      return;
    }
    const contact = contacts.find(c => c.id === selectedContactId);
    const loanData: any = {
      ...data,
      personName: contact ? contact.name : '',
      personPhone: contact ? contact.phone : '',
      personAddress: contact ? contact.address : '',
      date: new Date(data.date),
      note: data.note,
    };
    if (data.dueDate) {
      loanData.dueDate = new Date(data.dueDate);
    }
    if (!data.dueDate) {
      delete loanData.dueDate;
    }
    if (loan) {
      updateLoan(loan.id, loanData);
    } else {
      addLoan(loanData);
    }
    onSubmit();
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
            {loan ? 'ঋণ/পাওনা সম্পাদনা' : 'নতুন ঋণ/পাওনা'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Type */}
          <div>
            <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              ধরন *
            </label>
            <select
              {...register('type', { required: 'ধরন নির্বাচন করুন' })}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
            >
              <option value="borrowed">ঋণ (যা নিয়েছি)</option>
              <option value="lent">পাওনা (যা দিয়েছি)</option>
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              পরিমাণ *
            </label>
            <div className="relative">
              <DollarSign size={16} className={`absolute left-3 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <input
                type="number"
                step="0.01"
                {...register('amount', { required: 'পরিমাণ আবশ্যক', min: 0.01 })}
                className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
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

          {/* Person Name/Phone/Address */}
          <div>
            <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              ব্যক্তি/ প্রতিষ্ঠানের নাম *
            </label>
            <div className="relative">
              <Users size={16} className={`absolute left-3 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <div className="pl-10">
                <ContactSelect
                  value={selectedContactId}
                  onChange={setSelectedContactId}
                />
              </div>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              তারিখ *
            </label>
            <div className="relative">
              <Calendar size={16} className={`absolute left-3 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <input
                type="date"
                {...register('date', { required: 'তারিখ আবশ্যক' })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
              />
            </div>
            {errors.date && (
              <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
            )}
          </div>

          {/* Duration */}
          <div>
            <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              সময়কাল (দিনে)
            </label>
            <input
              type="number"
              min="1"
              {...register('duration', { min: 1 })}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
              placeholder="দিনের সংখ্যা লিখুন"
            />
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
              তারিখ থেকে শেষের তারিখ স্বয়ংক্রিয়ভাবে গণনা হবে
            </p>
          </div>

          {/* Due Date */}
          <div>
            <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              শেষ তারিখ
            </label>
            <div className="relative">
              <Calendar size={16} className={`absolute left-3 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <input
                type="date"
                {...register('dueDate')}
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
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
              {loan ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
