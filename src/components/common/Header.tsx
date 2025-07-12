import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Sun, Moon, X, Menu, LogOut, TrendingUp, TrendingDown, AlertTriangle, Target, CreditCard, DollarSign, Calendar, CheckCircle, Clock, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { format } from 'date-fns';
import { bn } from 'date-fns/locale';

function formatTime12h(date: Date) {
  return date.toLocaleTimeString('bn-BD', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
}

export const Header: React.FC = () => {
  const { darkMode, toggleDarkMode, notifications, user, logout } = useStore();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const unreadNotifications = notifications.filter(n => !n.isRead).length;
  
  // Sort notifications by creation date (latest first)
  const sortedNotifications = [...notifications].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA; // Most recent first
  });
  
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

    const { type, title, message } = notification;

    // Navigate based on notification type and specific content
    switch (type) {
      case 'budget':
        // All budget notifications go to budgets page
        navigate('/budgets');
        break;
        
      case 'goal':
        // All goal notifications go to goals page
        navigate('/goals');
        break;
        
      case 'loan':
        // All loan notifications go to loans page
        navigate('/loans');
        break;
        
      case 'insight':
        // Specific insight navigation based on content
        if (title.includes('কম ব্যালেন্স') || message.includes('ব্যালেন্স মাত্র')) {
          // Low balance - go to accounts
          navigate('/accounts');
        } else if (title.includes('ট্রান্সফার সফল') || message.includes('ট্রান্সফার হয়েছে')) {
          // Transfer success - go to transactions
          navigate('/transactions');
        } else if (title.includes('বড় খরচ') || message.includes('একক লেনদেনে')) {
          // Large expense - go to transactions
          navigate('/transactions');
        } else if (title.includes('বেশি ছোট খরচ') || message.includes('ছোট খরচ')) {
          // Frequent small expenses - go to transactions
          navigate('/transactions');
        } else if (title.includes('নতুন কন্ট্যাক্টস') || message.includes('কন্ট্যাক্টস তালিকায়')) {
          // Contact added - go to contacts page
          navigate('/contacts');
        } else if (title.includes('লক্ষ্য অর্জিত') || message.includes('অভিনন্দন')) {
          // Goal achievement - go to goals
          navigate('/goals');
        } else {
          // Default for other insights - go to transactions
          navigate('/transactions');
        }
        break;
        
      default:
        // Default navigation to dashboard
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

  // Get notification icon based on type and priority
  const getNotificationIcon = (notification: any) => {
    const { type, priority, title, message } = notification;
    
    // High priority notifications
    if (priority === 'high') {
      return <AlertTriangle size={18} className="text-red-500" />;
    }
    
    // Type-based icons with specific content matching
    switch (type) {
      case 'budget':
        if (title.includes('বাজেট অতিক্রম') || title.includes('বাজেটের সীমা')) {
          return <TrendingDown size={18} className="text-red-500" />;
        }
        if (title.includes('বাজেটের কাছাকাছি') || title.includes('৮০%')) {
          return <AlertTriangle size={18} className="text-orange-500" />;
        }
        return <TrendingDown size={18} className="text-orange-500" />;
        
      case 'goal':
        if (title.includes('লক্ষ্য অর্জিত') || title.includes('সম্পূর্ণ হয়েছে')) {
          return <Star size={18} className="text-yellow-500" />;
        }
        if (title.includes('লক্ষ্যের কাছাকাছি') || title.includes('৮০%')) {
          return <Target size={18} className="text-blue-500" />;
        }
        if (title.includes('সময়সীমা কাছাকাছি') || title.includes('দিন বাকি')) {
          return <Clock size={18} className="text-orange-500" />;
        }
        return <Target size={18} className="text-blue-500" />;
        
      case 'loan':
        if (title.includes('ঋণ পরিশোধ সম্পূর্ণ') || title.includes('সম্পূর্ণ পরিশোধ')) {
          return <CheckCircle size={18} className="text-green-500" />;
        }
        if (title.includes('কিস্তি বাকি') || title.includes('পরিশোধ হয়নি')) {
          return <AlertTriangle size={18} className="text-red-500" />;
        }
        if (title.includes('কিস্তি আসন্ন') || title.includes('পরিশোধ করতে হবে')) {
          return <Clock size={18} className="text-orange-500" />;
        }
        return <CreditCard size={18} className="text-purple-500" />;
        
      case 'insight':
        // Low balance notifications
        if (title.includes('কম ব্যালেন্স') || message.includes('ব্যালেন্স মাত্র')) {
          return <AlertTriangle size={18} className="text-red-500" />;
        }
        // Large expense notifications
        if (title.includes('বড় খরচ') || message.includes('একক লেনদেনে')) {
          return <TrendingDown size={18} className="text-red-500" />;
        }
        // Transfer success notifications
        if (title.includes('ট্রান্সফার সফল') || message.includes('ট্রান্সফার হয়েছে')) {
          return <TrendingUp size={18} className="text-green-500" />;
        }
        // Goal achievement notifications
        if (title.includes('লক্ষ্য অর্জিত') || message.includes('অভিনন্দন')) {
          return <Star size={18} className="text-yellow-500" />;
        }
        // Frequent small expenses
        if (title.includes('বেশি ছোট খরচ') || message.includes('ছোট খরচ')) {
          return <TrendingDown size={18} className="text-orange-500" />;
        }
        // Contact added notifications
        if (title.includes('নতুন কন্ট্যাক্টস') || message.includes('কন্ট্যাক্টস তালিকায়')) {
          return <CheckCircle size={18} className="text-green-500" />;
        }
        // Default insight icon
        return <DollarSign size={18} className="text-green-500" />;
        
      default:
        return <Bell size={18} className="text-gray-500" />;
    }
  };

  // Get notification background color based on type and priority
  const getNotificationBgColor = (notification: any) => {
    const { type, priority, isRead, title, message } = notification;
    
    if (isRead) {
      return darkMode ? 'bg-gray-800' : 'bg-gray-50';
    }
    
    if (priority === 'high') {
      return darkMode ? 'bg-red-900/20 border-red-500/30' : 'bg-red-50 border-red-200';
    }
    
    switch (type) {
      case 'budget':
        if (title.includes('বাজেট অতিক্রম') || title.includes('বাজেটের সীমা')) {
          return darkMode ? 'bg-red-900/20 border-red-500/30' : 'bg-red-50 border-red-200';
        }
        if (title.includes('বাজেটের কাছাকাছি') || title.includes('৮০%')) {
          return darkMode ? 'bg-orange-900/20 border-orange-500/30' : 'bg-orange-50 border-orange-200';
        }
        return darkMode ? 'bg-orange-900/20 border-orange-500/30' : 'bg-orange-50 border-orange-200';
        
      case 'goal':
        if (title.includes('লক্ষ্য অর্জিত') || title.includes('সম্পূর্ণ হয়েছে')) {
          return darkMode ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200';
        }
        if (title.includes('সময়সীমা কাছাকাছি') || title.includes('দিন বাকি')) {
          return darkMode ? 'bg-orange-900/20 border-orange-500/30' : 'bg-orange-50 border-orange-200';
        }
        return darkMode ? 'bg-blue-900/20 border-blue-500/30' : 'bg-blue-50 border-blue-200';
        
      case 'loan':
        if (title.includes('ঋণ পরিশোধ সম্পূর্ণ') || title.includes('সম্পূর্ণ পরিশোধ')) {
          return darkMode ? 'bg-green-900/20 border-green-500/30' : 'bg-green-50 border-green-200';
        }
        if (title.includes('কিস্তি বাকি') || title.includes('পরিশোধ হয়নি')) {
          return darkMode ? 'bg-red-900/20 border-red-500/30' : 'bg-red-50 border-red-200';
        }
        if (title.includes('কিস্তি আসন্ন') || title.includes('পরিশোধ করতে হবে')) {
          return darkMode ? 'bg-orange-900/20 border-orange-500/30' : 'bg-orange-50 border-orange-200';
        }
        return darkMode ? 'bg-purple-900/20 border-purple-500/30' : 'bg-purple-50 border-purple-200';
        
      case 'insight':
        // Low balance notifications
        if (title.includes('কম ব্যালেন্স') || message.includes('ব্যালেন্স মাত্র')) {
          return darkMode ? 'bg-red-900/20 border-red-500/30' : 'bg-red-50 border-red-200';
        }
        // Large expense notifications
        if (title.includes('বড় খরচ') || message.includes('একক লেনদেনে')) {
          return darkMode ? 'bg-red-900/20 border-red-500/30' : 'bg-red-50 border-red-200';
        }
        // Transfer success notifications
        if (title.includes('ট্রান্সফার সফল') || message.includes('ট্রান্সফার হয়েছে')) {
          return darkMode ? 'bg-green-900/20 border-green-500/30' : 'bg-green-50 border-green-200';
        }
        // Goal achievement notifications
        if (title.includes('লক্ষ্য অর্জিত') || message.includes('অভিনন্দন')) {
          return darkMode ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200';
        }
        // Frequent small expenses
        if (title.includes('বেশি ছোট খরচ') || message.includes('ছোট খরচ')) {
          return darkMode ? 'bg-orange-900/20 border-orange-500/30' : 'bg-orange-50 border-orange-200';
        }
        // Contact added notifications
        if (title.includes('নতুন কন্ট্যাক্টস') || message.includes('কন্ট্যাক্টস তালিকায়')) {
          return darkMode ? 'bg-green-900/20 border-green-500/30' : 'bg-green-50 border-green-200';
        }
        // Default insight color
        return darkMode ? 'bg-green-900/20 border-green-500/30' : 'bg-green-50 border-green-200';
        
      default:
        return darkMode ? 'bg-gray-700' : 'bg-white';
    }
  };

  // Get time ago text
  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'এইমাত্র';
    if (diffInMinutes < 60) return `${diffInMinutes} মিনিট আগে`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} ঘন্টা আগে`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} দিন আগে`;
    
    return format(date, 'dd MMM yyyy', { locale: bn });
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
                <h1 className={`text-xl md:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} tracking-wide whitespace-nowrap truncate max-w-[160px] sm:max-w-xs md:max-w-sm lg:max-w-md`}>অর্থের হিসেব</h1>
                <p className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'} whitespace-nowrap truncate max-w-[160px] sm:max-w-xs md:max-w-sm lg:max-w-md -mt-1`} style={{ fontSize: '13.3px' }}>by MK Bashar</p>
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
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-lg font-bold"
                >
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </motion.span>
              )}
              
              {/* Notification Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    ref={notificationPanelRef}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`absolute right-0 mt-3 w-96 max-h-[600px] overflow-hidden rounded-2xl shadow-2xl border z-50 ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
                  >
                    {/* Header */}
                    <div className={`p-4 border-b ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'} rounded-t-2xl`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${darkMode ? 'bg-blue-600' : 'bg-blue-100'}`}>
                            <Bell size={16} className={darkMode ? 'text-blue-200' : 'text-blue-600'} />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">নোটিফিকেশন</h3>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {unreadNotifications}টি অপঠিত
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={handleCloseNotifications} 
                          className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
                        >
                          <X size={18} className="text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    </div>

                    {/* Mark All as Read Button */}
                    {sortedNotifications.length > 0 && unreadNotifications > 0 && (
                      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                        <button
                          onClick={markAllAsRead}
                          className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                        >
                          <CheckCircle size={16} />
                          <span>সব পড়া হয়েছে</span>
                        </button>
                      </div>
                    )}

                    {/* Notifications List */}
                    <div className="max-h-[400px] overflow-y-auto">
                      {sortedNotifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <Bell size={24} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                          </div>
                          <p className={`text-lg font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            কোন বিজ্ঞপ্তি নেই
                          </p>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                            নতুন বিজ্ঞপ্তি এলে এখানে দেখা যাবে
                          </p>
                        </div>
                      ) : (
                        <div className="p-2">
                          {sortedNotifications.map((n) => {
                            const isNew = (() => {
                              const now = new Date();
                              const notificationDate = new Date(n.createdAt);
                              const hoursDiff = (now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60);
                              return hoursDiff < 1;
                            })();

                            return (
                              <motion.div
                                key={n.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2 }}
                                onClick={() => handleNotificationClick(n.id)}
                                className={`mb-2 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] ${getNotificationBgColor(n)} ${!n.isRead ? 'shadow-md' : ''}`}
                              >
                                <div className="flex items-start space-x-3">
                                  {/* Icon */}
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${darkMode ? 'bg-gray-700' : 'bg-white'} shadow-sm`}>
                                    {getNotificationIcon(n)}
                                  </div>
                                  
                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <h4 className={`font-semibold text-sm leading-tight ${darkMode ? 'text-white' : 'text-gray-900'} ${!n.isRead ? 'font-bold' : ''}`}>
                                          {n.title}
                                        </h4>
                                        <p className={`text-sm mt-1 leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                          {n.message && n.message.replace(/৳([\d,]+)/g, (match, p1) => `${p1} ৳`)}
                                        </p>
                                      </div>
                                      
                                      {/* Status indicators */}
                                      <div className="flex items-center space-x-2 ml-2">
                                        {!n.isRead && (
                                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        )}
                                        {isNew && (
                                          <span className="px-2 py-1 text-xs bg-red-500 text-white rounded-full font-bold animate-bounce">
                                            নতুন
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Time */}
                                    <div className="flex items-center space-x-2 mt-2">
                                      <Clock size={12} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
                                      <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {getTimeAgo(new Date(n.createdAt))}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    {sortedNotifications.length > 0 && (
                      <div className={`p-3 border-t ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'} rounded-b-2xl`}>
                        <p className={`text-xs text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          সর্বমোট {sortedNotifications.length}টি বিজ্ঞপ্তি
                        </p>
                      </div>
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
