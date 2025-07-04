import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, LogIn, UserPlus } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { useStore } from '../../store/useStore';

interface AuthFormData {
  name?: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

export const AuthForm: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser, darkMode } = useStore();

  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm<AuthFormData>();

  const password = watch('password');

  const onSubmit = async (data: AuthFormData) => {
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Login
        const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
        const user = userCredential.user;
        
        setUser({
          id: user.uid,
          email: user.email!,
          name: user.displayName || 'ব্যবহারকারী',
          createdAt: new Date()
        });
      } else {
        // Registration
        if (data.password !== data.confirmPassword) {
          setError('পাসওয়ার্ড মিলছে না');
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
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(getErrorMessage(error.code));
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
      default:
        return 'একটি ত্রুটি ঘটেছে। আবার চেষ্টা করুন।';
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    reset();
  };

  return (
    <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} py-12 px-4 sm:px-6 lg:px-8`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">৳</span>
            </div>
          </div>
          <h2 className={`mt-6 text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            অর্থ হিসেব
          </h2>
          <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            by Khademul Bashar
          </p>
          <p className={`mt-4 text-lg ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {isLogin ? 'আপনার অ্যাকাউন্টে প্রবেশ করুন' : 'নতুন অ্যাকাউন্ট তৈরি করুন'}
          </p>
        </div>

        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 space-y-6"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="space-y-4">
            {!isLogin && (
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  নাম *
                </label>
                <div className="relative">
                  <User size={20} className={`absolute left-3 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  <input
                    type="text"
                    {...register('name', { 
                      required: !isLogin ? 'নাম আবশ্যক' : false,
                      minLength: { value: 2, message: 'নাম কমপক্ষে ২ অক্ষরের হতে হবে' }
                    })}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                    placeholder="আপনার নাম লিখুন"
                  />
                </div>
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>
            )}

            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                ইমেইল *
              </label>
              <div className="relative">
                <Mail size={20} className={`absolute left-3 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                <input
                  type="email"
                  {...register('email', { 
                    required: 'ইমেইল আবশ্যক',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'ভুল ইমেইল ফরম্যাট'
                    }
                  })}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  placeholder="আপনার ইমেইল লিখুন"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                পাসওয়ার্ড *
              </label>
              <div className="relative">
                <Lock size={20} className={`absolute left-3 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { 
                    required: 'পাসওয়ার্ড আবশ্যক',
                    minLength: { value: 6, message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' }
                  })}
                  className={`w-full pl-10 pr-12 py-3 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                  placeholder="আপনার পাসওয়ার্ড লিখুন"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            {!isLogin && (
              <div>
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                  পাসওয়ার্ড নিশ্চিত করুন *
                </label>
                <div className="relative">
                  <Lock size={20} className={`absolute left-3 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('confirmPassword', { 
                      required: !isLogin ? 'পাসওয়ার্ড নিশ্চিত করুন' : false,
                      validate: value => isLogin || value === password || 'পাসওয়ার্ড মিলছে না'
                    })}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                    placeholder="পাসওয়ার্ড আবার লিখুন"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
              </span>
              {loading ? 'অপেক্ষা করুন...' : (isLogin ? 'প্রবেশ করুন' : 'নিবন্ধন করুন')}
            </motion.button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={toggleMode}
              className={`text-sm ${darkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-500'}`}
            >
              {isLogin 
                ? 'নতুন অ্যাকাউন্ট তৈরি করতে চান? নিবন্ধন করুন'
                : 'ইতিমধ্যে অ্যাকাউন্ট আছে? প্রবেশ করুন'
              }
            </button>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
};
