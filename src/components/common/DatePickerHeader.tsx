import React, { useState, ReactNode, useEffect } from 'react';
import { CategorySelect } from './CategorySelect';

interface CustomCalendarContainerProps {
  className?: string;
  children: ReactNode;
  onToday: () => void;
  onClear: () => void;
  darkMode: boolean;
}

export const CustomCalendarContainer: React.FC<CustomCalendarContainerProps> = ({ className = '', children, onToday, onClear, darkMode }) => {
  return (
    <div className={className + ' relative'}>
      {children}
      <div className="absolute bottom-0 left-0 w-full flex pointer-events-none">
        <div className="pointer-events-auto w-full">
          <div className="flex justify-between px-3 pb-2 pt-1 w-full">
            <button
              type="button"
              onClick={onClear}
              className={`px-3 py-1 rounded-lg font-medium text-sm ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} transition`}
            >মুছুন</button>
            <button
              type="button"
              onClick={onToday}
              className={`px-3 py-1 rounded-lg font-medium text-sm ${darkMode ? 'bg-green-700 text-white hover:bg-green-600' : 'bg-green-500 text-white hover:bg-green-600'} transition`}
            >আজ</button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DatePickerHeaderProps {
  date: Date;
  changeYear: (year: number) => void;
  changeMonth: (month: number) => void;
  darkMode: boolean;
  datePickerRef?: any; // Optional ref for forcing calendar updates
}

export const DatePickerHeader: React.FC<DatePickerHeaderProps> = ({ 
  date, 
  changeYear, 
  changeMonth, 
  darkMode,
  datePickerRef 
}) => {
  const years = Array.from({ length: 2100 - 2023 + 1 }, (_, i) => 2023 + i);
  const months = [
    "জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"
  ];
  
  const [showYearInput, setShowYearInput] = useState(false);
  const [customYear, setCustomYear] = useState(date.getFullYear().toString());
  const [yearError, setYearError] = useState('');
  const [selectedYear, setSelectedYear] = useState(date.getFullYear());

  // Update customYear when date changes
  useEffect(() => {
    setCustomYear(date.getFullYear().toString());
    setSelectedYear(date.getFullYear());
  }, [date.getFullYear()]);

  const yearOptions = years.map(year => ({ 
    value: year.toString(), 
    label: year.toLocaleString('bn-BD').replace(/,/g, '') 
  }));
  
  // Add custom year to options if needed
  if (
    typeof selectedYear === 'number' &&
    !years.includes(selectedYear)
  ) {
    yearOptions.push({ 
      value: selectedYear.toString(), 
      label: selectedYear.toLocaleString('bn-BD').replace(/,/g, '') 
    });
  }
  yearOptions.push({ value: 'custom', label: 'লিখুন' });
  
  const currentYear = (showYearInput ? 'custom' : (selectedYear || date.getFullYear())).toString();

  const handleCustomYearConfirm = () => {
    if (customYear && customYear.length === 4 && !isNaN(Number(customYear)) && Number(customYear) > 1900 && Number(customYear) < 3000) {
      setShowYearInput(false);
      setSelectedYear(Number(customYear));
      changeYear(Number(customYear));
      setYearError('');
      
      // Force calendar to show correct year if ref is provided
      if (datePickerRef?.current?.setPreSelection) {
        const newDate = new Date(Number(customYear), date.getMonth(), 1);
        datePickerRef.current.setPreSelection(newDate);
      }
    } else {
      setYearError('সঠিক বছর লিখুন');
    }
  };

  const handleYearChange = (val: string) => {
    if (val === 'custom') {
      setShowYearInput(true);
      setTimeout(() => {
        const input = document.getElementById('custom-year-input');
        if (input) input.focus();
      }, 50);
    } else {
      setShowYearInput(false);
      setSelectedYear(Number(val));
      changeYear(Number(val));
      setYearError('');
      
      // Force calendar to show correct year if ref is provided
      if (datePickerRef?.current?.setPreSelection) {
        const newDate = new Date(Number(val), date.getMonth(), 1);
        datePickerRef.current.setPreSelection(newDate);
      }
    }
  };

  const handleMonthChange = (val: string) => {
    changeMonth(Number(val));
    
    // Force calendar to show correct month if ref is provided
    if (datePickerRef?.current?.setPreSelection) {
      const newDate = new Date(date.getFullYear(), Number(val), 1);
      datePickerRef.current.setPreSelection(newDate);
    }
  };

  return (
    <div 
      className="flex items-center justify-center gap-2 py-3 rounded-t-xl shadow-sm" 
      style={{ background: darkMode ? '#18181b' : '#FCFFFD' }}
    >
      <div className="w-[90px]">
        {!showYearInput ? (
          <CategorySelect
            value={currentYear}
            onChange={handleYearChange}
            options={yearOptions}
            placeholder="বছর"
            disabled={false}
            showSearch={false}
          />
        ) : (
          <div className="relative">
            <input
              id="custom-year-input"
              type="number"
              className="w-full px-3 py-2 rounded-lg border text-center text-base font-bengali focus:ring-2 focus:ring-green-400 focus:border-green-400 shadow transition bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none"
              placeholder="লিখুন"
              value={customYear}
              onChange={e => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setCustomYear(val);
                setYearError('');
              }}
              onBlur={handleCustomYearConfirm}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCustomYearConfirm();
                if (e.key === 'Escape') {
                  setShowYearInput(false);
                  setCustomYear(selectedYear.toString());
                  setYearError('');
                }
              }}
              onMouseDown={e => e.stopPropagation()}
              onPointerDown={e => e.stopPropagation()}
            />
            {yearError && <div className="text-red-500 text-xs mt-1 text-center">{yearError}</div>}
          </div>
        )}
      </div>
      <div className="w-[110px]">
        <CategorySelect
          value={date.getMonth().toString()}
          onChange={handleMonthChange}
          options={months.map((month, idx) => ({ value: idx.toString(), label: month }))}
          placeholder="মাস"
          disabled={false}
          showSearch={false}
        />
      </div>
    </div>
  );
};
