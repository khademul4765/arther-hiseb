import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Bell, Moon, Sun, LogOut, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';

export const Header: React.FC = () => {
  const { darkMode, toggleDarkMode, notifications, user, logout } = useStore();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const unreadNotifications = notifications.filter(n => !n.isRead).length;
  const [isInternalToggle, setIsInternalToggle] = useState(false);

  // Listen for mobile menu toggle events from Navigation component
  React.useEffect(() => {
    const handleMobileMenuToggle = (event: CustomEvent) => {
      if (!isInternalToggle) {
        setShowMobileMenu(event.detail.isOpen);
      }
      setIsInternalToggle(false);
    };

    window.addEventListener('mobileMenuToggle', handleMobileMenuToggle as EventListener);
    return () => {
      window.removeEventListener('mobileMenuToggle', handleMobileMenuToggle as EventListener);
    };
  }, [isInternalToggle]);



  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleMobileMenu = () => {
    const newState = !showMobileMenu;
    setShowMobileMenu(newState);
    setIsInternalToggle(true);

    // Dispatch custom event to notify Navigation component
    window.dispatchEvent(new CustomEvent('mobileMenuToggle', {
      detail: { isOpen: newState }
    }));
  };

  return (
    <header className={`sticky top-0 z-50 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-lg backdrop-blur-sm bg-opacity-95`}>
      <div className="px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className={`md:hidden p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              {showMobileMenu ? (
                <X size={20} className={darkMode ? 'text-white' : 'text-gray-900'} />
              ) : (
                <Menu size={20} className={darkMode ? 'text-white' : 'text-gray-900'} />
              )}
            </button>

            <div className="flex items-center space-x-3">
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg"
              >
                <span className="text-white font-bold text-xl">৳</span>
              </motion.div>
              <div>
                <h1 className={`text-xl md:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} tracking-wide`}>
                  অর্থের হিসেব
                </h1>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-medium`}>
                  by Khademul Bashar
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            {user && (
              <div className={`text-base ${darkMode ? 'text-gray-300' : 'text-gray-700'} hidden md:block`}>
                স্বাগতম, {user.name}
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleDarkMode}
              className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-700'} hover:bg-opacity-80 shadow-md transition-all duration-200`}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`relative p-3 rounded-xl ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'} hover:bg-opacity-80 shadow-md transition-all duration-200`}
            >
              <Bell size={20} />
              {unreadNotifications > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-lg"
                >
                  {unreadNotifications}
                </motion.span>
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700 text-red-400' : 'bg-gray-100 text-red-600'} hover:bg-opacity-80 shadow-md transition-all duration-200`}
              title="লগআউট"
            >
              <LogOut size={20} />
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  );
};
