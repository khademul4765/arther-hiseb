import React from 'react';
import { useStore } from '../../store/useStore';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  CreditCard, 
  PieChart, 
  Target, 
  Users, 
  Settings,
  TrendingUp,
  Receipt,
  User
} from 'lucide-react';
import { motion } from 'framer-motion';

const navigationItems = [
  { path: '/', name: 'ড্যাশবোর্ড', icon: Home },
  { path: '/transactions', name: 'লেনদেন', icon: CreditCard },
  { path: '/categories', name: 'ক্যাটেগরি', icon: PieChart },
  { path: '/budgets', name: 'বাজেট', icon: TrendingUp },
  { path: '/goals', name: 'লক্ষ্য', icon: Target },
  { path: '/loans', name: 'ঋণ ও পাওনা', icon: Users },
  { path: '/reports', name: 'রিপোর্ট', icon: Receipt },
  { path: '/account', name: 'অ্যাকাউন্ট', icon: User },
  { path: '/settings', name: 'সেটিংস', icon: Settings },
];

export const Navigation: React.FC = () => {
  const { darkMode } = useStore();
  const location = useLocation();

  return (
    <nav className={`fixed left-0 top-16 h-full w-64 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r transform -translate-x-full md:translate-x-0 transition-transform duration-300 ease-in-out z-40`}>
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
  );
};
