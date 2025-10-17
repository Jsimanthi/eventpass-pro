import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme, actualTheme } = useTheme();

  const themes = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ];

  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
      {themes.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`btn btn-ghost btn-sm ${
            theme === value ? 'btn-primary' : ''
          }`}
          title={`Switch to ${label} theme`}
          aria-label={`Switch to ${label} theme`}
          aria-pressed={theme === value}
        >
          <Icon size={16} />
          <span style={{ marginLeft: 'var(--space-1)' }}>{label}</span>
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle;