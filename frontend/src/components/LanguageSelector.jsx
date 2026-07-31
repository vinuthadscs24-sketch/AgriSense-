// src/components/LanguageSelector.jsx
import React from 'react';
import { useLanguage, LANGUAGES } from '../context/LanguageContext';

export const LanguageSelector = () => {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-slate-900 border-b border-slate-800">
      <span className="text-slate-400 font-medium my-auto mr-2">🌐 Language / भाषा:</span>
      {LANGUAGES.map((item) => (
        <button
          key={item.code}
          onClick={() => setLang(item.code)}
          className={`px-3 py-1 rounded-lg text-sm transition-all ${
            lang === item.code
              ? 'bg-emerald-600 text-white font-semibold shadow-md'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};