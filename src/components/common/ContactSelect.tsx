import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Search, User, Building, Phone, Mail, MapPin, Check, X, AlertTriangle } from 'lucide-react';

interface ContactSelectProps {
  value: string | null;
  onChange: (contactId: string | null) => void;
  allowAdd?: boolean;
  placeholder?: string;
  darkMode?: boolean;
}

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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(4px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />
          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28, duration: 0.22 }}
            className={`relative w-full max-w-sm rounded-xl p-6 shadow-xl border ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}
            style={{ minWidth: 320 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <AlertTriangle size={44} className="text-red-500 mb-2" />
              <h2 className="text-lg font-bold mb-1">কন্ট্যাক্ট ডিলিট করবেন?</h2>
              <p className="mb-4 text-sm">
                আপনি কি নিশ্চিতভাবে <span className="font-semibold text-red-600">"{contactName}"</span> কন্ট্যাক্টটি ডিলিট করতে চান?<br />এই কাজটি বাতিল করা যাবে না।
              </p>
              <div className="flex gap-3 w-full mt-2">
                <button
                  onClick={onClose}
                  className={`flex-1 px-4 py-2 rounded-lg border font-medium transition-colors ${darkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >বাতিল</button>
                <button
                  onClick={onConfirm}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium"
                >ডিলিট করুন</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ContactSelect: React.FC<ContactSelectProps> = ({ 
  value, 
  onChange, 
  allowAdd = true, 
  placeholder = "ব্যক্তি/প্রতিষ্ঠানের নাম লিখুন...",
  darkMode = false
}) => {
  const { contacts, addContact } = useStore();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState({ 
    name: '', 
    type: 'person' as 'person' | 'organization', 
    phone: '', 
    email: '', 
    address: '' 
  });
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<any>(null);

  const handleRequestDelete = (contact: any) => {
    setContactToDelete(contact);
    setDeleteModalOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (contactToDelete) {
      await useStore.getState().deleteContact(contactToDelete.id);
      setDeleteModalOpen(false);
      setContactToDelete(null);
      if (value === contactToDelete.id) onChange(null);
    }
  };
  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setContactToDelete(null);
  };

  // Filter contacts based on search
  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  // Check if search term doesn't match any existing contact
  const searchTermExists = contacts.some(c => 
    c.name.toLowerCase() === search.toLowerCase()
  );

  // Auto-fill new contact name when user types
  useEffect(() => {
    if (search && !searchTermExists && allowAdd) {
      setNewContact(prev => ({ ...prev, name: search }));
    }
  }, [search, searchTermExists, allowAdd]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowAddForm(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get selected contact name for display
  const selectedContact = contacts.find(c => c.id === value);

  const handleContactSelect = (contactId: string) => {
    onChange(contactId);
    setIsOpen(false);
    setSearch('');
    setShowAddForm(false);
  };

  const handleAddContact = async () => {
    setAddError(null);
    if (!newContact.name.trim()) {
      setAddError('নাম আবশ্যক!');
      return;
    }
    setIsAdding(true);
    try {
      const contactRef = await addContact(newContact);
      let selectedId = null;
      if (contactRef && contactRef.id) {
        selectedId = contactRef.id;
      } else {
        const found = contacts.find(c => c.name === newContact.name && (c.phone === newContact.phone || (!c.phone && !newContact.phone)));
        if (found) selectedId = found.id;
      }
      if (selectedId) {
        onChange(selectedId);
      }
      setShowAddForm(false);
      setSearch('');
      setNewContact({ name: '', type: 'person', phone: '', email: '', address: '' });
      setIsOpen(false);
    } catch (error) {
      setAddError('নতুন কন্ট্যাক্ট যোগ করা যায়নি!');
      console.error('Error adding contact:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    setShowAddForm(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setIsOpen(true);
    setShowAddForm(false);
  };

  const clearSelection = () => {
    onChange(null);
    setSearch('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Main Input */}
      <div className="relative">
        <Users size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
        <input
          ref={inputRef}
          type="text"
          value={selectedContact ? selectedContact.name : search}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-2 rounded-lg border text-base transition-all ${
            darkMode 
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-green-400 focus:ring-2 focus:ring-green-500/20' 
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20'
          } focus:outline-none`}
        />
        {selectedContact && (
          <button
            onClick={clearSelection}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 transition-colors ${
              darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
            }`}
          >
            <X size={14} className={darkMode ? 'text-gray-400' : 'text-gray-600'} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full left-0 right-0 mt-1 z-50 rounded-lg border shadow-lg ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            } ${showAddForm ? 'max-h-[500px]' : 'max-h-80'} overflow-hidden`}
          >
            {/* Search Results */}
            {filteredContacts.length > 0 && !showAddForm && (
              <div className="max-h-60 overflow-y-auto">
                {filteredContacts.map(contact => (
                  <motion.div
                    key={contact.id}
                    whileHover={{ backgroundColor: darkMode ? '#374151' : '#f3f4f6' }}
                    className={`px-4 py-3 cursor-pointer border-b last:border-b-0 transition-colors ${
                      darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'
                    } ${value === contact.id ? (darkMode ? 'bg-green-900/20' : 'bg-green-50') : ''}`}
                    onClick={() => handleContactSelect(contact.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          contact.type === 'person' 
                            ? (darkMode ? 'bg-blue-600' : 'bg-blue-100') 
                            : (darkMode ? 'bg-purple-600' : 'bg-purple-100')
                        }`}>
                          {contact.type === 'person' ? (
                            <User size={16} className={darkMode ? 'text-blue-200' : 'text-blue-600'} />
                          ) : (
                            <Building size={16} className={darkMode ? 'text-purple-200' : 'text-purple-600'} />
                          )}
                        </div>
                        <div>
                          <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{contact.name}</div>
                          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{contact.type === 'person' ? 'ব্যক্তি' : 'প্রতিষ্ঠান'}{contact.phone && ` • ${contact.phone}`}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {value === contact.id && (
                          <Check size={16} className="text-green-500" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Add New Contact Option */}
            {!showAddForm && search && !searchTermExists && allowAdd && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`px-4 py-3 border-t cursor-pointer transition-colors ${
                  darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'
                }`}
                onClick={() => setShowAddForm(true)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    darkMode ? 'bg-green-600' : 'bg-green-100'
                  }`}>
                    <Plus size={16} className={darkMode ? 'text-green-200' : 'text-green-600'} />
                  </div>
                  <div>
                    <div className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>"{search}" যোগ করুন</div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>নতুন যোগাযোগ হিসেবে সংরক্ষণ করুন</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Add Contact Form */}
            {showAddForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-4 border-t overflow-y-auto ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-50'}`}
              >
                <div className="space-y-3">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>নাম *</label>
                    <input
                      type="text"
                      value={newContact.name}
                      onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-green-400' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-green-500'
                      } focus:ring-2 focus:ring-green-500/20 focus:outline-none`}
                      placeholder="নাম লিখুন"
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>ধরন</label>
                    <select
                      value={newContact.type}
                      onChange={e => setNewContact({ ...newContact, type: e.target.value as 'person' | 'organization' })}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-green-400' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-green-500'
                      } focus:ring-2 focus:ring-green-500/20 focus:outline-none`}
                    >
                      <option value="person">ব্যক্তি</option>
                      <option value="organization">প্রতিষ্ঠান</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>ফোন</label>
                      <div className="relative">
                        <Phone size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                        <input
                          type="tel"
                          value={newContact.phone}
                          onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
                          className={`w-full pl-8 pr-3 py-2 rounded-lg border text-sm ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white focus:border-green-400' 
                              : 'bg-white border-gray-300 text-gray-900 focus:border-green-500'
                          } focus:ring-2 focus:ring-green-500/20 focus:outline-none`}
                          placeholder="ফোন নম্বর"
                        />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>ইমেইল</label>
                      <div className="relative">
                        <Mail size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                        <input
                          type="email"
                          value={newContact.email}
                          onChange={e => setNewContact({ ...newContact, email: e.target.value })}
                          className={`w-full pl-8 pr-3 py-2 rounded-lg border text-sm ${
                            darkMode 
                              ? 'bg-gray-700 border-gray-600 text-white focus:border-green-400' 
                              : 'bg-white border-gray-300 text-gray-900 focus:border-green-500'
                          } focus:ring-2 focus:ring-green-500/20 focus:outline-none`}
                          placeholder="ইমেইল ঠিকানা"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>ঠিকানা</label>
                    <div className="relative">
                      <MapPin size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                      <input
                        type="text"
                        value={newContact.address}
                        onChange={e => setNewContact({ ...newContact, address: e.target.value })}
                        className={`w-full pl-8 pr-3 py-2 rounded-lg border text-sm ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-green-400' 
                            : 'bg-white border-gray-300 text-gray-900 focus:border-green-500'
                        } focus:ring-2 focus:ring-green-500/20 focus:outline-none`}
                        placeholder="ঠিকানা"
                      />
                    </div>
                  </div>
                  {addError && (
                    <div className="text-red-500 text-sm font-medium mb-2">{addError}</div>
                  )}
                  <div className="flex space-x-2 pt-3 pb-1">
                    <button
                      type="button"
                      onClick={handleAddContact}
                      disabled={isAdding || !newContact.name.trim()}
                      className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isAdding || !newContact.name.trim()
                          ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {isAdding ? 'যোগ হচ্ছে...' : 'যোগ করুন'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewContact({ name: '', type: 'person', phone: '', email: '', address: '' });
                        setAddError(null);
                      }}
                      className={`px-4 py-3 rounded-lg text-sm font-medium border transition-colors ${
                        darkMode 
                          ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      বাতিল
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* No Results */}
            {!showAddForm && search && filteredContacts.length === 0 && searchTermExists && (
              <div className={`px-4 py-3 text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>কোন ফলাফল পাওয়া যায়নি</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <ConfirmDeleteContactModal
        open={deleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        contactName={contactToDelete?.name || ''}
        darkMode={darkMode}
      />
    </div>
  );
};

export default ContactSelect;
