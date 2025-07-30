import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { testUserServiceInsert } from './debug/testUserService';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// デバッグ用: グローバルでテスト関数を利用可能にする
if (import.meta.env.DEV) {
  (window as any).testUserService = testUserServiceInsert;
}
