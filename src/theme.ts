import { useSyncExternalStore } from 'react';
/** Light/dark chrome theme, shared with the portfolio: dark by default, saved in localStorage,
 *  ?theme=light|dark overrides (applied before paint by the inline script in index.html). */
export type Theme = 'dark' | 'light';
const KEY = 'pf-theme';
const root = () => document.documentElement;
export const getTheme = (): Theme => (root().dataset.theme === 'light' ? 'light' : 'dark');
const subscribe = (f: () => void) => {
  const mo = new MutationObserver(f);
  mo.observe(root(), { attributes: true, attributeFilter: ['data-theme'] });
  return () => mo.disconnect();
};
export const useTheme = () => useSyncExternalStore(subscribe, getTheme, () => 'dark' as Theme);
export function setTheme(t: Theme) {
  try { localStorage.setItem(KEY, t); } catch { /* private mode */ }
  const apply = () => {
    root().dataset.theme = t;
    document.querySelector('meta[name=theme-color]')?.setAttribute('content', t === 'light' ? '#e9edf2' : '#08090c');
  };
  const d = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && d.startViewTransition) d.startViewTransition(apply);
  else apply();
}
