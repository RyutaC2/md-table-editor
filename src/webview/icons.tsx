import React from 'react';

// These paths are based on Google Material Symbols icons.
// Material Symbols are available under the Apache License 2.0.
type IconName =
  | 'add'
  | 'addColumn'
  | 'addRow'
  | 'align'
  | 'autoFit'
  | 'delete'
  | 'more'
  | 'redo'
  | 'removeColumn'
  | 'removeRow'
  | 'undo';

const paths: Record<IconName, string[]> = {
  add: ['M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z'],
  addColumn: ['M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z', 'M3 3h2v18H3z'],
  addRow: ['M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z', 'M3 3h18v2H3z'],
  align: ['M3 5h18v2H3V5zm4 4h10v2H7V9zm-4 4h18v2H3v-2zm4 4h10v2H7v-2z'],
  autoFit: ['M4 4h16v16H4V4zm2 2v12h12V6H6zm2 3h8v2H8V9zm0 4h5v2H8v-2z'],
  delete: ['M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5-1-1h-5l-1 1H5v2h14V4z'],
  more: ['M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z'],
  redo: ['M18.4 10.6C16.55 8.15 13.8 7 11 7c-3.87 0-7.16 2.48-8.39 5.94L4.5 13.6C5.41 10.94 7.93 9 11 9c2.16 0 4.27.87 5.69 2.4L13 15h7V8l-1.6 2.6z'],
  removeColumn: ['M19 13H5v-2h14v2z', 'M3 3h2v18H3z'],
  removeRow: ['M19 13H5v-2h14v2z', 'M3 3h18v2H3z'],
  undo: ['M7.5 8H17c2.76 0 5 2.24 5 5s-2.24 5-5 5h-1v-2h1c1.66 0 3-1.34 3-3s-1.34-3-3-3H7.5v3L3 8l4.5-5v3z'],
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
