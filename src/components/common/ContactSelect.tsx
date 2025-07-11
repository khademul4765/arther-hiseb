import React, { useState } from 'react';
import { useStore } from '../../store/useStore';

interface ContactSelectProps {
  value: string | null;
  onChange: (contactId: string | null) => void;
  allowAdd?: boolean;
}

const ContactSelect: React.FC<ContactSelectProps> = ({ value, onChange, allowAdd = true }) => {
  const { contacts, addContact } = useStore();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', type: 'person', phone: '', email: '', address: '' });

  const filtered = contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name) return;
    addContact(newContact);
    setShowAdd(false);
    setSearch('');
    setNewContact({ name: '', type: 'person', phone: '', email: '', address: '' });
  };

  return (
    <div>
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="নাম দিয়ে খুঁজুন"
        className="w-full border rounded px-3 py-2 mb-2"
      />
      <div className="border rounded bg-white max-h-40 overflow-y-auto">
        {filtered.map(c => (
          <div
            key={c.id}
            className={`px-3 py-2 cursor-pointer hover:bg-green-50 ${value === c.id ? 'bg-green-100' : ''}`}
            onClick={() => onChange(c.id)}
          >
            {c.name} <span className="text-xs text-gray-500">({c.type === 'person' ? 'ব্যক্তি' : 'প্রতিষ্ঠান'})</span>
          </div>
        ))}
        {allowAdd && !showAdd && (
          <div className="px-3 py-2 cursor-pointer text-green-600 hover:bg-green-50" onClick={() => setShowAdd(true)}>
            + নতুন যোগ করুন
          </div>
        )}
      </div>
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-gray-50 p-3 rounded mt-2 space-y-2">
          <input
            name="name"
            value={newContact.name}
            onChange={e => setNewContact({ ...newContact, name: e.target.value })}
            placeholder="নাম"
            className="w-full border rounded px-3 py-2"
            required
          />
          <select name="type" value={newContact.type} onChange={e => setNewContact({ ...newContact, type: e.target.value })} className="w-full border rounded px-3 py-2">
            <option value="person">ব্যক্তি</option>
            <option value="organization">প্রতিষ্ঠান</option>
          </select>
          <input
            name="phone"
            value={newContact.phone}
            onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
            placeholder="ফোন"
            className="w-full border rounded px-3 py-2"
          />
          <input
            name="email"
            value={newContact.email}
            onChange={e => setNewContact({ ...newContact, email: e.target.value })}
            placeholder="ইমেইল"
            className="w-full border rounded px-3 py-2"
          />
          <input
            name="address"
            value={newContact.address}
            onChange={e => setNewContact({ ...newContact, address: e.target.value })}
            placeholder="ঠিকানা"
            className="w-full border rounded px-3 py-2"
          />
          <div className="flex gap-2">
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">যোগ করুন</button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded border">বাতিল</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ContactSelect;
