import React from 'react';
import { useStore } from '../../store/useStore';
import { Bell, Moon, Sun, Settings, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';

export const Header: React.FC = () => {
  const { darkMode, toggleDarkMode, notifications, user
