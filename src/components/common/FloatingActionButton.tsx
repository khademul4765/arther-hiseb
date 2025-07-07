import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { TransactionForm } from '../transactions/TransactionForm';
import { TransferForm } from '../accounts/TransferForm';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';

export const FloatingActionButton: React.FC = () => {
  const { darkMode } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');

  const handleQuickAction = (type: 'income' | 'expense' | 'transfer') => {
    if (type === 'transfer') {
      setShowTransferForm(true);
    } else {
      setTransactionType(type);
      setShowTransactionForm(true);
    }
    setIsOpen(false);
  };
  const actions = [
    {
      icon: TrendingUp,
      label: 'আয়',
      color: 'bg-green-500 hover:bg-green-600',
      action: () => handleQuickAction('income')
    },
    {
      icon: TrendingDown,
      label: 'খরচ',
      color: 'bg-red-500 hover:bg-red-600',
      action: () => handleQuickAction('expense')
    },
    {
      icon: ArrowRightLeft,
      label: 'ট্রান্সফার',
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => handleQuickAction('transfer')
    }
  ];

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-20 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        whileHover={{ scale: 1.1, y: -2 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-20 right-4 md:bottom-8 md:right-6 z-50 w-14 h-14 md:w-16 md:h-16 ${
          isOpen
            ? 'bg-red-500 hover:bg-red-600'
            : darkMode
            ? 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
            : 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
        } text-white rounded-full shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-300`}
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? <X size={28} color="#fff" /> : <Plus size={24} />}
        </motion.div>
      </motion.button>

      {/* Action Buttons */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed bottom-40 right-4 md:bottom-28 md:right-6 z-40 flex flex-col items-end space-y-3">
            {actions.map((action, index) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0, transition: { delay: index * 0.1, duration: 0.2 } }}
                exit={{ opacity: 0, scale: 0.8, y: 20, transition: { duration: 0.2, delay: (actions.length - index - 1) * 0.07 } }}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={action.action}
                className={`${action.color} text-white p-3 rounded-full shadow-xl hover:shadow-2xl flex items-center space-x-2 min-w-max transition-all duration-300`}
              >
                <action.icon size={20} />
                <span className="text-base font-medium pr-1">{action.label}</span>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Transaction Form */}
      {showTransactionForm && (
        <TransactionForm
          onClose={() => setShowTransactionForm(false)}
          onSubmit={() => setShowTransactionForm(false)}
          defaultType={transactionType}
        />
      )}

      {/* Transfer Form */}
      {showTransferForm && (
        <TransferForm
          onClose={() => setShowTransferForm(false)}
          onSubmit={() => setShowTransferForm(false)}
        />
      )}
    </>
  );
};
