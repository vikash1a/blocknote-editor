declare let __webpack_public_path__: string;
if (typeof (window as any).__webpack_public_path__ === 'string') {
  __webpack_public_path__ = (window as any).__webpack_public_path__;
}

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
