import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/pages.css';
import App from './App';
import { AuthProvider } from './context/Auth';
import { PrefsProvider } from './context/Prefs';
import { ToastProvider } from './context/Toast';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PrefsProvider><ToastProvider><AuthProvider><BrowserRouter><App /></BrowserRouter></AuthProvider></ToastProvider></PrefsProvider>
  </React.StrictMode>
);
