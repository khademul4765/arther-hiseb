import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, CreditCard, Target, Users, Receipt, User, Wallet, TrendingUp, Settings, Building2, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemedCheckbox } from './ThemedCheckbox';

const navigationItems = [
  { path: '/', name: 'ড্যাশবোর্ড', icon: Home },
  { path: '/accounts', name: 'অ্যাকাউন্টস', icon: Wallet },
  { path: '/transactions', name: 'লেনদেন', icon: CreditCard },
  { path: '/budgets', name: 'বাজেট', icon: TrendingUp },
  { path: '/goals', name: 'লক্ষ্য', icon: Target },
  { path: '/loans', name: 'ঋণ ও পাওনা', icon: Users },
  { path: '/reports', name: 'রিপোর্ট', icon: Receipt },
  { path: '/categories', name: 'ক্যাটেগরি', icon: Tag },
  { path: '/profile', name: 'প্রোফাইল', icon: User },
  { path: '/settings', name: 'সেটিংস', icon: Settings },
];

// Bottom navigation items (mobile only)
const bottomNavItems = [
  { path: '/accounts', name: 'অ্যাকাউন্ট', icon: Wallet },
  { path: '/transactions', name: 'লেনদেন', icon: CreditCard },
  { path: '/', name: 'হোম', icon: Home },
  { path: '/goals', name: 'লক্ষ্য', icon: Target },
  { path: '/budgets', name: 'বাজেট', icon: TrendingUp },
];

export const Navigation: React.FC = () => {
  const { darkMode } = useStore();
  const location = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Listen for mobile menu toggle from header
  useEffect(() => {
    const handleMobileMenuToggle = (event: CustomEvent) => {
      setShowMobileMenu(event.detail.isOpen);
    };

    window.addEventListener('mobileMenuToggle', handleMobileMenuToggle as EventListener);
    return () => {
      window.removeEventListener('mobileMenuToggle', handleMobileMenuToggle as EventListener);
    };
  }, []);



  // Close mobile menu when route changes
  useEffect(() => {
    setShowMobileMenu(false);
  }, [location.pathname]);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className={`hidden md:block fixed left-0 top-16 h-full w-64 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r transition-transform duration-300 ease-in-out z-40 shadow-xl`}>
        <div className="p-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <motion.li
                  key={item.path}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <NavLink
                    to={item.path}
                    className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                        : darkMode
                        ? 'text-gray-300 hover:bg-gray-700 hover:shadow-md'
                        : 'text-gray-700 hover:bg-gray-100 hover:shadow-md'
                    }`}
                  >
                    <item.icon size={20} />
                    <span className="font-medium text-lg">{item.name}</span>
                  </NavLink>
                </motion.li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Mobile Sidebar Navigation */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => {
                setShowMobileMenu(false);
                window.dispatchEvent(new CustomEvent('mobileMenuToggle', {
                  detail: { isOpen: false }
                }));
              }}
            />
            {/* Sidebar */}
            <motion.nav
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className={`md:hidden fixed left-0 top-16 h-full w-64 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r z-50 overflow-y-auto shadow-2xl`}
            >
              <div className="p-4">
                <ul className="space-y-2">
                  {navigationItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <motion.li
                        key={item.path}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <NavLink
                          to={item.path}
                          onClick={() => {
                            setShowMobileMenu(false);
                            window.dispatchEvent(new CustomEvent('mobileMenuToggle', {
                              detail: { isOpen: false }
                            }));
                          }}
                          className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
                            isActive
                              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                              : darkMode
                              ? 'text-gray-300 hover:bg-gray-700 hover:shadow-md'
                              : 'text-gray-700 hover:bg-gray-100 hover:shadow-md'
                          }`}
                        >
                          <item.icon size={20} />
                          <span className="font-medium text-lg">{item.name}</span>
                        </NavLink>
                      </motion.li>
                    );
                  })}
                </ul>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t z-40 shadow-lg backdrop-blur-sm bg-opacity-95`}>
        <div className="grid grid-cols-5 gap-1 p-2">
          {bottomNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                    : darkMode
                    ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-300 hover:shadow-md'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-700 hover:shadow-md'
                }`}
              >
                <item.icon size={18} />
                <span className="text-sm md:text-base font-medium">{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
};
