import React from 'react';

interface ThemedCheckboxProps {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const ThemedCheckbox: React.FC<ThemedCheckboxProps> = ({ checked, onChange, label, disabled, className }) => {
  return (
    <label className={`inline-flex items-center cursor-pointer select-none ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className || ''}`}>
      <span className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="peer appearance-none h-5 w-5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 checked:bg-green-600 checked:border-green-600 focus:ring-2 focus:ring-green-500 focus:outline-none transition"
        />
        <span className="pointer-events-none absolute left-0 top-0 h-5 w-5 flex items-center justify-center">
          <svg
            className="hidden peer-checked:block text-white"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M4 8.5L7 11.5L12 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>
      {label && <span className="ml-2 text-base text-gray-700 dark:text-gray-200">{label}</span>}
    </label>
  );
};
