import React, { useState, useMemo, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { CategoryForm } from './CategoryForm';
import { SubcategoryForm } from './SubcategoryForm';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Tag, ChevronDown, ChevronRight, FolderOpen, Folder } from 'lucide-react';

export const CategoryManager: React.FC = () => {
  const { categories, deleteCategory, darkMode, user } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [showSubcategoryForm, setShowSubcategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<any>(null);
  const [selectedParentCategory, setSelectedParentCategory] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; action?: () => void } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const undoTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleEditSubcategory = (subcategory: any) => {
    setEditingSubcategory(subcategory);
    setShowSubcategoryForm(true);
  };

  const handleAddSubcategory = (parentCategory: any) => {
    setSelectedParentCategory(parentCategory);
    setShowSubcategoryForm(true);
  };

  const handleDelete = (id: string) => {
    setPendingDelete(id);
    setToast({
      message: 'ক্যাটেগরি মুছে ফেলা হয়েছে',
      action: handleUndo
    });
    if (undoTimeout.current) clearTimeout(undoTimeout.current);
    undoTimeout.current = setTimeout(() => {
      finalizeDelete(id);
      setToast(null);
      setPendingDelete(null);
    }, 5000);
    setShowDeleteConfirm(null);
  };

  const finalizeDelete = (id: string) => {
    deleteCategory(id);
  };

  const handleUndo = () => {
    if (undoTimeout.current) clearTimeout(undoTimeout.current);
    setToast(null);
    setPendingDelete(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCategory(null);
  };

  const handleCloseSubcategoryForm = () => {
    setShowSubcategoryForm(false);
    setEditingSubcategory(null);
    setSelectedParentCategory(null);
  };

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Filter categories to only show current user's categories and remove duplicates
  const userCategories = useMemo(() => {
    if (!user) return [];
    
    const filteredCategories = categories.filter(c => c.userId === user.id);
    
    // Remove duplicates based on name and type combination
    const uniqueCategories = filteredCategories.reduce((acc, current) => {
      const existing = acc.find(cat => 
        cat.name.toLowerCase() === current.name.toLowerCase() && 
        cat.type === current.type &&
        cat.isSubcategory === current.isSubcategory &&
        cat.parentId === current.parentId
      );
      
      if (!existing) {
        acc.push(current);
      } else {
        // Keep the one that was created first (or is default)
        if (current.isDefault && !existing.isDefault) {
          const index = acc.findIndex(cat => cat.id === existing.id);
          acc[index] = current;
        } else if (!current.isDefault && !existing.isDefault) {
          // Keep the one created first
          if (new Date(current.createdAt) < new Date(existing.createdAt)) {
            const index = acc.findIndex(cat => cat.id === existing.id);
            acc[index] = current;
          }
        }
      }
      
      return acc;
    }, [] as typeof filteredCategories);
    
    return uniqueCategories;
  }, [categories, user]);

  // Separate main categories and subcategories
  const mainCategories = userCategories.filter(c => !c.isSubcategory);
  const subcategories = userCategories.filter(c => c.isSubcategory);

  // Group subcategories by parent
  const subcategoriesByParent = useMemo(() => {
    const grouped: { [parentId: string]: typeof subcategories } = {};
    subcategories.forEach(sub => {
      if (!grouped[sub.parentId!]) {
        grouped[sub.parentId!] = [];
      }
      grouped[sub.parentId!].push(sub);
    });
    return grouped;
  }, [subcategories]);

  const expenseCategories = mainCategories.filter(c => c.type === 'expense');
  const incomeCategories = mainCategories.filter(c => c.type === 'income');

  const renderCategoryItem = (category: any, isSubcategory = false, parentId?: string) => {
    const categorySubcategories = subcategoriesByParent[category.id] || [];
    const hasSubcategories = categorySubcategories.length > 0;
    const isExpanded = expandedCategories.has(category.id);

    return (
      <div key={category.id}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className={`flex items-center justify-between p-3 rounded-lg ${
            darkMode ? 'bg-gray-700' : 'bg-gray-50'
          } ${isSubcategory ? 'ml-6 border-l-2 border-green-500' : ''}`}
        >
          <div className="flex items-center space-x-3">
            {hasSubcategories && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => toggleExpanded(category.id)}
                className={`p-1 rounded ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
              >
                {isExpanded ? (
                  <ChevronDown size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                ) : (
                  <ChevronRight size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                )}
              </motion.button>
            )}
            {!hasSubcategories && isSubcategory && (
              <div className="w-6" /> // Spacer for alignment
            )}
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: category.color }}
            />
            <span className="text-2xl">{category.icon}</span>
            <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {category.name}
            </span>
            {category.isDefault && (
              <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                ডিফল্ট
              </span>
            )}
            {isSubcategory && (
              <span className={`text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-blue-600 text-blue-200' : 'bg-blue-100 text-blue-700'}`}>
                সাবক্যাটেগরি
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {!isSubcategory && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleAddSubcategory(category)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                title="সাবক্যাটেগরি যোগ করুন"
              >
                <Plus size={16} className={darkMode ? 'text-green-400' : 'text-green-600'} />
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => isSubcategory ? handleEditSubcategory(category) : handleEdit(category)}
              className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
            >
              <Edit2 size={16} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
            </motion.button>
            {!category.isDefault && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowDeleteConfirm(category.id)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
              >
                <Trash2 size={16} className="text-red-500" />
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Subcategories */}
        {hasSubcategories && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-2 space-y-2"
          >
            {categorySubcategories.map((subcategory) => 
              renderCategoryItem(subcategory, true, category.id)
            )}
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} tracking-wide mb-0`}>
            ক্যাটেগরি ব্যবস্থাপনা
          </h1>
          <div className={`w-20 h-1 ${darkMode ? 'bg-green-500' : 'bg-green-600'} rounded-full mt-2`}></div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700"
        >
          <Plus size={20} />
          <span>নতুন ক্যাটেগরি</span>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6`}
        >
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
            <Tag size={20} className="mr-2 text-red-500" />
            খরচের ক্যাটেগরি ({expenseCategories.length})
          </h2>
          <div className="space-y-3">
            {expenseCategories.map((category) => renderCategoryItem(category))}
            {expenseCategories.length === 0 && (
              <p className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                কোন খরচের ক্যাটেগরি নেই
              </p>
            )}
          </div>
        </motion.div>

        {/* Income Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6`}
        >
          <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
            <Tag size={20} className="mr-2 text-green-500" />
            আয়ের ক্যাটেগরি ({incomeCategories.length})
          </h2>
          <div className="space-y-3">
            {incomeCategories.map((category) => renderCategoryItem(category))}
            {incomeCategories.length === 0 && (
              <p className={`text-center py-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                কোন আয়ের ক্যাটেগরি নেই
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Category Form Modal */}
      {showForm && (
        <CategoryForm
          category={editingCategory}
          onClose={handleCloseForm}
          onSubmit={handleCloseForm}
        />
      )}

      {/* Subcategory Form Modal */}
      {showSubcategoryForm && (
        <SubcategoryForm
          subcategory={editingSubcategory}
          parentCategory={selectedParentCategory}
          onClose={handleCloseSubcategoryForm}
          onSubmit={handleCloseSubcategoryForm}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-md`}
          >
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
              ক্যাটেগরি মুছবেন?
            </h3>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
              এই ক্যাটেগরিটি স্থায়ীভাবে মুছে ফেলা হবে। এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className={`flex-1 px-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                বাতিল
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                মুছে ফেলুন
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-4 animate-fade-in">
          <span>{toast.message}</span>
          {toast.action && (
            <button
              onClick={toast.action}
              className="ml-2 px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white font-semibold transition"
            >
              Undo
            </button>
          )}
        </div>
      )}
    </div>
  );
};
