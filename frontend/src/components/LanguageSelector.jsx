import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export function LanguageSelector() {
  const { i18n, t } = useTranslation();

  const languages = [
    { code: 'ko', label: t('language.ko') },
    { code: 'en', label: t('language.en') },
    { code: 'ja', label: t('language.ja') },
    { code: 'zh', label: t('language.zh') },
  ];

  const handleChange = useCallback(async (e) => {
    const newLang = e.target.value;
    await i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
    document.documentElement.lang = newLang;
  }, [i18n]);

  return (
    <select
      value={i18n.resolvedLanguage || i18n.language}
      onChange={handleChange}
      className="text-xs px-2 py-1.5 border border-border-gray dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-text-primary dark:text-white focus:outline-none focus:border-primary"
      aria-label={t('language.select')}
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code} className="bg-white dark:bg-gray-700">
          {lang.label}
        </option>
      ))}
    </select>
  );
}
