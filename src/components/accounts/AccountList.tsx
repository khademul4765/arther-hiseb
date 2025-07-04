import React from 'react';
import { useStore } from '../../store/useStore';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { AccountItem } from './AccountItem';

export const AccountList: React.FC = () => {
  const { accounts, setShowAccountForm, darkMode } = useStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          একাউন্টস
        </h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAccountForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700"
        >
          <Plus size={20} />
          <span>নতুন একাউন্ট</span>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account) => (
          <AccountItem key={account.id} account={account} />
        ))}
      </div>
    </div>
  );
};
