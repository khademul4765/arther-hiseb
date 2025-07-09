import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { AccountForm } from './AccountForm';
import { TransferForm } from './TransferForm';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, ArrowRightLeft, Wallet, Building2, Smartphone } from 'lucide-react';
import { TransactionItem } from '../transactions/TransactionItem';
import { CategorySelect } from '../common/CategorySelect';
import { ThemedCheckbox } from '../common/ThemedCheckbox';


interface AccountCardProps {
  account: any;
  darkMode: boolean;
  getAccountIcon: (type: string) => React.ReactNode;
  getAccountTypeName: (type: string) => string;
  onEdit: (account: any) => void;
  onDelete: (id: string) => void;
  setShowDeleteConfirm: (id: string) => void;
}

const AccountCard: React.FC<AccountCardProps & { isDefault?: boolean; onSetDefault?: (id: string) => void; onClick?: () => void }> = ({ account, darkMode, getAccountIcon, getAccountTypeName, onEdit, setShowDeleteConfirm, isDefault, onSetDefault, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    whileHover={{ scale: 1.035 }}
    className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-2xl hover:ring-2 hover:ring-green-200 dark:hover:ring-green-900/30 backdrop-blur-sm transition-all duration-300 cursor-pointer`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        {getAccountIcon(account.type)}
        <div className="min-w-0 flex-1">
          <h3 className={`text-base md:text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} truncate`}>
            {account.name}
          </h3>
          <p className={`text-xs md:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{getAccountTypeName(account.type)}</p>
        </div>
      </div>
      <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
        {/* Default account indicator/button for cash accounts */}
        {onSetDefault && (
          <button
            onClick={() => onSetDefault(account.id)}
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none border ${account.isDefault ? 'bg-green-500 border-green-600' : 'bg-gray-300 border-gray-400'}`}
            aria-pressed={account.isDefault}
            type="button"
            title={account.isDefault ? 'ডিফল্ট অ্যাকাউন্ট' : 'ডিফল্ট করুন'}
          >
            <span
              className={`absolute left-0 top-0 w-6 h-6 rounded-full bg-white shadow transition-transform duration-200 ${account.isDefault ? 'translate-x-6' : ''}`}
              style={{ transform: account.isDefault ? 'translateX(24px)' : 'translateX(0)' }}
            />
            <span className="sr-only">{account.isDefault ? 'ডিফল্ট অ্যাকাউন্ট' : 'ডিফল্ট করুন'}</span>
          </button>
        )}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onEdit(account)}
          className={`p-1.5 md:p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        >
          <Edit2 size={14} className={`md:w-4 md:h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowDeleteConfirm(account.id)}
          className={`p-1.5 md:p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
        >
          <Trash2 size={14} className="md:w-4 md:h-4 text-red-500" />
        </motion.button>
      </div>
    </div>
    <div className="flex flex-col items-center justify-center flex-1 text-center space-y-2 mt-6 mb-6">
      <p className={`text-sm md:text-base font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>বর্তমান ব্যালেন্স</p>
      <p className={`text-2xl md:text-3xl font-bold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{account.balance.toLocaleString()} ৳</p>
      {account.description && (
        <p className={`text-base md:text-lg ${darkMode ? 'text-gray-300' : 'text-gray-700'} line-clamp-2`}>{account.description}</p>
      )}
    </div>
  </motion.div>
);

export const AccountManager: React.FC = () => {
  const { accounts, deleteAccount, darkMode, transactions, updateAccount } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [showAccountTransactions, setShowAccountTransactions] = useState(false);
  const [toast, setToast] = useState<{ message: string; action?: () => void } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const undoTimeout = useRef<NodeJS.Timeout | null>(null);
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Remove defaultAccountId state and useEffect

  const handleSetDefault = async (id: string) => {
    for (const acc of accounts) {
      await updateAccount(acc.id, { isDefault: acc.id === id });
    }
  };

  const handleEdit = (account: any) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setPendingDelete(id);
    setToast({
      message: 'অ্যাকাউন্ট মুছে ফেলা হয়েছে',
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
    deleteAccount(id);
  };

  const handleUndo = () => {
    if (undoTimeout.current) clearTimeout(undoTimeout.current);
    setToast(null);
    setPendingDelete(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAccount(null);
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <Wallet size={24} className="text-green-600" />;
      case 'bank':
        return <Building2 size={24} className="text-blue-600" />;
      case 'mfs':
        return <Smartphone size={24} className="text-red-600" />;
      default:
        return <Wallet size={24} className="text-gray-600" />;
    }
  };

  const getAccountTypeName = (type: string) => {
    switch (type) {
      case 'cash':
        return 'নগদ টাকা';
      case 'bank':
        return 'ব্যাংক';
      case 'mfs':
        return 'MFS';
      default:
        return 'অজানা';
    }
  };

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  // Filtered transactions for statement
  const statementTransactions = transactions
    .filter(t => t.accountId === selectedAccount?.id)
    .filter(t => {
      if (filterType && t.type !== filterType) return false;
      if (filterCategory && t.category !== filterCategory) return false;
      if (filterStartDate && new Date(t.date) < new Date(filterStartDate)) return false;
      if (filterEndDate && new Date(t.date) > new Date(filterEndDate)) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Print statement transactions
  const handlePrint = () => {
    if (!selectedAccount) return;
    const appName = 'অর্থের হিসেব';
    const creatorName = 'by MK Bashar';
    const logoUrl = window.location.origin + '/logo.svg';
    const tableHeaders = ['তারিখ', 'সময়', 'ধরন', 'ক্যাটেগরি', 'আয়', 'খরচ', 'নোট'];
    // Helper to convert English digits to Bengali
    const toBengaliDigits = (str: string) => String(str).replace(/[0-9]/g, d => '০১২৩৪৫৬৭৮৯'[Number(d)]);
    // Helper to pad numbers to two digits
    const pad2 = (n: string | number) => n.toString().padStart(2, '0');
    // Helper to format date in Bengali with two digits for day and month
    const formatDateBengali = (dateObj: Date) => {
      const d = dateObj.getDate();
      const m = dateObj.getMonth() + 1;
      const y = dateObj.getFullYear();
      return `${toBengaliDigits(String(pad2(d)))}/${toBengaliDigits(String(pad2(m)))}/${toBengaliDigits(String(y))}`;
    };
    // Helper to format time in Bengali with two digits for hour and minute, AM/PM in English
    const formatTimeBengali = (time: string) => {
      if (!time) return '';
      const [h, m] = time.split(':');
      let hour = parseInt(h, 10);
      const minute = m;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12;
      if (hour === 0) hour = 12;
      return `${toBengaliDigits(String(pad2(hour)))}:${toBengaliDigits(String(pad2(minute)))} ${ampm}`;
    };
    let totalIncome = 0;
    let totalExpense = 0;
    const tableRows = statementTransactions.map(t => {
      let income = '';
      let expense = '';
      if (t.type === 'income') {
        income = `<span style='color:#00B44C;font-weight:600;font-size:1.1em;'>${t.amount.toLocaleString()} ৳</span>`;
        totalIncome += t.amount;
      } else if (t.type === 'expense') {
        expense = `<span style='color:#e53935;font-weight:600;font-size:1.1em;'>${t.amount.toLocaleString()} ৳</span>`;
        totalExpense += t.amount;
      }
      return [
        formatDateBengali(new Date(t.date)),
        formatTimeBengali(t.time),
        t.type === 'income' ? 'আয়' : 'খরচ',
        t.category,
        income,
        expense,
        t.note
      ];
    });
    let totalRow = `<tr>
      <td colspan='4' style='padding:10px 8px;border:1px solid #e5e7eb;font-weight:700;text-align:center;vertical-align:middle;background:#00B44C;color:#fff;font-size:1.05rem;'>মোট</td>
      <td style='padding:10px 8px;border:1px solid #e5e7eb;font-weight:700;text-align:center;vertical-align:middle;background:#00B44C;color:#fff;font-size:1.05rem;'>${toBengaliDigits(totalIncome.toLocaleString())} ৳</td>
      <td style='padding:10px 8px;border:1px solid #e5e7eb;font-weight:700;text-align:center;vertical-align:middle;background:#00B44C;color:#fff;font-size:1.05rem;'>${toBengaliDigits(totalExpense.toLocaleString())} ৳</td>
      <td style='padding:10px 8px;border:1px solid #e5e7eb;background:#00B44C;'></td>
    </tr>`;
    // Helper to format the printed date/time in Bengali with two digits for day, month, hour, minute, second
    const formatPrintedDateTime = (dateObj: Date) => {
      const d = dateObj.getDate();
      const m = dateObj.getMonth() + 1;
      const y = dateObj.getFullYear();
      const h = dateObj.getHours();
      const min = dateObj.getMinutes();
      const s = dateObj.getSeconds();
      const ampm = h >= 12 ? 'PM' : 'AM';
      let hour12 = h % 12;
      if (hour12 === 0) hour12 = 12;
      return `${toBengaliDigits(String(pad2(d)))}/${toBengaliDigits(String(pad2(m)))}/${toBengaliDigits(String(y))}, ${toBengaliDigits(String(pad2(hour12)))}:${toBengaliDigits(String(pad2(min)))}:${toBengaliDigits(String(pad2(s)))} ${ampm}`;
    };
    let html = `
      <div class=\"print-header\" style=\"text-align:center;margin-bottom:16px;position:relative;z-index:1;\">
        <img src=\"${logoUrl}\" alt=\"Logo\" style=\"width:64px;height:64px;object-fit:contain;margin-bottom:8px;display:block;margin-left:auto;margin-right:auto;\" />
        <div style=\"font-size:2rem;font-weight:bold;color:#00B44C;font-family:'Noto Serif Bengali',serif;margin-bottom:0px;\">${appName}</div>
        <div style=\"font-size:1.1rem;color:#666;margin-bottom:18px;font-family:'Noto Serif Bengali',serif;\">${creatorName}</div>
        <div style=\"font-size:1.5rem;font-weight:700;margin-top:18px;margin-bottom:8px;font-family:'Noto Serif Bengali',serif;\">অ্যাকাউন্ট স্টেটমেন্ট - ${selectedAccount.name}</div>
      </div>
      <table>
        <thead>
          <tr>
            ${tableHeaders.map(h => `<th>${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${tableRows.map(row => `<tr>${row.map((cell,i) => `<td>${cell || ''}</td>`).join('')}</tr>`).join('')}
          ${totalRow.replace('<tr>', '<tr class=\"total-row\">')}
        </tbody>
      </table>
      <div style=\"position:fixed;bottom:24px;right:32px;left:32px;text-align:right;font-size:0.95rem;color:#888;font-family:'Noto Serif Bengali',serif;z-index:100;\">মুদ্রিত: ${formatPrintedDateTime(new Date())}</div>
    `;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`<html><head><title>${appName} - অ্যাকাউন্ট স্টেটমেন্ট - ${selectedAccount?.name || ''}</title>`);
    printWindow.document.write('<meta charset="UTF-8">');
    printWindow.document.write('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
    printWindow.document.write('<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet">');
    printWindow.document.write('<style>body{font-family:\'Noto Serif Bengali\',serif;background:#fff;padding:32px;} .print-header{margin-bottom:24px;} table{box-shadow:0 2px 8px #0001;border-radius:12px;overflow:hidden;width:100%;border-collapse:separate;border-spacing:0;margin-top:18px;} th,td{transition:background 0.2s;text-align:center;vertical-align:middle;} th{background:#00B44C;color:#fff;letter-spacing:0.5px;font-size:1.08rem;font-weight:700;padding:12px 8px;border:1px solid #e5e7eb;} td{font-size:1rem;padding:10px 8px;border:1px solid #e5e7eb;} tr:nth-child(even):not(.total-row){background:#f3fef6;} .total-row td{font-size:1.05rem;font-weight:700;background:#00B44C;color:#fff;} @media print { body { background: #fff !important; } }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(html);
    printWindow.document.write('<script>setTimeout(function(){window.print();window.onafterprint=function(){window.close();};},300);</script>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
  };

  // Debounce for print
  let printTimeout: NodeJS.Timeout | null = null;
  const handlePrintDebounced = () => {
    if (printTimeout) return;
    handlePrint();
    printTimeout = setTimeout(() => { printTimeout = null; }, 1000);
  };

  // Utility to fetch image as base64
  const getBase64FromUrl = async (url: string) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  useEffect(() => {
    if (!showAccountTransactions) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowAccountTransactions(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showAccountTransactions]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} tracking-wide`}>
            অ্যাকাউন্টস
          </h1>
          <div className={`w-20 h-1 ${darkMode ? 'bg-green-500' : 'bg-green-600'} rounded-full mt-2`}></div>
        </div>
        <div className="flex space-x-2 md:space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowTransferForm(true)}
            className="bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg flex items-center space-x-1 md:space-x-2 hover:bg-blue-700 text-sm md:text-base"
          >
            <ArrowRightLeft size={16} className="md:w-5 md:h-5" />
            <span className="hidden md:inline">ট্রান্সফার</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(true)}
            className="bg-green-600 text-white px-3 md:px-4 py-2 rounded-lg flex items-center space-x-1 md:space-x-2 hover:bg-green-700 text-sm md:text-base"
          >
            <Plus size={16} className="md:w-5 md:h-5" />
            <span>নতুন</span>
          </motion.button>
        </div>
      </div>

      {/* Total Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex flex-col items-center justify-center rounded-full shadow-lg mx-auto my-6 w-64 h-64 ${darkMode ? 'bg-gray-900' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
      >
        <div className={`flex items-center justify-center w-20 h-20 rounded-full shadow mb-4 mt-6 ${darkMode ? 'bg-gray-800' : 'bg-green-50'}`}>
          <Wallet size={40} className="text-green-600" />
        </div>
        <h2 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>মোট ব্যালেন্স</h2>
        <p className={`text-3xl md:text-4xl font-extrabold mb-2 ${darkMode ? 'text-green-300' : 'text-green-700'}`}>{totalBalance.toLocaleString()} <span className="text-2xl">৳</span></p>
        <p className={`text-base font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{accounts.length}টি অ্যাকাউন্ট</p>
      </motion.div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {accounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            darkMode={darkMode}
            getAccountIcon={getAccountIcon}
            getAccountTypeName={getAccountTypeName}
            onEdit={handleEdit}
            onDelete={handleDelete}
            setShowDeleteConfirm={setShowDeleteConfirm}
            onClick={() => {
              setSelectedAccount(account);
              setShowAccountTransactions(true);
            }}
          />
        ))}

        {accounts.length === 0 && (
          <div className={`col-span-full ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6 md:p-8 text-center`}>
            <Wallet size={40} className={`md:w-12 md:h-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={`text-base md:text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>কোনো অ্যাকাউন্ট তৈরি করা হয়নি</p>
            <p className={`text-xs md:text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-2`}>আপনার প্রথম অ্যাকাউন্ট তৈরি করুন</p>
          </div>
        )}
      </div>

      {/* Account Form Modal */}
      {showForm && (
        <AccountForm
          account={editingAccount}
          onClose={handleCloseForm}
          onSubmit={handleCloseForm}
        />
      )}

      {/* Transfer Form Modal */}
      {showTransferForm && (
        <TransferForm
          onClose={() => setShowTransferForm(false)}
          onSubmit={() => setShowTransferForm(false)}
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
              অ্যাকাউন্ট মুছবেন?
            </h3>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
              এই অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলা হবে। এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
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

      {/* Account Transactions Modal */}
      {showAccountTransactions && selectedAccount && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedAccount.name} - স্টেটমেন্ট</h2>
              <button
                onClick={() => setShowAccountTransactions(false)}
                className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                ✕
              </button>
            </div>
            {/* Filters and Export */}
            <div className="flex flex-wrap gap-3 mb-4 items-end md:flex-nowrap">
              <div>
                <label className="block text-xs mb-1">ধরন</label>
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className={`px-4 py-2 rounded-lg border ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                >
                  <option value="">সব ধরনের</option>
                  <option value="income">আয়</option>
                  <option value="expense">খরচ</option>
                  <option value="transfer">ট্রান্সফার</option>
                </select>
              </div>
              <CategorySelect
                value={filterCategory}
                onChange={setFilterCategory}
                options={Array.from(new Set(transactions.map(t => t.category))).map(cat => ({ value: cat, label: cat }))}
                placeholder="সব"
                disabled={false}
              />
              <div>
                <label className="block text-xs mb-1">শুরুর তারিখ</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={e => setFilterStartDate(e.target.value)}
                  className={`px-4 py-2 rounded-lg border ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                />
              </div>
              <div>
                <label className="block text-xs mb-1">শেষর তারিখ</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={e => setFilterEndDate(e.target.value)}
                  className={`px-4 py-2 rounded-lg border ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-green-500 focus:border-transparent`}
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handlePrintDebounced}
                  className={`px-4 py-2 rounded-lg border ${
                    darkMode
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  প্রিন্ট / ডাউনলোড
                </button>
              </div>
            </div>

            {/* Transactions List */}
            <div className="mt-6 space-y-4">
              {statementTransactions.length === 0 && (
                <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>কোনো লেনদেন খুঁজে পাওয়া যায়নি</p>
              )}
              {statementTransactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  darkMode={darkMode}
                  onEdit={() => {
                    // This functionality is not yet implemented
                  }}
                  onDelete={() => {
                    // This functionality is not yet implemented
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <div
            className={`px-4 py-2 rounded-lg shadow-lg ${
              toast.action ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {toast.message}
            {toast.action && (
              <button onClick={toast.action} className="ml-2 text-white">
                পুনরায় করুন
              </button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AccountManager;
