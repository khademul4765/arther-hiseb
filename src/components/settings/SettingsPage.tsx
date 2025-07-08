import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { motion } from 'framer-motion';
import { Settings, Moon, Sun, Bell, Trash2, Download, Upload, User, Lock } from 'lucide-react';
import { ThemedCheckbox } from '../common/ThemedCheckbox';
import { format } from 'date-fns';

export const SettingsPage: React.FC = () => {
  const { darkMode, toggleDarkMode, clearAllNotifications, deleteAllUserData, user, enableNotifications, toggleNotifications } = useStore();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

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

  const handleClearAllData = async () => {
    setIsClearing(true);
    try {
      await deleteAllUserData();
      setShowClearConfirm(false);
    } catch (error) {
      console.error('Error clearing data:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearNotifications = () => {
    clearAllNotifications();
    setShowClearConfirm(false);
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
            ব্যবহারকারী তথ্য
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
                যোগদান তারিখ
              </label>
              <input
                type="text"
                value={user?.createdAt ? format(new Date(user.createdAt), 'dd MMM yyyy (dd/MM/yyyy)') : ''}
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


          </div>
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6`}
        >
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
            <Bell size={20} className="mr-2" />
            বিজ্ঞপ্তি সেটিংস
          </h2>
          <div className="space-y-4">
            {/* Enable All Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell size={20} className="text-green-500" />
                <div>
                  <span className={`font-medium block ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    সব বিজ্ঞপ্তি
                  </span>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    বিজ্ঞপ্তি বিবরণ
                  </span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleNotifications}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  enableNotifications ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enableNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </motion.button>
            </div>
          </div>
          
          {/* Clear All Notifications */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trash2 size={20} className="text-red-500" />
                <div>
                  <span className={`font-medium block ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    বিজ্ঞপ্তি পরিষ্কার করুন
                  </span>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    সব বিজ্ঞপ্তি পরিষ্কার করুন
                  </span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowClearConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                প্রবর্তন
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
            ডেটা প্রবর্ধন
          </h2>
          <div className="space-y-4">
            {/* Export Data */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Download size={20} />
                <div>
                  <span className={`font-medium block ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    ডেটা এক্সপোর্ট করুন
                  </span>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    ডেটা এক্সপোর্ট বিবরণ
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
                    ডেটা ইম্পোর্ট করুন
                  </span>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    ডেটা ইম্পোর্ট বিবরণ
                  </span>
                </div>
              </div>
              <label className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm cursor-pointer">
                ইম্পোর্ট
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
            আপনার ডেটা পরিষ্কার করুন
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className={`font-medium block ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  সব ডেটা পরিষ্কার করুন
                </span>
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  সব ডেটা পরিষ্কার করুন
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowClearConfirm(true)}
                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                প্রবর্তন
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Clear All Data Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 max-w-md mx-4`}
          >
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
              বিজ্ঞপ্তি পরিষ্কার করার সন্দেহ
            </h3>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
              বিজ্ঞপ্তি পরিষ্কার করার সন্দেহ বিবরণ
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600"
              >
                বাতিল
              </button>
              <button
                onClick={handleClearNotifications}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                প্রবর্তন
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
