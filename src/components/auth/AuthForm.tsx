import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, LogIn, UserPlus, ArrowLeft, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { useStore } from '../../store/useStore';

interface AuthFormData {
  name?: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

type AuthMode = 'login' | 'register' | 'forgot-password';

export const AuthForm: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [registrationWarning, setRegistrationWarning] = useState(false);
  const { setUser, darkMode } = useStore();

  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<AuthFormData>();

  const password = watch('password');

  const onSubmit = async (data: AuthFormData) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'login') {
        // Login
        const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
        const user = userCredential.user;

        // Fetch user profile from Firestore
        let userProfile = null;
        try {
          const userDoc = await import('firebase/firestore').then(({ doc, getDoc }) => getDoc(doc(db, 'users', user.uid)));
          if (userDoc.exists()) {
            userProfile = userDoc.data();
          }
        } catch (e) { /* ignore */ }

        setUser({
          id: user.uid,
          email: user.email!,
          name: userProfile?.name || user.displayName || 'ব্যবহারকারী',
          createdAt: userProfile?.createdAt ? new Date(userProfile.createdAt.seconds ? userProfile.createdAt.seconds * 1000 : userProfile.createdAt) : new Date()
        });
      } else if (mode === 'register') {
        // Registration
        if (data.password !== data.confirmPassword) {
          setError('পাসওয়ার্ড মিলছে না');
          return;
        }

        if (!registrationWarning) {
          setRegistrationWarning(true);
          setError('নিবন্ধন করার জন্য আবার চেষ্টা করুন');
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const user = userCredential.user;

        // Update profile with name
        await updateProfile(user, {
          displayName: data.name
        });

        // Save user data to Firestore
        await setDoc(doc(db, 'users', user.uid), {
          name: data.name,
          email: data.email,
          createdAt: new Date()
        });

        setUser({
          id: user.uid,
          email: user.email!,
          name: data.name!,
          createdAt: new Date()
        });
      } else if (mode === 'forgot-password') {
        console.log('Attempting password reset for:', data.email);
        
        try {
          // Simple password reset without any additional settings
          await sendPasswordResetEmail(auth, data.email);
          console.log('Password reset email sent successfully');
          setSuccess(`পাসওয়ার্ড রিসেট লিংক ${data.email} ইমেইলে পাঠানো হয়েছে। ইমেইল চেক করুন।`);
          setTimeout(() => {
            setMode('login');
            reset();
          }, 3000);
        } catch (error: any) {
          console.error('Password reset error:', error);
          setError(getErrorMessage(error.code));
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);

      // Special handling for email already in use during registration
      if (error.code === 'auth/email-already-in-use' && mode === 'register') {
        setError('এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে। লগইন করুন।');
        // Switch to login mode and reset form
        setTimeout(() => {
          setMode('login');
          reset();
          setError('');
          setRegistrationWarning(false);
        }, 2000);
      } else {
        setError(getErrorMessage(error.code));
      }
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'এই ইমেইল দিয়ে কোন অ্যাকাউন্ট পাওয়া যায়নি';
      case 'auth/wrong-password':
        return 'ভুল পাসওয়ার্ড';
      case 'auth/invalid-credential':
        return 'ভুল ইমেইল বা পাসওয়ার্ড';
      case 'auth/email-already-in-use':
        return 'এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে';
      case 'auth/weak-password':
        return 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে';
      case 'auth/invalid-email':
        return 'ভুল ইমেইল ফরম্যাট';
      case 'auth/too-many-requests':
        return 'অনেক বেশি চেষ্টা করা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।';
      case 'auth/network-request-failed':
        return 'নেটওয়ার্ক সমস্যা। ইন্টারনেট সংযোগ চেক করুন।';
      case 'auth/operation-not-allowed':
        return 'পাসওয়ার্ড রিসেট সক্রিয় নয়। অ্যাডমিনের সাথে যোগাযোগ করুন।';
      case 'auth/quota-exceeded':
        return 'অনেক বেশি অনুরোধ। কিছুক্ষণ পরে আবার চেষ্টা করুন।';
      case 'auth/invalid-action-code':
        return 'অবৈধ পাসওয়ার্ড রিসেট লিংক';
      case 'auth/expired-action-code':
        return 'পাসওয়ার্ড রিসেট লিংক মেয়াদ শেষ হয়ে গেছে';
      default:
        return `একটি ত্রুটি ঘটেছে: ${errorCode}`;
    }
  };

  const changeMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setRegistrationWarning(false);
    reset();
  };

  const renderForm = () => {
    switch (mode) {
      case 'login':
        return (
          <motion.form
            key="login"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="space-y-4">
              <div>
                <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  ইমেইল *
                </label>
                <div className="relative">
                  <Mail size={20} className={`absolute left-4 top-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  <input
                    type="email"
                    {...register('email', {
                      required: 'ইমেইল আবশ্যক',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'ভুল ইমেইল ফরম্যাট'
                      }
                    })}
                    className={`w-full pl-12 pr-4 py-4 rounded-xl border text-base ${
                      darkMode
                        ? 'bg-gray-800 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200`}
                    placeholder="আপনার ইমেইল লিখুন"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle size={16} className="mr-1" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  পাসওয়ার্ড *
                </label>
                <div className="relative">
                  <Lock size={20} className={`absolute left-4 top-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', {
                      required: 'পাসওয়ার্ড আবশ্যক',
                      minLength: { value: 6, message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' }
                    })}
                    className={`w-full pl-12 pr-12 py-4 rounded-xl border text-base ${
                      darkMode
                        ? 'bg-gray-800 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200`}
                    placeholder="আপনার পাসওয়ার্ড লিখুন"
                  />
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-4 ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'}`}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </motion.button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle size={16} className="mr-1" />
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => changeMode('forgot-password')}
                className={`text-sm ${darkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-500'} transition-colors duration-200`}
              >
                পাসওয়ার্ড ভুলে গেছেন?
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-4">
                <LogIn size={20} />
              </span>
              {loading ? 'অপেক্ষা করুন...' : 'প্রবেশ করুন'}
            </motion.button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => changeMode('register')}
                className={`text-base ${darkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-500'} transition-colors duration-200`}
              >
                নতুন অ্যাকাউন্ট তৈরি করতে চান? নিবন্ধন করুন
              </button>
            </div>
          </motion.form>
        );

      case 'register':
        return (
          <motion.form
            key="register"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="space-y-4">
              <div>
                <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  নাম *
                </label>
                <div className="relative">
                  <User size={20} className={`absolute left-4 top-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  <input
                    type="text"
                    {...register('name', {
                      required: 'নাম আবশ্যক',
                      minLength: { value: 2, message: 'নাম কমপক্ষে ২ অক্ষরের হতে হবে' }
                    })}
                    className={`w-full pl-12 pr-4 py-4 rounded-xl border text-base ${
                      darkMode
                        ? 'bg-gray-800 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200`}
                    placeholder="আপনার নাম লিখুন"
                  />
                </div>
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle size={16} className="mr-1" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  ইমেইল *
                </label>
                <div className="relative">
                  <Mail size={20} className={`absolute left-4 top-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  <input
                    type="email"
                    {...register('email', {
                      required: 'ইমেইল আবশ্যক',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'ভুল ইমেইল ফরম্যাট'
                      }
                    })}
                    className={`w-full pl-12 pr-4 py-4 rounded-xl border text-base ${
                      darkMode
                        ? 'bg-gray-800 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200`}
                    placeholder="আপনার ইমেইল লিখুন"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle size={16} className="mr-1" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  পাসওয়ার্ড *
                </label>
                <div className="relative">
                  <Lock size={20} className={`absolute left-4 top-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', {
                      required: 'পাসওয়ার্ড আবশ্যক',
                      minLength: { value: 6, message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' }
                    })}
                    className={`w-full pl-12 pr-12 py-4 rounded-xl border text-base ${
                      darkMode
                        ? 'bg-gray-800 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200`}
                    placeholder="আপনার পাসওয়ার্ড লিখুন"
                  />
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-4 top-4 ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'}`}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </motion.button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle size={16} className="mr-1" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  পাসওয়ার্ড নিশ্চিত করুন *
                </label>
                <div className="relative">
                  <Lock size={20} className={`absolute left-4 top-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('confirmPassword', {
                      required: 'পাসওয়ার্ড নিশ্চিত করুন',
                      validate: value => value === password || 'পাসওয়ার্ড মিলছে না'
                    })}
                    className={`w-full pl-12 pr-4 py-4 rounded-xl border text-base ${
                      darkMode
                        ? 'bg-gray-800 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200`}
                    placeholder="পাসওয়ার্ড আবার লিখুন"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1 flex items-center">
                    <AlertCircle size={16} className="mr-1" />
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-4">
                <UserPlus size={20} />
              </span>
              {loading ? 'অপেক্ষা করুন...' : 'নিবন্ধন করুন'}
            </motion.button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => changeMode('login')}
                className={`text-base ${darkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-500'} transition-colors duration-200`}
              >
                ইতিমধ্যে অ্যাকাউন্ট আছে? প্রবেশ করুন
              </button>
            </div>
          </motion.form>
        );

      case 'forgot-password':
        return (
          <motion.form
            key="forgot-password"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
            onSubmit={handleSubmit(onSubmit)}
          >
                         <div className="space-y-4">
               <div>
                 <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                   ইমেইল *
                 </label>
                 <div className="relative">
                   <Mail size={20} className={`absolute left-4 top-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                   <input
                     type="email"
                     {...register('email', {
                       required: 'ইমেইল আবশ্যক',
                       pattern: {
                         value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                         message: 'ভুল ইমেইল ফরম্যাট'
                       }
                     })}
                     className={`w-full pl-12 pr-4 py-4 rounded-xl border text-base ${
                       darkMode
                         ? 'bg-gray-800 border-gray-600 text-white'
                         : 'bg-white border-gray-300 text-gray-900'
                     } focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all duration-200`}
                     placeholder="আপনার ইমেইল লিখুন"
                   />
                 </div>
                 {errors.email && (
                   <p className="text-red-500 text-sm mt-1 flex items-center">
                     <AlertCircle size={16} className="mr-1" />
                     {errors.email.message}
                   </p>
                 )}
               </div>
               

             </div>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-4">
                <Send size={20} />
              </span>
              {loading ? 'অপেক্ষা করুন...' : 'পাসওয়ার্ড রিসেট লিংক পাঠান'}
            </motion.button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => changeMode('login')}
                className={`text-base ${darkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-500'} transition-colors duration-200 flex items-center justify-center mx-auto`}
              >
                <ArrowLeft size={16} className="mr-2" />
                লগইন পেজে ফিরে যান
              </button>
            </div>
          </motion.form>
        );
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-50'} py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden`}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute -top-40 -right-40 w-80 h-80 ${darkMode ? 'bg-green-500' : 'bg-green-200'} rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob`}></div>
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 ${darkMode ? 'bg-blue-500' : 'bg-blue-200'} rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000`}></div>
        <div className={`absolute top-40 left-40 w-80 h-80 ${darkMode ? 'bg-purple-500' : 'bg-purple-200'} rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000`}></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-md w-full space-y-8 relative z-10"
      >
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <motion.div 
            className="flex justify-center"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-xl">
              <span className="text-white font-bold text-3xl">৳</span>
            </div>
          </motion.div>
          <h2 className={`mt-6 text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} tracking-wide`}>
            অর্থের হিসেব
          </h2>
          <p className={`mt-2 text-base ${darkMode ? 'text-gray-400' : 'text-gray-600'} font-medium`}>
            by MK Bashar
          </p>
          <div className={`w-20 h-1 ${darkMode ? 'bg-green-500' : 'bg-green-600'} rounded-full mx-auto mt-4`}></div>
          <p className={`mt-6 text-xl ${darkMode ? 'text-gray-300' : 'text-gray-700'} font-medium`}>
            {mode === 'login' && 'আপনার অ্যাকাউন্টে প্রবেশ করুন'}
            {mode === 'register' && 'নতুন অ্যাকাউন্ট তৈরি করুন'}
            {mode === 'forgot-password' && 'পাসওয়ার্ড রিসেট করুন'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-8 shadow-2xl backdrop-blur-sm`}
        >
          <AnimatePresence mode="wait">
            {renderForm()}
          </AnimatePresence>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl flex items-center"
            >
              <AlertCircle size={20} className="mr-2 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl flex items-center"
            >
              <CheckCircle size={20} className="mr-2 flex-shrink-0" />
              {success}
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};
