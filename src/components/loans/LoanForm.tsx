import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { X, Users, Calendar, DollarSign, Phone, MapPin, FileText, XCircle, Wallet, Building, Smartphone, CreditCard } from 'lucide-react';
import ContactSelect from '../common/ContactSelect';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { DatePickerHeader, CustomCalendarContainer } from '../common/DatePickerHeader';
import { CategorySelect } from '../common/CategorySelect';

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
  const { addLoan, updateLoan, addTransaction, accounts, darkMode, user, contacts } = useStore();
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
  const [selectedContactId, setSelectedContactId] = useState<string | null>(() => {
    if (loan && loan.personName) {
      // Try to find a contact that matches both name and phone (if phone exists)
      const match = contacts.find(c =>
        c.name === loan.personName &&
        (loan.personPhone ? c.phone === loan.personPhone : true)
      );
      return match ? match.id : null;
    }
    return null;
  });
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

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

  // Helper for account icon
  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <Wallet size={18} className="text-green-600" />;
      case 'bank':
        return <Building size={18} className="text-blue-600" />;
      case 'mfs':
        return <Smartphone size={18} className="text-red-500" />;
      case 'credit':
        return <CreditCard size={18} className="text-yellow-600" />;
      default:
        return <Wallet size={18} className="text-gray-500" />;
    }
  };

  const onFormSubmit = async (data: FormData) => {
    console.log('Loan form submit data:', data, 'user:', user);
    if (!user) {
      alert('আপনি লগইন করেননি। দয়া করে লগইন করুন।');
      return;
    }
    const contact = contacts.find(c => c.id === selectedContactId);
    const loanData: Omit<any, 'id' | 'userId' | 'createdAt'> = {
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
      updateLoan(loan.id, loanData); // No await, fire and forget
      onSubmit(); // Close modal immediately
    } else {
      // Add loan
      await addLoan(loanData);
      // Add transaction for loan amount
      if (selectedAccountId) {
        const transactionType = data.type === 'borrowed' ? 'income' : 'expense';
        const note = data.type === 'borrowed' 
          ? `${contact ? contact.name : 'ব্যাক্তি / প্রতিষ্ঠান'} থেকে ঋণ নিয়েছি।`
          : `${contact ? contact.name : 'ব্যাক্তি / প্রতিষ্ঠান'} কে ঋণ দিয়েছি`;
        
        await addTransaction({
          amount: Number(data.amount),
          type: transactionType,
          category: 'লোন / ইন্টারেস্ট',
          accountId: selectedAccountId,
          date: new Date(data.date),
          time: new Date().toTimeString().slice(0, 5),
          person: contact ? contact.name : '',
          note: note,
          tags: [],
        });
      }
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
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className={`text-lg md:text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {loan ? 'ঋণ/পাওনা সম্পাদনা' : 'নতুন ঋণ/পাওনা'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-red-900/40' : 'hover:bg-red-100'}`}
          >
            <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Type */}
          <div>
            <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>ধরন *</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-colors ${watch('type') === 'borrowed' ? darkMode ? 'border-red-500 bg-red-900/20' : 'border-red-500 bg-red-50' : darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'}`}>
                <input type="radio" value="borrowed" {...register('type', { required: 'ধরন নির্বাচন করুন' })} className="sr-only" />
                <span className={`font-medium ${watch('type') === 'borrowed' ? 'text-red-600' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}>ঋণ (যা নিয়েছি)</span>
              </label>
              <label className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-colors ${watch('type') === 'lent' ? darkMode ? 'border-green-500 bg-green-900/20' : 'border-green-500 bg-green-50' : darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'}`}>
                <input type="radio" value="lent" {...register('type', { required: 'ধরন নির্বাচন করুন' })} className="sr-only" />
                <span className={`font-medium ${watch('type') === 'lent' ? 'text-green-600' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}>পাওনা (যা দিয়েছি)</span>
              </label>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>পরিমাণ *</label>
            <div className="relative">
              <span className={`absolute left-3 top-3 md:top-2.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>৳</span>
              <input
                type="number"
                step="0.01"
                {...register('amount', { required: 'পরিমাণ আবশ্যক', min: 0.01 })}
                className={`w-full pl-8 pr-3 py-3 md:py-2 rounded-lg border text-lg md:text-base ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-green-500 focus:border-transparent focus:outline-none`}
                placeholder="০.০০"
              />
            </div>
            {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>}
          </div>

          {/* Account Selection (only for new loan) */}
          {!loan && (
            <div>
              <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>অ্যাকাউন্ট *</label>
              <CategorySelect
                value={selectedAccountId}
                onChange={setSelectedAccountId}
                options={accounts.map(acc => ({
                  value: acc.id,
                  label: `${acc.name} - ${acc.balance.toLocaleString()} ৳`,
                  icon: getAccountIcon(acc.type)
                }))}
                placeholder="অ্যাকাউন্ট নির্বাচন করুন"
                disabled={false}
                showSearch={false}
              />
              {selectedAccountId && (
                <div className={`mt-2 p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const acc = accounts.find(a => a.id === selectedAccountId);
                      return acc ? getAccountIcon(acc.type) : null;
                    })()}
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>বর্তমান ব্যালেন্স: {(() => {
                      const acc = accounts.find(a => a.id === selectedAccountId);
                      return acc ? acc.balance.toLocaleString() : '';
                    })()} ৳</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Person Name/Phone/Address */}
          <div>
            <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>ব্যক্তি / প্রতিষ্ঠান</label>
            <ContactSelect
              value={selectedContactId}
              onChange={setSelectedContactId}
              darkMode={darkMode}
              placeholder="ব্যক্তি/প্রতিষ্ঠানের নাম লিখুন..."
            />
          </div>

          {/* Date */}
          <div>
            <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              {watch('type') === 'borrowed' ? 'তারিখ (যেদিন নিয়েছি) *' : 'তারিখ (যেদিন দিয়েছি) *'}
            </label>
            <div className={`flex items-center rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} shadow-sm focus-within:ring-2 focus-within:ring-green-400 focus-within:border-transparent transition-all relative`}>
              <Calendar size={22} className={`ml-3 mr-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
              <ReactDatePicker
                selected={date ? new Date(date) : null}
                onChange={dateObj => {
                  if (dateObj) {
                    const iso = dateObj.toISOString().slice(0, 10);
                    setValue('date', iso, { shouldValidate: true });
                  } else {
                    setValue('date', '', { shouldValidate: true });
                  }
                }}
                dateFormat="yyyy-MM-dd"
                locale="bn"
                placeholderText="তারিখ বাছাই করুন"
                className={`w-full pl-2 pr-10 py-2 rounded-r-lg border-0 ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} focus:ring-0 focus:border-transparent focus:outline-none`}
                calendarClassName={`${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'} rounded-xl shadow-lg border-0 font-bengali pb-12`}
                popperPlacement="bottom-start"
                isClearable={false}
                renderCustomHeader={(props) => (
                  <DatePickerHeader {...props} darkMode={darkMode} datePickerRef={null} />
                )}
                calendarContainer={({ className, children }) => (
                  <CustomCalendarContainer
                    className={className}
                    darkMode={darkMode}
                    onToday={() => {
                      const today = new Date().toISOString().slice(0, 10);
                      setValue('date', today, { shouldValidate: true });
                    }}
                    onClear={() => setValue('date', '', { shouldValidate: true })}
                  >
                    {children}
                  </CustomCalendarContainer>
                )}
              />
              {date && (
                <button
                  type="button"
                  onClick={() => setValue('date', '', { shouldValidate: true })}
                  className={`absolute right-3 p-1 rounded-full transition-colors ${darkMode ? 'hover:bg-red-900/40' : 'hover:bg-red-100'}`}
                >
                  <XCircle size={16} className="text-red-500" />
                </button>
              )}
            </div>
            {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>}
          </div>

          {/* Duration and Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>সময়কাল (দিনে)</label>
              <input
                type="number"
                min="1"
                {...register('duration', { min: 1 })}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-green-500 focus:border-transparent focus:outline-none`}
                placeholder="দিনের সংখ্যা"
              />
            </div>
            <div>
              <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                {watch('type') === 'borrowed' ? 'তারিখ (যেদিন দিতে চাই)' : 'তারিখ (যেদিন দিতে চেয়েছে)'}
              </label>
              <div className={`flex items-center rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} shadow-sm focus-within:ring-2 focus-within:ring-green-400 focus-within:border-transparent transition-all relative`}>
                <Calendar size={22} className={`ml-3 mr-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                <ReactDatePicker
                  selected={watch('dueDate') ? new Date(watch('dueDate')!) : null}
                  onChange={dateObj => {
                    if (dateObj) {
                      const iso = dateObj.toISOString().slice(0, 10);
                      setValue('dueDate', iso, { shouldValidate: true });
                    } else {
                      setValue('dueDate', '', { shouldValidate: true });
                    }
                  }}
                  dateFormat="yyyy-MM-dd"
                  locale="bn"
                  placeholderText="তারিখ বাছাই করুন"
                  className={`w-full pl-2 pr-10 py-2 rounded-r-lg border-0 ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} focus:ring-0 focus:border-transparent focus:outline-none`}
                  calendarClassName={`${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'} rounded-xl shadow-lg border-0 font-bengali pb-12`}
                  popperPlacement="bottom-start"
                  isClearable={false}
                  renderCustomHeader={(props) => (
                    <DatePickerHeader {...props} darkMode={darkMode} datePickerRef={null} />
                  )}
                  calendarContainer={({ className, children }) => (
                    <CustomCalendarContainer
                      className={className}
                      darkMode={darkMode}
                      onToday={() => {
                        const today = new Date().toISOString().slice(0, 10);
                        setValue('dueDate', today, { shouldValidate: true });
                      }}
                      onClear={() => setValue('dueDate', '', { shouldValidate: true })}
                    >
                      {children}
                    </CustomCalendarContainer>
                  )}
                />
                {watch('dueDate') && (
                  <button
                    type="button"
                    onClick={() => setValue('dueDate', '', { shouldValidate: true })}
                    className={`absolute right-3 p-1 rounded-full transition-colors ${darkMode ? 'hover:bg-red-900/40' : 'hover:bg-red-100'}`}
                  >
                    <XCircle size={16} className="text-red-500" />
                  </button>
                )}
              </div>
            </div>
          </div>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            সময়কাল দিলে শেষ তারিখ স্বয়ংক্রিয়ভাবে গণনা হবে
          </p>

          {/* Note */}
          <div>
            <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>নোট</label>
            <div className="relative">
              <FileText size={16} className={`absolute left-3 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <textarea
                {...register('note')}
                rows={3}
                className={`w-full pl-10 pr-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-green-500 focus:border-transparent focus:outline-none`}
                placeholder="বিস্তারিত লিখুন..."
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-3 md:py-2 rounded-lg border ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 md:py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium"
            >
              {loan ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
