import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { AccountForm } from './AccountForm';
import { TransferForm } from './TransferForm';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, ArrowRightLeft, Wallet, Ban as Bank, CreditCard } from 'lucide-react';

export const AccountManager: React.FC = () => {
  const { accounts, deleteAccount, darkMode } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleEdit = (account: any) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    deleteAccount(id);
    setShowDeleteConfirm(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAccount(null);
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <Wallet size={24} className="text-green-600" />;
      case 'bank':
        return <Bank size={24} className="text-blue-600" />;
      case 'credit':
        return <CreditCard size={24} className="text-purple-600" />;
      default:
        return <Wallet size={24} className="text-gray-600" />;
    }
  };

  const getAccountTypeName = (type: string) => {
    switch (type) {
      case 'cash':
        return 'নগদ';
      case 'bank':
        return 'ব্যাংক';
      case 'credit':
        return 'ক্রেডিট কার্ড';
      default:
        return 'অজানা';
    }
  };

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          একাউন্টস
        </h1>
        <div className="flex space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowTransferForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700"
          >
            <ArrowRightLeft size={20} />
            <span>ট্রান্সফার</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700"
          >
            <Plus size={20} />
            <span>নতুন একাউন্ট</span>
          </motion.button>
        </div>
      </div>

      {/* Total Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${darkMode ? 'bg-gradient-to-r from-green-800 to-green-600' : 'bg-gradient-to-r from-green-600 to-green-500'} rounded-xl p-6 text-white`}
      >
        <h2 className="text-lg font-medium opacity-90 mb-2">মোট ব্যালেন্স</h2>
        <p className="text-4xl font-bold">৳{totalBalance.toLocaleString()}</p>
        <p className="text-sm opacity-75 mt-2">{accounts.length}টি একাউন্ট</p>
      </motion.div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <motion.div
            key={account.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6 hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getAccountIcon(account.type)}
                <div>
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {account.name}
                  </h3>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {getAccountTypeName(account.type)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleEdit(account)}
                  className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <Edit2 size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowDeleteConfirm(account.id)}
                  className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <Trash2 size={16} className="text-red-500" />
                </motion.button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  বর্তমান ব্যালেন্স
                </p>
                <p className={`text-2xl font-bold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ৳{account.balance.toLocaleString()}
                </p>
              </div>

              {account.description && (
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {account.description}
                </p>
              )}
            </div>
          </motion.div>
        ))}

        {accounts.length === 0 && (
          <div className={`col-span-full ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-8 text-center`}>
            <Wallet size={48} className={`mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              কোন একাউন্ট তৈরি করা হয়নি
            </p>
            <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-2`}>
              আপনার প্রথম একাউন্ট তৈরি করুন
            </p>
          </div>
        )}
      </div>

      {/* Account Form Modal */}
      {showForm && (
        <AccountForm
          account={editingAccount}
          onClose={handleCloseForm}
          onSubmit={handleCloseForm}
        />
      )}

      {/* Transfer Form Modal */}
      {showTransferForm && (
        <TransferForm
          onClose={() => setShowTransferForm(false)}
          onSubmit={() => setShowTransferForm(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-md`}
          >
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
              একাউন্ট মুছবেন?
            </h3>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
              এই একাউন্টটি স্থায়ীভাবে মুছে ফেলা হবে। এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className={`flex-1 px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                বাতিল
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                মুছে ফেলুন
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};