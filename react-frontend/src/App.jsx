import React from 'react';
import LoginPage from './components/LoginPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import DashboardPage from './components/DashboardPage';

function App() {
  const path = window.location.pathname;

  if (path === '/reset-password') {
    return <ResetPasswordPage />;
  }

  if (path === '/dashboard') {
    return <DashboardPage />;
  }

  return <LoginPage />;
}

export default App;
