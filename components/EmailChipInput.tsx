
import React, { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface EmailChipInputProps {
  emails: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

const EmailChipInput: React.FC<EmailChipInputProps> = ({ emails, onChange, placeholder, disabled }) => {
  const [inputValue, setInputValue] = useState('');

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const addEmail = (val: string) => {
    const newEmails = val.split(/[,\s]+/)
      .map(e => e.trim())
      .filter(e => e && validateEmail(e) && !emails.includes(e));
    
    if (newEmails.length > 0) {
      onChange([...emails, ...newEmails]);
    }
    setInputValue('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', ',', ' '].includes(e.key)) {
      e.preventDefault();
      addEmail(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && emails.length > 0) {
      removeEmail(emails.length - 1);
    }
  };

  const removeEmail = (index: number) => {
    onChange(emails.filter((_, i) => i !== index));
  };

  return (
    <div className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl p-2 flex flex-wrap gap-2 transition-all min-h-[56px] ${disabled ? 'opacity-30 pointer-events-none' : 'focus-within:border-primary-600 focus-within:ring-2 focus-within:ring-primary-600/20 shadow-inner'}`}>
      {emails.map((email, idx) => (
        <div key={idx} className="bg-primary-600/10 border border-primary-500/30 text-primary-500 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl flex items-center gap-2 max-w-full min-w-0">
          <span className="truncate flex-1 min-w-0" title={email}>{email}</span>
          <button type="button" onClick={() => removeEmail(idx)} className="hover:text-slate-900 dark:text-white shrink-0"><X size={12} /></button>
        </div>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => addEmail(inputValue)}
        placeholder={emails.length === 0 ? placeholder : ''}
        className="flex-1 bg-transparent border-none outline-none text-xs font-bold text-slate-900 dark:text-white p-2 min-w-[120px] placeholder:text-slate-800"
      />
    </div>
  );
};

export default EmailChipInput;
