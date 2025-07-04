import React from 'react';
import { useStore } from '../../store/useStore';
import { Navigation } from './Navigation';
import { Header } from './Header';
import { FloatingActionButton } from './FloatingActionButton';
import { motion } from 'framer-motion';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { darkMode } = useStore();

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <Header />
      <div className="flex">
        <Navigation />
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 p-4 md:p-6 lg:p-8 ml-0 md:ml-64 pb-20 md:pb-8"
        >
          {children}
        </motion.main>
      </div>
      <FloatingActionButton />
    </div>
  );
};
