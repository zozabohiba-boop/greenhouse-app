import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

// طلب تخزين دائم حتى لا يمسح المتصفح بيانات الصوبة عند امتلاء الذاكرة
if (navigator.storage?.persist) void navigator.storage.persist();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
