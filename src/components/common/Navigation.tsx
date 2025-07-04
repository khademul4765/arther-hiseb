import React from 'react';
import { useStore } from '../../store/useStore';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, CreditCard, PieChart, Target, Users, Settings, TrendingUp, Receipt, User, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

const navigationItems = [
  { path: '/', name: 'ড্যাশবোর্ড', icon: Home },
  { path: '/accounts', name: 'একাউন্টস', icon: Wallet },
  { path: '/transactions', name: 'লেনদেন', icon: CreditCard },
  { path: '/categories', name: 'ক্যাটেগরি', icon: PieChart },
  { path: '/budgets', name: 'বাজেট', icon: TrendingUp },
  { path: '/goals', name: 'লক্ষ্য', icon: Target },
  { path: '/loans', name: 'ঋণ ও পাওনা', icon: Users },
  { path: '/reports', name: 'রিপোর্ট', icon: Receipt },
  { path: '/account', name: 'আমার একাউন্ট', icon: User },
  { path: '/settings', name: 'সেটিংস', icon: Settings },
];

export const Navigation: React.FC = () => {
  const { darkMode } = useStore();
  const location = useLocation();

  return (
    <>
      {/* Desktop Navigation */}
      <nav className={`hidden md:block fixed left-0 top-16 h-full w-64 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r transition-transform duration-300 ease-in-out z-40`}>
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
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-green-600 text-white'
                        : darkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.name}</span>
                  </NavLink>
                </motion.li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t z-40`}>
        <div className="grid grid-cols-5 gap-1 p-2">
          {navigationItems.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : darkMode
                    ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                <item.icon size={18} />
                <span className="text-xs mt-1 font-medium">{item.name.split(' ')[0]}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
};