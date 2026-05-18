import { useDashboard } from '../context/DashboardContext';
import { translations } from '../utils/translations';

export function useTranslation() {
  const { sysConfig, setSysConfig } = useDashboard();
  const lang = sysConfig?.language || 'fr';
  const isDark = sysConfig?.theme === 'dark';
  const isRtl = lang === 'ar';

  const t = (key, defaultText = '') => {
    const keys = key.split('.');
    let val = translations[lang];
    for (const k of keys) {
      if (val && val[k] !== undefined) {
        val = val[k];
      } else {
        return defaultText || key;
      }
    }
    return typeof val === 'string' ? val : (defaultText || key);
  };

  return { t, lang, isRtl, isDark, setSysConfig, sysConfig };
}
