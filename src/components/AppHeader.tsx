import type { Translation } from '../i18n';
import type { Language } from '../types';

interface AppHeaderProps {
  language: Language;
  onLanguageChange: (language: Language) => void;
  t: Translation;
}

export function AppHeader({ language, onLanguageChange, t }: AppHeaderProps) {
  return (
    <header className="topbar">
      <div className="topbar-copy">
        <h1>{t.appTitle}</h1>
      </div>
      <div className="language-switch" aria-label="Interface language">
        {(['uk', 'en'] as const).map((option) => (
          <button
            className={language === option ? 'is-active' : ''}
            key={option}
            onClick={() => onLanguageChange(option)}
            type="button"
          >
            {option.toUpperCase()}
          </button>
        ))}
      </div>
    </header>
  );
}
