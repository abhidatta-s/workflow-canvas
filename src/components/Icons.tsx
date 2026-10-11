import type { NodeType } from '../types';

const common = {
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export function NodeIcon({ type }: { type: NodeType }) {
  switch (type) {
    case 'trigger':
      return (
        <svg {...common}>
          <path d="M9 1.5 3.5 9H8l-1 5.5L12.5 7H8z" />
        </svg>
      );
    case 'condition':
      return (
        <svg {...common}>
          <path d="M8 1.5 14.5 8 8 14.5 1.5 8z" />
        </svg>
      );
    case 'action':
      return (
        <svg {...common}>
          <path d="M4 3l8 5-8 5z" />
        </svg>
      );
    case 'delay':
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="6" />
          <path d="M8 4.5V8l2.5 1.5" />
        </svg>
      );
  }
}

export function TrashIcon() {
  return (
    <svg {...common}>
      <path d="M2.5 4h11M6 4V2.5h4V4M4 4l.7 9h6.6L12 4M6.5 6.5v4M9.5 6.5v4" />
    </svg>
  );
}

export function CopyIcon() {
  return (
    <svg {...common}>
      <rect x="5" y="5" width="8.5" height="8.5" rx="1.5" />
      <path d="M10.5 5V3.5a1 1 0 0 0-1-1h-6a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1H5" />
    </svg>
  );
}

export function LogoMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#171b26" stroke="#2a3040" />
      <path d="M9 11h6a4 4 0 0 1 4 4v2a4 4 0 0 0 4 4" fill="none" stroke="#7c8cff" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="9" cy="11" r="3" fill="#34d399" />
      <circle cx="23" cy="21" r="3" fill="#60a5fa" />
    </svg>
  );
}
