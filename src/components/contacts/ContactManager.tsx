import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { User, Building2, Plus, X, Phone, Mail, MapPin, ChevronDown, Search, Filter, Users, Pencil, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const emptyContact = { name: '', type: 'person', phone: '', email: '', address: '' };

// ConfirmDeleteContactModal Component
const ConfirmDeleteContactModal = ({ open, onClose, onConfirm, contactName, darkMode }: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  contactName: string;
  darkMode?: boolean;
}) => {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') onConfirm();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose, onConfirm]);

  if (!open) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ 
          type: 'spring', 
          stiffness: 300, 
          damping: 25,
          duration: 0.3 
        }}
        className={`w-full max-w-sm rounded-xl p-6 shadow-xl border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
        style={{ minWidth: 320 }}
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div 
          className="flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: 'spring', 
              stiffness: 400, 
              damping: 15,
              delay: 0.2 
            }}
          >
            <AlertTriangle size={44} className="text-red-500 mb-2" />
          </motion.div>
          <motion.h2 
            className="text-lg font-bold mb-1"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            কন্ট্যাক্ট ডিলিট করবেন?
          </motion.h2>
          <motion.p 
            className="mb-4 text-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            আপনি কি নিশ্চিতভাবে <span className="font-semibold text-red-600">"{contactName}"</span> কন্ট্যাক্টটি ডিলিট করতে চান?<br />এই কাজটি বাতিল করা যাবে না।
          </motion.p>
          <motion.div 
            className="flex gap-3 w-full mt-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className={`flex-1 px-4 py-2 rounded-lg border font-medium transition-colors ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              বাতিল
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onConfirm}
              className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium"
            >
              ডিলিট করুন
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

// Custom TypeSelect for 'ধরন'
const typeOptions = [
  { value: 'person', label: 'ব্যক্তি', icon: <User size={18} className="text-green-500" /> },
  { value: 'organization', label: 'প্রতিষ্ঠান', icon: <Building2 size={18} className="text-blue-500" /> },
];

interface TypeSelectProps {
  value: string;
  onChange: (val: string) => void;
  darkMode: boolean;
}

