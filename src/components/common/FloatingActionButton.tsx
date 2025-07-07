import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { TransactionForm } from '../transactions/TransactionForm';
import { TransferForm } from '../accounts/TransferForm';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import { ThemedCheckbox } from './ThemedCheckbox';

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

      {/* Action Buttons */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed bottom-24 right-4 md:bottom-24 md:right-6 z-50 flex flex-col items-end space-y-3">
            {actions.map((action, index) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  y: 0,
                  transition: { delay: index * 0.1 }
                }}
                exit={{ 
                  opacity: 0, 
                  scale: 0, 
                  y: 20,
                  transition: { delay: (actions.length - index - 1) * 0.1 }
                }}
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={action.action}
                className={`${action.color} text-white p-3 rounded-full shadow-xl hover:shadow-2xl flex items-center space-x-2 min-w-max transition-all duration-300`}
              >
                <action.icon size={20} />
                <span className="text-base font-medium pr-1">{action.label}</span>
              </motion.button>
            ))}
            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              className={`bg-gray-500 hover:bg-gray-600 text-white p-3 rounded-full shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-300`}
            >
              <motion.div
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <X size={24} />
              </motion.div>
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className={`fixed bottom-24 right-4 md:bottom-24 md:right-6 z-50 w-14 h-14 md:w-16 md:h-16 ${
            darkMode ? 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' : 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
          } text-white rounded-full shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-300`}
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Plus size={24} />
          </motion.div>
        </motion.button>
      )}

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
