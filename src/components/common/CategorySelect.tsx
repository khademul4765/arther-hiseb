import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({ value, onChange, options, placeholder = 'ক্যাটেগরি নির্বাচন করুন', disabled }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      setHighlighted(h => Math.min(h + 1, filtered.length - 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setHighlighted(h => Math.max(h - 1, 0));
      e.preventDefault();
    } else if (e.key === 'Enter') {
      if (filtered[highlighted]) {
        onChange(filtered[highlighted].value);
        setOpen(false);
      }
      e.preventDefault();
    } else if (e.key === 'Escape') {
      setOpen(false);
      e.preventDefault();
    }
  };

  const selected = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={ref} tabIndex={0} onKeyDown={handleKeyDown}>
      <button
        type="button"
        className={`w-full px-3 py-2 rounded-lg border text-left flex items-center justify-between focus:ring-2 focus:ring-green-500 focus:border-transparent ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-900 border-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-600'}`}
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{selected ? selected.label : <span className="text-gray-400">{placeholder}</span>}</span>
        <ChevronDown size={18} className={`ml-2 transition-transform ${open ? 'rotate-180' : ''} ${disabled ? 'text-gray-300' : 'text-gray-500 dark:text-gray-300'}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[180px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto animate-fade-in">
          <input
            type="text"
            autoFocus
            value={search}
            onChange={e => { setSearch(e.target.value); setHighlighted(0); }}
            placeholder="ক্যাটেগরি অনুসন্ধান..."
            className="w-full px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none"
          />
          {options.length === 0 ? (
            <div className="px-3 py-2 text-gray-400">কোনো ক্যাটেগরি নেই</div>
          ) : filtered.length === 0 ? (
            <div className="px-3 py-2 text-gray-400">কোনো মিল নেই</div>
          ) : (
            filtered.map((opt, i) => (
              <div
                key={opt.value}
                className={`px-3 py-2 cursor-pointer ${i === highlighted ? 'bg-green-100 dark:bg-green-900/30' : ''} ${opt.value === value ? 'font-bold' : ''}`}
                onMouseEnter={() => setHighlighted(i)}
                onMouseDown={() => { onChange(opt.value); setOpen(false); }}
                role="option"
                aria-selected={opt.value === value}
              >
                {opt.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
