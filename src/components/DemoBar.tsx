/** Shared demo header: links back to the portfolio. Same markup in every demo app. */
import ThemeToggle from './ThemeToggle';
const PORTFOLIO = 'https://www.abhidattasrichandan.com';

export default function DemoBar({ name, app = false }: { name: string; app?: boolean }) {
  return (
    <>
      <a className="ds-skip" href="#main">Skip to content</a>
      <div className="ds-texture" aria-hidden="true" />
      <header className={app ? 'ds-bar ds-bar--app' : 'ds-bar'}>
        <a className="ds-bar__home" href={PORTFOLIO + '/lab'}>
          <span className="ds-bar__arrow" aria-hidden="true">←</span>
          <span className="ds-bar__logo">abhidatta<span>.</span></span>
          <span className="ds-bar__sep" aria-hidden="true">/</span>
          <span className="ds-bar__lab">Lab</span>
        </a>
        <span className="ds-bar__name" aria-current="page">{name}</span>
        <a className="ds-bar__cta" href={PORTFOLIO}>View portfolio</a>
        <ThemeToggle />
      </header>
    </>
  );
}
