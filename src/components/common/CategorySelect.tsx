import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from "../../store/useStore";
import './CategorySelect.css'; // For neutral ripple effect

interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  showSearch?: boolean;
}

export const CategorySelect: React.FC<CategorySelectProps> = ({ value, onChange, options, placeholder = 'ক্যাটেগরি নির্বাচন করুন', disabled, showSearch = true }) => {
  const { darkMode } = useStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

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
    <div className="inline-block relative" ref={ref} tabIndex={0} onKeyDown={handleKeyDown} style={{ width: '100%' }}>
      <button
        type="button"
        className={
          `w-full px-3 py-3 md:py-2 rounded-lg border flex items-center justify-between gap-2 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-lg md:text-base focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-200` +
          (open ? ' ring-2 ring-green-400 border-green-400' : '') +
          (disabled ? ' bg-gray-100 text-gray-400 cursor-not-allowed' : ' text-gray-900 dark:text-white')
        }
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{}}
      >
        <span className="flex items-center w-full font-normal tracking-wide text-left">
          {selected ? selected.label : <span className="text-gray-400">{placeholder}</span>}
        </span>
        <ChevronDown size={18} className={`transition-transform ${open ? 'rotate-180' : ''} ${disabled ? 'text-gray-300' : 'text-green-500 dark:text-green-300'}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96, y: 0 }}
            transition={{ duration: 0.44, ease: [0.22, 0.61, 0.36, 1] }}
            className="absolute left-0 mt-2 w-full min-w-[0] bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-2 max-h-64 overflow-y-auto z-50"
            style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.08)' }}
          >
            {showSearch && (
              <input
                type="text"
                autoFocus
                value={search}
                onChange={e => { setSearch(e.target.value); setHighlighted(0); }}
                placeholder="ক্যাটেগরি অনুসন্ধান..."
                className="w-full px-3 py-2 mb-2 rounded-lg border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-green-400"
              />
            )}
            {options.length === 0 ? (
              <div className="px-3 py-2 text-gray-400">কোনো ক্যাটেগরি নেই</div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-2 text-gray-400">কোনো মিল নেই</div>
            ) : (
              <AnimatePresence>
                {filtered.map((opt, i) => {
                  // Use opt.icon if present, otherwise extract emoji from label
                  let icon = opt.icon;
                  let labelText = opt.label;
                  if (!icon) {
                    const iconMatch = /^([\p{Emoji}\u200d\uFE0F\u20E3\u2600-\u27BF]+)\s+/u.exec(opt.label);
                    if (iconMatch) {
                      icon = iconMatch[1];
                      labelText = opt.label.replace(icon, '').trim();
                    }
                  }
                  const isSelected = opt.value === value;
                  const isHighlighted = i === highlighted;
                  return (
                    <motion.div
                      key={opt.value}
                      initial={false}
                      animate={isHighlighted || isSelected ? { scale: 1.02 } : { scale: 1 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                      exit={{ scale: 0.97, opacity: 0 }}
                      className={
                        `relative px-3 py-2 cursor-pointer select-none border rounded-lg flex items-center gap-2 mb-2 text-base transition-all duration-150 justify-center` +
                        (isSelected ? (darkMode
                          ? ' bg-green-900/20 border-green-500 text-green-200 font-bold'
                          : ' bg-green-50 border-green-400 text-green-700 font-bold')
                        : isHighlighted ? (darkMode
                          ? ' bg-green-900/30 border-green-400 text-green-200'
                          : ' bg-green-100 border-green-400 text-green-700')
                        : (darkMode
                          ? ' bg-gray-700 border-gray-600 text-gray-200'
                          : ' bg-white border-gray-300 text-gray-700'))
                      }
                      style={{ fontWeight: isSelected ? 600 : 400 }}
                      onMouseEnter={() => setHighlighted(i)}
                      onMouseDown={e => {
                        onChange(opt.value); setOpen(false); setSelectedIdx(i); setTimeout(() => setSelectedIdx(null), 400);
                      }}
                      onClick={() => { if (highlighted === i) { setSelectedIdx(i); setTimeout(() => setSelectedIdx(null), 400); } }}
                      role="option"
                      aria-selected={isSelected}
                      data-highlighted={isHighlighted ? true : undefined}
                      tabIndex={-1}
                    >
                      {icon && (
                        <motion.span
                          className="mr-2 text-xl flex-shrink-0 flex items-center justify-center"
                          key={isHighlighted ? `highlight-${i}` : isSelected ? `selected-${i}` : `icon-${i}`}
                          initial={{ scale: 1, rotate: 0 }}
                          animate={isHighlighted || isSelected ? { scale: [1, 1.13, 1], rotate: i % 2 === 0 ? -15 : 15 } : { scale: 1, rotate: 0 }}
                          transition={{ duration: 0.28, type: 'spring', stiffness: 350, damping: 22 }}
                        >
                          {icon}
                        </motion.span>
                      )}
                      <span className="text-left flex items-center justify-center">{labelText}</span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
