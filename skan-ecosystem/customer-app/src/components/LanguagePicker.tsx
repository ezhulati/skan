import React from 'react';
import { useLanguage, Language } from '../contexts/LanguageContext';

interface LanguagePickerProps {
  className?: string;
}

export function LanguagePicker({ className = '' }: LanguagePickerProps) {
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: 'sq' as Language, name: 'Shqip', flag: '🇦🇱' },
    { code: 'en' as Language, name: 'English', flag: '🇬🇧' }
  ];

  return (
    <div className={`relative ${className}`}>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        aria-label="Select language"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
      
      {/* Custom dropdown arrow */}
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

// Compact version for mobile/header use
export function CompactLanguagePicker({ className = '' }: LanguagePickerProps) {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'sq' ? 'en' : 'sq');
  };

  const currentLang = language === 'sq' ? { flag: '🇦🇱', code: 'SQ' } : { flag: '🇬🇧', code: 'EN' };

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center space-x-1 px-2 py-1 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 ${className}`}
      aria-label={`Switch to ${language === 'sq' ? 'English' : 'Albanian'}`}
    >
      <span className="text-base">{currentLang.flag}</span>
      <span className="text-xs font-bold">{currentLang.code}</span>
    </button>
  );
}