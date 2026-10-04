const wrap = (d) =>
  `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;

export const ICON = {
  labels: wrap('<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.2"/>'),
  reset: wrap('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>'),
  fullscreen: wrap('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
  exitFullscreen: wrap('<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>'),
  credits: wrap('<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="7.8" r=".6" fill="currentColor"/>'),
  panel: wrap('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16"/>'),
  prev: wrap('<path d="M15 5 8 12l7 7"/>'),
  next: wrap('<path d="m9 5 7 7-7 7"/>'),
  pause: wrap('<path d="M8 5v14M16 5v14"/>'),
  play: wrap('<path d="M7 4.5v15l12-7.5z" fill="currentColor"/>'),
  close: wrap('<path d="M6 6l12 12M18 6 6 18"/>'),
  chevron: wrap('<path d="m6 15 6-6 6 6"/>'),
};
