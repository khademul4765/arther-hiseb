import React from 'react';

interface ThemedCheckboxProps {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  size?: number; // Add size prop
}

export const ThemedCheckbox: React.FC<ThemedCheckboxProps> = ({
  checked,
  onChange,
  label,
  disabled,
  className,
  size = 22, // Default size
}) => {
  return (
    <label
      className={`inline-flex items-center cursor-pointer select-none ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className || ''}`}
    >
      <span
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="absolute w-full h-full opacity-0 cursor-pointer m-0"
          style={{ zIndex: 2 }}
        />
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          fill="none"
          className="block"
          style={{ zIndex: 1 }}
        >
          {/* Minimal box outline with theme color when checked */}
          <rect
            x={size * 0.068}
            y={size * 0.068}
            width={size * 0.864}
            height={size * 0.864}
            rx={size * 0.227}
            stroke={checked ? "#22c55e" : "currentColor"}
            strokeWidth={size * 0.068}
            className={checked ? "" : "text-gray-400 dark:text-gray-300"}
            fill="none"
          />
          {/* Minimal checkmark with animation */}
          <path
            d={`M${size * 0.273} ${size * 0.545}L${size * 0.455} ${size * 0.727}L${size * 0.727} ${size * 0.318}`}
            stroke="#22c55e"
            strokeWidth={size * 0.1}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            style={{
              opacity: checked ? 1 : 0,
              transform: checked ? 'scale(1)' : 'scale(0.8)',
              transition: 'opacity 0.18s, transform 0.18s',
            }}
          />
        </svg>
      </span>
      {label && (
        <span className="ml-2 text-base text-gray-700 dark:text-gray-200">{label}</span>
      )}
    </label>
  );
};
