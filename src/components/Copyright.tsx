import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import i18n from '../i18n';

const Copyright = ({ className = '', whiteText = false }: { className?: string, whiteText?: boolean }) => {
  const { direction, language } = useLanguage();
  
  return (
    <a
      href="https://packages.awisapp.com/"
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-center gap-2 text-center text-sm text-gray-400 hover:text-blue-500 transition-colors ${className}`}
    >
      {direction === 'rtl' ? (
        <>
          <span style={whiteText ? { color: '#fff' } : {}}>{language === 'ar' ? 'بدعم من' : i18n.t('supported_by')}</span>
          <img src="/awis.png" alt="awis logo" className="inline h-6 align-middle" style={{ display: 'inline' }} />
        </>
      ) : (
        <>
          <span style={whiteText ? { color: '#fff' } : {}}>{language === 'ar' ? 'بدعم من' : i18n.t('supported_by')}</span>
          <img src="/awis.png" alt="awis logo" className="inline h-6 align-middle" style={{ display: 'inline' }} />
        </>
      )}
    </a>
  );
};

export default Copyright; 