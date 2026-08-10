import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function LoadingView(): React.JSX.Element {
  return (
    <main className="loading" aria-live="polite">
      <h1>Markdown Grid Editor</h1>
      <p>Loading table…</p>
    </main>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<LoadingView />);
}
