import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { motion } from 'framer-motion';
import { Settings, Moon, Sun, Bell, Trash2, Download, Upload, User, Lock } from 'lucide-react';
import { ThemedCheckbox } from '../common/ThemedCheckbox';

export const SettingsPage: React.FC = () => {
  const { darkMode, toggleDarkMode, clearAllNotifications, clearUserData, user } = useStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const exportData = () => {
    const data = localStorage.getItem('orther-hiseb-storage');
    if (data) {
      const dataBlob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orther-hiseb-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    }
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result as string;
          localStorage.setItem('orther-hiseb-storage', data);
          window.location.reload();
        } catch (error) {
          alert('ফাইল আপলোড করতে সমস্যা হয়েছে');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleClearData = () => {
    clearUserData();
    setShowClearConfirm(false);
    alert('আপনার সব ডেটা মুছে ফেলা হয়েছে');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} tracking-wide mb-0`}>
            সেটিংস
          </h1>
          <div className={`w-20 h-1 ${darkMode ? 'bg-green-500' : 'bg-green-600'} rounded-full mt-2`}></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6`}
        >
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
            <User size={20} className="mr-2" />
            ব্যবহারকারীর তথ্য
          </h2>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                নাম
              </label>
              <input
                type="text"
                value={user?.name || ''}
                readOnly
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-gray-50 border-gray-300 text-gray-900'
                } cursor-not-allowed`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                ইমেইল
              </label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-gray-50 border-gray-300 text-gray-900'
                } cursor-not-allowed`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                যোগদানের তারিখ
              </label>
              <input
                type="text"
                value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('bn-BD') : ''}
                readOnly
                className={`w-full px-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-gray-50 border-gray-300 text-gray-900'
                } cursor-not-allowed`}
              />
            </div>
          </div>
        </motion.div>

        {/* App Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6`}
        >
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
            <Settings size={20} className="mr-2" />
            অ্যাপ সেটিংস
          </h2>
          <div className="space-y-4">
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {darkMode ? <Moon size={20} /> : <Sun size={20} />}
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  ডার্ক মোড
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleDarkMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  darkMode ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </motion.button>
            </div>

            {/* Clear Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell size={20} />
                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  নোটিফিকেশন পরিষ্কার করুন
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearAllNotifications}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                পরিষ্কার করুন
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Data Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6`}
        >
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
            <Lock size={20} className="mr-2" />
            ডেটা ব্যবস্থাপনা
          </h2>
          <div className="space-y-4">
            {/* Export Data */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Download size={20} />
                <div>
                  <span className={`font-medium block ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    ডেটা এক্সপোর্ট
                  </span>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    আপনার সব ডেটা ডাউনলোড করুন
                  </span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportData}
                className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                এক্সপোর্ট
              </motion.button>
            </div>

            {/* Import Data */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Upload size={20} />
                <div>
                  <span className={`font-medium block ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    ডেটা ইমপোর্ট
                  </span>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    ব্যাকআপ ফাইল আপলোড করুন
                  </span>
                </div>
              </div>
              <label className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm cursor-pointer">
                ইমপোর্ট
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`${darkMode ? 'bg-gray-800 border-red-700' : 'bg-white border-red-200'} border rounded-xl p-6`}
        >
          <h2 className={`text-xl font-semibold text-red-600 mb-4 flex items-center`}>
            <Trash2 size={20} className="mr-2" />
            বিপজ্জনক এলাকা
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className={`font-medium block ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  আপনার সব ডেটা মুছে ফেলুন
                </span>
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowClearConfirm(true)}
                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                মুছে ফেলুন
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Clear Data Confirmation Modal */}
      {showClearConfirm && (
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
              আপনার সব ডেটা মুছে ফেলবেন?
            </h3>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
              এই কাজটি আপনার সব লেনদেন, ক্যাটেগরি, বাজেট, লক্ষ্য এবং ঋণের তথ্য স্থায়ীভাবে মুছে ফেলবে। 
              এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className={`flex-1 px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                বাতিল
              </button>
              <button
                onClick={handleClearData}
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
