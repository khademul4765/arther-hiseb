import React from 'react';
import { Account } from '../../types';
import { motion } from 'framer-motion';
import { Bank, CreditCard, Wallet } from 'lucide-react';

interface AccountItemProps {
  account: Account;
}

export const AccountItem: React.FC<AccountItemProps> = ({ account }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <Wallet size={20} />;
      case 'bank':
        return <Bank size={20} />;
      case 'credit':
        return <CreditCard size={20} />;
      default:
        return <Wallet size={20} />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow duration-300"
    >
      <div className="flex items-center space-x-3">
        <div className="text-green-600">
          {getIcon(account.type)}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {account.name}
        </h3>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mt-2">
        {account.description}
      </p>
      <div className="mt-4">
        <span className="text-xl font-bold text-gray-900 dark:text-white">
          ৳{account.balance.toLocaleString()}
        </span>
      </div>
    </motion.div>
  );
};
