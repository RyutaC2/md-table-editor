import React from 'react';

// These icons use Material Symbols' visual language and are distributed with
// the extension as local SVG so the Webview remains offline-compatible.
type IconName =
  | 'add_column_left'
  | 'add_column_right'
  | 'add_row_above'
  | 'add_row_below'
  | 'alignCenter'
  | 'alignLeft'
  | 'alignNone'
  | 'alignRight'
  | 'autoFit'
  | 'check'
  | 'content_copy'
  | 'content_cut'
  | 'delete'
  | 'redo'
  | 'sortAscending'
  | 'sortDescending'
  | 'table_rows'
  | 'undo'
  | 'view_column';

const paths: Record<IconName, string[]> = {
  add_column_left: ['M9 3h12v18H9V3zm6 2h-4v14h4V5zm4 0h-2v14h2V5zM4 11V8h2v3h3v2H6v3H4v-3H1v-2h3z'],
  add_column_right: ['M3 3h12v18H3V3zm6 2H5v14h4V5zm4 0h-2v14h2V5zm6 6V8h2v3h3v2h-3v3h-2v-3h-3v-2h3z'],
  add_row_above: ['M3 9h18v12H3V9zm2 6v4h14v-4H5zm0-4v2h14v-2H5zm6-7V1h2v3h3v2h-3v3h-2V6H8V4h3z'],
  add_row_below: ['M3 3h18v12H3V3zm2 6v4h14V9H5zm0-4v2h14V5H5zm6 14v-3h2v3h3v2h-3v3h-2v-3H8v-2h3z'],
  alignCenter: ['M5 5h14v2H5V5zm3 4h8v2H8V9zm-3 4h14v2H5v-2zm3 4h8v2H8v-2z'],
  alignLeft: ['M4 5h16v2H4V5zm0 4h10v2H4V9zm0 4h16v2H4v-2zm0 4h10v2H4v-2z'],
  alignNone: ['M4 5h16v2H4V5zm3 4h10v2H7V9zm-3 4h16v2H4v-2zm3 4h10v2H7v-2z'],
  alignRight: ['M4 5h16v2H4V5zm6 4h10v2H10V9zm-6 4h16v2H4v-2zm6 4h10v2H10v-2z'],
  autoFit: ['M3 5h2v14H3V5zm16 0h2v14h-2V5zM7 11h10v2H7v-2zm0 1 3-3v6l-3-3zm10 0-3 3V9l3 3z'],
  check: ['M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z'],
  content_copy: ['M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z'],
  content_cut: ['M9.64 7.64A4 4 0 1 0 6 10a3.96 3.96 0 0 0 2.4-.8L12 12.8l-3.6 3.6A4 4 0 1 0 10 19.6l3.4-3.4L19 21h3L10.6 9.6l-.96-1.96zM6 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm8.8-8.8-1.4-1.4L19 3h3l-7.2 10.2z'],
  delete: ['M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5-1-1h-5l-1 1H5v2h14V4h-3.5z'],
  redo: ['M18.4 10.6C16.55 8.15 13.8 7 11 7c-3.87 0-7.16 2.48-8.39 5.94L4.5 13.6C5.41 10.94 7.93 9 11 9c2.16 0 4.27.87 5.69 2.4L13 15h7V8l-1.6 2.6z'],
  sortAscending: ['M6 19V7.8L3.4 10.4 2 9l5-5 5 5-1.4 1.4L8 7.8V19H6zm7-2h8v2h-8v-2zm0-6h6v2h-6v-2zm0-6h4v2h-4V5z'],
  sortDescending: ['M6 5v11.2l-2.6-2.6L2 15l5 5 5-5-1.4-1.4L8 16.2V5H6zm7 0h8v2h-8V5zm0 6h6v2h-6v-2zm0 6h4v2h-4v-2z'],
  table_rows: ['M3 5h18v4H3V5zm0 5h18v4H3v-4zm0 5h18v4H3v-4z'],
  undo: ['M7.5 8H17c2.76 0 5 2.24 5 5s-2.24 5-5 5h-1v-2h1c1.66 0 3-1.34 3-3s-1.34-3-3-3H7.5v3L3 8l4.5-5v3z'],
  view_column: ['M3 5h18v14H3V5zm2 2v10h4V7H5zm6 0v10h4V7h-4zm6 0v10h2V7h-2z'],
};

export function Icon({ name, size = 18 }: { name: IconName; size?: number }): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      className="icon"
      focusable="false"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      {paths[name].map((path) => <path key={path} d={path} fill="currentColor" />)}
    </svg>
  );
}

export type { IconName };
