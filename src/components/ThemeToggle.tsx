import { setTheme, useTheme } from '../theme';
/** Icon-only light/dark switch (matches the portfolio nav toggle). Shows the theme you'd switch to. */
export default function ThemeToggle() {
  const t = useTheme(), next = t === 'dark' ? 'light' : 'dark';
  return (
    <button type="button" className="ds-bar__theme" onClick={() => setTheme(next)} aria-label={`Switch to ${next} theme`} title={`Switch to ${next} theme`} data-testid="theme-toggle">
      {next === 'light'
        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>}
    </button>
  );
}
