import { useColorScheme } from 'react-native';
import { darkTheme, lightTheme } from '../constants/theme';
import { translations } from '../constants/i18n';
import { useStore } from '../store/useStore';

export const useTheme = () => {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const themeSetting = useStore(s => s.settings.theme);

  let resolvedScheme;
  if (themeSetting === 'system') {
    resolvedScheme = systemScheme || 'dark';
  } else {
    resolvedScheme = themeSetting;
  }

  const theme = resolvedScheme === 'dark' ? darkTheme : lightTheme;
  return { theme, isDark: resolvedScheme === 'dark', scheme: resolvedScheme };
};

export const useI18n = () => {
  const language = useStore(s => s.settings.language);
  const t = translations[language] || translations.en;
  return { t, language };
};
