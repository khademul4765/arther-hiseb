import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Sun, Moon, Menu, X, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

function formatTime12h(date: Date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

export const Header: React.FC = () => {
  const { darkMode, toggleDarkMode, notifications, user, logout } = useStore();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const unreadNotifications = notifications.filter(n => !n.isRead).length;
  const [isInternalToggle, setIsInternalToggle] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationPanelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationPanelRef.current &&
        !notificationPanelRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const { markNotificationAsRead } = useStore();
  const markAllAsRead = () => {
    notifications.filter(n => !n.isRead).forEach(n => markNotificationAsRead(n.id));
  };

  const handleCloseNotifications = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowNotifications(false);
  };

  const handleNotificationClick = (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return;

    // Mark as read if not already read
    if (!notification.isRead) {
      markNotificationAsRead(notificationId);
    }

    // Navigate based on notification type and content
    switch (notification.type) {
      case 'budget':
        navigate('/budgets');
        break;
      case 'goal':
        navigate('/goals');
        break;
      case 'loan':
        navigate('/loans');
        break;
      case 'insight':
        // Check if it's a low balance notification
        if (notification.title === 'কম ব্যালেন্স' || notification.message.includes('ব্যালেন্স মাত্র')) {
          navigate('/accounts');
        } else {
          // For other insights, navigate to transactions
          navigate('/transactions');
        }
        break;
      default:
        navigate('/');
        break;
    }

    // Close the notification panel
    setShowNotifications(false);
  };

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
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-transparent"
              >
                <img src="/logo.svg" alt="Logo" className="w-10 h-10 object-contain" />
              </motion.div>
              <div>
                <h1 className={`text-lg md:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} tracking-wide whitespace-nowrap truncate max-w-[160px] sm:max-w-xs md:max-w-sm lg:max-w-md`}>অর্থের হিসেব</h1>
                <p className={`text-base font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} whitespace-nowrap truncate max-w-[160px] sm:max-w-xs md:max-w-sm lg:max-w-md`}>by MK Bashar</p>
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
              onClick={() => setShowNotifications((v) => !v)}
              aria-label="Notifications"
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
              {/* Notification Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    ref={notificationPanelRef}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className={`absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl shadow-2xl border z-50 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                  >
                    <div className="p-4 border-b font-bold text-lg flex items-center justify-between">
                      <span>বিজ্ঞপ্তি</span>
                      <button 
                        onClick={handleCloseNotifications} 
                        className={`p-1 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
                      >
                        <X size={18} className="text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                    {notifications.length > 0 && unreadNotifications > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-base font-semibold transition"
                      >
                        পড়া হয়েছে।
                      </button>
                    )}
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-400">কোন বিজ্ঞপ্তি নেই</div>
                    ) : (
                      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {notifications.map((n) => (
                          <li
                            key={n.id}
                            onClick={() => handleNotificationClick(n.id)}
                            className={`p-4 cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-700 ${n.isRead ? '' : 'bg-green-50 dark:bg-green-900/30 font-semibold'}`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{n.title}</span>
                              {!n.isRead && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-green-500" />}
                            </div>
                            {/* Currency icon after amount in message */}
                            <div className="text-sm mt-1 opacity-80">
                              {n.message && n.message.replace(/৳([\d,]+)/g, (match, p1) => `${p1} ৳`)}
                            </div>
                            <div className="text-xs mt-1 opacity-60">
                              {n.createdAt ? `${format(new Date(n.createdAt), 'dd MMM yyyy')}, ${formatTime12h(new Date(n.createdAt))}` : ''}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
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
