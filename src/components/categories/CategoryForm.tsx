import React from 'react';
import { useStore } from '../../store/useStore';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { X, Tag, Palette } from 'lucide-react';

interface CategoryFormProps {
  onClose: () => void;
  onSubmit: () => void;
  category?: any;
}

interface FormData {
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
}

const colorOptions = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8E8', '#F7DC6F', '#FF8A80', '#81C784',
  '#64B5F6', '#FFB74D', '#F06292', '#9575CD', '#4DB6AC'
];

const iconOptions = [
  '🍽️', '🚗', '🎬', '🏥', '📚', '🏠', '👕', '⚡', '📱', '🎮',
  '💰', '🏢', '📈', '🎯', '💼', '🎨', '🏃', '✈️', '🛒', '🎵'
];

export const CategoryForm: React.FC<CategoryFormProps> = ({
  onClose,
  onSubmit,
  category
}) => {
  const { addCategory, updateCategory, categories, user, darkMode } = useStore();
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>({
    defaultValues: category ? {
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon
    } : {
      type: 'expense',
      color: colorOptions[0],
      icon: iconOptions[0]
    }
  });

  const selectedColor = watch('color');
  const selectedIcon = watch('icon');
  const selectedType = watch('type');
  const selectedName = watch('name');

  const onFormSubmit = (data: FormData) => {
    if (!user) return;

    // Check for duplicate categories (case-insensitive)
    const existingCategory = categories.find(c => 
      c.userId === user.id &&
      c.name.toLowerCase() === data.name.toLowerCase() && 
      c.type === data.type &&
      c.id !== category?.id // Exclude current category when editing
    );

    if (existingCategory) {
      alert('এই নামে ইতিমধ্যে একটি ক্যাটেগরি রয়েছে। অন্য নাম ব্যবহার করুন।');
      return;
    }

    if (category) {
      updateCategory(category.id, data);
    } else {
      addCategory({ ...data, isDefault: false });
    }
    onSubmit();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {category ? 'ক্যাটেগরি সম্পাদনা' : 'নতুন ক্যাটেগরি'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          >
            <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              ক্যাটেগরির নাম *
            </label>
            <div className="relative">
              <Tag size={16} className={`absolute left-3 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <input
                type="text"
                {...register('name', { 
                  required: 'ক্যাটেগরির নাম আবশ্যক',
                  minLength: { value: 2, message: 'নাম কমপক্ষে ২ অক্ষরের হতে হবে' },
                  maxLength: { value: 30, message: 'নাম সর্বোচ্চ ৩০ অক্ষরের হতে পারে' }
                })}
                className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                placeholder="ক্যাটেগরির নাম লিখুন"
              />
            </div>
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              ধরন *
            </label>
            <select
              {...register('type', { required: 'ধরন নির্বাচন করুন' })}
              className={`w-full px-3 py-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
            >
              <option value="expense">খরচ</option>
              <option value="income">আয়</option>
            </select>
          </div>

          {/* Color */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              রং *
            </label>
            <div className="grid grid-cols-5 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue('color', color)}
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
                    selectedColor === color 
                      ? 'border-gray-900 scale-110 shadow-lg' 
                      : 'border-gray-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Icon */}
          <div>
            <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              আইকন *
            </label>
            <div className="grid grid-cols-5 gap-2">
              {iconOptions.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setValue('icon', icon)}
                  className={`w-10 h-10 rounded-lg border-2 text-xl flex items-center justify-center transition-all ${
                    selectedIcon === icon 
                      ? darkMode ? 'border-green-500 bg-gray-700 scale-110' : 'border-green-500 bg-green-50 scale-110'
                      : darkMode ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              প্রিভিউ:
            </p>
            <div className="flex items-center space-x-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="text-2xl">{selectedIcon}</span>
              <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {selectedName || 'ক্যাটেগরির নাম'}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                selectedType === 'income' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {selectedType === 'income' ? 'আয়' : 'খরচ'}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2 rounded-lg border ${
                darkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
            >
              {category ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
