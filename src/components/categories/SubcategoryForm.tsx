import React, { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { X, Tag, Palette, PlusCircle, MinusCircle, FolderOpen } from 'lucide-react';

interface SubcategoryFormProps {
  onClose: () => void;
  onSubmit: () => void;
  parentCategory?: any;
  subcategory?: any;
}

interface FormData {
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  parentId: string;
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

export const SubcategoryForm: React.FC<SubcategoryFormProps> = ({
  onClose,
  onSubmit,
  parentCategory,
  subcategory
}) => {
  const { addCategory, updateCategory, categories, user, darkMode } = useStore();
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>({
    defaultValues: subcategory ? {
      name: subcategory.name,
      type: subcategory.type,
      color: subcategory.color,
      icon: subcategory.icon,
      parentId: subcategory.parentId
    } : {
      type: parentCategory?.type || 'expense',
      color: colorOptions[0],
      icon: iconOptions[0],
      parentId: parentCategory?.id || ''
    }
  });

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const selectedColor = watch('color');
  const selectedIcon = watch('icon');
  const selectedType = watch('type');
  const selectedName = watch('name');
  const selectedParentId = watch('parentId');

  // Get parent categories for the selected type
  const parentCategories = categories.filter(c => 
    c.type === selectedType && !c.parentId // Only main categories
  );

  const onFormSubmit = (data: FormData) => {
    if (!user) return;

    // Check for duplicate subcategories (case-insensitive)
    const existingSubcategory = categories.find(c => 
      c.name.toLowerCase() === data.name.toLowerCase() && 
      c.type === data.type &&
      c.parentId === data.parentId &&
      c.id !== subcategory?.id
    );

    if (existingSubcategory) {
      alert('এই নামে ইতিমধ্যে একটি উপ-ক্যাটেগরি রয়েছে। অন্য নাম ব্যবহার করুন।');
      return;
    }

    const categoryData = {
      ...data,
      isSubcategory: true
    };

    if (subcategory) {
      updateCategory(subcategory.id, categoryData);
    } else {
      addCategory(categoryData);
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
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className={`text-lg md:text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {subcategory ? 'উপ-ক্যাটেগরি সম্পাদনা' : 'নতুন উপ-ক্যাটেগরি'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-red-900/40' : 'hover:bg-red-100'}`}
          >
            <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              উপ-ক্যাটেগরির নাম *
            </label>
            <div className="relative">
              <Tag size={16} className={`absolute left-3 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <input
                type="text"
                {...register('name', { 
                  required: 'উপ-ক্যাটেগরির নাম আবশ্যক',
                  minLength: { value: 2, message: 'নাম কমপক্ষে ২ অক্ষরের হতে হবে' },
                  maxLength: { value: 30, message: 'নাম সর্বোচ্চ ৩০ অক্ষরের হতে পারে' }
                })}
                className={`w-full pl-10 pr-3 py-3 md:py-2 rounded-lg border text-lg md:text-base ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-green-500 focus:border-transparent focus:outline-none`}
                placeholder="উপ-ক্যাটেগরির নাম লিখুন"
              />
            </div>
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
              ধরন *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-colors ${selectedType === 'expense' ? darkMode ? 'border-red-500 bg-red-900/20' : 'border-red-500 bg-red-50' : darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'}`}>
                <input type="radio" value="expense" {...register('type', { required: 'ধরন নির্বাচন করুন' })} className="sr-only" />
                <MinusCircle size={18} className={`mr-2 ${selectedType === 'expense' ? 'text-red-600' : darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={`font-medium ${selectedType === 'expense' ? 'text-red-600' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}>খরচ</span>
              </label>
              <label className={`flex items-center justify-center p-3 rounded-lg border cursor-pointer transition-colors ${selectedType === 'income' ? darkMode ? 'border-green-500 bg-green-900/20' : 'border-green-500 bg-green-50' : darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-50'}`}>
                <input type="radio" value="income" {...register('type', { required: 'ধরন নির্বাচন করুন' })} className="sr-only" />
                <PlusCircle size={18} className={`mr-2 ${selectedType === 'income' ? 'text-green-600' : darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                <span className={`font-medium ${selectedType === 'income' ? 'text-green-600' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}>আয়</span>
              </label>
            </div>
          </div>

          {/* Parent Category Selection */}
          <div>
            <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
              মূল ক্যাটেগরি নির্বাচন করুন *
            </label>
            <div className="relative">
              <FolderOpen size={16} className={`absolute left-3 top-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
              <select
                {...register('parentId', { required: 'মূল ক্যাটেগরি নির্বাচন করুন' })}
                className={`w-full pl-10 pr-3 py-3 md:py-2 rounded-lg border text-lg md:text-base ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
              >
                <option value="">মূল ক্যাটেগরি নির্বাচন করুন</option>
                {parentCategories.map((parentCat) => (
                  <option key={parentCat.id} value={parentCat.id}>
                    {parentCat.icon} {parentCat.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.parentId && (
              <p className="text-red-500 text-sm mt-1">{errors.parentId.message}</p>
            )}
          </div>

          {/* Color */}
          <div>
            <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
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
            <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
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
                {selectedName || 'উপ-ক্যাটেগরির নাম'}
              </span>
              <span className={`text-sm px-2 py-1 rounded-full ${
                selectedType === 'income' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {selectedType === 'income' ? 'আয়' : 'খরচ'}
              </span>
              <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                উপ-ক্যাটেগরি
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-3 rounded-lg border font-medium transition-colors ${
                darkMode 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
            >
              {subcategory ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