const TypeSelect: React.FC<TypeSelectProps> = ({ value, onChange, darkMode }) => {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const ref = React.useRef<HTMLDivElement>(null);
  const selected = typeOptions.find(opt => opt.value === value);

  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && ref.current.contains && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref} tabIndex={0} style={{ width: '100%' }}>
      <button
        type="button"
        className={`w-full px-4 py-2 rounded-lg border flex items-center justify-between gap-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200` + (open ? ' ring-2 ring-green-400 border-green-400' : '')}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 font-normal tracking-wide text-left">
          {selected?.icon}
          {selected ? selected.label : <span className="text-gray-400">ধরন নির্বাচন করুন</span>}
        </span>
        <ChevronDown size={18} className={`transition-transform ${open ? 'rotate-180' : ''} text-green-500`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96, y: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
            className={`absolute left-0 mt-2 w-full min-w-[0] bg-white dark:bg-gray-700 border ${darkMode ? 'border-gray-600' : 'border-gray-300'} rounded-lg shadow-lg p-2 z-50`}
          >
            {typeOptions.map((opt, i) => {
              const isSelected = opt.value === value;
              const isHighlighted = i === highlighted;
              return (
                <motion.div
                  key={opt.value}
                  initial={false}
                  animate={isHighlighted || isSelected ? { scale: 1.02 } : { scale: 1 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                  exit={{ scale: 0.97, opacity: 0 }}
                  className={`relative px-3 py-2 cursor-pointer select-none border rounded-lg flex items-center gap-2 mb-2 text-base transition-all duration-150 justify-start ` +
                    (isSelected ? (darkMode ? ' bg-green-900/20 border-green-500 text-green-200 font-bold' : ' bg-green-50 border-green-400 text-green-700 font-bold')
                      : isHighlighted ? (darkMode ? ' bg-green-900/30 border-green-400 text-green-200' : ' bg-green-100 border-green-400 text-green-700')
                        : (darkMode ? ' bg-gray-700 border-gray-600 text-gray-200' : ' bg-white border-gray-300 text-gray-700'))}
                  style={{ fontWeight: isSelected ? 600 : 400 }}
                  onMouseEnter={() => setHighlighted(i)}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={-1}
                >
                  {opt.icon}
                  <span className="text-left flex items-center justify-center">{opt.label}</span>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const ContactManager: React.FC = () => {
  const { contacts, addContact, updateContact, deleteContact, darkMode } = useStore();
  const [form, setForm] = useState<any>(emptyContact);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'person' | 'organization'>('all');
  const [selectedContact, setSelectedContact] = useState<any | null>(null); // NEW: for details modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    if (!filterOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [filterOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    if (editingId) {
      updateContact(editingId, form);
    } else {
      addContact(form);
    }
    setForm(emptyContact);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (contact: any) => {
    setForm(contact);
    setEditingId(contact.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setContactToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleAddNew = () => {
    setForm(emptyContact);
    setEditingId(null);
    setShowForm(true);
  };

  const confirmDelete = () => {
    if (contactToDelete) {
      deleteContact(contactToDelete);
      setContactToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  // Filter contacts by search and type
  const filteredContacts = contacts.filter(c => {
    const q = search.toLowerCase();
    const matchesType = typeFilter === 'all' || c.type === typeFilter;
    return matchesType && (
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} tracking-wide mb-0`}>
            ব্যক্তি ও প্রতিষ্ঠান
          </h1>
          <div className={`w-20 h-1 ${darkMode ? 'bg-green-500' : 'bg-green-600'} rounded-full mt-2`}></div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAddNew}
          className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700"
          title="নতুন যোগ করুন"
        >
          <Plus size={22} />
          <span className="ml-2 font-semibold hidden sm:inline">নতুন যোগ করুন</span>
        </motion.button>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-4 md:p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
            >
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <h2 className={`text-lg md:text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{editingId ? 'যোগাযোগ সম্পাদনা' : 'নতুন যোগাযোগ'}</h2>
                <button
                  onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyContact); }}
                  className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-red-900/40' : 'hover:bg-red-100'}`}
                >
                  <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>নাম *</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-3 md:top-3.5 text-green-500" />
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="নাম"
                      className={`w-full pl-10 pr-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-green-500 focus:border-transparent focus:outline-none`}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>ধরন *</label>
                  <TypeSelect value={form.type} onChange={(val: string) => setForm((f: typeof form) => ({ ...f, type: val }))} darkMode={darkMode} />
                </div>
                <div>
                  <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>ফোন</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-3 md:top-3.5 text-green-500" />
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="ফোন"
                      className={`w-full pl-10 pr-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-green-500 focus:border-transparent focus:outline-none`}
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>ইমেইল</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-3 md:top-3.5 text-green-500" />
                    <input
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="ইমেইল"
                      className={`w-full pl-10 pr-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-green-500 focus:border-transparent focus:outline-none`}
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-base font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>ঠিকানা</label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-3 md:top-3.5 text-green-500" />
                    <input
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="ঠিকানা"
                      className={`w-full pl-10 pr-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:ring-2 focus:ring-green-500 focus:border-transparent focus:outline-none`}
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-all">
                    {editingId ? 'আপডেট করুন' : 'যোগ করুন'}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyContact); }} className={`flex-1 px-4 py-2 rounded-lg border font-semibold ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                    বাতিল
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact Details Modal */}
      <AnimatePresence>
        {selectedContact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-0 shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
            >
              {/* Gradient Header with Animated Icon Ring */}
              <div className={`relative rounded-t-2xl px-0 pt-0 pb-6 flex flex-col items-center justify-center ${selectedContact.type === 'person' ? 'bg-gradient-to-r from-green-400 via-green-500 to-green-600' : 'bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600'}`}>
                <button
                  onClick={() => setSelectedContact(null)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-red-100 dark:bg-gray-900/80 dark:hover:bg-red-900/40 shadow transition-colors"
                  title="বন্ধ করুন"
                >
                  <X size={20} className="text-gray-700 dark:text-gray-300" />
                </button>
                {/* Animated Glowing Ring */}
                <span className="mt-6 mb-2 relative flex items-center justify-center">
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className={`animate-pulse rounded-full ${selectedContact.type === 'person' ? 'bg-green-400/30' : 'bg-blue-400/30'} w-20 h-20`}></span>
                  </span>
                  <span className="rounded-full p-4 shadow-lg bg-white/90 dark:bg-gray-900/80 flex items-center justify-center relative z-10">
                    {selectedContact.type === 'person' ? <User size={40} className="text-green-500" /> : <Building2 size={40} className="text-blue-500" />}
                  </span>
                </span>
                <h2 className="text-2xl font-bold text-white drop-shadow mt-2">{selectedContact.name}</h2>
                <span className={`mt-2 text-xs px-3 py-1 rounded-full font-semibold ${selectedContact.type === 'person' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'} shadow-sm`}>{selectedContact.type === 'person' ? 'ব্যক্তি' : 'প্রতিষ্ঠান'}</span>
                {/* Floating Edit Button */}
                <button
                  onClick={() => { setShowForm(true); setEditingId(selectedContact.id); setForm(selectedContact); setSelectedContact(null); }}
                  className="absolute -bottom-6 right-8 bg-green-600 hover:bg-green-700 text-white rounded-full p-3 shadow-lg border-4 border-white dark:border-gray-800 transition-all z-20"
                  title="সম্পাদনা করুন"
                  style={{ boxShadow: '0 4px 24px 0 rgba(34,197,94,0.15)' }}
                >
                  <Pencil size={22} />
                </button>
              </div>
              {/* Details Card */}
              <div className={`p-6 space-y-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-b-2xl`}> 
                {/* Section Title & Divider */}
                <div className="mb-4">
                  <h3 className={`text-lg font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Contact Info</h3>
                  <div className={`h-1 w-16 rounded-full ${selectedContact.type === 'person' ? 'bg-green-400' : 'bg-blue-400'}`}></div>
                </div>
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.4, type: 'spring' }}
                  className="flex flex-col gap-3"
                >
                  {selectedContact.phone && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 shadow-sm">
                      <Phone size={20} className="text-green-500" />
                      <span className="font-medium text-gray-700 dark:text-gray-200">{selectedContact.phone}</span>
                    </div>
                  )}
                  {selectedContact.email && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 shadow-sm">
                      <Mail size={20} className="text-green-500" />
                      <span className="font-medium text-gray-700 dark:text-gray-200">{selectedContact.email}</span>
                    </div>
                  )}
                  {selectedContact.address && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 shadow-sm">
                      <MapPin size={20} className="text-green-500" />
                      <span className="font-medium text-gray-700 dark:text-gray-200">{selectedContact.address}</span>
                    </div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact List */}
      <div className="max-w-2xl mx-auto">
        {/* Search Bar */}
        <div className="mb-4 flex items-center gap-2 relative">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              <Search size={20} />
            </span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="অনুসন্ধান করুন..."
              className={`w-full pl-10 pr-12 py-2 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all`}
            />
            {search.length > 0 && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 bg-white/70 dark:bg-gray-800/80 hover:bg-red-50 dark:hover:bg-red-900/30 border border-transparent focus:outline-none transition-all"
                tabIndex={-1}
                aria-label="Clear search"
                style={{ lineHeight: 0 }}
              >
                <X size={18} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setFilterOpen(o => !o)}
            className={`p-2 rounded-lg border ml-1 ${darkMode ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'} transition-all`}
            title="ফিল্টার"
          >
            <Filter size={20} />
          </button>
          {filterOpen && (
            <div ref={filterRef} className={`absolute right-0 top-12 z-20 w-44 rounded-xl shadow-lg border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
              <div className="py-2">
                <button
                  className={`w-full flex items-center gap-2 text-left px-4 py-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg ${typeFilter === 'all' ? 'font-bold text-green-600 dark:text-green-400' : ''}`}
                  onClick={() => { setTypeFilter('all'); setFilterOpen(false); }}
                >
                  <Users size={18} className="text-green-500" />
                  সব ধরণ
                </button>
                <button
                  className={`w-full flex items-center gap-2 text-left px-4 py-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg ${typeFilter === 'person' ? 'font-bold text-green-600 dark:text-green-400' : ''}`}
                  onClick={() => { setTypeFilter('person'); setFilterOpen(false); }}
                >
                  <User size={18} className="text-green-500" />
                  ব্যক্তি
                </button>
                <button
                  className={`w-full flex items-center gap-2 text-left px-4 py-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg ${typeFilter === 'organization' ? 'font-bold text-green-600 dark:text-green-400' : ''}`}
                  onClick={() => { setTypeFilter('organization'); setFilterOpen(false); }}
                >
                  <Building2 size={18} className="text-blue-500" />
                  প্রতিষ্ঠান
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4">
          {filteredContacts.length === 0 && (
            <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-600'} text-lg`}>কোনো যোগাযোগ নেই</div>
          )}
          {filteredContacts.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              whileHover={{ scale: 1.01, y: -2 }}
              className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-5 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm flex items-center gap-4 cursor-pointer`}
              onClick={e => {
                // Prevent click if edit/delete button is clicked
                if ((e.target as HTMLElement).closest('button')) return;
                setSelectedContact(c);
              }}
            >
              <span className={`rounded-xl p-3 text-2xl shadow-md flex items-center justify-center ${c.type === 'person' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'} dark:bg-gray-700 dark:text-white`}>
                {c.type === 'person' ? <User size={24} /> : <Building2 size={24} />}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg md:text-xl truncate">{c.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${c.type === 'person' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'} dark:bg-gray-700 dark:text-white`}>{c.type === 'person' ? 'ব্যক্তি' : 'প্রতিষ্ঠান'}</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm">
                  {c.phone && <span className={`flex items-center gap-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}><Phone size={14} /> {c.phone}</span>}
                  {c.email && <span className={`flex items-center gap-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}><Mail size={14} /> {c.email}</span>}
                  {c.address && <span className={`flex items-center gap-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}><MapPin size={13} /> {c.address}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <motion.button
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={e => { e.stopPropagation(); handleEdit(c); }}
                  className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} shadow-md transition-all duration-200`}
                >
                  <Pencil size={16} className={darkMode ? 'text-gray-400' : 'text-green-600'} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={e => { e.stopPropagation(); handleDelete(c.id); }}
                  className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} shadow-md transition-all duration-200`}
                >
                  <X size={16} className="text-red-500" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmOpen && contactToDelete && (
          <ConfirmDeleteContactModal
            open={deleteConfirmOpen}
            onClose={() => setDeleteConfirmOpen(false)}
            onConfirm={confirmDelete}
            contactName={contacts.find(c => c.id === contactToDelete)?.name || ''}
            darkMode={darkMode}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContactManager;
